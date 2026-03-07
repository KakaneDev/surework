package com.surework.recruitment.repository;

import com.surework.recruitment.domain.ExternalJobPosting;
import com.surework.recruitment.domain.JobPosting;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for ExternalJobPosting entities.
 */
@Repository
public interface ExternalJobPostingRepository extends JpaRepository<ExternalJobPosting, UUID> {

    /**
     * Find by job posting ID.
     */
    List<ExternalJobPosting> findByJobPostingId(UUID jobPostingId);

    /**
     * Find by job posting ID with the jobPosting eagerly fetched (avoids LazyInitializationException when OSIV is off).
     */
    @Query("SELECT e FROM ExternalJobPosting e JOIN FETCH e.jobPosting WHERE e.jobPosting.id = :jobPostingId AND e.deleted = false")
    List<ExternalJobPosting> findByJobPostingIdWithJob(@Param("jobPostingId") UUID jobPostingId);

    /**
     * Find by job posting and portal.
     */
    Optional<ExternalJobPosting> findByJobPostingIdAndPortal(UUID jobPostingId, JobPosting.JobPortal portal);

    /**
     * Find by status.
     */
    List<ExternalJobPosting> findByStatus(ExternalJobPosting.ExternalPostingStatus status);

    /**
     * Find by status (paginated).
     */
    @Query("SELECT e FROM ExternalJobPosting e WHERE e.status = :status AND e.deleted = false ORDER BY e.createdAt DESC")
    Page<ExternalJobPosting> findByStatus(@Param("status") ExternalJobPosting.ExternalPostingStatus status, Pageable pageable);

    /**
     * Find pending postings for a specific portal.
     */
    @Query("SELECT e FROM ExternalJobPosting e WHERE e.status = 'PENDING' AND e.portal = :portal " +
            "AND e.deleted = false ORDER BY e.createdAt ASC")
    List<ExternalJobPosting> findPendingByPortal(@Param("portal") JobPosting.JobPortal portal);

    /**
     * Find all pending postings.
     */
    @Query("SELECT e FROM ExternalJobPosting e WHERE e.status = 'PENDING' AND e.deleted = false " +
            "ORDER BY e.createdAt ASC")
    List<ExternalJobPosting> findAllPending();

    /**
     * Find postings that require manual intervention.
     */
    @Query("SELECT e FROM ExternalJobPosting e WHERE e.status = 'REQUIRES_MANUAL' AND e.deleted = false " +
            "ORDER BY e.createdAt ASC")
    List<ExternalJobPosting> findRequiringManual();

    /**
     * Find postings that require manual intervention with jobPosting eagerly fetched.
     */
    @Query("SELECT e FROM ExternalJobPosting e JOIN FETCH e.jobPosting WHERE e.status = 'REQUIRES_MANUAL' AND e.deleted = false " +
            "ORDER BY e.createdAt ASC")
    List<ExternalJobPosting> findRequiringManualWithJob();

    /**
     * Find postings that require manual intervention (paginated).
     */
    @Query("SELECT e FROM ExternalJobPosting e WHERE e.status = 'REQUIRES_MANUAL' AND e.deleted = false " +
            "ORDER BY e.createdAt ASC")
    Page<ExternalJobPosting> findRequiringManual(Pageable pageable);

    /**
     * Find failed postings that can be retried.
     */
    @Query("SELECT e FROM ExternalJobPosting e WHERE e.status = 'FAILED' AND e.retryCount < 3 " +
            "AND e.deleted = false ORDER BY e.createdAt ASC")
    List<ExternalJobPosting> findRetryableFailed();

    /**
     * Find expired postings.
     */
    @Query("SELECT e FROM ExternalJobPosting e WHERE e.status = 'POSTED' AND e.expiresAt < :now " +
            "AND e.deleted = false")
    List<ExternalJobPosting> findExpired(@Param("now") LocalDateTime now);

    /**
     * Find active postings for a job.
     */
    @Query("SELECT e FROM ExternalJobPosting e WHERE e.jobPosting.id = :jobPostingId " +
            "AND e.status = 'POSTED' AND e.deleted = false " +
            "AND (e.expiresAt IS NULL OR e.expiresAt > :now)")
    List<ExternalJobPosting> findActiveByJobPostingId(
            @Param("jobPostingId") UUID jobPostingId,
            @Param("now") LocalDateTime now);

    /**
     * Find by tenant.
     */
    @Query("SELECT e FROM ExternalJobPosting e WHERE e.tenantId = :tenantId AND e.deleted = false " +
            "ORDER BY e.createdAt DESC")
    Page<ExternalJobPosting> findByTenantId(@Param("tenantId") UUID tenantId, Pageable pageable);

