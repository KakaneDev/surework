package com.surework.hr.controller;

import com.surework.common.security.TenantContext;
import com.surework.common.web.PageResponse;
import com.surework.common.web.exception.ResourceNotFoundException;
import com.surework.hr.config.JwtHeaderAuthenticationFilter.UserPrincipal;
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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for Leave operations.
 * Implements User Story 2: Leave Management.
 *
 * Authorization:
 * - Self-service endpoints: Any authenticated user (for their own data)
 * - Approval endpoints: HR_MANAGER, DEPARTMENT_MANAGER, TENANT_ADMIN, SUPER_ADMIN
 * - Admin endpoints: HR_MANAGER, TENANT_ADMIN, SUPER_ADMIN
 */
@RestController
@RequestMapping("/api/v1/leave")
@RequiredArgsConstructor
public class LeaveController {

    private final LeaveService leaveService;

    // ========================================
    // SELF-SERVICE ENDPOINTS (Any authenticated user for their own data)
    // ========================================

    /**
     * Create a leave request for the current user.
     * Uses employeeId from JWT token (not userId).
     */
    @PostMapping("/requests")
    public ResponseEntity<LeaveDto.Response> createMyLeaveRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody LeaveDto.CreateRequest request) {
        if (principal.employeeId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        LeaveDto.Response response = leaveService.createLeaveRequest(principal.employeeId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get my leave balances.
     * Uses employeeId from JWT token (not userId).
     */
    @GetMapping("/balances")
    public ResponseEntity<List<LeaveDto.BalanceResponse>> getMyLeaveBalances(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "#{T(java.time.Year).now().value}") int year) {
        if (principal.employeeId() == null) {
            return ResponseEntity.ok(List.of());
        }
        List<LeaveDto.BalanceResponse> balances = leaveService.getLeaveBalances(principal.employeeId(), year);
        return ResponseEntity.ok(balances);
    }

    /**
     * Cancel a leave request.
     * User can only cancel their own pending/approved requests.
     * Uses employeeId from JWT token (not userId).
     */
    @PostMapping("/requests/{requestId}/cancel")
    public ResponseEntity<LeaveDto.Response> cancelLeaveRequest(
            @PathVariable UUID requestId,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam String reason) {
        if (principal.employeeId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        LeaveDto.Response response = leaveService.cancelLeaveRequest(requestId, principal.employeeId(), reason);
        return ResponseEntity.ok(response);
    }

    /**
     * Get a leave request by ID.
     * User can view their own requests, managers can view all.
     * Uses employeeId from JWT token (not userId).
     */
    @GetMapping("/requests/{requestId}")
    public ResponseEntity<LeaveDto.Response> getLeaveRequest(
            @PathVariable UUID requestId,
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID employeeId = principal.employeeId();
        if (employeeId == null && principal.roles().stream().noneMatch(r ->
                r.contains("ADMIN") || r.contains("HR_MANAGER") || r.contains("DEPARTMENT_MANAGER"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return leaveService.getLeaveRequest(requestId, employeeId, principal.roles())
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveRequest", requestId));
    }

    /**
     * Get my sick leave cycle information.
     * Uses employeeId from JWT token (not userId).
     */
    @GetMapping("/sick-cycle")
    public ResponseEntity<LeaveDto.SickLeaveCycleInfo> getMySickLeaveCycleInfo(
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal.employeeId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        LeaveDto.SickLeaveCycleInfo cycleInfo = leaveService.getSickLeaveCycleInfo(principal.employeeId());
        return ResponseEntity.ok(cycleInfo);
    }

    /**
     * Get my leave request history.
     * Uses employeeId from JWT token (not userId).
     */
    @GetMapping("/my-requests")
    public ResponseEntity<PageResponse<LeaveDto.Response>> getMyLeaveRequests(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) LeaveRequest.LeaveStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        if (principal.employeeId() == null) {
            return ResponseEntity.ok(PageResponse.empty());
        }
        Page<LeaveDto.Response> page = leaveService.searchLeaveRequests(
                principal.employeeId(), status, null, null, null, pageable);
        return ResponseEntity.ok(PageResponse.from(page));
    }

    // ========================================
    // APPROVAL ENDPOINTS (HR/Manager roles only)
    // ========================================

    /**
     * Get all pending leave requests for HR approval.
     * Only HR_MANAGER, DEPARTMENT_MANAGER, TENANT_ADMIN, SUPER_ADMIN can access.
     */
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER')")
    public ResponseEntity<PageResponse<LeaveDto.Response>> getPendingRequests(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<LeaveDto.Response> page = leaveService.getAllPendingRequests(pageable);
        return ResponseEntity.ok(PageResponse.from(page));
    }

    /**
     * Approve a leave request.
     * Only HR_MANAGER, DEPARTMENT_MANAGER, TENANT_ADMIN, SUPER_ADMIN can approve.
     */
    @PostMapping("/requests/{requestId}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER')")
    public ResponseEntity<LeaveDto.Response> approveLeaveRequest(
            @PathVariable UUID requestId,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) LeaveDto.ApprovalRequest request) {
        String comment = request != null ? request.comment() : null;
        // Pass employeeId for self-approval check, userId for audit trail
        LeaveDto.Response response = leaveService.approveLeaveRequest(
                requestId, principal.userId(), principal.employeeId(), comment);
        return ResponseEntity.ok(response);
    }

    /**
     * Reject a leave request.
     * Only HR_MANAGER, DEPARTMENT_MANAGER, TENANT_ADMIN, SUPER_ADMIN can reject.
     */
    @PostMapping("/requests/{requestId}/reject")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER')")
    public ResponseEntity<LeaveDto.Response> rejectLeaveRequest(
            @PathVariable UUID requestId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody LeaveDto.ApprovalRequest request) {
        // Pass employeeId for self-rejection check, userId for audit trail
        LeaveDto.Response response = leaveService.rejectLeaveRequest(
                requestId, principal.userId(), principal.employeeId(), request.comment());
        return ResponseEntity.ok(response);
    }

    // ========================================
    // HR ADMIN ENDPOINTS (HR/Admin roles only)
    // ========================================

    /**
     * Get all employees' leave balances (HR view).
     * Only HR_MANAGER, TENANT_ADMIN, SUPER_ADMIN can view all balances.
     * NOTE: This endpoint MUST be defined before /employees/{employeeId}/balances
     * to avoid Spring interpreting "balances" as an employeeId.
     */
    @GetMapping("/employees/balances")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'PAYROLL_ADMIN')")
    public ResponseEntity<PageResponse<LeaveDto.LeaveSummary>> getAllEmployeeLeaveBalances(
            @RequestParam(defaultValue = "#{T(java.time.Year).now().value}") int year,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<LeaveDto.LeaveSummary> page = leaveService.getAllEmployeeLeaveBalances(year, pageable);
        return ResponseEntity.ok(PageResponse.from(page));
    }

    /**
     * Create a leave request for an employee (HR admin).
     * Only HR_MANAGER, TENANT_ADMIN, SUPER_ADMIN can create requests for others.
     */
    @PostMapping("/employees/{employeeId}/requests")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER')")
    public ResponseEntity<LeaveDto.Response> createLeaveRequest(
            @PathVariable UUID employeeId,
            @Valid @RequestBody LeaveDto.CreateRequest request) {
        LeaveDto.Response response = leaveService.createLeaveRequest(employeeId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get leave balances for an employee (HR view).
     * Only HR_MANAGER, TENANT_ADMIN, SUPER_ADMIN can view other employees' balances.
     */
    @GetMapping("/employees/{employeeId}/balances")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'PAYROLL_ADMIN')")
    public ResponseEntity<List<LeaveDto.BalanceResponse>> getLeaveBalances(
            @PathVariable UUID employeeId,
            @RequestParam(defaultValue = "#{T(java.time.Year).now().value}") int year) {
        List<LeaveDto.BalanceResponse> balances = leaveService.getLeaveBalances(employeeId, year);
        return ResponseEntity.ok(balances);
    }

    /**
     * Get leave requests for an employee (HR view).
     * Only HR_MANAGER, TENANT_ADMIN, SUPER_ADMIN can view other employees' requests.
     */
    @GetMapping("/employees/{employeeId}/requests")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'PAYROLL_ADMIN')")
    public ResponseEntity<PageResponse<LeaveDto.Response>> getEmployeeLeaveRequests(
            @PathVariable UUID employeeId,
            @RequestParam(required = false) LeaveRequest.LeaveStatus status,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<LeaveDto.Response> page = leaveService.searchLeaveRequests(
                employeeId, status, null, null, null, pageable);
        return ResponseEntity.ok(PageResponse.from(page));
    }

    /**
     * Adjust an employee's leave balance (HR only).
     * Used for manual corrections, special grants, or error fixes.
     * Only HR_MANAGER, TENANT_ADMIN, SUPER_ADMIN can adjust balances.
     */
    @PostMapping("/employees/{employeeId}/balances/adjust")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER')")
    public ResponseEntity<LeaveDto.AdjustmentResponse> adjustLeaveBalance(
            @PathVariable UUID employeeId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody LeaveDto.AdjustmentRequest request) {
        LeaveDto.AdjustmentResponse response = leaveService.adjustLeaveBalance(employeeId, principal.userId(), request);
        return ResponseEntity.ok(response);
    }

    /**
     * Get sick leave cycle information for an employee (HR view).
     * Only HR_MANAGER, TENANT_ADMIN, SUPER_ADMIN can view other employees' sick cycles.
     */
    @GetMapping("/employees/{employeeId}/sick-cycle")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'PAYROLL_ADMIN')")
    public ResponseEntity<LeaveDto.SickLeaveCycleInfo> getSickLeaveCycleInfo(@PathVariable UUID employeeId) {
        LeaveDto.SickLeaveCycleInfo cycleInfo = leaveService.getSickLeaveCycleInfo(employeeId);
        return ResponseEntity.ok(cycleInfo);
    }

    /**
     * Search leave requests with filters (HR/Manager view).
     * Only HR_MANAGER, DEPARTMENT_MANAGER, TENANT_ADMIN, SUPER_ADMIN can search all requests.
     */
    @GetMapping("/requests")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'PAYROLL_ADMIN')")
    public ResponseEntity<PageResponse<LeaveDto.Response>> searchLeaveRequests(
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false) LeaveRequest.LeaveStatus status,
            @RequestParam(required = false) LeaveRequest.LeaveType leaveType,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<LeaveDto.Response> page = leaveService.searchLeaveRequests(
                employeeId, status, leaveType, fromDate, toDate, pageable);
        return ResponseEntity.ok(PageResponse.from(page));
    }
}
