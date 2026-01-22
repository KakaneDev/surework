package com.surework.hr.controller;

import com.surework.common.security.TenantContext;
import com.surework.common.web.PageResponse;
import com.surework.common.web.exception.ResourceNotFoundException;
import com.surework.hr.domain.LeaveRequest;
import com.surework.hr.dto.LeaveDto;
import com.surework.hr.service.LeaveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for Leave operations.
 * Implements User Story 2: Leave Management.
 */
@RestController
@RequestMapping("/api/v1/leave")
@RequiredArgsConstructor
public class LeaveController {

    private final LeaveService leaveService;

    /**
     * Create a leave request for an employee.
     */
    @PostMapping("/employees/{employeeId}/requests")
    public ResponseEntity<LeaveDto.Response> createLeaveRequest(
            @PathVariable UUID employeeId,
            @Valid @RequestBody LeaveDto.CreateRequest request) {
        LeaveDto.Response response = leaveService.createLeaveRequest(employeeId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Create a leave request for the current user.
     */
    @PostMapping("/requests")
    public ResponseEntity<LeaveDto.Response> createMyLeaveRequest(
            @RequestHeader("X-User-Id") UUID userId,
            @Valid @RequestBody LeaveDto.CreateRequest request) {
        // In a real implementation, we'd look up the employee ID from user ID
        LeaveDto.Response response = leaveService.createLeaveRequest(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get a leave request by ID.
     */
    @GetMapping("/requests/{requestId}")
    public ResponseEntity<LeaveDto.Response> getLeaveRequest(@PathVariable UUID requestId) {
        return leaveService.getLeaveRequest(requestId)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", requestId));
    }

    /**
     * Search leave requests with filters.
     */
    @GetMapping("/requests")
    public ResponseEntity<PageResponse<LeaveDto.Response>> searchLeaveRequests(
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false) LeaveRequest.LeaveStatus status,
            @RequestParam(required = false) LeaveRequest.LeaveType leaveType,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<LeaveDto.Response> page = leaveService.searchLeaveRequests(
                employeeId, status, leaveType, fromDate, toDate, pageable);
        return ResponseEntity.ok(PageResponse.of(page));
    }

    /**
     * Get pending requests for the current manager.
     */
    @GetMapping("/pending")
    public ResponseEntity<List<LeaveDto.Response>> getPendingRequests(
            @RequestHeader("X-User-Id") UUID managerId) {
        List<LeaveDto.Response> requests = leaveService.getPendingRequestsForManager(managerId);
        return ResponseEntity.ok(requests);
    }

    /**
     * Approve a leave request.
     */
    @PostMapping("/requests/{requestId}/approve")
    public ResponseEntity<LeaveDto.Response> approveLeaveRequest(
            @PathVariable UUID requestId,
            @RequestHeader("X-User-Id") UUID approverId,
            @RequestBody(required = false) LeaveDto.ApprovalRequest request) {
        String comment = request != null ? request.comment() : null;
        LeaveDto.Response response = leaveService.approveLeaveRequest(requestId, approverId, comment);
        return ResponseEntity.ok(response);
    }

    /**
     * Reject a leave request.
     */
    @PostMapping("/requests/{requestId}/reject")
    public ResponseEntity<LeaveDto.Response> rejectLeaveRequest(
            @PathVariable UUID requestId,
            @RequestHeader("X-User-Id") UUID approverId,
            @Valid @RequestBody LeaveDto.ApprovalRequest request) {
        LeaveDto.Response response = leaveService.rejectLeaveRequest(requestId, approverId, request.comment());
        return ResponseEntity.ok(response);
    }

    /**
     * Cancel a leave request.
     */
    @PostMapping("/requests/{requestId}/cancel")
    public ResponseEntity<LeaveDto.Response> cancelLeaveRequest(
            @PathVariable UUID requestId,
            @RequestParam String reason) {
        LeaveDto.Response response = leaveService.cancelLeaveRequest(requestId, reason);
        return ResponseEntity.ok(response);
    }

    /**
     * Get leave balances for an employee.
     */
    @GetMapping("/employees/{employeeId}/balances")
    public ResponseEntity<List<LeaveDto.BalanceResponse>> getLeaveBalances(
            @PathVariable UUID employeeId,
            @RequestParam(defaultValue = "#{T(java.time.Year).now().value}") int year) {
        List<LeaveDto.BalanceResponse> balances = leaveService.getLeaveBalances(employeeId, year);
        return ResponseEntity.ok(balances);
    }

    /**
     * Get my leave balances.
     */
    @GetMapping("/balances")
    public ResponseEntity<List<LeaveDto.BalanceResponse>> getMyLeaveBalances(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestParam(defaultValue = "#{T(java.time.Year).now().value}") int year) {
        List<LeaveDto.BalanceResponse> balances = leaveService.getLeaveBalances(userId, year);
        return ResponseEntity.ok(balances);
    }

    /**
     * Get leave requests for an employee.
     */
    @GetMapping("/employees/{employeeId}/requests")
    public ResponseEntity<PageResponse<LeaveDto.Response>> getEmployeeLeaveRequests(
            @PathVariable UUID employeeId,
            @RequestParam(required = false) LeaveRequest.LeaveStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<LeaveDto.Response> page = leaveService.searchLeaveRequests(
                employeeId, status, null, null, null, pageable);
        return ResponseEntity.ok(PageResponse.of(page));
    }
}
