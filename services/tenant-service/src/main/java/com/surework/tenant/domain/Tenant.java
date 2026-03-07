package com.surework.tenant.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Tenant entity representing a company/organization in the system.
 * Implements Constitution Principle VII: Multi-Tenancy.
 */
@Entity
@Table(name = "tenants", schema = "public")
@Getter
@Setter
@NoArgsConstructor
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "code", nullable = false, unique = true)
    private String code;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "trading_name")
    private String tradingName;

    @Column(name = "registration_number")
    private String registrationNumber;

    @Column(name = "tax_number")
    private String taxNumber;

    @Column(name = "vat_number")
    private String vatNumber;

    @Column(name = "uif_reference")
    private String uifReference;

    @Column(name = "sdl_number")
    private String sdlNumber;

    @Column(name = "paye_reference")
    private String payeReference;

    @Enumerated(EnumType.STRING)
    @Column(name = "company_type")
    private CompanyType companyType;

    @Column(name = "industry_sector")
    private String industrySector;

    @Column(name = "sic_code")
    private String sicCode;

    // Physical address
    @Column(name = "address_line1")
    private String addressLine1;

    @Column(name = "address_line2")
    private String addressLine2;

    @Column(name = "city")
    private String city;

    @Column(name = "province")
    private String province;

    @Column(name = "postal_code")
    private String postalCode;

    @Column(name = "country")
    private String country = "South Africa";

    // Postal address
    @Column(name = "postal_line1")
    private String postalLine1;

    @Column(name = "postal_line2")
    private String postalLine2;

    @Column(name = "postal_city")
    private String postalCity;

    @Column(name = "postal_province")
    private String postalProvince;

    @Column(name = "postal_code_value")
    private String postalCodeValue;

    @Column(name = "postal_country")
    private String postalCountry;

    // Contact
    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "email")
    private String email;

    @Column(name = "website")
    private String website;

    // Database schema
    @Column(name = "db_schema", nullable = false)
    private String dbSchema;

    // Subscription
    @Enumerated(EnumType.STRING)
    @Column(name = "subscription_tier")
    private SubscriptionTier subscriptionTier = SubscriptionTier.FREE;

    @Column(name = "license_key")
    private String licenseKey;

    @Column(name = "max_users")
    private Integer maxUsers = 5;

    @Column(name = "subscription_start")
    private LocalDate subscriptionStart;

    @Column(name = "subscription_end")
    private LocalDate subscriptionEnd;

    // Status
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TenantStatus status = TenantStatus.PENDING;

    @Column(name = "activated_at")
    private Instant activatedAt;

    @Column(name = "suspended_at")
    private Instant suspendedAt;

    @Column(name = "suspension_reason")
    private String suspensionReason;

    @Column(name = "terminated_at")
    private Instant terminatedAt;

    // Branding
    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "primary_color")
    private String primaryColor;

    @Column(name = "secondary_color")
    private String secondaryColor;

    // Localization
    @Column(name = "timezone")
    private String timezone = "Africa/Johannesburg";

    @Column(name = "date_format")
    private String dateFormat = "dd/MM/yyyy";

    @Column(name = "currency_code")
    private String currencyCode = "ZAR";

    @Column(name = "language_code")
    private String languageCode = "en-ZA";

    // Features (stored as PostgreSQL text array)
    @Column(name = "features", columnDefinition = "text[]")
    private String[] features;

    // Audit fields
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "created_by")
    private UUID createdBy;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "updated_by")
    private UUID updatedBy;

    /**
     * Generate schema name from tenant code.
     */
    public static String generateSchemaName(String tenantCode) {
        return "tenant_" + tenantCode.toLowerCase().replaceAll("[^a-z0-9]", "_");
    }

    /**
     * Generate tenant code from company name.
     */
    public static String generateCode(String companyName) {
        return companyName.toLowerCase()
                .replaceAll("[^a-z0-9]", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }

    /**
     * Tenant status enum.
     */
    public enum TenantStatus {
        PENDING,      // Awaiting schema provisioning or email verification
        ACTIVE,       // Fully operational
        SUSPENDED,    // Temporarily disabled (e.g., payment issue)
        TRIAL,        // Trial period
        EXPIRED,      // Trial/subscription expired
        TERMINATED    // Permanently disabled
    }

    /**
     * Subscription tier enum.
     */
    public enum SubscriptionTier {
        FREE,         // Free tier with limited features
        STARTER,      // Up to 10 employees
        PROFESSIONAL, // Up to 50 employees
        ENTERPRISE,   // Unlimited employees
        UNLIMITED     // No limits
    }

    /**
     * Company type enum (South African CIPC types).
     */
    public enum CompanyType {
        SOLE_PROPRIETOR,
        PARTNERSHIP,
        PRIVATE_COMPANY,
        PUBLIC_COMPANY,
        NON_PROFIT,
        COOPERATIVE,
        TRUST,
        CLOSE_CORPORATION,
        STATE_OWNED,
        FOREIGN_COMPANY
    }
}
