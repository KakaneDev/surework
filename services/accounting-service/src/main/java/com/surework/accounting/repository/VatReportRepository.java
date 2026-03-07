package com.surework.accounting.repository;

import com.surework.accounting.domain.VatReport;
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
 * Repository for VAT reports.
 * Supports SARS VAT201 reporting requirements.
 */
@Repository
public interface VatReportRepository extends JpaRepository<VatReport, UUID> {

    /**
     * Find by VAT period and tenant.
     */
    @Query("SELECT vr FROM VatReport vr WHERE vr.vatPeriod = :period " +
            "AND vr.tenantId = :tenantId AND vr.deleted = false")
    Optional<VatReport> findByPeriodAndTenant(
            @Param("period") String vatPeriod,
            @Param("tenantId") UUID tenantId);

    /**
     * Find by VAT period (single tenant mode).
     */
    Optional<VatReport> findByVatPeriodAndDeletedFalse(String vatPeriod);

    /**
     * Find by status.
     */
    @Query("SELECT vr FROM VatReport vr WHERE vr.status = :status AND vr.deleted = false " +
            "ORDER BY vr.periodStart DESC")
    List<VatReport> findByStatus(@Param("status") VatReport.ReportStatus status);

    /**
     * Find by date range.
     */
    @Query("SELECT vr FROM VatReport vr WHERE vr.periodStart >= :startDate " +
            "AND vr.periodEnd <= :endDate AND vr.deleted = false " +
            "ORDER BY vr.periodStart DESC")
    List<VatReport> findByDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Find reports for a year.
     */
    @Query("SELECT vr FROM VatReport vr WHERE YEAR(vr.periodStart) = :year " +
            "AND vr.deleted = false ORDER BY vr.periodStart")
    List<VatReport> findByYear(@Param("year") int year);

    /**
     * Find reports pending submission.
     */
    @Query("SELECT vr FROM VatReport vr WHERE vr.status = 'GENERATED' " +
            "AND vr.deleted = false ORDER BY vr.paymentDueDate")
    List<VatReport> findPendingSubmission();

    /**
     * Find overdue reports.
     */
    @Query("SELECT vr FROM VatReport vr WHERE vr.status IN ('DRAFT', 'GENERATED') " +
            "AND vr.paymentDueDate < :today AND vr.deleted = false " +
            "ORDER BY vr.paymentDueDate")
    List<VatReport> findOverdue(@Param("today") LocalDate today);

    /**
     * Search reports with filters.
     */
    @Query("SELECT vr FROM VatReport vr WHERE vr.deleted = false " +
            "AND (:status IS NULL OR vr.status = :status) " +
            "AND (:year IS NULL OR YEAR(vr.periodStart) = :year) " +
            "AND (:tenantId IS NULL OR vr.tenantId = :tenantId) " +
            "ORDER BY vr.periodStart DESC")
    Page<VatReport> search(
            @Param("status") VatReport.ReportStatus status,
            @Param("year") Integer year,
            @Param("tenantId") UUID tenantId,
            Pageable pageable);

    /**
     * Get latest report for tenant.
     */
    @Query("SELECT vr FROM VatReport vr WHERE vr.tenantId = :tenantId " +
            "AND vr.deleted = false ORDER BY vr.periodStart DESC LIMIT 1")
    Optional<VatReport> findLatestByTenant(@Param("tenantId") UUID tenantId);

    /**
     * Get latest report (single tenant mode).
     */
    @Query("SELECT vr FROM VatReport vr WHERE vr.deleted = false " +
            "ORDER BY vr.periodStart DESC LIMIT 1")
    Optional<VatReport> findLatest();

    /**
     * Sum VAT payable for a year.
     */
    @Query("SELECT COALESCE(SUM(vr.box16VatPayable), 0) FROM VatReport vr " +
            "WHERE YEAR(vr.periodStart) = :year AND vr.status IN ('SUBMITTED', 'PAID') " +
            "AND vr.deleted = false")
    java.math.BigDecimal sumVatPayableForYear(@Param("year") int year);

