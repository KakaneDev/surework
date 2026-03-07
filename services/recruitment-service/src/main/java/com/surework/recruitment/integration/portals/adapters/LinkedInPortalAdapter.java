package com.surework.recruitment.integration.portals.adapters;

import com.surework.recruitment.domain.JobPosting;
import com.surework.recruitment.domain.PlatformPortalCredentials;
import com.surework.recruitment.integration.portals.PortalCredentialsService;
import com.surework.recruitment.integration.portals.playwright.PlaywrightManager;
import com.surework.recruitment.integration.portals.playwright.PortalPage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Adapter for posting jobs to LinkedIn.
 * LinkedIn has more complex authentication (potential 2FA) and job posting flow.
 *
 * <p>This adapter handles:
 * <ul>
 *   <li>LinkedIn authentication with 2FA detection</li>
 *   <li>Multi-step job posting wizard</li>
 *   <li>Rich text job descriptions</li>
 *   <li>Skills and experience level mapping</li>
 *   <li>Remote/hybrid/on-site workplace type selection</li>
 *   <li>Rate limiting and session management</li>
 * </ul>
 */
@Component
public class LinkedInPortalAdapter implements PortalAdapter {

    private static final Logger log = LoggerFactory.getLogger(LinkedInPortalAdapter.class);

    private static final String BASE_URL = "https://www.linkedin.com";
    private static final String LOGIN_URL = BASE_URL + "/login";
    private static final String POST_JOB_URL = BASE_URL + "/talent/post-a-job";
    private static final String JOB_MANAGE_URL = BASE_URL + "/talent/jobs";

    // Retry configuration
    private static final int MAX_RETRY_ATTEMPTS = 3;
    private static final int RETRY_DELAY_MS = 2000;

    // Timeout configuration
    private static final int LOGIN_TIMEOUT_MS = 30000;
    private static final int PAGE_LOAD_TIMEOUT_MS = 15000;

    private final PlaywrightManager playwrightManager;
    private final PortalCredentialsService credentialsService;

    public LinkedInPortalAdapter(PlaywrightManager playwrightManager, PortalCredentialsService credentialsService) {
        this.playwrightManager = playwrightManager;
        this.credentialsService = credentialsService;
    }

    @Override
    public JobPosting.JobPortal getPortal() {
        return JobPosting.JobPortal.LINKEDIN;
    }

    @Override
    public boolean isConfigured() {
        return credentialsService.isPortalActive(getPortal());
    }

    @Override
    public PortalPage.PostingResult postJob(JobPosting job, String tenantName) {
        log.info("Attempting to post job {} to LinkedIn", job.getJobReference());

        // Check rate limiting
        if (!credentialsService.canPostToPortal(getPortal())) {
            log.warn("LinkedIn rate limit reached for today");
            return PortalPage.PostingResult.failure("Daily rate limit reached for LinkedIn");
        }

        var credentials = credentialsService.getCredentials(getPortal());
        if (credentials.isEmpty()) {
            log.error("LinkedIn credentials not configured");
            credentialsService.updateConnectionStatus(getPortal(),
                PlatformPortalCredentials.ConnectionStatus.NOT_CONFIGURED, "Credentials not configured");
            return PortalPage.PostingResult.failure("LinkedIn credentials not configured");
        }

        try (LinkedInPage linkedInPage = new LinkedInPage(playwrightManager)) {
            // Attempt login with retries
            boolean loginSuccess = attemptLoginWithRetry(linkedInPage,
                credentials.get().username(), credentials.get().password());

            if (!loginSuccess) {
                return handleLoginFailure(linkedInPage);
            }

            // Navigate to post job page
            linkedInPage.navigateToPostJob();

            // Check for any blockers before filling form
            if (linkedInPage.hasCaptcha()) {
                credentialsService.updateConnectionStatus(getPortal(),
                    PlatformPortalCredentials.ConnectionStatus.CAPTCHA_REQUIRED, "CAPTCHA detected");
                return PortalPage.PostingResult.requiresManual("CAPTCHA detected on LinkedIn job posting page");
            }

            // Submit the job
            PortalPage.PostingResult result = linkedInPage.submitJob(job);

            // Update connection status based on result
            if (result.success()) {
                credentialsService.recordSuccessfulPost(getPortal());
                log.info("Successfully posted job {} to LinkedIn with external ID: {}",
                    job.getJobReference(), result.externalJobId());
            } else if (result.requiresManualIntervention()) {
                credentialsService.updateConnectionStatus(getPortal(),
                    PlatformPortalCredentials.ConnectionStatus.CAPTCHA_REQUIRED, result.errorMessage());
            } else {
                credentialsService.updateConnectionStatus(getPortal(),
                    PlatformPortalCredentials.ConnectionStatus.ERROR, result.errorMessage());
            }

            return result;

        } catch (Exception e) {
            log.error("Error posting job {} to LinkedIn", job.getJobReference(), e);
            credentialsService.updateConnectionStatus(getPortal(),
                PlatformPortalCredentials.ConnectionStatus.ERROR, "Exception: " + e.getMessage());
            return PortalPage.PostingResult.failure("Error: " + e.getMessage());
        }
    }

