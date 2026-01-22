package com.surework.tenant.dto;

import com.surework.tenant.domain.Tenant;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

/**
 * DTOs for Tenant operations.
 */
public sealed interface TenantDto {

    /**
     * Request to create a new tenant.
     */
    record CreateRequest(
            @NotBlank(message = "Company name is required")
            @Size(min = 2, max = 200, message = "Company name must be between 2 and 200 characters")
            String companyName,

            @NotBlank(message = "Subdomain is required")
            @Pattern(regexp = "^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$",
                    message = "Subdomain must be lowercase alphanumeric with optional hyphens")
            String subdomain,

            @NotBlank(message = "Registration number is required")
            String registrationNumber,

            String vatNumber,

            @NotBlank(message = "Primary contact email is required")
            @Email(message = "Invalid email format")
            String primaryContactEmail,

            @NotBlank(message = "Primary contact phone is required")
            @Pattern(regexp = "^\\+27[0-9]{9}$", message = "Phone must be South African format (+27xxxxxxxxx)")
            String primaryContactPhone,

            @NotBlank(message = "Physical address is required")
            String physicalAddress,

            String postalAddress
    ) implements TenantDto {}

    /**
     * Request to update tenant details.
     */
    record UpdateRequest(
            @Size(min = 2, max = 200, message = "Company name must be between 2 and 200 characters")
            String companyName,

            String vatNumber,

            @Email(message = "Invalid email format")
            String primaryContactEmail,

            @Pattern(regexp = "^\\+27[0-9]{9}$", message = "Phone must be South African format (+27xxxxxxxxx)")
            String primaryContactPhone,

            String physicalAddress,

            String postalAddress
    ) implements TenantDto {}

    /**
     * Tenant response DTO.
     */
    record Response(
            UUID id,
            String companyName,
            String subdomain,
            String schemaName,
            String registrationNumber,
            String vatNumber,
            String primaryContactEmail,
            String primaryContactPhone,
            String physicalAddress,
            String postalAddress,
            Tenant.TenantStatus status,
            Tenant.SubscriptionTier subscriptionTier,
            Instant subscriptionStartDate,
            Instant subscriptionEndDate,
            Integer maxEmployees,
            Integer maxUsers,
            Instant createdAt,
            Instant updatedAt
    ) implements TenantDto {

        public static Response fromEntity(Tenant tenant) {
            return new Response(
                    tenant.getId(),
                    tenant.getCompanyName(),
                    tenant.getSubdomain(),
                    tenant.getSchemaName(),
                    tenant.getRegistrationNumber(),
                    tenant.getVatNumber(),
                    tenant.getPrimaryContactEmail(),
                    tenant.getPrimaryContactPhone(),
                    tenant.getPhysicalAddress(),
                    tenant.getPostalAddress(),
                    tenant.getStatus(),
                    tenant.getSubscriptionTier(),
                    tenant.getSubscriptionStartDate(),
                    tenant.getSubscriptionEndDate(),
                    tenant.getMaxEmployees(),
                    tenant.getMaxUsers(),
                    tenant.getCreatedAt(),
                    tenant.getUpdatedAt()
            );
        }
    }
}
