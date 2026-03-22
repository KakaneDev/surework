package com.surework.recruitment.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Tracks job postings distributed to external portals (Pnet, LinkedIn, Indeed, Careers24).
 * All postings are made under SureWork's accounts (recruitment agency model).
 */
@Entity
@Table(name = "external_job_postings", indexes = {
        @Index(name = "idx_external_postings_status", columnList = "status"),
        @Index(name = "idx_external_postings_tenant", columnList = "tenant_id"),
        @Index(name = "idx_external_postings_job", columnList = "job_posting_id"),
        @Index(name = "idx_external_postings_portal", columnList = "portal")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_external_posting_job_portal", columnNames = {"job_posting_id", "portal"})
})
@Getter
@Setter
@NoArgsConstructor
public class ExternalJobPosting extends BaseEntity {

    /**
     * Tenant ID for defense-in-depth isolation.
     */
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    /**
     * Reference to the SureWork job posting.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_posting_id", nullable = false)
    private JobPosting jobPosting;

    /**
     * The external portal where the job is posted.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "portal", nullable = false, length = 50)
    private JobPosting.JobPortal portal;

    /**
     * The job ID assigned by the external portal.
     */
    @Column(name = "external_job_id", length = 255)
    private String externalJobId;

    /**
     * URL to view the job on the external portal.
     */
    @Column(name = "external_url", length = 500)
    private String externalUrl;

    /**
     * Current status of the external posting.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private ExternalPostingStatus status = ExternalPostingStatus.PENDING;

    /**
     * Error message if the posting failed.
     */
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    /**
     * Number of retry attempts.
     */
    @Column(name = "retry_count")
    private int retryCount = 0;

    /**
     * When the job was successfully posted to the portal.
     */
    @Column(name = "posted_at")
    private LocalDateTime postedAt;

    /**
     * When the posting expires on the external portal.
     */
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    /**
     * Last time the posting status was checked.
     */
    @Column(name = "last_checked_at")
    private LocalDateTime lastCheckedAt;

    /**
     * External posting statuses.
     */
    public enum ExternalPostingStatus {
        PENDING,            // Waiting to be posted
        QUEUED,             // In the rate-limit queue
        POSTING,            // Currently being posted (automation in progress)
        POSTED,             // Successfully posted to portal
        FAILED,             // Posting failed (see errorMessage)
        REQUIRES_MANUAL,    // Requires manual intervention (CAPTCHA, etc.)
        EXPIRED,            // Posting has expired on the portal
        REMOVED             // Removed from the portal
    }

    /**
     * Create a new pending external posting.
     */
    public static ExternalJobPosting create(JobPosting jobPosting, JobPosting.JobPortal portal, UUID tenantId) {
        ExternalJobPosting posting = new ExternalJobPosting();
        posting.setJobPosting(jobPosting);
        posting.setPortal(portal);
        posting.setTenantId(tenantId);
        posting.setStatus(ExternalPostingStatus.PENDING);
        return posting;
    }

    /**
     * Mark as queued for rate limiting.
     */
    public void queue() {
        this.status = ExternalPostingStatus.QUEUED;
    }

    /**
     * Mark as currently posting.
     */
    public void startPosting() {
        this.status = ExternalPostingStatus.POSTING;
    }

    /**
     * Mark as successfully posted.
     */
    public void markAsPosted(String externalJobId, String externalUrl, LocalDateTime expiresAt) {
        this.status = ExternalPostingStatus.POSTED;
        this.externalJobId = externalJobId;
        this.externalUrl = externalUrl;
        this.postedAt = LocalDateTime.now();
        this.expiresAt = expiresAt;
        this.errorMessage = null;
    }

    /**
     * Mark as failed.
     */
    public void markAsFailed(String errorMessage) {
        this.status = ExternalPostingStatus.FAILED;
        this.errorMessage = errorMessage;
        this.retryCount++;
    }

    /**
     * Mark as requiring manual intervention.
     */
    public void markAsRequiresManual(String reason) {
        this.status = ExternalPostingStatus.REQUIRES_MANUAL;
        this.errorMessage = reason;
    }

    /**
     * Mark as expired.
     */
    public void markAsExpired() {
        this.status = ExternalPostingStatus.EXPIRED;
    }

    /**
     * Mark as removed from portal.
     */
    public void markAsRemoved() {
        this.status = ExternalPostingStatus.REMOVED;
    }

    /**
     * Reset for retry.
     */
    public void resetForRetry() {
        this.status = ExternalPostingStatus.PENDING;
        this.errorMessage = null;
    }

    /**
     * Check if this posting can be retried.
     */
    public boolean canRetry() {
        return retryCount < 3 &&
               (status == ExternalPostingStatus.FAILED || status == ExternalPostingStatus.PENDING);
    }

    /**
     * Check if this posting is active on the portal.
     */
    public boolean isActive() {
        if (status != ExternalPostingStatus.POSTED) {
            return false;
        }
        if (expiresAt != null && LocalDateTime.now().isAfter(expiresAt)) {
            return false;
        }
        return true;
    }

    /**
     * Update last checked timestamp.
     */
    public void updateLastChecked() {
        this.lastCheckedAt = LocalDateTime.now();
    }
}
