package com.surework.tenant.service;

import com.surework.tenant.dto.SignupDto;

/**
 * Service interface for self-service tenant signup.
 */
public interface SignupService {

    /**
     * Process a new tenant signup request.
     * Creates tenant, admin user, and triggers schema provisioning.
     *
     * @param request the signup request data
     * @return signup response with tenant details
     */
    SignupDto.SignupResponse signup(SignupDto.SignupRequest request);

    /**
     * Check if an email is available for signup.
     *
     * @param email the email to check
     * @return availability response
     */
    SignupDto.AvailabilityResponse checkEmailAvailability(String email);

    /**
     * Check if a company registration number is available.
     *
     * @param registrationNumber the registration number to check
     * @return availability response
     */
    SignupDto.AvailabilityResponse checkRegistrationNumberAvailability(String registrationNumber);

    /**
     * Resend verification email for a pending tenant signup.
     *
     * @param email the email to resend verification to
     */
    void resendVerificationEmail(String email);

    /**
     * Verify a one-time code sent to the user's email after signup.
     * Activates the user in identity-service, transitions the tenant from PENDING to TRIAL,
     * and returns JWT tokens so the user is immediately logged in.
     *
     * @param request the verification request containing email and 6-digit code
     * @return JWT access token, refresh token, and expiry seconds
     */
    SignupDto.VerifyResponse verify(SignupDto.VerifyRequest request);

    /**
     * Resend a verification code to the given email address.
     *
     * @param request the resend request containing the email address
     */
    void resendCode(SignupDto.ResendCodeRequest request);
}
