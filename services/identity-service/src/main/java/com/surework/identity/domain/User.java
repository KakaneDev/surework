package com.surework.identity.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * User entity for authentication and authorization.
 * Implements Constitution Principle V: Security.
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(name = "phone_number")
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.PENDING;

    @Column(nullable = false)
    private boolean mfaEnabled = false;

    private String mfaSecret;

    @Column(nullable = false)
    private int failedLoginAttempts = 0;

    private Instant lockedUntil;

    @Column(name = "last_login_at")
    private Instant lastLogin;

    @Column(name = "password_changed_at")
    private Instant passwordChangedAt;

    // Link to employee record (if applicable)
    private UUID employeeId;

    @Column(name = "verification_code", length = 6)
    private String verificationCode;

    @Column(name = "verification_code_expiry")
    private Instant verificationCodeExpiry;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final Duration CODE_VALIDITY = Duration.ofMinutes(10);

    // LAZY fetch to prevent N+1 queries - use JOIN FETCH when roles are needed
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

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

    /**
     * Check if user is currently locked out.
     */
    public boolean isLockedOut() {
        return lockedUntil != null && lockedUntil.isAfter(Instant.now());
    }

    /**
     * Record a failed login attempt.
     */
    public void recordFailedLogin(int maxAttempts, int lockoutMinutes) {
        failedLoginAttempts++;
        if (failedLoginAttempts >= maxAttempts) {
            lockedUntil = Instant.now().plusSeconds(lockoutMinutes * 60L);
        }
    }

    /**
     * Record a successful login.
     */
    public void recordSuccessfulLogin() {
        failedLoginAttempts = 0;
        lockedUntil = null;
        lastLogin = Instant.now();
    }

    /**
     * Get full name.
     */
    public String getFullName() {
        return firstName + " " + lastName;
    }

    /**
     * User status enum.
     */
    public enum UserStatus {
        PENDING,     // Awaiting email verification
        ACTIVE,      // Normal active state
        SUSPENDED,   // Temporarily disabled
        DEACTIVATED  // Permanently disabled
    }
}
