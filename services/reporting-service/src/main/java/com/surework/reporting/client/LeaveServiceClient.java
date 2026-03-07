package com.surework.reporting.client;

import com.surework.reporting.client.dto.LeaveBalanceDto;
import com.surework.reporting.client.dto.LeaveRequestDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.UUID;

/**
 * Feign client for Leave Service.
 * Fetches leave data for reports and liability calculations.
 */
@FeignClient(name = "leave-service", url = "${surework.services.leave-service.url:http://localhost:8083}")
public interface LeaveServiceClient {

    @GetMapping("/api/leave/balances")
    List<LeaveBalanceDto> getAllBalances(@RequestParam("year") int year);

    @GetMapping("/api/leave/balances")
    List<LeaveBalanceDto> getBalancesByType(
            @RequestParam("year") int year,
            @RequestParam("leaveType") String leaveType);

    @GetMapping("/api/leave/balances/employee/{employeeId}")
    List<LeaveBalanceDto> getEmployeeBalances(
            @PathVariable("employeeId") UUID employeeId,
            @RequestParam("year") int year);

    @GetMapping("/api/leave/requests")
    List<LeaveRequestDto> getAllRequests();

    @GetMapping("/api/leave/requests")
    List<LeaveRequestDto> getRequestsByStatus(@RequestParam("status") String status);

    @GetMapping("/api/leave/requests/employee/{employeeId}")
    List<LeaveRequestDto> getEmployeeRequests(@PathVariable("employeeId") UUID employeeId);

    @GetMapping("/api/leave/requests/period")
    List<LeaveRequestDto> getRequestsByPeriod(
            @RequestParam("from") String from,
            @RequestParam("to") String to);
}
