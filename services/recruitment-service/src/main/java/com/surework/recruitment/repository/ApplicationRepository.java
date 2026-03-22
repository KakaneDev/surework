package com.surework.recruitment.repository;

import com.surework.recruitment.domain.Application;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Application entities.
 */
@Repository
public interface ApplicationRepository extends JpaRepository<Application, UUID> {

    /**
     * Find by application reference.
     */
    Optional<Application> findByApplicationReference(String applicationReference);

    /**
     * Find by candidate.
     */
    @Query("SELECT a FROM Application a WHERE a.candidate.id = :candidateId AND a.deleted = false " +
            "ORDER BY a.applicationDate DESC")
    List<Application> findByCandidateId(@Param("candidateId") UUID candidateId);

    /**
     * Find by job posting.
     */
    @Query("SELECT a FROM Application a LEFT JOIN FETCH a.candidate JOIN FETCH a.jobPosting " +
            "WHERE a.jobPosting.id = :jobId AND a.deleted = false ORDER BY a.applicationDate DESC")
    List<Application> findByJobPostingId(@Param("jobId") UUID jobId);

    /**
     * Find by job posting (paginated).
     */
    @Query(value = "SELECT a FROM Application a LEFT JOIN FETCH a.candidate JOIN FETCH a.jobPosting " +
            "WHERE a.jobPosting.id = :jobId AND a.deleted = false",
            countQuery = "SELECT COUNT(a) FROM Application a WHERE a.jobPosting.id = :jobId AND a.deleted = false")
    Page<Application> findByJobPostingId(@Param("jobId") UUID jobId, Pageable pageable);

    /**
     * Check if candidate already applied to job.
     */
    @Query("SELECT COUNT(a) > 0 FROM Application a WHERE a.candidate.id = :candidateId " +
            "AND a.jobPosting.id = :jobId AND a.deleted = false")
    boolean existsByCandidateAndJob(
            @Param("candidateId") UUID candidateId,
            @Param("jobId") UUID jobId);

    /**
     * Find by status.
     */
    @Query("SELECT a FROM Application a WHERE a.status = :status AND a.deleted = false " +
            "ORDER BY a.applicationDate DESC")
    List<Application> findByStatus(@Param("status") Application.ApplicationStatus status);

    /**
     * Find by stage.
     */
    @Query("SELECT a FROM Application a WHERE a.stage = :stage AND a.deleted = false " +
            "ORDER BY a.applicationDate DESC")
    List<Application> findByStage(@Param("stage") Application.RecruitmentStage stage);

    /**
     * Find active applications for a job.
     */
    @Query("SELECT a FROM Application a WHERE a.jobPosting.id = :jobId " +
            "AND a.status NOT IN ('REJECTED', 'WITHDRAWN', 'HIRED') AND a.deleted = false " +
            "ORDER BY a.applicationDate DESC")
    List<Application> findActiveByJobPostingId(@Param("jobId") UUID jobId);

    /**
     * Find starred applications.
     */
    @Query("SELECT a FROM Application a WHERE a.starred = true AND a.deleted = false " +
            "AND a.status NOT IN ('REJECTED', 'WITHDRAWN') ORDER BY a.applicationDate DESC")
    List<Application> findStarredApplications();

    /**
     * Search applications.
     */
    @Query("SELECT a FROM Application a WHERE a.deleted = false " +
            "AND (:jobId IS NULL OR a.jobPosting.id = :jobId) " +
            "AND (:candidateId IS NULL OR a.candidate.id = :candidateId) " +
            "AND (:status IS NULL OR a.status = :status) " +
            "AND (:stage IS NULL OR a.stage = :stage) " +
            "ORDER BY a.applicationDate DESC")
    Page<Application> search(
            @Param("jobId") UUID jobId,
            @Param("candidateId") UUID candidateId,
            @Param("status") Application.ApplicationStatus status,
            @Param("stage") Application.RecruitmentStage stage,
            Pageable pageable);

    /**
     * Find applications needing attention (in review for too long).
     */
    @Query("SELECT a FROM Application a WHERE a.deleted = false " +
            "AND a.status = 'IN_REVIEW' AND a.applicationDate < :cutoffDate " +
            "ORDER BY a.applicationDate")
    List<Application> findStaleApplications(@Param("cutoffDate") LocalDate cutoffDate);

    /**
     * Find applications with pending offers.
     */
    @Query("SELECT a FROM Application a WHERE a.status = 'OFFER_MADE' AND a.deleted = false " +
            "AND a.offerExpiryDate >= :today ORDER BY a.offerExpiryDate")
    List<Application> findPendingOffers(@Param("today") LocalDate today);

    /**
     * Find applications with expiring offers.
     */
    @Query("SELECT a FROM Application a WHERE a.status = 'OFFER_MADE' AND a.deleted = false " +
            "AND a.offerExpiryDate BETWEEN :today AND :expiryDate ORDER BY a.offerExpiryDate")
    List<Application> findExpiringOffers(
            @Param("today") LocalDate today,
            @Param("expiryDate") LocalDate expiryDate);