    /**
     * Attempt login with retry logic for transient failures.
     */
    private boolean attemptLoginWithRetry(LinkedInPage page, String username, String password) {
        for (int attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
            log.debug("LinkedIn login attempt {}/{}", attempt, MAX_RETRY_ATTEMPTS);

            if (page.login(username, password)) {
                return true;
            }

            if (page.has2FAChallenge()) {
                log.warn("LinkedIn 2FA challenge detected - requires manual intervention");
                return false;
            }

            if (page.hasCaptcha()) {
                log.warn("LinkedIn CAPTCHA detected - requires manual intervention");
                return false;
            }

            if (attempt < MAX_RETRY_ATTEMPTS) {
                log.debug("Login failed, waiting before retry...");
                playwrightManager.humanDelay(RETRY_DELAY_MS, RETRY_DELAY_MS + 1000);
                page.refreshPage();
            }
        }
        return false;
    }

    /**
     * Handle login failure and determine appropriate response.
     */
    private PortalPage.PostingResult handleLoginFailure(LinkedInPage page) {
        if (page.has2FAChallenge()) {
            credentialsService.updateConnectionStatus(getPortal(),
                PlatformPortalCredentials.ConnectionStatus.CAPTCHA_REQUIRED, "2FA verification required");
            return PortalPage.PostingResult.requiresManual("LinkedIn 2FA verification required");
        }

        if (page.hasCaptcha()) {
            credentialsService.updateConnectionStatus(getPortal(),
                PlatformPortalCredentials.ConnectionStatus.CAPTCHA_REQUIRED, "CAPTCHA required");
            return PortalPage.PostingResult.requiresManual("LinkedIn CAPTCHA required");
        }

        if (page.hasInvalidCredentialsError()) {
            credentialsService.updateConnectionStatus(getPortal(),
                PlatformPortalCredentials.ConnectionStatus.INVALID_CREDENTIALS, "Invalid username or password");
            return PortalPage.PostingResult.failure("Invalid LinkedIn credentials");
        }

        credentialsService.updateConnectionStatus(getPortal(),
            PlatformPortalCredentials.ConnectionStatus.ERROR, "Login failed");
        return PortalPage.PostingResult.failure("Failed to login to LinkedIn");
    }

    @Override
    public boolean removeJob(String externalJobId) {
        log.info("Attempting to remove job {} from LinkedIn", externalJobId);

        var credentials = credentialsService.getCredentials(getPortal());
        if (credentials.isEmpty()) {
            log.error("LinkedIn credentials not configured for job removal");
            return false;
        }

        try (LinkedInPage linkedInPage = new LinkedInPage(playwrightManager)) {
            if (!linkedInPage.login(credentials.get().username(), credentials.get().password())) {
                log.error("Failed to login to LinkedIn for job removal");
                return false;
            }

            return linkedInPage.removeJob(externalJobId);

        } catch (Exception e) {
            log.error("Error removing job {} from LinkedIn", externalJobId, e);
            return false;
        }
    }

