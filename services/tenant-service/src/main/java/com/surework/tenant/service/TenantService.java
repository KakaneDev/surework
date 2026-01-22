package com.surework.tenant.service;

import com.surework.tenant.domain.Tenant;
import com.surework.tenant.dto.TenantDto;

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
}
