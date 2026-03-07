package com.surework.common.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

/**
 * JWT Token Provider for authentication.
 * Implements Constitution Principle VIII: Security.
 *
 * Features:
 * - Stateless JWT authentication
 * - 15-minute access token expiry (FR-E06)
 * - Refresh token support
 * - Tenant ID in claims for multi-tenancy
 */
@Component
public class JwtTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

    private static final String CLAIM_TENANT_ID = "tenantId";
    private static final String CLAIM_USER_ID = "userId";
    private static final String CLAIM_EMPLOYEE_ID = "employeeId";
    private static final String CLAIM_USERNAME = "username";
    private static final String CLAIM_ROLES = "roles";
    private static final String CLAIM_PERMISSIONS = "permissions";
    private static final String CLAIM_TOKEN_TYPE = "tokenType";

    private final SecretKey secretKey;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;

    public JwtTokenProvider(
            @Value("${surework.security.jwt.secret:surework-jwt-secret-key-for-development-only-change-in-production-min32chars}") String jwtSecret,
            @Value("${surework.security.jwt.access-token-expiration-ms:900000}") long accessTokenExpirationMs,
            @Value("${surework.security.jwt.refresh-token-expiration-ms:604800000}") long refreshTokenExpirationMs
    ) {
        this.secretKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpirationMs = accessTokenExpirationMs; // Default: 15 minutes
        this.refreshTokenExpirationMs = refreshTokenExpirationMs; // Default: 7 days
    }

    /**
     * Generate an access token.
     */
    public String generateAccessToken(
            UUID userId,
            UUID tenantId,
            String email,
            Set<String> roles,
            Set<String> permissions
    ) {
        return generateAccessToken(userId, tenantId, email, null, roles, permissions);
    }

    /**
     * Generate an access token with employee ID.
     */
    public String generateAccessToken(
            UUID userId,
            UUID tenantId,
            String email,
            UUID employeeId,
            Set<String> roles,
            Set<String> permissions
    ) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(accessTokenExpirationMs);

        var builder = Jwts.builder()
                .subject(userId.toString())
                .claim(CLAIM_USER_ID, userId.toString())
                .claim(CLAIM_TENANT_ID, tenantId.toString())
                .claim(CLAIM_USERNAME, email)
                .claim(CLAIM_ROLES, roles)
                .claim(CLAIM_PERMISSIONS, permissions)
                .claim(CLAIM_TOKEN_TYPE, "ACCESS")
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry));

        if (employeeId != null) {
            builder.claim(CLAIM_EMPLOYEE_ID, employeeId.toString());
        }

        return builder.signWith(secretKey, Jwts.SIG.HS512).compact();
    }

    /**
     * Generate a refresh token.
     */
    public String generateRefreshToken(UUID userId, UUID tenantId) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(refreshTokenExpirationMs);

        return Jwts.builder()
                .subject(userId.toString())
                .claim(CLAIM_TENANT_ID, tenantId.toString())
                .claim(CLAIM_TOKEN_TYPE, "REFRESH")
                .id(UUID.randomUUID().toString()) // Unique token ID for revocation
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(secretKey, Jwts.SIG.HS512)
                .compact();
    }

    /**
     * Validate a token and return claims.
     */
    public Optional<Claims> validateToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Optional.of(claims);
        } catch (ExpiredJwtException ex) {
            log.debug("JWT token expired: {}", ex.getMessage());
        } catch (MalformedJwtException ex) {
            log.warn("Invalid JWT token: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            log.warn("Unsupported JWT token: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            log.warn("JWT claims string is empty: {}", ex.getMessage());
        } catch (JwtException ex) {
            log.warn("JWT validation failed: {}", ex.getMessage());
        }
        return Optional.empty();
    }

    /**
     * Extract user ID from token.
     */
    public Optional<UUID> getUserId(Claims claims) {
        String userId = claims.get(CLAIM_USER_ID, String.class);
        return userId != null ? Optional.of(UUID.fromString(userId)) : Optional.empty();
    }

    /**
     * Extract tenant ID from token.
     */
    public Optional<UUID> getTenantId(Claims claims) {
        String tenantId = claims.get(CLAIM_TENANT_ID, String.class);
        return tenantId != null ? Optional.of(UUID.fromString(tenantId)) : Optional.empty();
    }

    /**
     * Extract employee ID from token (if present).
     */
    public Optional<UUID> getEmployeeId(Claims claims) {
        String employeeId = claims.get(CLAIM_EMPLOYEE_ID, String.class);
        return employeeId != null ? Optional.of(UUID.fromString(employeeId)) : Optional.empty();
    }

    /**
     * Extract username from token.
     */
    public Optional<String> getUsername(Claims claims) {
        return Optional.ofNullable(claims.get(CLAIM_USERNAME, String.class));
    }

    /**
     * Extract roles from token.
     */
    @SuppressWarnings("unchecked")
    public Set<String> getRoles(Claims claims) {
        List<String> roles = claims.get(CLAIM_ROLES, List.class);
        return roles != null ? new HashSet<>(roles) : Collections.emptySet();
    }

    /**
     * Extract permissions from token.
     */
    @SuppressWarnings("unchecked")
    public Set<String> getPermissions(Claims claims) {
        List<String> permissions = claims.get(CLAIM_PERMISSIONS, List.class);
        return permissions != null ? new HashSet<>(permissions) : Collections.emptySet();
    }

    /**
     * Check if token is a refresh token.
     */
    public boolean isRefreshToken(Claims claims) {
        return "REFRESH".equals(claims.get(CLAIM_TOKEN_TYPE, String.class));
    }

    /**
     * Get access token expiration time in seconds (for response).
     */
    public long getAccessTokenExpirationSeconds() {
        return accessTokenExpirationMs / 1000;
    }

    /**
     * Get refresh token expiration time in seconds (for response).
     */
    public long getRefreshTokenExpirationSeconds() {
        return refreshTokenExpirationMs / 1000;
    }
}