    /**
     * Count by status.
     */
    @Query("SELECT COUNT(e) FROM ExternalJobPosting e WHERE e.status = :status AND e.deleted = false")
    long countByStatus(@Param("status") ExternalJobPosting.ExternalPostingStatus status);

    /**
     * Count by portal.
     */
    @Query("SELECT COUNT(e) FROM ExternalJobPosting e WHERE e.portal = :portal AND e.deleted = false")
    long countByPortal(@Param("portal") JobPosting.JobPortal portal);

    /**
     * Count posted by portal today.
     */
    @Query("SELECT COUNT(e) FROM ExternalJobPosting e WHERE e.portal = :portal " +
            "AND e.status = 'POSTED' AND e.postedAt >= :startOfDay AND e.deleted = false")
    long countPostedTodayByPortal(
            @Param("portal") JobPosting.JobPortal portal,
            @Param("startOfDay") LocalDateTime startOfDay);

    /**
     * Get posting statistics by portal.
     */
    @Query("SELECT e.portal, e.status, COUNT(e) FROM ExternalJobPosting e WHERE e.deleted = false " +
            "GROUP BY e.portal, e.status ORDER BY e.portal, e.status")
    List<Object[]> getStatsByPortalAndStatus();

    /**
     * Get posting statistics by tenant.
     */
    @Query("SELECT e.tenantId, e.portal, COUNT(e) FROM ExternalJobPosting e WHERE e.deleted = false " +
            "AND e.status = 'POSTED' GROUP BY e.tenantId, e.portal ORDER BY COUNT(e) DESC")
    List<Object[]> getStatsByTenantAndPortal();

    /**
     * Search external postings.
     */
    @Query("SELECT e FROM ExternalJobPosting e WHERE e.deleted = false " +
            "AND (:status IS NULL OR e.status = :status) " +
            "AND (:portal IS NULL OR e.portal = :portal) " +
            "AND (:tenantId IS NULL OR e.tenantId = :tenantId) " +
            "ORDER BY e.createdAt DESC")
    Page<ExternalJobPosting> search(
            @Param("status") ExternalJobPosting.ExternalPostingStatus status,
            @Param("portal") JobPosting.JobPortal portal,
            @Param("tenantId") UUID tenantId,
            Pageable pageable);

    /**
     * Search external postings with jobPosting eagerly fetched.
     */
    @Query(value = "SELECT e FROM ExternalJobPosting e JOIN FETCH e.jobPosting WHERE e.deleted = false " +
            "AND (:status IS NULL OR e.status = :status) " +
            "AND (:portal IS NULL OR e.portal = :portal) " +
            "AND (:tenantId IS NULL OR e.tenantId = :tenantId) " +
            "ORDER BY e.createdAt DESC",
            countQuery = "SELECT COUNT(e) FROM ExternalJobPosting e WHERE e.deleted = false " +
            "AND (:status IS NULL OR e.status = :status) " +
            "AND (:portal IS NULL OR e.portal = :portal) " +
            "AND (:tenantId IS NULL OR e.tenantId = :tenantId)")
    Page<ExternalJobPosting> searchWithJob(
            @Param("status") ExternalJobPosting.ExternalPostingStatus status,
            @Param("portal") JobPosting.JobPortal portal,
            @Param("tenantId") UUID tenantId,
            Pageable pageable);

    /**
     * Update last checked timestamp.
     */
    @Modifying
    @Query("UPDATE ExternalJobPosting e SET e.lastCheckedAt = :now WHERE e.id = :id")
    void updateLastChecked(@Param("id") UUID id, @Param("now") LocalDateTime now);

    /**
     * Mark expired postings.
     */
    @Modifying
    @Query("UPDATE ExternalJobPosting e SET e.status = 'EXPIRED' " +
            "WHERE e.status = 'POSTED' AND e.expiresAt < :now AND e.deleted = false")
    int markExpiredPostings(@Param("now") LocalDateTime now);

