package com.surework.admin.domain;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Tenant entity representing a company/organization in the multi-tenant system.
 */
@Entity
@Table(name = "tenants")
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name = "trading_name")
    private String tradingName;

    // South African Company Details
    @Column(name = "registration_number")
    private String registrationNumber;  // CIPC registration

    @Column(name = "tax_number")
    private String taxNumber;  // SARS tax number

    @Column(name = "vat_number")
    private String vatNumber;

    @Column(name = "uif_reference")
    private String uifReference;  // UIF employer reference

    @Column(name = "sdl_number")
    private String sdlNumber;  // Skills Development Levy number

    @Column(name = "paye_reference")
    private String payeReference;  // PAYE employer reference

    // Company Classification
    @Enumerated(EnumType.STRING)
    @Column(name = "company_type")
    private CompanyType companyType;

    @Enumerated(EnumType.STRING)
    @Column(name = "industry_sector")
    private IndustrySector industrySector;

    @Column(name = "sic_code")
    private String sicCode;  // Standard Industrial Classification

    // Contact Information
    @Embedded
    private Address physicalAddress;

    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "line1", column = @Column(name = "postal_line1")),
        @AttributeOverride(name = "line2", column = @Column(name = "postal_line2")),
        @AttributeOverride(name = "city", column = @Column(name = "postal_city")),
        @AttributeOverride(name = "province", column = @Column(name = "postal_province")),
        @AttributeOverride(name = "postalCode", column = @Column(name = "postal_code_value")),
        @AttributeOverride(name = "country", column = @Column(name = "postal_country"))
    })
    private Address postalAddress;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "email")
    private String email;

    @Column(name = "website")
    private String website;

    // Database Schema
    @Column(name = "db_schema", nullable = false)
    private String dbSchema;

    // Subscription & Licensing
    @Enumerated(EnumType.STRING)
    @Column(name = "subscription_tier")
    private SubscriptionTier subscriptionTier;

    @Column(name = "license_key")
    private String licenseKey;

    @Column(name = "max_users")
    private Integer maxUsers;

    @Column(name = "subscription_start")
    private LocalDate subscriptionStart;

    @Column(name = "subscription_end")
    private LocalDate subscriptionEnd;

    // Status
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TenantStatus status = TenantStatus.PENDING;

    @Column(name = "activated_at")
    private LocalDateTime activatedAt;

    @Column(name = "suspended_at")
    private LocalDateTime suspendedAt;

    @Column(name = "suspension_reason")
    private String suspensionReason;

    // Branding
    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "primary_color")
    private String primaryColor;

    @Column(name = "secondary_color")
    private String secondaryColor;

    // Settings
    @Column(name = "timezone")
    private String timezone = "Africa/Johannesburg";

    @Column(name = "date_format")
    private String dateFormat = "dd/MM/yyyy";

    @Column(name = "currency_code")
    private String currencyCode = "ZAR";

    @Column(name = "language_code")
    private String languageCode = "en-ZA";

    // Feature Flags
    @Column(name = "features", columnDefinition = "text[]")
    private List<String> enabledFeatures = new ArrayList<>();

    // Audit
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by")
    private UUID updatedBy;

    // Enums
    public enum CompanyType {
        SOLE_PROPRIETOR,
        PARTNERSHIP,
        PRIVATE_COMPANY,      // (Pty) Ltd
        PUBLIC_COMPANY,       // Ltd
        NON_PROFIT,           // NPC
        COOPERATIVE,
        TRUST,
        CLOSE_CORPORATION,    // CC (legacy)
        STATE_OWNED,
        FOREIGN_COMPANY
    }

    public enum IndustrySector {
        AGRICULTURE,
        MINING,
        MANUFACTURING,
        UTILITIES,
        CONSTRUCTION,
        WHOLESALE_RETAIL,
        TRANSPORT,
        ACCOMMODATION_FOOD,
        INFORMATION_COMMUNICATION,
        FINANCIAL_SERVICES,
        REAL_ESTATE,
        PROFESSIONAL_SERVICES,
        ADMINISTRATIVE_SERVICES,
        PUBLIC_ADMINISTRATION,
        EDUCATION,
        HEALTH_SOCIAL,
        ARTS_ENTERTAINMENT,
        OTHER_SERVICES
    }

    public enum SubscriptionTier {
        FREE,           // Up to 5 users
        STARTER,        // Up to 25 users
        PROFESSIONAL,   // Up to 100 users
        ENTERPRISE,     // Up to 500 users
        UNLIMITED       // No limit
    }

    public enum TenantStatus {
        PENDING,        // Awaiting activation
        ACTIVE,         // Fully operational
        SUSPENDED,      // Temporarily disabled
        TRIAL,          // In trial period
        EXPIRED,        // Subscription expired
        TERMINATED      // Permanently closed
    }

    // Business Methods
    public void activate() {
        this.status = TenantStatus.ACTIVE;
        this.activatedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void suspend(String reason) {
        this.status = TenantStatus.SUSPENDED;
        this.suspendedAt = LocalDateTime.now();
        this.suspensionReason = reason;
        this.updatedAt = LocalDateTime.now();
    }

    public void reactivate() {
        this.status = TenantStatus.ACTIVE;
        this.suspendedAt = null;
        this.suspensionReason = null;
        this.updatedAt = LocalDateTime.now();
    }

    public void terminate() {
        this.status = TenantStatus.TERMINATED;
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isActive() {
        return this.status == TenantStatus.ACTIVE || this.status == TenantStatus.TRIAL;
    }

    public boolean isSubscriptionValid() {
        if (subscriptionEnd == null) return true;
        return LocalDate.now().isBefore(subscriptionEnd) || LocalDate.now().isEqual(subscriptionEnd);
    }

    public void enableFeature(String feature) {
        if (!this.enabledFeatures.contains(feature)) {
            this.enabledFeatures.add(feature);
            this.updatedAt = LocalDateTime.now();
        }
    }

    public void disableFeature(String feature) {
        this.enabledFeatures.remove(feature);
        this.updatedAt = LocalDateTime.now();
    }

    public boolean hasFeature(String feature) {
        return this.enabledFeatures.contains(feature);
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getTradingName() { return tradingName; }
    public void setTradingName(String tradingName) { this.tradingName = tradingName; }

    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }

    public String getTaxNumber() { return taxNumber; }
    public void setTaxNumber(String taxNumber) { this.taxNumber = taxNumber; }

    public String getVatNumber() { return vatNumber; }
    public void setVatNumber(String vatNumber) { this.vatNumber = vatNumber; }

    public String getUifReference() { return uifReference; }
    public void setUifReference(String uifReference) { this.uifReference = uifReference; }

    public String getSdlNumber() { return sdlNumber; }
    public void setSdlNumber(String sdlNumber) { this.sdlNumber = sdlNumber; }

    public String getPayeReference() { return payeReference; }
    public void setPayeReference(String payeReference) { this.payeReference = payeReference; }

    public CompanyType getCompanyType() { return companyType; }
    public void setCompanyType(CompanyType companyType) { this.companyType = companyType; }

    public IndustrySector getIndustrySector() { return industrySector; }
    public void setIndustrySector(IndustrySector industrySector) { this.industrySector = industrySector; }

    public String getSicCode() { return sicCode; }
    public void setSicCode(String sicCode) { this.sicCode = sicCode; }

    public Address getPhysicalAddress() { return physicalAddress; }
    public void setPhysicalAddress(Address physicalAddress) { this.physicalAddress = physicalAddress; }

    public Address getPostalAddress() { return postalAddress; }
    public void setPostalAddress(Address postalAddress) { this.postalAddress = postalAddress; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }

    public String getDbSchema() { return dbSchema; }
    public void setDbSchema(String dbSchema) { this.dbSchema = dbSchema; }

    public SubscriptionTier getSubscriptionTier() { return subscriptionTier; }
    public void setSubscriptionTier(SubscriptionTier subscriptionTier) { this.subscriptionTier = subscriptionTier; }

    public String getLicenseKey() { return licenseKey; }
    public void setLicenseKey(String licenseKey) { this.licenseKey = licenseKey; }

    public Integer getMaxUsers() { return maxUsers; }
    public void setMaxUsers(Integer maxUsers) { this.maxUsers = maxUsers; }

    public LocalDate getSubscriptionStart() { return subscriptionStart; }
    public void setSubscriptionStart(LocalDate subscriptionStart) { this.subscriptionStart = subscriptionStart; }

    public LocalDate getSubscriptionEnd() { return subscriptionEnd; }
    public void setSubscriptionEnd(LocalDate subscriptionEnd) { this.subscriptionEnd = subscriptionEnd; }

    public TenantStatus getStatus() { return status; }
    public void setStatus(TenantStatus status) { this.status = status; }

    public LocalDateTime getActivatedAt() { return activatedAt; }
    public void setActivatedAt(LocalDateTime activatedAt) { this.activatedAt = activatedAt; }

    public LocalDateTime getSuspendedAt() { return suspendedAt; }
    public void setSuspendedAt(LocalDateTime suspendedAt) { this.suspendedAt = suspendedAt; }

    public String getSuspensionReason() { return suspensionReason; }
    public void setSuspensionReason(String suspensionReason) { this.suspensionReason = suspensionReason; }

    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    public String getPrimaryColor() { return primaryColor; }
    public void setPrimaryColor(String primaryColor) { this.primaryColor = primaryColor; }

    public String getSecondaryColor() { return secondaryColor; }
    public void setSecondaryColor(String secondaryColor) { this.secondaryColor = secondaryColor; }

    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }

    public String getDateFormat() { return dateFormat; }
    public void setDateFormat(String dateFormat) { this.dateFormat = dateFormat; }

    public String getCurrencyCode() { return currencyCode; }
    public void setCurrencyCode(String currencyCode) { this.currencyCode = currencyCode; }

    public String getLanguageCode() { return languageCode; }
    public void setLanguageCode(String languageCode) { this.languageCode = languageCode; }

    public List<String> getEnabledFeatures() { return enabledFeatures; }
    public void setEnabledFeatures(List<String> enabledFeatures) { this.enabledFeatures = enabledFeatures; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public UUID getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(UUID updatedBy) { this.updatedBy = updatedBy; }
}
