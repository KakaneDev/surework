package com.surework.gateway.filter;

import com.surework.gateway.config.SureworkGatewayProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Global JWT authentication filter for the API Gateway.
 * Validates JWT tokens for protected routes and forwards user claims to downstream services.
 */
@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final SureworkGatewayProperties gatewayProperties;
    private final AntPathMatcher pathMatcher;

    public JwtAuthenticationFilter(SureworkGatewayProperties gatewayProperties) {
        this.gatewayProperties = gatewayProperties;
        this.pathMatcher = new AntPathMatcher();
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().value();

        // Skip CORS preflight requests
        if (request.getMethod() == org.springframework.http.HttpMethod.OPTIONS) {
            log.debug("Skipping JWT auth for CORS preflight request: {}", path);
            return chain.filter(exchange);
        }

        // Check if path is public (no auth required)
        if (isPublicPath(path)) {
            log.debug("Public path accessed: {}", path);
            return chain.filter(exchange);
        }

        // Get Authorization header
        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (!StringUtils.hasText(authHeader)) {
            log.warn("No Authorization header found for protected path: {}", path);
            return onError(exchange, "Missing Authorization header", HttpStatus.UNAUTHORIZED);
        }

        String prefix = gatewayProperties.getJwt().getPrefix();
        if (!authHeader.startsWith(prefix + " ")) {
            log.warn("Invalid Authorization header format for path: {}", path);
            return onError(exchange, "Invalid Authorization header format", HttpStatus.UNAUTHORIZED);
        }

        String token = authHeader.substring(prefix.length() + 1);

        try {
            Claims claims = validateToken(token);

            // Forward user information to downstream services
            ServerHttpRequest modifiedRequest = request.mutate()
                    .header("X-User-Id", claims.getSubject())
                    .header("X-User-Tenant", claims.get("tenantId", String.class))
                    .header("X-User-Roles", String.join(",", getRoles(claims)))
                    .header("X-User-Username", claims.get("username", String.class))
                    .build();

            log.debug("JWT validated for user: {} on path: {}", claims.getSubject(), path);

            return chain.filter(exchange.mutate().request(modifiedRequest).build());

        } catch (ExpiredJwtException e) {
            log.warn("Expired JWT token for path: {}", path);
            return onError(exchange, "Token has expired", HttpStatus.UNAUTHORIZED);
        } catch (MalformedJwtException e) {
            log.warn("Malformed JWT token for path: {}", path);
            return onError(exchange, "Invalid token format", HttpStatus.UNAUTHORIZED);
        } catch (SignatureException e) {
            log.warn("Invalid JWT signature for path: {}", path);
            return onError(exchange, "Invalid token signature", HttpStatus.UNAUTHORIZED);
        } catch (Exception e) {
            log.error("JWT validation error for path: {}", path, e);
            return onError(exchange, "Authentication failed", HttpStatus.UNAUTHORIZED);
        }
    }

    private boolean isPublicPath(String path) {
        return gatewayProperties.getPublicPaths().stream()
                .anyMatch(pattern -> pathMatcher.match(pattern, path));
    }

    private Claims validateToken(String token) {
        SecretKey key = Keys.hmacShaKeyFor(
                gatewayProperties.getJwt().getSecret().getBytes(StandardCharsets.UTF_8)
        );

        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    @SuppressWarnings("unchecked")
    private List<String> getRoles(Claims claims) {
        Object rolesObj = claims.get("roles");
        if (rolesObj instanceof List) {
            return (List<String>) rolesObj;
        }
        return List.of();
    }

    private Mono<Void> onError(ServerWebExchange exchange, String message, HttpStatus status) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().add(HttpHeaders.CONTENT_TYPE, "application/json");

        String body = String.format("{\"error\":\"%s\",\"status\":%d}", message, status.value());
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);

        return response.writeWith(Mono.just(response.bufferFactory().wrap(bytes)));
    }

    @Override
    public int getOrder() {
        return -100; // Execute early in the filter chain
    }
}
