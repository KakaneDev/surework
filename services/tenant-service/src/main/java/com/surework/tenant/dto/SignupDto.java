package com.surework.tenant.dto;

import jakarta.validation.constraints.*;

import java.util.UUID;

/**
 * DTOs for self-service tenant signup.
 */
public sealed interface SignupDto {

    /**
     * Request to create a new tenant via self-service signup.
     */
    record SignupRequest(
            // Account Information
            @NotBlank(message = "Email is required")
            @Email(message = "Invalid email format")
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 12, message = "Password must be at least 12 characters")
            @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$",
                    message = "Password must contain uppercase, lowercase, digit, and special character")
            String password,

            @NotBlank(message = "First name is required")
            @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
            String firstName,

            @NotBlank(message = "Last name is required")
            @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
            String lastName,

            // Company Details
            @NotBlank(message = "Company name is required")
            @Size(min = 2, max = 200, message = "Company name must be between 2 and 200 characters")
            String companyName,

            @Size(max = 200, message = "Trading name must not exceed 200 characters")
            String tradingName,

            @NotBlank(message = "Registration number is required")
            @Pattern(regexp = "^\\d{4}/\\d{6}/\\d{2}$",
                    message = "Registration number must be in CIPC format (YYYY/NNNNNN/NN)")
            String registrationNumber,

            @NotBlank(message = "Company type is required")
            String companyType,

            @NotBlank(message = "Industry sector is required")
            String industrySector,

            // SARS Compliance
            @NotBlank(message = "Tax number is required")
            @Pattern(regexp = "^\\d{10}$", message = "Tax number must be 10 digits")
            String taxNumber,

            @Pattern(regexp = "^(4\\d{9})?$", message = "VAT number must be 10 digits starting with 4")
            String vatNumber,

            @NotBlank(message = "UIF reference is required")
            @Pattern(regexp = "^U\\d{8}$", message = "UIF reference must be U followed by 8 digits")
            String uifReference,

            @NotBlank(message = "SDL number is required")
            @Pattern(regexp = "^L\\d{8}$", message = "SDL number must be L followed by 8 digits")
            String sdlNumber,

            @NotBlank(message = "PAYE reference is required")
            @Pattern(regexp = "^\\d{7}/\\d{3}/\\d{4}$",
                    message = "PAYE reference must be in format NNNNNNN/NNN/NNNN")
            String payeReference,

            // Contact Information
            @NotBlank(message = "Phone number is required")
            @Pattern(regexp = "^\\+27[0-9]{9}$",
                    message = "Phone must be South African format (+27xxxxxxxxx)")
            String phone,

            @NotBlank(message = "Company email is required")
            @Email(message = "Invalid company email format")
            String companyEmail,

            // Address
            @NotBlank(message = "Street address is required")
            @Size(max = 500, message = "Street address must not exceed 500 characters")
            String streetAddress,

            @NotBlank(message = "City is required")
            @Size(max = 100, message = "City must not exceed 100 characters")
            String city,

            @NotBlank(message = "Province is required")
            String province,

            @NotBlank(message = "Postal code is required")
            @Pattern(regexp = "^\\d{4}$", message = "Postal code must be 4 digits")
            String postalCode,

            // Terms Acceptance
            @AssertTrue(message = "You must accept the terms and conditions")
            boolean acceptTerms
    ) implements SignupDto {}

    /**
     * Response after successful signup.
     */
    record SignupResponse(
            UUID tenantId,
            String subdomain,
            String message
    ) implements SignupDto {}

    /**
     * Check if email is available.
     */
    record EmailAvailabilityRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Invalid email format")
            String email
    ) implements SignupDto {}

    /**
     * Check if registration number is available.
     */
    record RegistrationNumberAvailabilityRequest(
            @NotBlank(message = "Registration number is required")
            String registrationNumber
    ) implements SignupDto {}

    /**
     * Availability check response.
     */
    record AvailabilityResponse(
            boolean available,
            String message
    ) implements SignupDto {}

    /**
     * Company types enum - matches South African business entity types.
     */
    enum CompanyType {
        PRIVATE_COMPANY("Private Company (Pty) Ltd"),
        PUBLIC_COMPANY("Public Company Ltd"),
        PERSONAL_LIABILITY("Personal Liability Company Inc"),
        STATE_OWNED("State Owned Company (SOC) Ltd"),
        NON_PROFIT("Non-Profit Company (NPC)"),
        SOLE_PROPRIETOR("Sole Proprietor"),
        PARTNERSHIP("Partnership"),
        CLOSE_CORPORATION("Close Corporation (CC)"),
        COOPERATIVE("Cooperative"),
        TRUST("Trust");

        private final String displayName;

        CompanyType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    /**
     * Industry sectors for South African businesses.
     */
    enum IndustrySector {
        AGRICULTURE("Agriculture, Forestry and Fishing"),
        MINING("Mining and Quarrying"),
        MANUFACTURING("Manufacturing"),
        UTILITIES("Electricity, Gas and Water Supply"),
        CONSTRUCTION("Construction"),
        WHOLESALE_RETAIL("Wholesale and Retail Trade"),
        TRANSPORT("Transport, Storage and Communication"),
        FINANCIAL_SERVICES("Financial Intermediation and Insurance"),
        REAL_ESTATE("Real Estate and Business Services"),
        PROFESSIONAL_SERVICES("Professional, Scientific and Technical Services"),
        PUBLIC_ADMINISTRATION("Public Administration"),
        EDUCATION("Education"),
        HEALTH_SOCIAL("Health and Social Work"),
        HOSPITALITY("Hotels and Restaurants"),
        ICT("Information and Communication Technology"),
        ARTS_ENTERTAINMENT("Arts, Entertainment and Recreation"),
        OTHER_SERVICES("Other Service Activities");

        private final String displayName;

        IndustrySector(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    /**
     * South African provinces.
     */
    enum Province {
        EC("Eastern Cape"),
        FS("Free State"),
        GP("Gauteng"),
        KZN("KwaZulu-Natal"),
        LP("Limpopo"),
        MP("Mpumalanga"),
        NC("Northern Cape"),
        NW("North West"),
        WC("Western Cape");

        private final String displayName;

        Province(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }
}
