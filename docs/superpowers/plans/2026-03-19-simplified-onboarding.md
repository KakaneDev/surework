# Simplified Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce signup from 27 fields / 5 steps to 6 fields / 1 step + verification code, defer company and compliance details to settings, gate features behind completion flags, and send reminder emails.

**Architecture:** Tenant-level boolean flags (`companyDetailsComplete`, `complianceDetailsComplete`) control feature access. Verification codes live on the User entity in identity-service. Tenant-service orchestrates signup and verification. A `SetupGateFilter` in common-security rejects requests to gated endpoints. Frontend uses a `SetupGuard` route guard and `SetupBlockComponent` overlay. A daily scheduled job in notification-service sends reminder emails.

**Tech Stack:** Java 21 + Spring Boot 4.0.1, Angular 18+, PostgreSQL, Kafka, Thymeleaf, Flyway

**Spec:** `docs/superpowers/specs/2026-03-19-simplified-onboarding-design.md`

---

## File Structure

### Backend — tenant-service
| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/main/resources/db/migration/V3__add_tenant_completion_flags.sql` | Add `company_details_complete` and `compliance_details_complete` columns |
| Modify | `src/main/java/com/surework/tenant/domain/Tenant.java` | Add completion flag fields |
| Modify | `src/main/java/com/surework/tenant/dto/SignupDto.java` | Reduce `SignupRequest` to 7 fields, add `VerifyRequest`, `ResendCodeRequest` |
| Modify | `src/main/java/com/surework/tenant/service/SignupServiceImpl.java` | Simplify signup saga (no compliance/contact), add verify + resend orchestration |
| Modify | `src/main/java/com/surework/tenant/service/SignupService.java` | Add `verify()` and `resendCode()` to interface |
| Modify | `src/main/java/com/surework/tenant/controller/SignupController.java` | Add `POST /verify` and `POST /resend-code` endpoints |
| Create | `src/main/java/com/surework/tenant/controller/TenantSetupController.java` | Endpoints for saving company details + compliance, updating completion flags |
| Create | `src/main/java/com/surework/tenant/dto/TenantSetupDto.java` | DTOs for company details and compliance details requests/responses |
| Create | `src/main/java/com/surework/tenant/service/TenantSetupService.java` | Interface for setup completion logic |
| Create | `src/main/java/com/surework/tenant/service/TenantSetupServiceImpl.java` | Validates all required fields, sets completion flags, publishes events |

### Backend — identity-service
| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/main/resources/db/migration/V100__add_user_verification_fields.sql` | Add `verification_code` and `verification_code_expiry` columns to users table |
| Modify | `src/main/java/com/surework/identity/domain/User.java` | Add verification code fields and helper methods |
| Modify | `src/main/java/com/surework/identity/service/UserServiceImpl.java` | Add `generateVerificationCode()`, `verifyCode()`, `resendCode()` methods |
| Modify | `src/main/java/com/surework/identity/service/UserService.java` | Add verification method signatures |
| Modify | `src/main/java/com/surework/identity/controller/UserController.java` | Add `POST /verify-code` and `POST /resend-code` internal endpoints |
| Modify | `src/main/java/com/surework/identity/config/SecurityConfig.java` | Allow new public endpoints |

### Backend — common-security
| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/main/java/com/surework/common/security/SetupGateFilter.java` | Servlet filter checking tenant completion flags on gated URL patterns |
| Modify | `src/main/java/com/surework/common/security/JwtTokenProvider.java` | Add `companyDetailsComplete` and `complianceDetailsComplete` claims |
| Modify | `src/main/java/com/surework/common/security/TenantContext.java` | Add completion flag getters/setters on ThreadLocal |

### Backend — accounting-service
| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/main/java/com/surework/accounting/config/SetupGateConfig.java` | Register and configure `SetupGateFilter` with accounting-specific URL patterns |

### Backend — notification-service
| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/main/resources/templates/email/verification-code.html` | Thymeleaf template for verification code email |
| Create | `src/main/resources/templates/email/setup-reminder-day2.html` | Day 2 reminder template |
| Create | `src/main/resources/templates/email/setup-reminder-day7.html` | Day 7 reminder template |
| Create | `src/main/resources/templates/email/setup-reminder-day12.html` | Day 12 reminder template |
| Create | `src/main/java/com/surework/notification/scheduler/SetupReminderScheduler.java` | Daily scheduled job querying incomplete tenants and sending reminders |
| Modify | `src/main/java/com/surework/notification/consumer/DomainEventNotificationListener.java` | Handle `IdentityEvent.VerificationCodeGenerated` to send verification email |

### Frontend
| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `src/app/features/onboarding/onboarding-wizard.component.ts` | Reduce to single step (6 fields), remove step components import |
| Create | `src/app/features/onboarding/verify-code.component.ts` | 6-digit code entry screen with resend |
| Modify | `src/app/features/onboarding/onboarding.service.ts` | Reduce `SignupRequest`, add `verify()` and `resendCode()` |
| Modify | `src/app/features/onboarding/onboarding.routes.ts` | Add `verify` route |
| Delete | `src/app/features/onboarding/signup-success.component.ts` | Replaced by verify-code flow |
| Modify | `src/app/core/services/auth.service.ts` | Add `tenantSetupStatus` signal with completion flags |
| Create | `src/app/core/guards/setup.guard.ts` | Route guard checking completion flags, renders block overlay |
| Create | `src/app/shared/components/setup-block/setup-block.component.ts` | Full-page overlay for gated features |
| Modify | `src/app/app.routes.ts` | Apply `setupGuard` to gated feature routes |
| Create | `src/app/features/dashboard/widgets/setup-banner.component.ts` | Persistent setup CTA banner for dashboard |
| Modify | `src/app/features/dashboard/dashboard-content.component.ts` | Include setup banner widget |
| Modify | `src/app/features/settings/company-profile/company-profile.component.ts` | Add deferred fields (registration, industry, address) |
| Create | `src/app/features/settings/compliance/compliance.component.ts` | New compliance settings page (SARS details) |
| Modify | `src/app/features/settings/settings.routes.ts` | Add compliance route |
| Modify | `src/app/core/services/settings.service.ts` | Add compliance API methods |

All paths below are relative to their service root unless prefixed with `/opt/surework/`.

---

## Task 1: Database Migrations

**Files:**
- Create: `services/tenant-service/src/main/resources/db/migration/V3__add_tenant_completion_flags.sql`
- Create: `services/identity-service/src/main/resources/db/migration/V100__add_user_verification_fields.sql`

- [ ] **Step 1: Write tenant-service migration**

```sql
-- V3__add_tenant_completion_flags.sql
ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS company_details_complete BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS compliance_details_complete BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN tenants.company_details_complete IS 'True when admin has filled in registration number, address, contact info, industry sector';
COMMENT ON COLUMN tenants.compliance_details_complete IS 'True when admin has filled in tax number, UIF, SDL, PAYE reference';
```

- [ ] **Step 2: Write identity-service migration**

```sql
-- V100__add_user_verification_fields.sql
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'verification_code') THEN
        ALTER TABLE users ADD COLUMN verification_code VARCHAR(6);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'verification_code_expiry') THEN
        ALTER TABLE users ADD COLUMN verification_code_expiry TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_verification_code ON users(email, verification_code) WHERE verification_code IS NOT NULL;
```

- [ ] **Step 3: Commit**

```bash
git add services/tenant-service/src/main/resources/db/migration/V3__add_tenant_completion_flags.sql \
      services/identity-service/src/main/resources/db/migration/V100__add_user_verification_fields.sql
