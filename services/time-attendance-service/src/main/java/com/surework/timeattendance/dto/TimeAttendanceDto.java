package com.surework.timeattendance.dto;

import com.surework.timeattendance.domain.*;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

/**
 * DTOs for Time and Attendance operations.
 */
public sealed interface TimeAttendanceDto {

    // === Clock In/Out DTOs ===

    record ClockInRequest(
            @NotNull(message = "Employee ID is required")
            UUID employeeId,

            LocalDateTime clockTime,  // Optional, defaults to now
            TimeEntry.ClockMethod clockMethod,
            BigDecimal latitude,
            BigDecimal longitude,
            String location,
            String deviceId,
            String ipAddress,
            String notes
    ) implements TimeAttendanceDto {}

    record ClockOutRequest(
            @NotNull(message = "Employee ID is required")
            UUID employeeId,

            LocalDateTime clockTime,  // Optional, defaults to now
            BigDecimal latitude,
            BigDecimal longitude,
            String location,
            String notes
    ) implements TimeAttendanceDto {}

    record BreakRequest(
            @NotNull(message = "Time entry ID is required")
            UUID timeEntryId,

            LocalDateTime breakTime  // Optional, defaults to now
    ) implements TimeAttendanceDto {}

    // === Time Entry DTOs ===

    record CreateTimeEntryRequest(
            @NotNull(message = "Employee ID is required")
            UUID employeeId,

            @NotNull(message = "Work date is required")
            LocalDate workDate,

            @NotNull(message = "Clock in time is required")
            LocalDateTime clockIn,

            LocalDateTime clockOut,

            TimeEntry.EntryType entryType,
            Integer breakDurationMinutes,
            String notes,
            boolean requiresApproval
    ) implements TimeAttendanceDto {}

    record UpdateTimeEntryRequest(
            LocalDateTime clockIn,
            LocalDateTime clockOut,
            Integer breakDurationMinutes,
            TimeEntry.EntryType entryType,
            String notes,
            String editReason
    ) implements TimeAttendanceDto {}

    record TimeEntryResponse(
            UUID id,
            UUID employeeId,
            String employeeNumber,
            String employeeName,
            LocalDate workDate,
            LocalDateTime clockIn,
            LocalDateTime clockOut,
            LocalTime scheduledStart,
            LocalTime scheduledEnd,
            TimeEntry.EntryType entryType,
            TimeEntry.TimeEntryStatus status,
            BigDecimal totalHours,
            BigDecimal regularHours,
            BigDecimal overtimeHours,
            BigDecimal nightHours,
            BigDecimal sundayHours,
            BigDecimal publicHolidayHours,
            Integer breakDurationMinutes,
            boolean late,
            Integer lateMinutes,
            boolean earlyDeparture,
            Integer earlyDepartureMinutes,
            boolean publicHoliday,
            String publicHolidayName,
            String clockInLocation,
            String clockOutLocation,
            TimeEntry.ClockMethod clockMethod,
            String notes,
            boolean requiresApproval,
            UUID approvedBy,
            Instant approvedAt,
            boolean edited,
            Instant createdAt
    ) implements TimeAttendanceDto {

        public static TimeEntryResponse fromEntity(TimeEntry entry) {
            return new TimeEntryResponse(
                    entry.getId(),
                    entry.getEmployeeId(),
                    entry.getEmployeeNumber(),
                    entry.getEmployeeName(),
                    entry.getWorkDate(),
                    entry.getClockIn(),
                    entry.getClockOut(),
                    entry.getScheduledStart(),
                    entry.getScheduledEnd(),
                    entry.getEntryType(),
                    entry.getStatus(),
                    entry.getTotalHours(),
                    entry.getRegularHours(),
                    entry.getOvertimeHours(),
                    entry.getNightHours(),
                    entry.getSundayHours(),
                    entry.getPublicHolidayHours(),
                    entry.getBreakDurationMinutes(),
                    entry.isLate(),
                    entry.getLateMinutes(),
                    entry.isEarlyDeparture(),
                    entry.getEarlyDepartureMinutes(),
                    entry.isPublicHoliday(),
                    entry.getPublicHolidayName(),
                    entry.getClockInLocation(),
                    entry.getClockOutLocation(),
                    entry.getClockMethod(),
                    entry.getNotes(),
                    entry.isRequiresApproval(),
                    entry.getApprovedBy(),
                    entry.getApprovedAt(),
                    entry.isEdited(),
                    entry.getCreatedAt()
            );
        }
    }

    // === Timesheet DTOs ===

