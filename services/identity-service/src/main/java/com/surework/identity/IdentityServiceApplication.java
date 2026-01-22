package com.surework.identity;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Identity Service - Authentication and User Management.
 * Implements Constitution Principle V: Security (JWT Auth, MFA, RBAC).
 *
 * Responsibilities:
 * - User authentication (login/logout)
 * - JWT token management
 * - MFA (TOTP) enrollment and verification
 * - User CRUD operations
 * - Role and permission management
 * - Password management
 * - Rate limiting for login attempts
 */
@SpringBootApplication(scanBasePackages = {
        "com.surework.identity",
        "com.surework.common"
})
@EnableAsync
public class IdentityServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(IdentityServiceApplication.class, args);
    }
}
