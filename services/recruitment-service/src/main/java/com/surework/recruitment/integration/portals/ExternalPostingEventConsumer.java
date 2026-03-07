package com.surework.recruitment.integration.portals;

import com.surework.common.messaging.KafkaTopics;
import com.surework.common.messaging.event.RecruitmentEvent;
import com.surework.recruitment.domain.JobPosting;
import com.surework.recruitment.repository.JobPostingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Kafka consumer for external portal posting events.
 * Listens for job published events and queues them for external distribution.
 */
@Component
public class ExternalPostingEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(ExternalPostingEventConsumer.class);

    private final JobPostingRepository jobPostingRepository;
    private final JobPortalDistributionService distributionService;

    public ExternalPostingEventConsumer(
            JobPostingRepository jobPostingRepository,
            JobPortalDistributionService distributionService) {
        this.jobPostingRepository = jobPostingRepository;
        this.distributionService = distributionService;
    }

    /**
     * Handle ExternalPostingRequested events.
     * Queues the job for distribution to external portals.
     */
    @KafkaListener(
            topics = KafkaTopics.RECRUITMENT_EVENTS,
            groupId = "external-posting-consumer",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleRecruitmentEvent(RecruitmentEvent event) {
        switch (event) {
            case RecruitmentEvent.ExternalPostingRequested requested -> {
                log.info("Received ExternalPostingRequested for job: {} with portals: {}",
                        requested.jobReference(), requested.portals());
                handleExternalPostingRequested(requested);
            }
            case RecruitmentEvent.JobPostingPublished published -> {
                log.debug("Received JobPostingPublished for job: {}", published.jobPostingId());
                // Check if this job should be posted externally
                handleJobPublished(published);
            }
            default -> {
                // Ignore other event types
            }
        }
    }

    private void handleExternalPostingRequested(RecruitmentEvent.ExternalPostingRequested event) {
        try {
            jobPostingRepository.findById(event.jobPostingId()).ifPresent(job -> {
                var postings = distributionService.queueForDistribution(job);
                log.info("Queued {} external postings for job {}", postings.size(), event.jobReference());
            });
        } catch (Exception e) {
            log.error("Failed to queue external postings for job {}: {}",
                    event.jobPostingId(), e.getMessage(), e);
        }
    }

    private void handleJobPublished(RecruitmentEvent.JobPostingPublished event) {
        try {
            jobPostingRepository.findById(event.jobPostingId()).ifPresent(job -> {
                if (job.isPublishToExternal() && !job.getExternalPortalSet().isEmpty()) {
                    log.info("Job {} is configured for external posting, queuing...", job.getJobReference());
                    var postings = distributionService.queueForDistribution(job);
                    log.info("Queued {} external postings for job {}", postings.size(), job.getJobReference());
                }
            });
        } catch (Exception e) {
            log.error("Failed to process job published event for job {}: {}",
                    event.jobPostingId(), e.getMessage(), e);
        }
    }
}
