package com.surework.tenant.controller;

import com.surework.common.web.exception.ResourceNotFoundException;
import com.surework.tenant.domain.Tenant;
import com.surework.tenant.dto.TenantDto;
import com.surework.tenant.service.TenantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for tenant management.
 * Implements Constitution Principle I: RESTful API Design.
 */
@RestController
@RequestMapping("/api/v1/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;

    /**
     * Create a new tenant.
     */
    @PostMapping
    public ResponseEntity<TenantDto.Response> createTenant(
            @Valid @RequestBody TenantDto.CreateRequest request) {
        TenantDto.Response response = tenantService.createTenant(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get tenant by ID.
     */
    @GetMapping("/{tenantId}")
    public ResponseEntity<TenantDto.Response> getTenant(@PathVariable UUID tenantId) {
        return tenantService.getTenant(tenantId)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", tenantId));
    }

    /**
     * Get tenant by subdomain.
     */
    @GetMapping("/subdomain/{subdomain}")
    public ResponseEntity<TenantDto.Response> getTenantBySubdomain(@PathVariable String subdomain) {
        return tenantService.getTenantBySubdomain(subdomain)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", "subdomain", subdomain));
    }

    /**
     * List tenants with optional status filter.
     */
    @GetMapping
    public ResponseEntity<List<TenantDto.Response>> listTenants(
            @RequestParam(required = false) Tenant.TenantStatus status) {
        List<TenantDto.Response> tenants = tenantService.listTenants(status);
        return ResponseEntity.ok(tenants);
    }

    /**
     * Update tenant details.
     */
    @PatchMapping("/{tenantId}")
    public ResponseEntity<TenantDto.Response> updateTenant(
            @PathVariable UUID tenantId,
            @Valid @RequestBody TenantDto.UpdateRequest request) {
        TenantDto.Response response = tenantService.updateTenant(tenantId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Activate a pending tenant.
     */
    @PostMapping("/{tenantId}/activate")
    public ResponseEntity<TenantDto.Response> activateTenant(@PathVariable UUID tenantId) {
        TenantDto.Response response = tenantService.activateTenant(tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Suspend a tenant.
     */
    @PostMapping("/{tenantId}/suspend")
    public ResponseEntity<TenantDto.Response> suspendTenant(
            @PathVariable UUID tenantId,
            @RequestParam String reason) {
        TenantDto.Response response = tenantService.suspendTenant(tenantId, reason);
        return ResponseEntity.ok(response);
    }

    /**
     * Deactivate a tenant.
     */
    @PostMapping("/{tenantId}/deactivate")
    public ResponseEntity<TenantDto.Response> deactivateTenant(
            @PathVariable UUID tenantId,
            @RequestParam String reason) {
        TenantDto.Response response = tenantService.deactivateTenant(tenantId, reason);
        return ResponseEntity.ok(response);
    }

    /**
     * Update tenant subscription.
     */
    @PatchMapping("/{tenantId}/subscription")
    public ResponseEntity<TenantDto.Response> updateSubscription(
            @PathVariable UUID tenantId,
            @RequestParam Tenant.SubscriptionTier tier) {
        TenantDto.Response response = tenantService.updateSubscription(tenantId, tier);
        return ResponseEntity.ok(response);
    }

    /**
     * Check subdomain availability.
     */
    @GetMapping("/subdomain/{subdomain}/available")
    public ResponseEntity<SubdomainAvailabilityResponse> checkSubdomainAvailability(
            @PathVariable String subdomain) {
        boolean available = tenantService.isSubdomainAvailable(subdomain);
        return ResponseEntity.ok(new SubdomainAvailabilityResponse(subdomain, available));
    }

    record SubdomainAvailabilityResponse(String subdomain, boolean available) {}
}
