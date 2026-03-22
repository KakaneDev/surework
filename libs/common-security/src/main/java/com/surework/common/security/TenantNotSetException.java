package com.surework.common.security;

/**
 * Exception thrown when tenant context is required but not available.
 * This is a security-critical exception indicating that a multi-tenant
 * operation was attempted without proper tenant isolation.
 *
 * This exception should NEVER be caught and silently handled - it indicates
 * a configuration error or security vulnerability that must be addressed.
 */
public class TenantNotSetException extends RuntimeException {

    private static final String DEFAULT_MESSAGE =
            "Tenant context not available - cannot proceed with multi-tenant operation. " +
            "Ensure request has valid JWT with tenantId claim.";

    public TenantNotSetException() {
        super(DEFAULT_MESSAGE);
    }

    public TenantNotSetException(String message) {
        super(message);
    }

    public TenantNotSetException(String message, Throwable cause) {
        super(message, cause);
    }
}
