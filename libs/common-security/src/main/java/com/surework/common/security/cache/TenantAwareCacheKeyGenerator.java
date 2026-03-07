package com.surework.common.security.cache;

import com.surework.common.security.TenantContext;
import com.surework.common.security.TenantNotSetException;
import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Tenant-aware cache key generator for multi-tenant isolation.
 * Prefixes all cache keys with the current tenant ID to prevent cross-tenant
 * cache pollution.
 *
 * <p><strong>Security Model: Fail-Closed</strong></p>
 * <p>This generator implements fail-closed security: if tenant context is not
 * available, it throws {@link TenantNotSetException} rather than falling back
 * to a shared namespace. This prevents accidental cache sharing between tenants.</p>
 *
 * <p>Usage:
 * <pre>
 * {@code @Cacheable(value = "customers", keyGenerator = "tenantAwareCacheKeyGenerator")}
 * </pre>
 *
 * <p>Generated key format: {@code {tenantId}:{className}:{methodName}:{params}}
 *
 * <p>For operations that intentionally operate without tenant context (e.g.,
 * global configuration), use a separate cache configuration or the
 * {@link TenantAwareRedisOps#globalKey} method.
 *
 * <p>Security note: This provides defense-in-depth alongside schema-per-tenant
 * database isolation. If schema routing fails, cache isolation prevents
 * data leakage between tenants.
 */
@Component("tenantAwareCacheKeyGenerator")
public class TenantAwareCacheKeyGenerator implements KeyGenerator {

    private static final String KEY_SEPARATOR = ":";

    /**
     * Generates a tenant-prefixed cache key.
     *
     * @param target the target object
     * @param method the method being called
     * @param params the method parameters
     * @return the tenant-prefixed cache key
     * @throws TenantNotSetException if tenant context is not available
     */
    @Override
    public Object generate(Object target, Method method, Object... params) {
        // Fail-closed: require tenant context for cache operations
        UUID tenantId = TenantContext.requireTenantId();
        String tenantPrefix = tenantId.toString();

        String className = target.getClass().getSimpleName();
        String methodName = method.getName();

        String paramsKey = Arrays.stream(params)
                .map(this::paramToString)
                .collect(Collectors.joining(KEY_SEPARATOR));

        if (paramsKey.isEmpty()) {
            return tenantPrefix + KEY_SEPARATOR + className + KEY_SEPARATOR + methodName;
        }

        return tenantPrefix + KEY_SEPARATOR + className + KEY_SEPARATOR + methodName + KEY_SEPARATOR + paramsKey;
    }

    private String paramToString(Object param) {
        if (param == null) {
            return "null";
        }
        if (param instanceof UUID) {
            return param.toString();
        }
        if (param instanceof String || param instanceof Number || param instanceof Boolean) {
            return param.toString();
        }
        if (param instanceof Enum<?>) {
            return ((Enum<?>) param).name();
        }
        // For complex objects, use hashCode to avoid overly long keys
        return String.valueOf(param.hashCode());
    }

    /**
     * Generate a simple tenant-prefixed key.
     * Useful for manual cache operations.
     *
     * <p><strong>Fail-Closed:</strong> This method requires tenant context.
     * For global keys, use {@link TenantAwareRedisOps#globalKey} instead.
     *
     * @param key the base key
     * @return tenant-prefixed key: {@code {tenantId}:{key}}
     * @throws TenantNotSetException if tenant context is not available
     */
    public static String tenantPrefixedKey(String key) {
        UUID tenantId = TenantContext.requireTenantId();
        return tenantId.toString() + KEY_SEPARATOR + key;
    }

    /**
     * Generate a tenant-prefixed key with explicit tenant ID.
     *
     * <p>Use this method when you have the tenant ID explicitly (e.g., from
     * a domain entity) rather than relying on context.
     *
     * @param tenantId the tenant ID (must not be null)
     * @param key the base key
     * @return tenant-prefixed key: {@code {tenantId}:{key}}
     * @throws IllegalArgumentException if tenantId is null
     */
    public static String tenantPrefixedKey(UUID tenantId, String key) {
        if (tenantId == null) {
            throw new IllegalArgumentException("Tenant ID cannot be null for cache key generation");
        }
        return tenantId.toString() + KEY_SEPARATOR + key;
    }
}
