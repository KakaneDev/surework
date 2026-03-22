package com.surework.notification.config;

import com.surework.notification.config.JwtHeaderAuthenticationFilter.UserPrincipal;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

/**
 * WebSocket security configuration for authenticating STOMP connections.
 * Extracts JWT token from connection headers and sets up user principal.
 */
@Configuration
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
@Slf4j
public class WebSocketSecurityConfig implements WebSocketMessageBrokerConfigurer {

    private final String jwtSecret;

    /**
     * Constructor injection to get JWT secret from JwtHeaderAuthenticationFilter.
     * This ensures the secret validation happens once and is shared.
     */
    public WebSocketSecurityConfig(
            @Value("${surework.admin.jwt.secret:surework-jwt-secret-key-for-development-only-change-in-production}")
            String jwtSecret) {
        this.jwtSecret = jwtSecret;
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    // Try to get token from Authorization header
                    String token = accessor.getFirstNativeHeader("Authorization");
                    if (StringUtils.hasText(token) && token.startsWith("Bearer ")) {
                        token = token.substring(7);
                    } else {
                        // Try custom header
                        token = accessor.getFirstNativeHeader("X-Auth-Token");
                    }

                    // Also check for X-User-Id header (from API Gateway/proxy)
                    String userIdHeader = accessor.getFirstNativeHeader("X-User-Id");

                    if (StringUtils.hasText(token)) {
                        try {
                            UserPrincipal principal = parseToken(token);
                            if (principal != null) {
                                List<GrantedAuthority> authorities = principal.roles().stream()
                                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                                        .collect(Collectors.toList());

                                // UserPrincipal implements Principal, so getName() returns userId.toString()
                                // This ensures convertAndSendToUser() can route messages correctly
                                UsernamePasswordAuthenticationToken auth =
                                        new UsernamePasswordAuthenticationToken(principal, null, authorities);
                                accessor.setUser(auth);

                                log.info("WebSocket authenticated user via JWT: {} (name={})",
                                        principal.userId(), principal.getName());
                            }
                        } catch (Exception e) {
                            log.warn("Failed to authenticate WebSocket connection: {}", e.getMessage());
                        }
                    } else if (StringUtils.hasText(userIdHeader)) {
                        // Fallback to X-User-Id header for development/proxy scenarios
                        try {
                            String rolesHeader = accessor.getFirstNativeHeader("X-User-Roles");
                            Set<String> roles = parseRoles(rolesHeader);

                            UserPrincipal principal = new UserPrincipal(
                                    UUID.fromString(userIdHeader),
                                    null,
                                    accessor.getFirstNativeHeader("X-User-Username"),
                                    roles,
                                    null
                            );

                            List<GrantedAuthority> authorities = roles.stream()
                                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                                    .collect(Collectors.toList());

                            UsernamePasswordAuthenticationToken auth =
                                    new UsernamePasswordAuthenticationToken(principal, null, authorities);
                            accessor.setUser(auth);

                            log.info("WebSocket authenticated user via X-User-Id header: {} (name={})",
                                    principal.userId(), principal.getName());
                        } catch (Exception e) {
                            log.warn("Failed to parse X-User-Id header: {}", e.getMessage());
                        }
                    } else {
                        // Reject unauthenticated WebSocket connections
                        log.warn("WebSocket connection rejected - no authentication token provided");
                        throw new MessageDeliveryException("Authentication required for WebSocket connection. " +
                                "Provide JWT token in Authorization header or X-User-Id header.");
                    }
                }

                return message;
            }
        });
    }

    private UserPrincipal parseToken(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String userId = claims.getSubject();
            String tenantId = claims.get("tenantId", String.class);
            String username = claims.get("username", String.class);
            String employeeId = claims.get("employeeId", String.class);

            @SuppressWarnings("unchecked")
            List<String> rolesList = claims.get("roles", List.class);
            Set<String> roles = rolesList != null ? new HashSet<>(rolesList) : Collections.emptySet();

            return new UserPrincipal(
                    UUID.fromString(userId),
                    tenantId != null ? UUID.fromString(tenantId) : null,
                    username,
                    roles,
                    StringUtils.hasText(employeeId) ? UUID.fromString(employeeId) : null
            );
        } catch (Exception e) {
            log.warn("Failed to parse JWT token: {}", e.getMessage());
            return null;
        }
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
}
