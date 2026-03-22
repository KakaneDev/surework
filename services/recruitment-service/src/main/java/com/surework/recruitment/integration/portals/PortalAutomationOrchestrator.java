package com.surework.recruitment.integration.portals;

import com.surework.common.messaging.DomainEventPublisher;
import com.surework.common.messaging.event.RecruitmentEvent;
import com.surework.common.security.TenantContext;
import com.surework.recruitment.domain.ExternalJobPosting;
import com.surework.recruitment.domain.JobPosting;
import com.surework.recruitment.integration.portals.adapters.PortalAdapter;
import com.surework.recruitment.integration.portals.playwright.PortalPage;
import com.surework.recruitment.repository.ExternalJobPostingRepository;
import com.surework.recruitment.repository.JobPostingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Orchestrates job posting distribution to external portals.
 * Implements the JobPortalDistributionService interface.
 *
 * This service:
 * - Creates ExternalJobPosting records when a job is published
 * - Processes pending postings in batches
 * - Handles retries for failed postings
 * - Marks postings for manual intervention when automation fails
 */
@Service
public class PortalAutomationOrchestrator implements JobPortalDistributionService {

    private static final Logger log = LoggerFactory.getLogger(PortalAutomationOrchestrator.class);
    private static final int MAX_RETRIES = 3;
    private static final int BATCH_SIZE = 5;

    private final ExternalJobPostingRepository externalJobPostingRepository;
    private final JobPostingRepository jobPostingRepository;
    private final DomainEventPublisher eventPublisher;
    private final Map<JobPosting.JobPortal, PortalAdapter> adapters;

    public PortalAutomationOrchestrator(
            ExternalJobPostingRepository externalJobPostingRepository,
            JobPostingRepository jobPostingRepository,
            DomainEventPublisher eventPublisher,
            List<PortalAdapter> portalAdapters) {
        this.externalJobPostingRepository = externalJobPostingRepository;
        this.jobPostingRepository = jobPostingRepository;
        this.eventPublisher = eventPublisher;

        // Build adapter map
        this.adapters = new EnumMap<>(JobPosting.JobPortal.class);
        for (PortalAdapter adapter : portalAdapters) {
            adapters.put(adapter.getPortal(), adapter);
            log.info("Registered portal adapter: {}", adapter.getPortal());
        }
    }

    @Override
    @Transactional
    public List<ExternalJobPosting> queueForDistribution(JobPosting jobPosting) {
        if (!jobPosting.isPublishToExternal()) {
            return List.of();
        }

        Set<JobPosting.JobPortal> portals = jobPosting.getExternalPortalSet();
        if (portals.isEmpty()) {
            log.debug("No external portals selected for job {}", jobPosting.getJobReference());
            return List.of();
        }

        UUID tenantId = TenantContext.requireTenantId();
        List<ExternalJobPosting> created = new ArrayList<>();

        for (JobPosting.JobPortal portal : portals) {
            // Check if already queued
            if (externalJobPostingRepository.existsActivePostingForJobAndPortal(jobPosting.getId(), portal)) {
                log.debug("Job {} already queued for {}", jobPosting.getJobReference(), portal);
                continue;
            }

            // Create external posting record
            ExternalJobPosting posting = ExternalJobPosting.create(jobPosting, portal, tenantId);
            posting = externalJobPostingRepository.save(posting);
            created.add(posting);
            log.info("Queued job {} for posting to {}", jobPosting.getJobReference(), portal);
        }

        return created;
    }

    @Override
    @Transactional
    public int processPendingPostings(JobPosting.JobPortal portal, int batchSize) {
        List<ExternalJobPosting> pending = externalJobPostingRepository.findPendingByPortal(portal);
        if (pending.isEmpty()) {
            return 0;
        }

        PortalAdapter adapter = adapters.get(portal);
        if (adapter == null || !adapter.isConfigured()) {
            log.warn("No configured adapter for portal: {}", portal);
            return 0;
        }

        int processed = 0;
        for (ExternalJobPosting posting : pending.stream().limit(batchSize).toList()) {
            try {
                processPosting(posting, adapter);
                processed++;
            } catch (Exception e) {
                log.error("Error processing posting {} for {}", posting.getId(), portal, e);
                posting.markAsFailed("Unexpected error: " + e.getMessage());
                externalJobPostingRepository.save(posting);
            }
        }

        return processed;
    }