    @Override
    public boolean isJobActive(String externalJobId) {
        log.debug("Checking if job {} is active on LinkedIn", externalJobId);

        var credentials = credentialsService.getCredentials(getPortal());
        if (credentials.isEmpty()) {
            return true; // Assume active if we can't check
        }

        try (LinkedInPage linkedInPage = new LinkedInPage(playwrightManager)) {
            if (!linkedInPage.login(credentials.get().username(), credentials.get().password())) {
                return true; // Assume active if we can't check
            }

            return linkedInPage.checkJobActive(externalJobId);

        } catch (Exception e) {
            log.error("Error checking job status on LinkedIn", e);
            return true; // Assume active on error
        }
    }

    @Override
    public String getJobUrl(String externalJobId) {
        return BASE_URL + "/jobs/view/" + externalJobId;
    }

    /**
     * LinkedIn-specific page object with comprehensive automation.
     */
    private class LinkedInPage extends PortalPage {

        // LinkedIn-specific selectors
        private static final String USERNAME_SELECTOR = "#username";
        private static final String PASSWORD_SELECTOR = "#password";
        private static final String LOGIN_SUBMIT_SELECTOR = "button[type='submit']";
        private static final String VERIFICATION_PIN_SELECTOR = "input[name='pin']";

        // Job posting form selectors
        private static final String JOB_TITLE_SELECTOR = "input[id*='title'], input[name*='title']";
        private static final String LOCATION_SELECTOR = "input[id*='location'], input[aria-label*='location']";
        private static final String DESCRIPTION_EDITOR_SELECTOR = "[class*='ql-editor'], [contenteditable='true']";

        // Navigation selectors
        private static final String GLOBAL_NAV_SELECTOR = "[class*='global-nav']";
        private static final String PROFILE_MENU_SELECTOR = "img[alt*='profile'], [data-control-name='nav.settings']";

        LinkedInPage(PlaywrightManager playwrightManager) {
            super(playwrightManager, "linkedin");
        }

        @Override
        public JobPosting.JobPortal getPortal() {
            return JobPosting.JobPortal.LINKEDIN;
        }

        @Override
        public String getBaseUrl() {
            return BASE_URL;
        }

        @Override
        public boolean login(String username, String password) {
            log.info("Logging into LinkedIn...");
            navigateTo(LOGIN_URL);
            handleCookieConsent();

            // Wait for login form
            playwrightManager.humanDelay(1000, 2000);

            // Fill login form with human-like behavior
            log.debug("Entering LinkedIn credentials...");
            fillInput(USERNAME_SELECTOR, username);
            playwrightManager.humanDelay(500, 1000);
            fillInput(PASSWORD_SELECTOR, password);
            playwrightManager.humanDelay(500, 1000);

            // Submit login
            clickAndWait(LOGIN_SUBMIT_SELECTOR);

            // Wait for potential 2FA or CAPTCHA
            playwrightManager.humanDelay(3000, 5000);

            // Check login result
            boolean success = isLoggedIn();
            if (success) {
                log.info("Successfully logged into LinkedIn");
            } else {
                log.warn("Failed to login to LinkedIn");
                screenshot("login_failed");
            }
            return success;
        }

        @Override
        public boolean isLoggedIn() {
            try {
                // Check for various logged-in indicators
                boolean hasGlobalNav = page.locator(GLOBAL_NAV_SELECTOR).count() > 0;
                boolean hasProfileMenu = page.locator(PROFILE_MENU_SELECTOR).count() > 0;
                boolean hasFeed = page.url().contains("/feed") || page.url().contains("/talent");
                boolean notOnLoginPage = !page.url().contains("/login") && !page.url().contains("/checkpoint");

                return (hasGlobalNav || hasProfileMenu || hasFeed) && notOnLoginPage;
            } catch (Exception e) {
                log.debug("Error checking login status: {}", e.getMessage());
                return false;
            }
        }

        /**
         * Check if 2FA challenge is present.
         */
        public boolean has2FAChallenge() {
            try {
                return page.locator(VERIFICATION_PIN_SELECTOR).count() > 0 ||
                        page.content().contains("verification code") ||
                        page.content().contains("two-step verification") ||
                        page.content().contains("Enter the code") ||
                        page.url().contains("/checkpoint");
            } catch (Exception e) {
                return false;
            }
        }

