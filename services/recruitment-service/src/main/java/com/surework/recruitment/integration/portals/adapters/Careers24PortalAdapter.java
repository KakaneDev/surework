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
 * Adapter for posting jobs to Careers24 (careers24.com).
 * Careers24 is a major South African job portal owned by Media24.
 *
 * <p>This adapter handles:
 * <ul>
 *   <li>Careers24 recruiter portal authentication</li>
 *   <li>Multi-step job posting wizard</li>
 *   <li>South African province and city selection</li>
 *   <li>Industry sector mapping</li>
 *   <li>Education level mapping (Matric, Diploma, Degree, etc.)</li>
 *   <li>ZAR salary handling</li>
 *   <li>Rich text editor handling</li>
 *   <li>CAPTCHA detection</li>
 *   <li>Rate limiting and session management</li>
 *   <li>Job status verification and removal</li>
 * </ul>
 */
@Component
public class Careers24PortalAdapter implements PortalAdapter {

    private static final Logger log = LoggerFactory.getLogger(Careers24PortalAdapter.class);

    private static final String BASE_URL = "https://www.careers24.com";
    private static final String RECRUITER_URL = "https://recruiter.careers24.com";
    private static final String LOGIN_URL = RECRUITER_URL + "/Account/Login";
    private static final String POST_JOB_URL = RECRUITER_URL + "/Jobs/Post";
    private static final String MANAGE_JOBS_URL = RECRUITER_URL + "/Jobs/Manage";

    // Retry configuration
    private static final int MAX_RETRY_ATTEMPTS = 3;
    private static final int RETRY_DELAY_MS = 2000;

    // Timeout configuration
    private static final int LOGIN_TIMEOUT_MS = 30000;
    private static final int PAGE_LOAD_TIMEOUT_MS = 15000;

    private final PlaywrightManager playwrightManager;
    private final PortalCredentialsService credentialsService;

    public Careers24PortalAdapter(PlaywrightManager playwrightManager, PortalCredentialsService credentialsService) {
        this.playwrightManager = playwrightManager;
        this.credentialsService = credentialsService;
    }

    @Override
    public JobPosting.JobPortal getPortal() {
        return JobPosting.JobPortal.CAREERS24;
    }

    @Override
    public boolean isConfigured() {
        return credentialsService.isPortalActive(getPortal());
    }

