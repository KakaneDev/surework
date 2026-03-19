package com.surework.tenant.controller;

import com.surework.common.security.TenantContext;
import com.surework.tenant.dto.TenantSetupDto;
import com.surework.tenant.service.TenantSetupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tenant/setup")
@RequiredArgsConstructor
public class TenantSetupController {

    private final TenantSetupService setupService;

    @GetMapping("/status")
    public ResponseEntity<TenantSetupDto.SetupStatusResponse> getStatus() {
        var tenantId = TenantContext.requireTenantId();
        return ResponseEntity.ok(setupService.getSetupStatus(tenantId));
    }

    @GetMapping("/company-details")
    public ResponseEntity<TenantSetupDto.CompanyDetailsResponse> getCompanyDetails() {
        var tenantId = TenantContext.requireTenantId();
        return ResponseEntity.ok(setupService.getCompanyDetails(tenantId));
    }

    @PutMapping("/company-details")
    public ResponseEntity<TenantSetupDto.SetupStatusResponse> saveCompanyDetails(
            @RequestBody @Valid TenantSetupDto.CompanyDetailsRequest request) {
        var tenantId = TenantContext.requireTenantId();
        return ResponseEntity.ok(setupService.saveCompanyDetails(tenantId, request));
    }

    @GetMapping("/compliance-details")
    public ResponseEntity<TenantSetupDto.ComplianceDetailsResponse> getComplianceDetails() {
        var tenantId = TenantContext.requireTenantId();
        return ResponseEntity.ok(setupService.getComplianceDetails(tenantId));
    }

    @PutMapping("/compliance-details")
    public ResponseEntity<TenantSetupDto.SetupStatusResponse> saveComplianceDetails(
            @RequestBody @Valid TenantSetupDto.ComplianceDetailsRequest request) {
        var tenantId = TenantContext.requireTenantId();
        return ResponseEntity.ok(setupService.saveComplianceDetails(tenantId, request));
    }
}