    /**
     * Sum VAT refundable for a year.
     */
    @Query("SELECT COALESCE(SUM(vr.box17VatRefundable), 0) FROM VatReport vr " +
            "WHERE YEAR(vr.periodStart) = :year AND vr.status IN ('SUBMITTED', 'PAID') " +
            "AND vr.deleted = false")
    java.math.BigDecimal sumVatRefundableForYear(@Param("year") int year);

    /**
     * Count reports by status.
     */
    @Query("SELECT COUNT(vr) FROM VatReport vr WHERE vr.status = :status AND vr.deleted = false")
    long countByStatus(@Param("status") VatReport.ReportStatus status);

    /**
     * Count reports by status and tenant.
     */
    @Query("SELECT COUNT(vr) FROM VatReport vr WHERE vr.status = :status " +
            "AND vr.tenantId = :tenantId AND vr.deleted = false")
    long countByStatusAndTenant(
            @Param("status") VatReport.ReportStatus status,
            @Param("tenantId") UUID tenantId);

    /**
     * Check if period already exists.
     */
    @Query("SELECT COUNT(vr) > 0 FROM VatReport vr WHERE vr.vatPeriod = :period " +
            "AND vr.deleted = false")
    boolean existsByPeriod(@Param("period") String vatPeriod);

    /**
     * Find reports pending submission for tenant.
     */
    @Query("SELECT vr FROM VatReport vr WHERE vr.status = 'GENERATED' " +
            "AND vr.tenantId = :tenantId AND vr.deleted = false ORDER BY vr.paymentDueDate")
    List<VatReport> findPendingSubmissionByTenant(@Param("tenantId") UUID tenantId);

    /**
     * Find overdue reports for tenant.
     */
    @Query("SELECT vr FROM VatReport vr WHERE vr.status IN ('DRAFT', 'GENERATED') " +
            "AND vr.paymentDueDate < :today AND vr.tenantId = :tenantId AND vr.deleted = false " +
            "ORDER BY vr.paymentDueDate")
    List<VatReport> findOverdueByTenant(
            @Param("today") LocalDate today,
            @Param("tenantId") UUID tenantId);

    /**
     * Sum VAT payable for a year and tenant.
     */
    @Query("SELECT COALESCE(SUM(vr.box16VatPayable), 0) FROM VatReport vr " +
            "WHERE YEAR(vr.periodStart) = :year AND vr.status IN ('SUBMITTED', 'PAID') " +
            "AND vr.tenantId = :tenantId AND vr.deleted = false")
    java.math.BigDecimal sumVatPayableForYearAndTenant(
            @Param("year") int year,
            @Param("tenantId") UUID tenantId);

    /**
     * Sum VAT refundable for a year and tenant.
     */
    @Query("SELECT COALESCE(SUM(vr.box17VatRefundable), 0) FROM VatReport vr " +
            "WHERE YEAR(vr.periodStart) = :year AND vr.status IN ('SUBMITTED', 'PAID') " +
            "AND vr.tenantId = :tenantId AND vr.deleted = false")
    java.math.BigDecimal sumVatRefundableForYearAndTenant(
            @Param("year") int year,
            @Param("tenantId") UUID tenantId);

    /**
     * Find reports with lines (fetch join for reporting).
     */
    @Query("SELECT DISTINCT vr FROM VatReport vr LEFT JOIN FETCH vr.lines " +
            "WHERE vr.id = :id AND vr.deleted = false")
    Optional<VatReport> findByIdWithLines(@Param("id") UUID id);

    /**
     * Find reports with transactions (fetch join for audit).
     */
    @Query("SELECT DISTINCT vr FROM VatReport vr LEFT JOIN FETCH vr.transactions " +
            "WHERE vr.id = :id AND vr.deleted = false")
    Optional<VatReport> findByIdWithTransactions(@Param("id") UUID id);
}