    /**
     * Process a single posting.
     */
    private void processPosting(ExternalJobPosting posting, PortalAdapter adapter) {
        posting.startPosting();
        externalJobPostingRepository.save(posting);

        JobPosting job = posting.getJobPosting();
        String tenantName = null; // Could fetch from tenant service

        PortalPage.PostingResult result = adapter.postJob(job, tenantName);

        if (result.success()) {
            posting.markAsPosted(result.externalJobId(), result.externalUrl(), result.expiresAt());
            log.info("Successfully posted job {} to {}: {}",
                    job.getJobReference(), posting.getPortal(), result.externalUrl());

            // Publish success event
            publishExternalPostingCompleted(posting, job, result);

        } else if (result.requiresManualIntervention()) {
            posting.markAsRequiresManual(result.errorMessage());
            log.warn("Job {} requires manual intervention on {}: {}",
                    job.getJobReference(), posting.getPortal(), result.errorMessage());

            // Publish requires manual event to notify admins
            publishExternalPostingRequiresManual(posting, job, result.errorMessage());

        } else {
            posting.markAsFailed(result.errorMessage());
            if (posting.canRetry()) {
                posting.resetForRetry();
                log.warn("Failed to post job {} to {}, will retry ({}/{}): {}",
                        job.getJobReference(), posting.getPortal(),
                        posting.getRetryCount(), MAX_RETRIES, result.errorMessage());

                // Publish failed event (for tracking)
                publishExternalPostingFailed(posting, job, result.errorMessage(), false);

            } else {
                posting.markAsRequiresManual("Max retries exceeded: " + result.errorMessage());
                log.error("Failed to post job {} to {} after max retries",
                        job.getJobReference(), posting.getPortal());

                // Publish requires manual after max retries
                publishExternalPostingRequiresManual(posting, job, "Max retries exceeded: " + result.errorMessage());
            }
        }

        externalJobPostingRepository.save(posting);
    }

    /**
     * Publish ExternalPostingCompleted event.
     */
    private void publishExternalPostingCompleted(ExternalJobPosting posting, JobPosting job, PortalPage.PostingResult result) {
        try {
            var event = new RecruitmentEvent.ExternalPostingCompleted(
                    UUID.randomUUID(),
                    posting.getTenantId(),
                    Instant.now(),
                    posting.getId(),
                    job.getId(),
                    posting.getPortal().name(),
                    result.externalJobId(),
                    result.externalUrl()
            );
            eventPublisher.publish(event);
            log.debug("Published ExternalPostingCompleted event for posting {}", posting.getId());
        } catch (Exception e) {
            log.error("Failed to publish ExternalPostingCompleted event: {}", e.getMessage(), e);
        }
    }

    /**
     * Publish ExternalPostingFailed event.
     */
    private void publishExternalPostingFailed(ExternalJobPosting posting, JobPosting job, String errorMessage, boolean requiresManual) {
        try {
            var event = new RecruitmentEvent.ExternalPostingFailed(
                    UUID.randomUUID(),
                    posting.getTenantId(),
                    Instant.now(),
                    posting.getId(),
                    job.getId(),
                    posting.getPortal().name(),
                    errorMessage,
                    requiresManual
            );
            eventPublisher.publish(event);
            log.debug("Published ExternalPostingFailed event for posting {}", posting.getId());
        } catch (Exception e) {
            log.error("Failed to publish ExternalPostingFailed event: {}", e.getMessage(), e);
        }
    }

