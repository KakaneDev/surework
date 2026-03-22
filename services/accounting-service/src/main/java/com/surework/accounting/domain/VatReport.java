package com.surework.accounting.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Represents a VAT201 report for SARS submission.
 * Implements South African VAT reporting requirements.
 */
@Entity
@Table(name = "vat_reports", indexes = {
        @Index(name = "idx_vat_reports_period", columnList = "vat_period"),
        @Index(name = "idx_vat_reports_status", columnList = "status"),
        @Index(name = "idx_vat_reports_tenant", columnList = "tenant_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_vat_report_period", columnNames = {"tenant_id", "vat_period"})
})
@Getter
@Setter
@NoArgsConstructor
public class VatReport extends BaseEntity {

    // Standard VAT rate in South Africa (15% since April 2018)
    public static final BigDecimal VAT_RATE = new BigDecimal("0.15");

    @Column(name = "vat_period", nullable = false, length = 10)
    private String vatPeriod;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ReportStatus status = ReportStatus.DRAFT;

    // === Section A: Output Tax ===

    @Column(name = "box1_standard_rated_supplies", precision = 15, scale = 2)
    private BigDecimal box1StandardRatedSupplies = BigDecimal.ZERO;

    @Column(name = "box1a_output_vat", precision = 15, scale = 2)
    private BigDecimal box1aOutputVat = BigDecimal.ZERO;

    @Column(name = "box2_zero_rated_supplies", precision = 15, scale = 2)
    private BigDecimal box2ZeroRatedSupplies = BigDecimal.ZERO;

    @Column(name = "box3_exempt_supplies", precision = 15, scale = 2)
    private BigDecimal box3ExemptSupplies = BigDecimal.ZERO;

    @Column(name = "box4_total_supplies", precision = 15, scale = 2)
    private BigDecimal box4TotalSupplies = BigDecimal.ZERO;

    // === Section B: Input Tax ===

    @Column(name = "box5_capital_goods", precision = 15, scale = 2)
    private BigDecimal box5CapitalGoods = BigDecimal.ZERO;

    @Column(name = "box5a_input_vat_capital", precision = 15, scale = 2)
    private BigDecimal box5aInputVatCapital = BigDecimal.ZERO;

    @Column(name = "box6_other_goods", precision = 15, scale = 2)
    private BigDecimal box6OtherGoods = BigDecimal.ZERO;

    @Column(name = "box6a_input_vat_other", precision = 15, scale = 2)
    private BigDecimal box6aInputVatOther = BigDecimal.ZERO;

    @Column(name = "box7_total_input_vat", precision = 15, scale = 2)
    private BigDecimal box7TotalInputVat = BigDecimal.ZERO;

    // === Section C: Adjustments ===

    @Column(name = "box8_change_in_use_increase", precision = 15, scale = 2)
    private BigDecimal box8ChangeInUseIncrease = BigDecimal.ZERO;

    @Column(name = "box9_change_in_use_decrease", precision = 15, scale = 2)
    private BigDecimal box9ChangeInUseDecrease = BigDecimal.ZERO;

    @Column(name = "box10_bad_debts_recovered", precision = 15, scale = 2)
    private BigDecimal box10BadDebtsRecovered = BigDecimal.ZERO;

    @Column(name = "box11_bad_debts_written_off", precision = 15, scale = 2)
    private BigDecimal box11BadDebtsWrittenOff = BigDecimal.ZERO;

    @Column(name = "box12_other_adjustments", precision = 15, scale = 2)
    private BigDecimal box12OtherAdjustments = BigDecimal.ZERO;

    @Column(name = "box13_total_adjustments", precision = 15, scale = 2)
    private BigDecimal box13TotalAdjustments = BigDecimal.ZERO;

    // === Section D: Calculation ===

    @Column(name = "box14_output_vat_payable", precision = 15, scale = 2)
    private BigDecimal box14OutputVatPayable = BigDecimal.ZERO;

    @Column(name = "box15_input_vat_deductible", precision = 15, scale = 2)
    private BigDecimal box15InputVatDeductible = BigDecimal.ZERO;

    @Column(name = "box16_vat_payable", precision = 15, scale = 2)
    private BigDecimal box16VatPayable = BigDecimal.ZERO;

    @Column(name = "box17_vat_refundable", precision = 15, scale = 2)
    private BigDecimal box17VatRefundable = BigDecimal.ZERO;

    // === Section E: Diesel Refund ===

    @Column(name = "box18_diesel_refund", precision = 15, scale = 2)
    private BigDecimal box18DieselRefund = BigDecimal.ZERO;

    // === Payment Details ===

    @Column(name = "payment_due_date")
    private LocalDate paymentDueDate;

