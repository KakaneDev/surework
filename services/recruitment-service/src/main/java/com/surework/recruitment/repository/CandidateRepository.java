package com.surework.recruitment.repository;

import com.surework.recruitment.domain.Candidate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Candidate entities.
 */
@Repository
public interface CandidateRepository extends JpaRepository<Candidate, UUID> {

    /**
     * Find by candidate reference.
     */
    Optional<Candidate> findByCandidateReference(String candidateReference);

    /**
     * Find by email.
     */
    Optional<Candidate> findByEmail(String email);

    /**
     * Find by phone.
     */
    Optional<Candidate> findByPhone(String phone);

    /**
     * Find by ID number.
     */
    Optional<Candidate> findByIdNumber(String idNumber);

    /**
     * Check if email exists.
     */
    boolean existsByEmail(String email);

    /**
     * Find by status.
     */
    @Query("SELECT c FROM Candidate c WHERE c.status = :status AND c.deleted = false " +
            "ORDER BY c.createdAt DESC")
    List<Candidate> findByStatus(@Param("status") Candidate.CandidateStatus status);

    /**
     * Find active candidates.
     */
    @Query("SELECT c FROM Candidate c WHERE c.status = 'ACTIVE' AND c.blacklisted = false " +
            "AND c.deleted = false ORDER BY c.createdAt DESC")
    Page<Candidate> findActiveCandidates(Pageable pageable);

    /**
     * Find blacklisted candidates.
     */
    @Query("SELECT c FROM Candidate c WHERE c.blacklisted = true AND c.deleted = false " +
            "ORDER BY c.createdAt DESC")
    List<Candidate> findBlacklistedCandidates();

    /**
     * Find internal candidates.
     */
    @Query("SELECT c FROM Candidate c WHERE c.internalCandidate = true AND c.deleted = false " +
            "ORDER BY c.lastName, c.firstName")
    List<Candidate> findInternalCandidates();

    /**
     * Search candidates with safe parameterized JPQL query.
     * Uses CONCAT to safely build LIKE patterns without SQL injection risk.
     */
    @Query("SELECT c FROM Candidate c WHERE c.deleted = false " +
            "AND (:status IS NULL OR c.status = :status) " +
            "AND (:searchTerm IS NULL OR :searchTerm = '' OR " +
            "    LOWER(c.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "    LOWER(c.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "    LOWER(c.email) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "    LOWER(c.currentJobTitle) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "    LOWER(c.skills) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "ORDER BY c.createdAt DESC")
    Page<Candidate> search(
            @Param("status") Candidate.CandidateStatus status,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    /**
     * Find candidates by skills.
     */
    @Query("SELECT c FROM Candidate c WHERE c.deleted = false AND c.status = 'ACTIVE' " +
            "AND LOWER(c.skills) LIKE LOWER(CONCAT('%', :skill, '%')) " +
            "ORDER BY c.yearsExperience DESC NULLS LAST")
    List<Candidate> findBySkill(@Param("skill") String skill);

    /**
     * Find candidates by experience level.
     */
    @Query("SELECT c FROM Candidate c WHERE c.deleted = false AND c.status = 'ACTIVE' " +
            "AND c.yearsExperience >= :minYears AND c.yearsExperience <= :maxYears " +
            "ORDER BY c.yearsExperience DESC")
    List<Candidate> findByExperienceRange(
            @Param("minYears") int minYears,
            @Param("maxYears") int maxYears);

    /**
     * Find candidates willing to relocate.
     */
    @Query("SELECT c FROM Candidate c WHERE c.deleted = false AND c.status = 'ACTIVE' " +
            "AND c.willingToRelocate = true ORDER BY c.createdAt DESC")
    List<Candidate> findWillingToRelocate();

    /**
     * Count candidates by status.
     */
    @Query("SELECT c.status, COUNT(c) FROM Candidate c WHERE c.deleted = false GROUP BY c.status")
    List<Object[]> countByStatus();

    /**
     * Find recently added candidates.
     */
    @Query("SELECT c FROM Candidate c WHERE c.deleted = false " +
            "ORDER BY c.createdAt DESC")
    Page<Candidate> findRecentCandidates(Pageable pageable);
}
