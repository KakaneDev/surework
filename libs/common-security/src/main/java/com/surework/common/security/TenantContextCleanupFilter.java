package com.surework.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter that guarantees TenantContext cleanup after every request.
 *
 * <p><strong>Purpose:</strong> Prevents ThreadLocal memory leaks and context
 * bleeding between requests when threads are reused from a pool.
 *
 * <p><strong>Order:</strong> This filter runs with highest precedence to ensure
 * it wraps all other filters. The cleanup happens in a finally block, guaranteeing
 * execution even if downstream filters or handlers throw exceptions.
 *
 * <p><strong>Security Importance:</strong> Without this filter, a thread that
 * processed a request for Tenant A could retain that tenant's context when
 * later processing a request for Tenant B, potentially causing:
 * <ul>
 *   <li>Cross-tenant data access</li>
 *   <li>Data being saved with wrong tenant ID</li>
 *   <li>Cache pollution</li>
 *   <li>Incorrect audit trails</li>
 * </ul>
 *
 * <p>Usage in SecurityConfig:
 * <pre>
 * http.addFilterBefore(tenantContextCleanupFilter, UsernamePasswordAuthenticationFilter.class);
 * </pre>
 *
 * @see TenantContext
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TenantContextCleanupFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(TenantContextCleanupFilter.class);

    /**
     * Whether to log context leaks (useful for debugging).
     */
    private final boolean logContextLeaks;

    public TenantContextCleanupFilter() {
        this(true);
    }

    public TenantContextCleanupFilter(boolean logContextLeaks) {
        this.logContextLeaks = logContextLeaks;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        // Check for leaked context from previous request (indicates bug elsewhere)
        if (logContextLeaks && TenantContext.getTenantId().isPresent()) {
            log.warn("SECURITY: TenantContext leak detected at start of request. " +
                    "Previous tenant ID: {}, URI: {}",
                    TenantContext.getTenantId().orElse(null),
                    request.getRequestURI());
            // Clear it now to prevent issues
            TenantContext.clear();
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            // CRITICAL: Always clear context, even on exceptions
            // This prevents context bleeding between requests
            clearContextSafely();
        }
    }

    /**
     * Safely clears the tenant context, catching any unexpected errors.
     * This should never fail, but we catch exceptions defensively.
     */
    private void clearContextSafely() {
        try {
            TenantContext.clear();
        } catch (Exception e) {
            // This should never happen, but log if it does
            log.error("CRITICAL: Failed to clear TenantContext - potential memory leak", e);
        }
    }

    /**
     * This filter should process all requests including async dispatches.
     */
    @Override
    protected boolean shouldNotFilterAsyncDispatch() {
        return false;
    }

    /**
     * This filter should process error dispatches to ensure cleanup.
     */
    @Override
    protected boolean shouldNotFilterErrorDispatch() {
        return false;
    }
}
