package com.surework.recruitment.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Platform-level credentials for external job portals.
 * These are SureWork's own accounts on Pnet, LinkedIn, Indeed, Careers24.
 * All tenant job postings are made through these centralized accounts.
 *
 * <p>Note: Credentials are stored encrypted using AES-GCM encryption.
 * The encryption key must be configured via PORTAL_CREDENTIALS_KEY environment variable.
 */
@Entity
@Table(name = "platform_portal_credentials", indexes = {
        @Index(name = "idx_platform_creds_portal", columnList = "portal"),
        @Index(name = "idx_platform_creds_active", columnList = "is_active")
})
@Getter
@Setter
@NoArgsConstructor
public class PlatformPortalCredentials extends BaseEntity {

    /**
     * The job portal this credential is for.
     * Only one credential record per portal.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "portal", nullable = false, unique = true, length = 50)
    private JobPosting.JobPortal portal;

    /**
     * Encrypted username/email for the portal.
     */
    @Column(name = "username_encrypted", columnDefinition = "TEXT")
    private String usernameEncrypted;

    /**
     * Encrypted password for the portal.
     */
    @Column(name = "password_encrypted", columnDefinition = "TEXT")
    private String passwordEncrypted;

    /**
     * Encrypted additional configuration (JSON).
     * May include company page ID, session cookies, 2FA backup codes, etc.
     */
    @Column(name = "additional_config_encrypted", columnDefinition = "TEXT")
    private String additionalConfigEncrypted;

    /**
     * Whether this portal is active and can be used for posting.
     */
    @Column(name = "is_active", nullable = false)
    private boolean active = false;

    /**
     * Maximum number of jobs to post per day to avoid rate limiting.
     */
    @Column(name = "daily_rate_limit")
    private int dailyRateLimit = 50;

    /**
     * Number of jobs posted today (resets at midnight).
     */
    @Column(name = "posts_today")
    private int postsToday = 0;

    /**
     * When the daily rate limit counter resets.
     */
    @Column(name = "rate_limit_reset_at")
    private LocalDateTime rateLimitResetAt;

    /**
     * Last time the credentials were verified to work.
     */
    @Column(name = "last_verified_at")
    private LocalDateTime lastVerifiedAt;

    /**
     * Last error message if verification failed.
     */
    @Column(name = "last_error", columnDefinition = "TEXT")
    private String lastError;

    /**
     * Connection status for quick health checks.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "connection_status", length = 50)
    private ConnectionStatus connectionStatus = ConnectionStatus.NOT_CONFIGURED;

    /**
     * Additional metadata as JSON (company name on portal, profile URL, etc.).
     */
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    /**
     * Connection status enum.
     */
    public enum ConnectionStatus {
        NOT_CONFIGURED,     // Credentials not yet set
        CONNECTED,          // Last verification successful
        SESSION_EXPIRED,    // Need to re-authenticate
        INVALID_CREDENTIALS,// Username/password incorrect
        RATE_LIMITED,       // Temporarily blocked by portal
        CAPTCHA_REQUIRED,   // Portal requires CAPTCHA
        ERROR               // Other error
    }

    /**
     * Create a new credential record for a portal.
     */
    public static PlatformPortalCredentials create(JobPosting.JobPortal portal) {
        PlatformPortalCredentials creds = new PlatformPortalCredentials();
        creds.setPortal(portal);
        creds.setActive(false);
        creds.setConnectionStatus(ConnectionStatus.NOT_CONFIGURED);
        creds.setDailyRateLimit(getDefaultRateLimit(portal));
        return creds;
    }

    /**
     * Get default rate limit for a portal.
     */
    private static int getDefaultRateLimit(JobPosting.JobPortal portal) {
        return switch (portal) {
            case LINKEDIN -> 25;  // LinkedIn is more restrictive
            case PNET -> 50;
            case INDEED -> 40;
            case CAREERS24 -> 50;
        };
    }

    /**
     * Check if credentials are configured.
     */
    public boolean isConfigured() {
        return usernameEncrypted != null && !usernameEncrypted.isBlank()
                && passwordEncrypted != null && !passwordEncrypted.isBlank();
    }

    /**
     * Check if can post (active and within rate limit).
     */
    public boolean canPost() {
        if (!active || !isConfigured()) {
            return false;
        }
        if (connectionStatus == ConnectionStatus.INVALID_CREDENTIALS ||
            connectionStatus == ConnectionStatus.RATE_LIMITED ||
            connectionStatus == ConnectionStatus.CAPTCHA_REQUIRED) {
            return false;
        }
        // Check rate limit
        if (rateLimitResetAt != null && LocalDateTime.now().isAfter(rateLimitResetAt)) {
            // Reset counter
            postsToday = 0;
            rateLimitResetAt = LocalDateTime.now().plusDays(1).withHour(0).withMinute(0).withSecond(0);
        }
        return postsToday < dailyRateLimit;
    }

    /**
     * Increment post counter.
     */
    public void incrementPostCount() {
        postsToday++;
    }

    /**
     * Mark as successfully verified.
     */
    public void markAsVerified() {
        this.connectionStatus = ConnectionStatus.CONNECTED;
        this.lastVerifiedAt = LocalDateTime.now();
        this.lastError = null;
    }

    /**
     * Mark as verification failed.
     */
    public void markVerificationFailed(String error, ConnectionStatus status) {
        this.connectionStatus = status;
        this.lastError = error;
    }

    /**
     * Reset rate limit counter (called at midnight or manually).
     */
    public void resetRateLimit() {
        this.postsToday = 0;
        this.rateLimitResetAt = LocalDateTime.now().plusDays(1).withHour(0).withMinute(0).withSecond(0);
        if (connectionStatus == ConnectionStatus.RATE_LIMITED) {
            connectionStatus = ConnectionStatus.CONNECTED;
        }
    }

    /**
     * Get remaining posts for today.
     */
    public int getRemainingPosts() {
        if (!active) return 0;
        return Math.max(0, dailyRateLimit - postsToday);
    }
}
