package com.surework.tenant.dto;

import com.surework.tenant.domain.Tenant;
import com.surework.tenant.domain.TenantActivity;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
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
            String name,

            String tradingName,

            @NotBlank(message = "Registration number is required")
            String registrationNumber,

            String taxNumber,
            String vatNumber,
            String uifReference,
            String sdlNumber,
            String payeReference,

            String companyType,
            String industrySector,

            @NotBlank(message = "Email is required")
            @Email(message = "Invalid email format")
            String email,

            @NotBlank(message = "Phone is required")
            @Pattern(regexp = "^\\+27[0-9]{9}$", message = "Phone must be South African format (+27xxxxxxxxx)")
            String phoneNumber,

            String addressLine1,
            String city,
            String province,
            String postalCode
    ) implements TenantDto {}

    /**
     * Request to update tenant details.
     */
    record UpdateRequest(
            @Size(min = 2, max = 200, message = "Company name must be between 2 and 200 characters")
            String name,

            String tradingName,
            String taxNumber,
            String vatNumber,
            String uifReference,
            String sdlNumber,
            String payeReference,

            String companyType,
            String industrySector,

            @Email(message = "Invalid email format")
            String email,

            @Pattern(regexp = "^\\+27[0-9]{9}$", message = "Phone must be South African format (+27xxxxxxxxx)")
            String phoneNumber,

            String addressLine1,
            String city,
            String province,
            String postalCode
    ) implements TenantDto {}

    /**
     * Tenant response DTO.
     */
    record Response(
            UUID id,
            String code,
            String name,
            String tradingName,
            String dbSchema,
            String registrationNumber,
            String taxNumber,
            String vatNumber,
            String uifReference,
            String sdlNumber,
            String payeReference,
            Tenant.CompanyType companyType,
            String industrySector,
            String email,
            String phoneNumber,
            String addressLine1,
            String city,
            String province,
            String postalCode,
            Tenant.TenantStatus status,
            Tenant.SubscriptionTier subscriptionTier,
            LocalDate subscriptionStart,
            LocalDate subscriptionEnd,
            Integer maxUsers,
            Instant createdAt,
            Instant updatedAt
    ) implements TenantDto {

        public static Response fromEntity(Tenant tenant) {
            return new Response(
                    tenant.getId(),
                    tenant.getCode(),
                    tenant.getName(),
                    tenant.getTradingName(),
                    tenant.getDbSchema(),
                    tenant.getRegistrationNumber(),
                    tenant.getTaxNumber(),
                    tenant.getVatNumber(),
                    tenant.getUifReference(),
                    tenant.getSdlNumber(),
                    tenant.getPayeReference(),
                    tenant.getCompanyType(),
                    tenant.getIndustrySector(),
                    tenant.getEmail(),
                    tenant.getPhoneNumber(),
                    tenant.getAddressLine1(),
                    tenant.getCity(),
                    tenant.getProvince(),
                    tenant.getPostalCode(),
                    tenant.getStatus(),
                    tenant.getSubscriptionTier(),
                    tenant.getSubscriptionStart(),
                    tenant.getSubscriptionEnd(),
                    tenant.getMaxUsers(),
                    tenant.getCreatedAt(),
                    tenant.getUpdatedAt()
            );
        }
    }

    // === Stuck Onboarding DTOs ===

    record StuckOnboardingResponse(
            UUID id,
            String code,
            String name,
            String email,
            Tenant.TenantStatus status,
            Instant createdAt,
            Instant lastActivityAt,
            int daysSinceLastActivity,
            int onboardingStepsCompleted,
            int totalOnboardingSteps,
            String nextOnboardingStep
    ) implements TenantDto {

        public static StuckOnboardingResponse fromEntity(Tenant tenant, Instant lastActivity,
                                                          int stepsCompleted, String nextStep) {
            int daysSince = lastActivity != null
                    ? (int) java.time.Duration.between(lastActivity, Instant.now()).toDays()
                    : (int) java.time.Duration.between(tenant.getCreatedAt(), Instant.now()).toDays();

            return new StuckOnboardingResponse(
                    tenant.getId(),
                    tenant.getCode(),
                    tenant.getName(),
                    tenant.getEmail(),
                    tenant.getStatus(),
                    tenant.getCreatedAt(),
                    lastActivity,
                    daysSince,
                    stepsCompleted,
                    5, // Total onboarding steps
                    nextStep
            );
        }
    }

    record SendOnboardingHelpRequest(
            @NotBlank(message = "Message is required")
            @Size(max = 2000, message = "Message must be less than 2000 characters")
            String message
    ) implements TenantDto {}

    // === Activity DTOs ===

    record ActivityResponse(
            UUID id,
            TenantActivity.ActivityType activityType,
            String description,
            String metadata,
            UUID userId,
            String userName,
            Instant createdAt
    ) implements TenantDto {

        public static ActivityResponse fromEntity(TenantActivity activity) {
            return new ActivityResponse(
                    activity.getId(),
                    activity.getActivityType(),
                    activity.getDescription(),
                    activity.getMetadata(),
                    activity.getUserId(),
                    activity.getUserName(),
                    activity.getCreatedAt()
            );
        }
    }

    // === Stats DTOs ===

    record StatsResponse(
            long totalTenants,
            long activeTenants,
            long trialTenants,
            long pendingTenants,
            long suspendedTenants,
            long tenantsCreatedThisMonth,
            long tenantsCreatedThisWeek
    ) implements TenantDto {}

    // === Trial Management DTOs ===

    record TrialTenantResponse(
            UUID id,
            String code,
            String name,
            String email,
            Tenant.TenantStatus status,
            LocalDate trialStartDate,
            LocalDate trialEndDate,
            int daysRemaining,
            int usersCount,
            boolean hasLoggedIn,
            Instant lastActivityAt
    ) implements TenantDto {

        public static TrialTenantResponse fromEntity(Tenant tenant, int usersCount,
                                                      boolean hasLoggedIn, Instant lastActivity) {
            int daysRemaining = tenant.getSubscriptionEnd() != null
                    ? (int) java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), tenant.getSubscriptionEnd())
                    : 0;

            return new TrialTenantResponse(
                    tenant.getId(),
                    tenant.getCode(),
                    tenant.getName(),
                    tenant.getEmail(),
                    tenant.getStatus(),
                    tenant.getSubscriptionStart(),
                    tenant.getSubscriptionEnd(),
                    Math.max(0, daysRemaining),
                    usersCount,
                    hasLoggedIn,
                    lastActivity
            );
        }
    }

    record TrialStatsResponse(
            long totalTrials,
            long activeTrials,
            long expiringWithin7Days,
            long expiredTrials,
            double conversionRate,
            double avgTrialDuration
    ) implements TenantDto {}

    record ExtendTrialRequest(
            @NotNull(message = "Days to extend is required")
            @Min(value = 1, message = "Must extend by at least 1 day")
            @Max(value = 90, message = "Cannot extend by more than 90 days")
            Integer days,

            String reason
    ) implements TenantDto {}

    record ConvertTrialRequest(
            @NotNull(message = "Subscription tier is required")
            Tenant.SubscriptionTier tier,

            String billingPeriod,

            String discountCode
    ) implements TenantDto {}

    // === Impersonation DTOs ===

    record ImpersonateRequest() implements TenantDto {}

    record ImpersonateResponse(
            UUID tenantId,
            String tenantCode,
            String tenantName,
            String impersonationToken,
            Instant expiresAt,
            String redirectUrl
    ) implements TenantDto {}
}
