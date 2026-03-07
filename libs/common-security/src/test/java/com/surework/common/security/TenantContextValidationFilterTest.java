package com.surework.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * Unit tests for TenantContextValidationFilter.
 *
 * These tests verify that:
 * 1. Requests without tenant context are rejected
 * 2. Public paths bypass tenant validation
 * 3. Requests with valid tenant context pass through
 */
@ExtendWith(MockitoExtension.class)
public class TenantContextValidationFilterTest {

    private TenantContextValidationFilter filter;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        filter = new TenantContextValidationFilter();
        TenantContext.clear();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Should reject request when tenant context is not set for protected path")
    void shouldRejectRequest_WhenTenantContextNotSet() throws Exception {
        // Given
        when(request.getRequestURI()).thenReturn("/api/employees");
        StringWriter responseWriter = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));

        // When
        filter.doFilter(request, response, filterChain);

        // Then
        verify(response).setStatus(403);
        verify(filterChain, never()).doFilter(request, response);
        assertThat(responseWriter.toString()).contains("TENANT_CONTEXT_REQUIRED");
    }

    @Test
    @DisplayName("Should allow request when tenant context is set")
    void shouldAllowRequest_WhenTenantContextIsSet() throws Exception {
        // Given
        when(request.getRequestURI()).thenReturn("/api/employees");
        TenantContext.setTenantId(UUID.randomUUID());

        // When
        filter.doFilter(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        verify(response, never()).setStatus(403);
    }

    @Test
    @DisplayName("Should allow request for actuator endpoints without tenant context")
    void shouldAllowRequest_ForActuatorEndpoints() throws Exception {
        // Given
        when(request.getRequestURI()).thenReturn("/actuator/health");

        // When
        filter.doFilter(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        verify(response, never()).setStatus(403);
    }

    @Test
    @DisplayName("Should allow request for swagger endpoints without tenant context")
    void shouldAllowRequest_ForSwaggerEndpoints() throws Exception {
        // Given
        when(request.getRequestURI()).thenReturn("/swagger-ui/index.html");

        // When
        filter.doFilter(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        verify(response, never()).setStatus(403);
    }

    @Test
    @DisplayName("Should allow request for login endpoint without tenant context")
    void shouldAllowRequest_ForLoginEndpoint() throws Exception {
        // Given
        when(request.getRequestURI()).thenReturn("/api/auth/login");

        // When
        filter.doFilter(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        verify(response, never()).setStatus(403);
    }

    @Test
    @DisplayName("Should allow request for custom public paths")
    void shouldAllowRequest_ForCustomPublicPaths() throws Exception {
        // Given
        filter = new TenantContextValidationFilter(List.of("/api/public/careers/**"));
        when(request.getRequestURI()).thenReturn("/api/public/careers/jobs");

        // When
        filter.doFilter(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        verify(response, never()).setStatus(403);
    }

    @Test
    @DisplayName("Should reject request for API paths without tenant context")
    void shouldRejectRequest_ForApiPathsWithoutTenantContext() throws Exception {
        // Given
        when(request.getRequestURI()).thenReturn("/api/payroll/runs");
        StringWriter responseWriter = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));

        // When
        filter.doFilter(request, response, filterChain);

        // Then
        verify(response).setStatus(403);
        verify(filterChain, never()).doFilter(request, response);
    }
}
