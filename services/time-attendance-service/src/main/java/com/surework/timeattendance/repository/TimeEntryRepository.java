package com.surework.timeattendance.repository;

import com.surework.timeattendance.domain.TimeEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for TimeEntry entities.
 */
@Repository
public interface TimeEntryRepository extends JpaRepository<TimeEntry, UUID> {

    /**
     * Find by employee and date.
     */
    @Query("SELECT t FROM TimeEntry t WHERE t.employeeId = :employeeId AND t.workDate = :date " +
            "AND t.deleted = false ORDER BY t.clockIn")
    List<TimeEntry> findByEmployeeAndDate(
            @Param("employeeId") UUID employeeId,
            @Param("date") LocalDate date);

    /**
     * Find active entry (currently clocked in).
     */
    @Query("SELECT t FROM TimeEntry t WHERE t.employeeId = :employeeId " +
            "AND t.status = 'ACTIVE' AND t.clockOut IS NULL AND t.deleted = false")
    Optional<TimeEntry> findActiveEntry(@Param("employeeId") UUID employeeId);

    /**
     * Find by employee and date range.
     */
    @Query("SELECT t FROM TimeEntry t WHERE t.employeeId = :employeeId " +
            "AND t.workDate BETWEEN :startDate AND :endDate AND t.deleted = false " +
            "ORDER BY t.workDate, t.clockIn")
    List<TimeEntry> findByEmployeeAndDateRange(
            @Param("employeeId") UUID employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Find by date range (all employees).
     */
    @Query("SELECT t FROM TimeEntry t WHERE t.workDate BETWEEN :startDate AND :endDate " +
            "AND t.deleted = false ORDER BY t.employeeId, t.workDate, t.clockIn")
    List<TimeEntry> findByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Find pending approval entries.
     */
    @Query("SELECT t FROM TimeEntry t WHERE t.status = 'PENDING_APPROVAL' AND t.deleted = false " +
            "ORDER BY t.workDate DESC")
    List<TimeEntry> findPendingApproval();

    /**
     * Find pending approval entries for specific employees.
     */
    @Query("SELECT t FROM TimeEntry t WHERE t.status = 'PENDING_APPROVAL' " +
            "AND t.employeeId IN :employeeIds AND t.deleted = false ORDER BY t.workDate DESC")
    List<TimeEntry> findPendingApprovalForEmployees(@Param("employeeIds") List<UUID> employeeIds);

    /**
     * Find late arrivals by date range.
     */
    @Query("SELECT t FROM TimeEntry t WHERE t.workDate BETWEEN :startDate AND :endDate " +
            "AND t.late = true AND t.deleted = false ORDER BY t.workDate DESC")
    List<TimeEntry> findLateArrivals(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Find late arrivals for employee.
     */
    @Query("SELECT t FROM TimeEntry t WHERE t.employeeId = :employeeId " +
            "AND t.workDate BETWEEN :startDate AND :endDate AND t.late = true " +
            "AND t.deleted = false ORDER BY t.workDate DESC")
    List<TimeEntry> findLateArrivalsForEmployee(
            @Param("employeeId") UUID employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Find entries with overtime.
     */
    @Query("SELECT t FROM TimeEntry t WHERE t.workDate BETWEEN :startDate AND :endDate " +
            "AND t.overtimeHours > 0 AND t.deleted = false ORDER BY t.workDate DESC")
    List<TimeEntry> findWithOvertime(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Sum hours by employee and date range.
     */
    @Query("SELECT SUM(t.totalHours) FROM TimeEntry t WHERE t.employeeId = :employeeId " +
            "AND t.workDate BETWEEN :startDate AND :endDate AND t.deleted = false " +
            "AND t.status NOT IN ('REJECTED', 'CANCELLED')")
    java.math.BigDecimal sumHoursByEmployeeAndDateRange(
            @Param("employeeId") UUID employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Sum overtime hours by employee and date range.
     */
    @Query("SELECT SUM(t.overtimeHours) FROM TimeEntry t WHERE t.employeeId = :employeeId " +
            "AND t.workDate BETWEEN :startDate AND :endDate AND t.deleted = false " +
            "AND t.status NOT IN ('REJECTED', 'CANCELLED')")
    java.math.BigDecimal sumOvertimeByEmployeeAndDateRange(
            @Param("employeeId") UUID employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Count late days for employee.
     */
    @Query("SELECT COUNT(t) FROM TimeEntry t WHERE t.employeeId = :employeeId " +
            "AND t.workDate BETWEEN :startDate AND :endDate AND t.late = true " +
            "AND t.deleted = false")
    long countLateDays(
            @Param("employeeId") UUID employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Count worked days for employee.
     */
    @Query("SELECT COUNT(DISTINCT t.workDate) FROM TimeEntry t WHERE t.employeeId = :employeeId " +
            "AND t.workDate BETWEEN :startDate AND :endDate AND t.deleted = false " +
            "AND t.status NOT IN ('REJECTED', 'CANCELLED')")
    long countWorkedDays(
            @Param("employeeId") UUID employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Search time entries.
     */
    @Query("SELECT t FROM TimeEntry t WHERE t.deleted = false " +
            "AND (:employeeId IS NULL OR t.employeeId = :employeeId) " +
            "AND (:status IS NULL OR t.status = :status) " +
            "AND (:startDate IS NULL OR t.workDate >= :startDate) " +
            "AND (:endDate IS NULL OR t.workDate <= :endDate) " +
            "ORDER BY t.workDate DESC, t.clockIn DESC")
    Page<TimeEntry> search(
            @Param("employeeId") UUID employeeId,
            @Param("status") TimeEntry.TimeEntryStatus status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable);

    /**
     * Find entries forgotten to clock out (active for too long).
     */
    @Query("SELECT t FROM TimeEntry t WHERE t.status = 'ACTIVE' " +
            "AND t.clockIn < :cutoffTime AND t.deleted = false")
    List<TimeEntry> findForgottenClockOuts(@Param("cutoffTime") LocalDateTime cutoffTime);

    /**
     * Get daily attendance summary.
     */
    @Query("SELECT COUNT(DISTINCT t.employeeId), SUM(t.totalHours), SUM(t.overtimeHours), " +
            "SUM(CASE WHEN t.late = true THEN 1 ELSE 0 END) " +
            "FROM TimeEntry t WHERE t.workDate = :date AND t.deleted = false " +
            "AND t.status NOT IN ('REJECTED', 'CANCELLED')")
    Object[] getDailySummary(@Param("date") LocalDate date);
}
