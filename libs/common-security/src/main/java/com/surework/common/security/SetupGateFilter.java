package com.surework.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Servlet filter that gates access to protected endpoints until the tenant
 * has completed the required onboarding steps (company details and compliance).
 *
 * Reads setup completion state from {@link TenantContext}, which must be
 * populated by the auth/JWT filter earlier in the chain.
 *
 * Returns HTTP 403 with a JSON body {@code {"error":"SETUP_REQUIRED","gate":"<GATE>"}}
 * when a gated path is accessed before setup is complete.
 */
public class SetupGateFilter implements Filter {

    private final Map<String, List<String>> companyGatePatterns;
    private final Map<String, List<String>> complianceGatePatterns;
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public SetupGateFilter(
            Map<String, List<String>> companyGatePatterns,
            Map<String, List<String>> complianceGatePatterns) {
        this.companyGatePatterns = companyGatePatterns;
        this.complianceGatePatterns = complianceGatePatterns;
    }

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        var request = (HttpServletRequest) req;
        var response = (HttpServletResponse) res;
        var path = request.getRequestURI();

        // Check company details gate
        if (!TenantContext.isCompanyDetailsComplete() && matchesAnyPattern(path, companyGatePatterns)) {
            rejectWithSetupRequired(response, "COMPANY_DETAILS");
            return;
        }

        // Check compliance gate
        if (!TenantContext.isComplianceDetailsComplete() && matchesAnyPattern(path, complianceGatePatterns)) {
            rejectWithSetupRequired(response, "COMPLIANCE");
            return;
        }

        chain.doFilter(request, response);
    }

    private boolean matchesAnyPattern(String path, Map<String, List<String>> patterns) {
        return patterns.values().stream()
                .flatMap(List::stream)
                .anyMatch(path::startsWith);
    }

    private void rejectWithSetupRequired(HttpServletResponse response, String gate) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        MAPPER.writeValue(response.getOutputStream(),
                Map.of("error", "SETUP_REQUIRED", "gate", gate));
    }
}