git commit -m "feat: add database migrations for onboarding simplification"
```

---

## Task 2: Tenant Entity — Completion Flags

**Files:**
- Modify: `services/tenant-service/src/main/java/com/surework/tenant/domain/Tenant.java`
- Test: `services/tenant-service/src/test/java/com/surework/tenant/domain/TenantTest.java`

- [ ] **Step 1: Write failing test**

Create test file `services/tenant-service/src/test/java/com/surework/tenant/domain/TenantTest.java`:

```java
package com.surework.tenant.domain;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class TenantTest {

    @Test
    void newTenant_shouldHaveCompletionFlagsFalse() {
        var tenant = new Tenant();
        assertThat(tenant.isCompanyDetailsComplete()).isFalse();
        assertThat(tenant.isComplianceDetailsComplete()).isFalse();
    }

    @Test
    void isSetupComplete_shouldReturnTrueOnlyWhenBothFlagsTrue() {
        var tenant = new Tenant();
        assertThat(tenant.isSetupComplete()).isFalse();

        tenant.setCompanyDetailsComplete(true);
        assertThat(tenant.isSetupComplete()).isFalse();

        tenant.setComplianceDetailsComplete(true);
        assertThat(tenant.isSetupComplete()).isTrue();
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd services/tenant-service && mvn test -pl . -Dtest=TenantTest -DfailIfNoTests=false`
Expected: Compilation error — `isCompanyDetailsComplete()` method does not exist.

- [ ] **Step 3: Add completion flag fields to Tenant entity**

In `services/tenant-service/src/main/java/com/surework/tenant/domain/Tenant.java`, add these fields alongside the existing fields (after the `features` field):

```java
@Column(name = "company_details_complete", nullable = false)
private boolean companyDetailsComplete = false;

@Column(name = "compliance_details_complete", nullable = false)
private boolean complianceDetailsComplete = false;

public boolean isSetupComplete() {
    return companyDetailsComplete && complianceDetailsComplete;
}
```

Lombok `@Getter` and `@Setter` on the class will auto-generate accessors.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd services/tenant-service && mvn test -pl . -Dtest=TenantTest`
Expected: PASS — both tests green.

- [ ] **Step 5: Commit**

```bash
git add services/tenant-service/src/main/java/com/surework/tenant/domain/Tenant.java \
      services/tenant-service/src/test/java/com/surework/tenant/domain/TenantTest.java
git commit -m "feat: add companyDetailsComplete and complianceDetailsComplete flags to Tenant"
```

---

## Task 3: User Entity — Verification Code Fields

**Files:**
- Modify: `services/identity-service/src/main/java/com/surework/identity/domain/User.java`
- Test: `services/identity-service/src/test/java/com/surework/identity/domain/UserVerificationTest.java`

- [ ] **Step 1: Write failing test**

Create `services/identity-service/src/test/java/com/surework/identity/domain/UserVerificationTest.java`:

```java
package com.surework.identity.domain;

import org.junit.jupiter.api.Test;
import java.time.Instant;
import static org.assertj.core.api.Assertions.assertThat;

class UserVerificationTest {

    @Test
    void generateVerificationCode_shouldSetCodeAndExpiry() {
        var user = new User();
        user.generateVerificationCode();

        assertThat(user.getVerificationCode()).isNotNull();
        assertThat(user.getVerificationCode()).hasSize(6);
        assertThat(user.getVerificationCode()).matches("\\d{6}");
        assertThat(user.getVerificationCodeExpiry()).isAfter(Instant.now());
    }

    @Test
    void isVerificationCodeValid_shouldReturnTrueForMatchingNonExpiredCode() {
        var user = new User();
        user.generateVerificationCode();
        String code = user.getVerificationCode();

        assertThat(user.isVerificationCodeValid(code)).isTrue();
    }

    @Test
    void isVerificationCodeValid_shouldReturnFalseForWrongCode() {
        var user = new User();
        user.generateVerificationCode();

        assertThat(user.isVerificationCodeValid("000000")).isFalse();
    }

    @Test
    void isVerificationCodeValid_shouldReturnFalseForExpiredCode() {
        var user = new User();
        user.setVerificationCode("123456");
        user.setVerificationCodeExpiry(Instant.now().minusSeconds(60));

        assertThat(user.isVerificationCodeValid("123456")).isFalse();
    }

    @Test
    void clearVerificationCode_shouldNullOutFields() {
        var user = new User();
        user.generateVerificationCode();
        user.clearVerificationCode();

        assertThat(user.getVerificationCode()).isNull();
        assertThat(user.getVerificationCodeExpiry()).isNull();
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd services/identity-service && mvn test -pl . -Dtest=UserVerificationTest -DfailIfNoTests=false`
Expected: Compilation error — `generateVerificationCode()` does not exist.

- [ ] **Step 3: Add verification fields and methods to User entity**

In `services/identity-service/src/main/java/com/surework/identity/domain/User.java`, add:

```java
import java.security.SecureRandom;
import java.time.Duration;

// Fields (add alongside existing fields)
@Column(name = "verification_code", length = 6)
private String verificationCode;

@Column(name = "verification_code_expiry")
private Instant verificationCodeExpiry;

private static final SecureRandom SECURE_RANDOM = new SecureRandom();
private static final Duration CODE_VALIDITY = Duration.ofMinutes(10);

public void generateVerificationCode() {
    this.verificationCode = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    this.verificationCodeExpiry = Instant.now().plus(CODE_VALIDITY);
}

public boolean isVerificationCodeValid(String code) {
    return this.verificationCode != null
            && this.verificationCode.equals(code)
            && this.verificationCodeExpiry != null
            && Instant.now().isBefore(this.verificationCodeExpiry);
}

public void clearVerificationCode() {
    this.verificationCode = null;
    this.verificationCodeExpiry = null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd services/identity-service && mvn test -pl . -Dtest=UserVerificationTest`
Expected: PASS — all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add services/identity-service/src/main/java/com/surework/identity/domain/User.java \
      services/identity-service/src/test/java/com/surework/identity/domain/UserVerificationTest.java
git commit -m "feat: add verification code fields and methods to User entity"
```

---

## Task 4: Reduce SignupDto and Simplify Signup Flow

**Files:**
- Modify: `services/tenant-service/src/main/java/com/surework/tenant/dto/SignupDto.java`
- Modify: `services/tenant-service/src/main/java/com/surework/tenant/service/SignupService.java`
- Modify: `services/tenant-service/src/main/java/com/surework/tenant/service/SignupServiceImpl.java`
- Test: `services/tenant-service/src/test/java/com/surework/tenant/service/SignupServiceImplTest.java`

- [ ] **Step 1: Write failing test for simplified signup**

Create `services/tenant-service/src/test/java/com/surework/tenant/service/SignupServiceImplTest.java`:

```java
package com.surework.tenant.service;

import com.surework.tenant.dto.SignupDto;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class SignupServiceImplTest {

    @Test
    void signupRequest_shouldOnlyRequireEssentialFields() {
        // Verify the reduced SignupRequest compiles with only essential fields
        var request = new SignupDto.SignupRequest(
            "john@acme.co.za",       // email
            "SecurePass1!",          // password
            "John",                  // firstName
            "Smith",                 // lastName
            "Acme Holdings",         // companyName
            "PRIVATE_COMPANY",       // companyType
            true                     // acceptTerms
        );

        assertThat(request.email()).isEqualTo("john@acme.co.za");
        assertThat(request.companyName()).isEqualTo("Acme Holdings");
        assertThat(request.companyType()).isEqualTo("PRIVATE_COMPANY");
    }

    @Test
    void verifyRequest_shouldHaveEmailAndCode() {
        var request = new SignupDto.VerifyRequest("john@acme.co.za", "123456");
        assertThat(request.email()).isEqualTo("john@acme.co.za");
        assertThat(request.code()).isEqualTo("123456");
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd services/tenant-service && mvn test -pl . -Dtest=SignupServiceImplTest -DfailIfNoTests=false`
Expected: Compilation error — `SignupRequest` constructor mismatch, `VerifyRequest` does not exist.

- [ ] **Step 3: Replace the SignupRequest record in SignupDto**

In `services/tenant-service/src/main/java/com/surework/tenant/dto/SignupDto.java`, replace the `SignupRequest` record with the reduced version and add `VerifyRequest` and `ResendCodeRequest`:

```java
record SignupRequest(
    @NotBlank @Email @Size(max = 255)
    String email,

    @NotBlank @Size(min = 12)
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$",
             message = "Password must contain uppercase, lowercase, digit, and special character")
    String password,

    @NotBlank @Size(min = 2, max = 50)
    String firstName,

    @NotBlank @Size(min = 2, max = 50)
    String lastName,

    @NotBlank @Size(min = 2, max = 200)
    String companyName,

    @NotBlank
    String companyType,

    @AssertTrue(message = "You must accept the terms of service")
    boolean acceptTerms
) implements SignupDto {}

record VerifyRequest(
    @NotBlank @Email
    String email,

    @NotBlank @Size(min = 6, max = 6)
    @Pattern(regexp = "\\d{6}", message = "Code must be 6 digits")
    String code
) implements SignupDto {}

record ResendCodeRequest(
    @NotBlank @Email
    String email
) implements SignupDto {}

record VerifyResponse(
    String accessToken,
    String refreshToken,
    long expiresIn
) implements SignupDto {}
```

Remove the old fields from `SignupRequest`: `tradingName`, `registrationNumber`, `industrySector`, `taxNumber`, `vatNumber`, `uifReference`, `sdlNumber`, `payeReference`, `phone`, `companyEmail`, `streetAddress`, `city`, `province`, `postalCode`. Keep the `CompanyType`, `IndustrySector`, and `Province` enums (they're still used by settings pages and reference endpoints).

- [ ] **Step 4: Simplify SignupServiceImpl**

In `services/tenant-service/src/main/java/com/surework/tenant/service/SignupServiceImpl.java`:

1. Update `createPendingTenant()` to only set `name`, `companyType`, and `email` from the request (no compliance, contact, or address fields). Set both completion flags to `false`. Set status to `PENDING` (not `TRIAL` — that happens on verification).

2. Remove validation of `registrationNumber` uniqueness (it's no longer collected at signup).

3. In the saga Phase 3 (create admin user), pass `null` for `phone` since it's no longer collected.

4. Remove Phase 4 (status to TRIAL) — this now happens during verification.

5. Keep Phase 5 (async operations) but remove email verification event (that's now handled by identity-service directly).

- [ ] **Step 5: Add verify and resendCode to SignupService interface**

In `services/tenant-service/src/main/java/com/surework/tenant/service/SignupService.java`, add:

```java
SignupDto.VerifyResponse verify(SignupDto.VerifyRequest request);
void resendCode(SignupDto.ResendCodeRequest request);
```

- [ ] **Step 6: Implement verify and resendCode in SignupServiceImpl**

Add to `SignupServiceImpl`:

```java
@Override
@Transactional
public SignupDto.VerifyResponse verify(SignupDto.VerifyRequest request) {
    // 1. Call identity-service to validate code and activate user
    var userResponse = identityServiceClient.verifyCode(request.email(), request.code());

    // 2. Find tenant by the user's tenantId and transition PENDING → TRIAL
    var tenant = tenantRepository.findById(userResponse.tenantId())
            .orElseThrow(() -> new ResourceNotFoundException("Tenant not found"));
    tenant.setStatus(Tenant.TenantStatus.TRIAL);
    tenant.setSubscriptionStart(LocalDate.now());
    tenant.setSubscriptionEnd(LocalDate.now().plusDays(trialDurationDays));
    tenantRepository.save(tenant);

    // 3. Generate JWT via JwtTokenProvider
    var accessToken = jwtTokenProvider.generateAccessToken(
            userResponse.id(), tenant.getId(), userResponse.email(),
            userResponse.roles(), Set.of(),
            tenant.isCompanyDetailsComplete(), tenant.isComplianceDetailsComplete());
    var refreshToken = jwtTokenProvider.generateRefreshToken(
            userResponse.id(), tenant.getId());

    // 4. Trigger async operations (schema provisioning)
    triggerAsyncOperations(tenant, request);

    return new SignupDto.VerifyResponse(
            accessToken, refreshToken,
            jwtTokenProvider.getAccessTokenExpirationSeconds());
}

@Override
public void resendCode(SignupDto.ResendCodeRequest request) {
    identityServiceClient.resendVerificationCode(request.email());
}
```

- [ ] **Step 7: Add identity-service client methods**

Add to the existing `IdentityServiceClient` (or equivalent REST client class in tenant-service):

```java
UserDto.Response verifyCode(String email, String code);
void resendVerificationCode(String email);
```

Implementation calls:
- `POST ${identity-service.url}/api/v1/users/verify-code` with `{ email, code }`
- `POST ${identity-service.url}/api/v1/users/resend-code` with `{ email }`

- [ ] **Step 8: Run tests**

Run: `cd services/tenant-service && mvn test -pl . -Dtest=SignupServiceImplTest`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add services/tenant-service/src/main/java/com/surework/tenant/dto/SignupDto.java \
      services/tenant-service/src/main/java/com/surework/tenant/service/SignupService.java \
      services/tenant-service/src/main/java/com/surework/tenant/service/SignupServiceImpl.java \
      services/tenant-service/src/test/java/com/surework/tenant/service/SignupServiceImplTest.java
git commit -m "feat: reduce SignupDto to 7 fields, add verification endpoints"
```

---

## Task 5: Identity-Service — Verification Code Endpoints

**Files:**
- Modify: `services/identity-service/src/main/java/com/surework/identity/service/UserService.java`
- Modify: `services/identity-service/src/main/java/com/surework/identity/service/UserServiceImpl.java`
- Modify: `services/identity-service/src/main/java/com/surework/identity/controller/UserController.java`
- Modify: `services/identity-service/src/main/java/com/surework/identity/config/SecurityConfig.java`
- Test: `services/identity-service/src/test/java/com/surework/identity/service/UserVerificationServiceTest.java`

- [ ] **Step 1: Write failing test**

Create `services/identity-service/src/test/java/com/surework/identity/service/UserVerificationServiceTest.java`:

```java
package com.surework.identity.service;

import com.surework.identity.domain.User;
import com.surework.identity.repository.UserRepository;
import com.surework.common.web.exception.ResourceNotFoundException;
import com.surework.common.web.exception.ValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserVerificationServiceTest {

    @Mock private UserRepository userRepository;
    @InjectMocks private UserServiceImpl userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setEmail("john@acme.co.za");
        testUser.setTenantId(UUID.randomUUID());
        testUser.setStatus(User.UserStatus.PENDING);
        testUser.generateVerificationCode();
    }

    @Test
    void verifyCode_withValidCode_shouldActivateUser() {
        String code = testUser.getVerificationCode();
        when(userRepository.findByEmail("john@acme.co.za")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        var result = userService.verifyCode("john@acme.co.za", code);

        assertThat(testUser.getStatus()).isEqualTo(User.UserStatus.ACTIVE);
        assertThat(testUser.getVerificationCode()).isNull();
    }

    @Test
    void verifyCode_withInvalidCode_shouldThrow() {
        when(userRepository.findByEmail("john@acme.co.za")).thenReturn(Optional.of(testUser));

        assertThatThrownBy(() -> userService.verifyCode("john@acme.co.za", "000000"))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void verifyCode_withExpiredCode_shouldThrow() {
        testUser.setVerificationCodeExpiry(Instant.now().minusSeconds(60));
        when(userRepository.findByEmail("john@acme.co.za")).thenReturn(Optional.of(testUser));

        assertThatThrownBy(() -> userService.verifyCode("john@acme.co.za", testUser.getVerificationCode()))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void verifyCode_withUnknownEmail_shouldThrow() {
        when(userRepository.findByEmail("unknown@acme.co.za")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.verifyCode("unknown@acme.co.za", "123456"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd services/identity-service && mvn test -pl . -Dtest=UserVerificationServiceTest -DfailIfNoTests=false`
Expected: Compilation error — `verifyCode()` method does not exist on `UserServiceImpl`.

- [ ] **Step 3: Add verification methods to UserService interface**

In `services/identity-service/src/main/java/com/surework/identity/service/UserService.java`:

```java
UserDto.Response verifyCode(String email, String code);
void resendVerificationCode(String email);
```

- [ ] **Step 4: Implement in UserServiceImpl**

In `services/identity-service/src/main/java/com/surework/identity/service/UserServiceImpl.java`:

```java
@Override
@Transactional
public UserDto.Response verifyCode(String email, String code) {
    var user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

    if (!user.isVerificationCodeValid(code)) {
        throw new ValidationException("Invalid or expired verification code");
    }

    user.setStatus(User.UserStatus.ACTIVE);
    user.clearVerificationCode();
    var saved = userRepository.save(user);

    eventPublisher.publish(new IdentityEvent.UserActivated(
            saved.getId(), saved.getEmail(), saved.getTenantId(), Instant.now()));

    return UserDto.Response.fromEntity(saved);
}

@Override
@Transactional
public void resendVerificationCode(String email) {
    var user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

    if (user.getStatus() != User.UserStatus.PENDING) {
        throw new ValidationException("User is already verified");
    }

    user.generateVerificationCode();
    userRepository.save(user);

    // Publish event for notification-service to send email
    eventPublisher.publish(new IdentityEvent.VerificationCodeGenerated(
            user.getId(), user.getEmail(), user.getVerificationCode(),
            user.getFirstName(), user.getTenantId(), Instant.now()));
}
```

- [ ] **Step 5: Also update `createUserWithPassword()` to generate verification code**

In `UserServiceImpl.createUserWithPassword()`, after saving the user, add:

```java
savedUser.generateVerificationCode();
savedUser = userRepository.save(savedUser);

eventPublisher.publish(new IdentityEvent.VerificationCodeGenerated(
        savedUser.getId(), savedUser.getEmail(), savedUser.getVerificationCode(),
        savedUser.getFirstName(), savedUser.getTenantId(), Instant.now()));
```

- [ ] **Step 6: Add VerificationCodeGenerated event to IdentityEvent**

In `libs/common-messaging/src/main/java/com/surework/common/messaging/event/IdentityEvent.java`, add:

```java
record VerificationCodeGenerated(
    UUID userId,
    String email,
    String code,
    String firstName,
    UUID tenantId,
    Instant timestamp
) implements IdentityEvent {}
```

- [ ] **Step 7: Add controller endpoints**

In `services/identity-service/src/main/java/com/surework/identity/controller/UserController.java`:

```java
@PostMapping("/verify-code")
public ResponseEntity<UserDto.Response> verifyCode(@RequestBody @Valid VerifyCodeRequest request) {
    var response = userService.verifyCode(request.email(), request.code());
    return ResponseEntity.ok(response);
}

@PostMapping("/resend-code")
public ResponseEntity<Void> resendCode(@RequestBody @Valid ResendCodeRequest request) {
    userService.resendVerificationCode(request.email());
    return ResponseEntity.ok().build();
}

public record VerifyCodeRequest(
    @NotBlank @Email String email,
    @NotBlank @Size(min = 6, max = 6) String code
) {}

public record ResendCodeRequest(
    @NotBlank @Email String email
) {}
```

- [ ] **Step 8: Make new endpoints public in SecurityConfig**

In `services/identity-service/src/main/java/com/surework/identity/config/SecurityConfig.java`, add to the `permitAll()` list:

```java
.requestMatchers(HttpMethod.POST, "/api/v1/users/verify-code").permitAll()
.requestMatchers(HttpMethod.POST, "/api/v1/users/resend-code").permitAll()
```

- [ ] **Step 9: Run tests**

Run: `cd services/identity-service && mvn test -pl . -Dtest=UserVerificationServiceTest`
Expected: PASS — all 4 tests green.

- [ ] **Step 10: Commit**

```bash
git add services/identity-service/src/main/java/com/surework/identity/domain/User.java \
      services/identity-service/src/main/java/com/surework/identity/service/UserService.java \
      services/identity-service/src/main/java/com/surework/identity/service/UserServiceImpl.java \
      services/identity-service/src/main/java/com/surework/identity/controller/UserController.java \
      services/identity-service/src/main/java/com/surework/identity/config/SecurityConfig.java \
      services/identity-service/src/test/java/com/surework/identity/service/UserVerificationServiceTest.java \
      libs/common-messaging/src/main/java/com/surework/common/messaging/event/IdentityEvent.java
git commit -m "feat: add verification code endpoints to identity-service"
```

---

## Task 6: Verification Signup Controller Endpoints

**Files:**
- Modify: `services/tenant-service/src/main/java/com/surework/tenant/controller/SignupController.java`

- [ ] **Step 1: Add verify and resend-code endpoints to SignupController**

```java
@PostMapping("/verify")
public ResponseEntity<SignupDto.VerifyResponse> verify(
        @RequestBody @Valid SignupDto.VerifyRequest request) {
    log.info("Email verification attempt for: {}", PiiMasker.maskEmail(request.email()));
    var response = signupService.verify(request);
    return ResponseEntity.ok(response);
}

@PostMapping("/resend-code")
public ResponseEntity<Void> resendCode(
        @RequestBody @Valid SignupDto.ResendCodeRequest request) {
    log.info("Resend verification code for: {}", PiiMasker.maskEmail(request.email()));
    signupService.resendCode(request);
    return ResponseEntity.ok().build();
}
```

The `/api/v1/signup/**` pattern is already `permitAll()` in SecurityConfig, so these are automatically public.

- [ ] **Step 2: Remove the old `resend-verification` endpoint**

Remove the existing `POST /resend-verification` endpoint that takes `@RequestParam String email` — it's replaced by `POST /resend-code` with a JSON body.

- [ ] **Step 3: Commit**

```bash
git add services/tenant-service/src/main/java/com/surework/tenant/controller/SignupController.java
git commit -m "feat: add /verify and /resend-code endpoints to SignupController"
```

---

## Task 7: JWT Claims + SetupGateFilter

**Files:**
- Modify: `libs/common-security/src/main/java/com/surework/common/security/JwtTokenProvider.java`
- Modify: `libs/common-security/src/main/java/com/surework/common/security/TenantContext.java`
- Create: `libs/common-security/src/main/java/com/surework/common/security/SetupGateFilter.java`
- Create: `services/accounting-service/src/main/java/com/surework/accounting/config/SetupGateConfig.java`
- Test: `libs/common-security/src/test/java/com/surework/common/security/SetupGateFilterTest.java`

- [ ] **Step 1: Add completion flags to TenantContext**

In `libs/common-security/src/main/java/com/surework/common/security/TenantContext.java`, add:

```java
private static final ThreadLocal<Boolean> COMPANY_DETAILS_COMPLETE = new ThreadLocal<>();
private static final ThreadLocal<Boolean> COMPLIANCE_DETAILS_COMPLETE = new ThreadLocal<>();

public static void setCompanyDetailsComplete(Boolean complete) {
    COMPANY_DETAILS_COMPLETE.set(complete);
}

public static boolean isCompanyDetailsComplete() {
    return Boolean.TRUE.equals(COMPANY_DETAILS_COMPLETE.get());
}

public static void setComplianceDetailsComplete(Boolean complete) {
    COMPLIANCE_DETAILS_COMPLETE.set(complete);
}

public static boolean isComplianceDetailsComplete() {
    return Boolean.TRUE.equals(COMPLIANCE_DETAILS_COMPLETE.get());
}
```

Also update the `clear()` method to include:
```java
COMPANY_DETAILS_COMPLETE.remove();
COMPLIANCE_DETAILS_COMPLETE.remove();
```

- [ ] **Step 2: Add completion flags to JWT claims**

In `libs/common-security/src/main/java/com/surework/common/security/JwtTokenProvider.java`, add an overloaded `generateAccessToken()` that accepts completion flags:

```java
public String generateAccessToken(UUID userId, UUID tenantId, String email,
        Set<String> roles, Set<String> permissions,
        boolean companyDetailsComplete, boolean complianceDetailsComplete) {
    var now = Instant.now();
    return Jwts.builder()
            .subject(userId.toString())
            .claim("tenantId", tenantId.toString())
            .claim("userId", userId.toString())
            .claim("username", email)
            .claim("roles", roles)
            .claim("permissions", permissions)
            .claim("companyDetailsComplete", companyDetailsComplete)
            .claim("complianceDetailsComplete", complianceDetailsComplete)
            .claim("tokenType", "ACCESS")
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusMillis(accessTokenExpirationMs)))
            .signWith(getSigningKey())
            .compact();
}
```

Add extraction methods:

```java
public static boolean isCompanyDetailsComplete(Claims claims) {
    return Boolean.TRUE.equals(claims.get("companyDetailsComplete", Boolean.class));
}

public static boolean isComplianceDetailsComplete(Claims claims) {
    return Boolean.TRUE.equals(claims.get("complianceDetailsComplete", Boolean.class));
}
```

Also update `JwtHeaderAuthenticationFilter` (or wherever JWT claims are parsed into `TenantContext`) to populate the new ThreadLocal fields:

```java
TenantContext.setCompanyDetailsComplete(
        JwtTokenProvider.isCompanyDetailsComplete(claims));
TenantContext.setComplianceDetailsComplete(
        JwtTokenProvider.isComplianceDetailsComplete(claims));
```

- [ ] **Step 3: Write failing test for SetupGateFilter**

Create `libs/common-security/src/test/java/com/surework/common/security/SetupGateFilterTest.java`:

```java
package com.surework.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class SetupGateFilterTest {

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void shouldBlock_whenCompanyGateIncomplete() throws Exception {
        TenantContext.setCompanyDetailsComplete(false);
        TenantContext.setComplianceDetailsComplete(true);

        var filter = new SetupGateFilter(
                Map.of("COMPANY_DETAILS", List.of("/api/v1/invoices")),
                Map.of("COMPLIANCE", List.of("/api/v1/payroll")));

        var request = new MockHttpServletRequest("GET", "/api/v1/invoices");
        var response = new MockHttpServletResponse();
        var chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_FORBIDDEN);
        assertThat(response.getContentAsString()).contains("SETUP_REQUIRED");
        assertThat(response.getContentAsString()).contains("COMPANY_DETAILS");
        verifyNoInteractions(chain);
    }

    @Test
    void shouldAllow_whenCompanyGateComplete() throws Exception {
        TenantContext.setCompanyDetailsComplete(true);
        TenantContext.setComplianceDetailsComplete(false);

        var filter = new SetupGateFilter(
                Map.of("COMPANY_DETAILS", List.of("/api/v1/invoices")),
                Map.of("COMPLIANCE", List.of("/api/v1/payroll")));

        var request = new MockHttpServletRequest("GET", "/api/v1/invoices");
        var response = new MockHttpServletResponse();
        var chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_OK);
        verify(chain).doFilter(request, response);
    }

    @Test
    void shouldBlock_whenComplianceGateIncomplete() throws Exception {
        TenantContext.setCompanyDetailsComplete(true);
        TenantContext.setComplianceDetailsComplete(false);

        var filter = new SetupGateFilter(
                Map.of("COMPANY_DETAILS", List.of("/api/v1/invoices")),
                Map.of("COMPLIANCE", List.of("/api/v1/payroll")));

        var request = new MockHttpServletRequest("GET", "/api/v1/payroll/runs");
        var response = new MockHttpServletResponse();
        var chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_FORBIDDEN);
        assertThat(response.getContentAsString()).contains("COMPLIANCE");
    }

    @Test
    void shouldAllow_ungatedPaths() throws Exception {
        TenantContext.setCompanyDetailsComplete(false);
        TenantContext.setComplianceDetailsComplete(false);

        var filter = new SetupGateFilter(
                Map.of("COMPANY_DETAILS", List.of("/api/v1/invoices")),
                Map.of("COMPLIANCE", List.of("/api/v1/payroll")));

        var request = new MockHttpServletRequest("GET", "/api/v1/employees");
        var response = new MockHttpServletResponse();
        var chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
    }
}
```

- [ ] **Step 4: Implement SetupGateFilter**

Create `libs/common-security/src/main/java/com/surework/common/security/SetupGateFilter.java`:

```java
package com.surework.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Slf4j
@RequiredArgsConstructor
public class SetupGateFilter implements Filter {

    private final Map<String, List<String>> companyGatePatterns;
    private final Map<String, List<String>> complianceGatePatterns;
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        var request = (HttpServletRequest) req;
        var response = (HttpServletResponse) res;
        var path = request.getRequestURI();

        // Check company details gate
        if (!TenantContext.isCompanyDetailsComplete() && matchesAnyPattern(path, companyGatePatterns)) {
            rejectWithSetupRequired(response, "COMPANY_DETAILS");
            return;
        }

        // Check compliance gate
        if (!TenantContext.isComplianceDetailsComplete() && matchesAnyPattern(path, complianceGatePatterns)) {
            rejectWithSetupRequired(response, "COMPLIANCE");
            return;
        }

        chain.doFilter(request, response);
    }

    private boolean matchesAnyPattern(String path, Map<String, List<String>> patterns) {
        return patterns.values().stream()
                .flatMap(List::stream)
                .anyMatch(pattern -> path.startsWith(pattern));
    }

    private void rejectWithSetupRequired(HttpServletResponse response, String gate) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        MAPPER.writeValue(response.getOutputStream(),
                Map.of("error", "SETUP_REQUIRED", "gate", gate));
    }
}
```

- [ ] **Step 5: Run tests**

Run: `cd libs/common-security && mvn test -pl . -Dtest=SetupGateFilterTest`
Expected: PASS — all 4 tests green.

- [ ] **Step 6: Register filter in accounting-service**

Create `services/accounting-service/src/main/java/com/surework/accounting/config/SetupGateConfig.java`:

```java
package com.surework.accounting.config;

import com.surework.common.security.SetupGateFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Map;

@Configuration
public class SetupGateConfig {

    @Bean
    public FilterRegistrationBean<SetupGateFilter> setupGateFilter() {
        var filter = new SetupGateFilter(
                Map.of("COMPANY_DETAILS", List.of(
                        "/api/v1/accounting/invoices",
                        "/api/v1/accounting/customers")),
                Map.of("COMPLIANCE", List.of(
                        "/api/v1/accounting/payroll",
                        "/api/v1/accounting/vat",
                        "/api/v1/accounting/journals")));

        var registration = new FilterRegistrationBean<>(filter);
        registration.setOrder(50); // After auth filter, before controllers
        return registration;
    }
}
```

- [ ] **Step 7: Register filter in payroll-service**

If a separate payroll-service exists (check `services/payroll-service/`), create an analogous `SetupGateConfig`:

```java
// services/payroll-service/src/main/java/.../config/SetupGateConfig.java
@Configuration
public class SetupGateConfig {
    @Bean
    public FilterRegistrationBean<SetupGateFilter> setupGateFilter() {
        var filter = new SetupGateFilter(
                Map.of(), // No company gate patterns for payroll
                Map.of("COMPLIANCE", List.of("/api/v1/payroll")));
        var registration = new FilterRegistrationBean<>(filter);
        registration.setOrder(50);
        return registration;
    }
}
```

If payroll endpoints are served by accounting-service (check the codebase), the existing `SetupGateConfig` in accounting-service already covers them — verify that `/api/v1/payroll` is in the compliance patterns there.

- [ ] **Step 8: Commit**

```bash
git add libs/common-security/src/main/java/com/surework/common/security/TenantContext.java \
      libs/common-security/src/main/java/com/surework/common/security/JwtTokenProvider.java \
      libs/common-security/src/main/java/com/surework/common/security/SetupGateFilter.java \
      libs/common-security/src/test/java/com/surework/common/security/SetupGateFilterTest.java \
      services/accounting-service/src/main/java/com/surework/accounting/config/SetupGateConfig.java
git commit -m "feat: add SetupGateFilter for feature gating by tenant completion status"
```

---

## Task 8: Tenant Setup Completion Endpoints

**Files:**
- Create: `services/tenant-service/src/main/java/com/surework/tenant/dto/TenantSetupDto.java`
- Create: `services/tenant-service/src/main/java/com/surework/tenant/service/TenantSetupService.java`
- Create: `services/tenant-service/src/main/java/com/surework/tenant/service/TenantSetupServiceImpl.java`
- Create: `services/tenant-service/src/main/java/com/surework/tenant/controller/TenantSetupController.java`
- Test: `services/tenant-service/src/test/java/com/surework/tenant/service/TenantSetupServiceImplTest.java`

- [ ] **Step 1: Write failing test**

Create `services/tenant-service/src/test/java/com/surework/tenant/service/TenantSetupServiceImplTest.java`:

```java
package com.surework.tenant.service;

import com.surework.tenant.domain.Tenant;
import com.surework.tenant.dto.TenantSetupDto;
import com.surework.tenant.repository.TenantRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TenantSetupServiceImplTest {

    @Mock private TenantRepository tenantRepository;
    @InjectMocks private TenantSetupServiceImpl setupService;

    @Test
    void saveCompanyDetails_withAllRequiredFields_shouldSetFlagTrue() {
        var tenantId = UUID.randomUUID();
        var tenant = new Tenant();
        tenant.setId(tenantId);
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(tenantRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var request = new TenantSetupDto.CompanyDetailsRequest(
                "2024/123456/07", null, "ICT",
                "+27821234567", "info@acme.co.za",
                "123 Main St", "Cape Town", "WC", "8001");

        var result = setupService.saveCompanyDetails(tenantId, request);

        assertThat(tenant.isCompanyDetailsComplete()).isTrue();
        assertThat(tenant.getRegistrationNumber()).isEqualTo("2024/123456/07");
    }

    @Test
    void saveComplianceDetails_withAllRequiredFields_shouldSetFlagTrue() {
        var tenantId = UUID.randomUUID();
        var tenant = new Tenant();
        tenant.setId(tenantId);
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(tenantRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var request = new TenantSetupDto.ComplianceDetailsRequest(
                "1234567890", null, "U12345678", "L12345678",
                "1234567/123/1234");

        var result = setupService.saveComplianceDetails(tenantId, request);

        assertThat(tenant.isComplianceDetailsComplete()).isTrue();
        assertThat(tenant.getTaxNumber()).isEqualTo("1234567890");
    }

    @Test
    void getSetupStatus_shouldReturnBothFlags() {
        var tenantId = UUID.randomUUID();
        var tenant = new Tenant();
        tenant.setId(tenantId);
        tenant.setCompanyDetailsComplete(true);
        tenant.setComplianceDetailsComplete(false);
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));

        var status = setupService.getSetupStatus(tenantId);

        assertThat(status.companyDetailsComplete()).isTrue();
        assertThat(status.complianceDetailsComplete()).isFalse();
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd services/tenant-service && mvn test -pl . -Dtest=TenantSetupServiceImplTest -DfailIfNoTests=false`
Expected: Compilation error — classes don't exist yet.

- [ ] **Step 3: Create TenantSetupDto**

Create `services/tenant-service/src/main/java/com/surework/tenant/dto/TenantSetupDto.java`:

```java
package com.surework.tenant.dto;

import jakarta.validation.constraints.*;

public sealed interface TenantSetupDto {

    record CompanyDetailsRequest(
        @NotBlank @Pattern(regexp = "\\d{4}/\\d{6}/\\d{2}")
        String registrationNumber,

        @Size(max = 200)
        String tradingName,

        @NotBlank
        String industrySector,

        @NotBlank @Pattern(regexp = "^\\+27[0-9]{9}$")
        String phone,

        @NotBlank @Email
        String companyEmail,

        @NotBlank @Size(max = 500)
        String streetAddress,

        @NotBlank @Size(max = 100)
        String city,

        @NotBlank
        String province,

        @NotBlank @Pattern(regexp = "\\d{4}")
        String postalCode
    ) implements TenantSetupDto {}

    record ComplianceDetailsRequest(
        @NotBlank @Pattern(regexp = "\\d{10}")
        String taxNumber,

        @Pattern(regexp = "4\\d{9}")
        String vatNumber,

        @NotBlank @Pattern(regexp = "U\\d{8}")
        String uifReference,

        @NotBlank @Pattern(regexp = "L\\d{8}")
        String sdlNumber,

        @NotBlank @Pattern(regexp = "\\d{7}/\\d{3}/\\d{4}")
        String payeReference
    ) implements TenantSetupDto {}

    record SetupStatusResponse(
        boolean companyDetailsComplete,
        boolean complianceDetailsComplete
    ) implements TenantSetupDto {}

    record CompanyDetailsResponse(
        String registrationNumber,
        String tradingName,
        String industrySector,
        String phone,
        String companyEmail,
        String streetAddress,
        String city,
        String province,
        String postalCode
    ) implements TenantSetupDto {}

    record ComplianceDetailsResponse(
        String taxNumber,
        String vatNumber,
        String uifReference,
        String sdlNumber,
        String payeReference
    ) implements TenantSetupDto {}
}
```

- [ ] **Step 4: Create TenantSetupService interface and implementation**

Create `services/tenant-service/src/main/java/com/surework/tenant/service/TenantSetupService.java`:

```java
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
```

Also add a `TenantEvent.SetupCompleted` event to `libs/common-messaging/src/main/java/com/surework/common/messaging/event/TenantEvent.java` (create the file if it doesn't exist, following the existing sealed interface pattern from `IdentityEvent.java`):

```java
record SetupCompleted(
    UUID tenantId,
    String gateCompleted,  // "COMPANY_DETAILS" or "COMPLIANCE"
    boolean companyDetailsComplete,
    boolean complianceDetailsComplete,
    Instant timestamp
) implements TenantEvent {}
```

Create `services/tenant-service/src/main/java/com/surework/tenant/service/TenantSetupServiceImpl.java`:

```java
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
    private final DomainEventPublisher eventPublisher;

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

        // Publish event so other services (accounting, etc.) can refresh cached flags
        eventPublisher.publish(new TenantEvent.SetupCompleted(
                tenantId, "COMPANY_DETAILS", true, tenant.isComplianceDetailsComplete(), Instant.now()));

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

        // Publish event so other services can refresh cached flags
        eventPublisher.publish(new TenantEvent.SetupCompleted(
                tenantId, "COMPLIANCE", tenant.isCompanyDetailsComplete(), true, Instant.now()));

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
```

- [ ] **Step 5: Create TenantSetupController**

Create `services/tenant-service/src/main/java/com/surework/tenant/controller/TenantSetupController.java`:

```java
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
```

- [ ] **Step 6: Run tests**

Run: `cd services/tenant-service && mvn test -pl . -Dtest=TenantSetupServiceImplTest`
Expected: PASS — all 3 tests green.

- [ ] **Step 7: Commit**

```bash
git add services/tenant-service/src/main/java/com/surework/tenant/dto/TenantSetupDto.java \
      services/tenant-service/src/main/java/com/surework/tenant/service/TenantSetupService.java \
      services/tenant-service/src/main/java/com/surework/tenant/service/TenantSetupServiceImpl.java \
      services/tenant-service/src/main/java/com/surework/tenant/controller/TenantSetupController.java \
      services/tenant-service/src/test/java/com/surework/tenant/service/TenantSetupServiceImplTest.java
git commit -m "feat: add tenant setup completion endpoints for company and compliance details"
```

---

## Task 9: Notification-Service — Verification Email + Reminder Scheduler

**Files:**
- Create: `services/notification-service/src/main/resources/templates/email/verification-code.html`
- Create: `services/notification-service/src/main/resources/templates/email/setup-reminder-day2.html`
- Create: `services/notification-service/src/main/resources/templates/email/setup-reminder-day7.html`
- Create: `services/notification-service/src/main/resources/templates/email/setup-reminder-day12.html`
- Modify: `services/notification-service/src/main/java/com/surework/notification/consumer/DomainEventNotificationListener.java`
- Create: `services/notification-service/src/main/java/com/surework/notification/scheduler/SetupReminderScheduler.java`

- [ ] **Step 1: Create verification code email template**

Create `services/notification-service/src/main/resources/templates/email/verification-code.html`:

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #2563eb; color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">SureWork</h1>
    </div>
    <div style="border: 1px solid #e2e8f0; border-top: none; padding: 32px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; color: #1e293b;">Hi <span th:text="${firstName}">there</span>,</p>
        <p style="color: #475569;">Your verification code is:</p>
        <div style="background: #f1f5f9; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1e293b;"
                  th:text="${code}">123456</span>
        </div>
        <p style="color: #475569;">Enter this code in the app to verify your email and start using SureWork.</p>
        <p style="color: #94a3b8; font-size: 13px;">This code expires in 10 minutes. If you didn't create a SureWork account, you can ignore this email.</p>
    </div>
</body>
</html>
```

- [ ] **Step 2: Create reminder email templates**

Create the three reminder templates following the same HTML pattern. Each should include:
- `setup-reminder-day2.html`: Subject "You're set up — now unlock the rest". Body lists blocked features and links to settings.
- `setup-reminder-day7.html`: Subject "Your trial is half over". Body emphasizes time remaining.
- `setup-reminder-day12.html`: Subject "2 days left on your trial". Body is urgent, lists blocked features.

Each template receives variables: `firstName`, `companyDetailsComplete`, `complianceDetailsComplete`, `settingsUrl`, `daysRemaining`.

- [ ] **Step 3: Add event handler for VerificationCodeGenerated**

In `services/notification-service/src/main/java/com/surework/notification/consumer/DomainEventNotificationListener.java`, add a case for the new event type in the identity events handler:

```java
case IdentityEvent.VerificationCodeGenerated evt -> handleVerificationCode(evt);
```

And add the handler method:

```java
private void handleVerificationCode(IdentityEvent.VerificationCodeGenerated event) {
    var context = new org.thymeleaf.context.Context();
    context.setVariable("firstName", event.firstName());
    context.setVariable("code", event.code());

    String body = templateEngine.process("email/verification-code", context);
    emailService.sendHtmlEmail(event.email(), "Your SureWork verification code", body);
}
```

Add a `sendHtmlEmail()` method to `EmailServiceImpl` if it doesn't exist:

```java
public void sendHtmlEmail(String to, String subject, String htmlBody) {
    var message = mailSender.createMimeMessage();
    var helper = new MimeMessageHelper(message, true, "UTF-8");
    helper.setFrom(fromAddress);
    helper.setTo(to);
    helper.setSubject(subject);
    helper.setText(htmlBody, true);
    mailSender.send(message);
}
```

- [ ] **Step 4: Create SetupReminderScheduler**

Create `services/notification-service/src/main/java/com/surework/notification/scheduler/SetupReminderScheduler.java`:

```java
package com.surework.notification.scheduler;

import com.surework.notification.service.EmailServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.thymeleaf.TemplateEngine;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class SetupReminderScheduler {

    private final EmailServiceImpl emailService;
    private final TemplateEngine templateEngine;
    private final RestClient.Builder restClientBuilder;

    @Value("${surework.services.tenant-service.url:http://localhost:8081}")
    private String tenantServiceUrl;

    private static final Map<Integer, String> DAY_TO_TEMPLATE = Map.of(
            2, "email/setup-reminder-day2",
            7, "email/setup-reminder-day7",
            12, "email/setup-reminder-day12");

    @Scheduled(cron = "0 0 9 * * *") // Daily at 9 AM
    public void sendSetupReminders() {
        log.info("Running setup reminder scheduler");
        var today = LocalDate.now();

        DAY_TO_TEMPLATE.forEach((day, template) -> {
            var targetTrialStart = today.minusDays(day);
            sendRemindersForDate(targetTrialStart, template, 14 - day);
        });
    }

    private void sendRemindersForDate(LocalDate trialStartDate, String template, int daysRemaining) {
        try {
            var client = restClientBuilder.baseUrl(tenantServiceUrl).build();

            // Call tenant-service endpoint to find incomplete tenants by trial start date
            // GET /api/v1/tenant/setup/incomplete?subscriptionStart=YYYY-MM-DD
            var tenants = client.get()
                    .uri("/api/v1/tenant/setup/incomplete?subscriptionStart={date}", trialStartDate)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<IncompleteTenantDto>>() {});

            if (tenants == null || tenants.isEmpty()) return;

            for (var tenant : tenants) {
                var context = new org.thymeleaf.context.Context();
                context.setVariable("firstName", tenant.adminFirstName());
                context.setVariable("companyDetailsComplete", tenant.companyDetailsComplete());
                context.setVariable("complianceDetailsComplete", tenant.complianceDetailsComplete());
                context.setVariable("settingsUrl", "https://" + tenant.subdomain() + ".surework.co.za/settings");
                context.setVariable("daysRemaining", daysRemaining);

                String body = templateEngine.process(template, context);
                emailService.sendHtmlEmail(tenant.adminEmail(), getSubjectForTemplate(template), body);
                log.info("Sent setup reminder to {} (day {})", tenant.adminEmail(), 14 - daysRemaining);
            }
        } catch (Exception e) {
            log.error("Failed to send setup reminders for date {}", trialStartDate, e);
        }
    }

    private String getSubjectForTemplate(String template) {
        return switch (template) {
            case "email/setup-reminder-day2" -> "You're set up — now unlock the rest";
            case "email/setup-reminder-day7" -> "Your trial is half over";
            case "email/setup-reminder-day12" -> "2 days left on your trial";
            default -> "Complete your SureWork setup";
        };
    }

    record IncompleteTenantDto(
        UUID tenantId, String subdomain, String adminEmail, String adminFirstName,
        boolean companyDetailsComplete, boolean complianceDetailsComplete
    ) {}
}
```

- [ ] **Step 5: Add incomplete tenants query endpoint to tenant-service**

In `TenantSetupController`, add an internal endpoint for the scheduler to query:

```java
@GetMapping("/incomplete")
public ResponseEntity<List<IncompleteTenantResponse>> getIncompleteTenants(
        @RequestParam LocalDate subscriptionStart) {
    var tenants = setupService.findIncompleteBySubscriptionStart(subscriptionStart);
    return ResponseEntity.ok(tenants);
}
```

Add to `TenantSetupService` and implement in `TenantSetupServiceImpl`:

```java
public List<IncompleteTenantResponse> findIncompleteBySubscriptionStart(LocalDate date) {
    return tenantRepository
            .findBySubscriptionStartAndSetupIncomplete(date)
            .stream()
            .map(t -> new IncompleteTenantResponse(
                    t.getId(), t.getCode(), t.getEmail(), /* admin name from identity-service */
                    t.isCompanyDetailsComplete(), t.isComplianceDetailsComplete()))
            .toList();
}
```

Add custom query to `TenantRepository`:

```java
@Query("SELECT t FROM Tenant t WHERE t.subscriptionStart = :date AND (t.companyDetailsComplete = false OR t.complianceDetailsComplete = false)")
List<Tenant> findBySubscriptionStartAndSetupIncomplete(@Param("date") LocalDate date);
```

- [ ] **Step 6: Enable scheduling in notification-service**

Ensure `@EnableScheduling` is on the main application class or a config class in notification-service.

- [ ] **Step 7: Commit**

```bash
git add services/notification-service/src/main/resources/templates/email/verification-code.html \
      services/notification-service/src/main/resources/templates/email/setup-reminder-day2.html \
      services/notification-service/src/main/resources/templates/email/setup-reminder-day7.html \
      services/notification-service/src/main/resources/templates/email/setup-reminder-day12.html \
      services/notification-service/src/main/java/com/surework/notification/consumer/DomainEventNotificationListener.java \
      services/notification-service/src/main/java/com/surework/notification/scheduler/SetupReminderScheduler.java
git commit -m "feat: add verification email template and setup reminder scheduler"
```

---

## Task 10: Frontend — Simplified Signup Form + Verification Code Screen

**Files:**
- Modify: `frontend/src/app/features/onboarding/onboarding-wizard.component.ts`
- Create: `frontend/src/app/features/onboarding/verify-code.component.ts`
- Modify: `frontend/src/app/features/onboarding/onboarding.service.ts`
- Modify: `frontend/src/app/features/onboarding/onboarding.routes.ts`
- Modify: `frontend/src/app/features/onboarding/index.ts`

- [ ] **Step 1: Reduce SignupRequest in onboarding.service.ts**

In `frontend/src/app/features/onboarding/onboarding.service.ts`, replace the `SignupRequest` interface:

```typescript
export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  companyType: string;
  acceptTerms: boolean;
}

export interface VerifyRequest {
  email: string;
  code: string;
}

export interface VerifyResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
```

Add methods:

```typescript
verify(request: VerifyRequest): Observable<VerifyResponse> {
  return this.http.post<VerifyResponse>(`${this.apiUrl}/api/v1/signup/verify`, request);
}

resendCode(email: string): Observable<void> {
  return this.http.post<void>(`${this.apiUrl}/api/v1/signup/resend-code`, { email });
}
```

- [ ] **Step 2: Rewrite onboarding-wizard.component.ts to single step**

Replace the 5-step wizard with a single form containing 6 fields:
- First name, Last name (side by side)
- Work email
- Password (with strength indicator)
- Company name
- Company type (dropdown using existing `COMPANY_TYPES` static data)
- Terms checkbox

On submit:
1. Call `onboardingService.signup()`
2. Store email in `sessionStorage`
3. Navigate to `/signup/verify`

Remove imports and references to the 5 step components (`AccountStepComponent`, `CompanyStepComponent`, `ComplianceStepComponent`, `ContactStepComponent`, `ReviewStepComponent`). Remove the `steps` array, step navigation, progress bar.

Keep: async email validation, password strength display, form validation patterns, accessibility features, error handling.

- [ ] **Step 3: Create verify-code.component.ts**

Create `frontend/src/app/features/onboarding/verify-code.component.ts`:

```typescript
import { Component, signal, inject, OnInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OnboardingService } from './onboarding.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-verify-code',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div class="w-full max-w-md">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
          <div class="text-5xl mb-4">📧</div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check your email</h1>
          <p class="text-gray-500 dark:text-gray-400 mb-6">
            We sent a 6-digit code to <strong>{{ email() }}</strong>
          </p>

          <div class="flex justify-center gap-2 mb-6">
            @for (i of digitIndices; track i) {
              <input
                #digitInput
                type="text"
                inputmode="numeric"
                maxlength="1"
                class="w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                       dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                [value]="digits()[i]"
                (input)="onDigitInput($event, i)"
                (keydown)="onKeyDown($event, i)"
                (paste)="onPaste($event)"
                [attr.aria-label]="'Digit ' + (i + 1) + ' of 6'" />
            }
          </div>

          @if (error()) {
            <p class="text-red-500 text-sm mb-4">{{ error() }}</p>
          }

          <button
            (click)="verify()"
            [disabled]="verifying() || digits().join('').length < 6"
            class="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold
                   rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            @if (verifying()) {
              Verifying...
            } @else {
              Verify & continue
            }
          </button>

          <div class="mt-4 text-sm text-gray-500">
            Didn't receive the code?
            <button
              (click)="resend()"
              [disabled]="cooldown() > 0"
              class="text-blue-600 font-semibold hover:underline disabled:opacity-50">
              @if (cooldown() > 0) {
                Resend in {{ cooldown() }}s
              } @else {
                Resend
              }
            </button>
            <p class="mt-1 text-xs text-gray-400">Code expires in 10 minutes</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VerifyCodeComponent implements OnInit {
  private onboardingService = inject(OnboardingService);
  private authService = inject(AuthService);
  private router = inject(Router);

  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

  email = signal<string>('');
  digits = signal<string[]>(['', '', '', '', '', '']);
  verifying = signal(false);
  error = signal('');
  cooldown = signal(0);
  digitIndices = [0, 1, 2, 3, 4, 5];

  ngOnInit() {
    const email = sessionStorage.getItem('signup_email');
    if (!email) {
      this.router.navigate(['/signup']);
      return;
    }
    this.email.set(email);
  }

  onDigitInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');
    const newDigits = [...this.digits()];
    newDigits[index] = value.charAt(0) || '';
    this.digits.set(newDigits);

    if (value && index < 5) {
      this.digitInputs.get(index + 1)?.nativeElement.focus();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !this.digits()[index] && index > 0) {
      this.digitInputs.get(index - 1)?.nativeElement.focus();
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text')?.replace(/\D/g, '') || '';
    const newDigits = [...this.digits()];
    for (let i = 0; i < 6 && i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    this.digits.set(newDigits);
  }

  verify() {
    const code = this.digits().join('');
    if (code.length < 6) return;

    this.verifying.set(true);
    this.error.set('');

    this.onboardingService.verify({ email: this.email(), code }).subscribe({
      next: (response) => {
        this.authService.storeTokens(response.accessToken, response.refreshToken);
        sessionStorage.removeItem('signup_email');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.verifying.set(false);
        this.error.set(err.status === 400
          ? 'Invalid or expired code. Please try again.'
          : 'Something went wrong. Please try again.');
      }
    });
  }

  resend() {
    this.cooldown.set(60);
    const interval = setInterval(() => {
      this.cooldown.update(c => c - 1);
      if (this.cooldown() <= 0) clearInterval(interval);
    }, 1000);

    this.onboardingService.resendCode(this.email()).subscribe();
  }
}
```

- [ ] **Step 4: Update onboarding routes**

In `frontend/src/app/features/onboarding/onboarding.routes.ts`:

```typescript
export const onboardingRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./onboarding-wizard.component')
      .then(m => m.OnboardingWizardComponent)
  },
  {
    path: 'verify',
    loadComponent: () => import('./verify-code.component')
      .then(m => m.VerifyCodeComponent)
  }
];
```

Remove the `success` route.

- [ ] **Step 5: Delete signup-success.component.ts**

Delete `frontend/src/app/features/onboarding/signup-success.component.ts` — it's replaced by the verify-code flow.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/features/onboarding/
git commit -m "feat: simplify signup to single step with verification code screen"
```

---

## Task 11: Frontend — SetupGuard + SetupBlockComponent + Route Wiring

**Files:**
- Modify: `frontend/src/app/core/services/auth.service.ts`
- Create: `frontend/src/app/core/guards/setup.guard.ts`
- Create: `frontend/src/app/shared/components/setup-block/setup-block.component.ts`
- Modify: `frontend/src/app/app.routes.ts`

- [ ] **Step 1: Add tenant setup status to auth service**

In `frontend/src/app/core/services/auth.service.ts`, add:

```typescript
import { signal, computed } from '@angular/core';

// Add signals for setup status (parsed from JWT claims)
tenantSetupStatus = signal<{ companyDetailsComplete: boolean; complianceDetailsComplete: boolean }>({
  companyDetailsComplete: false,
  complianceDetailsComplete: false
});

isSetupComplete = computed(() => {
  const status = this.tenantSetupStatus();
  return status.companyDetailsComplete && status.complianceDetailsComplete;
});
```

Update `storeTokens()` or the method that decodes the JWT to also extract completion flags:

```typescript
private updateSetupStatus(token: string): void {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    this.tenantSetupStatus.set({
      companyDetailsComplete: payload.companyDetailsComplete ?? false,
      complianceDetailsComplete: payload.complianceDetailsComplete ?? false
    });
  } catch {}
}
```

Add a method to refresh setup status from backend (called after saving settings):

```typescript
refreshSetupStatus(): Observable<void> {
  return this.http.get<{ companyDetailsComplete: boolean; complianceDetailsComplete: boolean }>(
    `${environment.apiUrl}/api/v1/tenant/setup/status`
  ).pipe(
    tap(status => this.tenantSetupStatus.set(status)),
    map(() => void 0)
  );
}
```

- [ ] **Step 2: Create SetupGuard**

Create `frontend/src/app/core/guards/setup.guard.ts`. The guards redirect to a `/setup-required` page with a query param indicating which gate is blocking:

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export function companyDetailsGuard(): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.tenantSetupStatus().companyDetailsComplete) return true;
    return router.createUrlTree(['/setup-required'], {
      queryParams: { gate: 'COMPANY_DETAILS' }
    });
  };
}

