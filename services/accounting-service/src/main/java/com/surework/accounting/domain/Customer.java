package com.surework.accounting.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Represents a customer for invoicing purposes.
 * Stores customer details, contact information, and billing preferences.
 */
@Entity
@Table(name = "customers", indexes = {
        @Index(name = "idx_customers_code", columnList = "customer_code"),
        @Index(name = "idx_customers_name", columnList = "customer_name"),
        @Index(name = "idx_customers_email", columnList = "email"),
        @Index(name = "idx_customers_tenant", columnList = "tenant_id")
})
@Getter
@Setter
@NoArgsConstructor
public class Customer extends BaseEntity {

    @Column(name = "customer_code", nullable = false, unique = true, length = 20)
    private String customerCode;

    @Column(name = "customer_name", nullable = false, length = 200)
    private String customerName;

    @Column(name = "trading_name", length = 200)
    private String tradingName;

    // Contact information
    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "mobile", length = 50)
    private String mobile;

    @Column(name = "fax", length = 50)
    private String fax;

    @Column(name = "website", length = 255)
    private String website;

    // Contact person
    @Column(name = "contact_person", length = 200)
    private String contactPerson;

    @Column(name = "contact_email", length = 255)
    private String contactEmail;

    @Column(name = "contact_phone", length = 50)
    private String contactPhone;

    // Physical address
    @Column(name = "address_line1", length = 255)
    private String addressLine1;

    @Column(name = "address_line2", length = 255)
    private String addressLine2;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "province", length = 100)
    private String province;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(name = "country", length = 100)
    private String country = "South Africa";

    // Billing address
    @Column(name = "billing_address_line1", length = 255)
    private String billingAddressLine1;

    @Column(name = "billing_address_line2", length = 255)
    private String billingAddressLine2;

    @Column(name = "billing_city", length = 100)
    private String billingCity;

    @Column(name = "billing_province", length = 100)
    private String billingProvince;

    @Column(name = "billing_postal_code", length = 20)
    private String billingPostalCode;

    @Column(name = "billing_country", length = 100)
    private String billingCountry;

    // Tax details
    @Column(name = "vat_number", length = 20)
    private String vatNumber;

    @Column(name = "tax_exempt")
    private boolean taxExempt = false;

    // Financial settings
    @Column(name = "payment_terms")
    private int paymentTerms = 30;

    @Column(name = "credit_limit", precision = 15, scale = 2)
    private BigDecimal creditLimit = BigDecimal.ZERO;

    @Column(name = "currency", length = 3)
    private String currency = "ZAR";

    // Default accounts
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_revenue_account_id")
    private Account defaultRevenueAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_receivable_account_id")
    private Account defaultReceivableAccount;

    // Status
    @Column(name = "active")
    private boolean active = true;

    // Notes
    @Column(name = "notes", length = 2000)
    private String notes;

    // Multi-tenant
    @Column(name = "tenant_id")
    private UUID tenantId;

    /**
     * Create a new customer.
     */
    public static Customer create(String customerCode, String customerName) {
        Customer customer = new Customer();
        customer.setCustomerCode(customerCode);
        customer.setCustomerName(customerName);
        customer.setActive(true);
        return customer;
    }

    /**
     * Get full physical address as formatted string.
     */
    public String getFullAddress() {
        StringBuilder sb = new StringBuilder();
        if (addressLine1 != null && !addressLine1.isBlank()) {
            sb.append(addressLine1);
        }
        if (addressLine2 != null && !addressLine2.isBlank()) {
            if (sb.length() > 0) sb.append("\n");
            sb.append(addressLine2);
        }
        if (city != null && !city.isBlank()) {
            if (sb.length() > 0) sb.append("\n");
            sb.append(city);
            if (postalCode != null && !postalCode.isBlank()) {
                sb.append(", ").append(postalCode);
            }
        }
        if (province != null && !province.isBlank()) {
            if (sb.length() > 0) sb.append("\n");
            sb.append(province);
        }
        if (country != null && !country.isBlank()) {
            if (sb.length() > 0) sb.append("\n");
            sb.append(country);
        }
        return sb.toString();
    }

    /**
     * Get billing address as formatted string.
     * Falls back to physical address if billing address not set.
     */
    public String getFullBillingAddress() {
        if (billingAddressLine1 == null || billingAddressLine1.isBlank()) {
            return getFullAddress();
        }

        StringBuilder sb = new StringBuilder();
        sb.append(billingAddressLine1);
        if (billingAddressLine2 != null && !billingAddressLine2.isBlank()) {
            sb.append("\n").append(billingAddressLine2);
        }
        if (billingCity != null && !billingCity.isBlank()) {
            sb.append("\n").append(billingCity);
            if (billingPostalCode != null && !billingPostalCode.isBlank()) {
                sb.append(", ").append(billingPostalCode);
            }
        }
        if (billingProvince != null && !billingProvince.isBlank()) {
            sb.append("\n").append(billingProvince);
        }
        if (billingCountry != null && !billingCountry.isBlank()) {
            sb.append("\n").append(billingCountry);
        }
        return sb.toString();
    }

    /**
     * Get display name (trading name if set, otherwise customer name).
     */
    public String getDisplayName() {
        return tradingName != null && !tradingName.isBlank() ? tradingName : customerName;
    }

    /**
     * Check if customer is VAT registered.
     */
    public boolean isVatRegistered() {
        return vatNumber != null && !vatNumber.isBlank();
    }
}
