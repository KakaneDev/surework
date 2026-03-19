package com.surework.tenant.controller;

import com.surework.tenant.config.RateLimitConfig;
import com.surework.tenant.dto.SignupDto;
import com.surework.tenant.exception.RateLimitExceededException;
import com.surework.tenant.service.SignupService;
import com.surework.tenant.util.PiiMasker;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for self-service tenant signup.
 * This endpoint is publicly accessible (no authentication required).
 *
 * <p>Security measures implemented:
 * <ul>
 *   <li>Rate limiting to prevent brute force and DoS attacks</li>
 *   <li>Input validation via Jakarta Bean Validation</li>
 *   <li>PII masking in all log statements</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/v1/signup")
@RequiredArgsConstructor
@Slf4j
public class SignupController {

    private final SignupService signupService;
    private final RateLimitConfig rateLimitConfig;

    /**
     * Process a new tenant signup request.
     * Creates tenant, admin user, and triggers schema provisioning.
     *
     * <p>Rate limit: 5 requests per minute, 20 per hour per IP.
     */
    @PostMapping
    public ResponseEntity<SignupDto.SignupResponse> signup(
            @Valid @RequestBody SignupDto.SignupRequest request,
            HttpServletRequest httpRequest) {

        String clientIp = getClientIp(httpRequest);
        checkRateLimit(rateLimitConfig.getSignupBucket(clientIp), "signup", clientIp);

        log.info("Received signup request: email={}, company={}",
                PiiMasker.maskEmail(request.email()),
                PiiMasker.maskCompanyName(request.companyName()));

        SignupDto.SignupResponse response = signupService.signup(request);

        log.info("Signup completed: tenantId={}, subdomain={}",
                response.tenantId(), response.subdomain());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Check if an email is available for signup.
     *
     * <p>Rate limit: 30 requests per minute per IP.
     */
    @GetMapping("/check-email")
    public ResponseEntity<SignupDto.AvailabilityResponse> checkEmailAvailability(
            @RequestParam String email,
            HttpServletRequest httpRequest) {

        String clientIp = getClientIp(httpRequest);
        checkRateLimit(rateLimitConfig.getAvailabilityBucket(clientIp), "email-check", clientIp);

        log.debug("Checking email availability: {}", PiiMasker.maskEmail(email));

        SignupDto.AvailabilityResponse response = signupService.checkEmailAvailability(email);
        return ResponseEntity.ok(response);
    }

    /**
     * Check if a company registration number is available.
     *
     * <p>Rate limit: 30 requests per minute per IP.
     */
    @GetMapping("/check-registration")
    public ResponseEntity<SignupDto.AvailabilityResponse> checkRegistrationNumberAvailability(
            @RequestParam String registrationNumber,
            HttpServletRequest httpRequest) {

        String clientIp = getClientIp(httpRequest);
        checkRateLimit(rateLimitConfig.getAvailabilityBucket(clientIp), "registration-check", clientIp);

        log.debug("Checking registration number availability: {}",
                PiiMasker.maskRegistrationNumber(registrationNumber));

        SignupDto.AvailabilityResponse response =
                signupService.checkRegistrationNumberAvailability(registrationNumber);
        return ResponseEntity.ok(response);
    }

    /**
     * Verify a one-time code sent to the user's email after signup.
     * On success, activates the tenant trial and returns JWT tokens.
     *
     * <p>Rate limit: 5 requests per minute per IP (same as signup).
     */
    @PostMapping("/verify")
    public ResponseEntity<SignupDto.VerifyResponse> verify(
            @RequestBody @Valid SignupDto.VerifyRequest request,
            HttpServletRequest httpRequest) {

        String clientIp = getClientIp(httpRequest);
        checkRateLimit(rateLimitConfig.getSignupBucket(clientIp), "verify", clientIp);

        log.info("Email verification attempt for: {}", PiiMasker.maskEmail(request.email()));
        var response = signupService.verify(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Resend a verification code to the given email address.
     *
     * <p>Rate limit: 5 requests per minute per IP (same as signup).
     */
    @PostMapping("/resend-code")
    public ResponseEntity<Void> resendCode(
            @RequestBody @Valid SignupDto.ResendCodeRequest request,
            HttpServletRequest httpRequest) {

        String clientIp = getClientIp(httpRequest);
        checkRateLimit(rateLimitConfig.getSignupBucket(clientIp), "resend-code", clientIp);

        log.info("Resend verification code for: {}", PiiMasker.maskEmail(request.email()));
        signupService.resendCode(request);
        return ResponseEntity.ok().build();
    }

    /**
     * Get available company types.
     * No rate limiting - static data.
     */
    @GetMapping("/company-types")
    public ResponseEntity<SignupDto.CompanyType[]> getCompanyTypes() {
        return ResponseEntity.ok(SignupDto.CompanyType.values());
    }

    /**
     * Get available industry sectors.
     * No rate limiting - static data.
     */
    @GetMapping("/industry-sectors")
    public ResponseEntity<SignupDto.IndustrySector[]> getIndustrySectors() {
        return ResponseEntity.ok(SignupDto.IndustrySector.values());
    }

    /**
     * Get available provinces.
     * No rate limiting - static data.
     */
    @GetMapping("/provinces")
    public ResponseEntity<SignupDto.Province[]> getProvinces() {
        return ResponseEntity.ok(SignupDto.Province.values());
    }

    /**
     * Checks rate limit and throws exception if exceeded.
     *
     * @param bucket the rate limit bucket to check
     * @param operation the operation name for logging
     * @param clientIp the client IP for logging
     * @throws RateLimitExceededException if rate limit is exceeded
     */
    private void checkRateLimit(Bucket bucket, String operation, String clientIp) {
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        if (!probe.isConsumed()) {
            long waitTimeSeconds = probe.getNanosToWaitForRefill() / 1_000_000_000;
            log.warn("Rate limit exceeded: operation={}, ip={}, retryAfter={}s",
                    operation, clientIp, waitTimeSeconds);
            throw new RateLimitExceededException(
                    "Too many requests. Please try again in " + waitTimeSeconds + " seconds.",
                    waitTimeSeconds
            );
        }

        log.trace("Rate limit check passed: operation={}, remaining={}",
                operation, probe.getRemainingTokens());
    }

    /**
     * Extracts client IP address from request, handling proxy headers.
     *
     * @param request the HTTP request
     * @return the client IP address
     */
    private String getClientIp(HttpServletRequest request) {
        // Check X-Forwarded-For header first (for proxies/load balancers)
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // Take the first IP in the chain (original client)
            return xForwardedFor.split(",")[0].trim();
        }

        // Check X-Real-IP header (Nginx)
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        // Fall back to remote address
        return request.getRemoteAddr();
    }
}
