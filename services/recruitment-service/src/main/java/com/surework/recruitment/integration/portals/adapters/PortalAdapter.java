package com.surework.recruitment.integration.portals.adapters;

import com.surework.recruitment.domain.JobPosting;
import com.surework.recruitment.integration.portals.PortalCredentialsService;
import com.surework.recruitment.integration.portals.playwright.PlaywrightManager;
import com.surework.recruitment.integration.portals.playwright.PortalPage;

/**
 * Base interface for portal adapters.
 * Each adapter handles the specifics of posting to a particular job portal.
 */
public interface PortalAdapter {

    /**
     * Get the portal this adapter handles.
     */
    JobPosting.JobPortal getPortal();

    /**
     * Check if this adapter is configured and ready to use.
     */
    boolean isConfigured();

    /**
     * Post a job to the portal.
     *
     * @param job The job to post
     * @param tenantName The tenant's company name (for description building)
     * @return Result of the posting attempt
     */
    PortalPage.PostingResult postJob(JobPosting job, String tenantName);

    /**
     * Remove a job from the portal.
     *
     * @param externalJobId The job ID on the portal
     * @return true if removal was successful
     */
    boolean removeJob(String externalJobId);

    /**
     * Check if a job is still active on the portal.
     *
     * @param externalJobId The job ID on the portal
     * @return true if the job is still active
     */
    boolean isJobActive(String externalJobId);

    /**
     * Get the URL for viewing a job on the portal.
     *
     * @param externalJobId The job ID on the portal
     * @return The URL to view the job
     */
    String getJobUrl(String externalJobId);
}
