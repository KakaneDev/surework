package com.surework.timeattendance.repository;

import com.surework.timeattendance.domain.Timesheet;
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
 * Repository for Timesheet entities.
 */
@Repository
public interface TimesheetRepository extends JpaRepository<Timesheet, UUID> {

    /**
     * Find by reference.
     */
    Optional<Timesheet> findByTimesheetReference(String reference);

    /**
     * Find by employee and period.
     */
    @Query("SELECT t FROM Timesheet t WHERE t.employeeId = :employeeId " +
            "AND t.periodStart = :periodStart AND t.periodEnd = :periodEnd AND t.deleted = false")
    Optional<Timesheet> findByEmployeeAndPeriod(
            @Param("employeeId") UUID employeeId,
            @Param("periodStart") LocalDate periodStart,
            @Param("periodEnd") LocalDate periodEnd);

    /**
     * Find by employee and month.
     */
    @Query("SELECT t FROM Timesheet t WHERE t.employeeId = :employeeId " +
            "AND t.periodYear = :year AND t.periodMonth = :month AND t.deleted = false")
    Optional<Timesheet> findByEmployeeAndMonth(
            @Param("employeeId") UUID employeeId,
            @Param("year") int year,
            @Param("month") int month);

    /**
     * Find by employee.
     */
    @Query("SELECT t FROM Timesheet t WHERE t.employeeId = :employeeId AND t.deleted = false " +
            "ORDER BY t.periodStart DESC")
    List<Timesheet> findByEmployeeId(@Param("employeeId") UUID employeeId);

    /**
     * Find by employee (paginated).
     */
    @Query("SELECT t FROM Timesheet t WHERE t.employeeId = :employeeId AND t.deleted = false")
    Page<Timesheet> findByEmployeeId(@Param("employeeId") UUID employeeId, Pageable pageable);

    /**
     * Find by status.
     */
    @Query("SELECT t FROM Timesheet t WHERE t.status = :status AND t.deleted = false " +
            "ORDER BY t.periodStart DESC")
    List<Timesheet> findByStatus(@Param("status") Timesheet.TimesheetStatus status);

    /**
     * Find pending approval.
     */
    @Query("SELECT t FROM Timesheet t WHERE t.status IN ('SUBMITTED', 'UNDER_REVIEW') " +
            "AND t.deleted = false ORDER BY t.submittedAt")
    List<Timesheet> findPendingApproval();

    /**
     * Find pending approval for employees.
     */
    @Query("SELECT t FROM Timesheet t WHERE t.status IN ('SUBMITTED', 'UNDER_REVIEW') " +
            "AND t.employeeId IN :employeeIds AND t.deleted = false ORDER BY t.submittedAt")
    List<Timesheet> findPendingApprovalForEmployees(@Param("employeeIds") List<UUID> employeeIds);

    /**
     * Find approved timesheets not yet processed for payroll.
     */
    @Query("SELECT t FROM Timesheet t WHERE t.status = 'APPROVED' " +
            "AND t.payrollProcessed = false AND t.deleted = false " +
            "ORDER BY t.periodStart")
    List<Timesheet> findApprovedNotProcessed();

    /**
     * Find approved timesheets for a specific month not yet processed.
     */
    @Query("SELECT t FROM Timesheet t WHERE t.status = 'APPROVED' " +
            "AND t.payrollProcessed = false AND t.periodYear = :year AND t.periodMonth = :month " +
            "AND t.deleted = false ORDER BY t.employeeId")
    List<Timesheet> findApprovedForPayrollPeriod(
            @Param("year") int year,
            @Param("month") int month);

    /**
     * Search timesheets.
     */
    @Query("SELECT t FROM Timesheet t WHERE t.deleted = false " +
            "AND (:employeeId IS NULL OR t.employeeId = :employeeId) " +
            "AND (:departmentId IS NULL OR t.departmentId = :departmentId) " +
            "AND (:status IS NULL OR t.status = :status) " +
            "AND (:year IS NULL OR t.periodYear = :year) " +
            "AND (:month IS NULL OR t.periodMonth = :month) " +
            "ORDER BY t.periodStart DESC")
    Page<Timesheet> search(
            @Param("employeeId") UUID employeeId,
            @Param("departmentId") UUID departmentId,
            @Param("status") Timesheet.TimesheetStatus status,
            @Param("year") Integer year,
            @Param("month") Integer month,
            Pageable pageable);

    /**
     * Find by payroll run.
     */
    @Query("SELECT t FROM Timesheet t WHERE t.payrollRunId = :payrollRunId AND t.deleted = false")
    List<Timesheet> findByPayrollRunId(@Param("payrollRunId") UUID payrollRunId);

    /**
     * Count by status.
     */
    @Query("SELECT t.status, COUNT(t) FROM Timesheet t WHERE t.deleted = false GROUP BY t.status")
    List<Object[]> countByStatus();

    /**
     * Get total hours summary for a period.
     */
    @Query("SELECT SUM(t.totalHours), SUM(t.regularHours), SUM(t.overtimeHours), " +
            "SUM(t.sundayHours), SUM(t.publicHolidayHours) " +
            "FROM Timesheet t WHERE t.periodYear = :year AND t.periodMonth = :month " +
            "AND t.deleted = false AND t.status IN ('APPROVED', 'PROCESSED', 'LOCKED')")
    Object[] getMonthlyHoursSummary(@Param("year") int year, @Param("month") int month);
}
