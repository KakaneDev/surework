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
}
