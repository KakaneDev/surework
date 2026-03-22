package com.surework.recruitment.integration.portals;

import com.surework.recruitment.domain.ExternalJobPosting;
import com.surework.recruitment.domain.JobPosting;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for distributing job postings to external portals.
 * All postings are made under SureWork's accounts (recruitment agency model).
 */
public interface JobPortalDistributionService {

    /**
     * Queue a job for posting to configured external portals.
     * Creates ExternalJobPosting records for each selected portal.
     *
     * @param jobPosting The job posting to distribute
     * @return List of created external posting records
     */
    List<ExternalJobPosting> queueForDistribution(JobPosting jobPosting);

    /**
     * Process pending postings for a specific portal.
     * Called by scheduled job or event consumer.
     *
     * @param portal The portal to process
     * @param batchSize Maximum number of postings to process
     * @return Number of successfully posted jobs
     */
    int processPendingPostings(JobPosting.JobPortal portal, int batchSize);

    /**
     * Retry a failed external posting.
     *
     * @param externalPostingId The external posting to retry
     * @return Updated external posting record
     */
    ExternalJobPosting retryPosting(UUID externalPostingId);

    /**
     * Remove a job from an external portal.
     *
     * @param externalPostingId The external posting to remove
     * @return Updated external posting record
     */
    ExternalJobPosting removeFromPortal(UUID externalPostingId);

    /**
     * Check the status of active postings and update expired ones.
     * Called by scheduled job.
     */
    void refreshPostingStatuses();

    /**
     * Get postings that require manual intervention.
     *
     * @return List of postings requiring manual action
     */
    List<ExternalJobPosting> getPostingsRequiringManualIntervention();

    /**
     * Manually mark a posting as resolved after admin intervention.
     *
     * @param externalPostingId The posting ID
     * @param externalJobId The ID assigned by the portal
     * @param externalUrl The URL on the portal
     */
    void markAsManuallyResolved(UUID externalPostingId, String externalJobId, String externalUrl);
}