    @Override
    public PortalPage.PostingResult postJob(JobPosting job, String tenantName) {
        log.info("Attempting to post job {} to Careers24", job.getJobReference());

        // Check rate limiting
        if (!credentialsService.canPostToPortal(getPortal())) {
            log.warn("Careers24 rate limit reached for today");
            return PortalPage.PostingResult.failure("Daily rate limit reached for Careers24");
        }

        var credentials = credentialsService.getCredentials(getPortal());
        if (credentials.isEmpty()) {
            log.error("Careers24 credentials not configured");
            credentialsService.updateConnectionStatus(getPortal(),
                PlatformPortalCredentials.ConnectionStatus.NOT_CONFIGURED, "Credentials not configured");
            return PortalPage.PostingResult.failure("Careers24 credentials not configured");
        }

        try (Careers24Page careers24Page = new Careers24Page(playwrightManager)) {
            // Attempt login with retries
            boolean loginSuccess = attemptLoginWithRetry(careers24Page,
                credentials.get().username(), credentials.get().password());

            if (!loginSuccess) {
                return handleLoginFailure(careers24Page);
            }

            // Navigate to post job page
            careers24Page.navigateToPostJob();

            // Check for any blockers before filling form
            if (careers24Page.hasCaptcha()) {
                credentialsService.updateConnectionStatus(getPortal(),
                    PlatformPortalCredentials.ConnectionStatus.CAPTCHA_REQUIRED, "CAPTCHA detected");
                return PortalPage.PostingResult.requiresManual("CAPTCHA detected on Careers24 job posting page");
            }

            // Submit the job
            PortalPage.PostingResult result = careers24Page.submitJob(job);

            // Update connection status based on result
            if (result.success()) {
                credentialsService.recordSuccessfulPost(getPortal());
                log.info("Successfully posted job {} to Careers24 with external ID: {}",
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
            log.error("Error posting job {} to Careers24", job.getJobReference(), e);
            credentialsService.updateConnectionStatus(getPortal(),
                PlatformPortalCredentials.ConnectionStatus.ERROR, "Exception: " + e.getMessage());
            return PortalPage.PostingResult.failure("Error: " + e.getMessage());
        }
    }

    /**
     * Attempt login with retry logic for transient failures.
     */
    private boolean attemptLoginWithRetry(Careers24Page page, String username, String password) {
        for (int attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
            log.debug("Careers24 login attempt {}/{}", attempt, MAX_RETRY_ATTEMPTS);

            if (page.login(username, password)) {
                return true;
            }

            if (page.hasCaptcha()) {
                log.warn("Careers24 CAPTCHA detected - requires manual intervention");
                return false;
            }

            if (page.hasSecurityChallenge()) {
                log.warn("Careers24 security challenge detected - requires manual intervention");
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
    private PortalPage.PostingResult handleLoginFailure(Careers24Page page) {
        if (page.hasCaptcha()) {
            credentialsService.updateConnectionStatus(getPortal(),
                PlatformPortalCredentials.ConnectionStatus.CAPTCHA_REQUIRED, "CAPTCHA required");
            return PortalPage.PostingResult.requiresManual("Careers24 CAPTCHA required");
        }

        if (page.hasSecurityChallenge()) {
            credentialsService.updateConnectionStatus(getPortal(),
                PlatformPortalCredentials.ConnectionStatus.CAPTCHA_REQUIRED, "Security verification required");
            return PortalPage.PostingResult.requiresManual("Careers24 security verification required");
        }

        if (page.hasInvalidCredentialsError()) {
            credentialsService.updateConnectionStatus(getPortal(),
                PlatformPortalCredentials.ConnectionStatus.INVALID_CREDENTIALS, "Invalid username or password");
            return PortalPage.PostingResult.failure("Invalid Careers24 credentials");
        }

        credentialsService.updateConnectionStatus(getPortal(),
            PlatformPortalCredentials.ConnectionStatus.ERROR, "Login failed");
        return PortalPage.PostingResult.failure("Failed to login to Careers24");
    }

    @Override
    public boolean removeJob(String externalJobId) {
        log.info("Attempting to remove job {} from Careers24", externalJobId);

        var credentials = credentialsService.getCredentials(getPortal());
        if (credentials.isEmpty()) {
            log.error("Careers24 credentials not configured for job removal");
            return false;
        }

        try (Careers24Page careers24Page = new Careers24Page(playwrightManager)) {
            if (!careers24Page.login(credentials.get().username(), credentials.get().password())) {
                log.error("Failed to login to Careers24 for job removal");
                return false;
            }

            return careers24Page.removeJob(externalJobId);

        } catch (Exception e) {
            log.error("Error removing job {} from Careers24", externalJobId, e);
            return false;
        }
    }

    @Override
    public boolean isJobActive(String externalJobId) {
        log.debug("Checking if job {} is active on Careers24", externalJobId);

        var credentials = credentialsService.getCredentials(getPortal());
        if (credentials.isEmpty()) {
            return true; // Assume active if we can't check
        }

        try (Careers24Page careers24Page = new Careers24Page(playwrightManager)) {
            if (!careers24Page.login(credentials.get().username(), credentials.get().password())) {
                return true; // Assume active if we can't check
            }

            return careers24Page.checkJobActive(externalJobId);

        } catch (Exception e) {
            log.error("Error checking job status on Careers24", e);
            return true; // Assume active on error
        }
    }

    @Override
    public String getJobUrl(String externalJobId) {
        return BASE_URL + "/jobs/" + externalJobId;
    }

    /**
     * Careers24-specific page object with comprehensive automation.
     */
    private class Careers24Page extends PortalPage {

        // Careers24-specific selectors
        private static final String USERNAME_SELECTOR = "input[name='Email'], input#Email, input[type='email']";
        private static final String PASSWORD_SELECTOR = "input[name='Password'], input#Password, input[type='password']";
        private static final String LOGIN_SUBMIT_SELECTOR = "button[type='submit'], input[type='submit'], button:has-text('Sign In'), button:has-text('Login')";
        private static final String SECURITY_CHALLENGE_SELECTOR = "[class*='challenge'], [class*='verify'], [class*='security']";

        // Job posting form selectors
        private static final String JOB_TITLE_SELECTOR = "input[name='Title'], input#Title, input[id*='job-title']";
        private static final String JOB_REFERENCE_SELECTOR = "input[name='Reference'], input#Reference, input[id*='reference']";
        private static final String DESCRIPTION_EDITOR_SELECTOR = "[class*='ql-editor'], [contenteditable='true'], iframe[id*='Description']";

        // Navigation selectors
        private static final String DASHBOARD_SELECTOR = "[class*='dashboard'], [class*='recruiter-dashboard']";
        private static final String USER_MENU_SELECTOR = "[class*='user-menu'], [class*='account-menu'], img[alt*='profile']";
        private static final String POST_JOB_LINK_SELECTOR = "a:has-text('Post a Job'), a:has-text('Post Job'), a[href*='Post']";

        Careers24Page(PlaywrightManager playwrightManager) {
            super(playwrightManager, "careers24");
        }

        @Override
        public JobPosting.JobPortal getPortal() {
            return JobPosting.JobPortal.CAREERS24;
        }

        @Override
        public String getBaseUrl() {
            return BASE_URL;
        }

        @Override
        public boolean login(String username, String password) {
            log.info("Logging into Careers24...");
            navigateTo(LOGIN_URL);
            handleCookieConsent();

            // Wait for login form
            playwrightManager.humanDelay(1000, 2000);

            // Fill login form with human-like behavior
            log.debug("Entering Careers24 credentials...");
            fillInput(USERNAME_SELECTOR, username);
            playwrightManager.humanDelay(500, 1000);
            fillInput(PASSWORD_SELECTOR, password);
            playwrightManager.humanDelay(500, 1000);

            // Submit login
            clickAndWait(LOGIN_SUBMIT_SELECTOR);

            // Wait for potential security challenges or redirects
            playwrightManager.humanDelay(3000, 5000);

            // Check login result
            boolean success = isLoggedIn();
            if (success) {
                log.info("Successfully logged into Careers24");
            } else {
                log.warn("Failed to login to Careers24");
                screenshot("login_failed");
            }
            return success;
        }

        @Override
        public boolean isLoggedIn() {
            try {
                // Check for various logged-in indicators
                boolean hasDashboard = page.locator(DASHBOARD_SELECTOR).count() > 0;
                boolean hasUserMenu = page.locator(USER_MENU_SELECTOR).count() > 0;
                boolean hasPostJobLink = page.locator(POST_JOB_LINK_SELECTOR).count() > 0;
                boolean hasMyJobs = page.locator("a:has-text('My Jobs')").count() > 0;
                boolean notOnLoginPage = !page.url().contains("/Login") && !page.url().contains("/Account/Login");

                return (hasDashboard || hasUserMenu || hasPostJobLink || hasMyJobs) && notOnLoginPage;
            } catch (Exception e) {
                log.debug("Error checking login status: {}", e.getMessage());
                return false;
            }
        }

        /**
         * Check if security challenge is present.
         */
        public boolean hasSecurityChallenge() {
            try {
                return page.locator(SECURITY_CHALLENGE_SELECTOR).count() > 0 ||
                        page.content().toLowerCase().contains("verify your identity") ||
                        page.content().toLowerCase().contains("security check") ||
                        page.content().toLowerCase().contains("unusual activity");
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
                return content.contains("invalid email") ||
                        content.contains("invalid password") ||
                        content.contains("incorrect password") ||
                        content.contains("login failed") ||
                        content.contains("wrong password") ||
                        content.contains("account not found") ||
                        content.contains("invalid credentials") ||
                        page.locator("[class*='error'], [class*='validation-error']").count() > 0;
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
            log.info("Navigating to Careers24 job posting page...");
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
                    "button[aria-label='Close']",
                    "button:has-text('Got it')",
                    "button:has-text('Skip')",
                    "button:has-text('Close')",
                    "button:has-text('Dismiss')",
                    "[class*='modal'] button[class*='close']",
                    "[class*='modal-close']",
                    "button.close"
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
                log.info("Filling Careers24 job form for: {} (ref: {})", job.getTitle(), job.getJobReference());

                // Step 1: Job basics (title, reference, location)
                if (!fillJobBasics(job)) {
                    return PostingResult.failure("Failed to fill job basics");
                }

                // Step 2: Job classification (industry, job type)
                if (!fillJobClassification(job)) {
                    return PostingResult.failure("Failed to fill job classification");
                }

                // Step 3: Requirements (experience, education)
                if (!fillJobRequirements(job)) {
                    return PostingResult.failure("Failed to fill job requirements");
                }

                // Step 4: Job description and responsibilities
                if (!fillJobDescription(job)) {
                    return PostingResult.failure("Failed to fill job description");
                }

                // Step 5: Salary and benefits
                if (!fillSalaryAndBenefits(job)) {
                    return PostingResult.failure("Failed to fill salary information");
                }

                // Step 6: Application settings
                if (!fillApplicationSettings(job)) {
                    return PostingResult.failure("Failed to fill application settings");
                }

                // Step 7: Review and submit
                return submitAndVerify(job);

            } catch (Exception e) {
                log.error("Error filling Careers24 job form for: {}", job.getJobReference(), e);
                screenshot("form_error");
                return PostingResult.failure("Form error: " + e.getMessage());
            }
        }

        /**
         * Fill job basics: title, reference, location, province.
         */
        private boolean fillJobBasics(JobPosting job) {
            log.debug("Filling job basics...");

            try {
                // Job Title
                fillInput(JOB_TITLE_SELECTOR, job.getTitle());
                playwrightManager.humanDelay(500, 1000);

                // Job Reference (internal reference)
                fillInput(JOB_REFERENCE_SELECTOR, job.getJobReference());
                playwrightManager.humanDelay(300, 600);

                // Province selection
                if (job.getProvince() != null) {
                    String province = mapProvince(job.getProvince());
                    selectDropdownOption("Province", province);
                    playwrightManager.humanDelay(500, 1000);
                }

                // City/Location
                String city = job.getCity() != null ? job.getCity() : "Johannesburg";
                fillLocationWithAutocomplete(city);

                // Remote work option
                if (job.isRemote()) {
                    try {
                        String[] remoteSelectors = {
                            "input[name='RemoteWork'], input#RemoteWork",
                            "input[type='checkbox'][id*='remote']",
                            "label:has-text('Remote') input",
                            "[data-testid='remote-checkbox']"
                        };
                        for (String selector : remoteSelectors) {
                            if (page.locator(selector).count() > 0) {
                                checkBox(selector, true);
                                break;
                            }
                        }
                    } catch (Exception e) {
                        log.debug("Could not set remote option: {}", e.getMessage());
                    }
                }

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
         * Fill location field with autocomplete handling.
         */
        private void fillLocationWithAutocomplete(String location) {
            String[] locationSelectors = {
                "select[name='Location'], select#Location",
                "input[name='Location'], input#Location"
            };

            for (String selector : locationSelectors) {
                if (page.locator(selector).count() > 0) {
                    if (selector.startsWith("select")) {
                        page.selectOption(selector, location);
                    } else {
                        fillInput(selector, location);
                        playwrightManager.humanDelay(1500, 2500);

                        // Select from autocomplete
                        String[] autocompleteSelectors = {
                            "[class*='autocomplete'] li",
                            "[role='listbox'] [role='option']",
                            "[class*='suggestion'] li",
                            "[class*='dropdown-item']"
                        };

                        for (String acSelector : autocompleteSelectors) {
                            if (page.locator(acSelector).count() > 0) {
                                page.locator(acSelector).first().click();
                                break;
                            }
                        }
                    }
                    break;
                }
            }
            playwrightManager.humanDelay(500, 1000);
        }

        /**
         * Fill job classification: industry, sector, job type.
         */
        private boolean fillJobClassification(JobPosting job) {
            log.debug("Filling job classification...");

            try {
                playwrightManager.humanDelay(1000, 2000);

                // Industry/Sector
                if (job.getIndustry() != null) {
                    String industry = mapIndustry(job.getIndustry());
                    selectDropdownOption("Industry", industry);
                    playwrightManager.humanDelay(500, 1000);
                }

                // Job Type (Employment Type)
                String empType = mapEmploymentType(job.getEmploymentType());
                selectDropdownOption("JobType", empType);
                playwrightManager.humanDelay(500, 1000);

                // Contract Duration (if applicable)
                if (job.getEmploymentType() == JobPosting.EmploymentType.CONTRACT &&
                    job.getContractDuration() != null && !job.getContractDuration().isEmpty()) {
                    if (page.locator("input[name='ContractDuration']").count() > 0) {
                        fillInput("input[name='ContractDuration']", job.getContractDuration());
                    }
                }

                // Job Function/Category
                selectJobFunction(job);

                // Click Continue/Next
                if (!clickNextButton()) {
                    log.warn("Failed to advance from job classification step");
                    screenshot("classification_step_failed");
                    return false;
                }

                return true;
            } catch (Exception e) {
                log.error("Error filling job classification: {}", e.getMessage());
                return false;
            }
        }

        /**
         * Select job function/category.
         */
        private void selectJobFunction(JobPosting job) {
            try {
                String function = mapJobFunction(job);
                selectDropdownOption("JobFunction", function);
                playwrightManager.humanDelay(500, 1000);

                // Sub-category if available
                if (page.locator("select[name='SubCategory'], select#SubCategory").count() > 0) {
                    String subCategory = mapSubCategory(job);
                    selectDropdownOption("SubCategory", subCategory);
                }
            } catch (Exception e) {
                log.debug("Could not set job function: {}", e.getMessage());
            }
        }

        /**
         * Fill job requirements: experience, education.
         */
        private boolean fillJobRequirements(JobPosting job) {
            log.debug("Filling job requirements...");

            try {
                playwrightManager.humanDelay(1000, 2000);

                // Experience Level
                if (job.getExperienceYearsMin() != null) {
                    String expLevel = mapExperienceLevel(job.getExperienceYearsMin());
                    selectDropdownOption("ExperienceLevel", expLevel);
                    playwrightManager.humanDelay(500, 1000);
                }

                // Education Level
                if (job.getEducationLevel() != null) {
                    String education = mapEducationLevel(job.getEducationLevel());
                    selectDropdownOption("EducationLevel", education);
                    playwrightManager.humanDelay(500, 1000);
                }

                // Skills/Keywords
                addKeywords(job);

                // Click Continue/Next
                if (!clickNextButton()) {
                    log.debug("No next button found, may be on same page form");
                }

                return true;
            } catch (Exception e) {
                log.error("Error filling job requirements: {}", e.getMessage());
                return false;
            }
        }

        /**
         * Add keywords/skills from job posting.
         */
        private void addKeywords(JobPosting job) {
            String keywords = job.getKeywords();
            if ((keywords == null || keywords.isEmpty()) && job.getSkills() != null) {
                keywords = job.getSkills();
            }

            if (keywords == null || keywords.isEmpty()) {
                return;
            }

            try {
                String[] keywordSelectors = {
                    "input[name='Keywords'], input#Keywords",
                    "textarea[name='Keywords']",
                    "input[id*='keyword'], input[aria-label*='keyword']"
                };

                for (String selector : keywordSelectors) {
                    if (page.locator(selector).count() > 0) {
                        fillInput(selector, keywords);
                        break;
                    }
                }
            } catch (Exception e) {
                log.debug("Could not add keywords: {}", e.getMessage());
            }
        }

        /**
         * Fill job description using rich text editor.
         */
        private boolean fillJobDescription(JobPosting job) {
            log.debug("Filling job description...");

            try {
                playwrightManager.humanDelay(1000, 2000);

                // Build description
                String description = buildJobDescription(job, null);

                // Handle different editor types
                boolean filled = false;

                // Try Quill editor
                if (page.locator("[class*='ql-editor']").count() > 0) {
                    page.locator("[class*='ql-editor']").first().click();
                    playwrightManager.humanDelay(300, 500);
                    page.locator("[class*='ql-editor']").first().fill(description);
                    filled = true;
                }
                // Try iframe-based editor (TinyMCE, CKEditor)
                else if (page.locator("iframe[id*='Description'], iframe[id*='editor']").count() > 0) {
                    page.frameLocator("iframe[id*='Description'], iframe[id*='editor']")
                        .locator("body").fill(description);
                    filled = true;
                }
                // Try contenteditable div
                else if (page.locator("[contenteditable='true']").count() > 0) {
                    page.locator("[contenteditable='true']").first().click();
                    playwrightManager.humanDelay(300, 500);
                    page.locator("[contenteditable='true']").first().fill(description);
                    filled = true;
                }
                // Fall back to textarea
                else if (page.locator("textarea[name='Description']").count() > 0) {
                    fillInput("textarea[name='Description']", description);
                    filled = true;
                }

                if (!filled) {
                    log.warn("Could not find job description field");
                    screenshot("no_description_field");
                }

                playwrightManager.humanDelay(500, 1000);

                // Requirements section (if separate field)
                if (job.getRequirements() != null &&
                    page.locator("textarea[name='Requirements']").count() > 0) {
                    fillInput("textarea[name='Requirements']", job.getRequirements());
                }

                // Responsibilities section (if separate)
                if (job.getResponsibilities() != null &&
                    page.locator("textarea[name='Responsibilities']").count() > 0) {
                    fillInput("textarea[name='Responsibilities']", job.getResponsibilities());
                }

                // Qualifications (if separate)
                if (job.getQualifications() != null &&
                    page.locator("textarea[name='Qualifications']").count() > 0) {
                    fillInput("textarea[name='Qualifications']", job.getQualifications());
                }

                // Click Continue/Next
                if (!clickNextButton()) {
                    log.debug("No next button found, may be on same page form");
                }

                return true;
            } catch (Exception e) {
                log.error("Error filling job description: {}", e.getMessage());
                return false;
            }
        }

        /**
         * Fill salary and benefits information.
         */
        private boolean fillSalaryAndBenefits(JobPosting job) {
            log.debug("Filling salary and benefits...");

            try {
                playwrightManager.humanDelay(1000, 2000);

                if (job.isShowSalary()) {
                    // Salary Min (ZAR)
                    if (job.getSalaryMin() != null) {
                        String[] minSelectors = {
                            "input[name='SalaryMin']", "input#SalaryMin",
                            "input[name='salary-min']", "input[id*='salary-min']"
                        };
                        for (String selector : minSelectors) {
                            if (page.locator(selector).count() > 0) {
                                fillInput(selector, job.getSalaryMin().toString());
                                break;
                            }
                        }
                        playwrightManager.humanDelay(300, 600);
                    }

                    // Salary Max (ZAR)
                    if (job.getSalaryMax() != null) {
                        String[] maxSelectors = {
                            "input[name='SalaryMax']", "input#SalaryMax",
                            "input[name='salary-max']", "input[id*='salary-max']"
                        };
                        for (String selector : maxSelectors) {
                            if (page.locator(selector).count() > 0) {
                                fillInput(selector, job.getSalaryMax().toString());
                                break;
                            }
                        }
                    }

                    // Salary frequency/period (Monthly is standard in SA)
                    selectDropdownOption("SalaryPeriod", "Monthly");
                } else {
                    // Select "Negotiable" option
                    String[] negotiableSelectors = {
                        "input[name='SalaryNegotiable']",
                        "input[type='checkbox'][id*='negotiable']",
                        "label:has-text('Negotiable') input",
                        "input[value='negotiable']"
                    };
                    for (String selector : negotiableSelectors) {
                        if (page.locator(selector).count() > 0) {
                            page.locator(selector).click();
                            break;
                        }
                    }
                }

                // Benefits (if separate field)
                if (job.getBenefits() != null && !job.getBenefits().isEmpty()) {
                    if (page.locator("textarea[name='Benefits']").count() > 0) {
                        fillInput("textarea[name='Benefits']", job.getBenefits());
                    }
                }

                // Click Continue/Next
                if (!clickNextButton()) {
                    log.debug("No next button found, may be on same page form");
                }

                return true;
            } catch (Exception e) {
                log.error("Error filling salary information: {}", e.getMessage());
                return false;
            }
        }

        /**
         * Fill application settings.
         */
        private boolean fillApplicationSettings(JobPosting job) {
            log.debug("Filling application settings...");

            try {
                playwrightManager.humanDelay(1000, 2000);

                // Application URL (redirect to SureWork)
                String applicationUrl = "https://careers.surework.co.za/apply/" + job.getJobReference();

                // Select external application method
                String[] externalOptionSelectors = {
                    "input[name='ApplicationMethod'][value='external']",
                    "input[name='ApplicationMethod'][value='url']",
                    "input[type='radio'][value='External']",
                    "label:has-text('External') input",
                    "label:has-text('Direct URL') input"
                };

                for (String selector : externalOptionSelectors) {
                    if (page.locator(selector).count() > 0) {
                        page.locator(selector).first().click();
                        playwrightManager.humanDelay(500, 1000);
                        break;
                    }
                }

                // Fill external URL
                String[] urlInputSelectors = {
                    "input[name='ApplicationUrl'], input#ApplicationUrl",
                    "input[name='ExternalUrl'], input#ExternalUrl",
                    "input[type='url']", "input[placeholder*='URL']"
                };

                for (String selector : urlInputSelectors) {
                    if (page.locator(selector).count() > 0) {
                        fillInput(selector, applicationUrl);
                        break;
                    }
                }

                // Contact email (optional backup)
                if (page.locator("input[name='ContactEmail']").count() > 0) {
                    fillInput("input[name='ContactEmail']", "apply@surework.co.za");
                }

                // Click Continue/Next
                if (!clickNextButton()) {
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
                    "button:has-text('Post Job')",
                    "button:has-text('Publish')",
                    "button:has-text('Submit')",
                    "button:has-text('Post')",
                    "button[type='submit']:has-text('Post')",
                    "input[type='submit'][value*='Post']",
                    "[data-testid='submit-job']"
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
                if (hasCaptcha()) {
                    screenshot("captcha_after_submit");
                    return PostingResult.requiresManual("CAPTCHA required after form submission");
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
                boolean hasSuccessMessage = content.contains("successfully") ||
                        content.contains("job posted") ||
                        content.contains("job has been posted") ||
                        content.contains("job is now live") ||
                        content.contains("congratulations") ||
                        content.contains("thank you");

                boolean hasSuccessUrl = url.contains("/Jobs/Manage") ||
                        url.contains("/confirmation") ||
                        url.contains("/success");

                boolean hasSuccessElement = page.locator("[class*='success'], [class*='alert-success']").count() > 0;

                if (hasSuccessMessage || hasSuccessUrl || hasSuccessElement) {
                    String externalJobId = extractJobId();
                    String externalUrl = getJobUrl(externalJobId);

                    // Careers24 jobs typically stay active for 30 days
                    LocalDateTime expiresAt = LocalDateTime.now().plusDays(30);

                    log.info("Successfully posted job {} to Careers24: {}", job.getJobReference(), externalJobId);
                    screenshot("success");
                    return PostingResult.success(externalJobId, externalUrl, expiresAt);
                }

                // Check for error messages
                if (content.contains("error") || content.contains("couldn't post") ||
                    content.contains("problem") || content.contains("failed")) {
                    screenshot("posting_error");
                    return PostingResult.failure("Careers24 returned an error during posting");
                }

                screenshot("submit_result_unclear");
                return PostingResult.failure("Could not confirm job was posted to Careers24");

            } catch (Exception e) {
                log.error("Error verifying posting success: {}", e.getMessage());
                return PostingResult.failure("Verification error: " + e.getMessage());
            }
        }

        /**
         * Helper to select from dropdown/select elements.
         */
        private void selectDropdownOption(String fieldName, String value) {
            try {
                // Try select element first (Careers24 typically uses standard selects)
                String selectSelector = "select[id='" + fieldName + "'], select[name='" + fieldName + "'], " +
                                       "select[id*='" + fieldName + "'], select[name*='" + fieldName + "']";
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
         * Click next/continue button to advance through wizard.
         */
        private boolean clickNextButton() {
            String[] nextSelectors = {
                "button:has-text('Continue')",
                "button:has-text('Next')",
                "button:has-text('Save & Continue')",
                "button:has-text('Proceed')",
                "button[type='submit']:not(:has-text('Post'))",
                "input[type='submit'][value*='Continue']",
                "input[type='submit'][value*='Next']",
                "[data-testid='next-button']"
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
            return BASE_URL + "/jobs/" + externalJobId;
        }

        @Override
        public boolean removeJob(String externalJobId) {
            log.info("Removing job {} from Careers24", externalJobId);

            try {
                // Navigate to job management
                navigateTo(MANAGE_JOBS_URL);
                playwrightManager.humanDelay(2000, 3000);

                // Find the job in the list
                String[] jobRowSelectors = {
                    "[data-job-id='" + externalJobId + "']",
                    "[href*='" + externalJobId + "']",
                    "tr:has-text('" + externalJobId + "')",
                    "[class*='job-row']:has-text('" + externalJobId + "')"
                };

                boolean found = false;
                for (String selector : jobRowSelectors) {
                    if (page.locator(selector).count() > 0) {
                        page.locator(selector).first().click();
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    log.warn("Job {} not found in Careers24 job list", externalJobId);
                    return false;
                }

                playwrightManager.humanDelay(1000, 2000);

                // Click close/delete/expire button
                String[] closeSelectors = {
                    "button:has-text('Close Job')",
                    "button:has-text('Expire')",
                    "button:has-text('Delete')",
                    "button:has-text('Remove')",
                    "a:has-text('Close')",
                    "[aria-label='Close job']",
                    "[data-testid='close-job']"
                };

                for (String selector : closeSelectors) {
                    if (page.locator(selector).count() > 0) {
                        page.locator(selector).click();
                        playwrightManager.humanDelay(500, 1000);

                        // Confirm if needed
                        String[] confirmSelectors = {
                            "button:has-text('Confirm')",
                            "button:has-text('Yes')",
                            "button:has-text('OK')"
                        };
                        for (String confirmSelector : confirmSelectors) {
                            if (page.locator(confirmSelector).count() > 0) {
                                page.locator(confirmSelector).first().click();
                                break;
                            }
                        }

                        log.info("Successfully removed job {} from Careers24", externalJobId);
                        return true;
                    }
                }

                return false;
            } catch (Exception e) {
                log.error("Error removing job from Careers24: {}", e.getMessage());
                return false;
            }
        }

        /**
         * Check if a job is still active on Careers24.
         */
        public boolean checkJobActive(String externalJobId) {
            try {
                navigateTo(getJobUrl(externalJobId));
                playwrightManager.humanDelay(2000, 3000);

                String content = page.content().toLowerCase();

                // Check for inactive indicators
                boolean isExpired = content.contains("expired") ||
                        content.contains("no longer available") ||
                        content.contains("job has been closed") ||
                        content.contains("this job has been removed") ||
                        content.contains("position filled") ||
                        content.contains("not found") ||
                        page.locator("[class*='expired'], [class*='closed']").count() > 0;

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
                "/jobs/([a-zA-Z0-9-]+)",
                "jobId=([a-zA-Z0-9-]+)",
                "/job/([0-9]+)",
                "id=([0-9]+)"
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
                java.util.regex.Pattern p = java.util.regex.Pattern.compile("\"jobId\"\\s*:\\s*\"?([a-zA-Z0-9-]+)\"?");
                java.util.regex.Matcher m = p.matcher(content);
                if (m.find()) {
                    return m.group(1);
                }
            } catch (Exception e) {
                log.debug("Could not extract job ID from content");
            }

            // Generate placeholder
            return "C24-" + System.currentTimeMillis();
        }

        // === South African Specific Mappings ===

        private String mapEmploymentType(JobPosting.EmploymentType type) {
            return switch (type) {
                case FULL_TIME -> "Permanent";
                case PART_TIME -> "Part Time";
                case CONTRACT -> "Contract";
                case TEMPORARY -> "Temporary";
                case INTERNSHIP -> "Internship";
                case FREELANCE -> "Freelance";
            };
        }

        private String mapExperienceLevel(int yearsMin) {
            if (yearsMin == 0) return "Entry Level";
            if (yearsMin <= 2) return "Junior";
            if (yearsMin <= 5) return "Mid Level";
            if (yearsMin <= 8) return "Senior";
            return "Executive";
        }

        private String mapEducationLevel(JobPosting.EducationLevel level) {
            return switch (level) {
                case NO_REQUIREMENT -> "None";
                case MATRIC -> "Matric";
                case CERTIFICATE -> "Certificate";
                case DIPLOMA -> "Diploma";
                case DEGREE -> "Degree";
                case HONOURS -> "Honours";
                case MASTERS -> "Masters";
                case DOCTORATE -> "Doctorate";
            };
        }

        private String mapProvince(JobPosting.Province province) {
            return switch (province) {
                case GAUTENG -> "Gauteng";
                case WESTERN_CAPE -> "Western Cape";
                case KWAZULU_NATAL -> "KwaZulu-Natal";
                case EASTERN_CAPE -> "Eastern Cape";
                case FREE_STATE -> "Free State";
                case LIMPOPO -> "Limpopo";
                case MPUMALANGA -> "Mpumalanga";
                case NORTH_WEST -> "North West";
                case NORTHERN_CAPE -> "Northern Cape";
            };
        }

        private String mapIndustry(JobPosting.Industry industry) {
            return switch (industry) {
                case IT_SOFTWARE -> "IT/Computers";
                case FINANCE_BANKING -> "Banking/Finance";
                case HEALTHCARE -> "Healthcare";
                case RETAIL -> "Retail";
                case MANUFACTURING -> "Manufacturing";
                case CONSTRUCTION -> "Construction";
                case EDUCATION -> "Education";
                case HOSPITALITY_TOURISM -> "Hospitality/Tourism";
                case LOGISTICS_TRANSPORT -> "Transport/Logistics";
                case LEGAL -> "Legal";
                case MARKETING_ADVERTISING -> "Marketing";
                case HUMAN_RESOURCES -> "HR";
                case ENGINEERING -> "Engineering";
                case MINING -> "Mining";
                case AGRICULTURE -> "Agriculture";
                case TELECOMMUNICATIONS -> "Telecommunications";
                case REAL_ESTATE -> "Property";
                case MEDIA_ENTERTAINMENT -> "Media";
                case GOVERNMENT_PUBLIC_SECTOR -> "Government";
                case NON_PROFIT -> "NGO/NPO";
                case OTHER -> "Other";
            };
        }

        private String mapJobFunction(JobPosting job) {
            if (job.getIndustry() == null) return "General";

            return switch (job.getIndustry()) {
                case IT_SOFTWARE -> "Information Technology";
                case FINANCE_BANKING -> "Finance & Accounting";
                case HEALTHCARE -> "Healthcare & Medical";
                case RETAIL -> "Sales & Retail";
                case MANUFACTURING -> "Manufacturing";
                case CONSTRUCTION -> "Construction & Building";
                case EDUCATION -> "Education & Training";
                case HOSPITALITY_TOURISM -> "Hospitality & Tourism";
                case LOGISTICS_TRANSPORT -> "Logistics & Distribution";
                case LEGAL -> "Legal";
                case MARKETING_ADVERTISING -> "Marketing & Communications";
                case HUMAN_RESOURCES -> "Human Resources";
                case ENGINEERING -> "Engineering";
                case MINING -> "Mining";
                case AGRICULTURE -> "Agriculture & Farming";
                case TELECOMMUNICATIONS -> "Telecommunications";
                case REAL_ESTATE -> "Real Estate & Property";
                case MEDIA_ENTERTAINMENT -> "Media & Entertainment";
                case GOVERNMENT_PUBLIC_SECTOR -> "Government";
                case NON_PROFIT -> "Non-Profit & NGO";
                case OTHER -> "General";
            };
        }

        private String mapSubCategory(JobPosting job) {
            String title = job.getTitle().toLowerCase();

            if (title.contains("developer") || title.contains("programmer")) return "Software Development";
            if (title.contains("manager")) return "Management";
            if (title.contains("analyst")) return "Analysis";
            if (title.contains("admin")) return "Administration";
            if (title.contains("sales")) return "Sales";
            if (title.contains("support")) return "Support";
            if (title.contains("consultant")) return "Consulting";
            if (title.contains("engineer")) return "Engineering";

            return "Other";
        }
    }
}
