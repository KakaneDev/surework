package com.surework.hr.controller;

import com.surework.hr.domain.LeaveRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Controller for leave type configuration.
 * Returns BCEA-compliant leave types with default entitlements.
 */
@RestController
@RequestMapping("/api/hr/leave-types")
@RequiredArgsConstructor
@Slf4j
public class LeaveTypeController {

    /**
     * Get all configured leave types.
     * Returns BCEA-mandated leave types with default values.
     */
    @GetMapping
    public ResponseEntity<List<LeaveTypeResponse>> getLeaveTypes() {
        log.debug("Getting all leave types");

        List<LeaveTypeResponse> leaveTypes = Arrays.stream(LeaveRequest.LeaveType.values())
                .map(this::toResponse)
                .toList();

        return ResponseEntity.ok(leaveTypes);
    }

    /**
     * Get a specific leave type by ID (code).
     */
    @GetMapping("/{id}")
    public ResponseEntity<LeaveTypeResponse> getLeaveType(@PathVariable String id) {
        log.debug("Getting leave type: {}", id);

        try {
            LeaveRequest.LeaveType leaveType = LeaveRequest.LeaveType.valueOf(id.toUpperCase());
            return ResponseEntity.ok(toResponse(leaveType));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    private LeaveTypeResponse toResponse(LeaveRequest.LeaveType leaveType) {
        return switch (leaveType) {
            case ANNUAL -> new LeaveTypeResponse(
                    leaveType.name(),
                    "Annual Leave",
                    leaveType.name(),
                    15, // 15 working days per BCEA
                    5,  // Allow 5 days carry forward
                    true,
                    false,
                    "ACTIVE",
                    "21 consecutive days (15 working days) per year as per BCEA"
            );
            case SICK -> new LeaveTypeResponse(
                    leaveType.name(),
                    "Sick Leave",
                    leaveType.name(),
                    30, // 30 days per 36-month cycle per BCEA
                    0,  // No carry forward for sick leave
                    false, // Medical certificate may be required
                    false,
                    "ACTIVE",
                    "30 days in every 36-month cycle as per BCEA"
            );
            case FAMILY_RESPONSIBILITY -> new LeaveTypeResponse(
                    leaveType.name(),
                    "Family Responsibility Leave",
                    leaveType.name(),
                    3, // 3 days per year per BCEA
                    0, // No carry forward
                    true,
                    false,
                    "ACTIVE",
                    "3 days per year for family emergencies as per BCEA"
            );
            case MATERNITY -> new LeaveTypeResponse(
                    leaveType.name(),
                    "Maternity Leave",
                    leaveType.name(),
                    120, // 4 months (approximately 120 days)
                    0,
                    false,
                    false,
                    "ACTIVE",
                    "4 consecutive months as per BCEA"
            );
            case PARENTAL -> new LeaveTypeResponse(
                    leaveType.name(),
                    "Parental Leave",
                    leaveType.name(),
                    10, // 10 consecutive days
                    0,
                    false,
                    false,
                    "ACTIVE",
                    "10 consecutive days for non-birth parents"
            );
            case UNPAID -> new LeaveTypeResponse(
                    leaveType.name(),
                    "Unpaid Leave",
                    leaveType.name(),
                    0, // No entitlement
                    0,
                    true,
                    true, // Can go negative (unpaid)
                    "ACTIVE",
                    "Leave without pay, subject to approval"
            );
            case STUDY -> new LeaveTypeResponse(
                    leaveType.name(),
                    "Study Leave",
                    leaveType.name(),
                    5, // Company policy, not BCEA
                    0,
                    true,
                    false,
                    "ACTIVE",
                    "Leave for examinations and study purposes"
            );
        };
    }

    /**
     * Response DTO for leave type.
     */
    public record LeaveTypeResponse(
            String id,
            String name,
            String code,
            int defaultDays,
            int carryForwardDays,
            boolean requiresApproval,
            boolean allowNegativeBalance,
            String status,
            String description
    ) {}
}
