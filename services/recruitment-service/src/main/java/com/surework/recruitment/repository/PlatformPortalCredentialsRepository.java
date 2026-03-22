package com.surework.recruitment.repository;

import com.surework.recruitment.domain.JobPosting;
import com.surework.recruitment.domain.PlatformPortalCredentials;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for platform-level portal credentials.
 * These credentials are used by SureWork to post jobs on behalf of all tenants.
 */
@Repository
public interface PlatformPortalCredentialsRepository extends JpaRepository<PlatformPortalCredentials, UUID> {

    /**
     * Find credentials by portal type.
     */
    Optional<PlatformPortalCredentials> findByPortal(JobPosting.JobPortal portal);

    /**
     * Find all active portal credentials.
     */
    List<PlatformPortalCredentials> findByActiveTrue();

    /**
     * Find all credentials that can currently accept posts.
     */
    @Query("""
            SELECT c FROM PlatformPortalCredentials c
            WHERE c.active = true
            AND c.connectionStatus IN ('CONNECTED', 'SESSION_EXPIRED')
            AND c.postsToday < c.dailyRateLimit
            """)
    List<PlatformPortalCredentials> findAvailableForPosting();

    /**
     * Find credentials by connection status.
     */
    List<PlatformPortalCredentials> findByConnectionStatus(
            PlatformPortalCredentials.ConnectionStatus status);

    /**
     * Find credentials needing attention (errors or issues).
     */
    @Query("""
            SELECT c FROM PlatformPortalCredentials c
            WHERE c.active = true
            AND c.connectionStatus IN ('SESSION_EXPIRED', 'INVALID_CREDENTIALS',
                                        'RATE_LIMITED', 'CAPTCHA_REQUIRED', 'ERROR')
            """)
    List<PlatformPortalCredentials> findNeedingAttention();

    /**
     * Check if a portal is configured and active.
     */
    @Query("""
            SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END
            FROM PlatformPortalCredentials c
            WHERE c.portal = :portal
            AND c.active = true
            AND c.usernameEncrypted IS NOT NULL
            AND c.passwordEncrypted IS NOT NULL
            """)
    boolean isPortalConfigured(@Param("portal") JobPosting.JobPortal portal);

    /**
     * Reset all rate limit counters (called by scheduled job at midnight).
     */
    @Modifying
    @Query("""
            UPDATE PlatformPortalCredentials c
            SET c.postsToday = 0,
                c.rateLimitResetAt = :resetAt
            WHERE c.rateLimitResetAt IS NULL OR c.rateLimitResetAt < :now
            """)
    int resetAllRateLimits(@Param("now") LocalDateTime now, @Param("resetAt") LocalDateTime resetAt);

    /**
     * Increment post count for a portal.
     */
    @Modifying
    @Query("""
            UPDATE PlatformPortalCredentials c
            SET c.postsToday = c.postsToday + 1
            WHERE c.portal = :portal
            """)
    int incrementPostCount(@Param("portal") JobPosting.JobPortal portal);

    /**
     * Update connection status for a portal.
     */
    @Modifying
    @Query("""
            UPDATE PlatformPortalCredentials c
            SET c.connectionStatus = :status,
                c.lastError = :error,
                c.lastVerifiedAt = CASE WHEN :status = 'CONNECTED' THEN :now ELSE c.lastVerifiedAt END
            WHERE c.portal = :portal
            """)
    int updateConnectionStatus(
            @Param("portal") JobPosting.JobPortal portal,
            @Param("status") PlatformPortalCredentials.ConnectionStatus status,
            @Param("error") String error,
            @Param("now") LocalDateTime now);

    /**
     * Get portal statistics summary.
     */
    @Query("""
            SELECT new map(
                c.portal as portal,
                c.connectionStatus as status,
                c.postsToday as postsToday,
                c.dailyRateLimit as dailyLimit,
                c.lastVerifiedAt as lastVerified
            )
            FROM PlatformPortalCredentials c
            WHERE c.active = true
            """)
    List<java.util.Map<String, Object>> getPortalStats();
}
