package com.surework.hr.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Leave balance entity tracking employee leave entitlements.
 * Implements User Story 2: Leave Management.
 * Implements BCEA compliance:
 * - Annual: 21 consecutive days (15 working days) per year
 * - Sick: 30 days per 36-month cycle (does NOT carry over)
 * - Family Responsibility: 3 days per year
 * The tenantId field provides defense-in-depth for tenant isolation.
 */
@Entity
@Table(name = "leave_balances")
@Getter
@Setter
@NoArgsConstructor
public class LeaveBalance extends BaseEntity {

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
    private LeaveRequest.LeaveType leaveType;

    @Column(nullable = false)
    private int year;

    // For sick leave, this represents the cycle start
    private LocalDate cycleStartDate;

    @Column(nullable = false)
    private double entitlement;

    @Column(nullable = false)
    private double used = 0;

    @Column(nullable = false)
    private double pending = 0;

    @Column(nullable = false)
    private double carriedOver = 0;

    /**
     * Get available balance.
     */
    public double getAvailable() {
        return entitlement + carriedOver - used - pending;
    }

    /**
     * Check if balance is sufficient for requested days.
     */
    public boolean hasSufficientBalance(int requestedDays) {
        return getAvailable() >= requestedDays;
    }

    /**
     * Reserve days for a pending leave request.
     */
    public void reserveDays(int days) {
        this.pending += days;
    }

    /**
     * Release reserved days (when request is rejected or cancelled).
     */
    public void releaseReservedDays(int days) {
        this.pending = Math.max(0, this.pending - days);
    }

    /**
     * Confirm usage (when request is approved and taken).
     */
    public void confirmUsage(int days) {
        this.pending = Math.max(0, this.pending - days);
        this.used += days;
    }

    /**
     * Create default annual leave balance.
     */
    public static LeaveBalance createAnnualBalance(Employee employee, int year) {
        LeaveBalance balance = new LeaveBalance();
        balance.setEmployee(employee);
        balance.setLeaveType(LeaveRequest.LeaveType.ANNUAL);
        balance.setYear(year);
        balance.setEntitlement(15); // 15 working days per BCEA
        return balance;
    }

    /**
     * Create default sick leave balance.
     * Sick leave is 30 days per 36-month cycle.
     */
    public static LeaveBalance createSickBalance(Employee employee, int year, LocalDate cycleStart) {
        LeaveBalance balance = new LeaveBalance();
        balance.setEmployee(employee);
        balance.setLeaveType(LeaveRequest.LeaveType.SICK);
        balance.setYear(year);
        balance.setCycleStartDate(cycleStart);
        balance.setEntitlement(30); // 30 days per 36-month cycle
        return balance;
    }

    /**
     * Create family responsibility balance.
     */
    public static LeaveBalance createFamilyResponsibilityBalance(Employee employee, int year) {
        LeaveBalance balance = new LeaveBalance();
        balance.setEmployee(employee);
        balance.setLeaveType(LeaveRequest.LeaveType.FAMILY_RESPONSIBILITY);
        balance.setYear(year);
        balance.setEntitlement(3); // 3 days per year per BCEA
        return balance;
    }
}
