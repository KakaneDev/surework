package com.surework.tenant.controller;

import com.surework.tenant.dto.TenantDto;
import com.surework.tenant.service.TenantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST controller for trial management operations.
 */
@RestController
@RequestMapping("/api/v1/trials")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'SALES_ADMIN', 'Super Administrator', 'Tenant Administrator', 'Sales Administrator')")
public class TrialController {

    private final TenantService tenantService;

    /**
     * Get all active trials with optional filter for expiring soon.
     */
    @GetMapping
    public ResponseEntity<Page<TenantDto.TrialTenantResponse>> getActiveTrials(
            @RequestParam(required = false) Integer expiringInDays,
            Pageable pageable) {
        Page<TenantDto.TrialTenantResponse> trials = tenantService.getActiveTrials(expiringInDays, pageable);
        return ResponseEntity.ok(trials);
    }

    /**
     * Get trial statistics.
     */
    @GetMapping("/stats")
    public ResponseEntity<TenantDto.TrialStatsResponse> getTrialStats() {
        TenantDto.TrialStatsResponse stats = tenantService.getTrialStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * Extend a tenant's trial period.
     */
    @PostMapping("/{tenantId}/extend")
    public ResponseEntity<TenantDto.Response> extendTrial(
            @PathVariable UUID tenantId,
            @Valid @RequestBody TenantDto.ExtendTrialRequest request) {
        TenantDto.Response response = tenantService.extendTrial(
                tenantId, request.days(), request.reason());
        return ResponseEntity.ok(response);
    }

    /**
     * Convert a trial tenant to a paid subscription.
     */
    @PostMapping("/{tenantId}/convert")
    public ResponseEntity<TenantDto.Response> convertToPaid(
            @PathVariable UUID tenantId,
            @Valid @RequestBody TenantDto.ConvertTrialRequest request) {
        TenantDto.Response response = tenantService.convertToPaid(
                tenantId, request.tier(), request.billingPeriod(), request.discountCode());
        return ResponseEntity.ok(response);
    }
}