    /**
     * Check if a job is already posted to a portal.
     */
    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END FROM ExternalJobPosting e " +
            "WHERE e.jobPosting.id = :jobPostingId AND e.portal = :portal " +
            "AND e.status IN ('PENDING', 'QUEUED', 'POSTING', 'POSTED') AND e.deleted = false")
    boolean existsActivePostingForJobAndPortal(
            @Param("jobPostingId") UUID jobPostingId,
            @Param("portal") JobPosting.JobPortal portal);

    /**
     * Find postings with status in the given list, with optional filters.
     */
    @Query("SELECT e FROM ExternalJobPosting e WHERE e.deleted = false " +
            "AND e.status IN :statuses " +
            "AND (:portal IS NULL OR e.portal = :portal) " +
            "AND (CAST(:search AS string) IS NULL OR LOWER(e.jobPosting.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
            "    OR LOWER(e.jobPosting.jobReference) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
            "    OR LOWER(e.errorMessage) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) " +
            "AND (CAST(:dateFrom AS timestamp) IS NULL OR e.createdAt >= :dateFrom) " +
            "AND (CAST(:dateTo AS timestamp) IS NULL OR e.createdAt <= :dateTo) " +
            "ORDER BY e.createdAt DESC")
    Page<ExternalJobPosting> searchFailedPostings(
            @Param("statuses") List<ExternalJobPosting.ExternalPostingStatus> statuses,
            @Param("portal") JobPosting.JobPortal portal,
            @Param("search") String search,
            @Param("dateFrom") Instant dateFrom,
            @Param("dateTo") Instant dateTo,
            Pageable pageable);

    /**
     * Count postings by multiple statuses.
     */
    @Query("SELECT COUNT(e) FROM ExternalJobPosting e WHERE e.status IN :statuses AND e.deleted = false")
    long countByStatusIn(@Param("statuses") List<ExternalJobPosting.ExternalPostingStatus> statuses);

    /**
     * Find postings created within a date range.
     */
    @Query("SELECT e FROM ExternalJobPosting e WHERE e.deleted = false " +
            "AND e.createdAt >= :start AND e.createdAt <= :end " +
            "ORDER BY e.createdAt ASC")
    List<ExternalJobPosting> findByCreatedAtBetween(
            @Param("start") Instant start,
            @Param("end") Instant end);

    /**
     * Get portal performance summary: portal, total, active, failed, expired counts.
     * Returns Object[] rows: [portal, totalCount, activeCount, failedCount, expiredCount]
     */
    @Query("SELECT e.portal, " +
            "COUNT(e), " +
            "SUM(CASE WHEN e.status = 'POSTED' AND (e.expiresAt IS NULL OR e.expiresAt > CURRENT_TIMESTAMP) THEN 1 ELSE 0 END), " +
            "SUM(CASE WHEN e.status = 'FAILED' OR e.status = 'REQUIRES_MANUAL' THEN 1 ELSE 0 END), " +
            "SUM(CASE WHEN e.status = 'EXPIRED' OR (e.status = 'POSTED' AND e.expiresAt IS NOT NULL AND e.expiresAt <= CURRENT_TIMESTAMP) THEN 1 ELSE 0 END) " +
            "FROM ExternalJobPosting e WHERE e.deleted = false " +
            "GROUP BY e.portal ORDER BY e.portal")
    List<Object[]> getPortalPerformanceSummary();

    /**
     * Search all postings with jobPosting eagerly fetched (for admin queue view).
     */
    @Query(value = "SELECT e FROM ExternalJobPosting e JOIN FETCH e.jobPosting jp WHERE e.deleted = false " +
            "AND e.status IN :statuses " +
            "AND (:portal IS NULL OR e.portal = :portal) " +
            "AND (CAST(:search AS string) IS NULL OR LOWER(jp.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
            "    OR LOWER(jp.jobReference) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) " +
            "ORDER BY e.createdAt DESC",
            countQuery = "SELECT COUNT(e) FROM ExternalJobPosting e WHERE e.deleted = false " +
            "AND e.status IN :statuses " +
            "AND (:portal IS NULL OR e.portal = :portal) " +
            "AND (CAST(:search AS string) IS NULL OR LOWER(e.jobPosting.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
            "    OR LOWER(e.jobPosting.jobReference) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))")
    Page<ExternalJobPosting> searchAllPostingsWithJob(
            @Param("statuses") List<ExternalJobPosting.ExternalPostingStatus> statuses,
            @Param("portal") JobPosting.JobPortal portal,
            @Param("search") String search,
            Pageable pageable);

    /**
     * Find external postings for a specific portal (for drill-down).
     */
    @Query("SELECT e FROM ExternalJobPosting e WHERE e.portal = :portal AND e.deleted = false " +
            "ORDER BY e.createdAt DESC")
    Page<ExternalJobPosting> findByPortal(@Param("portal") JobPosting.JobPortal portal, Pageable pageable);

    /**
     * Find external postings for a specific portal with jobPosting eagerly fetched.
     */
    @Query(value = "SELECT e FROM ExternalJobPosting e JOIN FETCH e.jobPosting WHERE e.portal = :portal AND e.deleted = false " +
            "ORDER BY e.createdAt DESC",
            countQuery = "SELECT COUNT(e) FROM ExternalJobPosting e WHERE e.portal = :portal AND e.deleted = false")
    Page<ExternalJobPosting> findByPortalWithJob(@Param("portal") JobPosting.JobPortal portal, Pageable pageable);
}