export function complianceGuard(): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.tenantSetupStatus().complianceDetailsComplete) return true;
    return router.createUrlTree(['/setup-required'], {
      queryParams: { gate: 'COMPLIANCE' }
    });
  };
}
```

- [ ] **Step 3: Create SetupBlockComponent**

Create `frontend/src/app/shared/components/setup-block/setup-block.component.ts`:

```typescript
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-setup-block',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-[60vh] flex items-center justify-center">
      <div class="text-center max-w-md px-8">
        <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
             [class]="gate() === 'COMPANY_DETAILS'
               ? 'bg-amber-100 dark:bg-amber-900/30'
               : 'bg-pink-100 dark:bg-pink-900/30'">
          <span class="text-3xl">{{ gate() === 'COMPANY_DETAILS' ? '🏢' : '📋' }}</span>
        </div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {{ gate() === 'COMPANY_DETAILS'
            ? 'Complete your company details'
            : 'SARS compliance details required' }}
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
          {{ gate() === 'COMPANY_DETAILS'
            ? 'This feature requires your company registration number, address, and contact information. This takes about 2 minutes.'
            : 'This feature requires your tax number, UIF reference, SDL number, and PAYE reference to generate compliant documents.' }}
        </p>
        <a [routerLink]="gate() === 'COMPANY_DETAILS' ? ['/settings/company'] : ['/settings/compliance']"
           class="inline-block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold
                  rounded-lg transition-colors text-center">
          {{ gate() === 'COMPANY_DETAILS' ? 'Go to Company Settings' : 'Go to Compliance Settings' }}
        </a>
        <p class="mt-3 text-xs text-gray-400">
          {{ gate() === 'COMPANY_DETAILS' ? 'Settings → Company Profile' : 'Settings → Compliance' }}
        </p>
      </div>
    </div>
  `
})
export class SetupBlockComponent implements OnInit {
  private route = inject(ActivatedRoute);
  gate = signal<'COMPANY_DETAILS' | 'COMPLIANCE'>('COMPANY_DETAILS');

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.gate.set(params['gate'] || 'COMPANY_DETAILS');
    });
  }
}
```

