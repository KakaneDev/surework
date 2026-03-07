package com.surework.recruitment.integration.portals;

import com.surework.common.messaging.DomainEventPublisher;
import com.surework.common.messaging.event.RecruitmentEvent;
import com.surework.recruitment.domain.JobPosting;
import com.surework.recruitment.domain.PlatformPortalCredentials;
import com.surework.recruitment.integration.portals.playwright.PlaywrightManager;
import com.surework.recruitment.repository.PlatformPortalCredentialsRepository;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.Page;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Service for managing platform-level portal credentials.
 * Handles encryption/decryption of sensitive credential data.
 *
 * NOTE: In production, the encryption key should come from:
 * - AWS Secrets Manager
 * - HashiCorp Vault
 * - Environment variable (for simpler setups)
 */
@Service
public class PortalCredentialsService {

    private static final Logger log = LoggerFactory.getLogger(PortalCredentialsService.class);

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;
    private static final int LOGIN_TIMEOUT_SECONDS = 30;

    private final SecretKey encryptionKey;
    private final PlatformPortalCredentialsRepository credentialsRepository;
    private final PlaywrightManager playwrightManager;
    private final DomainEventPublisher eventPublisher;

    @Value("${portal.automation.validation.enabled:true}")
    private boolean validationEnabled;

    public PortalCredentialsService(
            PlatformPortalCredentialsRepository credentialsRepository,
            PlaywrightManager playwrightManager,
            DomainEventPublisher eventPublisher) {
        this.credentialsRepository = credentialsRepository;
        this.playwrightManager = playwrightManager;
        this.eventPublisher = eventPublisher;

        // In production, this should come from external secret management
        // For now, use environment variable or a default for development
        String keyBase64 = System.getenv("PORTAL_CREDENTIALS_KEY");
        if (keyBase64 == null || keyBase64.isEmpty()) {
            // Generate a development key (NOT FOR PRODUCTION)
            keyBase64 = "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY="; // 32-byte key base64 encoded
            log.warn("Using development encryption key. Set PORTAL_CREDENTIALS_KEY environment variable in production.");
        }
        byte[] keyBytes = Base64.getDecoder().decode(keyBase64);
        this.encryptionKey = new SecretKeySpec(keyBytes, "AES");
    }

    /**
     * Portal credentials data transfer object.
     */
    public record PortalCredentials(
            String username,
            String password,
            String additionalConfig
    ) {}