        /**
         * Check if invalid credentials error is displayed.
         */
        public boolean hasInvalidCredentialsError() {
            try {
                String content = page.content().toLowerCase();
                return content.contains("wrong email") ||
                        content.contains("wrong password") ||
                        content.contains("doesn't match") ||
                        content.contains("incorrect password") ||
                        content.contains("couldn't find an account");
            } catch (Exception e) {
                return false;
            }
        }

        /**
         * Refresh the current page.
         */
        public void refreshPage() {
            page.reload();
            playwrightManager.waitForPageLoad(page);
        }

        @Override
        public void navigateToPostJob() {
            log.info("Navigating to LinkedIn job posting page...");
            navigateTo(POST_JOB_URL);
            playwrightManager.humanDelay(2000, 4000);

            // Handle any onboarding/intro modals
            dismissModals();
        }

        /**
         * Dismiss any modal dialogs that may appear.
         */
        private void dismissModals() {
            try {
                String[] modalDismissSelectors = {
                    "button[aria-label='Dismiss']",
                    "button:has-text('Got it')",
                    "button:has-text('Skip')",
                    "button:has-text('Close')",
                    "[class*='modal'] button[class*='close']"
                };

                for (String selector : modalDismissSelectors) {
                    if (page.locator(selector).count() > 0) {
                        page.locator(selector).first().click();
                        playwrightManager.humanDelay(500, 1000);
                        log.debug("Dismissed modal with selector: {}", selector);
                    }
                }
            } catch (Exception e) {
                log.debug("No modals to dismiss or error: {}", e.getMessage());
            }
        }

        @Override
        public PostingResult submitJob(JobPosting job) {
            try {
                log.info("Filling LinkedIn job form for: {} (ref: {})", job.getTitle(), job.getJobReference());

                // Step 1: Job basics
                if (!fillJobBasics(job)) {
                    return PostingResult.failure("Failed to fill job basics");
                }

                // Step 2: Job details (employment type, experience)
                if (!fillJobDetails(job)) {
                    return PostingResult.failure("Failed to fill job details");
                }

                // Step 3: Job description
                if (!fillJobDescription(job)) {
                    return PostingResult.failure("Failed to fill job description");
                }

                // Step 4: Application settings
                if (!fillApplicationSettings(job)) {
                    return PostingResult.failure("Failed to fill application settings");
                }

                // Step 5: Review and submit
                return submitAndVerify(job);

            } catch (Exception e) {
                log.error("Error filling LinkedIn job form for: {}", job.getJobReference(), e);
                screenshot("form_error");
                return PostingResult.failure("Form error: " + e.getMessage());
            }
        }

        /**
         * Fill job basics: title, company, location, workplace type.
         */
        private boolean fillJobBasics(JobPosting job) {
            log.debug("Filling job basics...");

            try {
                // Job Title
                fillInput(JOB_TITLE_SELECTOR, job.getTitle());
                playwrightManager.humanDelay(500, 1000);

                // Company - LinkedIn should auto-fill based on logged-in company page
                // But we can set it if there's an input
                if (page.locator("input[id*='company'], input[name*='company']").count() > 0) {
                    fillInput("input[id*='company']", "SureWork Recruitment Services");
                    playwrightManager.humanDelay(1000, 2000);
                    // Select from autocomplete
                    if (page.locator("[class*='autocomplete'] li, [role='listbox'] [role='option']").count() > 0) {
                        page.locator("[class*='autocomplete'] li, [role='listbox'] [role='option']").first().click();
                    }
                }

                // Location
                String location = job.getFullLocation();
                fillInput(LOCATION_SELECTOR, location);
                playwrightManager.humanDelay(1500, 2500);

                // Select from location autocomplete
                if (page.locator("[class*='autocomplete'] li, [role='listbox'] [role='option']").count() > 0) {
                    page.locator("[class*='autocomplete'] li, [role='listbox'] [role='option']").first().click();
                    playwrightManager.humanDelay(500, 1000);
                }

                // Workplace type (remote, hybrid, on-site)
                selectWorkplaceType(job);

                // Click Continue/Next
                if (!clickNextButton()) {
                    log.warn("Failed to advance from job basics step");
                    screenshot("basics_step_failed");
                    return false;
                }

                return true;
            } catch (Exception e) {
                log.error("Error filling job basics: {}", e.getMessage());
                return false;
            }
        }

