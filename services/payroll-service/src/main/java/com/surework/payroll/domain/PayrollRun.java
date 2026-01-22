package com.surework.payroll.domain;

import com.surework.common.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Represents a payroll processing run for a specific period.
 * Contains all payslips generated during the run.
 */
@Entity
@Table(name = "payroll_runs", indexes = {
        @Index(name = "idx_payroll_runs_period", columnList = "period_year, period_month"),
        @Index(name = "idx_payroll_runs_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
public class PayrollRun extends BaseEntity {

    @Column(name = "run_number", nullable = false, unique = true)
    private String runNumber;

    @Column(name = "period_year", nullable = false)
    private int periodYear;

    @Column(name = "period_month", nullable = false)
    private int periodMonth;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PayrollRunStatus status = PayrollRunStatus.DRAFT;

    @Column(name = "total_gross", precision = 15, scale = 2)
    private BigDecimal totalGross = BigDecimal.ZERO;

    @Column(name = "total_paye", precision = 15, scale = 2)
    private BigDecimal totalPaye = BigDecimal.ZERO;

    @Column(name = "total_uif_employee", precision = 15, scale = 2)
    private BigDecimal totalUifEmployee = BigDecimal.ZERO;

    @Column(name = "total_uif_employer", precision = 15, scale = 2)
    private BigDecimal totalUifEmployer = BigDecimal.ZERO;

    @Column(name = "total_net", precision = 15, scale = 2)
    private BigDecimal totalNet = BigDecimal.ZERO;

    @Column(name = "total_employer_cost", precision = 15, scale = 2)
    private BigDecimal totalEmployerCost = BigDecimal.ZERO;

    @Column(name = "employee_count")
    private int employeeCount = 0;

    @Column(name = "processed_by")
    private UUID processedBy;

    @Column(name = "processed_at")
    private java.time.Instant processedAt;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private java.time.Instant approvedAt;

    @Column(name = "notes", length = 1000)
    private String notes;

    @OneToMany(mappedBy = "payrollRun", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Payslip> payslips = new ArrayList<>();

    /**
     * Status of a payroll run.
     */
    public enum PayrollRunStatus {
        DRAFT,          // Initial state, can be edited
        PROCESSING,     // Currently being processed
        PENDING_APPROVAL, // Processed, awaiting approval
        APPROVED,       // Approved, ready for payment
        PAID,           // Payments have been made
        CANCELLED       // Run was cancelled
    }

    /**
     * Create a new payroll run for a period.
     */
    public static PayrollRun create(YearMonth period, LocalDate paymentDate) {
        PayrollRun run = new PayrollRun();
        run.setPeriodYear(period.getYear());
        run.setPeriodMonth(period.getMonthValue());
        run.setPaymentDate(paymentDate);
        run.setRunNumber(generateRunNumber(period));
        run.setStatus(PayrollRunStatus.DRAFT);
        return run;
    }

    private static String generateRunNumber(YearMonth period) {
        return String.format("PR-%d%02d-%s",
                period.getYear(),
                period.getMonthValue(),
                UUID.randomUUID().toString().substring(0, 8).toUpperCase());
    }

    /**
     * Get the period as YearMonth.
     */
    public YearMonth getPeriod() {
        return YearMonth.of(periodYear, periodMonth);
    }

    /**
     * Add a payslip to this run.
     */
    public void addPayslip(Payslip payslip) {
        payslips.add(payslip);
        payslip.setPayrollRun(this);
        recalculateTotals();
    }

    /**
     * Remove a payslip from this run.
     */
    public void removePayslip(Payslip payslip) {
        payslips.remove(payslip);
        payslip.setPayrollRun(null);
        recalculateTotals();
    }

    /**
     * Recalculate all totals from payslips.
     */
    public void recalculateTotals() {
        this.totalGross = BigDecimal.ZERO;
        this.totalPaye = BigDecimal.ZERO;
        this.totalUifEmployee = BigDecimal.ZERO;
        this.totalUifEmployer = BigDecimal.ZERO;
        this.totalNet = BigDecimal.ZERO;
        this.totalEmployerCost = BigDecimal.ZERO;

        for (Payslip payslip : payslips) {
            if (payslip.getStatus() != Payslip.PayslipStatus.EXCLUDED) {
                this.totalGross = this.totalGross.add(payslip.getGrossEarnings());
                this.totalPaye = this.totalPaye.add(payslip.getPaye());
                this.totalUifEmployee = this.totalUifEmployee.add(payslip.getUifEmployee());
                this.totalUifEmployer = this.totalUifEmployer.add(payslip.getUifEmployer());
                this.totalNet = this.totalNet.add(payslip.getNetPay());
                this.totalEmployerCost = this.totalEmployerCost.add(payslip.getTotalEmployerCost());
            }
        }

        this.employeeCount = (int) payslips.stream()
                .filter(p -> p.getStatus() != Payslip.PayslipStatus.EXCLUDED)
                .count();
    }

    /**
     * Start processing the payroll run.
     */
    public void startProcessing() {
        if (this.status != PayrollRunStatus.DRAFT) {
            throw new IllegalStateException("Can only start processing a draft payroll run");
        }
        this.status = PayrollRunStatus.PROCESSING;
    }

    /**
     * Complete processing and move to pending approval.
     */
    public void completeProcessing(UUID processedBy) {
        if (this.status != PayrollRunStatus.PROCESSING) {
            throw new IllegalStateException("Can only complete a processing payroll run");
        }
        this.status = PayrollRunStatus.PENDING_APPROVAL;
        this.processedBy = processedBy;
        this.processedAt = java.time.Instant.now();
    }

    /**
     * Approve the payroll run.
     */
    public void approve(UUID approvedBy) {
        if (this.status != PayrollRunStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Can only approve a pending payroll run");
        }
        this.status = PayrollRunStatus.APPROVED;
        this.approvedBy = approvedBy;
        this.approvedAt = java.time.Instant.now();
    }

    /**
     * Mark the payroll run as paid.
     */
    public void markAsPaid() {
        if (this.status != PayrollRunStatus.APPROVED) {
            throw new IllegalStateException("Can only mark an approved payroll run as paid");
        }
        this.status = PayrollRunStatus.PAID;
    }

    /**
     * Cancel the payroll run.
     */
    public void cancel() {
        if (this.status == PayrollRunStatus.PAID) {
            throw new IllegalStateException("Cannot cancel a paid payroll run");
        }
        this.status = PayrollRunStatus.CANCELLED;
    }

    /**
     * Check if the run can be edited.
     */
    public boolean isEditable() {
        return this.status == PayrollRunStatus.DRAFT;
    }
}