    record CreateTimesheetRequest(
            @NotNull(message = "Employee ID is required")
            UUID employeeId,

            @NotNull(message = "Period type is required")
            Timesheet.PeriodType periodType,

            @NotNull(message = "Period start is required")
            LocalDate periodStart,

            @NotNull(message = "Period end is required")
            LocalDate periodEnd,

            String employeeNotes
    ) implements TimeAttendanceDto {}

    record TimesheetResponse(
            UUID id,
            String timesheetReference,
            UUID employeeId,
            String employeeNumber,
            String employeeName,
            String departmentName,
            Timesheet.PeriodType periodType,
            LocalDate periodStart,
            LocalDate periodEnd,
            int periodYear,
            int periodMonth,
            BigDecimal totalHours,
            BigDecimal regularHours,
            BigDecimal overtimeHours,
            BigDecimal nightHours,
            BigDecimal sundayHours,
            BigDecimal publicHolidayHours,
            BigDecimal annualLeaveHours,
            BigDecimal sickLeaveHours,
            int daysWorked,
            int daysAbsent,
            int daysLate,
            int workingDaysInPeriod,
            BigDecimal attendancePercentage,
            Timesheet.TimesheetStatus status,
            Instant submittedAt,
            Instant approvedAt,
            String approverName,
            boolean payrollProcessed,
            String employeeNotes,
            String managerNotes,
            Instant createdAt
    ) implements TimeAttendanceDto {

        public static TimesheetResponse fromEntity(Timesheet ts) {
            return new TimesheetResponse(
                    ts.getId(),
                    ts.getTimesheetReference(),
                    ts.getEmployeeId(),
                    ts.getEmployeeNumber(),
                    ts.getEmployeeName(),
                    ts.getDepartmentName(),
                    ts.getPeriodType(),
                    ts.getPeriodStart(),
                    ts.getPeriodEnd(),
                    ts.getPeriodYear(),
                    ts.getPeriodMonth(),
                    ts.getTotalHours(),
                    ts.getRegularHours(),
                    ts.getOvertimeHours(),
                    ts.getNightHours(),
                    ts.getSundayHours(),
                    ts.getPublicHolidayHours(),
                    ts.getAnnualLeaveHours(),
                    ts.getSickLeaveHours(),
                    ts.getDaysWorked(),
                    ts.getDaysAbsent(),
                    ts.getDaysLate(),
                    ts.getWorkingDaysInPeriod(),
                    ts.getAttendancePercentage(),
                    ts.getStatus(),
                    ts.getSubmittedAt(),
                    ts.getApprovedAt(),
                    null, // Would need to fetch approver name
                    ts.isPayrollProcessed(),
                    ts.getEmployeeNotes(),
                    ts.getManagerNotes(),
                    ts.getCreatedAt()
            );
        }
    }

    // === Work Schedule DTOs ===

    record CreateScheduleRequest(
            @NotNull(message = "Employee ID is required")
            UUID employeeId,

            @NotNull(message = "Schedule type is required")
            WorkSchedule.ScheduleType scheduleType,

            LocalTime standardStartTime,
            LocalTime standardEndTime,
            int hoursPerDay,
            int hoursPerWeek,

            boolean worksMonday,
            boolean worksTuesday,
            boolean worksWednesday,
            boolean worksThursday,
            boolean worksFriday,
            boolean worksSaturday,
            boolean worksSunday,

            boolean flexible,
            LocalTime flexStartEarliest,
            LocalTime flexStartLatest,
            LocalTime coreHoursStart,
            LocalTime coreHoursEnd,

            LocalTime lunchBreakStart,
            int lunchBreakDurationMinutes,
            boolean lunchBreakPaid,

            @NotNull(message = "Effective from date is required")
            LocalDate effectiveFrom,

            LocalDate effectiveTo,
            String notes
    ) implements TimeAttendanceDto {}

