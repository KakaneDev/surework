package com.surework.common.security;

/**
 * Centralized constants for multi-tenant security implementation.
 *
 * <p>This class consolidates all tenant-related constants to ensure consistency
 * across the application and simplify maintenance.
 *
 * <p>Security Note: Changing these values may affect security policies and
 * require coordinated updates across database migrations, application code,
 * and tests.
 */
public final class TenantSecurityConstants {

    private TenantSecurityConstants() {
        // Prevent instantiation
    }

    // ========================================================================
    // Redis Key Prefixes
    // ========================================================================

    /**
     * Prefix for tenant-scoped Redis keys.
     * Format: tenant:{tenantId}:{namespace}:{key}
     */
    public static final String REDIS_TENANT_PREFIX = "tenant";

    /**
     * Prefix for global (tenant-agnostic) Redis keys.
     * Format: global:{namespace}:{key}
     * Use sparingly - only for truly global operations like password reset.
     */
    public static final String REDIS_GLOBAL_PREFIX = "global";

    /**
     * Separator used in Redis key construction.
     */
    public static final String REDIS_KEY_SEPARATOR = ":";

    // ========================================================================
    // Database Session Variables
    // ========================================================================

    /**
     * PostgreSQL session variable name for tenant ID.
     * Set via: SET LOCAL app.current_tenant_id = 'tenant-uuid'
     */
    public static final String PG_TENANT_ID_VARIABLE = "app.current_tenant_id";

    // ========================================================================
    // HTTP Headers
    // ========================================================================

    /**
     * Header used to propagate tenant ID from API Gateway to services.
     */
    public static final String HEADER_TENANT_ID = "X-Tenant-ID";

    /**
     * Header used to propagate user ID from API Gateway to services.
     */
    public static final String HEADER_USER_ID = "X-User-ID";

    /**
     * Header used to propagate the full user tenant context.
     */
    public static final String HEADER_USER_TENANT = "X-User-Tenant";

    // ========================================================================
    // JWT Claims
    // ========================================================================

    /**
     * JWT claim name for tenant ID.
     */
    public static final String JWT_CLAIM_TENANT_ID = "tenantId";

    /**
     * JWT claim name for user ID.
     */
    public static final String JWT_CLAIM_USER_ID = "userId";

    /**
     * JWT claim name for user roles.
     */
    public static final String JWT_CLAIM_ROLES = "roles";

    /**
     * JWT claim name for user permissions.
     */
    public static final String JWT_CLAIM_PERMISSIONS = "permissions";

    // ========================================================================
    // Error Codes
    // ========================================================================

    /**
     * Error code when tenant context is required but not available.
     */
    public static final String ERROR_TENANT_CONTEXT_REQUIRED = "TENANT_CONTEXT_REQUIRED";

    /**
     * Error code when provided tenant ID format is invalid.
     */
    public static final String ERROR_INVALID_TENANT_ID = "INVALID_TENANT_ID";

    /**
     * Error code for tenant context propagation failures.
     */
    public static final String ERROR_TENANT_PROPAGATION_FAILED = "TENANT_PROPAGATION_FAILED";

    /**
     * Error code for cross-tenant access attempts.
     */
    public static final String ERROR_CROSS_TENANT_ACCESS = "CROSS_TENANT_ACCESS_DENIED";

    // ========================================================================
    // PostgreSQL Error Codes (custom)
    // ========================================================================

    /**
     * PostgreSQL error code for tenant context not set.
     * Used in RLS policy functions.
     */
    public static final String PG_ERROR_TENANT_NOT_SET = "P0001";

    /**
     * PostgreSQL error code for invalid tenant ID format.
     * Used in RLS policy functions.
     */
    public static final String PG_ERROR_INVALID_TENANT = "P0002";

    // ========================================================================
    // Cache Keys
    // ========================================================================

    /**
     * Cache key namespace for MFA challenges.
     */
    public static final String CACHE_MFA_CHALLENGE = "mfa:challenge";

    /**
     * Cache key namespace for MFA pending enrollment.
     */
    public static final String CACHE_MFA_PENDING = "mfa:pending";

    /**
     * Cache key namespace for token blacklist.
     */
    public static final String CACHE_TOKEN_BLACKLIST = "token:blacklist";

    /**
     * Cache key namespace for password reset tokens.
     */
    public static final String CACHE_PASSWORD_RESET = "password:reset";

    // ========================================================================
    // Content Types
    // ========================================================================

    /**
     * Content type for JSON error responses.
     */
    public static final String CONTENT_TYPE_JSON = "application/json;charset=UTF-8";
}