        /**
         * Select workplace type based on job settings.
         */
        private void selectWorkplaceType(JobPosting job) {
            try {
                String workplaceType;
                if (job.isRemote()) {
                    workplaceType = "Remote";
                } else {
                    // Default to on-site for now; could add hybrid detection
                    workplaceType = "On-site";
                }

                // Try various selector patterns for workplace type buttons
                String[] workplaceSelectors = {
                    "button:has-text('" + workplaceType + "')",
                    "[role='radiogroup'] label:has-text('" + workplaceType + "')",
                    "input[value='" + workplaceType.toLowerCase() + "']",
                    "[data-test-workplace-type='" + workplaceType.toLowerCase() + "']"
                };

                for (String selector : workplaceSelectors) {
                    if (page.locator(selector).count() > 0) {
                        page.locator(selector).first().click();
                        playwrightManager.humanDelay(300, 600);
                        log.debug("Selected workplace type: {}", workplaceType);
                        break;
                    }
                }
            } catch (Exception e) {
                log.debug("Could not set workplace type: {}", e.getMessage());
            }
        }

        /**
         * Fill job details: employment type, experience level, industry.
         */
        private boolean fillJobDetails(JobPosting job) {
            log.debug("Filling job details...");

            try {
                playwrightManager.humanDelay(1000, 2000);

                // Employment Type
                String empType = mapEmploymentType(job.getEmploymentType());
                selectDropdownOption("employment", empType);
                playwrightManager.humanDelay(500, 1000);

                // Experience Level
                if (job.getExperienceYearsMin() != null) {
                    String expLevel = mapExperienceLevel(job.getExperienceYearsMin());
                    selectDropdownOption("experience", expLevel);
                    playwrightManager.humanDelay(500, 1000);
                }

                // Industry (if available)
                if (job.getIndustry() != null) {
                    String industry = mapIndustry(job.getIndustry());
                    selectDropdownOption("industry", industry);
                }

                // Click Continue/Next
                if (!clickNextButton()) {
                    log.warn("Failed to advance from job details step");
                    screenshot("details_step_failed");
                    return false;
                }

                return true;
            } catch (Exception e) {
                log.error("Error filling job details: {}", e.getMessage());
                return false;
            }
        }

        /**
         * Helper to select from dropdown/select elements.
         */
        private void selectDropdownOption(String fieldName, String value) {
            try {
                // Try select element first
                String selectSelector = "select[id*='" + fieldName + "'], select[name*='" + fieldName + "']";
                if (page.locator(selectSelector).count() > 0) {
                    page.selectOption(selectSelector, value);
                    return;
                }

                // Try button/dropdown pattern
                String buttonSelector = "button[id*='" + fieldName + "'], [aria-label*='" + fieldName + "']";
                if (page.locator(buttonSelector).count() > 0) {
                    page.locator(buttonSelector).first().click();
                    playwrightManager.humanDelay(300, 600);

                    // Select option from dropdown
                    String optionSelector = "[role='option']:has-text('" + value + "'), " +
                                          "li:has-text('" + value + "')";
                    if (page.locator(optionSelector).count() > 0) {
                        page.locator(optionSelector).first().click();
                    }
                }
            } catch (Exception e) {
                log.debug("Could not select {} for {}: {}", value, fieldName, e.getMessage());
            }
        }

