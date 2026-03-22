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
 * Adapter for posting jobs to Pnet (pnet.co.za).
 * Pnet is one of South Africa's largest job portals.
 *
 * <p>This adapter handles:
 * <ul>
 *   <li>Pnet employer authentication with CAPTCHA detection</li>
 *   <li>Multi-step job posting wizard</li>
 *   <li>South African province selection</li>
 *   <li>Industry and job function mapping</li>
 *   <li>Education level mapping (Matric, Diploma, Degree, etc.)</li>
 *   <li>ZAR salary handling</li>
 *   <li>Rate limiting and session management</li>
 *   <li>Job status verification and removal</li>
 * </ul>
 */
@Component
public class PnetPortalAdapter implements PortalAdapter {

    private static final Logger log = LoggerFactory.getLogger(PnetPortalAdapter.class);

    private static final String BASE_URL = "https://www.pnet.co.za";
    private static final String EMPLOYER_URL = "https://employer.pnet.co.za";
    private static final String LOGIN_URL = EMPLOYER_URL + "/login";
    private static final String POST_JOB_URL = EMPLOYER_URL + "/jobs/post";
    private static final String MANAGE_JOBS_URL = EMPLOYER_URL + "/jobs/manage";

    // Retry configuration
    private static final int MAX_RETRY_ATTEMPTS = 3;
    private static final int RETRY_DELAY_MS = 2000;

    // Timeout configuration
    private static final int LOGIN_TIMEOUT_MS = 30000;
    private static final int PAGE_LOAD_TIMEOUT_MS = 15000;

    private final PlaywrightManager playwrightManager;
    private final PortalCredentialsService credentialsService;

    public PnetPortalAdapter(PlaywrightManager playwrightManager, PortalCredentialsService credentialsService) {
        this.playwrightManager = playwrightManager;
        this.credentialsService = credentialsService;
    }

    @Override
    public JobPosting.JobPortal getPortal() {
        return JobPosting.JobPortal.PNET;
    }

    @Override
    public boolean isConfigured() {
        return credentialsService.isPortalActive(getPortal());
    }

