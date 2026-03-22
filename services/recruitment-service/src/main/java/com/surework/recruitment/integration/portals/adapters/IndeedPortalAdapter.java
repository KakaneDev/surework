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
 * Adapter for posting jobs to Indeed South Africa (za.indeed.com).
 * Indeed offers free and sponsored job postings globally.
 *
 * <p>This adapter handles:
 * <ul>
 *   <li>Indeed employer authentication with multi-step login</li>
 *   <li>Multi-step job posting wizard</li>
 *   <li>Job type and schedule selection</li>
 *   <li>Salary and benefits configuration</li>
 *   <li>Application settings (Indeed Apply or external URL)</li>
 *   <li>Sponsored job options</li>
 *   <li>CAPTCHA and verification detection</li>
 *   <li>Rate limiting and session management</li>
 *   <li>Job status tracking and removal</li>
 * </ul>
 */
@Component
public class IndeedPortalAdapter implements PortalAdapter {

    private static final Logger log = LoggerFactory.getLogger(IndeedPortalAdapter.class);

    private static final String BASE_URL = "https://za.indeed.com";
    private static final String EMPLOYER_URL = "https://employers.indeed.com";
    private static final String LOGIN_URL = EMPLOYER_URL + "/login";
    private static final String POST_JOB_URL = EMPLOYER_URL + "/j";
    private static final String MANAGE_JOBS_URL = EMPLOYER_URL + "/jobs";

    // Retry configuration
    private static final int MAX_RETRY_ATTEMPTS = 3;
    private static final int RETRY_DELAY_MS = 2000;

    // Timeout configuration
    private static final int LOGIN_TIMEOUT_MS = 30000;
    private static final int PAGE_LOAD_TIMEOUT_MS = 15000;

    private final PlaywrightManager playwrightManager;
    private final PortalCredentialsService credentialsService;

    public IndeedPortalAdapter(PlaywrightManager playwrightManager, PortalCredentialsService credentialsService) {
        this.playwrightManager = playwrightManager;
        this.credentialsService = credentialsService;
    }

    @Override
    public JobPosting.JobPortal getPortal() {
        return JobPosting.JobPortal.INDEED;
    }

    @Override
    public boolean isConfigured() {
        return credentialsService.isPortalActive(getPortal());
    }

