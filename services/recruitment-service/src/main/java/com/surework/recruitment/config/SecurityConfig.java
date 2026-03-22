package com.surework.recruitment.config;

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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Security configuration for Recruitment Service.
 *
 * Security Architecture:
 * 1. API Gateway validates JWT tokens and forwards user claims as headers
 * 2. JwtHeaderAuthenticationFilter reads headers and creates SecurityContext
 * 3. @PreAuthorize annotations on controllers enforce role-based access
 *
 * Role Hierarchy:
 * - SUPER_ADMIN: Full system access
 * - TENANT_ADMIN: Full access within tenant
 * - HR_MANAGER: Full recruitment management
 * - RECRUITER: Manage candidates and interviews
 * - HIRING_MANAGER: View candidates and provide feedback
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtHeaderAuthenticationFilter jwtHeaderAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Allow actuator endpoints (health checks, metrics)
                        .requestMatchers("/actuator/**").permitAll()
                        // Allow OPTIONS requests for CORS preflight
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        // OpenAPI documentation
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        // Public job listings (for career pages)
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/recruitment/jobs/public/**").permitAll()
                        .requestMatchers("/api/public/careers/**").permitAll()
                        // All API requests require authentication via JWT header filter
                        .requestMatchers("/api/**").authenticated()
                        // All other requests require authentication
                        .anyRequest().authenticated()
                )
                // Add JWT header filter for authentication
                .addFilterBefore(jwtHeaderAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                // Add tenant context validation filter after JWT filter
                // Note: Public job listings are excluded from tenant validation
                .addFilterAfter(new TenantContextValidationFilter(
                        List.of(
                                "/api/recruitment/jobs/public/**",
                                "/api/admin/portals/**",
                                "/api/public/careers/**"
                        )), JwtHeaderAuthenticationFilter.class)
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
                "http://localhost:4200", "http://127.0.0.1:4200",
                "http://localhost:4201", "http://127.0.0.1:4201"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