    @Column(name = "payment_reference", length = 50)
    private String paymentReference;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "paid_amount", precision = 15, scale = 2)
    private BigDecimal paidAmount;

    // === Submission Details ===

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "submitted_by")
    private UUID submittedBy;

    @Column(name = "sars_reference", length = 50)
    private String sarsReference;

    @Column(name = "acknowledgment_number", length = 50)
    private String acknowledgmentNumber;

    // === Generation Details ===

    @Column(name = "generated_at")
    private Instant generatedAt;

    @Column(name = "generated_by")
    private UUID generatedBy;

    @Column(name = "notes", length = 2000)
    private String notes;

    // === Multi-tenant ===

    @Column(name = "tenant_id")
    private UUID tenantId;

    // === Relationships ===

    @OneToMany(mappedBy = "vatReport", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VatReportLine> lines = new ArrayList<>();

    @OneToMany(mappedBy = "vatReport", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VatReportTransaction> transactions = new ArrayList<>();

    /**
     * Report status workflow.
     */
    public enum ReportStatus {
        DRAFT,      // Initial creation, can be edited
        PREVIEW,    // Generated for review, can regenerate
        GENERATED,  // Finalized, ready for submission
        SUBMITTED,  // Submitted to SARS
        PAID,       // Payment confirmed
        AMENDED     // Amendment submitted
    }

    /**
     * Create a new VAT report for a period.
     */
    public static VatReport forPeriod(LocalDate periodStart, LocalDate periodEnd, UUID tenantId) {
        VatReport report = new VatReport();
        report.setPeriodStart(periodStart);
        report.setPeriodEnd(periodEnd);
        report.setVatPeriod(formatPeriod(periodStart));
        report.setTenantId(tenantId);
        report.setStatus(ReportStatus.DRAFT);
        report.calculatePaymentDueDate();
        return report;
    }

    /**
     * Format period as YYYY-MM.
     */
    public static String formatPeriod(LocalDate date) {
        return String.format("%d-%02d", date.getYear(), date.getMonthValue());
    }

    /**
     * Calculate and set all derived totals.
     */
    public void calculateTotals() {
        // Box 4: Total supplies
        this.box4TotalSupplies = this.box1StandardRatedSupplies
                .add(this.box2ZeroRatedSupplies)
                .add(this.box3ExemptSupplies);

        // Box 7: Total input VAT
        this.box7TotalInputVat = this.box5aInputVatCapital.add(this.box6aInputVatOther);

        // Box 13: Total adjustments
        this.box13TotalAdjustments = this.box8ChangeInUseIncrease
                .subtract(this.box9ChangeInUseDecrease)
                .add(this.box10BadDebtsRecovered)
                .subtract(this.box11BadDebtsWrittenOff)
                .add(this.box12OtherAdjustments);

        // Box 14: Output VAT payable
        this.box14OutputVatPayable = this.box1aOutputVat
                .add(this.box8ChangeInUseIncrease)
                .add(this.box10BadDebtsRecovered);

        // Box 15: Input VAT deductible
        this.box15InputVatDeductible = this.box7TotalInputVat
                .add(this.box9ChangeInUseDecrease)
                .add(this.box11BadDebtsWrittenOff);

        // Box 16/17: Net VAT payable or refundable
        BigDecimal netVat = this.box14OutputVatPayable.subtract(this.box15InputVatDeductible);
        if (netVat.compareTo(BigDecimal.ZERO) > 0) {
            this.box16VatPayable = netVat;
            this.box17VatRefundable = BigDecimal.ZERO;
        } else {
            this.box16VatPayable = BigDecimal.ZERO;
            this.box17VatRefundable = netVat.abs();
        }
    }

    /**
     * Calculate payment due date (last business day of month following VAT period).
     */
    public void calculatePaymentDueDate() {
        // VAT is due by the last business day of the month following the VAT period
        LocalDate endOfFollowingMonth = this.periodEnd.plusMonths(1)
                .withDayOfMonth(this.periodEnd.plusMonths(1).lengthOfMonth());

        // Adjust for weekends
        while (endOfFollowingMonth.getDayOfWeek().getValue() > 5) {
            endOfFollowingMonth = endOfFollowingMonth.minusDays(1);
        }

        this.paymentDueDate = endOfFollowingMonth;
    }

    /**
     * Mark as preview (ready for review).
     */
    public void markAsPreview(UUID userId) {
        this.status = ReportStatus.PREVIEW;
        this.generatedAt = Instant.now();
        this.generatedBy = userId;
    }

    /**
     * Finalize the report for submission.
     */
    public void finalize(UUID userId) {
        if (this.status != ReportStatus.PREVIEW) {
            throw new IllegalStateException("Report must be in PREVIEW status to finalize");
        }
        this.status = ReportStatus.GENERATED;
        this.generatedAt = Instant.now();
        this.generatedBy = userId;
    }

    /**
     * Mark as submitted to SARS.
     */
    public void markAsSubmitted(UUID userId, String sarsReference) {
        if (this.status != ReportStatus.GENERATED) {
            throw new IllegalStateException("Report must be in GENERATED status to submit");
        }
        this.status = ReportStatus.SUBMITTED;
        this.submittedAt = Instant.now();
        this.submittedBy = userId;
        this.sarsReference = sarsReference;
    }

    /**
     * Record payment.
     */
    public void recordPayment(BigDecimal amount, String reference) {
        this.paidAt = Instant.now();
        this.paidAmount = amount;
        this.paymentReference = reference;
        this.status = ReportStatus.PAID;
    }

    /**
     * Check if report is editable.
     */
    public boolean isEditable() {
        return this.status == ReportStatus.DRAFT || this.status == ReportStatus.PREVIEW;
    }

    /**
     * Get net VAT amount (positive = payable, negative = refundable).
     */
    public BigDecimal getNetVat() {
        return this.box14OutputVatPayable.subtract(this.box15InputVatDeductible);
    }

    /**
     * Check if VAT is payable (vs refundable).
     */
    public boolean isVatPayable() {
        return getNetVat().compareTo(BigDecimal.ZERO) > 0;
    }

    /**
     * Add a line item.
     */
    public void addLine(VatReportLine line) {
        line.setVatReport(this);
        this.lines.add(line);
    }

    /**
     * Add a transaction.
     */
    public void addTransaction(VatReportTransaction transaction) {
        transaction.setVatReport(this);
        this.transactions.add(transaction);
    }

    /**
     * Clear all lines and transactions (for regeneration).
     */
    public void clearDetails() {
        this.lines.clear();
        this.transactions.clear();
    }
}
