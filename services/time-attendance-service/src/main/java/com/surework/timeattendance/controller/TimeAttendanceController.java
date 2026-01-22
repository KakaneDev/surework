package com.surework.timeattendance.controller;

import com.surework.timeattendance.domain.*;
import com.surework.timeattendance.dto.TimeAttendanceDto;
import com.surework.timeattendance.service.TimeAttendanceService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for time and attendance operations.
 */
@RestController
@RequestMapping("/api/time-attendance")
public class TimeAttendanceController {

    private final TimeAttendanceService timeAttendanceService;

    public TimeAttendanceController(TimeAttendanceService timeAttendanceService) {
        this.timeAttendanceService = timeAttendanceService;
    }

    // === Clock In/Out Endpoints ===

    @PostMapping("/clock-in")
    public ResponseEntity<TimeAttendanceDto.TimeEntryResponse> clockIn(
            @Valid @RequestBody TimeAttendanceDto.ClockInRequest request) {
        TimeAttendanceDto.TimeEntryResponse response = timeAttendanceService.clockIn(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/clock-out")
    public ResponseEntity<TimeAttendanceDto.TimeEntryResponse> clockOut(
            @Valid @RequestBody TimeAttendanceDto.ClockOutRequest request) {
        TimeAttendanceDto.TimeEntryResponse response = timeAttendanceService.clockOut(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/break/start")
    public ResponseEntity<TimeAttendanceDto.TimeEntryResponse> startBreak(
            @Valid @RequestBody TimeAttendanceDto.BreakRequest request) {
        TimeAttendanceDto.TimeEntryResponse response = timeAttendanceService.startBreak(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/break/end")
    public ResponseEntity<TimeAttendanceDto.TimeEntryResponse> endBreak(
            @Valid @RequestBody TimeAttendanceDto.BreakRequest request) {
        TimeAttendanceDto.TimeEntryResponse response = timeAttendanceService.endBreak(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/employees/{employeeId}/active")
    public ResponseEntity<TimeAttendanceDto.TimeEntryResponse> getActiveEntry(
            @PathVariable UUID employeeId) {
        return timeAttendanceService.getActiveEntry(employeeId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employees/{employeeId}/clocked-in")
    public ResponseEntity<Boolean> isClockedIn(@PathVariable UUID employeeId) {
        boolean isClockedIn = timeAttendanceService.isClockedIn(employeeId);
        return ResponseEntity.ok(isClockedIn);
    }

    // === Time Entry Endpoints ===

    @PostMapping("/entries")
    public ResponseEntity<TimeAttendanceDto.TimeEntryResponse> createTimeEntry(
            @Valid @RequestBody TimeAttendanceDto.CreateTimeEntryRequest request) {
        TimeAttendanceDto.TimeEntryResponse response = timeAttendanceService.createTimeEntry(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/entries/{entryId}")
    public ResponseEntity<TimeAttendanceDto.TimeEntryResponse> updateTimeEntry(
            @PathVariable UUID entryId,
            @Valid @RequestBody TimeAttendanceDto.UpdateTimeEntryRequest request,
            @RequestParam UUID editorId) {
        TimeAttendanceDto.TimeEntryResponse response = timeAttendanceService.updateTimeEntry(
                entryId, request, editorId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/entries/{entryId}")
    public ResponseEntity<TimeAttendanceDto.TimeEntryResponse> getTimeEntry(@PathVariable UUID entryId) {
        return timeAttendanceService.getTimeEntry(entryId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employees/{employeeId}/entries")
    public ResponseEntity<List<TimeAttendanceDto.TimeEntryResponse>> getEntriesForEmployee(
            @PathVariable UUID employeeId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        List<TimeAttendanceDto.TimeEntryResponse> entries = timeAttendanceService.getEntriesForEmployee(
                employeeId, startDate, endDate);
        return ResponseEntity.ok(entries);
    }

    @GetMapping("/entries/date/{date}")
    public ResponseEntity<List<TimeAttendanceDto.TimeEntryResponse>> getEntriesForDate(
            @PathVariable LocalDate date) {
        List<TimeAttendanceDto.TimeEntryResponse> entries = timeAttendanceService.getEntriesForDate(date);
        return ResponseEntity.ok(entries);
    }

    @GetMapping("/entries")
    public ResponseEntity<Page<TimeAttendanceDto.TimeEntryResponse>> searchTimeEntries(
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false) TimeEntry.TimeEntryStatus status,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            Pageable pageable) {
        Page<TimeAttendanceDto.TimeEntryResponse> entries = timeAttendanceService.searchTimeEntries(
                employeeId, status, startDate, endDate, pageable);
        return ResponseEntity.ok(entries);
    }

    @DeleteMapping("/entries/{entryId}")
    public ResponseEntity<Void> deleteTimeEntry(@PathVariable UUID entryId) {
        timeAttendanceService.deleteTimeEntry(entryId);
        return ResponseEntity.noContent().build();
    }

    // === Time Entry Approval Endpoints ===

    @PostMapping("/entries/{entryId}/submit")
    public ResponseEntity<TimeAttendanceDto.TimeEntryResponse> submitForApproval(
            @PathVariable UUID entryId) {
        TimeAttendanceDto.TimeEntryResponse response = timeAttendanceService.submitForApproval(entryId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/entries/{entryId}/approve")
    public ResponseEntity<TimeAttendanceDto.TimeEntryResponse> approveTimeEntry(
            @PathVariable UUID entryId,
            @RequestParam UUID approverId,
            @RequestBody(required = false) TimeAttendanceDto.ApprovalRequest request) {
        String notes = request != null ? request.notes() : null;
        TimeAttendanceDto.TimeEntryResponse response = timeAttendanceService.approveTimeEntry(
                entryId, approverId, notes);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/entries/{entryId}/reject")
    public ResponseEntity<TimeAttendanceDto.TimeEntryResponse> rejectTimeEntry(
            @PathVariable UUID entryId,
            @RequestParam UUID approverId,
            @Valid @RequestBody TimeAttendanceDto.RejectionRequest request) {
        TimeAttendanceDto.TimeEntryResponse response = timeAttendanceService.rejectTimeEntry(
                entryId, approverId, request.reason());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/entries/pending-approval")
    public ResponseEntity<List<TimeAttendanceDto.TimeEntryResponse>> getPendingApprovals() {
        List<TimeAttendanceDto.TimeEntryResponse> entries = timeAttendanceService.getPendingApprovals();
        return ResponseEntity.ok(entries);
    }

    // === Timesheet Endpoints ===

    @PostMapping("/timesheets")
    public ResponseEntity<TimeAttendanceDto.TimesheetResponse> createTimesheet(
            @Valid @RequestBody TimeAttendanceDto.CreateTimesheetRequest request) {
        TimeAttendanceDto.TimesheetResponse response = timeAttendanceService.createTimesheet(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/timesheets/generate")
    public ResponseEntity<TimeAttendanceDto.TimesheetResponse> generateTimesheet(
            @RequestParam UUID employeeId,
            @RequestParam LocalDate periodStart,
            @RequestParam LocalDate periodEnd) {
        TimeAttendanceDto.TimesheetResponse response = timeAttendanceService.generateTimesheet(
                employeeId, periodStart, periodEnd);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/timesheets/generate-bulk")
    public ResponseEntity<List<TimeAttendanceDto.TimesheetResponse>> generateTimesheets(
            @Valid @RequestBody TimeAttendanceDto.GenerateTimesheetsRequest request) {
        List<TimeAttendanceDto.TimesheetResponse> responses = timeAttendanceService.generateTimesheets(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(responses);
    }

    @GetMapping("/timesheets/{timesheetId}")
    public ResponseEntity<TimeAttendanceDto.TimesheetResponse> getTimesheet(
            @PathVariable UUID timesheetId) {
        return timeAttendanceService.getTimesheet(timesheetId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/timesheets/reference/{reference}")
    public ResponseEntity<TimeAttendanceDto.TimesheetResponse> getTimesheetByReference(
            @PathVariable String reference) {
        return timeAttendanceService.getTimesheetByReference(reference)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employees/{employeeId}/timesheets")
    public ResponseEntity<List<TimeAttendanceDto.TimesheetResponse>> getTimesheetsForEmployee(
            @PathVariable UUID employeeId) {
        List<TimeAttendanceDto.TimesheetResponse> timesheets = timeAttendanceService.getTimesheetsForEmployee(employeeId);
        return ResponseEntity.ok(timesheets);
    }

    @GetMapping("/timesheets")
    public ResponseEntity<Page<TimeAttendanceDto.TimesheetResponse>> searchTimesheets(
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) Timesheet.TimesheetStatus status,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            Pageable pageable) {
        Page<TimeAttendanceDto.TimesheetResponse> timesheets = timeAttendanceService.searchTimesheets(
                employeeId, departmentId, status, year, month, pageable);
        return ResponseEntity.ok(timesheets);
    }

    // === Timesheet Workflow Endpoints ===

    @PostMapping("/timesheets/{timesheetId}/submit")
    public ResponseEntity<TimeAttendanceDto.TimesheetResponse> submitTimesheet(
            @PathVariable UUID timesheetId,
            @RequestParam UUID submitterId) {
        TimeAttendanceDto.TimesheetResponse response = timeAttendanceService.submitTimesheet(
                timesheetId, submitterId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/timesheets/{timesheetId}/approve")
    public ResponseEntity<TimeAttendanceDto.TimesheetResponse> approveTimesheet(
            @PathVariable UUID timesheetId,
            @RequestParam UUID approverId,
            @RequestBody(required = false) TimeAttendanceDto.ApprovalRequest request) {
        String notes = request != null ? request.notes() : null;
        TimeAttendanceDto.TimesheetResponse response = timeAttendanceService.approveTimesheet(
                timesheetId, approverId, notes);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/timesheets/{timesheetId}/reject")
    public ResponseEntity<TimeAttendanceDto.TimesheetResponse> rejectTimesheet(
            @PathVariable UUID timesheetId,
            @RequestParam UUID reviewerId,
            @Valid @RequestBody TimeAttendanceDto.RejectionRequest request) {
        TimeAttendanceDto.TimesheetResponse response = timeAttendanceService.rejectTimesheet(
                timesheetId, reviewerId, request.reason());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/timesheets/pending-approval")
    public ResponseEntity<List<TimeAttendanceDto.TimesheetResponse>> getPendingTimesheetApprovals() {
        List<TimeAttendanceDto.TimesheetResponse> timesheets = timeAttendanceService.getPendingTimesheetApprovals();
        return ResponseEntity.ok(timesheets);
    }

    @GetMapping("/timesheets/payroll")
    public ResponseEntity<List<TimeAttendanceDto.TimesheetResponse>> getApprovedTimesheetsForPayroll(
            @RequestParam int year,
            @RequestParam int month) {
        List<TimeAttendanceDto.TimesheetResponse> timesheets = timeAttendanceService.getApprovedTimesheetsForPayroll(year, month);
        return ResponseEntity.ok(timesheets);
    }

    // === Work Schedule Endpoints ===

    @PostMapping("/schedules")
    public ResponseEntity<TimeAttendanceDto.ScheduleResponse> createSchedule(
            @Valid @RequestBody TimeAttendanceDto.CreateScheduleRequest request) {
        TimeAttendanceDto.ScheduleResponse response = timeAttendanceService.createSchedule(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/schedules/{scheduleId}")
    public ResponseEntity<TimeAttendanceDto.ScheduleResponse> updateSchedule(
            @PathVariable UUID scheduleId,
            @Valid @RequestBody TimeAttendanceDto.CreateScheduleRequest request) {
        TimeAttendanceDto.ScheduleResponse response = timeAttendanceService.updateSchedule(scheduleId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/schedules/{scheduleId}")
    public ResponseEntity<TimeAttendanceDto.ScheduleResponse> getSchedule(@PathVariable UUID scheduleId) {
        return timeAttendanceService.getSchedule(scheduleId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employees/{employeeId}/schedule")
    public ResponseEntity<TimeAttendanceDto.ScheduleResponse> getCurrentScheduleForEmployee(
            @PathVariable UUID employeeId) {
        return timeAttendanceService.getCurrentScheduleForEmployee(employeeId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employees/{employeeId}/schedules")
    public ResponseEntity<List<TimeAttendanceDto.ScheduleResponse>> getSchedulesForEmployee(
            @PathVariable UUID employeeId) {
        List<TimeAttendanceDto.ScheduleResponse> schedules = timeAttendanceService.getSchedulesForEmployee(employeeId);
        return ResponseEntity.ok(schedules);
    }

    @PostMapping("/schedules/{scheduleId}/deactivate")
    public ResponseEntity<Void> deactivateSchedule(
            @PathVariable UUID scheduleId,
            @RequestParam LocalDate endDate) {
        timeAttendanceService.deactivateSchedule(scheduleId, endDate);
        return ResponseEntity.ok().build();
    }

    // === Public Holiday Endpoints ===

    @GetMapping("/holidays/{year}")
    public ResponseEntity<List<TimeAttendanceDto.PublicHolidayResponse>> getPublicHolidaysForYear(
            @PathVariable int year) {
        List<TimeAttendanceDto.PublicHolidayResponse> holidays = timeAttendanceService.getPublicHolidaysForYear(year);
        return ResponseEntity.ok(holidays);
    }

    @GetMapping("/holidays")
    public ResponseEntity<List<TimeAttendanceDto.PublicHolidayResponse>> getPublicHolidaysInRange(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        List<TimeAttendanceDto.PublicHolidayResponse> holidays = timeAttendanceService.getPublicHolidaysInRange(startDate, endDate);
        return ResponseEntity.ok(holidays);
    }

    @GetMapping("/holidays/check")
    public ResponseEntity<Boolean> isPublicHoliday(@RequestParam LocalDate date) {
        boolean isHoliday = timeAttendanceService.isPublicHoliday(date);
        return ResponseEntity.ok(isHoliday);
    }

    @PostMapping("/holidays/generate/{year}")
    public ResponseEntity<Void> generatePublicHolidaysForYear(@PathVariable int year) {
        timeAttendanceService.generatePublicHolidaysForYear(year);
        return ResponseEntity.ok().build();
    }

    // === Dashboard & Reporting Endpoints ===

    @GetMapping("/dashboard")
    public ResponseEntity<TimeAttendanceDto.AttendanceDashboard> getDashboard() {
        TimeAttendanceDto.AttendanceDashboard dashboard = timeAttendanceService.getDashboard();
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/employees/{employeeId}/summary")
    public ResponseEntity<TimeAttendanceDto.EmployeeAttendanceSummary> getEmployeeAttendanceSummary(
            @PathVariable UUID employeeId,
            @RequestParam LocalDate periodStart,
            @RequestParam LocalDate periodEnd) {
        TimeAttendanceDto.EmployeeAttendanceSummary summary = timeAttendanceService.getEmployeeAttendanceSummary(
                employeeId, periodStart, periodEnd);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/reports/daily")
    public ResponseEntity<List<TimeAttendanceDto.DailyAttendanceSummary>> getDailyAttendanceSummary(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        List<TimeAttendanceDto.DailyAttendanceSummary> summaries = timeAttendanceService.getDailyAttendanceSummary(startDate, endDate);
        return ResponseEntity.ok(summaries);
    }

    @GetMapping("/reports/overtime")
    public ResponseEntity<TimeAttendanceDto.OvertimeReport> getOvertimeReport(
            @RequestParam LocalDate periodStart,
            @RequestParam LocalDate periodEnd) {
        TimeAttendanceDto.OvertimeReport report = timeAttendanceService.getOvertimeReport(periodStart, periodEnd);
        return ResponseEntity.ok(report);
    }

    // === Utility Endpoints ===

    @GetMapping("/working-days")
    public ResponseEntity<Integer> calculateWorkingDays(
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        int workingDays = timeAttendanceService.calculateWorkingDays(startDate, endDate);
        return ResponseEntity.ok(workingDays);
    }
}
