package com.surework.common.messaging.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Sealed interface for Recruitment domain events.
 * Implements Constitution Principle III: Java 21 Features (Sealed Interfaces).
 */
public sealed interface RecruitmentEvent extends DomainEvent permits
        RecruitmentEvent.JobPostingCreated,
        RecruitmentEvent.JobPostingPublished,
        RecruitmentEvent.JobPostingClosed,
        RecruitmentEvent.ApplicationReceived,
        RecruitmentEvent.ApplicationStatusChanged,
        RecruitmentEvent.CandidateHired {

    /**
     * Event raised when a job posting is created.
     */
    record JobPostingCreated(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID jobPostingId,
            String title,
            String department,
            String location
    ) implements RecruitmentEvent {}

    /**
     * Event raised when a job posting is published.
     */
    record JobPostingPublished(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID jobPostingId,
            String title,
            Instant publishedDate
    ) implements RecruitmentEvent {}

    /**
     * Event raised when a job posting is closed.
     */
    record JobPostingClosed(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID jobPostingId,
            String title,
            String closureReason
    ) implements RecruitmentEvent {}

    /**
     * Event raised when a job application is received.
     */
    record ApplicationReceived(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID applicationId,
            UUID jobPostingId,
            String candidateName,
            String candidateEmail
    ) implements RecruitmentEvent {}

    /**
     * Event raised when an application status changes.
     */
    record ApplicationStatusChanged(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID applicationId,
            String previousStatus,
            String newStatus,
            UUID changedBy
    ) implements RecruitmentEvent {}

    /**
     * Event raised when a candidate is hired.
     */
    record CandidateHired(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID applicationId,
            UUID jobPostingId,
            String candidateName,
            Instant startDate
    ) implements RecruitmentEvent {}
}
