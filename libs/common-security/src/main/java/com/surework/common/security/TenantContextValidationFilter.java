package com.surework.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

import static com.surework.common.security.TenantSecurityConstants.*;

/**
 * Filter that validates tenant context is set for all protected requests.
 * Rejects requests without valid tenant context to prevent cross-tenant data access.
 *
 * <p>This filter should be placed AFTER the JwtHeaderAuthenticationFilter in the filter chain
 * to ensure the tenant context has been extracted from the JWT token.
 *
 * <p>Public endpoints (e.g., health checks, login) should be excluded from validation.
 *
 * <p>Usage in SecurityConfig:
 * <pre>
 * http.addFilterAfter(new TenantContextValidationFilter(publicPaths), JwtHeaderAuthenticationFilter.class);
 * </pre>
 *
 * @see TenantSecurityConstants#ERROR_TENANT_CONTEXT_REQUIRED
 */
public class TenantContextValidationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(TenantContextValidationFilter.class);

    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    /**
     * Paths that do not require tenant context (public/system endpoints).
     * These paths bypass tenant validation.
     */
    private final List<String> publicPaths;

    /**
     * Default public paths that don't require tenant context.
     */
    private static final List<String> DEFAULT_PUBLIC_PATHS = List.of(
            "/actuator/**",
            "/health/**",
            "/api/auth/login",
            "/api/auth/refresh",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/api/public/**",
            "/swagger-ui/**",
            "/api-docs/**",
            "/v3/api-docs/**",
            "/error"
    );

    /**
     * Create filter with default public paths.
     */
    public TenantContextValidationFilter() {
        this.publicPaths = DEFAULT_PUBLIC_PATHS;
    }

    /**
     * Create filter with custom public paths.
     * The provided paths are ADDED to the default public paths.
     *
     * @param additionalPublicPaths additional paths to exclude from tenant validation
     */
    public TenantContextValidationFilter(List<String> additionalPublicPaths) {
        this.publicPaths = new java.util.ArrayList<>(DEFAULT_PUBLIC_PATHS);
        if (additionalPublicPaths != null) {
            this.publicPaths.addAll(additionalPublicPaths);
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {

        String requestPath = request.getRequestURI();

        // Skip validation for OPTIONS (CORS preflight) requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // Skip validation for public paths
        if (isPublicPath(requestPath)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Check if tenant context is set
        if (TenantContext.getTenantId().isEmpty()) {
            log.warn("SECURITY: Tenant context not set for protected request: {} {}",
                    request.getMethod(), requestPath);

            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType(CONTENT_TYPE_JSON);
            response.getWriter().write(String.format("""
                {
                    "error": "%s",
                    "message": "Tenant context is required for this request. Ensure your JWT token includes a valid tenantId claim.",
                    "status": 403,
                    "path": "%s"
                }
                """, ERROR_TENANT_CONTEXT_REQUIRED, requestPath));
            return;
        }

        log.debug("Tenant context validated for request: {} {} (tenant: {})",
                request.getMethod(), requestPath, TenantContext.getTenantId().orElse(null));

        filterChain.doFilter(request, response);
    }

    /**
     * Check if the request path is a public path that doesn't require tenant context.
     */
    private boolean isPublicPath(String requestPath) {
        return publicPaths.stream()
                .anyMatch(pattern -> pathMatcher.match(pattern, requestPath));
    }

    @Override
    protected boolean shouldNotFilterAsyncDispatch() {
        return false;
    }

    @Override
    protected boolean shouldNotFilterErrorDispatch() {
        // Process error dispatches to ensure consistent security enforcement
        return false;
    }
}
