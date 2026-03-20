package com.surework.identity.controller;

import com.surework.common.security.TenantContext;
import com.surework.identity.config.JwtHeaderAuthenticationFilter;
import com.surework.identity.dto.AuthDto;
import com.surework.identity.service.AuthenticationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST controller for authentication operations.
 * Implements Constitution Principle I: RESTful API Design.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService authenticationService;

    /**
     * Login with email and password.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthDto.LoginResponse> login(
            @Valid @RequestBody AuthDto.LoginRequest request,
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        AuthDto.LoginResponse response = authenticationService.login(request, tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Verify MFA code and complete login.
     */
    @PostMapping("/mfa/verify")
    public ResponseEntity<AuthDto.LoginResponse> verifyMfa(
            @Valid @RequestBody AuthDto.MfaVerifyRequest request,
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        AuthDto.LoginResponse response = authenticationService.verifyMfa(request, tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Refresh access token.
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthDto.LoginResponse> refresh(
            @Valid @RequestBody AuthDto.RefreshRequest request,
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        AuthDto.LoginResponse response = authenticationService.refresh(request, tenantId);
        return ResponseEntity.ok(response);
    }

    /**
     * Logout current user.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }
        authenticationService.logout(userId, token);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get current user information.
     */
    @GetMapping("/me")
    public ResponseEntity<AuthDto.CurrentUserResponse> getCurrentUser(
            @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId) {
        UUID userId = headerUserId;
        if (userId == null) {
            // Fallback: read from JWT authentication principal
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof JwtHeaderAuthenticationFilter.UserPrincipal principal) {
                userId = principal.userId();
            }
        }
        if (userId == null) {
            return ResponseEntity.status(403).build();
        }
        AuthDto.CurrentUserResponse response = authenticationService.getCurrentUser(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Enroll in MFA.
     */
    @PostMapping("/mfa/enroll")
    public ResponseEntity<AuthDto.MfaEnrollmentResponse> enrollMfa(
            @RequestHeader("X-User-Id") UUID userId) {
        AuthDto.MfaEnrollmentResponse response = authenticationService.enrollMfa(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Confirm MFA enrollment.
     */
    @PostMapping("/mfa/confirm")
    public ResponseEntity<Void> confirmMfaEnrollment(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestParam String code) {
        authenticationService.confirmMfaEnrollment(userId, code);
        return ResponseEntity.noContent().build();
    }

    /**
     * Disable MFA.
     */
    @PostMapping("/mfa/disable")
    public ResponseEntity<Void> disableMfa(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestParam String password) {
        authenticationService.disableMfa(userId, password);
        return ResponseEntity.noContent().build();
    }

    /**
     * Change password.
     */
    @PostMapping("/password/change")
    public ResponseEntity<Void> changePassword(
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody AuthDto.PasswordChangeRequest request) {
        authenticationService.changePassword(userId, request);
        return ResponseEntity.noContent().build();
    }

    /**
     * Request password reset.
     */
    @PostMapping("/password/reset")
    public ResponseEntity<Void> requestPasswordReset(
            @Valid @RequestBody AuthDto.PasswordResetRequest request,
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        authenticationService.requestPasswordReset(request, tenantId);
        return ResponseEntity.accepted().build();
    }

    /**
     * Confirm password reset.
     */
    @PostMapping("/password/reset/confirm")
    public ResponseEntity<Void> confirmPasswordReset(
            @Valid @RequestBody AuthDto.PasswordResetConfirmRequest request) {
        authenticationService.confirmPasswordReset(request);
        return ResponseEntity.noContent().build();
    }
}
