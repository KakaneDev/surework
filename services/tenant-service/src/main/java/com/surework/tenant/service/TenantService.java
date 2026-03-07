package com.surework.tenant.service;

import com.surework.tenant.domain.Tenant;
import com.surework.tenant.dto.TenantDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service interface for tenant operations.
 */
public interface TenantService {

    /**
     * Create a new tenant and provision schema.
     */
    TenantDto.Response createTenant(TenantDto.CreateRequest request);

    /**
     * Update tenant details.
     */
    TenantDto.Response updateTenant(UUID tenantId, TenantDto.UpdateRequest request);

    /**
     * Get tenant by ID.
     */
    Optional<TenantDto.Response> getTenant(UUID tenantId);

    /**
     * Get tenant by subdomain.
     */
    Optional<TenantDto.Response> getTenantBySubdomain(String subdomain);

    /**
     * List all tenants with a given status.
     */
    List<TenantDto.Response> listTenants(Tenant.TenantStatus status);

    /**
     * Activate a pending tenant.
     */
    TenantDto.Response activateTenant(UUID tenantId);

    /**
     * Suspend a tenant.
     */
    TenantDto.Response suspendTenant(UUID tenantId, String reason);

    /**
     * Deactivate a tenant permanently.
     */
    TenantDto.Response deactivateTenant(UUID tenantId, String reason);

    /**
     * Update subscription tier.
     */
    TenantDto.Response updateSubscription(UUID tenantId, Tenant.SubscriptionTier tier);

    /**
     * Check if subdomain is available.
     */
    boolean isSubdomainAvailable(String subdomain);

    /**
     * Search tenants with optional status filter and search term.
     */
    Page<TenantDto.Response> searchTenants(Tenant.TenantStatus status, String searchTerm, Pageable pageable);

    // === Stuck Onboarding Operations ===

    /**
     * Get tenants stuck in onboarding.
     */
    Page<TenantDto.StuckOnboardingResponse> getStuckOnboarding(int daysStuck, Pageable pageable);

    /**
     * Send onboarding help message to a tenant.
     */
    void sendOnboardingHelp(UUID tenantId, String message, UUID adminId, String adminName);

    // === Activity Operations ===

    /**
     * Get activity feed for a tenant.
     */
    Page<TenantDto.ActivityResponse> getTenantActivity(UUID tenantId, Pageable pageable);

    /**
     * Record a tenant activity.
     */
    void recordActivity(UUID tenantId, com.surework.tenant.domain.TenantActivity.ActivityType type,
                       String description, UUID userId, String userName);

    // === Stats Operations ===

    /**
     * Get tenant statistics.
     */
    TenantDto.StatsResponse getTenantStats();

    // === Trial Management Operations ===

    /**
     * Get all active trials.
     */
    Page<TenantDto.TrialTenantResponse> getActiveTrials(Integer expiringInDays, Pageable pageable);

    /**
     * Get trial statistics.
     */
    TenantDto.TrialStatsResponse getTrialStats();

    /**
     * Extend a tenant's trial period.
     */
    TenantDto.Response extendTrial(UUID tenantId, int days, String reason);

    /**
     * Convert a trial tenant to paid.
     */
    TenantDto.Response convertToPaid(UUID tenantId, Tenant.SubscriptionTier tier,
                                      String billingPeriod, String discountCode);

    // === Impersonation Operations ===

    /**
     * Generate an impersonation token for a tenant.
     */
    TenantDto.ImpersonateResponse generateImpersonationToken(UUID tenantId, UUID adminId, String adminName);
}