        /**
         * Fill job description and requirements.
         */
        private boolean fillJobDescription(JobPosting job) {
            log.debug("Filling job description...");

            try {
                playwrightManager.humanDelay(1000, 2000);

                // Build description
                String description = buildJobDescription(job, null);

                // Handle rich text editor
                if (page.locator(DESCRIPTION_EDITOR_SELECTOR).count() > 0) {
                    page.locator(DESCRIPTION_EDITOR_SELECTOR).first().click();
                    playwrightManager.humanDelay(300, 500);
                    page.locator(DESCRIPTION_EDITOR_SELECTOR).first().fill(description);
                } else if (page.locator("textarea[name='description'], textarea[id*='description']").count() > 0) {
                    fillInput("textarea[name='description']", description);
                } else {
                    log.warn("Could not find job description field");
                    screenshot("no_description_field");
                }

                playwrightManager.humanDelay(500, 1000);

                // Add skills if available
                addSkills(job);

                // Click Continue/Next
                if (!clickNextButton()) {
                    log.warn("Failed to advance from description step");
                    screenshot("description_step_failed");
                    return false;
                }

                return true;
            } catch (Exception e) {
                log.error("Error filling job description: {}", e.getMessage());
                return false;
            }
        }

        /**
         * Add skills from job posting.
         */
        private void addSkills(JobPosting job) {
            if (job.getSkills() == null || job.getSkills().isEmpty()) {
                return;
            }

            try {
                String skillInputSelector = "input[id*='skill'], input[aria-label*='skill']";
                if (page.locator(skillInputSelector).count() == 0) {
                    return;
                }

                String[] skills = job.getSkills().split(",");
                int maxSkills = Math.min(skills.length, 5); // LinkedIn typically limits to 5-10 skills

                for (int i = 0; i < maxSkills; i++) {
                    String skill = skills[i].trim();
                    if (skill.isEmpty()) continue;

                    page.locator(skillInputSelector).fill(skill);
                    playwrightManager.humanDelay(800, 1500);

                    // Select from autocomplete
                    String autocompleteOption = "[role='listbox'] [role='option'], [class*='autocomplete'] li";
                    if (page.locator(autocompleteOption).count() > 0) {
                        page.locator(autocompleteOption).first().click();
                        playwrightManager.humanDelay(300, 600);
                    }
                }
            } catch (Exception e) {
                log.debug("Could not add skills: {}", e.getMessage());
            }
        }

        /**
         * Fill application settings: how candidates should apply.
         */
        private boolean fillApplicationSettings(JobPosting job) {
            log.debug("Filling application settings...");

            try {
                playwrightManager.humanDelay(1000, 2000);

                // Select external application URL
                String applicationUrl = "https://careers.surework.co.za/apply/" + job.getJobReference();

                // Try to select external URL option
                String[] externalOptionSelectors = {
                    "input[type='radio'][value='external']",
                    "input[type='radio'][value='EXTERNAL_URL']",
                    "label:has-text('External')",
                    "[data-test-apply-method='external']"
                };

                boolean foundExternalOption = false;
                for (String selector : externalOptionSelectors) {
                    if (page.locator(selector).count() > 0) {
                        page.locator(selector).first().click();
                        playwrightManager.humanDelay(500, 1000);
                        foundExternalOption = true;
                        break;
                    }
                }

                // Fill external URL
                String[] urlInputSelectors = {
                    "input[id*='application-url']",
                    "input[name*='external']",
                    "input[placeholder*='URL']",
                    "input[type='url']"
                };

                for (String selector : urlInputSelectors) {
                    if (page.locator(selector).count() > 0) {
                        fillInput(selector, applicationUrl);
                        break;
                    }
                }

                // Click Continue/Next
                if (!clickNextButton()) {
                    // This might be the last step before review
                    log.debug("No next button found, may be at review step");
                }

                return true;
            } catch (Exception e) {
                log.error("Error filling application settings: {}", e.getMessage());
                return false;
            }
        }

        /**
         * Submit the job and verify success.
         */
        private PostingResult submitAndVerify(JobPosting job) {
            log.debug("Submitting job posting...");

            try {
                // Screenshot before submit
                screenshot("before_submit");

                // Find and click the final submit button
                String[] submitSelectors = {
                    "button:has-text('Post job')",
                    "button:has-text('Post for free')",
                    "button:has-text('Submit')",
                    "button[type='submit']:has-text('Post')",
                    "[data-test-post-job-button]"
                };

                boolean clicked = false;
                for (String selector : submitSelectors) {
                    if (page.locator(selector).count() > 0) {
                        clickAndWait(selector);
                        clicked = true;
                        break;
                    }
                }

                if (!clicked) {
                    log.warn("Could not find submit button");
                    screenshot("no_submit_button");
                    return PostingResult.failure("Could not find submit button");
                }

                playwrightManager.humanDelay(3000, 5000);

                // Check for CAPTCHA or additional verification
                if (hasCaptcha() || has2FAChallenge()) {
                    screenshot("verification_required");
                    return PostingResult.requiresManual("Verification required after form submission");
                }

                // Check for success
                return verifyPostingSuccess(job);

            } catch (Exception e) {
                log.error("Error submitting job: {}", e.getMessage());
                screenshot("submit_error");
                return PostingResult.failure("Submit error: " + e.getMessage());
            }
        }

