package com.surework.hr.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Leave request entity.
 * Implements User Story 2: Leave Management.
 * Implements BCEA compliance for leave entitlements.
 * The tenantId field provides defense-in-depth for tenant isolation.
 */
@Entity
@Table(name = "leave_requests")
@Getter
@Setter
@NoArgsConstructor
public class LeaveRequest extends BaseEntity {

    /**
     * Tenant ID for defense-in-depth isolation.
     * Primary isolation is via schema-per-tenant; this is a secondary safeguard.
     */
    @Column(name = "tenant_id")
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeaveType leaveType;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    private int days;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeaveStatus status = LeaveStatus.PENDING;

    @Column(length = 500)
    private String reason;

    // Approval workflow
    private UUID approverId;
    private LocalDate approvalDate;

    @Column(length = 500)
    private String approverComment;

    // Cancellation
    private LocalDate cancellationDate;

    @Column(length = 500)
    private String cancellationReason;

    /**
     * Calculate the number of working days between start and end date.
     * Excludes weekends but not public holidays (would need calendar integration).
     */
    public static int calculateWorkingDays(LocalDate start, LocalDate end) {
        int workingDays = 0;
        LocalDate current = start;
        while (!current.isAfter(end)) {
            int dayOfWeek = current.getDayOfWeek().getValue();
            if (dayOfWeek < 6) { // Monday to Friday
                workingDays++;
            }
            current = current.plusDays(1);
        }
        return workingDays;
    }

    /**
     * Approve the leave request.
     */
    public void approve(UUID approverId, String comment) {
        this.status = LeaveStatus.APPROVED;
        this.approverId = approverId;
        this.approvalDate = LocalDate.now();
        this.approverComment = comment;
    }

    /**
     * Reject the leave request.
     */
    public void reject(UUID approverId, String comment) {
        this.status = LeaveStatus.REJECTED;
        this.approverId = approverId;
        this.approvalDate = LocalDate.now();
        this.approverComment = comment;
    }

    /**
     * Cancel the leave request.
     */
    public void cancel(String reason) {
        this.status = LeaveStatus.CANCELLED;
        this.cancellationDate = LocalDate.now();
        this.cancellationReason = reason;
    }

    /**
     * Leave type enum - Based on BCEA entitlements.
     */
    public enum LeaveType {
        ANNUAL,              // 21 consecutive days (15 working days)
        SICK,                // 30 days in 36-month cycle
        FAMILY_RESPONSIBILITY, // 3 days per year
        MATERNITY,           // 4 consecutive months
        PARENTAL,            // 10 consecutive days
        UNPAID,
        STUDY
    }

    /**
     * Leave status enum.
     */
    public enum LeaveStatus {
        PENDING,
        APPROVED,
        REJECTED,
        CANCELLED
    }
}
