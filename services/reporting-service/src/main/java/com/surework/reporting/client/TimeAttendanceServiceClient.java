package com.surework.reporting.client;

import com.surework.reporting.client.dto.TimeEntryDto;
import com.surework.reporting.client.dto.TimesheetDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.UUID;

/**
 * Feign client for Time & Attendance Service.
 * Fetches time entries and timesheets for reports.
 */
@FeignClient(name = "time-attendance-service", url = "${surework.services.time-attendance-service.url:http://localhost:8084}")
public interface TimeAttendanceServiceClient {

    @GetMapping("/api/time/entries")
    List<TimeEntryDto> getAllTimeEntries();

    @GetMapping("/api/time/entries")
    List<TimeEntryDto> getTimeEntriesByPeriod(
            @RequestParam("from") String from,
            @RequestParam("to") String to);

    @GetMapping("/api/time/entries/employee/{employeeId}")
    List<TimeEntryDto> getEmployeeTimeEntries(
            @PathVariable("employeeId") UUID employeeId,
            @RequestParam("from") String from,
            @RequestParam("to") String to);

    @GetMapping("/api/time/timesheets")
    List<TimesheetDto> getAllTimesheets();

    @GetMapping("/api/time/timesheets")
    List<TimesheetDto> getTimesheetsByPeriod(
            @RequestParam("year") int year,
            @RequestParam("month") int month);

    @GetMapping("/api/time/timesheets/employee/{employeeId}")
    List<TimesheetDto> getEmployeeTimesheets(
            @PathVariable("employeeId") UUID employeeId,
            @RequestParam("year") int year);
}
