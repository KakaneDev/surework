package com.surework.tenant.service;

import com.surework.common.web.exception.ResourceNotFoundException;
import com.surework.tenant.domain.Tenant;
import com.surework.tenant.dto.TenantSetupDto;
import com.surework.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantSetupServiceImpl implements TenantSetupService {

    private final TenantRepository tenantRepository;

    @Override
    @Transactional
    public TenantSetupDto.SetupStatusResponse saveCompanyDetails(
            UUID tenantId, TenantSetupDto.CompanyDetailsRequest request) {
        var tenant = findTenant(tenantId);

        tenant.setRegistrationNumber(request.registrationNumber());
        tenant.setTradingName(request.tradingName());
        tenant.setIndustrySector(request.industrySector());
        tenant.setPhoneNumber(request.phone());
        tenant.setEmail(request.companyEmail());
        tenant.setAddressLine1(request.streetAddress());
        tenant.setCity(request.city());
        tenant.setProvince(request.province());
        tenant.setPostalCode(request.postalCode());
        tenant.setCompanyDetailsComplete(true);

        tenantRepository.save(tenant);
        log.info("Company details completed for tenant {}", tenantId);

        return new TenantSetupDto.SetupStatusResponse(
                tenant.isCompanyDetailsComplete(), tenant.isComplianceDetailsComplete());
    }

    @Override
    @Transactional
    public TenantSetupDto.SetupStatusResponse saveComplianceDetails(
            UUID tenantId, TenantSetupDto.ComplianceDetailsRequest request) {
        var tenant = findTenant(tenantId);

        tenant.setTaxNumber(request.taxNumber());
        tenant.setVatNumber(request.vatNumber());
        tenant.setUifReference(request.uifReference());
        tenant.setSdlNumber(request.sdlNumber());
        tenant.setPayeReference(request.payeReference());
        tenant.setComplianceDetailsComplete(true);

        tenantRepository.save(tenant);
        log.info("Compliance details completed for tenant {}", tenantId);

        return new TenantSetupDto.SetupStatusResponse(
                tenant.isCompanyDetailsComplete(), tenant.isComplianceDetailsComplete());
    }

    @Override
    @Transactional(readOnly = true)
    public TenantSetupDto.SetupStatusResponse getSetupStatus(UUID tenantId) {
        var tenant = findTenant(tenantId);
        return new TenantSetupDto.SetupStatusResponse(
                tenant.isCompanyDetailsComplete(), tenant.isComplianceDetailsComplete());
    }

    @Override
    @Transactional(readOnly = true)
    public TenantSetupDto.CompanyDetailsResponse getCompanyDetails(UUID tenantId) {
        var tenant = findTenant(tenantId);
        return new TenantSetupDto.CompanyDetailsResponse(
                tenant.getRegistrationNumber(), tenant.getTradingName(),
                tenant.getIndustrySector(), tenant.getPhoneNumber(),
                tenant.getEmail(), tenant.getAddressLine1(),
                tenant.getCity(), tenant.getProvince(), tenant.getPostalCode());
    }

    @Override
    @Transactional(readOnly = true)
    public TenantSetupDto.ComplianceDetailsResponse getComplianceDetails(UUID tenantId) {
        var tenant = findTenant(tenantId);
        return new TenantSetupDto.ComplianceDetailsResponse(
                tenant.getTaxNumber(), tenant.getVatNumber(),
                tenant.getUifReference(), tenant.getSdlNumber(), tenant.getPayeReference());
    }

    private Tenant findTenant(UUID tenantId) {
        return tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found: " + tenantId));
    }
}
