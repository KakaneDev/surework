package com.surework.identity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Set;

/**
 * DTOs for authentication operations.
 */
public sealed interface AuthDto {

    /**
     * Login request.
     */
    record LoginRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Invalid email format")
            String email,

            @NotBlank(message = "Password is required")
            String password,

            // Optional MFA code (required if MFA is enabled)
            String mfaCode
    ) implements AuthDto {}

    /**
     * Login response with tokens.
     */
    record LoginResponse(
            String accessToken,
            String refreshToken,
            long accessTokenExpiresIn,
            long refreshTokenExpiresIn,
            boolean mfaRequired,
            String mfaChallengeToken
    ) implements AuthDto {

        /**
         * Create response requiring MFA.
         */
        public static LoginResponse mfaRequired(String challengeToken) {
            return new LoginResponse(null, null, 0, 0, true, challengeToken);
        }

        /**
         * Create response with tokens.
         */
        public static LoginResponse withTokens(
                String accessToken,
                String refreshToken,
                long accessExpiresIn,
                long refreshExpiresIn) {
            return new LoginResponse(accessToken, refreshToken, accessExpiresIn, refreshExpiresIn, false, null);
        }
    }

    /**
     * MFA verification request.
     */
    record MfaVerifyRequest(
            @NotBlank(message = "Challenge token is required")
            String challengeToken,

            @NotBlank(message = "MFA code is required")
            @Size(min = 6, max = 6, message = "MFA code must be 6 digits")
            String mfaCode
    ) implements AuthDto {}

    /**
     * Token refresh request.
     */
    record RefreshRequest(
            @NotBlank(message = "Refresh token is required")
            String refreshToken
    ) implements AuthDto {}

    /**
     * MFA enrollment response.
     */
    record MfaEnrollmentResponse(
            String secret,
            String qrCodeUri,
            String[] recoveryCodes
    ) implements AuthDto {}

    /**
     * Password change request.
     */
    record PasswordChangeRequest(
            @NotBlank(message = "Current password is required")
            String currentPassword,

            @NotBlank(message = "New password is required")
            @Size(min = 12, message = "Password must be at least 12 characters")
            String newPassword
    ) implements AuthDto {}

    /**
     * Password reset request.
     */
    record PasswordResetRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Invalid email format")
            String email
    ) implements AuthDto {}

    /**
     * Password reset confirmation.
     */
    record PasswordResetConfirmRequest(
            @NotBlank(message = "Reset token is required")
            String resetToken,

            @NotBlank(message = "New password is required")
            @Size(min = 12, message = "Password must be at least 12 characters")
            String newPassword
    ) implements AuthDto {}

    /**
     * Current user info response.
     */
    record CurrentUserResponse(
            String userId,
            String employeeId,
            String email,
            String firstName,
            String lastName,
            String fullName,
            Set<String> roles,
            Set<String> permissions,
            boolean mfaEnabled
    ) implements AuthDto {}
}
