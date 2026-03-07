package com.surework.hr.config;

import com.surework.common.security.TenantContextValidationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Security configuration for HR Service.
 *
 * Security Architecture:
 * 1. API Gateway validates JWT tokens and forwards user claims as headers
 * 2. JwtHeaderAuthenticationFilter reads headers and creates SecurityContext
 * 3. @PreAuthorize annotations on controllers enforce role-based access
 *
 * Role Hierarchy:
 * - SUPER_ADMIN: Full system access
 * - TENANT_ADMIN: Full access within tenant
 * - HR_MANAGER: Leave management (LEAVE_MANAGE permission)
 * - DEPARTMENT_MANAGER: Leave approval (LEAVE_APPROVE permission)
 * - PAYROLL_ADMIN: Leave read only (LEAVE_READ permission)
 * - EMPLOYEE: Leave request (LEAVE_REQUEST permission)
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtHeaderAuthenticationFilter jwtHeaderAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Allow actuator endpoints (health checks, metrics)
                .requestMatchers("/actuator/**").permitAll()
                // Allow OPTIONS requests for CORS preflight
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                // OpenAPI documentation
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                // All API requests require authentication via JWT header filter
                .requestMatchers("/api/**").authenticated()
                // All other requests require authentication
                .anyRequest().authenticated()
            )
            // Add JWT header filter before UsernamePasswordAuthenticationFilter
            .addFilterBefore(jwtHeaderAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            // Add tenant context validation filter after JWT filter
            .addFilterAfter(new TenantContextValidationFilter(), JwtHeaderAuthenticationFilter.class);

        return http.build();
    }
}