    /**
     * Encrypt credentials for storage.
     *
     * @param plaintext The plaintext credential
     * @return Base64 encoded encrypted value
     */
    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isEmpty()) {
            return null;
        }
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, encryptionKey, spec);

            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            // Prepend IV to ciphertext
            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            byteBuffer.put(iv);
            byteBuffer.put(ciphertext);

            return Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (Exception e) {
            throw new RuntimeException("Failed to encrypt credential", e);
        }
    }

    /**
     * Decrypt credentials from storage.
     *
     * @param encrypted Base64 encoded encrypted value
     * @return Decrypted plaintext
     */
    public String decrypt(String encrypted) {
        if (encrypted == null || encrypted.isEmpty()) {
            return null;
        }
        try {
            byte[] decoded = Base64.getDecoder().decode(encrypted);
            ByteBuffer byteBuffer = ByteBuffer.wrap(decoded);

            byte[] iv = new byte[GCM_IV_LENGTH];
            byteBuffer.get(iv);

            byte[] ciphertext = new byte[byteBuffer.remaining()];
            byteBuffer.get(ciphertext);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, encryptionKey, spec);

            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Failed to decrypt credential", e);
        }
    }

    /**
     * Get credentials for a portal.
     *
     * @param portal The job portal
     * @return Optional credentials if configured and active
     */
    @Transactional(readOnly = true)
    public Optional<PortalCredentials> getCredentials(JobPosting.JobPortal portal) {
        return credentialsRepository.findByPortal(portal)
                .filter(PlatformPortalCredentials::isConfigured)
                .filter(PlatformPortalCredentials::isActive)
                .map(creds -> new PortalCredentials(
                        decrypt(creds.getUsernameEncrypted()),
                        decrypt(creds.getPasswordEncrypted()),
                        decrypt(creds.getAdditionalConfigEncrypted())
                ));
    }

    /**
     * Get the platform credentials entity for a portal.
     *
     * @param portal The job portal
     * @return Optional entity
     */
    @Transactional(readOnly = true)
    public Optional<PlatformPortalCredentials> getCredentialsEntity(JobPosting.JobPortal portal) {
        return credentialsRepository.findByPortal(portal);
    }

    /**
     * Check if a portal is configured and active.
     *
     * @param portal The job portal
     * @return true if the portal is configured and ready for use
     */
    @Transactional(readOnly = true)
    public boolean isPortalActive(JobPosting.JobPortal portal) {
        return credentialsRepository.isPortalConfigured(portal);
    }

    /**
     * Check if portal can accept posts (active and within rate limit).
     *
     * @param portal The job portal
     * @return true if portal can accept a new post
     */
    @Transactional(readOnly = true)
    public boolean canPostToPortal(JobPosting.JobPortal portal) {
        return credentialsRepository.findByPortal(portal)
                .map(PlatformPortalCredentials::canPost)
                .orElse(false);
    }

    /**
     * Get all portals that are available for posting.
     *
     * @return List of portal types available for posting
     */
    @Transactional(readOnly = true)
    public List<JobPosting.JobPortal> getAvailablePortals() {
        return credentialsRepository.findAvailableForPosting().stream()
                .map(PlatformPortalCredentials::getPortal)
                .toList();
    }

    /**
     * Get all portal credentials.
     *
     * @return List of all credentials (for admin dashboard)
     */
    @Transactional(readOnly = true)
    public List<PlatformPortalCredentials> getAllCredentials() {
        return credentialsRepository.findAll();
    }

    /**
     * Get credentials that need attention (have issues).
     *
     * @return List of credentials with issues
     */
    @Transactional(readOnly = true)
    public List<PlatformPortalCredentials> getCredentialsNeedingAttention() {
        return credentialsRepository.findNeedingAttention();
    }

    /**
     * Save or update credentials for a portal.
     *
     * @param portal The job portal
     * @param username The username/email
     * @param password The password
     * @param additionalConfig Optional additional config as JSON
     * @param active Whether to activate the portal
     * @return The saved entity
     */
    @Transactional
    public PlatformPortalCredentials saveCredentials(
            JobPosting.JobPortal portal,
            String username,
            String password,
            String additionalConfig,
            boolean active) {

        PlatformPortalCredentials creds = credentialsRepository.findByPortal(portal)
                .orElseGet(() -> PlatformPortalCredentials.create(portal));

        creds.setUsernameEncrypted(encrypt(username));
        if (password != null && !password.isBlank()) {
            creds.setPasswordEncrypted(encrypt(password));
        }
        if (additionalConfig != null && !additionalConfig.isBlank()) {
            creds.setAdditionalConfigEncrypted(encrypt(additionalConfig));
        }
        creds.setActive(active);

        if (active && creds.isConfigured()) {
            creds.setConnectionStatus(PlatformPortalCredentials.ConnectionStatus.CONNECTED);
        } else if (!creds.isConfigured()) {
            creds.setConnectionStatus(PlatformPortalCredentials.ConnectionStatus.NOT_CONFIGURED);
        }

        return credentialsRepository.save(creds);
    }

    /**
     * Update portal active status.
     *
     * @param portal The job portal
     * @param active Whether to activate or deactivate
     */
    @Transactional
    public void setPortalActive(JobPosting.JobPortal portal, boolean active) {
        credentialsRepository.findByPortal(portal).ifPresent(creds -> {
            creds.setActive(active);
            credentialsRepository.save(creds);
        });
    }

    /**
     * Update connection status after a posting attempt.
     *
     * @param portal The job portal
     * @param status The new connection status
     * @param error Error message if applicable
     */
    @Transactional
    public void updateConnectionStatus(
            JobPosting.JobPortal portal,
            PlatformPortalCredentials.ConnectionStatus status,
            String error) {
        credentialsRepository.updateConnectionStatus(portal, status, error, LocalDateTime.now());
    }

    /**
     * Increment post count after a successful posting.
     *
     * @param portal The job portal
     */
    @Transactional
    public void recordSuccessfulPost(JobPosting.JobPortal portal) {
        credentialsRepository.incrementPostCount(portal);
        credentialsRepository.updateConnectionStatus(
                portal,
                PlatformPortalCredentials.ConnectionStatus.CONNECTED,
                null,
                LocalDateTime.now());
    }

    /**
     * Validate credentials by attempting a login using Playwright.
     * Updates connection_status based on the result.
     *
     * @param portal The job portal
     * @param credentials The credentials to validate
     * @return true if credentials are valid and login succeeded
     */
    public boolean validateCredentials(JobPosting.JobPortal portal, PortalCredentials credentials) {
        log.info("Starting credential validation for portal: {}", portal);

        if (!validationEnabled) {
            log.info("Credential validation disabled via configuration, skipping for portal: {}", portal);
            return true;
        }

        if (credentials == null || credentials.username() == null || credentials.password() == null) {
            log.warn("Invalid credentials provided for portal: {}", portal);
            updateConnectionStatus(portal, PlatformPortalCredentials.ConnectionStatus.NOT_CONFIGURED,
                    "Credentials not provided");
            return false;
        }

        CredentialValidationResult result = performLoginValidation(portal, credentials);

        // Update the credential status in the database
        updateCredentialStatusFromValidation(portal, result);

        // Publish event if credentials are invalid to alert admins
        if (!result.isSuccess() && result.requiresAttention()) {
            publishCredentialAlertEvent(portal, result);
        }

        return result.isSuccess();
    }

    /**
     * Perform the actual login validation using Playwright.
     */
    private CredentialValidationResult performLoginValidation(JobPosting.JobPortal portal, PortalCredentials credentials) {
        BrowserContext context = null;
        Page page = null;

        try {
            context = playwrightManager.createContext(portal.name().toLowerCase());
            page = playwrightManager.createPage(context);

            // Get portal-specific login configuration
            PortalLoginConfig config = getPortalLoginConfig(portal);

            // Navigate to login page with timeout
            log.debug("Navigating to login page for {}: {}", portal, config.loginUrl());
            page.navigate(config.loginUrl());
            playwrightManager.waitForPageLoad(page);
            playwrightManager.humanDelay(1000, 2000);

            // Handle cookie consent if present
            handleCookieConsent(page);

            // Check for CAPTCHA before attempting login
            if (playwrightManager.hasCaptcha(page)) {
                log.warn("CAPTCHA detected before login for portal: {}", portal);
                playwrightManager.takeScreenshot(page, portal.name() + "_captcha_before_login");
                return CredentialValidationResult.captchaRequired("CAPTCHA detected on login page");
            }

            // Fill in username
            log.debug("Entering username for {}", portal);
            page.locator(config.usernameSelector()).waitFor();
            page.locator(config.usernameSelector()).clear();
            playwrightManager.humanType(page, config.usernameSelector(), credentials.username());
            playwrightManager.humanDelay(500, 1000);

            // Fill in password
            log.debug("Entering password for {}", portal);
            page.locator(config.passwordSelector()).clear();
            playwrightManager.humanType(page, config.passwordSelector(), credentials.password());
            playwrightManager.humanDelay(500, 1000);

            // Submit login form
            log.debug("Submitting login form for {}", portal);
            page.locator(config.submitSelector()).click();

            // Wait for navigation/response with timeout
            try {
                page.waitForLoadState(com.microsoft.playwright.options.LoadState.NETWORKIDLE,
                        new Page.WaitForLoadStateOptions().setTimeout(LOGIN_TIMEOUT_SECONDS * 1000));
            } catch (Exception e) {
                log.warn("Timeout waiting for login response for {}: {}", portal, e.getMessage());
            }

            playwrightManager.humanDelay(2000, 4000);

            // Check for CAPTCHA after login attempt
            if (playwrightManager.hasCaptcha(page)) {
                log.warn("CAPTCHA detected after login attempt for portal: {}", portal);
                playwrightManager.takeScreenshot(page, portal.name() + "_captcha_after_login");
                return CredentialValidationResult.captchaRequired("CAPTCHA triggered during login");
            }

            // Check for 2FA/verification challenge
            if (has2FAChallenge(page, config)) {
                log.warn("2FA challenge detected for portal: {}", portal);
                playwrightManager.takeScreenshot(page, portal.name() + "_2fa_challenge");
                return CredentialValidationResult.twoFactorRequired("Two-factor authentication required");
            }

            // Check for invalid credentials error
            if (hasInvalidCredentialsError(page, config)) {
                log.warn("Invalid credentials error detected for portal: {}", portal);
                playwrightManager.takeScreenshot(page, portal.name() + "_invalid_credentials");
                return CredentialValidationResult.invalidCredentials("Invalid username or password");
            }

            // Check if login was successful
            if (isLoginSuccessful(page, config)) {
                log.info("Credential validation successful for portal: {}", portal);
                playwrightManager.takeScreenshot(page, portal.name() + "_login_success");
                return CredentialValidationResult.successful();
            }

            // Unknown state - take screenshot for debugging
            log.warn("Unable to determine login result for portal: {}", portal);
            playwrightManager.takeScreenshot(page, portal.name() + "_unknown_state");
            return CredentialValidationResult.error("Unable to determine login result");

        } catch (com.microsoft.playwright.TimeoutError e) {
            log.error("Timeout during credential validation for portal {}: {}", portal, e.getMessage());
            return CredentialValidationResult.timeout("Login timed out after " + LOGIN_TIMEOUT_SECONDS + " seconds");
        } catch (Exception e) {
            log.error("Error during credential validation for portal {}: {}", portal, e.getMessage(), e);
            return CredentialValidationResult.error("Validation error: " + e.getMessage());
        } finally {
            // Clean up browser resources
            try {
                if (page != null) page.close();
                if (context != null) context.close();
            } catch (Exception e) {
                log.debug("Error closing browser resources: {}", e.getMessage());
            }
        }
    }

    /**
     * Get portal-specific login configuration.
     */
    private PortalLoginConfig getPortalLoginConfig(JobPosting.JobPortal portal) {
        return switch (portal) {
            case LINKEDIN -> new PortalLoginConfig(
                    "https://www.linkedin.com/login",
                    "#username",
                    "#password",
                    "button[type='submit']",
                    List.of("input[name='pin']", "[class*='verification']"),
                    List.of("[class*='form__error']", "[class*='alert-error']"),
                    List.of("[class*='global-nav']", "img[alt*='profile']")
            );
            case PNET -> new PortalLoginConfig(
                    "https://www.pnet.co.za/5/recruiter-login.html",
                    "#email, input[name='email']",
                    "#password, input[name='password']",
                    "button[type='submit'], input[type='submit']",
                    List.of("[class*='otp']", "[class*='verification']"),
                    List.of("[class*='error'], [class*='alert-danger']"),
                    List.of("[class*='dashboard'], [class*='logged-in']")
            );
            case CAREERS24 -> new PortalLoginConfig(
                    "https://www.careers24.com/recruiter/login/",
                    "input[name='email'], #email",
                    "input[name='password'], #password",
                    "button[type='submit']",
                    List.of("[class*='verification']"),
                    List.of("[class*='error'], [class*='invalid']"),
                    List.of("[class*='dashboard'], [class*='account']")
            );
            case INDEED -> new PortalLoginConfig(
                    "https://employers.indeed.com/",
                    "input[name='__email'], #login-email-input",
                    "input[name='__password'], #login-password-input",
                    "button[type='submit']",
                    List.of("[class*='verify'], [class*='challenge']"),
                    List.of("[class*='error'], [data-error]"),
                    List.of("[class*='employer-header'], [class*='dashboard']")
            );
        };
    }

    /**
     * Handle cookie consent dialogs.
     */
    private void handleCookieConsent(Page page) {
        try {
            String[] consentSelectors = {
                    "[data-testid='cookie-accept']",
                    "button[id*='accept-cookies']",
                    "button:has-text('Accept All')",
                    "button:has-text('Accept Cookies')",
                    "button:has-text('I Accept')",
                    "button:has-text('Got it')",
                    "[class*='cookie'] button[class*='accept']"
            };

            for (String selector : consentSelectors) {
                if (page.locator(selector).count() > 0) {
                    page.locator(selector).first().click();
                    playwrightManager.humanDelay(500, 1000);
                    log.debug("Handled cookie consent with selector: {}", selector);
                    break;
                }
            }
        } catch (Exception e) {
            log.debug("No cookie consent dialog found or error: {}", e.getMessage());
        }
    }

    /**
     * Check if 2FA challenge is present.
     */
    private boolean has2FAChallenge(Page page, PortalLoginConfig config) {
        try {
            String content = page.content().toLowerCase();
            boolean has2FAContent = content.contains("verification code") ||
                    content.contains("two-step") ||
                    content.contains("2fa") ||
                    content.contains("enter the code") ||
                    content.contains("security check") ||
                    page.url().contains("/checkpoint");

            if (has2FAContent) return true;

            for (String selector : config.twoFactorSelectors()) {
                if (page.locator(selector).count() > 0) {
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Check if invalid credentials error is displayed.
     */
    private boolean hasInvalidCredentialsError(Page page, PortalLoginConfig config) {
        try {
            String content = page.content().toLowerCase();
            boolean hasErrorContent = content.contains("wrong email") ||
                    content.contains("wrong password") ||
                    content.contains("invalid email") ||
                    content.contains("invalid password") ||
                    content.contains("incorrect password") ||
                    content.contains("doesn't match") ||
                    content.contains("couldn't find an account") ||
                    content.contains("login failed") ||
                    content.contains("authentication failed");

            if (hasErrorContent) return true;

            for (String selector : config.errorSelectors()) {
                if (page.locator(selector).count() > 0 && page.locator(selector).isVisible()) {
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Check if login was successful.
     */
    private boolean isLoginSuccessful(Page page, PortalLoginConfig config) {
        try {
            // Check URL is not login page
            String url = page.url().toLowerCase();
            boolean notOnLoginPage = !url.contains("/login") &&
                    !url.contains("/signin") &&
                    !url.contains("/checkpoint") &&
                    !url.contains("/challenge");

            // Check for logged-in indicators
            for (String selector : config.loggedInSelectors()) {
                if (page.locator(selector).count() > 0) {
                    return notOnLoginPage;
                }
            }

            return notOnLoginPage && !hasInvalidCredentialsError(page, config);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Update credential status based on validation result.
     */
    @Transactional
    protected void updateCredentialStatusFromValidation(JobPosting.JobPortal portal, CredentialValidationResult result) {
        PlatformPortalCredentials.ConnectionStatus status = switch (result.status()) {
            case SUCCESS -> PlatformPortalCredentials.ConnectionStatus.CONNECTED;
            case INVALID_CREDENTIALS -> PlatformPortalCredentials.ConnectionStatus.INVALID_CREDENTIALS;
            case CAPTCHA_REQUIRED, TWO_FACTOR_REQUIRED -> PlatformPortalCredentials.ConnectionStatus.CAPTCHA_REQUIRED;
            case TIMEOUT, ERROR -> PlatformPortalCredentials.ConnectionStatus.ERROR;
        };

        String error = result.isSuccess() ? null : result.message();
        credentialsRepository.updateConnectionStatus(portal, status, error, LocalDateTime.now());

        if (result.isSuccess()) {
            credentialsRepository.findByPortal(portal).ifPresent(creds -> {
                creds.markAsVerified();
                credentialsRepository.save(creds);
            });
        }

        log.info("Updated credential status for {}: {} - {}", portal, status, error);
    }

    /**
     * Publish event to alert admins about credential issues.
     */
    private void publishCredentialAlertEvent(JobPosting.JobPortal portal, CredentialValidationResult result) {
        try {
            // Use a platform-level tenant ID for admin notifications
            UUID platformTenantId = UUID.fromString("00000000-0000-0000-0000-000000000001");

            var event = new RecruitmentEvent.PortalCredentialAlert(
                    UUID.randomUUID(),
                    platformTenantId,
                    Instant.now(),
                    portal.name(),
                    result.status().name(),
                    result.message()
            );

            eventPublisher.publish(event);
            log.info("Published credential alert event for portal: {}", portal);
        } catch (Exception e) {
            log.error("Failed to publish credential alert event: {}", e.getMessage(), e);
        }
    }

    /**
     * Configuration for portal-specific login.
     */
    private record PortalLoginConfig(
            String loginUrl,
            String usernameSelector,
            String passwordSelector,
            String submitSelector,
            List<String> twoFactorSelectors,
            List<String> errorSelectors,
            List<String> loggedInSelectors
    ) {}

    /**
     * Result of credential validation.
     */
    public record CredentialValidationResult(
            ValidationStatus status,
            String message,
            boolean isSuccess,
            boolean requiresAttention
    ) {
        public static CredentialValidationResult successful() {
            return new CredentialValidationResult(ValidationStatus.SUCCESS, "Login successful", true, false);
        }

        public static CredentialValidationResult invalidCredentials(String message) {
            return new CredentialValidationResult(ValidationStatus.INVALID_CREDENTIALS, message, false, true);
        }

        public static CredentialValidationResult captchaRequired(String message) {
            return new CredentialValidationResult(ValidationStatus.CAPTCHA_REQUIRED, message, false, true);
        }

        public static CredentialValidationResult twoFactorRequired(String message) {
            return new CredentialValidationResult(ValidationStatus.TWO_FACTOR_REQUIRED, message, false, true);
        }

        public static CredentialValidationResult timeout(String message) {
            return new CredentialValidationResult(ValidationStatus.TIMEOUT, message, false, false);
        }

        public static CredentialValidationResult error(String message) {
            return new CredentialValidationResult(ValidationStatus.ERROR, message, false, false);
        }

        public enum ValidationStatus {
            SUCCESS,
            INVALID_CREDENTIALS,
            CAPTCHA_REQUIRED,
            TWO_FACTOR_REQUIRED,
            TIMEOUT,
            ERROR
        }
    }

    /**
     * Reset rate limits at midnight.
     * Called by scheduler.
     */
    @Scheduled(cron = "0 0 0 * * *") // Midnight every day
    @Transactional
    public void resetDailyRateLimits() {
        log.info("Resetting daily rate limits for all portals");
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime tomorrow = now.plusDays(1).withHour(0).withMinute(0).withSecond(0);
        int count = credentialsRepository.resetAllRateLimits(now, tomorrow);
        log.info("Reset rate limits for {} portals", count);
    }

    /**
     * Initialize default portal records if they don't exist.
     * Called automatically at application startup.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void initializePortals() {
        for (JobPosting.JobPortal portal : JobPosting.JobPortal.values()) {
            if (credentialsRepository.findByPortal(portal).isEmpty()) {
                log.info("Initializing credentials record for portal: {}", portal);
                PlatformPortalCredentials creds = PlatformPortalCredentials.create(portal);
                credentialsRepository.save(creds);
            }
        }
    }
}
