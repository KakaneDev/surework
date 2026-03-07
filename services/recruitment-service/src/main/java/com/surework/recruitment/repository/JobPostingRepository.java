package com.surework.recruitment.repository;

import com.surework.recruitment.domain.JobPosting;
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
 * Repository for JobPosting entities.
 */
@Repository
public interface JobPostingRepository extends JpaRepository<JobPosting, UUID> {

    /**
     * Find by job reference.
     */
    Optional<JobPosting> findByJobReference(String jobReference);

    /**
     * Find open jobs.
     */
    @Query("SELECT j FROM JobPosting j WHERE j.status = 'OPEN' AND j.deleted = false " +
            "AND (j.closingDate IS NULL OR j.closingDate >= :today) " +
            "ORDER BY j.postingDate DESC")
    List<JobPosting> findOpenJobs(@Param("today") LocalDate today);

    /**
     * Find open jobs (paginated).
     */
    @Query("SELECT j FROM JobPosting j WHERE j.status = 'OPEN' AND j.deleted = false " +
            "AND (j.closingDate IS NULL OR j.closingDate >= :today)")
    Page<JobPosting> findOpenJobs(@Param("today") LocalDate today, Pageable pageable);

    /**
     * Find by status.
     */
    @Query("SELECT j FROM JobPosting j WHERE j.status = :status AND j.deleted = false " +
            "ORDER BY j.createdAt DESC")
    List<JobPosting> findByStatus(@Param("status") JobPosting.JobStatus status);

    /**
     * Find by department.
     */
    @Query("SELECT j FROM JobPosting j WHERE j.departmentId = :departmentId AND j.deleted = false " +
            "ORDER BY j.createdAt DESC")
    List<JobPosting> findByDepartmentId(@Param("departmentId") UUID departmentId);

    /**
     * Find by hiring manager.
     */
    @Query("SELECT j FROM JobPosting j WHERE j.hiringManagerId = :managerId AND j.deleted = false " +
            "ORDER BY j.createdAt DESC")
    List<JobPosting> findByHiringManagerId(@Param("managerId") UUID managerId);

    /**
     * Find by recruiter.
     */
    @Query("SELECT j FROM JobPosting j WHERE j.recruiterId = :recruiterId AND j.deleted = false " +
            "ORDER BY j.createdAt DESC")
    List<JobPosting> findByRecruiterId(@Param("recruiterId") UUID recruiterId);