- [ ] **Step 4: Wire guards into app.routes.ts**

In `frontend/src/app/app.routes.ts`, add the setup-required route and apply guards to gated feature routes:

```typescript
import { companyDetailsGuard, complianceGuard } from './core/guards/setup.guard';

// Add inside the shell children array:

// Setup required page (rendered inside shell)
{
  path: 'setup-required',
  loadComponent: () => import('./shared/components/setup-block/setup-block.component')
    .then(m => m.SetupBlockComponent)
},

// Payroll routes (compliance gate)
{
  path: 'payroll',
  canActivate: [complianceGuard()],
  loadChildren: () => import('./features/payroll/payroll.routes')
    .then(m => m.PAYROLL_ROUTES),
},

// Finance routes (company gate)
{
  path: 'finance',
  canActivate: [companyDetailsGuard()],
  loadChildren: () => import('./features/finance/finance.routes')
    .then(m => m.FINANCE_ROUTES),
},
```

**Accounting routes require split gating** — invoicing/customers use the company gate while payroll-integration/VAT/journals use the compliance gate. Modify `frontend/src/app/features/accounting/accounting.routes.ts` to apply guards at the child route level:

```typescript
import { companyDetailsGuard, complianceGuard } from '../../core/guards/setup.guard';

// Inside ACCOUNTING_ROUTES children:
// Company details gate:
{ path: 'invoicing', canActivate: [companyDetailsGuard()], ... },
{ path: 'customers', canActivate: [companyDetailsGuard()], ... },
{ path: 'reports', canActivate: [companyDetailsGuard()], ... },

// Compliance gate:
{ path: 'vat', canActivate: [complianceGuard()], ... },
{ path: 'payroll-integration', canActivate: [complianceGuard()], ... },
{ path: 'journal-entries', canActivate: [complianceGuard()], ... },

// Ungated (always accessible):
{ path: 'chart-of-accounts', ... },
{ path: 'banking', ... },
{ path: 'fiscal-periods', ... },
```

