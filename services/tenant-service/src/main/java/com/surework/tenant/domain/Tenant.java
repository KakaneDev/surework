package com.surework.tenant.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Tenant entity representing a company/organization in the system.
 * Implements Constitution Principle VII: Multi-Tenancy.
 */
@Entity
@Table(name = "tenants", schema = "public")
@Getter
@Setter
@NoArgsConstructor
public class Tenant extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String companyName;

    @Column(nullable = false, unique = true)
    private String subdomain;

    @Column(nullable = false, unique = true)
    private String schemaName;

    @Column(nullable = false)
    private String registrationNumber;

    @Column(nullable = false)
    private String vatNumber;

    @Column(nullable = false)
    private String primaryContactEmail;

    @Column(nullable = false)
    private String primaryContactPhone;

    @Column(nullable = false)
    private String physicalAddress;

    @Column(nullable = false)
    private String postalAddress;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TenantStatus status = TenantStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionTier subscriptionTier = SubscriptionTier.TRIAL;

    private Instant subscriptionStartDate;

    private Instant subscriptionEndDate;

    private Integer maxEmployees;

    private Integer maxUsers;

    @Column(columnDefinition = "jsonb")
    private String settings;

    /**
     * Generate schema name from tenant ID.
     */
    public static String generateSchemaName(String tenantId) {
        return "tenant_" + tenantId.replace("-", "");
    }

    /**
     * Tenant status enum.
     */
    public enum TenantStatus {
        PENDING,      // Awaiting schema provisioning
        ACTIVE,       // Fully operational
        SUSPENDED,    // Temporarily disabled (e.g., payment issue)
        DEACTIVATED   // Permanently disabled
    }

    /**
     * Subscription tier enum.
     */
    public enum SubscriptionTier {
        TRIAL,        // 14-day free trial
        STARTER,      // Up to 10 employees
        PROFESSIONAL, // Up to 50 employees
        ENTERPRISE    // Unlimited employees
    }
}
