package com.surework.common.security.cache;

import com.surework.common.security.TenantContext;
import com.surework.common.security.TenantNotSetException;

import java.util.UUID;

import static com.surework.common.security.TenantSecurityConstants.*;

/**
 * Utility class for generating tenant-prefixed Redis keys.
 * Ensures all Redis operations are tenant-isolated to prevent cross-tenant data access.
 *
 * <p>Key format: {@code tenant:{tenantId}:{namespace}:{key}}
 *
 * <p>Usage:
 * <pre>
 * // Requires tenant context (throws if not set)
 * String key = TenantAwareRedisOps.key("mfa", "challenge", challengeToken);
 * // Returns: tenant:{tenantId}:mfa:challenge:{challengeToken}
 *
 * // With explicit tenant ID (doesn't require context)
 * String key = TenantAwareRedisOps.key(tenantId, "mfa", "challenge", challengeToken);
 *
 * // For truly global operations (use sparingly)
 * String key = TenantAwareRedisOps.globalKey("password", "reset", resetToken);
 * </pre>
 *
 * <p><strong>Security Model:</strong>
 * <ul>
 *   <li>{@link #key(String...)} - Fail-closed: requires tenant context</li>
 *   <li>{@link #key(UUID, String...)} - Explicit tenant: for when you have the ID</li>
 *   <li>{@link #keyOrGlobal(String...)} - Falls back to global: use for pre-auth flows only</li>
 *   <li>{@link #globalKey(String...)} - Global: for truly tenant-agnostic data</li>
 * </ul>
 *
 * <p>Security note: This provides defense-in-depth for Redis operations.
 * Even if application code has bugs, tenant isolation prevents data leakage.
 *
 * @see TenantSecurityConstants
 */
public final class TenantAwareRedisOps {

    private TenantAwareRedisOps() {
        // Utility class - prevent instantiation
    }

    /**
     * Generate a tenant-prefixed Redis key using the current tenant context.
     *
     * <p><strong>Fail-Closed:</strong> This method throws if tenant context is not set.
     *
     * @param parts key components to join (e.g., "mfa", "challenge", token)
     * @return fully qualified tenant-prefixed key
     * @throws TenantNotSetException if tenant context is not set
     */
    public static String key(String... parts) {
        UUID tenantId = TenantContext.requireTenantId();
        return buildKey(tenantId, parts);
    }

    /**
     * Generate a tenant-prefixed Redis key with explicit tenant ID.
     *
     * <p>Use this when you have the tenant ID explicitly (e.g., from a domain
     * entity or JWT) rather than relying on context.
     *
     * @param tenantId the tenant ID (must not be null)
     * @param parts key components to join
     * @return fully qualified tenant-prefixed key
     * @throws IllegalArgumentException if tenantId is null
     */
    public static String key(UUID tenantId, String... parts) {
        if (tenantId == null) {
            throw new IllegalArgumentException("Tenant ID cannot be null for key generation");
        }
        return buildKey(tenantId, parts);
    }

    /**
     * Generate a tenant-prefixed Redis key, falling back to global if tenant context is not set.
     *
     * <p><strong>Warning:</strong> Use this only for operations that must work before
     * tenant context is established (e.g., token blacklist check during JWT validation,
     * MFA enrollment confirmation). For most operations, use {@link #key(String...)} instead.
     *
     * <p>Appropriate use cases:
     * <ul>
     *   <li>Token blacklist lookup during JWT validation (may not have context yet)</li>
     *   <li>MFA operations during authentication flow</li>
     * </ul>
     *
     * @param parts key components to join
     * @return tenant-prefixed key if tenant is set, otherwise global-prefixed key
     */
    public static String keyOrGlobal(String... parts) {
        return TenantContext.getTenantId()
                .map(id -> buildKey(id, parts))
                .orElseGet(() -> buildGlobalKey(parts));
    }

    /**
     * Generate a global key (not tenant-specific).
     *
     * <p><strong>Warning:</strong> Use sparingly - only for truly global data that
     * intentionally spans all tenants. Examples:
     * <ul>
     *   <li>Password reset tokens (user not authenticated)</li>
     *   <li>System-wide configuration</li>
     *   <li>Platform-level rate limiting</li>
     * </ul>
     *
     * <p>For tenant-scoped operations, use {@link #key(String...)} instead.
     *
     * @param parts key components to join
     * @return global-prefixed key
     */
    public static String globalKey(String... parts) {
        return buildGlobalKey(parts);
    }

    private static String buildKey(UUID tenantId, String[] parts) {
        StringBuilder sb = new StringBuilder();
        sb.append(REDIS_TENANT_PREFIX)
          .append(REDIS_KEY_SEPARATOR)
          .append(tenantId);

        for (String part : parts) {
            if (part != null) {
                sb.append(REDIS_KEY_SEPARATOR).append(part);
            }
        }

        return sb.toString();
    }

    private static String buildGlobalKey(String[] parts) {
        StringBuilder sb = new StringBuilder();
        sb.append(REDIS_GLOBAL_PREFIX);

        for (String part : parts) {
            if (part != null) {
                sb.append(REDIS_KEY_SEPARATOR).append(part);
            }
        }

        return sb.toString();
    }

    /**
     * Extract tenant ID from a tenant-prefixed key.
     *
     * @param key the Redis key
     * @return the tenant ID or null if not a tenant-prefixed key
     */
    public static UUID extractTenantId(String key) {
        if (key == null || key.isEmpty()) {
            return null;
        }

        String tenantKeyPrefix = REDIS_TENANT_PREFIX + REDIS_KEY_SEPARATOR;
        if (!key.startsWith(tenantKeyPrefix)) {
            return null;
        }

        String[] parts = key.split(REDIS_KEY_SEPARATOR, 3);
        if (parts.length < 2) {
            return null;
        }

        try {
            return UUID.fromString(parts[1]);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /**
     * Check if a key is a tenant-scoped key.
     *
     * @param key the Redis key
     * @return true if the key is tenant-scoped
     */
    public static boolean isTenantKey(String key) {
        return key != null && key.startsWith(REDIS_TENANT_PREFIX + REDIS_KEY_SEPARATOR);
    }

    /**
     * Check if a key is a global key.
     *
     * @param key the Redis key
     * @return true if the key is global
     */
    public static boolean isGlobalKey(String key) {
        return key != null && key.startsWith(REDIS_GLOBAL_PREFIX + REDIS_KEY_SEPARATOR);
    }
}