Leave ungated in `app.routes.ts`: dashboard, employees, leave, recruitment, documents, support, hr, settings, profile, notifications, reports (the accounting module itself is NOT gated at the top level — only its children are).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/core/services/auth.service.ts \
      frontend/src/app/core/guards/setup.guard.ts \
      frontend/src/app/shared/components/setup-block/setup-block.component.ts \
      frontend/src/app/app.routes.ts
git commit -m "feat: add setup guards and block overlay for gated features"
```

---

## Task 12: Frontend — Dashboard Setup Banner

**Files:**
- Create: `frontend/src/app/features/dashboard/widgets/setup-banner.component.ts`
- Modify: `frontend/src/app/features/dashboard/dashboard-content.component.ts`

- [ ] **Step 1: Create SetupBannerComponent**

Create `frontend/src/app/features/dashboard/widgets/setup-banner.component.ts`:

```typescript
import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-setup-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (showBanner()) {
      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800
                  rounded-xl p-4 mb-6">
        <div class="flex items-start gap-3">
          <span class="text-2xl">🚀</span>
          <div class="flex-1">
            <h3 class="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Complete your setup to unlock all features
            </h3>
            <p class="text-sm text-blue-700 dark:text-blue-300 mb-3">
              {{ remainingCount() === 2 ? 'Two steps' : 'One step' }} remaining to unlock all SureWork features.
            </p>
            <div class="flex flex-wrap gap-3">
              @if (!status().companyDetailsComplete) {
                <a routerLink="/settings/company"
                   class="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800
                          border border-blue-200 dark:border-blue-700 rounded-lg text-sm
                          font-medium text-blue-700 dark:text-blue-300
                          hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
                  🏢 Complete company details
                </a>
              }
              @if (!status().complianceDetailsComplete) {
                <a routerLink="/settings/compliance"
                   class="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800
                          border border-blue-200 dark:border-blue-700 rounded-lg text-sm
                          font-medium text-blue-700 dark:text-blue-300
                          hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
                  📋 Complete SARS compliance
                </a>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class SetupBannerComponent {
  private authService = inject(AuthService);

  status = this.authService.tenantSetupStatus;
  showBanner = computed(() => !this.authService.isSetupComplete());
  remainingCount = computed(() => {
    const s = this.status();
    return (s.companyDetailsComplete ? 0 : 1) + (s.complianceDetailsComplete ? 0 : 1);
  });
}
```

- [ ] **Step 2: Add SetupBannerComponent to dashboard**

In `frontend/src/app/features/dashboard/dashboard-content.component.ts`:

1. Import `SetupBannerComponent`
2. Add to `imports` array
3. Add `<app-setup-banner />` at the top of the template, before the existing dashboard content

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/features/dashboard/widgets/setup-banner.component.ts \
      frontend/src/app/features/dashboard/dashboard-content.component.ts
git commit -m "feat: add setup completion banner to dashboard"
```

---

## Task 13: Frontend — Company Profile Extensions + Compliance Settings

**Files:**
- Modify: `frontend/src/app/features/settings/company-profile/company-profile.component.ts`
- Create: `frontend/src/app/features/settings/compliance/compliance.component.ts`
- Modify: `frontend/src/app/features/settings/settings.routes.ts`
- Modify: `frontend/src/app/core/services/settings.service.ts`

- [ ] **Step 1: Add deferred fields to company-profile.component.ts**

In the existing company profile component, add form fields for:
- Registration number (with CIPC format validation pattern `\d{4}/\d{6}/\d{2}`)
- Trading name (optional)
- Industry sector (dropdown using `INDUSTRY_SECTORS` from onboarding service)
- Phone (+27 format)
- Company email
- Street address, city, province (dropdown), postal code

These fields may already partially exist. Add any missing ones. Update the save method to call the new `PUT /api/v1/tenant/setup/company-details` endpoint. After successful save, call `authService.refreshSetupStatus()` to update the cached completion flags.

- [ ] **Step 2: Create compliance.component.ts**

Create `frontend/src/app/features/settings/compliance/compliance.component.ts`:

```typescript
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SettingsService } from '../../../core/services/settings.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-compliance-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-2xl">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">SARS Compliance</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
        These details are required for payroll, VAT reporting, and accounting features.
      </p>

      <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tax Number *
          </label>
          <input formControlName="taxNumber" type="text"
                 placeholder="1234567890"
                 class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
          <p class="text-xs text-gray-400 mt-1">10-digit SARS tax number</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            VAT Number
          </label>
          <input formControlName="vatNumber" type="text"
                 placeholder="4123456789"
                 class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
          <p class="text-xs text-gray-400 mt-1">Optional — 10 digits starting with 4</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            UIF Reference *
          </label>
          <input formControlName="uifReference" type="text"
                 placeholder="U12345678"
                 class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
          <p class="text-xs text-gray-400 mt-1">U followed by 8 digits</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            SDL Number *
          </label>
          <input formControlName="sdlNumber" type="text"
                 placeholder="L12345678"
                 class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
          <p class="text-xs text-gray-400 mt-1">L followed by 8 digits</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            PAYE Reference *
          </label>
          <input formControlName="payeReference" type="text"
                 placeholder="1234567/123/1234"
                 class="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
          <p class="text-xs text-gray-400 mt-1">Format: NNNNNNN/NNN/NNNN</p>
        </div>

        <div class="pt-4">
          <button type="submit"
                  [disabled]="form.invalid || saving()"
                  class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold
                         rounded-lg disabled:opacity-50 transition-colors">
            {{ saving() ? 'Saving...' : 'Save compliance details' }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class ComplianceComponent implements OnInit {
  private fb = inject(FormBuilder);
  private settingsService = inject(SettingsService);
  private authService = inject(AuthService);

  saving = signal(false);

  form = this.fb.group({
    taxNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    vatNumber: ['', [Validators.pattern(/^4\d{9}$/)]],
    uifReference: ['', [Validators.required, Validators.pattern(/^U\d{8}$/)]],
    sdlNumber: ['', [Validators.required, Validators.pattern(/^L\d{8}$/)]],
    payeReference: ['', [Validators.required, Validators.pattern(/^\d{7}\/\d{3}\/\d{4}$/)]]
  });

  ngOnInit() {
    this.settingsService.getComplianceDetails().subscribe(data => {
      if (data) this.form.patchValue(data);
    });
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);

    this.settingsService.saveComplianceDetails(this.form.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.authService.refreshSetupStatus().subscribe();
      },
      error: () => this.saving.set(false)
    });
  }
}
```

- [ ] **Step 3: Add compliance API methods to settings.service.ts**

In `frontend/src/app/core/services/settings.service.ts`:

```typescript
getComplianceDetails(): Observable<any> {
  return this.http.get(`${environment.apiUrl}/api/v1/tenant/setup/compliance-details`);
}

saveComplianceDetails(data: any): Observable<any> {
  return this.http.put(`${environment.apiUrl}/api/v1/tenant/setup/compliance-details`, data);
}

saveCompanyDetails(data: any): Observable<any> {
  return this.http.put(`${environment.apiUrl}/api/v1/tenant/setup/company-details`, data);
}
```

- [ ] **Step 4: Add compliance route to settings.routes.ts**

In `frontend/src/app/features/settings/settings.routes.ts`:

```typescript
{
  path: 'compliance',
  loadComponent: () => import('./compliance/compliance.component')
    .then(m => m.ComplianceComponent),
  canActivate: [permissionGuard(['SYSTEM_ADMIN', 'TENANT_ALL'])]
}
```

- [ ] **Step 5: Add sidebar link for compliance settings**

In the settings layout component or sidebar, add a navigation item for "Compliance" linking to `/settings/compliance`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/features/settings/company-profile/company-profile.component.ts \
      frontend/src/app/features/settings/compliance/compliance.component.ts \
      frontend/src/app/features/settings/settings.routes.ts \
      frontend/src/app/core/services/settings.service.ts
git commit -m "feat: add compliance settings page and extend company profile with deferred fields"
```

---

## Verification Checklist

After all tasks are complete, verify:

- [ ] Signup form has exactly 6 fields + terms checkbox
- [ ] Verification code screen appears after signup, accepts 6 digits
- [ ] Successful verification logs user in and redirects to dashboard
- [ ] Dashboard shows setup banner when either flag is incomplete
- [ ] Navigating to accounting/payroll/finance shows block overlay when flags are false
- [ ] Navigating to employees/leave/recruitment/etc. works with incomplete flags
- [ ] Saving company details in settings sets `companyDetailsComplete = true`
- [ ] Saving compliance details in settings sets `complianceDetailsComplete = true`
- [ ] After both flags are true, all features are accessible and banner disappears
- [ ] Verification email is sent with 6-digit code
- [ ] Resend code works with 60-second cooldown
- [ ] Code expires after 10 minutes
