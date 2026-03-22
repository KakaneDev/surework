package com.surework.support.config;

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
 * Security configuration for Support Service.
 *
 * Security Architecture:
 * 1. API Gateway validates JWT tokens and forwards user claims as headers
 * 2. JwtHeaderAuthenticationFilter reads headers and creates SecurityContext
 * 3. @PreAuthorize annotations on controllers enforce role-based access
 *
 * Role Hierarchy:
 * - SUPER_ADMIN: Full system access
 * - TENANT_ADMIN: Full access within tenant
 * - SUPPORT_ADMIN: Manage all tickets
 * - SUPPORT_AGENT: Manage assigned tickets
 * - Any authenticated user: Create and view own tickets
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
                // Category list is public (for ticket submission forms)
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/support/categories").permitAll()
                // All API requests require authentication via JWT header filter
                .requestMatchers("/api/**").authenticated()
                // All other requests require authentication
                .anyRequest().authenticated()
            )
            // Add JWT header filter before UsernamePasswordAuthenticationFilter
            .addFilterBefore(jwtHeaderAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
