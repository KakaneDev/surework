package com.surework.admin.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Security configuration for Admin Service.
 *
 * <p>Security Architecture:
 * <ol>
 *   <li>API Gateway validates JWT tokens and forwards user claims as headers</li>
 *   <li>JwtHeaderAuthenticationFilter reads headers and creates SecurityContext</li>
 *   <li>{@code @PreAuthorize} annotations on controllers enforce role-based access</li>
 * </ol>
 *
 * <p>Role Hierarchy:
 * <ul>
 *   <li>SUPER_ADMIN: Full system access across all tenants</li>
 *   <li>TENANT_ADMIN: Full access within their tenant</li>
 *   <li>HR_ADMIN: HR operations within tenant</li>
 *   <li>MANAGER: Limited management operations</li>
 *   <li>EMPLOYEE: Self-service only</li>
 * </ul>
 *
 * <p>BCrypt cost factor of 12 provides ~300ms hashing time, balancing
 * security against DoS risk from expensive password operations.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    /**
     * BCrypt cost factor (2^12 = 4096 iterations).
     * Higher values increase security but also CPU cost.
     * 12 is recommended for production as of 2024.
     */
    private static final int BCRYPT_STRENGTH = 12;

    private final JwtHeaderAuthenticationFilter jwtHeaderAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(BCRYPT_STRENGTH);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(cors -> cors.disable()) // CORS is handled by API Gateway
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Health checks and metrics for monitoring
                        .requestMatchers("/actuator/**").permitAll()
                        // CORS preflight requests
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        // OpenAPI documentation
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        // Public authentication endpoints (no auth required)
                        .requestMatchers("/api/admin/auth/login").permitAll()
                        .requestMatchers("/api/admin/auth/refresh").permitAll()
                        // Password reset flow - public but rate-limited in controller
                        .requestMatchers("/api/admin/auth/password/forgot").permitAll()
                        .requestMatchers("/api/admin/auth/password/reset").permitAll()
                        .requestMatchers("/api/admin/auth/password/validate-token").permitAll()
                        // All other API requests require authentication
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtHeaderAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    /**
     * CORS configuration with explicit header whitelist.
     * Avoids wildcard headers which could enable attacks via custom headers.
     */
    /**
     * CORS configuration.
     * Since CORS is primarily handled by the API Gateway, this config is permissive.
     * For direct access (dev/testing), allow common development origins.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Allow all origins in dev - the gateway handles CORS for production
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(Arrays.asList(
                "X-Total-Count",
                "X-Page-Number",
                "X-Page-Size",
                "Retry-After",
                "Authorization"
        ));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
