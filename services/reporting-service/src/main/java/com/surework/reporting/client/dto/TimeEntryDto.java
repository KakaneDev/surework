package com.surework.reporting.client.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Time Entry data transfer object from Time & Attendance Service.
 */
public record TimeEntryDto(
        UUID id,
        UUID employeeId,
        String employeeNumber,
        String employeeName,
        LocalDate workDate,
        LocalDateTime clockIn,
        LocalDateTime clockOut,
        LocalTime scheduledStart,
        LocalTime scheduledEnd,
        String entryType,
        String status,
        BigDecimal totalHours,
        BigDecimal regularHours,
        BigDecimal overtimeHours,
        BigDecimal nightHours,
        BigDecimal sundayHours,
        BigDecimal publicHolidayHours,
        boolean late,
        int lateMinutes,
        boolean earlyDeparture,
        int earlyMinutes,
        String clockMethod,
        BigDecimal clockInLatitude,
        BigDecimal clockInLongitude,
        String clockInLocation,
        BigDecimal clockOutLatitude,
        BigDecimal clockOutLongitude,
        String clockOutLocation,
        String notes
) {}
