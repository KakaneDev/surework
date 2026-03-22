package com.surework.identity.service;

import com.surework.common.messaging.DomainEventPublisher;
import com.surework.common.messaging.event.IdentityEvent;
import com.surework.common.security.JwtTokenProvider;
import com.surework.common.security.TenantContext;
import com.surework.common.security.cache.TenantAwareRedisOps;
import com.surework.common.web.exception.BusinessRuleException;
import com.surework.common.web.exception.ResourceNotFoundException;
import com.surework.common.web.exception.ValidationException;
import com.surework.identity.domain.User;
import com.surework.identity.dto.AuthDto;
import com.surework.identity.repository.UserRepository;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of AuthenticationService.
 * Implements Constitution Principle V: Security (JWT, MFA, Rate Limiting).
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AuthenticationServiceImpl implements AuthenticationService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;
    private final DomainEventPublisher eventPublisher;

    @Value("${surework.security.rate-limit.max-failed-attempts:5}")
    private int maxFailedAttempts;

    @Value("${surework.security.rate-limit.lockout-duration:15}")
    private int lockoutMinutes;

    @Value("${surework.security.mfa.challenge-expiry:5}")
    private int mfaChallengeExpiryMinutes;

    @Value("${surework.identity.totp.issuer:SureWork}")
    private String totpIssuer;

    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();
    private final CodeVerifier codeVerifier = new DefaultCodeVerifier(
            new DefaultCodeGenerator(),
            new SystemTimeProvider()
    );

    @Override
    @Transactional
    public AuthDto.LoginResponse login(AuthDto.LoginRequest request, UUID tenantId) {
        // Find user scoped to tenant — prevents cross-tenant login
        User user = userRepository.findByEmailAndTenantIdAndDeletedFalse(request.email(), tenantId)
                .orElseThrow(() -> {
                    log.warn("Login attempt for non-existent user: {} (tenant: {})", request.email(), tenantId);
                    return new ValidationException("Invalid email or password", "email", "Invalid email or password");
                });

        // Check if locked out
        if (user.isLockedOut()) {
            log.warn("Login attempt for locked user: {}", request.email());
            publishLoginFailed(tenantId, request.email(), "Account locked");
            throw new BusinessRuleException("Account is temporarily locked. Try again later.");
        }

        // Check status
        if (user.getStatus() != User.UserStatus.ACTIVE) {
            log.warn("Login attempt for inactive user: {} (status: {})", request.email(), user.getStatus());
            publishLoginFailed(tenantId, request.email(), "Account not active");
            throw new BusinessRuleException("Account is not active");
        }

        // Verify password
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            user.recordFailedLogin(maxFailedAttempts, lockoutMinutes);
            userRepository.save(user);
            log.warn("Failed login attempt for user: {} (attempts: {})",
                    request.email(), user.getFailedLoginAttempts());
            publishLoginFailed(tenantId, request.email(), "Invalid password");
            throw new ValidationException("Invalid email or password", "password", "Invalid email or password");
        }

        // Check MFA
        if (user.isMfaEnabled()) {
            if (request.mfaCode() == null || request.mfaCode().isBlank()) {
                // Issue MFA challenge
                String challengeToken = issueMfaChallenge(user.getId(), tenantId);
                return AuthDto.LoginResponse.mfaRequired(challengeToken);
            }

            // Verify MFA code
            if (!verifyTotpCode(user.getMfaSecret(), request.mfaCode())) {
                user.recordFailedLogin(maxFailedAttempts, lockoutMinutes);
                userRepository.save(user);
                publishLoginFailed(tenantId, request.email(), "Invalid MFA code");
                throw new ValidationException("Invalid MFA code", "mfaCode", "Invalid MFA code");
            }
        }

        // Successful login
        return completeLogin(user, tenantId);
    }

    @Override
    @Transactional
    public AuthDto.LoginResponse verifyMfa(AuthDto.MfaVerifyRequest request, UUID tenantId) {
        // Validate challenge token with tenant-prefixed key
        String key = TenantAwareRedisOps.key(tenantId, "mfa", "challenge", request.challengeToken());
        String userIdStr = redisTemplate.opsForValue().get(key);

        if (userIdStr == null) {
            throw new BusinessRuleException("MFA challenge expired or invalid");
        }

        UUID userId = UUID.fromString(userIdStr);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        // Verify code
        if (!verifyTotpCode(user.getMfaSecret(), request.mfaCode())) {
            user.recordFailedLogin(maxFailedAttempts, lockoutMinutes);
            userRepository.save(user);
            publishLoginFailed(tenantId, user.getEmail(), "Invalid MFA code");
            throw new ValidationException("Invalid MFA code", "mfaCode", "Invalid MFA code");
        }

        // Delete challenge
        redisTemplate.delete(key);

        return completeLogin(user, tenantId);
    }

    @Override
    @Transactional
    public AuthDto.LoginResponse refresh(AuthDto.RefreshRequest request, UUID tenantId) {
        // Validate refresh token and get claims
        var claimsOpt = jwtTokenProvider.validateToken(request.refreshToken());
        if (claimsOpt.isEmpty()) {
            throw new BusinessRuleException("Invalid or expired refresh token");
        }

        // Check if token is blacklisted
        if (isTokenBlacklisted(request.refreshToken())) {
            throw new BusinessRuleException("Refresh token has been revoked");
        }

        var claims = claimsOpt.get();

        if (!jwtTokenProvider.isRefreshToken(claims)) {
            throw new BusinessRuleException("Invalid token type");
        }

        UUID userId = jwtTokenProvider.getUserId(claims)
                .orElseThrow(() -> new BusinessRuleException("Invalid token: missing user ID"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (user.getStatus() != User.UserStatus.ACTIVE) {
            throw new BusinessRuleException("Account is not active");
        }

        // Issue new tokens
        return issueTokens(user, tenantId);
    }

    @Override
    @Transactional
    public void logout(UUID userId, String accessToken) {
        // Blacklist the access token with tenant-prefixed key
        if (accessToken != null) {
            jwtTokenProvider.validateToken(accessToken).ifPresent(claims -> {
                long expiresIn = claims.getExpiration().getTime() - System.currentTimeMillis();
                if (expiresIn > 0) {
                    // Use keyOrGlobal since tenant context might not be set during logout
                    String key = TenantAwareRedisOps.keyOrGlobal("token", "blacklist", accessToken);
                    redisTemplate.opsForValue().set(key, "1", Duration.ofMillis(expiresIn));
                }
            });
        }
        log.info("User {} logged out", userId);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthDto.CurrentUserResponse getCurrentUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        // Build role responses with nested permissions (matches frontend BackendRoleResponse)
        List<AuthDto.RoleResponse> roleResponses = user.getRoles().stream()
                .map(r -> new AuthDto.RoleResponse(
                        r.getCode(),
                        r.getName(),
                        r.getPermissions() != null
                                ? r.getPermissions().stream()
                                        .map(p -> new AuthDto.PermissionResponse(p))
                                        .toList()
                                : List.of()
                ))
                .toList();

        return new AuthDto.CurrentUserResponse(
                userId.toString(),
                user.getEmployeeId() != null ? user.getEmployeeId().toString() : null,
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getFullName(),
                roleResponses,
                user.isMfaEnabled()
        );
    }

    @Override
    @Transactional
    public AuthDto.MfaEnrollmentResponse enrollMfa(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (user.isMfaEnabled()) {
            throw new BusinessRuleException("MFA is already enabled");
        }

        // Generate secret
        String secret = secretGenerator.generate();

        // Store pending secret in Redis with tenant-prefixed key (expires in 10 minutes)
        String key = TenantAwareRedisOps.keyOrGlobal("mfa", "pending", userId.toString());
        redisTemplate.opsForValue().set(key, secret, Duration.ofMinutes(10));

        // Generate QR code URI
        String qrCodeUri = String.format(
                "otpauth://totp/%s:%s?secret=%s&issuer=%s&digits=6&period=30",
                totpIssuer,
                user.getEmail(),
                secret,
                totpIssuer
        );

        // Generate recovery codes
        String[] recoveryCodes = generateRecoveryCodes();

        return new AuthDto.MfaEnrollmentResponse(secret, qrCodeUri, recoveryCodes);
    }

    @Override
    @Transactional
    public void confirmMfaEnrollment(UUID userId, String code) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        // Get pending secret with tenant-prefixed key
        String key = TenantAwareRedisOps.keyOrGlobal("mfa", "pending", userId.toString());
        String secret = redisTemplate.opsForValue().get(key);

        if (secret == null) {
            throw new BusinessRuleException("MFA enrollment expired. Please start again.");
        }

        // Verify code
        if (!verifyTotpCode(secret, code)) {
            throw new ValidationException("Invalid verification code", "code", "Invalid verification code");
        }

        // Enable MFA
        user.setMfaEnabled(true);
        user.setMfaSecret(secret);
        userRepository.save(user);

        // Delete pending secret
        redisTemplate.delete(key);

        // Publish event
        UUID tenantId = TenantContext.getTenantId().orElse(null);
        if (tenantId != null) {
            eventPublisher.publish(new IdentityEvent.UserMfaEnabled(
                    UUID.randomUUID(),
                    tenantId,
                    Instant.now(),
                    userId,
                    "TOTP"
            ));
        }

        log.info("MFA enabled for user {}", userId);
    }

    @Override
    @Transactional
    public void disableMfa(UUID userId, String password) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (!user.isMfaEnabled()) {
            throw new BusinessRuleException("MFA is not enabled");
        }

        // Verify password
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new ValidationException("Invalid password", "password", "Invalid password");
        }

        user.setMfaEnabled(false);
        user.setMfaSecret(null);
        userRepository.save(user);

        UUID tenantId = TenantContext.getTenantId().orElse(null);
        if (tenantId != null) {
            eventPublisher.publish(new IdentityEvent.UserMfaDisabled(
                    UUID.randomUUID(),
                    tenantId,
                    Instant.now(),
                    userId,
                    TenantContext.getUserId().orElse(userId)
            ));
        }

        log.info("MFA disabled for user {}", userId);
    }

    @Override
    @Transactional
    public void changePassword(UUID userId, AuthDto.PasswordChangeRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        // Verify current password
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ValidationException("Invalid current password", "currentPassword", "Invalid current password");
        }

        // Validate new password
        validatePassword(request.newPassword());

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setPasswordChangedAt(Instant.now());
        userRepository.save(user);

        UUID tenantId = TenantContext.getTenantId().orElse(null);
        if (tenantId != null) {
            eventPublisher.publish(new IdentityEvent.UserPasswordChanged(
                    UUID.randomUUID(),
                    tenantId,
                    Instant.now(),
                    userId,
                    true
            ));
        }

        log.info("Password changed for user {}", userId);
    }

    @Override
    public void requestPasswordReset(AuthDto.PasswordResetRequest request, UUID tenantId) {
        // Always return success to prevent email enumeration — scoped to tenant
        userRepository.findByEmailAndTenantIdAndDeletedFalse(request.email(), tenantId).ifPresent(user -> {
            // Generate reset token with global key (user not authenticated during password reset)
            String resetToken = UUID.randomUUID().toString();
            String key = TenantAwareRedisOps.globalKey("password", "reset", resetToken);
            redisTemplate.opsForValue().set(key, user.getId().toString(), Duration.ofHours(1));

            // TODO: Send email via notification service
            log.info("Password reset requested for user {} (token: {})", user.getId(), resetToken);
        });
    }

    @Override
    @Transactional
    public void confirmPasswordReset(AuthDto.PasswordResetConfirmRequest request) {
        // Use global key since user is not authenticated during password reset
        String key = TenantAwareRedisOps.globalKey("password", "reset", request.resetToken());
        String userIdStr = redisTemplate.opsForValue().get(key);

        if (userIdStr == null) {
            throw new BusinessRuleException("Password reset link expired or invalid");
        }

        UUID userId = UUID.fromString(userIdStr);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        // Validate new password
        validatePassword(request.newPassword());

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setPasswordChangedAt(Instant.now());
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        // Delete reset token
        redisTemplate.delete(key);

        log.info("Password reset completed for user {}", userId);
    }

    // Helper methods

    private AuthDto.LoginResponse completeLogin(User user, UUID tenantId) {
        user.recordSuccessfulLogin();
        userRepository.save(user);

        publishLoginSucceeded(user, tenantId);

        return issueTokens(user, tenantId);
    }

    private AuthDto.LoginResponse issueTokens(User user, UUID tenantId) {
        // Use role code (e.g., HR_MANAGER) for authorization, not display name
        Set<String> roles = user.getRoles().stream()
                .map(r -> r.getCode())
                .collect(Collectors.toSet());

        Set<String> permissions = user.getRoles().stream()
                .flatMap(r -> r.getPermissions().stream())
                .collect(Collectors.toSet());

        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(),
                tenantId,
                user.getEmail(),
                user.getEmployeeId(),
                roles,
                permissions
        );

        String refreshToken = jwtTokenProvider.generateRefreshToken(
                user.getId(), tenantId
        );

        return AuthDto.LoginResponse.withTokens(
                accessToken,
                refreshToken,
                jwtTokenProvider.getAccessTokenExpirationSeconds() * 1000,
                jwtTokenProvider.getRefreshTokenExpirationSeconds() * 1000
        );
    }

    private String issueMfaChallenge(UUID userId, UUID tenantId) {
        String challengeToken = UUID.randomUUID().toString();
        // Use tenant-prefixed key for MFA challenges
        String key = TenantAwareRedisOps.key(tenantId, "mfa", "challenge", challengeToken);
        redisTemplate.opsForValue().set(key, userId.toString(),
                Duration.ofMinutes(mfaChallengeExpiryMinutes));
        return challengeToken;
    }

    private boolean verifyTotpCode(String secret, String code) {
        return codeVerifier.isValidCode(secret, code);
    }

    private boolean isTokenBlacklisted(String token) {
        // Use keyOrGlobal since tenant context might not be set during token validation
        String key = TenantAwareRedisOps.keyOrGlobal("token", "blacklist", token);
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    private void validatePassword(String password) {
        List<String> errors = new ArrayList<>();

        if (password.length() < 12) {
            errors.add("Password must be at least 12 characters");
        }
        if (!password.matches(".*[A-Z].*")) {
            errors.add("Password must contain at least one uppercase letter");
        }
        if (!password.matches(".*[a-z].*")) {
            errors.add("Password must contain at least one lowercase letter");
        }
        if (!password.matches(".*\\d.*")) {
            errors.add("Password must contain at least one digit");
        }
        if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?].*")) {
            errors.add("Password must contain at least one special character");
        }

        if (!errors.isEmpty()) {
            String errorMessage = String.join(". ", errors);
            throw new ValidationException(errorMessage, "newPassword", errorMessage);
        }
    }

    private String[] generateRecoveryCodes() {
        return java.util.stream.IntStream.range(0, 10)
                .mapToObj(i -> UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .toArray(String[]::new);
    }

    private void publishLoginSucceeded(User user, UUID tenantId) {
        try {
            String clientIp = TenantContext.getClientIp().orElse("unknown");
            eventPublisher.publish(new IdentityEvent.UserLoginSucceeded(
                    UUID.randomUUID(),
                    tenantId,
                    Instant.now(),
                    user.getId(),
                    clientIp,
                    "unknown"
            ));
        } catch (Exception e) {
            log.warn("Failed to publish login succeeded event: {}", e.getMessage());
        }
    }

    private void publishLoginFailed(UUID tenantId, String email, String reason) {
        try {
            String clientIp = TenantContext.getClientIp().orElse("unknown");
            eventPublisher.publish(new IdentityEvent.UserLoginFailed(
                    UUID.randomUUID(),
                    tenantId,
                    Instant.now(),
                    email,
                    clientIp,
                    reason
            ));
        } catch (Exception e) {
            log.warn("Failed to publish login failed event: {}", e.getMessage());
        }
    }
}