    /**
     * Search job postings with safe parameterized JPQL query.
     * Uses CONCAT to safely build LIKE patterns without SQL injection risk.
     */
    @Query("SELECT j FROM JobPosting j WHERE j.deleted = false " +
            "AND (:status IS NULL OR j.status = :status) " +
            "AND (:departmentId IS NULL OR j.departmentId = :departmentId) " +
            "AND (:employmentType IS NULL OR j.employmentType = :employmentType) " +
            "AND (:location IS NULL OR :location = '' OR LOWER(j.location) LIKE LOWER(CONCAT('%', :location, '%'))) " +
            "AND (:searchTerm IS NULL OR :searchTerm = '' OR LOWER(j.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "    OR LOWER(j.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "AND (:clientId IS NULL OR j.clientId = :clientId) " +
            "ORDER BY j.postingDate DESC NULLS LAST, j.createdAt DESC")
    Page<JobPosting> search(
            @Param("status") JobPosting.JobStatus status,
            @Param("departmentId") UUID departmentId,
            @Param("employmentType") JobPosting.EmploymentType employmentType,
            @Param("location") String location,
            @Param("searchTerm") String searchTerm,
            @Param("clientId") UUID clientId,
            Pageable pageable);

    /**
     * Find public job listings (for careers page).
     */
    @Query("SELECT j FROM JobPosting j WHERE j.status = 'OPEN' AND j.internalOnly = false " +
            "AND j.deleted = false AND (j.closingDate IS NULL OR j.closingDate >= :today) " +
            "ORDER BY j.postingDate DESC")
    Page<JobPosting> findPublicJobs(@Param("today") LocalDate today, Pageable pageable);

    /**
     * Find internal job listings.
     */
    @Query("SELECT j FROM JobPosting j WHERE j.status = 'OPEN' AND j.internalOnly = true " +
            "AND j.deleted = false AND (j.closingDate IS NULL OR j.closingDate >= :today) " +
            "ORDER BY j.postingDate DESC")
    List<JobPosting> findInternalJobs(@Param("today") LocalDate today);

    /**
     * Find jobs closing soon.
     */
    @Query("SELECT j FROM JobPosting j WHERE j.status = 'OPEN' AND j.deleted = false " +
            "AND j.closingDate BETWEEN :today AND :closeDate ORDER BY j.closingDate")
    List<JobPosting> findJobsClosingSoon(
            @Param("today") LocalDate today,
            @Param("closeDate") LocalDate closeDate);

    /**
     * Count open positions.
     */
    @Query("SELECT COUNT(j) FROM JobPosting j WHERE j.status = 'OPEN' AND j.deleted = false")
    long countOpenJobs();

    /**
     * Get job statistics.
     */
    @Query("SELECT j.status, COUNT(j) FROM JobPosting j WHERE j.deleted = false GROUP BY j.status")
    List<Object[]> getJobStatsByStatus();

    /**
     * Find public jobs (default to today's date).
     */
    @Query("SELECT j FROM JobPosting j WHERE j.status = 'OPEN' AND j.internalOnly = false " +
            "AND j.deleted = false AND (j.closingDate IS NULL OR j.closingDate >= CURRENT_DATE) " +
            "ORDER BY j.postingDate DESC")
    Page<JobPosting> findPublicJobs(Pageable pageable);

    /**
     * Count jobs by status.
     */
    @Query("SELECT COUNT(j) FROM JobPosting j WHERE j.status = :status AND j.deleted = false")
    long countByStatus(@Param("status") JobPosting.JobStatus status);

    /**
     * Find recent jobs.
     */
    @Query("SELECT j FROM JobPosting j WHERE j.deleted = false ORDER BY j.createdAt DESC")
    Page<JobPosting> findRecentJobs(Pageable pageable);

    /**
     * Find by job reference and status.
     */
    @Query("SELECT j FROM JobPosting j WHERE j.jobReference = :jobReference AND j.status = :status AND j.deleted = false")
    Optional<JobPosting> findByJobReferenceAndStatus(
            @Param("jobReference") String jobReference,
            @Param("status") JobPosting.JobStatus status);

    /**
     * Find by status (paginated).
     */
    @Query("SELECT j FROM JobPosting j WHERE j.status = :status AND j.deleted = false ORDER BY j.postingDate DESC NULLS LAST")
    Page<JobPosting> findByStatus(@Param("status") JobPosting.JobStatus status, Pageable pageable);

    /**
     * Find job postings with advert performance data (views or applications > 0).
     */
    @Query("SELECT j FROM JobPosting j WHERE j.deleted = false " +
            "AND (j.viewCount > 0 OR j.applicationCount > 0) " +
            "ORDER BY j.postingDate DESC NULLS LAST")
    Page<JobPosting> findAdvertPerformanceData(Pageable pageable);

    /**
     * Search published jobs for public careers page.
     * Supports keyword search, location, province, employment type, industry, and remote filters.
     */
    @Query("SELECT j FROM JobPosting j WHERE j.status = 'OPEN' AND j.deleted = false " +
            "AND (j.closingDate IS NULL OR j.closingDate >= CURRENT_DATE) " +
            "AND (:keyword IS NULL OR :keyword = '' OR " +
            "    LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "    LOWER(j.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "    LOWER(j.skills) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:location IS NULL OR :location = '' OR " +
            "    LOWER(j.location) LIKE LOWER(CONCAT('%', :location, '%')) OR " +
            "    LOWER(j.city) LIKE LOWER(CONCAT('%', :location, '%'))) " +
            "AND (:province IS NULL OR j.province = :province) " +
            "AND (:employmentType IS NULL OR j.employmentType = :employmentType) " +
            "AND (:industry IS NULL OR j.industry = :industry) " +
            "AND (:remote IS NULL OR j.remote = :remote)")
    Page<JobPosting> searchPublishedJobs(
            @Param("keyword") String keyword,
            @Param("location") String location,
            @Param("province") JobPosting.Province province,
            @Param("employmentType") JobPosting.EmploymentType employmentType,
            @Param("industry") JobPosting.Industry industry,
            @Param("remote") Boolean remote,
            Pageable pageable);
}
