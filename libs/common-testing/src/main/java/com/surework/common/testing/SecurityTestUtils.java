package com.surework.common.testing;

import com.surework.common.security.TenantContext;

import java.util.Set;
import java.util.UUID;

/**
 * Utilities for security-related test setup.
 */
public final class SecurityTestUtils {

    private SecurityTestUtils() {
        // Prevent instantiation
    }

    /**
     * Set up tenant context for tests.
     */
    public static void setTenantContext(UUID tenantId, UUID userId) {
        TenantContext.setTenantId(tenantId);
        TenantContext.setUserId(userId);
    }

    /**
     * Set up tenant context with client IP.
     */
    public static void setTenantContext(UUID tenantId, UUID userId, String clientIp) {
        TenantContext.setTenantId(tenantId);
        TenantContext.setUserId(userId);
        TenantContext.setClientIp(clientIp);
    }

    /**
     * Set up default test tenant context.
     */
    public static void setDefaultTenantContext() {
        setTenantContext(
                TestDataFactory.testTenantId(),
                TestDataFactory.testUserId(),
                "127.0.0.1"
        );
    }

    /**
     * Clear tenant context after tests.
     */
    public static void clearTenantContext() {
        TenantContext.clear();
    }

    /**
     * Execute code with tenant context, then clear.
     */
    public static <T> T withTenantContext(UUID tenantId, UUID userId,
                                           java.util.function.Supplier<T> action) {
        try {
            setTenantContext(tenantId, userId);
            return action.get();
        } finally {
            clearTenantContext();
        }
    }

    /**
     * Execute code with tenant context, then clear (void version).
     */
    public static void withTenantContext(UUID tenantId, UUID userId, Runnable action) {
        try {
            setTenantContext(tenantId, userId);
            action.run();
        } finally {
            clearTenantContext();
        }
    }

    /**
     * Standard test roles.
     */
    public static final Set<String> ADMIN_ROLES = Set.of("ADMIN", "HR_ADMIN", "PAYROLL_ADMIN");
    public static final Set<String> HR_MANAGER_ROLES = Set.of("HR_MANAGER");
    public static final Set<String> EMPLOYEE_ROLES = Set.of("EMPLOYEE");
    public static final Set<String> ACCOUNTANT_ROLES = Set.of("ACCOUNTANT");
}
