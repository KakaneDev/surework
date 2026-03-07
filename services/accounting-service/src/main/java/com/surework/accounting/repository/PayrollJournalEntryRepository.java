package com.surework.accounting.repository;

import com.surework.accounting.domain.PayrollJournalEntry;
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
 * Repository for PayrollJournalEntry entities.
 */
@Repository
public interface PayrollJournalEntryRepository extends JpaRepository<PayrollJournalEntry, UUID> {

    /**
     * Find by payroll run ID (for idempotency check).
     */
    Optional<PayrollJournalEntry> findByPayrollRunId(UUID payrollRunId);

    /**
     * Check if a payroll run has already been journaled.
     */
    boolean existsByPayrollRunId(UUID payrollRunId);

    /**
     * Find by period.
     */
    @Query("SELECT e FROM PayrollJournalEntry e " +
            "WHERE e.periodYear = :year AND e.periodMonth = :month " +
            "ORDER BY e.createdAt DESC")
    List<PayrollJournalEntry> findByPeriod(
            @Param("year") int year,
            @Param("month") int month);

    /**
     * Find by year.
     */
    @Query("SELECT e FROM PayrollJournalEntry e " +
            "WHERE e.periodYear = :year " +
            "ORDER BY e.periodMonth DESC, e.createdAt DESC")
    List<PayrollJournalEntry> findByYear(@Param("year") int year);

    /**
     * Find recent entries.
     */
    @Query("SELECT e FROM PayrollJournalEntry e " +
            "ORDER BY e.createdAt DESC")
    Page<PayrollJournalEntry> findRecent(Pageable pageable);

    /**
     * Find by status.
     */
    @Query("SELECT e FROM PayrollJournalEntry e " +
            "WHERE e.status = :status " +
            "ORDER BY e.createdAt DESC")
    List<PayrollJournalEntry> findByStatus(@Param("status") PayrollJournalEntry.Status status);

    /**
     * Find by tenant.
     */
    @Query("SELECT e FROM PayrollJournalEntry e " +
            "WHERE e.tenantId = :tenantId " +
            "ORDER BY e.createdAt DESC")
    Page<PayrollJournalEntry> findByTenant(@Param("tenantId") UUID tenantId, Pageable pageable);

    /**
     * Get total gross for a year (tenant-scoped).
     */
    @Query("SELECT COALESCE(SUM(e.totalGross), 0) FROM PayrollJournalEntry e " +
            "WHERE e.periodYear = :year AND e.tenantId = :tenantId AND e.status != 'REVERSED'")
    java.math.BigDecimal sumGrossByYearAndTenant(
            @Param("year") int year,
            @Param("tenantId") UUID tenantId);

    /**
     * Get total PAYE for a year (tenant-scoped).
     */
    @Query("SELECT COALESCE(SUM(e.totalPaye), 0) FROM PayrollJournalEntry e " +
            "WHERE e.periodYear = :year AND e.tenantId = :tenantId AND e.status != 'REVERSED'")
    java.math.BigDecimal sumPayeByYearAndTenant(
            @Param("year") int year,
            @Param("tenantId") UUID tenantId);

    /**
     * Get total employer cost for a year (tenant-scoped).
     */
    @Query("SELECT COALESCE(SUM(e.totalEmployerCost), 0) FROM PayrollJournalEntry e " +
            "WHERE e.periodYear = :year AND e.tenantId = :tenantId AND e.status != 'REVERSED'")
    java.math.BigDecimal sumEmployerCostByYearAndTenant(
            @Param("year") int year,
            @Param("tenantId") UUID tenantId);

    /**
     * Find by year (tenant-scoped).
     */
    @Query("SELECT e FROM PayrollJournalEntry e " +
            "WHERE e.periodYear = :year AND e.tenantId = :tenantId " +
            "ORDER BY e.periodMonth DESC, e.createdAt DESC")
    List<PayrollJournalEntry> findByYearAndTenant(
            @Param("year") int year,
            @Param("tenantId") UUID tenantId);

    /**
     * Find recent entries (tenant-scoped).
     */
    @Query("SELECT e FROM PayrollJournalEntry e " +
            "WHERE e.tenantId = :tenantId " +
            "ORDER BY e.createdAt DESC")
    Page<PayrollJournalEntry> findRecentByTenant(
            @Param("tenantId") UUID tenantId,
            Pageable pageable);

    /**
     * Get YTD summary in a single query for dashboard optimization (tenant-scoped).
     */
    @Query("SELECT new com.surework.accounting.dto.PayrollYtdSummary(" +
            "COALESCE(SUM(e.totalGross), 0), " +
            "COALESCE(SUM(e.totalPaye), 0), " +
            "COALESCE(SUM(e.totalEmployerCost), 0), " +
            "COUNT(e)) " +
            "FROM PayrollJournalEntry e " +
            "WHERE e.periodYear = :year AND e.tenantId = :tenantId AND e.status != 'REVERSED'")
    com.surework.accounting.dto.PayrollYtdSummary getYtdSummary(
            @Param("year") int year,
            @Param("tenantId") UUID tenantId);
}
