package com.surework.tenant.service;

import com.surework.common.web.exception.ConflictException;
import com.surework.common.web.exception.ResourceNotFoundException;
import com.surework.tenant.domain.Tenant;
import com.surework.tenant.domain.TenantActivity;
import com.surework.tenant.dto.TenantDto;
import com.surework.tenant.repository.TenantActivityRepository;
import com.surework.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
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
    private final TenantActivityRepository activityRepository;
    private final SchemaProvisioningService schemaProvisioningService;

    @Override
    @Transactional
    public TenantDto.Response createTenant(TenantDto.CreateRequest request) {
        // Generate code from name
        String code = Tenant.generateCode(request.name());

        // Validate uniqueness
        if (tenantRepository.existsByCode(code)) {
            throw ConflictException.duplicate("Tenant with code", code);
        }
        if (tenantRepository.existsByName(request.name())) {
            throw ConflictException.duplicate("Tenant with name", request.name());
        }
        if (tenantRepository.existsByRegistrationNumber(request.registrationNumber())) {
            throw ConflictException.duplicate("Tenant with registration number", request.registrationNumber());
        }

        // Generate schema name
        String dbSchema = Tenant.generateSchemaName(code);

        // Create tenant entity
        Tenant tenant = new Tenant();
        tenant.setCode(code);
        tenant.setName(request.name());
        tenant.setTradingName(request.tradingName());
        tenant.setRegistrationNumber(request.registrationNumber());
        tenant.setTaxNumber(request.taxNumber());
        tenant.setVatNumber(request.vatNumber());
        tenant.setUifReference(request.uifReference());
        tenant.setSdlNumber(request.sdlNumber());
        tenant.setPayeReference(request.payeReference());

        // Set company type
        if (request.companyType() != null) {
            try {
                tenant.setCompanyType(Tenant.CompanyType.valueOf(request.companyType()));
            } catch (IllegalArgumentException e) {
                tenant.setCompanyType(Tenant.CompanyType.PRIVATE_COMPANY);
            }
        }

        tenant.setIndustrySector(request.industrySector());
        tenant.setEmail(request.email());
        tenant.setPhoneNumber(request.phoneNumber());
        tenant.setAddressLine1(request.addressLine1());
        tenant.setCity(request.city());
        tenant.setProvince(request.province());
        tenant.setPostalCode(request.postalCode());
        tenant.setDbSchema(dbSchema);
        tenant.setStatus(Tenant.TenantStatus.PENDING);
        tenant.setSubscriptionTier(Tenant.SubscriptionTier.FREE);
        tenant.setSubscriptionStart(LocalDate.now());
        tenant.setSubscriptionEnd(LocalDate.now().plusDays(14)); // 14-day trial
        tenant.setMaxUsers(5); // Trial limit

        tenant = tenantRepository.save(tenant);

        log.info("Created tenant {} with schema {}", tenant.getId(), dbSchema);

        // Provision schema asynchronously
        schemaProvisioningService.provisionSchema(tenant.getId(), dbSchema);

        return TenantDto.Response.fromEntity(tenant);
    }

    @Override
    @Transactional
    public TenantDto.Response updateTenant(UUID tenantId, TenantDto.UpdateRequest request) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", tenantId));

        if (request.name() != null) {
            tenant.setName(request.name());
        }
        if (request.tradingName() != null) {
            tenant.setTradingName(request.tradingName());
        }
        if (request.taxNumber() != null) {
            tenant.setTaxNumber(request.taxNumber());
        }
        if (request.vatNumber() != null) {
            tenant.setVatNumber(request.vatNumber());
        }
        if (request.uifReference() != null) {
            tenant.setUifReference(request.uifReference());
        }
        if (request.sdlNumber() != null) {
            tenant.setSdlNumber(request.sdlNumber());
        }
        if (request.payeReference() != null) {
            tenant.setPayeReference(request.payeReference());
        }
        if (request.companyType() != null) {
            try {
                tenant.setCompanyType(Tenant.CompanyType.valueOf(request.companyType()));
            } catch (IllegalArgumentException ignored) {}
        }
        if (request.industrySector() != null) {
            tenant.setIndustrySector(request.industrySector());
        }
        if (request.email() != null) {
            tenant.setEmail(request.email());
        }
        if (request.phoneNumber() != null) {
            tenant.setPhoneNumber(request.phoneNumber());
        }
        if (request.addressLine1() != null) {
            tenant.setAddressLine1(request.addressLine1());
        }
        if (request.city() != null) {
            tenant.setCity(request.city());
        }
        if (request.province() != null) {
            tenant.setProvince(request.province());
        }
        if (request.postalCode() != null) {
            tenant.setPostalCode(request.postalCode());
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
        return tenantRepository.findByCode(subdomain)
                .map(TenantDto.Response::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TenantDto.Response> listTenants(Tenant.TenantStatus status) {
        List<Tenant> tenants = status != null
                ? tenantRepository.findByStatus(status)
                : tenantRepository.findAll();

        return tenants.stream()
                .map(TenantDto.Response::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public TenantDto.Response activateTenant(UUID tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", tenantId));

        if (tenant.getStatus() != Tenant.TenantStatus.PENDING &&
            tenant.getStatus() != Tenant.TenantStatus.TRIAL) {
            throw new IllegalStateException("Only pending or trial tenants can be activated");
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
        tenant.setSuspensionReason(reason);
        tenant = tenantRepository.save(tenant);

        log.info("Suspended tenant {} - reason: {}", tenantId, reason);
        return TenantDto.Response.fromEntity(tenant);
    }

    @Override
    @Transactional
    public TenantDto.Response deactivateTenant(UUID tenantId, String reason) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", tenantId));

        tenant.setStatus(Tenant.TenantStatus.TERMINATED);
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
            case FREE -> tenant.setMaxUsers(5);
            case STARTER -> tenant.setMaxUsers(10);
            case PROFESSIONAL -> tenant.setMaxUsers(50);
            case ENTERPRISE, UNLIMITED -> tenant.setMaxUsers(null); // Unlimited
        }

        tenant = tenantRepository.save(tenant);

        log.info("Updated subscription for tenant {} to {}", tenantId, tier);
        return TenantDto.Response.fromEntity(tenant);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isSubdomainAvailable(String subdomain) {
        return !tenantRepository.existsByCode(subdomain);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TenantDto.Response> searchTenants(Tenant.TenantStatus status, String searchTerm, Pageable pageable) {
        return tenantRepository.searchTenants(status, searchTerm, pageable)
                .map(TenantDto.Response::fromEntity);
    }

    // === Stuck Onboarding Operations ===

    @Override
    @Transactional(readOnly = true)
    public Page<TenantDto.StuckOnboardingResponse> getStuckOnboarding(int daysStuck, Pageable pageable) {
        Instant cutoffDate = Instant.now().minus(daysStuck, ChronoUnit.DAYS);
        List<Tenant> onboardingTenants = tenantRepository.findOnboardingTenants();

        List<TenantDto.StuckOnboardingResponse> stuckTenants = new ArrayList<>();

        for (Tenant tenant : onboardingTenants) {
            Optional<Instant> lastActivity = activityRepository.findLatestActivityTime(tenant.getId());
            Instant activityTime = lastActivity.orElse(tenant.getCreatedAt());

            if (activityTime.isBefore(cutoffDate)) {
                int stepsCompleted = calculateOnboardingSteps(tenant.getId());
                String nextStep = determineNextOnboardingStep(tenant.getId(), stepsCompleted);

                stuckTenants.add(TenantDto.StuckOnboardingResponse.fromEntity(
                        tenant, activityTime, stepsCompleted, nextStep));
            }
        }

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), stuckTenants.size());
        List<TenantDto.StuckOnboardingResponse> pageContent = stuckTenants.subList(start, end);

        return new PageImpl<>(pageContent, pageable, stuckTenants.size());
    }

    private int calculateOnboardingSteps(UUID tenantId) {
        int steps = 0;
        if (activityRepository.existsByTenantIdAndActivityType(tenantId, TenantActivity.ActivityType.TENANT_CREATED)) steps++;
        if (activityRepository.existsByTenantIdAndActivityType(tenantId, TenantActivity.ActivityType.ADMIN_USER_CREATED)) steps++;
        if (activityRepository.existsByTenantIdAndActivityType(tenantId, TenantActivity.ActivityType.FIRST_LOGIN)) steps++;
        if (activityRepository.existsByTenantIdAndActivityType(tenantId, TenantActivity.ActivityType.FIRST_EMPLOYEE_ADDED)) steps++;
        if (activityRepository.existsByTenantIdAndActivityType(tenantId, TenantActivity.ActivityType.ONBOARDING_COMPLETED)) steps++;
        return steps;
    }

    private String determineNextOnboardingStep(UUID tenantId, int stepsCompleted) {
        return switch (stepsCompleted) {
            case 0 -> "Complete tenant registration";
            case 1 -> "Create admin user account";
            case 2 -> "Log in to the platform";
            case 3 -> "Add your first employee";
            case 4 -> "Complete onboarding checklist";
            default -> "Onboarding complete";
        };
    }

    @Override
    @Transactional
    public void sendOnboardingHelp(UUID tenantId, String message, UUID adminId, String adminName) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", tenantId));

        // Record the help activity
        TenantActivity activity = TenantActivity.create(
                tenantId,
                TenantActivity.ActivityType.SUPPORT_HELP_SENT,
                "Onboarding help sent: " + message.substring(0, Math.min(100, message.length())),
                adminId,
                adminName
        );
        activity.setMetadata("{\"fullMessage\": \"" + message.replace("\"", "\\\"") + "\"}");
        activityRepository.save(activity);

        log.info("Sent onboarding help to tenant {} by admin {}", tenantId, adminId);

        // TODO: Integrate with notification service to send email
    }

    // === Activity Operations ===

    @Override
    @Transactional(readOnly = true)
    public Page<TenantDto.ActivityResponse> getTenantActivity(UUID tenantId, Pageable pageable) {
        // Verify tenant exists
        if (!tenantRepository.existsById(tenantId)) {
            throw new ResourceNotFoundException("Tenant", tenantId);
        }

        return activityRepository.findByTenantIdOrderByCreatedAtDesc(tenantId, pageable)
                .map(TenantDto.ActivityResponse::fromEntity);
    }

    @Override
    @Transactional
    public void recordActivity(UUID tenantId, TenantActivity.ActivityType type,
                               String description, UUID userId, String userName) {
        TenantActivity activity = TenantActivity.create(tenantId, type, description, userId, userName);
        activityRepository.save(activity);
        log.debug("Recorded activity {} for tenant {}", type, tenantId);
    }

    // === Stats Operations ===

    @Override
    @Transactional(readOnly = true)
    public TenantDto.StatsResponse getTenantStats() {
        long total = tenantRepository.count();
        long active = tenantRepository.countByStatus(Tenant.TenantStatus.ACTIVE);
        long trial = tenantRepository.countByStatus(Tenant.TenantStatus.TRIAL);
        long pending = tenantRepository.countByStatus(Tenant.TenantStatus.PENDING);
        long suspended = tenantRepository.countByStatus(Tenant.TenantStatus.SUSPENDED);

        Instant monthStart = Instant.now().truncatedTo(ChronoUnit.DAYS).minus(30, ChronoUnit.DAYS);
        Instant weekStart = Instant.now().truncatedTo(ChronoUnit.DAYS).minus(7, ChronoUnit.DAYS);

        long createdThisMonth = tenantRepository.countCreatedSince(monthStart);
        long createdThisWeek = tenantRepository.countCreatedSince(weekStart);

        return new TenantDto.StatsResponse(
                total, active, trial, pending, suspended,
                createdThisMonth, createdThisWeek
        );
    }

    // === Trial Management Operations ===

    @Override
    @Transactional(readOnly = true)
    public Page<TenantDto.TrialTenantResponse> getActiveTrials(Integer expiringInDays, Pageable pageable) {
        Page<Tenant> trials;

        if (expiringInDays != null) {
            LocalDate expiryDate = LocalDate.now().plusDays(expiringInDays);
            trials = tenantRepository.findExpiringTrials(expiryDate, pageable);
        } else {
            trials = tenantRepository.findTrialTenants(pageable);
        }

        return trials.map(tenant -> {
            Optional<Instant> lastActivity = activityRepository.findLatestActivityTime(tenant.getId());
            boolean hasLoggedIn = activityRepository.existsByTenantIdAndActivityType(
                    tenant.getId(), TenantActivity.ActivityType.FIRST_LOGIN);

            return TenantDto.TrialTenantResponse.fromEntity(
                    tenant,
                    0, // User count would need integration with identity service
                    hasLoggedIn,
                    lastActivity.orElse(null)
            );
        });
    }

    @Override
    @Transactional(readOnly = true)
    public TenantDto.TrialStatsResponse getTrialStats() {
        long totalTrials = tenantRepository.countByStatus(Tenant.TenantStatus.TRIAL);
        long activeTrials = totalTrials;

        LocalDate sevenDaysFromNow = LocalDate.now().plusDays(7);
        long expiringIn7Days = tenantRepository.findExpiringTrials(sevenDaysFromNow, Pageable.unpaged()).getTotalElements();

        long expiredTrials = tenantRepository.countExpiredTrials(LocalDate.now());
        long convertedTrials = tenantRepository.countConvertedTrials();

        double conversionRate = (totalTrials + convertedTrials) > 0
                ? (convertedTrials * 100.0) / (totalTrials + convertedTrials)
                : 0.0;

        return new TenantDto.TrialStatsResponse(
                totalTrials,
                activeTrials,
                expiringIn7Days,
                expiredTrials,
                conversionRate,
                14.0 // Default trial duration
        );
    }

    @Override
    @Transactional
    public TenantDto.Response extendTrial(UUID tenantId, int days, String reason) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", tenantId));

        if (tenant.getStatus() != Tenant.TenantStatus.TRIAL &&
            tenant.getStatus() != Tenant.TenantStatus.PENDING) {
            throw new IllegalStateException("Can only extend trial for TRIAL or PENDING tenants");
        }

        LocalDate currentEnd = tenant.getSubscriptionEnd();
        if (currentEnd == null) {
            currentEnd = LocalDate.now();
        }
        tenant.setSubscriptionEnd(currentEnd.plusDays(days));

        tenant = tenantRepository.save(tenant);

        // Record activity
        TenantActivity activity = TenantActivity.create(
                tenantId,
                TenantActivity.ActivityType.SUBSCRIPTION_CHANGED,
                "Trial extended by " + days + " days. Reason: " + (reason != null ? reason : "N/A")
        );
        activityRepository.save(activity);

        log.info("Extended trial for tenant {} by {} days", tenantId, days);
        return TenantDto.Response.fromEntity(tenant);
    }

    @Override
    @Transactional
    public TenantDto.Response convertToPaid(UUID tenantId, Tenant.SubscriptionTier tier,
                                             String billingPeriod, String discountCode) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", tenantId));

        if (tenant.getStatus() != Tenant.TenantStatus.TRIAL &&
            tenant.getStatus() != Tenant.TenantStatus.PENDING) {
            throw new IllegalStateException("Can only convert TRIAL or PENDING tenants to paid");
        }

        tenant.setStatus(Tenant.TenantStatus.ACTIVE);
        tenant.setSubscriptionTier(tier);
        tenant.setActivatedAt(Instant.now());
        tenant.setSubscriptionStart(LocalDate.now());

        // Set subscription end based on billing period
        if ("yearly".equalsIgnoreCase(billingPeriod)) {
            tenant.setSubscriptionEnd(LocalDate.now().plusYears(1));
        } else {
            tenant.setSubscriptionEnd(LocalDate.now().plusMonths(1));
        }

        // Update user limits based on tier
        switch (tier) {
            case STARTER -> tenant.setMaxUsers(10);
            case PROFESSIONAL -> tenant.setMaxUsers(50);
            case ENTERPRISE, UNLIMITED -> tenant.setMaxUsers(null);
            default -> tenant.setMaxUsers(5);
        }

        tenant = tenantRepository.save(tenant);

        // Record activity
        TenantActivity activity = TenantActivity.create(
                tenantId,
                TenantActivity.ActivityType.SUBSCRIPTION_CHANGED,
                "Converted to paid plan: " + tier + " (" + billingPeriod + ")"
        );
        activityRepository.save(activity);

        log.info("Converted tenant {} to paid tier {}", tenantId, tier);
        return TenantDto.Response.fromEntity(tenant);
    }

    // === Impersonation Operations ===

    @Override
    @Transactional
    public TenantDto.ImpersonateResponse generateImpersonationToken(UUID tenantId, UUID adminId, String adminName) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant", tenantId));

        // Generate a temporary impersonation token
        String token = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plus(1, ChronoUnit.HOURS);

        // Record the impersonation activity
        TenantActivity activity = TenantActivity.create(
                tenantId,
                TenantActivity.ActivityType.IMPERSONATION_STARTED,
                "Impersonation started by admin: " + adminName,
                adminId,
                adminName
        );
        activityRepository.save(activity);

        log.info("Generated impersonation token for tenant {} by admin {}", tenantId, adminId);

        // TODO: Store token in Redis for validation

        return new TenantDto.ImpersonateResponse(
                tenantId,
                tenant.getCode(),
                tenant.getName(),
                token,
                expiresAt,
                "/admin/impersonate?token=" + token + "&tenant=" + tenant.getCode()
        );
    }
}
