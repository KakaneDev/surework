package com.surework.recruitment.integration.portals.playwright;

import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.Page;
import com.surework.recruitment.domain.JobPosting;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;

/**
 * Base class for portal-specific page objects.
 * Provides common functionality for job posting automation.
 */
public abstract class PortalPage implements AutoCloseable {

    protected final Logger log = LoggerFactory.getLogger(getClass());
    protected final PlaywrightManager playwrightManager;
    protected final BrowserContext context;
    protected final Page page;

    protected PortalPage(PlaywrightManager playwrightManager, String portalName) {
        this.playwrightManager = playwrightManager;
        this.context = playwrightManager.createContext(portalName);
        this.page = playwrightManager.createPage(context);
    }

    /**
     * Get the portal this page object handles.
     */
    public abstract JobPosting.JobPortal getPortal();

    /**
     * Get the base URL for the portal.
     */
    public abstract String getBaseUrl();

    /**
     * Login to the portal.
     *
     * @param username The username/email
     * @param password The password
     * @return true if login was successful
     */
    public abstract boolean login(String username, String password);

    /**
     * Check if currently logged in.
     */
    public abstract boolean isLoggedIn();

    /**
     * Navigate to the job posting page.
     */
    public abstract void navigateToPostJob();

    /**
     * Fill in job details and submit.
     *
     * @param job The job posting to submit
     * @return Result of the posting attempt
     */
    public abstract PostingResult submitJob(JobPosting job);

    /**
     * Get the URL of a posted job.
     *
     * @param externalJobId The job ID on the portal
     * @return The URL to view the job
     */
    public abstract String getJobUrl(String externalJobId);

    /**
     * Remove a job from the portal.
     *
     * @param externalJobId The job ID to remove
     * @return true if removal was successful
     */
    public abstract boolean removeJob(String externalJobId);

    /**
     * Check if a CAPTCHA is blocking progress.
     */
    public boolean hasCaptcha() {
        return playwrightManager.hasCaptcha(page);
    }

    /**
     * Navigate to a URL and wait for load.
     */
    protected void navigateTo(String url) {
        log.info("Navigating to: {}", url);
        page.navigate(url);
        playwrightManager.waitForPageLoad(page);
    }

    /**
     * Fill an input field with human-like typing.
     */
    protected void fillInput(String selector, String value) {
        if (value == null || value.isEmpty()) return;
        page.locator(selector).clear();
        playwrightManager.humanType(page, selector, value);
    }

    /**
     * Select an option from a dropdown.
     */
    protected void selectOption(String selector, String value) {
        if (value == null || value.isEmpty()) return;
        playwrightManager.humanClick(page, selector);
        playwrightManager.humanDelay(200, 400);
        page.selectOption(selector, value);
    }

    /**
     * Check a checkbox if not already checked.
     */
    protected void checkBox(String selector, boolean shouldBeChecked) {
        boolean isChecked = page.locator(selector).isChecked();
        if (isChecked != shouldBeChecked) {
            playwrightManager.humanClick(page, selector);
        }
    }

    /**
     * Click a button and wait for navigation.
     */
    protected void clickAndWait(String selector) {
        playwrightManager.humanClick(page, selector);
        playwrightManager.waitForPageLoad(page);
    }

    /**
     * Take a screenshot for debugging.
     */
    protected void screenshot(String name) {
        playwrightManager.takeScreenshot(page, getPortal().name() + "_" + name);
    }

    /**
     * Handle common cookie consent dialogs.
     */
    protected void handleCookieConsent() {
        try {
            // Common cookie consent button selectors
            String[] consentSelectors = {
                    "[data-testid='cookie-accept']",
                    "[class*='cookie'] button[class*='accept']",
                    "button[id*='accept-cookies']",
                    "button:has-text('Accept All')",
                    "button:has-text('Accept Cookies')",
                    "button:has-text('I Accept')",
                    "button:has-text('Got it')"
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
            log.debug("No cookie consent dialog found or error handling it: {}", e.getMessage());
        }
    }

    /**
     * Build the job description for external portals.
     * Includes company mention preference handling.
     */
    protected String buildJobDescription(JobPosting job, String tenantName) {
        StringBuilder sb = new StringBuilder();

        // Company intro based on mention preference
        switch (job.getCompanyMentionPreference()) {
            case ANONYMOUS -> {
                String industry = job.getIndustry() != null
                        ? job.getIndustry().name().replace("_", " ").toLowerCase()
                        : "leading";
                sb.append("A ").append(industry).append(" company is looking to hire a ")
                        .append(job.getTitle()).append(".\n\n");
            }
            case NAMED_BY_SUREWORK -> {
                sb.append("SureWork Recruitment is hiring on behalf of ")
                        .append(tenantName != null ? tenantName : "our client")
                        .append(" for the position of ").append(job.getTitle()).append(".\n\n");
            }
            case DIRECT_MENTION -> {
                // Just use the regular description which should include company name
            }
        }

        // Main description
        if (job.getDescription() != null && !job.getDescription().isEmpty()) {
            sb.append(job.getDescription()).append("\n\n");
        }

        // Requirements
        if (job.getRequirements() != null && !job.getRequirements().isEmpty()) {
            sb.append("Requirements:\n").append(job.getRequirements()).append("\n\n");
        }

        // Responsibilities
        if (job.getResponsibilities() != null && !job.getResponsibilities().isEmpty()) {
            sb.append("Responsibilities:\n").append(job.getResponsibilities()).append("\n\n");
        }

        // Apply instructions
        sb.append("\nTo apply, please visit: careers.surework.co.za/apply/")
                .append(job.getJobReference());

        return sb.toString();
    }

    @Override
    public void close() {
        try {
            if (page != null) page.close();
            if (context != null) context.close();
        } catch (Exception e) {
            log.warn("Error closing browser context", e);
        }
    }

    /**
     * Result of a job posting attempt.
     */
    public record PostingResult(
            boolean success,
            String externalJobId,
            String externalUrl,
            LocalDateTime expiresAt,
            String errorMessage,
            boolean requiresManualIntervention
    ) {
        public static PostingResult success(String externalJobId, String externalUrl, LocalDateTime expiresAt) {
            return new PostingResult(true, externalJobId, externalUrl, expiresAt, null, false);
        }

        public static PostingResult failure(String errorMessage) {
            return new PostingResult(false, null, null, null, errorMessage, false);
        }

        public static PostingResult requiresManual(String reason) {
            return new PostingResult(false, null, null, null, reason, true);
        }
    }
}