        /**
         * Verify the job was successfully posted.
         */
        private PostingResult verifyPostingSuccess(JobPosting job) {
            try {
                String content = page.content().toLowerCase();
                String url = page.url();

                // Check for success indicators
                boolean hasSuccessMessage = content.contains("your job is live") ||
                        content.contains("job posted") ||
                        content.contains("successfully posted") ||
                        content.contains("job is now live");

                boolean hasSuccessUrl = url.contains("/talent/jobs") ||
                        url.contains("/job-posting/");

                boolean hasSuccessElement = page.locator("[class*='success'], [data-test-success]").count() > 0;

                if (hasSuccessMessage || hasSuccessUrl || hasSuccessElement) {
                    String externalJobId = extractJobId();
                    String externalUrl = getJobUrl(externalJobId);

                    // LinkedIn jobs typically stay active for 30 days
                    LocalDateTime expiresAt = LocalDateTime.now().plusDays(30);

                    log.info("Successfully posted job {} to LinkedIn: {}", job.getJobReference(), externalJobId);
                    screenshot("success");
                    return PostingResult.success(externalJobId, externalUrl, expiresAt);
                }

                // Check for error messages
                if (content.contains("error") || content.contains("couldn't post") ||
                    content.contains("problem")) {
                    screenshot("posting_error");
                    return PostingResult.failure("LinkedIn returned an error during posting");
                }

                screenshot("submit_result_unclear");
                return PostingResult.failure("Could not confirm job was posted");

            } catch (Exception e) {
                log.error("Error verifying posting success: {}", e.getMessage());
                return PostingResult.failure("Verification error: " + e.getMessage());
            }
        }

        /**
         * Click next/continue button to advance through wizard.
         */
        private boolean clickNextButton() {
            String[] nextSelectors = {
                "button:has-text('Continue')",
                "button:has-text('Next')",
                "button:has-text('Save and continue')",
                "button[type='submit']:not(:has-text('Post'))",
                "[data-test-next-button]"
            };

            for (String selector : nextSelectors) {
                try {
                    if (page.locator(selector).count() > 0) {
                        clickAndWait(selector);
                        playwrightManager.humanDelay(1500, 3000);
                        return true;
                    }
                } catch (Exception e) {
                    log.debug("Could not click next with selector {}: {}", selector, e.getMessage());
                }
            }

            return false;
        }

        @Override
        public String getJobUrl(String externalJobId) {
            return BASE_URL + "/jobs/view/" + externalJobId;
        }

        @Override
        public boolean removeJob(String externalJobId) {
            log.info("Removing job {} from LinkedIn", externalJobId);

            try {
                // Navigate to job management
                navigateTo(JOB_MANAGE_URL);
                playwrightManager.humanDelay(2000, 3000);

                // Find the job in the list
                String jobRowSelector = "[data-job-id='" + externalJobId + "'], " +
                                       "[href*='" + externalJobId + "']";

                if (page.locator(jobRowSelector).count() == 0) {
                    log.warn("Job {} not found in LinkedIn job list", externalJobId);
                    return false;
                }

                // Click on job to open details
                page.locator(jobRowSelector).first().click();
                playwrightManager.humanDelay(1000, 2000);

                // Click close/delete button
                String[] closeSelectors = {
                    "button:has-text('Close job')",
                    "button:has-text('Delete')",
                    "[aria-label='Close job']"
                };

                for (String selector : closeSelectors) {
                    if (page.locator(selector).count() > 0) {
                        page.locator(selector).click();
                        playwrightManager.humanDelay(500, 1000);

                        // Confirm if needed
                        if (page.locator("button:has-text('Confirm'), button:has-text('Yes')").count() > 0) {
                            page.locator("button:has-text('Confirm'), button:has-text('Yes')").first().click();
                        }

                        log.info("Successfully removed job {} from LinkedIn", externalJobId);
                        return true;
                    }
                }

                return false;
            } catch (Exception e) {
                log.error("Error removing job from LinkedIn: {}", e.getMessage());
                return false;
            }
        }