    /**
     * Publish ExternalPostingRequiresManual event to notify admins.
     */
    private void publishExternalPostingRequiresManual(ExternalJobPosting posting, JobPosting job, String reason) {
        try {
            var event = new RecruitmentEvent.ExternalPostingRequiresManual(
                    UUID.randomUUID(),
                    posting.getTenantId(),
                    Instant.now(),
                    posting.getId(),
                    job.getId(),
                    job.getJobReference(),
                    job.getTitle(),
                    posting.getPortal().name(),
                    reason
            );
            eventPublisher.publish(event);
            log.debug("Published ExternalPostingRequiresManual event for posting {}", posting.getId());
        } catch (Exception e) {
            log.error("Failed to publish ExternalPostingRequiresManual event: {}", e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public ExternalJobPosting retryPosting(UUID externalPostingId) {
        ExternalJobPosting posting = externalJobPostingRepository.findById(externalPostingId)
                .orElseThrow(() -> new IllegalArgumentException("External posting not found: " + externalPostingId));

        if (!posting.canRetry()) {
            throw new IllegalStateException("Posting cannot be retried");
        }

        posting.resetForRetry();
        ExternalJobPosting saved = externalJobPostingRepository.save(posting);
        // Force-initialize the lazy jobPosting so fromEntity() works after transaction closes (OSIV is off)
        saved.getJobPosting().getTitle();
        return saved;
    }

    @Override
    @Transactional
    public ExternalJobPosting removeFromPortal(UUID externalPostingId) {
        ExternalJobPosting posting = externalJobPostingRepository.findById(externalPostingId)
                .orElseThrow(() -> new IllegalArgumentException("External posting not found: " + externalPostingId));

        if (posting.getExternalJobId() == null) {
            throw new IllegalStateException("Posting has no external job ID");
        }

        PortalAdapter adapter = adapters.get(posting.getPortal());
        if (adapter != null && adapter.isConfigured()) {
            boolean removed = adapter.removeJob(posting.getExternalJobId());
            if (removed) {
                posting.markAsRemoved();
                log.info("Removed job from {}: {}", posting.getPortal(), posting.getExternalJobId());
            } else {
                log.warn("Could not remove job from {}: {}", posting.getPortal(), posting.getExternalJobId());
            }
        }

        ExternalJobPosting saved = externalJobPostingRepository.save(posting);
        // Force-initialize the lazy jobPosting so fromEntity() works after transaction closes (OSIV is off)
        saved.getJobPosting().getTitle();
        return saved;
    }

    @Override
    @Transactional
    public void refreshPostingStatuses() {
        LocalDateTime now = LocalDateTime.now();

        // Mark expired postings
        int expired = externalJobPostingRepository.markExpiredPostings(now);
        if (expired > 0) {
            log.info("Marked {} postings as expired", expired);
        }

        // TODO: Could also check if postings are still active on portals
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExternalJobPosting> getPostingsRequiringManualIntervention() {
        return externalJobPostingRepository.findRequiringManualWithJob();
    }

    @Override
    @Transactional
    public void markAsManuallyResolved(UUID externalPostingId, String externalJobId, String externalUrl) {
        ExternalJobPosting posting = externalJobPostingRepository.findById(externalPostingId)
                .orElseThrow(() -> new IllegalArgumentException("External posting not found: " + externalPostingId));

        LocalDateTime expiresAt = LocalDateTime.now().plusDays(30);
        posting.markAsPosted(externalJobId, externalUrl, expiresAt);
        externalJobPostingRepository.save(posting);

        log.info("Manually resolved posting {} to {}: {}",
                externalPostingId, posting.getPortal(), externalUrl);
    }

    // === Scheduled Jobs ===

    /**
     * Process pending postings for all portals.
     * Runs every 5 minutes.
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    @Async
    public void processAllPendingPostings() {
        log.debug("Processing pending external postings...");

        for (JobPosting.JobPortal portal : JobPosting.JobPortal.values()) {
            try {
                int processed = processPendingPostings(portal, BATCH_SIZE);
                if (processed > 0) {
                    log.info("Processed {} pending postings for {}", processed, portal);
                }
            } catch (Exception e) {
                log.error("Error processing pending postings for {}", portal, e);
            }
        }
    }

    /**
     * Refresh posting statuses (check for expired postings).
     * Runs once per hour.
     */
    @Scheduled(fixedRate = 3600000) // 1 hour
    @Async
    public void refreshStatuses() {
        log.debug("Refreshing external posting statuses...");
        refreshPostingStatuses();
    }

    /**
     * Retry failed postings that are eligible for retry.
     * Runs every 15 minutes.
     */
    @Scheduled(fixedRate = 900000) // 15 minutes
    @Async
    public void retryFailedPostings() {
        List<ExternalJobPosting> retryable = externalJobPostingRepository.findRetryableFailed();
        if (retryable.isEmpty()) {
            return;
        }

        log.info("Found {} postings eligible for retry", retryable.size());

        for (ExternalJobPosting posting : retryable) {
            try {
                posting.resetForRetry();
                externalJobPostingRepository.save(posting);
            } catch (Exception e) {
                log.error("Error resetting posting for retry: {}", posting.getId(), e);
            }
        }
    }
}
