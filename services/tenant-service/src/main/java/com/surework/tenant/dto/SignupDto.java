package com.surework.tenant.dto;

import jakarta.validation.constraints.*;

import java.util.UUID;

/**
 * DTOs for self-service tenant signup.
 */
public sealed interface SignupDto {

    /**
     * Request to create a new tenant via self-service signup.
     * Compliance, contact, and address details are collected post-signup via settings pages.
     */
    record SignupRequest(
            @NotBlank @Email @Size(max = 255)
            String email,

            @NotBlank @Size(min = 12)
            @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$",
                     message = "Password must contain uppercase, lowercase, digit, and special character")
            String password,

            @NotBlank @Size(min = 2, max = 50)
            String firstName,

            @NotBlank @Size(min = 2, max = 50)
            String lastName,

            @NotBlank @Size(min = 2, max = 200)
            String companyName,

            @NotBlank
            String companyType,

            @AssertTrue(message = "You must accept the terms of service")
            boolean acceptTerms
    ) implements SignupDto {}

    /**
     * Request to verify a signup via emailed one-time code.
     */
    record VerifyRequest(
            @NotBlank @Email
            String email,

            @NotBlank @Size(min = 6, max = 6)
            @Pattern(regexp = "\\d{6}", message = "Code must be 6 digits")
            String code
    ) implements SignupDto {}

    /**
     * Request to resend a verification code to the given email.
     */
    record ResendCodeRequest(
            @NotBlank @Email
            String email
    ) implements SignupDto {}

    /**
     * Response returned after successful email verification and tenant activation.
     */
    record VerifyResponse(
            String accessToken,
            String refreshToken,
            long expiresIn
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