    @Override
    public PortalPage.PostingResult postJob(JobPosting job, String tenantName) {
        log.info("Attempting to post job {} to Indeed", job.getJobReference());

        // Check rate limiting
        if (!credentialsService.canPostToPortal(getPortal())) {
            log.warn("Indeed rate limit reached for today");
            return PortalPage.PostingResult.failure("Daily rate limit reached for Indeed");
        }

        var credentials = credentialsService.getCredentials(getPortal());
        if (credentials.isEmpty()) {
            log.error("Indeed credentials not configured");
            credentialsService.updateConnectionStatus(getPortal(),
                PlatformPortalCredentials.ConnectionStatus.NOT_CONFIGURED, "Credentials not configured");
            return PortalPage.PostingResult.failure("Indeed credentials not configured");
        }

        try (IndeedPage indeedPage = new IndeedPage(playwrightManager)) {
            // Attempt login with retries
            boolean loginSuccess = attemptLoginWithRetry(indeedPage,
                credentials.get().username(), credentials.get().password());

            if (!loginSuccess) {
                return handleLoginFailure(indeedPage);
            }

            // Navigate to post job page
            indeedPage.navigateToPostJob();

            // Check for any blockers before filling form
            if (indeedPage.hasCaptcha()) {
                credentialsService.updateConnectionStatus(getPortal(),
                    PlatformPortalCredentials.ConnectionStatus.CAPTCHA_REQUIRED, "CAPTCHA detected");
                return PortalPage.PostingResult.requiresManual("CAPTCHA detected on Indeed job posting page");
            }

            // Submit the job
            PortalPage.PostingResult result = indeedPage.submitJob(job);

            // Update connection status based on result
            if (result.success()) {
                credentialsService.recordSuccessfulPost(getPortal());
                log.info("Successfully posted job {} to Indeed with external ID: {}",
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
            log.error("Error posting job {} to Indeed", job.getJobReference(), e);
            credentialsService.updateConnectionStatus(getPortal(),
                PlatformPortalCredentials.ConnectionStatus.ERROR, "Exception: " + e.getMessage());
            return PortalPage.PostingResult.failure("Error: " + e.getMessage());
        }
    }

    /**
     * Attempt login with retry logic for transient failures.
     */
    private boolean attemptLoginWithRetry(IndeedPage page, String username, String password) {
        for (int attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
            log.debug("Indeed login attempt {}/{}", attempt, MAX_RETRY_ATTEMPTS);

            if (page.login(username, password)) {
                return true;
            }

            if (page.hasCaptcha()) {
                log.warn("Indeed CAPTCHA detected - requires manual intervention");
                return false;
            }

            if (page.hasSecurityChallenge()) {
                log.warn("Indeed security challenge detected - requires manual intervention");
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
    private PortalPage.PostingResult handleLoginFailure(IndeedPage page) {
        if (page.hasCaptcha()) {
            credentialsService.updateConnectionStatus(getPortal(),
                PlatformPortalCredentials.ConnectionStatus.CAPTCHA_REQUIRED, "CAPTCHA required");
            return PortalPage.PostingResult.requiresManual("Indeed CAPTCHA required");
        }

        if (page.hasSecurityChallenge()) {
            credentialsService.updateConnectionStatus(getPortal(),
                PlatformPortalCredentials.ConnectionStatus.CAPTCHA_REQUIRED, "Security verification required");
            return PortalPage.PostingResult.requiresManual("Indeed security verification required");
        }

        if (page.hasInvalidCredentialsError()) {
            credentialsService.updateConnectionStatus(getPortal(),
                PlatformPortalCredentials.ConnectionStatus.INVALID_CREDENTIALS, "Invalid username or password");
            return PortalPage.PostingResult.failure("Invalid Indeed credentials");
        }

        credentialsService.updateConnectionStatus(getPortal(),
            PlatformPortalCredentials.ConnectionStatus.ERROR, "Login failed");
        return PortalPage.PostingResult.failure("Failed to login to Indeed");
    }

    @Override
    public boolean removeJob(String externalJobId) {
        log.info("Attempting to remove job {} from Indeed", externalJobId);

        var credentials = credentialsService.getCredentials(getPortal());
        if (credentials.isEmpty()) {
            log.error("Indeed credentials not configured for job removal");
            return false;
        }

        try (IndeedPage indeedPage = new IndeedPage(playwrightManager)) {
            if (!indeedPage.login(credentials.get().username(), credentials.get().password())) {
                log.error("Failed to login to Indeed for job removal");
                return false;
            }

            return indeedPage.removeJob(externalJobId);

        } catch (Exception e) {
            log.error("Error removing job {} from Indeed", externalJobId, e);
            return false;
        }
    }

    @Override
    public boolean isJobActive(String externalJobId) {
        log.debug("Checking if job {} is active on Indeed", externalJobId);

        var credentials = credentialsService.getCredentials(getPortal());
        if (credentials.isEmpty()) {
            return true; // Assume active if we can't check
        }

        try (IndeedPage indeedPage = new IndeedPage(playwrightManager)) {
            if (!indeedPage.login(credentials.get().username(), credentials.get().password())) {
                return true; // Assume active if we can't check
            }

            return indeedPage.checkJobActive(externalJobId);

        } catch (Exception e) {
            log.error("Error checking job status on Indeed", e);
            return true; // Assume active on error
        }
    }

    @Override
    public String getJobUrl(String externalJobId) {
        return BASE_URL + "/viewjob?jk=" + externalJobId;
    }

    /**
     * Indeed-specific page object with comprehensive automation.
     */
    private class IndeedPage extends PortalPage {

        // Indeed-specific selectors
        private static final String EMAIL_SELECTOR = "input[name='__email'], input[type='email'], input#ifl-InputFormField-3";
        private static final String PASSWORD_SELECTOR = "input[name='__password'], input[type='password'], input#ifl-InputFormField-7";
        private static final String LOGIN_SUBMIT_SELECTOR = "button[type='submit'], button[data-testid='login-submit']";
        private static final String SECURITY_CHALLENGE_SELECTOR = "[class*='challenge'], [class*='verify'], [data-testid='verification']";

        // Job posting form selectors
        private static final String JOB_TITLE_SELECTOR = "input[name='title'], input[id*='title'], [data-testid='job-title-input']";
        private static final String COMPANY_SELECTOR = "input[name='company'], input[id*='company'], [data-testid='company-input']";
        private static final String LOCATION_SELECTOR = "input[name='location'], input[id*='location'], [data-testid='location-input']";
        private static final String DESCRIPTION_EDITOR_SELECTOR = "[class*='ql-editor'], [contenteditable='true'], textarea[name='description']";

        // Navigation selectors
        private static final String DASHBOARD_SELECTOR = "[class*='dashboard'], [class*='employer-dashboard'], [data-testid='employer-dashboard']";
        private static final String ACCOUNT_MENU_SELECTOR = "[data-testid='header-account-button'], [class*='account-menu'], img[alt*='profile']";
        private static final String POST_JOB_LINK_SELECTOR = "a:has-text('Post a Job'), a:has-text('Post Job'), button:has-text('Post a Job')";

        IndeedPage(PlaywrightManager playwrightManager) {
            super(playwrightManager, "indeed");
        }

        @Override
        public JobPosting.JobPortal getPortal() {
            return JobPosting.JobPortal.INDEED;
        }

        @Override
        public String getBaseUrl() {
            return BASE_URL;
        }

        @Override
        public boolean login(String username, String password) {
            log.info("Logging into Indeed...");
            navigateTo(LOGIN_URL);
            handleCookieConsent();

            // Wait for login form
            playwrightManager.humanDelay(1000, 2000);

            // Indeed has a multi-step login process
            // Step 1: Enter email
            log.debug("Entering Indeed email...");
            fillInput(EMAIL_SELECTOR, username);
            playwrightManager.humanDelay(500, 1000);

            // Click continue/submit for email step
            clickAndWait(LOGIN_SUBMIT_SELECTOR);
            playwrightManager.humanDelay(2000, 3000);

            // Check for CAPTCHA after email
            if (hasCaptcha()) {
                log.warn("CAPTCHA detected after email entry");
                screenshot("captcha_after_email");
                return false;
            }

            // Step 2: Enter password
            log.debug("Entering Indeed password...");
            fillInput(PASSWORD_SELECTOR, password);
            playwrightManager.humanDelay(500, 1000);

            // Submit password
            clickAndWait(LOGIN_SUBMIT_SELECTOR);

            // Wait for potential security challenges or redirects
            playwrightManager.humanDelay(3000, 5000);

            // Check login result
            boolean success = isLoggedIn();
            if (success) {
                log.info("Successfully logged into Indeed");
            } else {
                log.warn("Failed to login to Indeed");
                screenshot("login_failed");
            }
            return success;
        }

        @Override
        public boolean isLoggedIn() {
            try {
                // Check for various logged-in indicators
                boolean hasDashboard = page.locator(DASHBOARD_SELECTOR).count() > 0;
                boolean hasAccountMenu = page.locator(ACCOUNT_MENU_SELECTOR).count() > 0;
                boolean hasPostJobLink = page.locator(POST_JOB_LINK_SELECTOR).count() > 0;
                boolean hasEmployerContent = page.content().toLowerCase().contains("post a job") ||
                                            page.content().toLowerCase().contains("employer dashboard");
                boolean notOnLoginPage = !page.url().contains("/login") && !page.url().contains("/signin");

                return (hasDashboard || hasAccountMenu || hasPostJobLink || hasEmployerContent) && notOnLoginPage;
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
                        page.content().toLowerCase().contains("confirm your identity") ||
                        page.content().toLowerCase().contains("verification code");
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
                        content.contains("wrong password") ||
                        content.contains("didn't recognize") ||
                        content.contains("couldn't find an account") ||
                        content.contains("please check your email") ||
                        page.locator("[class*='error'], [data-testid='error']").count() > 0;
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
            log.info("Navigating to Indeed job posting page...");
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
                    "[data-testid='close-modal']",
                    "button.icl-CloseButton"
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
                log.info("Filling Indeed job form for: {} (ref: {})", job.getTitle(), job.getJobReference());

                // Step 1: Job basics (title, company, location)
                if (!fillJobBasics(job)) {
                    return PostingResult.failure("Failed to fill job basics");
                }

                // Step 2: Job type and schedule
                if (!fillJobTypeAndSchedule(job)) {
                    return PostingResult.failure("Failed to fill job type and schedule");
                }

                // Step 3: Pay and benefits
                if (!fillPayAndBenefits(job)) {
                    return PostingResult.failure("Failed to fill pay and benefits");
                }

                // Step 4: Job description
                if (!fillJobDescription(job)) {
                    return PostingResult.failure("Failed to fill job description");
                }

                // Step 5: Application settings
                if (!fillApplicationSettings(job)) {
                    return PostingResult.failure("Failed to fill application settings");
                }

                // Step 6: Sponsored options (skip for free posting)
                handleSponsoredOptions();

                // Step 7: Review and submit
                return submitAndVerify(job);

            } catch (Exception e) {
                log.error("Error filling Indeed job form for: {}", job.getJobReference(), e);
                screenshot("form_error");
                return PostingResult.failure("Form error: " + e.getMessage());
            }
        }

        /**
         * Fill job basics: title, company, location.
         */
        private boolean fillJobBasics(JobPosting job) {
            log.debug("Filling job basics...");

            try {
                // Job Title
                fillInput(JOB_TITLE_SELECTOR, job.getTitle());
                playwrightManager.humanDelay(500, 1000);

                // Company Name (SureWork Recruitment Services)
                String companyName = "SureWork Recruitment Services";
                fillInput(COMPANY_SELECTOR, companyName);
                playwrightManager.humanDelay(800, 1500);

                // Select from company autocomplete if appears
                if (page.locator("[class*='autocomplete'] li, [role='listbox'] [role='option']").count() > 0) {
                    page.locator("[class*='autocomplete'] li, [role='listbox'] [role='option']").first().click();
                    playwrightManager.humanDelay(500, 1000);
                }

                // Location
                String location = job.getCity() != null ? job.getCity() : "Johannesburg";
                if (job.getProvince() != null) {
                    location += ", " + mapProvince(job.getProvince());
                }
                location += ", South Africa";

                fillLocationWithAutocomplete(location);

                // Remote option
                if (job.isRemote()) {
                    String[] remoteSelectors = {
                        "input[value='remote']", "input[id*='remote']",
                        "label:has-text('Remote') input",
                        "[data-testid='remote-checkbox']",
                        "button:has-text('Remote')"
                    };
                    for (String selector : remoteSelectors) {
                        if (page.locator(selector).count() > 0) {
                            page.locator(selector).click();
                            break;
                        }
                    }
                    playwrightManager.humanDelay(300, 600);
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
                "[data-testid='location-suggestion']",
                "[class*='suggestion'] li"
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
         * Fill job type and schedule.
         */
        private boolean fillJobTypeAndSchedule(JobPosting job) {
            log.debug("Filling job type and schedule...");

            try {
                playwrightManager.humanDelay(1000, 2000);

                // Employment Type
                String empType = mapEmploymentType(job.getEmploymentType());
                selectJobTypeOption(empType);
                playwrightManager.humanDelay(500, 1000);

                // Schedule (if applicable)
                selectScheduleOptions(job);

                // Contract duration (if contract)
                if (job.getEmploymentType() == JobPosting.EmploymentType.CONTRACT &&
                    job.getContractDuration() != null && !job.getContractDuration().isEmpty()) {
                    if (page.locator("input[name='contractDuration'], input[id*='duration']").count() > 0) {
                        fillInput("input[name='contractDuration']", job.getContractDuration());
                    }
                }

                // Click Continue/Next
                if (!clickNextButton()) {
                    log.warn("Failed to advance from job type step");
                    screenshot("job_type_step_failed");
                    return false;
                }

                return true;
            } catch (Exception e) {
                log.error("Error filling job type: {}", e.getMessage());
                return false;
            }
        }

        /**
         * Select job type option using Indeed's button/checkbox pattern.
         */
        private void selectJobTypeOption(String jobType) {
            try {
                // Indeed often uses button groups or checkboxes for job type
                String[] selectors = {
                    "input[value='" + jobType + "']",
                    "label:has-text('" + jobType + "') input",
                    "button:has-text('" + jobType + "')",
                    "[data-testid='job-type-" + jobType.toLowerCase().replace(" ", "-") + "']"
                };

                for (String selector : selectors) {
                    if (page.locator(selector).count() > 0) {
                        page.locator(selector).click();
                        return;
                    }
                }

                // Try dropdown pattern
                String[] dropdownSelectors = {
                    "select[name='jobType'], select[id*='jobType']"
                };
                for (String selector : dropdownSelectors) {
                    if (page.locator(selector).count() > 0) {
                        page.selectOption(selector, jobType);
                        return;
                    }
                }
            } catch (Exception e) {
                log.debug("Could not select job type: {}", e.getMessage());
            }
        }

        /**
         * Select schedule options.
         */
        private void selectScheduleOptions(JobPosting job) {
            try {
                // Determine schedule based on employment type
                String schedule = switch (job.getEmploymentType()) {
                    case FULL_TIME -> "Day shift";
                    case PART_TIME -> "Part-time";
                    default -> "Flexible";
                };

                String[] scheduleSelectors = {
                    "input[value='" + schedule + "']",
                    "label:has-text('" + schedule + "') input",
                    "[data-testid='schedule-" + schedule.toLowerCase().replace(" ", "-") + "']"
                };

                for (String selector : scheduleSelectors) {
                    if (page.locator(selector).count() > 0) {
                        page.locator(selector).click();
                        break;
                    }
                }
            } catch (Exception e) {
                log.debug("Could not select schedule: {}", e.getMessage());
            }
        }

        /**
         * Fill pay and benefits information.
         */
        private boolean fillPayAndBenefits(JobPosting job) {
            log.debug("Filling pay and benefits...");

            try {
                playwrightManager.humanDelay(1000, 2000);

                if (job.isShowSalary() && (job.getSalaryMin() != null || job.getSalaryMax() != null)) {
                    // Select "Show pay on job"
                    String[] showPaySelectors = {
                        "input[name='showPay'][value='true']",
                        "label:has-text('Show pay') input",
                        "[data-testid='show-pay-yes']"
                    };
                    for (String selector : showPaySelectors) {
                        if (page.locator(selector).count() > 0) {
                            page.locator(selector).click();
                            break;
                        }
                    }
                    playwrightManager.humanDelay(500, 1000);

                    // Salary Range
                    if (job.getSalaryMin() != null) {
                        String[] minSelectors = {
                            "input[name='salary-min'], input[id*='pay-min']",
                            "input[name='minimumPay']", "[data-testid='min-pay']"
                        };
                        for (String selector : minSelectors) {
                            if (page.locator(selector).count() > 0) {
                                fillInput(selector, job.getSalaryMin().toString());
                                break;
                            }
                        }
                    }

                    if (job.getSalaryMax() != null) {
                        String[] maxSelectors = {
                            "input[name='salary-max'], input[id*='pay-max']",
                            "input[name='maximumPay']", "[data-testid='max-pay']"
                        };
                        for (String selector : maxSelectors) {
                            if (page.locator(selector).count() > 0) {
                                fillInput(selector, job.getSalaryMax().toString());
                                break;
                            }
                        }
                    }

                    // Pay rate (per month is standard in SA)
                    String[] rateSelectors = {
                        "select[name='payRate']", "select[id*='pay-rate']",
                        "[data-testid='pay-rate-select']"
                    };
                    for (String selector : rateSelectors) {
                        if (page.locator(selector).count() > 0) {
                            page.selectOption(selector, "per month");
                            break;
                        }
                    }
                }

                // Benefits (checkboxes typically)
                if (job.getBenefits() != null && !job.getBenefits().isEmpty()) {
                    selectBenefits(job.getBenefits());
                }

                // Click Continue/Next
                if (!clickNextButton()) {
                    log.debug("No next button found, may be on same page form");
                }

                return true;
            } catch (Exception e) {
                log.error("Error filling pay and benefits: {}", e.getMessage());
                return false;
            }
        }

        /**
         * Select benefits from available options.
         */
        private void selectBenefits(String benefits) {
            String benefitsLower = benefits.toLowerCase();
            String[][] benefitMappings = {
                {"medical", "Health insurance"},
                {"dental", "Dental insurance"},
                {"pension", "401(k)"},  // Indeed uses US terms, may need localization
                {"leave", "Paid time off"},
                {"flexible", "Flexible schedule"},
                {"remote", "Work from home"}
            };

            for (String[] mapping : benefitMappings) {
                if (benefitsLower.contains(mapping[0])) {
                    String[] selectors = {
                        "input[value='" + mapping[1] + "']",
                        "label:has-text('" + mapping[1] + "') input"
                    };
                    for (String selector : selectors) {
                        if (page.locator(selector).count() > 0) {
                            try {
                                page.locator(selector).click();
                            } catch (Exception e) {
                                // Continue with other benefits
                            }
                            break;
                        }
                    }
                }
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

                // Handle different editor types
                boolean filled = false;

                // Try Quill editor
                if (page.locator("[class*='ql-editor']").count() > 0) {
                    page.locator("[class*='ql-editor']").first().click();
                    playwrightManager.humanDelay(300, 500);
                    page.locator("[class*='ql-editor']").first().fill(description);
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
                else if (page.locator("textarea[name='description'], textarea[id*='description']").count() > 0) {
                    fillInput("textarea[name='description']", description);
                    filled = true;
                }

                if (!filled) {
                    log.warn("Could not find job description field");
                    screenshot("no_description_field");
                }

                playwrightManager.humanDelay(500, 1000);

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
         * Fill application settings.
         */
        private boolean fillApplicationSettings(JobPosting job) {
            log.debug("Filling application settings...");

            try {
                playwrightManager.humanDelay(1000, 2000);

                // Application URL (redirect to SureWork)
                String applicationUrl = "https://careers.surework.co.za/apply/" + job.getJobReference();

                // Select external URL option (instead of Indeed Apply)
                String[] externalOptionSelectors = {
                    "input[value='external_url']",
                    "input[value='url']",
                    "label:has-text('External') input",
                    "label:has-text('Direct applicants') input",
                    "[data-testid='external-url-option']"
                };

                boolean selectedExternal = false;
                for (String selector : externalOptionSelectors) {
                    if (page.locator(selector).count() > 0) {
                        page.locator(selector).first().click();
                        selectedExternal = true;
                        playwrightManager.humanDelay(500, 1000);
                        break;
                    }
                }

                // Fill external URL
                String[] urlInputSelectors = {
                    "input[name='apply-url'], input[id*='external-url']",
                    "input[name='externalUrl']",
                    "input[type='url']",
                    "[data-testid='external-url-input']"
                };

                for (String selector : urlInputSelectors) {
                    if (page.locator(selector).count() > 0) {
                        fillInput(selector, applicationUrl);
                        break;
                    }
                }

                // Application deadline (optional)
                if (job.getClosingDate() != null) {
                    String[] deadlineSelectors = {
                        "input[name='deadline'], input[id*='deadline']",
                        "[data-testid='deadline-input']"
                    };
                    for (String selector : deadlineSelectors) {
                        if (page.locator(selector).count() > 0) {
                            fillInput(selector, job.getClosingDate().toString());
                            break;
                        }
                    }
                }

                // Click Continue/Next
                if (!clickNextButton()) {
                    log.debug("No next button found, may be at sponsored options");
                }

                return true;
            } catch (Exception e) {
                log.error("Error filling application settings: {}", e.getMessage());
                return false;
            }
        }

        /**
         * Handle sponsored job options - skip for free posting.
         */
        private void handleSponsoredOptions() {
            log.debug("Handling sponsored options (selecting free posting)...");

            try {
                playwrightManager.humanDelay(1000, 2000);

                // Look for "Skip sponsored" or "Free posting" options
                String[] skipSponsored = {
                    "button:has-text('Skip')",
                    "button:has-text('Post for free')",
                    "button:has-text('Continue without sponsoring')",
                    "a:has-text('Skip')",
                    "[data-testid='skip-sponsored']"
                };

                for (String selector : skipSponsored) {
                    if (page.locator(selector).count() > 0) {
                        page.locator(selector).click();
                        playwrightManager.humanDelay(1000, 2000);
                        return;
                    }
                }

                // If no skip option, try to set budget to 0 or minimum
                if (page.locator("input[name='budget'], input[id*='budget']").count() > 0) {
                    fillInput("input[name='budget']", "0");
                }

                // Click Continue/Next
                clickNextButton();

            } catch (Exception e) {
                log.debug("Error handling sponsored options: {}", e.getMessage());
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
                    "button:has-text('Confirm')",
                    "button:has-text('Submit')",
                    "button[type='submit']:has-text('Post')",
                    "[data-testid='submit-job']",
                    "[data-testid='post-job-button']"
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
                if (hasCaptcha() || hasSecurityChallenge()) {
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
                boolean hasSuccessMessage = content.contains("job is live") ||
                        content.contains("job posted") ||
                        content.contains("successfully posted") ||
                        content.contains("your job is now live") ||
                        content.contains("congratulations");

                boolean hasSuccessUrl = url.contains("/jobs") ||
                        url.contains("/posted") ||
                        url.contains("/success") ||
                        url.contains("/confirmation");

                boolean hasSuccessElement = page.locator("[class*='success'], [data-testid='success']").count() > 0;

                if (hasSuccessMessage || hasSuccessUrl || hasSuccessElement) {
                    String externalJobId = extractJobId();
                    String externalUrl = getJobUrl(externalJobId);

                    // Indeed free jobs typically last 30 days
                    LocalDateTime expiresAt = LocalDateTime.now().plusDays(30);

                    log.info("Successfully posted job {} to Indeed: {}", job.getJobReference(), externalJobId);
                    screenshot("success");
                    return PostingResult.success(externalJobId, externalUrl, expiresAt);
                }

                // Check for error messages
                if (content.contains("error") || content.contains("couldn't post") ||
                    content.contains("problem") || content.contains("failed")) {
                    screenshot("posting_error");
                    return PostingResult.failure("Indeed returned an error during posting");
                }

                screenshot("submit_result_unclear");
                return PostingResult.failure("Could not confirm job was posted to Indeed");

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
                "[data-testid='continue-button']",
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
            return BASE_URL + "/viewjob?jk=" + externalJobId;
        }

        @Override
        public boolean removeJob(String externalJobId) {
            log.info("Removing job {} from Indeed", externalJobId);

            try {
                // Navigate to job management
                navigateTo(MANAGE_JOBS_URL);
                playwrightManager.humanDelay(2000, 3000);

                // Find the job in the list
                String[] jobRowSelectors = {
                    "[data-job-id='" + externalJobId + "']",
                    "[data-testid='job-" + externalJobId + "']",
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
                    log.warn("Job {} not found in Indeed job list", externalJobId);
                    return false;
                }

                playwrightManager.humanDelay(1000, 2000);

                // Click pause/close/delete button
                String[] closeSelectors = {
                    "button:has-text('Pause')",
                    "button:has-text('Close job')",
                    "button:has-text('Delete')",
                    "button:has-text('Remove')",
                    "[aria-label='Close job']",
                    "[data-testid='pause-job']",
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
                            "button:has-text('OK')",
                            "[data-testid='confirm-button']"
                        };
                        for (String confirmSelector : confirmSelectors) {
                            if (page.locator(confirmSelector).count() > 0) {
                                page.locator(confirmSelector).first().click();
                                break;
                            }
                        }

                        log.info("Successfully removed job {} from Indeed", externalJobId);
                        return true;
                    }
                }

                return false;
            } catch (Exception e) {
                log.error("Error removing job from Indeed: {}", e.getMessage());
                return false;
            }
        }

        /**
         * Check if a job is still active on Indeed.
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
                        content.contains("this job is no longer accepting") ||
                        content.contains("job not found") ||
                        content.contains("page not found") ||
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
                "jk=([a-zA-Z0-9]+)",
                "/job/([a-zA-Z0-9]+)",
                "jobId=([a-zA-Z0-9]+)",
                "/viewjob\\?jk=([a-zA-Z0-9]+)"
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
                java.util.regex.Pattern p = java.util.regex.Pattern.compile("\"jobKey\"\\s*:\\s*\"([a-zA-Z0-9]+)\"");
                java.util.regex.Matcher m = p.matcher(content);
                if (m.find()) {
                    return m.group(1);
                }
            } catch (Exception e) {
                log.debug("Could not extract job ID from content");
            }

            // Generate placeholder
            return "IND-" + System.currentTimeMillis();
        }

        // === Field Mappings ===

        private String mapEmploymentType(JobPosting.EmploymentType type) {
            return switch (type) {
                case FULL_TIME -> "Full-time";
                case PART_TIME -> "Part-time";
                case CONTRACT -> "Contract";
                case TEMPORARY -> "Temporary";
                case INTERNSHIP -> "Internship";
                case FREELANCE -> "Contract"; // Indeed doesn't have freelance, use contract
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
    }
}
