package com.surework.common.security;

import java.util.Objects;
import java.util.UUID;

/**
 * Utility class for tenant-related assertions and validations.
 *
 * <p>Use these methods in service implementations to ensure consistent
 * tenant validation across the application. These assertions provide
 * defense-in-depth for multi-tenant data isolation.
 *
 * <p>Example usage:
 * <pre>
 * public VatReport getReport(UUID tenantId, UUID reportId) {
 *     // Ensure tenantId parameter matches context (defense-in-depth)
 *     TenantAssertions.assertTenantMatches(tenantId);
 *
 *     // Or require context and validate against entity
 *     UUID contextTenantId = TenantAssertions.requireAndValidateTenant();
 *     VatReport report = repository.findById(reportId).orElseThrow();
 *     TenantAssertions.assertBelongsToTenant(report.getTenantId(), contextTenantId);
 *
 *     return report;
 * }
 * </pre>
 *
 * @see TenantContext
 * @see TenantSecurityConstants
 */
public final class TenantAssertions {

    private TenantAssertions() {
        // Utility class - prevent instantiation
    }

    /**
     * Requires tenant context to be set and returns the tenant ID.
     *
     * <p>This is the preferred method for service methods to obtain tenant ID.
     * It provides consistent behavior and clear error messages.
     *
     * @return the current tenant ID
     * @throws TenantNotSetException if tenant context is not set
     */
    public static UUID requireTenantId() {
        return TenantContext.requireTenantId();
    }

    /**
     * Asserts that the provided tenant ID matches the current tenant context.
     *
     * <p>Use this for defense-in-depth when a tenant ID is passed as a parameter.
     * This prevents callers from accidentally or maliciously passing a different
     * tenant ID than what's in their context.
     *
     * @param providedTenantId the tenant ID provided as a parameter
     * @throws TenantNotSetException if tenant context is not set
     * @throws CrossTenantAccessException if tenant IDs don't match
     */
    public static void assertTenantMatches(UUID providedTenantId) {
        UUID contextTenantId = requireTenantId();

        if (!Objects.equals(contextTenantId, providedTenantId)) {
            throw new CrossTenantAccessException(
                    "Tenant ID mismatch: context has " + contextTenantId +
                    " but operation attempted with " + providedTenantId);
        }
    }

    /**
     * Asserts that an entity belongs to the specified tenant.
     *
     * <p>Use this after retrieving an entity to ensure it belongs to the
     * expected tenant, providing defense-in-depth if database queries
     * don't filter by tenant.
     *
     * @param entityTenantId the tenant ID from the entity
     * @param expectedTenantId the expected tenant ID (typically from context)
     * @throws CrossTenantAccessException if tenant IDs don't match
     */
    public static void assertBelongsToTenant(UUID entityTenantId, UUID expectedTenantId) {
        if (entityTenantId == null) {
            throw new CrossTenantAccessException(
                    "Entity has no tenant ID - cannot verify ownership");
        }

        if (!Objects.equals(entityTenantId, expectedTenantId)) {
            throw new CrossTenantAccessException(
                    "Cross-tenant access attempt: entity belongs to " + entityTenantId +
                    " but access attempted by " + expectedTenantId);
        }
    }

    /**
     * Asserts that an entity belongs to the current tenant context.
     *
     * <p>Convenience method that combines context retrieval and ownership check.
     *
     * @param entityTenantId the tenant ID from the entity
     * @throws TenantNotSetException if tenant context is not set
     * @throws CrossTenantAccessException if entity doesn't belong to current tenant
     */
    public static void assertBelongsToCurrentTenant(UUID entityTenantId) {
        UUID contextTenantId = requireTenantId();
        assertBelongsToTenant(entityTenantId, contextTenantId);
    }

    /**
     * Returns the tenant ID if it matches context, or requires context and returns it.
     *
     * <p>Use this when a method accepts an optional tenant ID parameter but should
     * validate it against context when provided.
     *
     * @param providedTenantId the tenant ID provided as a parameter (may be null)
     * @return the validated tenant ID (from parameter if provided and valid, else from context)
     * @throws TenantNotSetException if tenant context is not set
     * @throws CrossTenantAccessException if provided tenant ID doesn't match context
     */
    public static UUID requireAndValidateTenant(UUID providedTenantId) {
        UUID contextTenantId = requireTenantId();

        if (providedTenantId != null && !Objects.equals(providedTenantId, contextTenantId)) {
            throw new CrossTenantAccessException(
                    "Tenant ID mismatch: context has " + contextTenantId +
                    " but operation attempted with " + providedTenantId);
        }

        return contextTenantId;
    }

    /**
     * Exception thrown when cross-tenant access is attempted.
     *
     * <p>This is a security-critical exception indicating a potential
     * data isolation breach attempt.
     */
    public static class CrossTenantAccessException extends RuntimeException {

        private static final String ERROR_CODE = TenantSecurityConstants.ERROR_CROSS_TENANT_ACCESS;

        public CrossTenantAccessException(String message) {
            super(message);
        }

        public String getErrorCode() {
            return ERROR_CODE;
        }
    }
}
