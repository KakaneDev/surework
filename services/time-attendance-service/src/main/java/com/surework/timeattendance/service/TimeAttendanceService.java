package com.surework.timeattendance.service;

import com.surework.timeattendance.domain.*;
import com.surework.timeattendance.dto.TimeAttendanceDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service interface for time and attendance operations.
 * Compliant with South African BCEA regulations.
 */
public interface TimeAttendanceService {

    // === Clock In/Out Operations ===

    TimeAttendanceDto.TimeEntryResponse clockIn(TimeAttendanceDto.ClockInRequest request);

    TimeAttendanceDto.TimeEntryResponse clockOut(TimeAttendanceDto.ClockOutRequest request);

    TimeAttendanceDto.TimeEntryResponse startBreak(TimeAttendanceDto.BreakRequest request);

    TimeAttendanceDto.TimeEntryResponse endBreak(TimeAttendanceDto.BreakRequest request);

    Optional<TimeAttendanceDto.TimeEntryResponse> getActiveEntry(UUID employeeId);

    boolean isClockedIn(UUID employeeId);

    // === Time Entry Operations ===

    TimeAttendanceDto.TimeEntryResponse createTimeEntry(TimeAttendanceDto.CreateTimeEntryRequest request);

    TimeAttendanceDto.TimeEntryResponse updateTimeEntry(UUID entryId, TimeAttendanceDto.UpdateTimeEntryRequest request, UUID editorId);

    Optional<TimeAttendanceDto.TimeEntryResponse> getTimeEntry(UUID entryId);

    List<TimeAttendanceDto.TimeEntryResponse> getEntriesForEmployee(UUID employeeId, LocalDate startDate, LocalDate endDate);

    List<TimeAttendanceDto.TimeEntryResponse> getEntriesForDate(LocalDate date);

    Page<TimeAttendanceDto.TimeEntryResponse> searchTimeEntries(
            UUID employeeId,
            TimeEntry.TimeEntryStatus status,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable);

    void deleteTimeEntry(UUID entryId);

    // === Time Entry Approvals ===

    TimeAttendanceDto.TimeEntryResponse submitForApproval(UUID entryId);

    TimeAttendanceDto.TimeEntryResponse approveTimeEntry(UUID entryId, UUID approverId, String notes);

    TimeAttendanceDto.TimeEntryResponse rejectTimeEntry(UUID entryId, UUID approverId, String reason);

    List<TimeAttendanceDto.TimeEntryResponse> getPendingApprovals();

    List<TimeAttendanceDto.TimeEntryResponse> getPendingApprovalsForEmployees(List<UUID> employeeIds);

    // === Timesheet Operations ===

    TimeAttendanceDto.TimesheetResponse createTimesheet(TimeAttendanceDto.CreateTimesheetRequest request);

    TimeAttendanceDto.TimesheetResponse generateTimesheet(UUID employeeId, LocalDate periodStart, LocalDate periodEnd);

    List<TimeAttendanceDto.TimesheetResponse> generateTimesheets(TimeAttendanceDto.GenerateTimesheetsRequest request);

    Optional<TimeAttendanceDto.TimesheetResponse> getTimesheet(UUID timesheetId);

    Optional<TimeAttendanceDto.TimesheetResponse> getTimesheetByReference(String reference);

    List<TimeAttendanceDto.TimesheetResponse> getTimesheetsForEmployee(UUID employeeId);

    Page<TimeAttendanceDto.TimesheetResponse> searchTimesheets(
            UUID employeeId,
            UUID departmentId,
            Timesheet.TimesheetStatus status,
            Integer year,
            Integer month,
            Pageable pageable);

    // === Timesheet Workflow ===

    TimeAttendanceDto.TimesheetResponse submitTimesheet(UUID timesheetId, UUID submitterId);

    TimeAttendanceDto.TimesheetResponse approveTimesheet(UUID timesheetId, UUID approverId, String notes);

    TimeAttendanceDto.TimesheetResponse rejectTimesheet(UUID timesheetId, UUID reviewerId, String reason);

    List<TimeAttendanceDto.TimesheetResponse> getPendingTimesheetApprovals();

    List<TimeAttendanceDto.TimesheetResponse> getApprovedTimesheetsForPayroll(int year, int month);

    void markTimesheetsAsProcessed(List<UUID> timesheetIds, UUID payrollRunId);

    // === Work Schedule Operations ===

    TimeAttendanceDto.ScheduleResponse createSchedule(TimeAttendanceDto.CreateScheduleRequest request);

    TimeAttendanceDto.ScheduleResponse updateSchedule(UUID scheduleId, TimeAttendanceDto.CreateScheduleRequest request);

    Optional<TimeAttendanceDto.ScheduleResponse> getSchedule(UUID scheduleId);

    Optional<TimeAttendanceDto.ScheduleResponse> getCurrentScheduleForEmployee(UUID employeeId);

    List<TimeAttendanceDto.ScheduleResponse> getSchedulesForEmployee(UUID employeeId);

    void deactivateSchedule(UUID scheduleId, LocalDate endDate);

    // === Public Holiday Operations ===

    List<TimeAttendanceDto.PublicHolidayResponse> getPublicHolidaysForYear(int year);

    List<TimeAttendanceDto.PublicHolidayResponse> getPublicHolidaysInRange(LocalDate startDate, LocalDate endDate);

    boolean isPublicHoliday(LocalDate date);

    void generatePublicHolidaysForYear(int year);

    // === Dashboard & Reporting ===

    TimeAttendanceDto.AttendanceDashboard getDashboard();

    TimeAttendanceDto.EmployeeAttendanceSummary getEmployeeAttendanceSummary(UUID employeeId, LocalDate periodStart, LocalDate periodEnd);

    List<TimeAttendanceDto.DailyAttendanceSummary> getDailyAttendanceSummary(LocalDate startDate, LocalDate endDate);

    TimeAttendanceDto.OvertimeReport getOvertimeReport(LocalDate periodStart, LocalDate periodEnd);

    // === Utility Operations ===

    int calculateWorkingDays(LocalDate startDate, LocalDate endDate);

    void autoClockOutForgottenEntries();
}
