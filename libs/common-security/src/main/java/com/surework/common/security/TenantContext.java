package com.surework.common.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;
import java.util.UUID;

/**
 * Thread-local tenant context for schema-per-tenant multi-tenancy.
 * Implements Constitution Principle VII: Database Standards.
 *
 * Each API request sets the tenant context from the JWT token,
 * which is used to route database queries to the correct schema.
 */
public final class TenantContext {

    private static final Logger log = LoggerFactory.getLogger(TenantContext.class);

    private static final ThreadLocal<UUID> CURRENT_TENANT = new ThreadLocal<>();
    private static final ThreadLocal<UUID> CURRENT_USER = new ThreadLocal<>();
    private static final ThreadLocal<String> CURRENT_IP = new ThreadLocal<>();

    private TenantContext() {
        // Utility class
    }

    /**
     * Set the current tenant for this thread.
     */
    public static void setTenantId(UUID tenantId) {
        log.debug("Setting tenant context: {}", tenantId);
        CURRENT_TENANT.set(tenantId);
    }

    /**
     * Get the current tenant ID.
     */
    public static Optional<UUID> getTenantId() {
        return Optional.ofNullable(CURRENT_TENANT.get());
    }

    /**
     * Get the current tenant ID or throw if not set.
     */
    public static UUID requireTenantId() {
        return getTenantId().orElseThrow(() ->
                new IllegalStateException("Tenant context not set. Ensure request has valid JWT with tenantId claim."));
    }

    /**
     * Set the current user for this thread.
     */
    public static void setUserId(UUID userId) {
        CURRENT_USER.set(userId);
    }

    /**
     * Get the current user ID.
     */
    public static Optional<UUID> getUserId() {
        return Optional.ofNullable(CURRENT_USER.get());
    }

    /**
     * Get the current user ID or throw if not set.
     */
    public static UUID requireUserId() {
        return getUserId().orElseThrow(() ->
                new IllegalStateException("User context not set. Ensure request has valid authentication."));
    }

    /**
     * Set the client IP address for audit logging.
     */
    public static void setClientIp(String ipAddress) {
        CURRENT_IP.set(ipAddress);
    }

    /**
     * Get the client IP address.
     */
    public static Optional<String> getClientIp() {
        return Optional.ofNullable(CURRENT_IP.get());
    }

    /**
     * Clear all context (call at end of request).
     */
    public static void clear() {
        log.debug("Clearing tenant context");
        CURRENT_TENANT.remove();
        CURRENT_USER.remove();
        CURRENT_IP.remove();
    }

    /**
     * Get the schema name for the current tenant.
     * Format: tenant_{uuid_without_dashes}
     */
    public static String getSchemaName() {
        UUID tenantId = requireTenantId();
        return "tenant_" + tenantId.toString().replace("-", "");
    }

    /**
     * Generate schema name from tenant ID.
     */
    public static String getSchemaName(UUID tenantId) {
        return "tenant_" + tenantId.toString().replace("-", "");
    }
}
