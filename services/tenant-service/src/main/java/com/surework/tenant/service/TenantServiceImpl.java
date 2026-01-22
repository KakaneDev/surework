package com.surework.tenant.service;

import com.surework.common.web.exception.ConflictException;
import com.surework.common.web.exception.ResourceNotFoundException;
import com.surework.tenant.domain.Tenant;
import com.surework.tenant.dto.TenantDto;
import com.surework.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementation of TenantService.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class TenantServiceImpl implements TenantService {

    private final TenantRepository tenantRepository;
    private final SchemaProvisioningService schemaProvisioningService;

    @Override
    @Transactional
    public TenantDto.Response createTenant(TenantDto.CreateRequest request) {
        // Validate uniqueness
        if (tenantRepository.existsBySubdomain(request.subdomain())) {
            throw new ConflictException("Tenant", "subdomain", request.subdomain());
        }
        if (tenantRepository.existsByCompanyName(request.companyName())) {
            throw new ConflictException("Tenant", "companyName", request.companyName());
        }
        if (tenantRepository.existsByRegistrationNumber(request.registrationNumber())) {
            throw new ConflictException("Tenant", "registrationNumber", request.registrationNumber());
        }

        // Create tenant entity
        Tenant tenant = new Tenant();
        tenant.setCompanyName(request.companyName());
        tenant.setSubdomain(request.subdomain());
        tenant.setRegistrationNumber(request.registrationNumber());
        tenant.setVatNumber(request.vatNumber() != null ? request.vatNumber() : "");
        tenant.setPrimaryContactEmail(request.primaryContactEmail());
        tenant.setPrimaryContactPhone(request.primaryContactPhone());
        tenant.setPhysicalAddress(request.physicalAddress());
        tenant.setPostalAddress(request.postalAddress() != null ? request.postalAddress() : request.physicalAddress());
        tenant.setStatus(Tenant.TenantStatus.PENDING);
        tenant.setSubscriptionTier(Tenant.SubscriptionTier.TRIAL);
        tenant.setSubscriptionStartDate(Instant.now());
        tenant.setSubscriptionEndDate(Instant.now().plus(14, ChronoUnit.DAYS)); // 14-day trial
        tenant.setMaxEmployees(10); // Trial limit
        tenant.setMaxUsers(5);      // Trial limit

        // Save to generate ID
        tenant = tenantRepository.save(tenant);

        // Generate and set schema name
        String schemaName = Tenant.generateSchemaName(tenant.getId().toString());
        tenant.setSchemaName(schemaName);
        tenant = tenantRepository.save(tenant);

        log.info("Created tenant {} with schema {}", tenant.getId(), schemaName);

        // Provision schema asynchronously
        schemaProvisioningService.provisionSchema(tenant.getId(), schemaName);

        return TenantDto.Response.fromEntity(tenant);
    }

    @Override
    @Transactional
    public TenantDto.Response updateTenant(UUID tenantId, TenantDto.UpdateRequest request) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", tenantId));

        if (request.companyName() != null) {
            tenant.setCompanyName(request.companyName());
        }
        if (request.vatNumber() != null) {
            tenant.setVatNumber(request.vatNumber());
        }
        if (request.primaryContactEmail() != null) {
            tenant.setPrimaryContactEmail(request.primaryContactEmail());
        }
        if (request.primaryContactPhone() != null) {
            tenant.setPrimaryContactPhone(request.primaryContactPhone());
        }
        if (request.physicalAddress() != null) {
            tenant.setPhysicalAddress(request.physicalAddress());
        }
        if (request.postalAddress() != null) {
            tenant.setPostalAddress(request.postalAddress());
        }

        tenant = tenantRepository.save(tenant);
        log.info("Updated tenant {}", tenantId);

        return TenantDto.Response.fromEntity(tenant);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<TenantDto.Response> getTenant(UUID tenantId) {
        return tenantRepository.findById(tenantId)
                .map(TenantDto.Response::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<TenantDto.Response> getTenantBySubdomain(String subdomain) {
        return tenantRepository.findBySubdomain(subdomain)
                .map(TenantDto.Response::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TenantDto.Response> listTenants(Tenant.TenantStatus status) {
        List<Tenant> tenants = status != null
                ? tenantRepository.findByStatus(status)
                : tenantRepository.findAll();

        return tenants.stream()
                .filter(t -> !t.isDeleted())
                .map(TenantDto.Response::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public TenantDto.Response activateTenant(UUID tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", tenantId));

        if (tenant.getStatus() != Tenant.TenantStatus.PENDING) {
            throw new IllegalStateException("Only pending tenants can be activated");
        }

        tenant.setStatus(Tenant.TenantStatus.ACTIVE);
        tenant = tenantRepository.save(tenant);

        log.info("Activated tenant {}", tenantId);
        return TenantDto.Response.fromEntity(tenant);
    }

    @Override
    @Transactional
    public TenantDto.Response suspendTenant(UUID tenantId, String reason) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", tenantId));

        tenant.setStatus(Tenant.TenantStatus.SUSPENDED);
        tenant = tenantRepository.save(tenant);

        log.info("Suspended tenant {} - reason: {}", tenantId, reason);
        return TenantDto.Response.fromEntity(tenant);
    }

    @Override
    @Transactional
    public TenantDto.Response deactivateTenant(UUID tenantId, String reason) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", tenantId));

        tenant.setStatus(Tenant.TenantStatus.DEACTIVATED);
        tenant.softDelete();
        tenant = tenantRepository.save(tenant);

        log.info("Deactivated tenant {} - reason: {}", tenantId, reason);
        return TenantDto.Response.fromEntity(tenant);
    }

    @Override
    @Transactional
    public TenantDto.Response updateSubscription(UUID tenantId, Tenant.SubscriptionTier tier) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", tenantId));

        tenant.setSubscriptionTier(tier);

        // Update limits based on tier
        switch (tier) {
            case TRIAL -> {
                tenant.setMaxEmployees(10);
                tenant.setMaxUsers(5);
            }
            case STARTER -> {
                tenant.setMaxEmployees(10);
                tenant.setMaxUsers(10);
            }
            case PROFESSIONAL -> {
                tenant.setMaxEmployees(50);
                tenant.setMaxUsers(50);
            }
            case ENTERPRISE -> {
                tenant.setMaxEmployees(null); // Unlimited
                tenant.setMaxUsers(null);     // Unlimited
            }
        }

        tenant = tenantRepository.save(tenant);

        log.info("Updated subscription for tenant {} to {}", tenantId, tier);
        return TenantDto.Response.fromEntity(tenant);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isSubdomainAvailable(String subdomain) {
        return !tenantRepository.existsBySubdomain(subdomain);
    }
}
