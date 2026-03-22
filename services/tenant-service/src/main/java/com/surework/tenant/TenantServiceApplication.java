package com.surework.tenant;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Tenant Service - Manages tenant lifecycle and schema provisioning.
 * Implements Constitution Principle VII: Multi-Tenancy (Schema-per-Tenant).
 *
 * Responsibilities:
 * - Tenant registration and management
 * - Schema provisioning for new tenants
 * - Tenant configuration and settings
 * - Subscription/billing integration points
 */
@SpringBootApplication(scanBasePackages = {
        "com.surework.tenant",
        "com.surework.common"
})
@EnableAsync
public class TenantServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(TenantServiceApplication.class, args);
    }
}