    @Override
    public PortalPage.PostingResult postJob(JobPosting job, String tenantName) {
        log.info("Attempting to post job {} to Pnet", job.getJobReference());

        // Check rate limiting
        if (!credentialsService.canPostToPortal(getPortal())) {
            log.warn("Pnet rate limit reached for today");
            return PortalPage.PostingResult.failure("Daily rate limit reached for Pnet");
        }

        var credentials = credentialsService.getCredentials(getPortal());
        if (credentials.isEmpty()) {
            log.error("Pnet credentials not configured");
            credentialsService.updateConnectionStatus(getPortal(),
                PlatformPortalCredentials.ConnectionStatus.NOT_CONFIGURED, "Credentials not configured");
            return PortalPage.PostingResult.failure("Pnet credentials not configured");
        }

        try (PnetPage pnetPage = new PnetPage(playwrightManager)) {
            // Attempt login with retries
            boolean loginSuccess = attemptLoginWithRetry(pnetPage,
                credentials.get().username(), credentials.get().password());

            if (!loginSuccess) {
                return handleLoginFailure(pnetPage);
            }

            // Navigate to post job page
            pnetPage.navigateToPostJob();

            // Check for any blockers before filling form
            if (pnetPage.hasCaptcha()) {
                credentialsService.updateConnectionStatus(getPortal(),
                    PlatformPortalCredentials.ConnectionStatus.CAPTCHA_REQUIRED, "CAPTCHA detected");
                return PortalPage.PostingResult.requiresManual("CAPTCHA detected on Pnet job posting page");
            }

            // Submit the job
            PortalPage.PostingResult result = pnetPage.submitJob(job);

            // Update connection status based on result
            if (result.success()) {
                credentialsService.recordSuccessfulPost(getPortal());
                log.info("Successfully posted job {} to Pnet with external ID: {}",
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
            log.error("Error posting job {} to Pnet", job.getJobReference(), e);
            credentialsService.updateConnectionStatus(getPortal(),
                PlatformPortalCredentials.ConnectionStatus.ERROR, "Exception: " + e.getMessage());
            return PortalPage.PostingResult.failure("Error: " + e.getMessage());
        }
    }

    /**
     * Attempt login with retry logic for transient failures.
     */
    private boolean attemptLoginWithRetry(PnetPage page, String username, String password) {
        for (int attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
            log.debug("Pnet login attempt {}/{}", attempt, MAX_RETRY_ATTEMPTS);

            if (page.login(username, password)) {
                return true;
            }

            if (page.hasCaptcha()) {
                log.warn("Pnet CAPTCHA detected - requires manual intervention");
                return false;
            }

            if (page.hasSecurityChallenge()) {
                log.warn("Pnet security challenge detected - requires manual intervention");
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
    private PortalPage.PostingResult handleLoginFailure(PnetPage page) {
        if (page.hasCaptcha()) {
            credentialsService.updateConnectionStatus(getPortal(),
                PlatformPortalCredentials.ConnectionStatus.CAPTCHA_REQUIRED, "CAPTCHA required");
            return PortalPage.PostingResult.requiresManual("Pnet CAPTCHA required");
        }

        if (page.hasSecurityChallenge()) {
            credentialsService.updateConnectionStatus(getPortal(),
                PlatformPortalCredentials.ConnectionStatus.CAPTCHA_REQUIRED, "Security verification required");
            return PortalPage.PostingResult.requiresManual("Pnet security verification required");
        }

        if (page.hasInvalidCredentialsError()) {
            credentialsService.updateConnectionStatus(getPortal(),
                PlatformPortalCredentials.ConnectionStatus.INVALID_CREDENTIALS, "Invalid username or password");
            return PortalPage.PostingResult.failure("Invalid Pnet credentials");
        }

        credentialsService.updateConnectionStatus(getPortal(),
            PlatformPortalCredentials.ConnectionStatus.ERROR, "Login failed");
        return PortalPage.PostingResult.failure("Failed to login to Pnet");
    }

    @Override
    public boolean removeJob(String externalJobId) {
        log.info("Attempting to remove job {} from Pnet", externalJobId);

        var credentials = credentialsService.getCredentials(getPortal());
        if (credentials.isEmpty()) {
            log.error("Pnet credentials not configured for job removal");
            return false;
        }

        try (PnetPage pnetPage = new PnetPage(playwrightManager)) {
            if (!pnetPage.login(credentials.get().username(), credentials.get().password())) {
                log.error("Failed to login to Pnet for job removal");
                return false;
            }

            return pnetPage.removeJob(externalJobId);

        } catch (Exception e) {
            log.error("Error removing job {} from Pnet", externalJobId, e);
            return false;
        }
    }

    @Override
    public boolean isJobActive(String externalJobId) {
        log.debug("Checking if job {} is active on Pnet", externalJobId);

        var credentials = credentialsService.getCredentials(getPortal());
        if (credentials.isEmpty()) {
            return true; // Assume active if we can't check
        }

        try (PnetPage pnetPage = new PnetPage(playwrightManager)) {
            if (!pnetPage.login(credentials.get().username(), credentials.get().password())) {
                return true; // Assume active if we can't check
            }

            return pnetPage.checkJobActive(externalJobId);

        } catch (Exception e) {
            log.error("Error checking job status on Pnet", e);
            return true; // Assume active on error
        }
    }

    @Override
    public String getJobUrl(String externalJobId) {
        return BASE_URL + "/job/" + externalJobId;
    }

    /**
     * Pnet-specific page object with comprehensive automation.
     */
    private class PnetPage extends PortalPage {

        // Pnet-specific selectors
        private static final String USERNAME_SELECTOR = "input[name='email'], input[type='email'], input#email";
        private static final String PASSWORD_SELECTOR = "input[name='password'], input[type='password'], input#password";
        private static final String LOGIN_SUBMIT_SELECTOR = "button[type='submit'], input[type='submit'], button:has-text('Sign in'), button:has-text('Login')";
        private static final String SECURITY_CHALLENGE_SELECTOR = "[class*='challenge'], [class*='verify'], [class*='security']";

        // Job posting form selectors
        private static final String JOB_TITLE_SELECTOR = "input[name='title'], input#title, input[id*='job-title']";
        private static final String LOCATION_SELECTOR = "input[name='location'], input#location, [id*='location-input']";
        private static final String DESCRIPTION_EDITOR_SELECTOR = "[class*='ql-editor'], [contenteditable='true'], textarea[name='description']";

        // Navigation selectors
        private static final String DASHBOARD_SELECTOR = "[class*='dashboard'], [class*='employer-dashboard']";
        private static final String PROFILE_MENU_SELECTOR = "[class*='user-menu'], [class*='account-menu'], img[alt*='profile']";
        private static final String POST_JOB_LINK_SELECTOR = "a:has-text('Post a Job'), a:has-text('Post Job'), a[href*='post']";

        PnetPage(PlaywrightManager playwrightManager) {
            super(playwrightManager, "pnet");
        }

        @Override
        public JobPosting.JobPortal getPortal() {
            return JobPosting.JobPortal.PNET;
        }

        @Override
        public String getBaseUrl() {
            return BASE_URL;
        }

        @Override
        public boolean login(String username, String password) {
            log.info("Logging into Pnet...");
            navigateTo(LOGIN_URL);
            handleCookieConsent();

            // Wait for login form
            playwrightManager.humanDelay(1000, 2000);

            // Fill login form with human-like behavior
            log.debug("Entering Pnet credentials...");
            fillInput(USERNAME_SELECTOR, username);
            playwrightManager.humanDelay(500, 1000);
            fillInput(PASSWORD_SELECTOR, password);
            playwrightManager.humanDelay(500, 1000);

            // Submit login
            clickAndWait(LOGIN_SUBMIT_SELECTOR);

            // Wait for potential security challenges
            playwrightManager.humanDelay(3000, 5000);

            // Check login result
            boolean success = isLoggedIn();
            if (success) {
                log.info("Successfully logged into Pnet");
            } else {
                log.warn("Failed to login to Pnet");
                screenshot("login_failed");
            }
            return success;
        }

        @Override
        public boolean isLoggedIn() {
            try {
                // Check for various logged-in indicators
                boolean hasDashboard = page.locator(DASHBOARD_SELECTOR).count() > 0;
                boolean hasProfileMenu = page.locator(PROFILE_MENU_SELECTOR).count() > 0;
                boolean hasPostJobLink = page.locator(POST_JOB_LINK_SELECTOR).count() > 0;
                boolean notOnLoginPage = !page.url().contains("/login") && !page.url().contains("/signin");

                return (hasDashboard || hasProfileMenu || hasPostJobLink) && notOnLoginPage;
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
                        content.contains("doesn't match") ||
                        content.contains("wrong password") ||
                        content.contains("account not found") ||
                        content.contains("login failed");
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
            log.info("Navigating to Pnet job posting page...");
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
                    "[class*='modal-close']"
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
                log.info("Filling Pnet job form for: {} (ref: {})", job.getTitle(), job.getJobReference());

                // Step 1: Job basics (title, location)
                if (!fillJobBasics(job)) {
                    return PostingResult.failure("Failed to fill job basics");
                }

                // Step 2: Job details (employment type, industry, function)
                if (!fillJobDetails(job)) {
                    return PostingResult.failure("Failed to fill job details");
                }

                // Step 3: Requirements and qualifications
                if (!fillJobRequirements(job)) {
                    return PostingResult.failure("Failed to fill job requirements");
                }

                // Step 4: Job description
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
                log.error("Error filling Pnet job form for: {}", job.getJobReference(), e);
                screenshot("form_error");
                return PostingResult.failure("Form error: " + e.getMessage());
            }
        }

        /**
         * Fill job basics: title, location, province.
         */
        private boolean fillJobBasics(JobPosting job) {
            log.debug("Filling job basics...");

            try {
                // Job Title
                fillInput(JOB_TITLE_SELECTOR, job.getTitle());
                playwrightManager.humanDelay(500, 1000);

                // Job Reference (internal reference)
                if (page.locator("input[name='reference'], input#reference").count() > 0) {
                    fillInput("input[name='reference'], input#reference", job.getJobReference());
                    playwrightManager.humanDelay(300, 600);
                }

                // Province selection
                if (job.getProvince() != null) {
                    String province = mapProvince(job.getProvince());
                    selectDropdownOption("province", province);
                    playwrightManager.humanDelay(500, 1000);
                }

                // City/Location
                String city = job.getCity() != null ? job.getCity() : "Johannesburg";
                fillLocationWithAutocomplete(city);

                // Remote work option
                if (job.isRemote()) {
                    try {
                        String[] remoteSelectors = {
                            "input[name='remote'], input#remote",
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
            fillInput(LOCATION_SELECTOR, location);
            playwrightManager.humanDelay(1500, 2500);

            // Select from location autocomplete
            String[] autocompleteSelectors = {
                "[class*='autocomplete'] li",
                "[role='listbox'] [role='option']",
                "[class*='suggestion'] li",
                "[class*='dropdown-item']"
            };

            for (String selector : autocompleteSelectors) {
                if (page.locator(selector).count() > 0) {
                    page.locator(selector).first().click();
                    playwrightManager.humanDelay(500, 1000);
                    break;
                }
            }
        }

        /**
         * Fill job details: employment type, industry, function.
         */
        private boolean fillJobDetails(JobPosting job) {
            log.debug("Filling job details...");

            try {
                playwrightManager.humanDelay(1000, 2000);

                // Employment Type
                String empType = mapEmploymentType(job.getEmploymentType());
                selectDropdownOption("employment", empType);
                playwrightManager.humanDelay(500, 1000);

                // Contract Duration (if applicable)
                if (job.getEmploymentType() == JobPosting.EmploymentType.CONTRACT &&
                    job.getContractDuration() != null && !job.getContractDuration().isEmpty()) {
                    if (page.locator("input[name='contractDuration'], input#contractDuration").count() > 0) {
                        fillInput("input[name='contractDuration']", job.getContractDuration());
                    }
                }

                // Industry
                if (job.getIndustry() != null) {
                    String industry = mapIndustry(job.getIndustry());
                    selectDropdownOption("industry", industry);
                    playwrightManager.humanDelay(500, 1000);
                }

                // Job Function/Category
                selectJobFunction(job);

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
         * Select job function/category based on job properties.
         */
        private void selectJobFunction(JobPosting job) {
            try {
                // Pnet uses job functions/categories
                String function = mapJobFunction(job);
                selectDropdownOption("function", function);
                playwrightManager.humanDelay(500, 1000);

                // Sub-function if available
                if (page.locator("select[name='subFunction'], select#subFunction").count() > 0) {
                    String subFunction = mapSubFunction(job);
                    selectDropdownOption("subFunction", subFunction);
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
                    selectDropdownOption("experience", expLevel);
                    playwrightManager.humanDelay(500, 1000);
                }

                // Experience Years (if separate field)
                if (job.getExperienceYearsMin() != null &&
                    page.locator("input[name='experienceYears'], input#experienceYears").count() > 0) {
                    fillInput("input[name='experienceYears']", job.getExperienceYearsMin().toString());
                }

                // Education Level
                if (job.getEducationLevel() != null) {
                    String education = mapEducationLevel(job.getEducationLevel());
                    selectDropdownOption("education", education);
                    playwrightManager.humanDelay(500, 1000);
                }

                // Skills/Keywords
                addSkills(job);

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
         * Add skills from job posting.
         */
        private void addSkills(JobPosting job) {
            if (job.getSkills() == null || job.getSkills().isEmpty()) {
                return;
            }

            try {
                String[] skillSelectors = {
                    "input[name='skills'], input#skills",
                    "input[id*='skill'], input[aria-label*='skill']",
                    "[class*='skills-input'] input"
                };

                String skillInputSelector = null;
                for (String selector : skillSelectors) {
                    if (page.locator(selector).count() > 0) {
                        skillInputSelector = selector;
                        break;
                    }
                }

                if (skillInputSelector == null) return;

                String[] skills = job.getSkills().split(",");
                int maxSkills = Math.min(skills.length, 10);

                for (int i = 0; i < maxSkills; i++) {
                    String skill = skills[i].trim();
                    if (skill.isEmpty()) continue;

                    page.locator(skillInputSelector).fill(skill);
                    playwrightManager.humanDelay(800, 1500);

                    // Select from autocomplete or press Enter
                    String autocompleteOption = "[role='listbox'] [role='option'], [class*='autocomplete'] li";
                    if (page.locator(autocompleteOption).count() > 0) {
                        page.locator(autocompleteOption).first().click();
                    } else {
                        page.keyboard().press("Enter");
                    }
                    playwrightManager.humanDelay(300, 600);
                }
            } catch (Exception e) {
                log.debug("Could not add skills: {}", e.getMessage());
            }
        }

        /**
         * Fill job description.
         */
        private boolean fillJobDescription(JobPosting job) {
            log.debug("Filling job description...");

            try {
                playwrightManager.humanDelay(1000, 2000);

                // Build description
                String description = buildJobDescription(job, null);

                // Handle rich text editor
                if (page.locator("[class*='ql-editor']").count() > 0) {
                    page.locator("[class*='ql-editor']").first().click();
                    playwrightManager.humanDelay(300, 500);
                    page.locator("[class*='ql-editor']").first().fill(description);
                } else if (page.locator("iframe[class*='editor'], iframe[id*='editor']").count() > 0) {
                    // Handle iframe-based editor
                    page.frameLocator("iframe[class*='editor'], iframe[id*='editor']")
                        .locator("body").fill(description);
                } else if (page.locator("textarea[name='description'], textarea[id*='description']").count() > 0) {
                    fillInput("textarea[name='description']", description);
                } else {
                    log.warn("Could not find job description field");
                    screenshot("no_description_field");
                }

                playwrightManager.humanDelay(500, 1000);

                // Requirements section (if separate)
                if (job.getRequirements() != null &&
                    page.locator("textarea[name='requirements']").count() > 0) {
                    fillInput("textarea[name='requirements']", job.getRequirements());
                }

                // Responsibilities section (if separate)
                if (job.getResponsibilities() != null &&
                    page.locator("textarea[name='responsibilities']").count() > 0) {
                    fillInput("textarea[name='responsibilities']", job.getResponsibilities());
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
                            "input[name='salaryMin']", "input#salaryMin",
                            "input[name='salary-min']", "input[id*='salary-min']",
                            "input[name='minSalary']"
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
                            "input[name='salaryMax']", "input#salaryMax",
                            "input[name='salary-max']", "input[id*='salary-max']",
                            "input[name='maxSalary']"
                        };
                        for (String selector : maxSelectors) {
                            if (page.locator(selector).count() > 0) {
                                fillInput(selector, job.getSalaryMax().toString());
                                break;
                            }
                        }
                    }

                    // Salary frequency (typically monthly in SA)
                    selectDropdownOption("salaryFrequency", "Monthly");
                } else {
                    // Select "Negotiable" or hide salary
                    String[] negotiableSelectors = {
                        "input[name='salaryNegotiable']",
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
                    if (page.locator("textarea[name='benefits']").count() > 0) {
                        fillInput("textarea[name='benefits']", job.getBenefits());
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

                // Select external URL option
                String[] externalOptionSelectors = {
                    "input[type='radio'][value='external']",
                    "input[type='radio'][value='url']",
                    "label:has-text('External') input",
                    "label:has-text('Direct to URL') input",
                    "[data-testid='external-apply']"
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
                    "input[name='applicationUrl']", "input#applicationUrl",
                    "input[name='applyUrl']", "input[id*='apply-url']",
                    "input[type='url']", "input[placeholder*='URL']"
                };

                for (String selector : urlInputSelectors) {
                    if (page.locator(selector).count() > 0) {
                        fillInput(selector, applicationUrl);
                        break;
                    }
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
                    "[data-testid='submit-job']",
                    "input[type='submit'][value*='Post']"
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
                boolean hasSuccessMessage = content.contains("successfully posted") ||
                        content.contains("job has been posted") ||
                        content.contains("job is now live") ||
                        content.contains("job submitted") ||
                        content.contains("congratulations");

                boolean hasSuccessUrl = url.contains("/jobs/manage") ||
                        url.contains("/job/success") ||
                        url.contains("/confirmation");

                boolean hasSuccessElement = page.locator("[class*='success'], [class*='alert-success']").count() > 0;

                if (hasSuccessMessage || hasSuccessUrl || hasSuccessElement) {
                    String externalJobId = extractJobId();
                    String externalUrl = getJobUrl(externalJobId);

                    // Pnet jobs typically stay active for 30 days
                    LocalDateTime expiresAt = LocalDateTime.now().plusDays(30);

                    log.info("Successfully posted job {} to Pnet: {}", job.getJobReference(), externalJobId);
                    screenshot("success");
                    return PostingResult.success(externalJobId, externalUrl, expiresAt);
                }

                // Check for error messages
                if (content.contains("error") || content.contains("couldn't post") ||
                    content.contains("problem") || content.contains("failed")) {
                    screenshot("posting_error");
                    return PostingResult.failure("Pnet returned an error during posting");
                }

                screenshot("submit_result_unclear");
                return PostingResult.failure("Could not confirm job was posted to Pnet");

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
         * Click next/continue button to advance through wizard.
         */
        private boolean clickNextButton() {
            String[] nextSelectors = {
                "button:has-text('Continue')",
                "button:has-text('Next')",
                "button:has-text('Save and Continue')",
                "button:has-text('Proceed')",
                "button[type='submit']:not(:has-text('Post'))",
                "[data-testid='next-button']",
                "input[type='submit'][value*='Continue']"
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
            return BASE_URL + "/job/" + externalJobId;
        }

        @Override
        public boolean removeJob(String externalJobId) {
            log.info("Removing job {} from Pnet", externalJobId);

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
                    log.warn("Job {} not found in Pnet job list", externalJobId);
                    return false;
                }

                playwrightManager.humanDelay(1000, 2000);

                // Click close/delete/expire button
                String[] closeSelectors = {
                    "button:has-text('Close Job')",
                    "button:has-text('Expire')",
                    "button:has-text('Delete')",
                    "button:has-text('Remove')",
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

                        log.info("Successfully removed job {} from Pnet", externalJobId);
                        return true;
                    }
                }

                return false;
            } catch (Exception e) {
                log.error("Error removing job from Pnet: {}", e.getMessage());
                return false;
            }
        }

        /**
         * Check if a job is still active on Pnet.
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
                "/job/([a-zA-Z0-9-]+)",
                "jobId=([a-zA-Z0-9-]+)",
                "/jobs/([0-9]+)",
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
            return "PNET-" + System.currentTimeMillis();
        }

        // === South African Specific Mappings ===

        private String mapEmploymentType(JobPosting.EmploymentType type) {
            return switch (type) {
                case FULL_TIME -> "Permanent";
                case PART_TIME -> "Part-time";
                case CONTRACT -> "Contract";
                case TEMPORARY -> "Temporary";
                case INTERNSHIP -> "Graduate / Internship";
                case FREELANCE -> "Freelance";
            };
        }

        private String mapExperienceLevel(int yearsMin) {
            if (yearsMin == 0) return "Entry Level";
            if (yearsMin <= 2) return "Junior (1-2 years)";
            if (yearsMin <= 5) return "Mid Level (3-5 years)";
            if (yearsMin <= 8) return "Senior (6-8 years)";
            if (yearsMin <= 12) return "Expert (9-12 years)";
            return "Executive (13+ years)";
        }

        private String mapEducationLevel(JobPosting.EducationLevel level) {
            return switch (level) {
                case NO_REQUIREMENT -> "None";
                case MATRIC -> "Matric / Grade 12";
                case CERTIFICATE -> "Certificate";
                case DIPLOMA -> "National Diploma";
                case DEGREE -> "Bachelor's Degree";
                case HONOURS -> "Honours Degree";
                case MASTERS -> "Master's Degree";
                case DOCTORATE -> "Doctorate (PhD)";
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
                case IT_SOFTWARE -> "IT & Internet";
                case FINANCE_BANKING -> "Banking & Financial Services";
                case HEALTHCARE -> "Medical & Health";
                case RETAIL -> "Retail";
                case MANUFACTURING -> "Manufacturing";
                case CONSTRUCTION -> "Construction & Property";
                case EDUCATION -> "Education & Training";
                case HOSPITALITY_TOURISM -> "Hospitality & Tourism";
                case LOGISTICS_TRANSPORT -> "Transport & Logistics";
                case LEGAL -> "Legal";
                case MARKETING_ADVERTISING -> "Marketing & Communications";
                case HUMAN_RESOURCES -> "Human Resources";
                case ENGINEERING -> "Engineering";
                case MINING -> "Mining";
                case AGRICULTURE -> "Agriculture";
                case TELECOMMUNICATIONS -> "Telecommunications";
                case REAL_ESTATE -> "Property";
                case MEDIA_ENTERTAINMENT -> "Media & Entertainment";
                case GOVERNMENT_PUBLIC_SECTOR -> "Government & Parastatal";
                case NON_PROFIT -> "NGO & Non-Profit";
                case OTHER -> "Other";
            };
        }

        private String mapJobFunction(JobPosting job) {
            // Map based on industry and title
            if (job.getIndustry() == null) return "General";

            return switch (job.getIndustry()) {
                case IT_SOFTWARE -> "IT & Telecommunications";
                case FINANCE_BANKING -> "Finance & Accounting";
                case HEALTHCARE -> "Medical & Health";
                case RETAIL -> "Sales";
                case MANUFACTURING -> "Manufacturing & Production";
                case CONSTRUCTION -> "Building & Construction";
                case EDUCATION -> "Education & Training";
                case HOSPITALITY_TOURISM -> "Hospitality";
                case LOGISTICS_TRANSPORT -> "Logistics & Transport";
                case LEGAL -> "Legal";
                case MARKETING_ADVERTISING -> "Marketing & PR";
                case HUMAN_RESOURCES -> "Human Resources";
                case ENGINEERING -> "Engineering";
                case MINING -> "Mining";
                case AGRICULTURE -> "Agriculture";
                case TELECOMMUNICATIONS -> "IT & Telecommunications";
                case REAL_ESTATE -> "Property";
                case MEDIA_ENTERTAINMENT -> "Creative & Design";
                case GOVERNMENT_PUBLIC_SECTOR -> "Government";
                case NON_PROFIT -> "NGO & NPO";
                case OTHER -> "General";
            };
        }

        private String mapSubFunction(JobPosting job) {
            // Return a sensible sub-function based on job characteristics
            String title = job.getTitle().toLowerCase();

            if (title.contains("developer") || title.contains("engineer")) return "Software Development";
            if (title.contains("manager")) return "Management";
            if (title.contains("analyst")) return "Analysis";
            if (title.contains("admin")) return "Administration";
            if (title.contains("sales")) return "Sales";
            if (title.contains("support")) return "Support";
            if (title.contains("consultant")) return "Consulting";

            return "Other";
        }
    }
}