    record ScheduleResponse(
            UUID id,
            UUID employeeId,
            String employeeNumber,
            String employeeName,
            UUID shiftId,
            String shiftName,
            WorkSchedule.ScheduleType scheduleType,
            LocalTime standardStartTime,
            LocalTime standardEndTime,
            int hoursPerDay,
            int hoursPerWeek,
            boolean worksMonday,
            boolean worksTuesday,
            boolean worksWednesday,
            boolean worksThursday,
            boolean worksFriday,
            boolean worksSaturday,
            boolean worksSunday,
            int workingDaysPerWeek,
            boolean flexible,
            LocalTime lunchBreakStart,
            int lunchBreakDurationMinutes,
            LocalDate effectiveFrom,
            LocalDate effectiveTo,
            boolean active,
            Instant createdAt
    ) implements TimeAttendanceDto {

        public static ScheduleResponse fromEntity(WorkSchedule schedule) {
            return new ScheduleResponse(
                    schedule.getId(),
                    schedule.getEmployeeId(),
                    schedule.getEmployeeNumber(),
                    schedule.getEmployeeName(),
                    schedule.getShiftId(),
                    schedule.getShiftName(),
                    schedule.getScheduleType(),
                    schedule.getStandardStartTime(),
                    schedule.getStandardEndTime(),
                    schedule.getHoursPerDay(),
                    schedule.getHoursPerWeek(),
                    schedule.isWorksMonday(),
                    schedule.isWorksTuesday(),
                    schedule.isWorksWednesday(),
                    schedule.isWorksThursday(),
                    schedule.isWorksFriday(),
                    schedule.isWorksSaturday(),
                    schedule.isWorksSunday(),
                    schedule.getWorkingDaysPerWeek(),
                    schedule.isFlexible(),
                    schedule.getLunchBreakStart(),
                    schedule.getLunchBreakDurationMinutes(),
                    schedule.getEffectiveFrom(),
                    schedule.getEffectiveTo(),
                    schedule.isActive(),
                    schedule.getCreatedAt()
            );
        }
    }

    // === Public Holiday DTOs ===

    record PublicHolidayResponse(
            UUID id,
            String name,
            LocalDate holidayDate,
            int year,
            PublicHoliday.HolidayType holidayType,
            String description,
            boolean substitute,
            LocalDate originalDate
    ) implements TimeAttendanceDto {

        public static PublicHolidayResponse fromEntity(PublicHoliday holiday) {
            return new PublicHolidayResponse(
                    holiday.getId(),
                    holiday.getName(),
                    holiday.getHolidayDate(),
                    holiday.getYear(),
                    holiday.getHolidayType(),
                    holiday.getDescription(),
                    holiday.isSubstitute(),
                    holiday.getOriginalDate()
            );
        }
    }

    // === Dashboard/Summary DTOs ===

    record AttendanceDashboard(
            LocalDate date,
            int totalEmployees,
            int presentToday,
            int absentToday,
            int lateToday,
            int onLeaveToday,
            BigDecimal averageHoursToday,
            List<TimeEntryResponse> recentClockIns,
            List<TimeEntryResponse> pendingApprovals
    ) implements TimeAttendanceDto {}

    record EmployeeAttendanceSummary(
            UUID employeeId,
            String employeeNumber,
            String employeeName,
            LocalDate periodStart,
            LocalDate periodEnd,
            int daysWorked,
            int daysAbsent,
            int daysLate,
            int daysOnLeave,
            BigDecimal totalHours,
            BigDecimal regularHours,
            BigDecimal overtimeHours,
            BigDecimal attendancePercentage
    ) implements TimeAttendanceDto {}

    record DailyAttendanceSummary(
            LocalDate date,
            int presentCount,
            int absentCount,
            int lateCount,
            int onLeaveCount,
            BigDecimal totalHoursWorked,
            BigDecimal totalOvertimeHours,
            boolean isWeekend,
            boolean isPublicHoliday,
            String publicHolidayName
    ) implements TimeAttendanceDto {}

    record OvertimeReport(
            LocalDate periodStart,
            LocalDate periodEnd,
            List<EmployeeOvertimeSummary> employees,
            BigDecimal totalOvertimeHours,
            BigDecimal totalSundayHours,
            BigDecimal totalPublicHolidayHours,
            BigDecimal totalNightHours
    ) implements TimeAttendanceDto {}

    record EmployeeOvertimeSummary(
            UUID employeeId,
            String employeeNumber,
            String employeeName,
            BigDecimal weekdayOvertimeHours,
            BigDecimal sundayHours,
            BigDecimal publicHolidayHours,
            BigDecimal nightHours,
            BigDecimal totalOvertimeHours
    ) implements TimeAttendanceDto {}

    // === Approval DTOs ===

    record ApprovalRequest(
            String notes
    ) implements TimeAttendanceDto {}

    record RejectionRequest(
            @NotBlank(message = "Rejection reason is required")
            String reason,

            String notes
    ) implements TimeAttendanceDto {}

    // === Bulk Operations ===

    record BulkClockOutRequest(
            List<UUID> employeeIds,
            LocalDateTime clockOutTime,
            String reason
    ) implements TimeAttendanceDto {}

    record GenerateTimesheetsRequest(
            @NotNull(message = "Period start is required")
            LocalDate periodStart,

            @NotNull(message = "Period end is required")
            LocalDate periodEnd,

            Timesheet.PeriodType periodType,
            List<UUID> employeeIds  // Optional, if null generate for all
    ) implements TimeAttendanceDto {}
}
