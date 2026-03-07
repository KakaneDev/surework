package com.surework.admin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * System Administration Service Application.
 *
 * Provides comprehensive system administration for South African SMEs:
 * - Multi-tenant Management
 * - User Management & Authentication
 * - Role-Based Access Control (RBAC)
 * - System Configuration
 * - Audit Logging
 * - License Management
 */
@SpringBootApplication(scanBasePackages = {
        "com.surework.admin",
        "com.surework.common"
})
@EnableAsync
@EnableScheduling
public class AdminServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AdminServiceApplication.class, args);
    }
}
