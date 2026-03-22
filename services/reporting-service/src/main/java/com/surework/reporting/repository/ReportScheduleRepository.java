package com.surework.reporting.repository;

import com.surework.reporting.domain.Report;
import com.surework.reporting.domain.ReportSchedule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ReportScheduleRepository extends JpaRepository<ReportSchedule, UUID> {

    List<ReportSchedule> findByTenantIdAndActiveTrue(UUID tenantId);

    Page<ReportSchedule> findByTenantId(UUID tenantId, Pageable pageable);

    Page<ReportSchedule> findByTenantIdAndActive(UUID tenantId, boolean active, Pageable pageable);

    List<ReportSchedule> findByTenantIdAndReportType(UUID tenantId, Report.ReportType reportType);

    // Find schedules due for execution
    @Query("SELECT s FROM ReportSchedule s WHERE s.active = true " +
           "AND s.nextRunAt IS NOT NULL AND s.nextRunAt <= :now")
    List<ReportSchedule> findDueSchedules(@Param("now") LocalDateTime now);

    // Find schedules by frequency
    List<ReportSchedule> findByTenantIdAndFrequency(UUID tenantId, ReportSchedule.ScheduleFrequency frequency);

    // Find schedules with recent failures
    @Query("SELECT s FROM ReportSchedule s WHERE s.tenantId = :tenantId " +
           "AND s.lastRunStatus = 'FAILED' AND s.active = true")
    List<ReportSchedule> findFailedSchedules(@Param("tenantId") UUID tenantId);

    // Count active schedules
    long countByTenantIdAndActiveTrue(UUID tenantId);

    // Find schedules created by user
    List<ReportSchedule> findByTenantIdAndCreatedBy(UUID tenantId, UUID createdBy);
}