    /**
     * Count applications by status for a job.
     */
    @Query("SELECT a.status, COUNT(a) FROM Application a WHERE a.jobPosting.id = :jobId " +
            "AND a.deleted = false GROUP BY a.status")
    List<Object[]> countByStatusForJob(@Param("jobId") UUID jobId);

    /**
     * Count applications by stage for a job.
     */
    @Query("SELECT a.stage, COUNT(a) FROM Application a WHERE a.jobPosting.id = :jobId " +
            "AND a.deleted = false GROUP BY a.stage")
    List<Object[]> countByStageForJob(@Param("jobId") UUID jobId);

    /**
     * Get application pipeline summary.
     */
    @Query("SELECT a.stage, COUNT(a) FROM Application a WHERE a.deleted = false " +
            "AND a.status NOT IN ('REJECTED', 'WITHDRAWN') GROUP BY a.stage ORDER BY a.stage")
    List<Object[]> getPipelineSummary();

    /**
     * Count applications by date range.
     */
    @Query("SELECT COUNT(a) FROM Application a WHERE a.deleted = false " +
            "AND a.applicationDate BETWEEN :startDate AND :endDate")
    long countByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Check if an application exists for a job posting with the given email.
     * Used to prevent duplicate applications from the public careers page.
     */
    @Query("SELECT COUNT(a) > 0 FROM Application a WHERE a.jobPosting.id = :jobPostingId " +
            "AND a.email = :email AND a.deleted = false")
    boolean existsByJobPostingIdAndEmail(
            @Param("jobPostingId") UUID jobPostingId,
            @Param("email") String email);

    /**
     * Find application by offer token (for public offer acceptance).
     * Uses JOIN FETCH because OSIV is off.
     */
    @Query("SELECT a FROM Application a LEFT JOIN FETCH a.candidate JOIN FETCH a.jobPosting " +
            "WHERE a.offerToken = :token AND a.deleted = false")
    Optional<Application> findByOfferToken(@Param("token") String token);

    /**
     * Find expired offers (status OFFER_MADE with expiry date in the past).
     */
    @Query("SELECT a FROM Application a WHERE a.status = 'OFFER_MADE' AND a.deleted = false " +
            "AND a.offerExpiryDate < :today")
    List<Application> findExpiredOffers(@Param("today") LocalDate today);

    // === Analytics Queries ===

    /**
     * Count applications grouped by source.
     */
    @Query("SELECT a.source, COUNT(a) FROM Application a WHERE a.deleted = false " +
            "AND a.source IS NOT NULL GROUP BY a.source ORDER BY COUNT(a) DESC")
    List<Object[]> countBySourceGrouped();

    /**
     * Count hired applications grouped by source.
     */
    @Query("SELECT a.source, COUNT(a) FROM Application a WHERE a.deleted = false " +
            "AND a.status = 'HIRED' AND a.source IS NOT NULL GROUP BY a.source ORDER BY COUNT(a) DESC")
    List<Object[]> countHiredBySource();

    /**
     * Get offer statistics: counts of OFFER_MADE, OFFER_ACCEPTED, OFFER_DECLINED, HIRED statuses.
     * Returns Object[] rows: [status, count]
     */
    @Query("SELECT a.status, COUNT(a) FROM Application a WHERE a.deleted = false " +
            "AND a.status IN ('OFFER_MADE', 'OFFER_ACCEPTED', 'OFFER_DECLINED', 'HIRED') " +
            "GROUP BY a.status")
    List<Object[]> getOfferStats();

    /**
     * Find hired applications with dates for time-to-hire-by-source analysis.
     */
    @Query("SELECT a FROM Application a WHERE a.deleted = false " +
            "AND a.status = 'HIRED' AND a.applicationDate IS NOT NULL " +
            "ORDER BY a.applicationDate DESC")
    List<Application> findHiredApplicationsWithDates();

    /**
     * Count applications by status (for offer acceptance over time).
     * Returns Object[] rows: [yearMonth, offersCount, acceptedCount, declinedCount]
     */
    @Query("SELECT FUNCTION('to_char', a.offerDate, 'YYYY-MM'), " +
            "COUNT(a), " +
            "SUM(CASE WHEN a.status = 'OFFER_ACCEPTED' OR a.status = 'HIRED' THEN 1 ELSE 0 END), " +
            "SUM(CASE WHEN a.status = 'OFFER_DECLINED' THEN 1 ELSE 0 END) " +
            "FROM Application a WHERE a.deleted = false " +
            "AND a.offerDate IS NOT NULL " +
            "AND a.status IN ('OFFER_MADE', 'OFFER_ACCEPTED', 'OFFER_DECLINED', 'HIRED') " +
            "GROUP BY FUNCTION('to_char', a.offerDate, 'YYYY-MM') " +
            "ORDER BY FUNCTION('to_char', a.offerDate, 'YYYY-MM') DESC")
    List<Object[]> getOfferTrendByMonth();
}
