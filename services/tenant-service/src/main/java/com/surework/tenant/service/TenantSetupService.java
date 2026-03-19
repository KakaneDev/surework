package com.surework.tenant.service;

import com.surework.tenant.dto.TenantSetupDto;
import java.util.UUID;

public interface TenantSetupService {
    TenantSetupDto.SetupStatusResponse saveCompanyDetails(UUID tenantId, TenantSetupDto.CompanyDetailsRequest request);
    TenantSetupDto.SetupStatusResponse saveComplianceDetails(UUID tenantId, TenantSetupDto.ComplianceDetailsRequest request);
    TenantSetupDto.SetupStatusResponse getSetupStatus(UUID tenantId);
    TenantSetupDto.CompanyDetailsResponse getCompanyDetails(UUID tenantId);
    TenantSetupDto.ComplianceDetailsResponse getComplianceDetails(UUID tenantId);
}
