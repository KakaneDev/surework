package com.surework.notification.config;

import com.surework.common.security.TenantContext;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
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
    private static final String INSECURE_DEFAULT_SECRET = "surework-jwt-secret-key-for-development-only-change-in-production";
    private static final int MIN_SECRET_LENGTH = 32;

    private final Environment environment;

    @Value("${surework.admin.jwt.secret:}")
    private String jwtSecret;

    public JwtHeaderAuthenticationFilter(Environment environment) {
        this.environment = environment;
    }

    /**
     * Validates JWT secret configuration at startup.
     * Ensures production environments don't use insecure default secrets.
     */
    @PostConstruct
    public void validateJwtSecret() {
        boolean isDevProfile = isDevOrTestProfile();

        if (!isDevProfile) {
            // Production validation - require proper secret
            if (jwtSecret == null || jwtSecret.isBlank()) {
                throw new IllegalStateException(
                        "JWT secret is not configured. Set the JWT_SECRET environment variable.");
            }
            if (jwtSecret.equals(INSECURE_DEFAULT_SECRET)) {
                throw new IllegalStateException(
                        "Cannot use default development JWT secret in production. " +
                        "Set a secure JWT_SECRET environment variable.");
            }
            if (jwtSecret.length() < MIN_SECRET_LENGTH) {
                throw new IllegalStateException(
                        "JWT secret must be at least " + MIN_SECRET_LENGTH + " characters long for security.");
            }
            log.info("JWT secret validation passed for production environment");
        } else {
            // Development/test - allow fallback but warn
            if (jwtSecret == null || jwtSecret.isBlank()) {
                jwtSecret = INSECURE_DEFAULT_SECRET;
                log.warn("Using default development JWT secret. This is insecure and should not be used in production.");
            }
        }
    }

    private boolean isDevOrTestProfile() {
        String[] activeProfiles = environment.getActiveProfiles();
        for (String profile : activeProfiles) {
            if ("dev".equalsIgnoreCase(profile) ||
                "test".equalsIgnoreCase(profile) ||
                "local".equalsIgnoreCase(profile)) {
                return true;
            }
        }
        // If no profiles active, assume development
        return activeProfiles.length == 0;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        try {
            // Try header-based auth first (from API Gateway)
            String userId = request.getHeader(HEADER_USER_ID);
            String tenantId = request.getHeader(HEADER_TENANT_ID);
            String rolesHeader = request.getHeader(HEADER_ROLES);
            String username = request.getHeader(HEADER_USERNAME);
            String employeeId = null;

            // If no header auth, try JWT Bearer token
            if (!StringUtils.hasText(userId)) {
                String authHeader = request.getHeader(HEADER_AUTHORIZATION);
                if (StringUtils.hasText(authHeader) && authHeader.startsWith(BEARER_PREFIX)) {
                    String token = authHeader.substring(BEARER_PREFIX.length());
                    try {
                        Claims claims = parseJwtToken(token);
                        userId = claims.getSubject();
                        tenantId = claims.get("tenantId", String.class);
                        username = claims.get("username", String.class);
                        employeeId = claims.get("employeeId", String.class);

                        @SuppressWarnings("unchecked")
                        List<String> rolesList = claims.get("roles", List.class);
                        if (rolesList != null) {
                            rolesHeader = String.join(",", rolesList);
                        }
                        log.debug("Authenticated from JWT token: userId={}, employeeId={}", userId, employeeId);
                    } catch (Exception e) {
                        log.warn("Failed to parse JWT token: {}", e.getMessage());
                    }
                }
            }

            if (StringUtils.hasText(userId)) {
                // Parse roles from header
                Set<String> roles = parseRoles(rolesHeader);

                // Create authorities from roles
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

                // Create authentication token with user principal
                UserPrincipal principal = new UserPrincipal(
                        UUID.fromString(userId),
                        tenantId != null ? UUID.fromString(tenantId) : null,
                        username,
                        roles,
                        StringUtils.hasText(employeeId) ? UUID.fromString(employeeId) : null
                );

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(principal, null, authorities);

                SecurityContextHolder.getContext().setAuthentication(authentication);

                // Set tenant context for multi-tenancy
                if (tenantId != null) {
                    TenantContext.setTenantId(UUID.fromString(tenantId));
                }

                log.debug("Authenticated user {} with roles: {}", userId, roles);
            }

            filterChain.doFilter(request, response);
        } finally {
            // Clear contexts after request
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

    /**
     * User principal containing authenticated user information.
     * Implements java.security.Principal so Spring's WebSocket messaging
     * can correctly route user-specific messages via convertAndSendToUser().
     *
     * <p>The getName() method returns the userId as a string, which must match
     * the user identifier used when calling SimpMessagingTemplate.convertAndSendToUser().
     */
    public record UserPrincipal(
            UUID userId,
            UUID tenantId,
            String username,
            Set<String> roles,
            UUID employeeId
    ) implements java.security.Principal {

        /**
         * Returns the user ID as the principal name.
         * This is used by Spring's WebSocket message routing to determine
         * the destination for user-specific messages (/user/{name}/queue/...).
         */
        @Override
        public String getName() {
            return userId != null ? userId.toString() : null;
        }

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

        public boolean isEmployee() {
            return employeeId != null;
        }
    }
}
