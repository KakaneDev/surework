package com.surework.reporting.config;

import com.surework.common.security.JwtTokenProvider;
import com.surework.common.security.TenantContext;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Authentication filter that reads user claims from:
 * 1. Headers forwarded by the API Gateway (X-User-* headers)
 * 2. JWT Bearer token in Authorization header (for direct service access)
 */
@Component
@Slf4j
public class JwtHeaderAuthenticationFilter extends OncePerRequestFilter {

    private static final String HEADER_USER_ID = "X-User-Id";
    private static final String HEADER_TENANT_ID = "X-User-Tenant";
    private static final String HEADER_ROLES = "X-User-Roles";
    private static final String HEADER_USERNAME = "X-User-Username";
    private static final String HEADER_AUTHORIZATION = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    @Value("${surework.admin.jwt.secret:surework-jwt-secret-key-for-development-only-change-in-production}")
    private String jwtSecret;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        try {
            String userId = request.getHeader(HEADER_USER_ID);
            String tenantId = request.getHeader(HEADER_TENANT_ID);
            String rolesHeader = request.getHeader(HEADER_ROLES);
            String username = request.getHeader(HEADER_USERNAME);
            Claims claims = null;

            // If no header auth, try JWT Bearer token
            if (!StringUtils.hasText(userId)) {
                String authHeader = request.getHeader(HEADER_AUTHORIZATION);
                if (StringUtils.hasText(authHeader) && authHeader.startsWith(BEARER_PREFIX)) {
                    String token = authHeader.substring(BEARER_PREFIX.length());
                    try {
                        claims = parseJwtToken(token);
                        userId = claims.getSubject();
                        tenantId = claims.get("tenantId", String.class);
                        username = claims.get("username", String.class);

                        @SuppressWarnings("unchecked")
                        List<String> rolesList = claims.get("roles", List.class);
                        if (rolesList != null) {
                            rolesHeader = String.join(",", rolesList);
                        }
                        log.debug("Authenticated from JWT token: userId={}", userId);
                    } catch (Exception e) {
                        log.warn("Failed to parse JWT token: {}", e.getMessage());
                    }
                }
            }

            if (StringUtils.hasText(userId)) {
                Set<String> roles = parseRoles(rolesHeader);

                List<GrantedAuthority> authorities = roles.stream()
                        .flatMap(role -> {
                            List<GrantedAuthority> auths = new ArrayList<>();
                            if (!role.startsWith("ROLE_")) {
                                auths.add(new SimpleGrantedAuthority("ROLE_" + role));
                            }
                            auths.add(new SimpleGrantedAuthority(role));
                            return auths.stream();
                        })
                        .collect(Collectors.toList());

                UserPrincipal principal = new UserPrincipal(
                        UUID.fromString(userId),
                        tenantId != null ? UUID.fromString(tenantId) : null,
                        username,
                        roles
                );

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(principal, null, authorities);

                SecurityContextHolder.getContext().setAuthentication(authentication);

                if (tenantId != null) {
                    TenantContext.setTenantId(UUID.fromString(tenantId));
                }

                // Populate onboarding completion flags from JWT claims
                if (claims != null) {
                    TenantContext.setCompanyDetailsComplete(
                            JwtTokenProvider.isCompanyDetailsComplete(claims));
                    TenantContext.setComplianceDetailsComplete(
                            JwtTokenProvider.isComplianceDetailsComplete(claims));
                }

                log.debug("Authenticated user {} with roles: {}", userId, roles);
            }

            filterChain.doFilter(request, response);
        } finally {
            SecurityContextHolder.clearContext();
            TenantContext.clear();
        }
    }

    private Claims parseJwtToken(String token) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private Set<String> parseRoles(String rolesHeader) {
        if (!StringUtils.hasText(rolesHeader)) {
            return Collections.emptySet();
        }
        return Arrays.stream(rolesHeader.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .collect(Collectors.toSet());
    }

    public record UserPrincipal(
            UUID userId,
            UUID tenantId,
            String username,
            Set<String> roles
    ) {
        public boolean hasRole(String role) {
            return roles.contains(role);
        }

        public boolean hasAnyRole(String... checkRoles) {
            for (String role : checkRoles) {
                if (roles.contains(role)) {
                    return true;
                }
            }
            return false;
        }
    }
}
