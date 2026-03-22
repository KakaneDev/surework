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
        RecruitmentEvent.CandidateHired,
        RecruitmentEvent.InterviewScheduled,
        RecruitmentEvent.OfferExtended,
        RecruitmentEvent.OfferAccepted,
        RecruitmentEvent.OfferDeclined,
        RecruitmentEvent.ExternalPostingRequested,
        RecruitmentEvent.ExternalPostingCompleted,
        RecruitmentEvent.ExternalPostingFailed,
        RecruitmentEvent.PortalCredentialAlert,
        RecruitmentEvent.ExternalPostingRequiresManual {

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

    /**
     * Event raised when an interview is scheduled.
     */
    record InterviewScheduled(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID interviewId,
            UUID applicationId,
            UUID jobPostingId,
            String candidateName,
            UUID interviewerId,
            String interviewerName,
            Instant scheduledAt,
            String interviewType,
            String locationType
    ) implements RecruitmentEvent {}

    /**
     * Event raised when a job offer is extended to a candidate.
     */
    record OfferExtended(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID applicationId,
            UUID jobPostingId,
            String candidateName,
            UUID hiringManagerId,
            java.math.BigDecimal offerSalary,
            Instant offerExpiryDate,
            Instant proposedStartDate,
            String candidateEmail,
            String offerToken,
            String jobTitle,
            String department,
            String location,
            String employmentType,
            String salaryCurrency,
            String workingHours
    ) implements RecruitmentEvent {}

    /**
     * Event raised when a candidate accepts an offer.
     */
    record OfferAccepted(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID applicationId,
            UUID jobPostingId,
            String candidateName,
            String candidateEmail,
            UUID hiringManagerId,
            String jobTitle,
            String department,
            String location,
            String employmentType,
            java.math.BigDecimal salary,
            String salaryCurrency,
            Instant startDate,
            String workingHours
    ) implements RecruitmentEvent {}

    /**
     * Event raised when a candidate declines an offer.
     */
    record OfferDeclined(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID applicationId,
            UUID jobPostingId,
            String candidateName,
            String candidateEmail,
            UUID hiringManagerId,
            String reason
    ) implements RecruitmentEvent {}

    /**
     * Event raised when a job should be posted to external portals.
     * Triggered when a job with publishToExternal=true is published.
     */
    record ExternalPostingRequested(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID jobPostingId,
            String jobReference,
            String title,
            java.util.List<String> portals  // List of portal names: PNET, LINKEDIN, INDEED, CAREERS24
    ) implements RecruitmentEvent {}

    /**
     * Event raised when a job is successfully posted to an external portal.
     */
    record ExternalPostingCompleted(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID externalPostingId,
            UUID jobPostingId,
            String portal,
            String externalJobId,
            String externalUrl
    ) implements RecruitmentEvent {}

    /**
     * Event raised when posting to an external portal fails.
     */
    record ExternalPostingFailed(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID externalPostingId,
            UUID jobPostingId,
            String portal,
            String errorMessage,
            boolean requiresManualIntervention
    ) implements RecruitmentEvent {}

    /**
     * Event raised when portal credentials require attention.
     * Used to alert admins about credential issues (invalid, expired, CAPTCHA, etc.).
     */
    record PortalCredentialAlert(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            String portal,
            String alertType,
            String message
    ) implements RecruitmentEvent {}

    /**
     * Event raised when an external posting requires manual intervention.
     * Triggers notification to admin team.
     */
    record ExternalPostingRequiresManual(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID externalPostingId,
            UUID jobPostingId,
            String jobReference,
            String jobTitle,
            String portal,
            String reason
    ) implements RecruitmentEvent {}
}
