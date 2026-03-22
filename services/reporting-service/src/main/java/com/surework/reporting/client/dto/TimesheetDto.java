package com.surework.reporting.client.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Timesheet data transfer object from Time & Attendance Service.
 */
public record TimesheetDto(
        UUID id,
        String timesheetReference,
        UUID employeeId,
        String employeeNumber,
        String employeeName,
        UUID departmentId,
        String departmentName,
        String periodType,
        LocalDate periodStart,
        LocalDate periodEnd,
        int periodYear,
        int periodMonth,
        Integer periodWeek,
        BigDecimal totalHours,
        BigDecimal regularHours,
        BigDecimal overtimeHours,
        BigDecimal nightHours,
        BigDecimal sundayHours,
        BigDecimal publicHolidayHours,
        BigDecimal annualLeaveHours,
        BigDecimal sickLeaveHours,
        BigDecimal familyLeaveHours,
        BigDecimal unpaidLeaveHours,
        int daysWorked,
        int daysAbsent,
        int daysLate,
        int earlyDepartures,
        int workingDaysInPeriod,
        String status,
        LocalDateTime submittedAt,
        UUID submittedBy,
        LocalDateTime approvedAt,
        UUID approvedBy,
        boolean payrollProcessed,
        UUID payrollRunId
) {}