        /**
         * Check if a job is still active on LinkedIn.
         */
        public boolean checkJobActive(String externalJobId) {
            try {
                navigateTo(getJobUrl(externalJobId));
                playwrightManager.humanDelay(2000, 3000);

                String content = page.content().toLowerCase();

                // Check for inactive indicators
                boolean isExpired = content.contains("no longer accepting") ||
                        content.contains("job has expired") ||
                        content.contains("no longer available") ||
                        content.contains("this job has been closed");

                return !isExpired;
            } catch (Exception e) {
                log.debug("Error checking job status: {}", e.getMessage());
                return true; // Assume active on error
            }
        }

        private String extractJobId() {
            String url = page.url();

            // Try to extract from URL patterns
            String[] patterns = {
                "/jobs/view/([0-9]+)",
                "/jobs/([0-9]+)",
                "jobId=([0-9]+)",
                "/job-posting/([0-9]+)"
            };

            for (String pattern : patterns) {
                java.util.regex.Pattern p = java.util.regex.Pattern.compile(pattern);
                java.util.regex.Matcher m = p.matcher(url);
                if (m.find()) {
                    return m.group(1);
                }
            }

            // Check page content for job ID
            try {
                String content = page.content();
                java.util.regex.Pattern p = java.util.regex.Pattern.compile("\"jobId\"\\s*:\\s*\"?([0-9]+)\"?");
                java.util.regex.Matcher m = p.matcher(content);
                if (m.find()) {
                    return m.group(1);
                }
            } catch (Exception e) {
                log.debug("Could not extract job ID from content");
            }

            // Generate placeholder
            return "LI-" + System.currentTimeMillis();
        }

        private String mapEmploymentType(JobPosting.EmploymentType type) {
            return switch (type) {
                case FULL_TIME -> "Full-time";
                case PART_TIME -> "Part-time";
                case CONTRACT -> "Contract";
                case TEMPORARY -> "Temporary";
                case INTERNSHIP -> "Internship";
                case FREELANCE -> "Other";
            };
        }

        private String mapExperienceLevel(int yearsMin) {
            if (yearsMin == 0) return "Internship";
            if (yearsMin <= 2) return "Entry level";
            if (yearsMin <= 5) return "Associate";
            if (yearsMin <= 8) return "Mid-Senior level";
            if (yearsMin <= 12) return "Director";
            return "Executive";
        }

        private String mapIndustry(JobPosting.Industry industry) {
            // LinkedIn uses specific industry codes
            return switch (industry) {
                case IT_SOFTWARE -> "Information Technology & Services";
                case FINANCE_BANKING -> "Financial Services";
                case HEALTHCARE -> "Hospital & Health Care";
                case RETAIL -> "Retail";
                case MANUFACTURING -> "Manufacturing";
                case CONSTRUCTION -> "Construction";
                case EDUCATION -> "Education Management";
                case HOSPITALITY_TOURISM -> "Hospitality";
                case LOGISTICS_TRANSPORT -> "Logistics & Supply Chain";
                case LEGAL -> "Legal Services";
                case MARKETING_ADVERTISING -> "Marketing & Advertising";
                case HUMAN_RESOURCES -> "Human Resources";
                case ENGINEERING -> "Engineering";
                case MINING -> "Mining & Metals";
                case AGRICULTURE -> "Farming";
                case TELECOMMUNICATIONS -> "Telecommunications";
                case REAL_ESTATE -> "Real Estate";
                case MEDIA_ENTERTAINMENT -> "Entertainment";
                case GOVERNMENT_PUBLIC_SECTOR -> "Government Administration";
                case NON_PROFIT -> "Non-profit Organization Management";
                case OTHER -> "Other";
            };
        }
    }
}
