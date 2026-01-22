package com.surework.identity.service;

import com.surework.identity.dto.AuthDto;

import java.util.UUID;

/**
 * Service interface for authentication operations.
 */
public interface AuthenticationService {

    /**
     * Authenticate user with email and password.
     */
    AuthDto.LoginResponse login(AuthDto.LoginRequest request, UUID tenantId);

    /**
     * Verify MFA code and complete login.
     */
    AuthDto.LoginResponse verifyMfa(AuthDto.MfaVerifyRequest request, UUID tenantId);

    /**
     * Refresh access token using refresh token.
     */
    AuthDto.LoginResponse refresh(AuthDto.RefreshRequest request, UUID tenantId);

    /**
     * Logout user (invalidate tokens).
     */
    void logout(UUID userId, String accessToken);

    /**
     * Get current user information.
     */
    AuthDto.CurrentUserResponse getCurrentUser(UUID userId);

    /**
     * Enroll user in MFA.
     */
    AuthDto.MfaEnrollmentResponse enrollMfa(UUID userId);

    /**
     * Confirm MFA enrollment.
     */
    void confirmMfaEnrollment(UUID userId, String code);

    /**
     * Disable MFA for user.
     */
    void disableMfa(UUID userId, String password);

    /**
     * Change user password.
     */
    void changePassword(UUID userId, AuthDto.PasswordChangeRequest request);

    /**
     * Request password reset.
     */
    void requestPasswordReset(AuthDto.PasswordResetRequest request, UUID tenantId);

    /**
     * Confirm password reset with token.
     */
    void confirmPasswordReset(AuthDto.PasswordResetConfirmRequest request);
}
