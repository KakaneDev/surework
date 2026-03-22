package com.surework.reporting.repository;

import com.surework.reporting.domain.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReportRepository extends JpaRepository<Report, UUID> {

    Optional<Report> findByReference(String reference);

    List<Report> findByTenantIdAndCreatedByOrderByCreatedAtDesc(UUID tenantId, UUID createdBy);

    Page<Report> findByTenantId(UUID tenantId, Pageable pageable);

    Page<Report> findByTenantIdAndCategory(UUID tenantId, Report.ReportCategory category, Pageable pageable);

    Page<Report> findByTenantIdAndStatus(UUID tenantId, Report.ReportStatus status, Pageable pageable);

    Page<Report> findByTenantIdAndReportType(UUID tenantId, Report.ReportType reportType, Pageable pageable);

    @Query("SELECT r FROM Report r WHERE r.tenantId = :tenantId " +
           "AND (:category IS NULL OR r.category = :category) " +
           "AND (:status IS NULL OR r.status = :status) " +
           "AND (:reportType IS NULL OR r.reportType = :reportType) " +
           "AND (:createdBy IS NULL OR r.createdBy = :createdBy) " +
           "ORDER BY r.createdAt DESC")
    Page<Report> searchReports(
            @Param("tenantId") UUID tenantId,
            @Param("category") Report.ReportCategory category,
            @Param("status") Report.ReportStatus status,
            @Param("reportType") Report.ReportType reportType,
            @Param("createdBy") UUID createdBy,
            Pageable pageable);

    // Find reports pending processing
    List<Report> findByStatusOrderByRequestedAtAsc(Report.ReportStatus status);

    // Find failed reports that can be retried
    @Query("SELECT r FROM Report r WHERE r.status = 'FAILED' AND r.retryCount < 3")
    List<Report> findRetryableReports();

    // Find expired reports
    @Query("SELECT r FROM Report r WHERE r.status = 'COMPLETED' " +
           "AND r.expiresAt IS NOT NULL AND r.expiresAt < :now")
    List<Report> findExpiredReports(@Param("now") LocalDateTime now);

    // Count by status for dashboard
    @Query("SELECT r.status, COUNT(r) FROM Report r WHERE r.tenantId = :tenantId " +
           "GROUP BY r.status")
    List<Object[]> countByStatusForTenant(@Param("tenantId") UUID tenantId);

    // Count by category for dashboard
    @Query("SELECT r.category, COUNT(r) FROM Report r WHERE r.tenantId = :tenantId " +
           "AND r.createdAt >= :since GROUP BY r.category")
    List<Object[]> countByCategoryForTenant(@Param("tenantId") UUID tenantId,
                                             @Param("since") LocalDateTime since);

    // Recent reports
    List<Report> findTop10ByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    // Reports by schedule
    List<Report> findByScheduleIdOrderByCreatedAtDesc(UUID scheduleId);

    // Delete old reports
    @Modifying
    @Query("DELETE FROM Report r WHERE r.status = 'EXPIRED' " +
           "AND r.completedAt < :before")
    int deleteExpiredReportsBefore(@Param("before") LocalDateTime before);

    // Statistics
    @Query("SELECT COUNT(r) FROM Report r WHERE r.tenantId = :tenantId " +
           "AND r.createdAt >= :since")
    long countReportsGeneratedSince(@Param("tenantId") UUID tenantId,
                                    @Param("since") LocalDateTime since);

    @Query("SELECT AVG(r.generationTimeMs) FROM Report r WHERE r.tenantId = :tenantId " +
           "AND r.status = 'COMPLETED' AND r.createdAt >= :since")
    Double averageGenerationTimeMs(@Param("tenantId") UUID tenantId,
                                   @Param("since") LocalDateTime since);
}
