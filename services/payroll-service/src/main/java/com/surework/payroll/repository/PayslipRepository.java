package com.surework.payroll.repository;

import com.surework.payroll.domain.Payslip;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Payslip entities.
 */
@Repository
public interface PayslipRepository extends JpaRepository<Payslip, UUID> {

    /**
     * Find by payslip number.
     */
    Optional<Payslip> findByPayslipNumber(String payslipNumber);

    /**
     * Find payslips for an employee.
     */
    @Query("SELECT p FROM Payslip p WHERE p.employeeId = :employeeId AND p.deleted = false " +
            "ORDER BY p.periodYear DESC, p.periodMonth DESC")
    List<Payslip> findByEmployeeId(@Param("employeeId") UUID employeeId);

    /**
     * Find payslips for an employee with pagination.
     */
    @Query("SELECT p FROM Payslip p WHERE p.employeeId = :employeeId AND p.deleted = false")
    Page<Payslip> findByEmployeeId(@Param("employeeId") UUID employeeId, Pageable pageable);

    /**
     * Find payslip for employee and period.
     */
    @Query("SELECT p FROM Payslip p WHERE p.employeeId = :employeeId " +
            "AND p.periodYear = :year AND p.periodMonth = :month " +
            "AND p.status != 'EXCLUDED' AND p.status != 'VOID' AND p.deleted = false")
    Optional<Payslip> findByEmployeeAndPeriod(
            @Param("employeeId") UUID employeeId,
            @Param("year") int year,
            @Param("month") int month);

    /**
     * Find payslips by payroll run.
     */
    @Query("SELECT p FROM Payslip p WHERE p.payrollRun.id = :runId AND p.deleted = false " +
            "ORDER BY p.employeeName")
    List<Payslip> findByPayrollRunId(@Param("runId") UUID runId);

    /**
     * Find payslips by status.
     */
    @Query("SELECT p FROM Payslip p WHERE p.status = :status AND p.deleted = false")
    List<Payslip> findByStatus(@Param("status") Payslip.PayslipStatus status);

    /**
     * Get YTD totals for an employee up to a specific period.
     */
    @Query("SELECT COALESCE(SUM(p.grossEarnings), 0) FROM Payslip p " +
            "WHERE p.employeeId = :employeeId AND p.periodYear = :year " +
            "AND p.periodMonth <= :month AND p.status = 'PAID' AND p.deleted = false")
    BigDecimal getYtdGross(
            @Param("employeeId") UUID employeeId,
            @Param("year") int year,
            @Param("month") int month);

    /**
     * Get YTD PAYE for an employee.
     */
    @Query("SELECT COALESCE(SUM(p.paye), 0) FROM Payslip p " +
            "WHERE p.employeeId = :employeeId AND p.periodYear = :year " +
            "AND p.periodMonth <= :month AND p.status = 'PAID' AND p.deleted = false")
    BigDecimal getYtdPaye(
            @Param("employeeId") UUID employeeId,
            @Param("year") int year,
            @Param("month") int month);

    /**
     * Get YTD UIF for an employee.
     */
    @Query("SELECT COALESCE(SUM(p.uifEmployee), 0) FROM Payslip p " +
            "WHERE p.employeeId = :employeeId AND p.periodYear = :year " +
            "AND p.periodMonth <= :month AND p.status = 'PAID' AND p.deleted = false")
    BigDecimal getYtdUif(
            @Param("employeeId") UUID employeeId,
            @Param("year") int year,
            @Param("month") int month);

    /**
     * Get YTD Net for an employee.
     */
    @Query("SELECT COALESCE(SUM(p.netPay), 0) FROM Payslip p " +
            "WHERE p.employeeId = :employeeId AND p.periodYear = :year " +
            "AND p.periodMonth <= :month AND p.status = 'PAID' AND p.deleted = false")
    BigDecimal getYtdNet(
            @Param("employeeId") UUID employeeId,
            @Param("year") int year,
            @Param("month") int month);

    /**
     * Count payslips for a period.
     */
    @Query("SELECT COUNT(p) FROM Payslip p WHERE p.periodYear = :year AND p.periodMonth = :month " +
            "AND p.status != 'EXCLUDED' AND p.status != 'VOID' AND p.deleted = false")
    long countByPeriod(@Param("year") int year, @Param("month") int month);

    /**
     * Get all paid payslips for IRP5/IT3a generation.
     */
    @Query("SELECT p FROM Payslip p WHERE p.employeeId = :employeeId " +
            "AND p.periodYear = :year AND p.status = 'PAID' AND p.deleted = false " +
            "ORDER BY p.periodMonth")
    List<Payslip> findPaidPayslipsForTaxYear(
            @Param("employeeId") UUID employeeId,
            @Param("year") int year);

    /**
     * Search payslips with filters.
     */
    @Query("SELECT p FROM Payslip p WHERE p.deleted = false " +
            "AND (:employeeId IS NULL OR p.employeeId = :employeeId) " +
            "AND (:year IS NULL OR p.periodYear = :year) " +
            "AND (:month IS NULL OR p.periodMonth = :month) " +
            "AND (:status IS NULL OR p.status = :status) " +
            "ORDER BY p.periodYear DESC, p.periodMonth DESC, p.employeeName")
    Page<Payslip> search(
            @Param("employeeId") UUID employeeId,
            @Param("year") Integer year,
            @Param("month") Integer month,
            @Param("status") Payslip.PayslipStatus status,
            Pageable pageable);
}
