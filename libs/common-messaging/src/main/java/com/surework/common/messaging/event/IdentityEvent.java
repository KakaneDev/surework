package com.surework.common.messaging.event;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

/**
 * Sealed interface for Identity/Authentication domain events.
 * Implements Constitution Principle III: Java 21 Features (Sealed Interfaces).
 */
public sealed interface IdentityEvent extends DomainEvent permits
        IdentityEvent.UserCreated,
        IdentityEvent.UserActivated,
        IdentityEvent.UserDeactivated,
        IdentityEvent.UserPasswordChanged,
        IdentityEvent.UserMfaEnabled,
        IdentityEvent.UserMfaDisabled,
        IdentityEvent.UserRolesChanged,
        IdentityEvent.UserLoginSucceeded,
        IdentityEvent.UserLoginFailed,
        IdentityEvent.UserLockedOut,
        IdentityEvent.VerificationCodeGenerated {

    /**
     * Event raised when a new user is created.
     */
    record UserCreated(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID userId,
            String email,
            Set<String> roles
    ) implements IdentityEvent {}

    /**
     * Event raised when a user is activated.
     */
    record UserActivated(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID userId,
            String email
    ) implements IdentityEvent {}

    /**
     * Event raised when a user is deactivated.
     */
    record UserDeactivated(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID userId,
            String email,
            String reason
    ) implements IdentityEvent {}

    /**
     * Event raised when a user changes their password.
     */
    record UserPasswordChanged(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID userId,
            boolean selfInitiated
    ) implements IdentityEvent {}

    /**
     * Event raised when MFA is enabled for a user.
     */
    record UserMfaEnabled(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID userId,
            String mfaMethod
    ) implements IdentityEvent {}

    /**
     * Event raised when MFA is disabled for a user.
     */
    record UserMfaDisabled(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID userId,
            UUID disabledBy
    ) implements IdentityEvent {}

    /**
     * Event raised when user roles are changed.
     */
    record UserRolesChanged(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID userId,
            Set<String> previousRoles,
            Set<String> newRoles,
            UUID changedBy
    ) implements IdentityEvent {}

    /**
     * Event raised on successful login.
     */
    record UserLoginSucceeded(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID userId,
            String ipAddress,
            String userAgent
    ) implements IdentityEvent {}

    /**
     * Event raised on failed login attempt.
     */
    record UserLoginFailed(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            String email,
            String ipAddress,
            String failureReason
    ) implements IdentityEvent {}

    /**
     * Event raised when a user is locked out due to failed attempts.
     */
    record UserLockedOut(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID userId,
            String email,
            int failedAttempts,
            Instant lockoutUntil
    ) implements IdentityEvent {}

    /**
     * Event raised when a verification code is generated for a user.
     */
    record VerificationCodeGenerated(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID userId,
            String email,
            String code,
            String firstName
    ) implements IdentityEvent {}
}
