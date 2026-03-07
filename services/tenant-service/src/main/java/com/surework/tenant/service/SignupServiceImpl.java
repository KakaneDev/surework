package com.surework.tenant.service;

import com.surework.common.web.exception.ConflictException;
import com.surework.tenant.client.IdentityServiceClient;
import com.surework.tenant.domain.Tenant;
import com.surework.tenant.dto.SignupDto;
import com.surework.tenant.exception.UserCreationFailedException;
import com.surework.tenant.repository.TenantRepository;
import com.surework.tenant.util.PiiMasker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Implementation of SignupService for self-service tenant registration.
 *
 * <p>Implements a simplified Saga pattern for distributed signup:
 * <ol>
 *   <li>Create tenant with PENDING status</li>
 *   <li>Call identity-service to create admin user</li>
 *   <li>On success: update tenant to TRIAL status</li>
 *   <li>On failure: update tenant to FAILED status (compensating action)</li>
 * </ol>
 *
 * <p>This ensures data consistency across services without distributed transactions.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class SignupServiceImpl implements SignupService {

    private final TenantRepository tenantRepository;
    private final IdentityServiceClient identityServiceClient;
    private final SchemaProvisioningService schemaProvisioningService;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${surework.trial.duration-days:14}")
    private int trialDurationDays;

    @Value("${surework.trial.max-users:5}")
    private int trialMaxUsers;

    @Override
    @Transactional
    public SignupDto.SignupResponse signup(SignupDto.SignupRequest request) {
        log.info("Processing signup: email={}, company={}",
                PiiMasker.maskEmail(request.email()),
                PiiMasker.maskCompanyName(request.companyName()));

        // Phase 1: Validation
        validateSignupRequest(request);

        // Phase 2: Create tenant with PENDING status (local transaction)
        Tenant tenant = createPendingTenant(request);
        log.info("Created pending tenant: id={}, code={}",
                tenant.getId(), tenant.getCode());

        // Phase 3: Create admin user in identity-service (external call)
        // If this fails, we'll mark the tenant as FAILED
        try {
            identityServiceClient.createTenantAdmin(
                    request.email(),
                    request.password(),
                    request.firstName(),
                    request.lastName(),
                    request.phone(),
                    tenant.getId()
            );
            log.info("Created admin user for tenant: id={}", tenant.getId());
        } catch (Exception e) {
            // Compensating action: mark tenant as failed
            handleUserCreationFailure(tenant, e);
            throw new UserCreationFailedException(
                    "Failed to create admin user. Please try again later.",
                    e
            );
        }

        // Phase 4: Update tenant status to TRIAL (saga completion)
        tenant.setStatus(Tenant.TenantStatus.TRIAL);
        tenant = tenantRepository.save(tenant);

        // Phase 5: Async operations (fire and forget)
        triggerAsyncOperations(tenant, request);

        log.info("Signup completed: tenantId={}, subdomain={}",
                tenant.getId(), tenant.getCode());

        return new SignupDto.SignupResponse(
                tenant.getId(),
                tenant.getCode(),
                "Please check your email to verify your account"
        );
    }

    /**
     * Validates signup request for uniqueness constraints.
     * Throws ConflictException if validation fails.
     */
    private void validateSignupRequest(SignupDto.SignupRequest request) {
        // Check email availability in identity-service
        if (!identityServiceClient.isEmailAvailable(request.email())) {
            log.warn("Signup rejected - email already exists: {}",
                    PiiMasker.maskEmail(request.email()));
            throw ConflictException.duplicate("User with email", request.email());
        }

        // Check registration number uniqueness
        if (tenantRepository.existsByRegistrationNumber(request.registrationNumber())) {
            log.warn("Signup rejected - registration number exists: {}",
                    PiiMasker.maskRegistrationNumber(request.registrationNumber()));
            throw ConflictException.duplicate("Tenant with registration number", request.registrationNumber());
        }

        // Check company name uniqueness
        if (tenantRepository.existsByName(request.companyName())) {
            log.warn("Signup rejected - company name exists: {}",
                    PiiMasker.maskCompanyName(request.companyName()));
            throw ConflictException.duplicate("Tenant with company name", request.companyName());
        }
    }

    /**
     * Creates a tenant entity with PENDING status.
     * The tenant is persisted but not yet active until user creation succeeds.
     */
    private Tenant createPendingTenant(SignupDto.SignupRequest request) {
        // Generate unique tenant code
        String code = generateUniqueCode(request.companyName());
        String dbSchema = Tenant.generateSchemaName(code);

        Tenant tenant = new Tenant();
        tenant.setCode(code);
        tenant.setName(request.companyName());
        tenant.setTradingName(request.tradingName());
        tenant.setRegistrationNumber(request.registrationNumber());
        tenant.setTaxNumber(request.taxNumber());
        tenant.setVatNumber(normalizeOptionalField(request.vatNumber()));
        tenant.setUifReference(request.uifReference());
        tenant.setSdlNumber(request.sdlNumber());
        tenant.setPayeReference(request.payeReference());

        // Set company type with validation
        tenant.setCompanyType(parseCompanyType(request.companyType()));
        tenant.setIndustrySector(request.industrySector());

        // Address
        tenant.setAddressLine1(request.streetAddress());
        tenant.setCity(request.city());
        tenant.setProvince(request.province());
        tenant.setPostalCode(request.postalCode());
        tenant.setCountry("South Africa");

        // Contact
        tenant.setPhoneNumber(request.phone());
        tenant.setEmail(request.companyEmail());

        // Database schema
        tenant.setDbSchema(dbSchema);

        // Subscription - configurable trial period
        tenant.setSubscriptionTier(Tenant.SubscriptionTier.FREE);
        tenant.setSubscriptionStart(LocalDate.now());
        tenant.setSubscriptionEnd(LocalDate.now().plusDays(trialDurationDays));
        tenant.setMaxUsers(trialMaxUsers);

        // Status: PENDING until user creation succeeds
        tenant.setStatus(Tenant.TenantStatus.PENDING);

        return tenantRepository.save(tenant);
    }

    /**
     * Generates a unique tenant code, handling collisions.
     */
    private String generateUniqueCode(String companyName) {
        String baseCode = Tenant.generateCode(companyName);
        String code = baseCode;
        int suffix = 1;

        while (tenantRepository.existsByCode(code)) {
            code = baseCode + "-" + suffix;
            suffix++;
            if (suffix > 100) {
                // Safety limit to prevent infinite loop
                code = baseCode + "-" + UUID.randomUUID().toString().substring(0, 8);
                break;
            }
        }

        return code;
    }

    /**
     * Handles user creation failure by updating tenant status.
     * This is the compensating action in the Saga pattern.
     */
    private void handleUserCreationFailure(Tenant tenant, Exception e) {
        log.error("User creation failed for tenant {}: {}",
                tenant.getId(), e.getMessage());

        try {
            tenant.setStatus(Tenant.TenantStatus.PENDING);
            tenant.setSuspensionReason("User creation failed: " + e.getMessage());
            tenantRepository.save(tenant);
            log.info("Marked tenant {} as PENDING due to user creation failure",
                    tenant.getId());
        } catch (Exception compensationError) {
            // Log but don't throw - the original error takes precedence
            log.error("Failed to update tenant status during compensation: {}",
                    compensationError.getMessage());
        }
    }

    /**
     * Triggers async operations after successful signup.
     */
    private void triggerAsyncOperations(Tenant tenant, SignupDto.SignupRequest request) {
        // Provision database schema asynchronously
        schemaProvisioningService.provisionSchema(tenant.getId(), tenant.getDbSchema());

        // Publish signup completed event for email notification
        eventPublisher.publishEvent(new SignupCompletedEvent(
                tenant.getId(),
                request.email(),
                request.firstName(),
                tenant.getCode()
        ));
    }

    /**
     * Parses company type enum with fallback.
     * Logs warning but does not fail if type is invalid.
     */
    private Tenant.CompanyType parseCompanyType(String companyType) {
        try {
            return Tenant.CompanyType.valueOf(companyType);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid company type '{}', defaulting to PRIVATE_COMPANY",
                    companyType);
            return Tenant.CompanyType.PRIVATE_COMPANY;
        }
    }

    /**
     * Normalizes optional fields - returns null for empty strings.
     */
    private String normalizeOptionalField(String value) {
        return (value != null && !value.trim().isEmpty()) ? value.trim() : null;
    }

    @Override
    @Transactional(readOnly = true)
    public SignupDto.AvailabilityResponse checkEmailAvailability(String email) {
        boolean available = identityServiceClient.isEmailAvailable(email);
        String message = available ? "Email is available" : "Email is already registered";
        return new SignupDto.AvailabilityResponse(available, message);
    }

    @Override
    @Transactional(readOnly = true)
    public SignupDto.AvailabilityResponse checkRegistrationNumberAvailability(String registrationNumber) {
        boolean available = !tenantRepository.existsByRegistrationNumber(registrationNumber);
        String message = available ? "Registration number is available" : "Registration number is already registered";
        return new SignupDto.AvailabilityResponse(available, message);
    }

    @Override
    public void resendVerificationEmail(String email) {
        log.info("Resend verification requested: email={}", PiiMasker.maskEmail(email));

        // Find tenant by admin email and publish event
        // TODO: Implement proper verification email resend via notification-service
        // For now, just log the request
        eventPublisher.publishEvent(new ResendVerificationEvent(email));
    }

    /**
     * Event published when signup is completed.
     * Triggers email verification notification.
     */
    public record SignupCompletedEvent(
            UUID tenantId,
            String email,
            String firstName,
            String tenantCode
    ) {}

    /**
     * Event published when verification email resend is requested.
     */
    public record ResendVerificationEvent(String email) {}
}
