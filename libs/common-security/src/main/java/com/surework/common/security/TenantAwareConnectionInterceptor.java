package com.surework.common.security;

import org.aopalliance.intercept.MethodInterceptor;
import org.aopalliance.intercept.MethodInvocation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.datasource.ConnectionHolder;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.UUID;

/**
 * AOP interceptor that sets the tenant ID in the PostgreSQL session
 * for Row-Level Security (RLS) enforcement.
 *
 * <p>This interceptor implements a <strong>fail-closed</strong> security model:
 * if the tenant ID cannot be set in the database session, the transaction
 * is aborted rather than proceeding without tenant isolation.
 *
 * <p>This interceptor should be applied to transactional service methods
 * to ensure the tenant ID is set before any database operations.
 *
 * <p>Usage in configuration:
 * <pre>
 * &#64;Bean
 * public Advisor tenantAwareAdvisor() {
 *     AspectJExpressionPointcut pointcut = new AspectJExpressionPointcut();
 *     pointcut.setExpression("execution(* com.surework.*.service.*.*(..))");
 *     return new DefaultPointcutAdvisor(pointcut, new TenantAwareConnectionInterceptor());
 * }
 * </pre>
 *
 * <p>The interceptor executes: {@code SET LOCAL app.current_tenant_id = 'tenant-uuid'}
 * This is picked up by the RLS policy function {@code require_tenant_id()}
 *
 * <p><strong>Security Note:</strong> This interceptor is critical for multi-tenant
 * data isolation. Any failure to set tenant context MUST abort the operation.
 */
public class TenantAwareConnectionInterceptor implements MethodInterceptor {

    private static final Logger log = LoggerFactory.getLogger(TenantAwareConnectionInterceptor.class);

    /**
     * Whether to require tenant context for all transactional operations.
     * When true (default), operations without tenant context will fail.
     * Set to false only for system-level operations that intentionally bypass tenant isolation.
     */
    private final boolean requireTenantContext;

    /**
     * Creates an interceptor that requires tenant context (fail-closed mode).
     */
    public TenantAwareConnectionInterceptor() {
        this(true);
    }

    /**
     * Creates an interceptor with configurable tenant requirement.
     *
     * @param requireTenantContext if true, operations without tenant context will fail
     */
    public TenantAwareConnectionInterceptor(boolean requireTenantContext) {
        this.requireTenantContext = requireTenantContext;
    }

    @Override
    public Object invoke(MethodInvocation invocation) throws Throwable {
        if (!TransactionSynchronizationManager.isActualTransactionActive()) {
            // No active transaction - proceed without setting tenant context
            // RLS policies will handle enforcement at query time
            return invocation.proceed();
        }

        UUID tenantId = TenantContext.getTenantId().orElse(null);

        if (tenantId == null) {
            if (requireTenantContext) {
                log.error("SECURITY: Attempted database operation without tenant context. " +
                        "Method: {}.{}",
                        invocation.getMethod().getDeclaringClass().getSimpleName(),
                        invocation.getMethod().getName());
                throw new TenantNotSetException(
                        "Cannot execute database operation without tenant context. " +
                        "Ensure request has valid JWT with tenantId claim.");
            }
            // Tenant context not required for this operation
            log.debug("Proceeding without tenant context (not required): {}.{}",
                    invocation.getMethod().getDeclaringClass().getSimpleName(),
                    invocation.getMethod().getName());
            return invocation.proceed();
        }

        // Set tenant ID in database session - fail if this cannot be done
        setTenantIdInConnection(tenantId, invocation);

        return invocation.proceed();
    }

    /**
     * Sets the tenant ID in the PostgreSQL session for RLS enforcement.
     *
     * <p><strong>CRITICAL:</strong> This method throws an exception on failure
     * to implement fail-closed security. If we cannot set the tenant context,
     * we MUST NOT proceed with the database operation.
     *
     * @param tenantId the tenant ID to set
     * @param invocation the method invocation (for error context)
     * @throws TenantContextPropagationException if tenant ID cannot be set
     */
    private void setTenantIdInConnection(UUID tenantId, MethodInvocation invocation) {
        ConnectionHolder connectionHolder = findConnectionHolder();

        if (connectionHolder == null) {
            // No connection holder found - this should not happen in a transaction
            throw new TenantContextPropagationException(
                    "Cannot set tenant context: No database connection found in transaction. " +
                    "Method: " + formatMethodName(invocation));
        }

        Connection connection = connectionHolder.getConnection();

        try {
            if (connection == null || connection.isClosed()) {
                throw new TenantContextPropagationException(
                        "Cannot set tenant context: Database connection is null or closed. " +
                        "Method: " + formatMethodName(invocation));
            }

            // Use parameterized approach to prevent SQL injection
            // Note: SET LOCAL doesn't support prepared statements, but UUID.toString() is safe
            try (Statement stmt = connection.createStatement()) {
                String tenantIdStr = tenantId.toString();
                // Validate UUID format to prevent any injection
                if (!isValidUuidFormat(tenantIdStr)) {
                    throw new TenantContextPropagationException(
                            "Invalid tenant ID format: " + tenantIdStr);
                }

                String sql = "SET LOCAL app.current_tenant_id = '" + tenantIdStr + "'";
                stmt.execute(sql);
                log.debug("Set tenant ID in PostgreSQL session: {}", tenantId);
            }
        } catch (SQLException e) {
            log.error("SECURITY: Failed to set tenant ID in PostgreSQL session. " +
                    "TenantId: {}, Method: {}, Error: {}",
                    tenantId, formatMethodName(invocation), e.getMessage());
            throw new TenantContextPropagationException(
                    "Failed to set tenant context in database session: " + e.getMessage(), e);
        }
    }

    /**
     * Finds the ConnectionHolder from the transaction synchronization manager.
     */
    private ConnectionHolder findConnectionHolder() {
        return (ConnectionHolder) TransactionSynchronizationManager.getResourceMap()
                .keySet()
                .stream()
                .filter(key -> key.toString().contains("DataSource"))
                .findFirst()
                .map(TransactionSynchronizationManager::getResource)
                .orElse(null);
    }

    /**
     * Validates that the string is a valid UUID format.
     * This is a defense-in-depth measure against SQL injection.
     */
    private boolean isValidUuidFormat(String uuidStr) {
        if (uuidStr == null || uuidStr.length() != 36) {
            return false;
        }
        try {
            UUID.fromString(uuidStr);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private String formatMethodName(MethodInvocation invocation) {
        return invocation.getMethod().getDeclaringClass().getSimpleName() + "." +
                invocation.getMethod().getName();
    }

    /**
     * Exception thrown when tenant context cannot be propagated to the database session.
     * This is a security-critical exception indicating potential data isolation failure.
     */
    public static class TenantContextPropagationException extends RuntimeException {
        public TenantContextPropagationException(String message) {
            super(message);
        }

        public TenantContextPropagationException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
