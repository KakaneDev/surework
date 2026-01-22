package com.surework.payroll.repository;

import com.surework.payroll.domain.PayrollRun;
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
 * Repository for PayrollRun entities.
 */
@Repository
public interface PayrollRunRepository extends JpaRepository<PayrollRun, UUID> {

    /**
     * Find by run number.
     */
    Optional<PayrollRun> findByRunNumber(String runNumber);

    /**
     * Find by period.
     */
    @Query("SELECT pr FROM PayrollRun pr WHERE pr.periodYear = :year AND pr.periodMonth = :month AND pr.deleted = false")
    List<PayrollRun> findByPeriod(@Param("year") int year, @Param("month") int month);

    /**
     * Find the latest run for a period.
     */
    @Query("SELECT pr FROM PayrollRun pr WHERE pr.periodYear = :year AND pr.periodMonth = :month " +
            "AND pr.deleted = false ORDER BY pr.createdAt DESC")
    Optional<PayrollRun> findLatestByPeriod(@Param("year") int year, @Param("month") int month);

    /**
     * Find runs by status.
     */
    @Query("SELECT pr FROM PayrollRun pr WHERE pr.status = :status AND pr.deleted = false ORDER BY pr.createdAt DESC")
    List<PayrollRun> findByStatus(@Param("status") PayrollRun.PayrollRunStatus status);

    /**
     * Find runs awaiting approval.
     */
    @Query("SELECT pr FROM PayrollRun pr WHERE pr.status = 'PENDING_APPROVAL' AND pr.deleted = false " +
            "ORDER BY pr.paymentDate ASC")
    List<PayrollRun> findPendingApproval();

    /**
     * Find runs by year.
     */
    @Query("SELECT pr FROM PayrollRun pr WHERE pr.periodYear = :year AND pr.deleted = false " +
            "ORDER BY pr.periodMonth DESC")
    List<PayrollRun> findByYear(@Param("year") int year);

    /**
     * Find runs with payment date in range.
     */
    @Query("SELECT pr FROM PayrollRun pr WHERE pr.paymentDate BETWEEN :startDate AND :endDate " +
            "AND pr.deleted = false ORDER BY pr.paymentDate ASC")
    List<PayrollRun> findByPaymentDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Search runs with filters.
     */
    @Query("SELECT pr FROM PayrollRun pr WHERE pr.deleted = false " +
            "AND (:year IS NULL OR pr.periodYear = :year) " +
            "AND (:status IS NULL OR pr.status = :status) " +
            "ORDER BY pr.periodYear DESC, pr.periodMonth DESC")
    Page<PayrollRun> search(
            @Param("year") Integer year,
            @Param("status") PayrollRun.PayrollRunStatus status,
            Pageable pageable);

    /**
     * Check if a period has been paid.
     */
    @Query("SELECT COUNT(pr) > 0 FROM PayrollRun pr WHERE pr.periodYear = :year " +
            "AND pr.periodMonth = :month AND pr.status = 'PAID' AND pr.deleted = false")
    boolean isPeriodPaid(@Param("year") int year, @Param("month") int month);

    /**
     * Get total payroll cost for a year.
     */
    @Query("SELECT COALESCE(SUM(pr.totalEmployerCost), 0) FROM PayrollRun pr " +
            "WHERE pr.periodYear = :year AND pr.status = 'PAID' AND pr.deleted = false")
    java.math.BigDecimal getTotalPayrollCostForYear(@Param("year") int year);
}
