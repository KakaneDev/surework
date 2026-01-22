package com.surework.recruitment.repository;

import com.surework.recruitment.domain.Interview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository for Interview entities.
 */
@Repository
public interface InterviewRepository extends JpaRepository<Interview, UUID> {

    /**
     * Find by application.
     */
    @Query("SELECT i FROM Interview i WHERE i.application.id = :applicationId AND i.deleted = false " +
            "ORDER BY i.scheduledAt DESC")
    List<Interview> findByApplicationId(@Param("applicationId") UUID applicationId);

    /**
     * Find by interviewer.
     */
    @Query("SELECT i FROM Interview i WHERE i.interviewerId = :interviewerId AND i.deleted = false " +
            "ORDER BY i.scheduledAt DESC")
    List<Interview> findByInterviewerId(@Param("interviewerId") UUID interviewerId);

    /**
     * Find upcoming interviews for interviewer.
     */
    @Query("SELECT i FROM Interview i WHERE i.interviewerId = :interviewerId " +
            "AND i.status IN ('SCHEDULED', 'CONFIRMED') AND i.scheduledAt > :now " +
            "AND i.deleted = false ORDER BY i.scheduledAt")
    List<Interview> findUpcomingByInterviewerId(
            @Param("interviewerId") UUID interviewerId,
            @Param("now") LocalDateTime now);

    /**
     * Find interviews in date range.
     */
    @Query("SELECT i FROM Interview i WHERE i.scheduledAt BETWEEN :start AND :end " +
            "AND i.deleted = false ORDER BY i.scheduledAt")
    List<Interview> findByDateRange(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    /**
     * Find today's interviews.
     */
    @Query("SELECT i FROM Interview i WHERE i.scheduledAt BETWEEN :dayStart AND :dayEnd " +
            "AND i.status NOT IN ('CANCELLED', 'NO_SHOW') AND i.deleted = false " +
            "ORDER BY i.scheduledAt")
    List<Interview> findTodaysInterviews(
            @Param("dayStart") LocalDateTime dayStart,
            @Param("dayEnd") LocalDateTime dayEnd);

    /**
     * Find interviews needing feedback.
     */
    @Query("SELECT i FROM Interview i WHERE i.status IN ('COMPLETED', 'FEEDBACK_PENDING') " +
            "AND i.deleted = false ORDER BY i.completedAt")
    List<Interview> findNeedingFeedback();

    /**
     * Find interviews needing reminder.
     */
    @Query("SELECT i FROM Interview i WHERE i.status IN ('SCHEDULED', 'CONFIRMED') " +
            "AND i.reminderSent = false AND i.scheduledAt BETWEEN :now AND :reminderTime " +
            "AND i.deleted = false ORDER BY i.scheduledAt")
    List<Interview> findNeedingReminder(
            @Param("now") LocalDateTime now,
            @Param("reminderTime") LocalDateTime reminderTime);

    /**
     * Search interviews.
     */
    @Query("SELECT i FROM Interview i WHERE i.deleted = false " +
            "AND (:interviewerId IS NULL OR i.interviewerId = :interviewerId) " +
            "AND (:status IS NULL OR i.status = :status) " +
            "AND (:type IS NULL OR i.interviewType = :type) " +
            "AND (:startDate IS NULL OR i.scheduledAt >= :startDate) " +
            "AND (:endDate IS NULL OR i.scheduledAt <= :endDate) " +
            "ORDER BY i.scheduledAt DESC")
    Page<Interview> search(
            @Param("interviewerId") UUID interviewerId,
            @Param("status") Interview.InterviewStatus status,
            @Param("type") Interview.InterviewType type,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    /**
     * Count interviews by status.
     */
    @Query("SELECT i.status, COUNT(i) FROM Interview i WHERE i.deleted = false GROUP BY i.status")
    List<Object[]> countByStatus();

    /**
     * Find conflicting interviews for interviewer.
     */
    @Query("SELECT i FROM Interview i WHERE i.interviewerId = :interviewerId " +
            "AND i.status NOT IN ('CANCELLED', 'NO_SHOW', 'RESCHEDULED') " +
            "AND ((i.scheduledAt <= :startTime AND i.endTime > :startTime) " +
            "     OR (i.scheduledAt < :endTime AND i.endTime >= :endTime) " +
            "     OR (i.scheduledAt >= :startTime AND i.endTime <= :endTime)) " +
            "AND i.deleted = false")
    List<Interview> findConflictingInterviews(
            @Param("interviewerId") UUID interviewerId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    /**
     * Get average rating for a candidate.
     */
    @Query("SELECT AVG(i.overallRating) FROM Interview i " +
            "WHERE i.application.candidate.id = :candidateId " +
            "AND i.overallRating IS NOT NULL AND i.deleted = false")
    Double getAverageRatingForCandidate(@Param("candidateId") UUID candidateId);
}
