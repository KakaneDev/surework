package com.surework.accounting.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Tracks payroll runs that have been journaled.
 * Used for idempotency to prevent duplicate journal entries.
 */
@Entity
@Table(name = "payroll_journal_entries", indexes = {
        @Index(name = "idx_payroll_journal_period", columnList = "period_year, period_month"),
        @Index(name = "idx_payroll_journal_tenant", columnList = "tenant_id")
})
@Getter
@Setter
@NoArgsConstructor
public class PayrollJournalEntry {

    public enum Status {
        CREATED,    // Journal entry created
        POSTED,     // Journal entry posted
        REVERSED,   // Journal entry reversed
        FAILED      // Failed to create journal entry
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "payroll_run_id", nullable = false, unique = true)
    private UUID payrollRunId;

    @Column(name = "payroll_run_number", nullable = false, length = 50)
    private String payrollRunNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_entry_id", nullable = false)
    private JournalEntry journalEntry;

    @Column(name = "period_year", nullable = false)
    private int periodYear;

    @Column(name = "period_month", nullable = false)
    private int periodMonth;

    @Column(name = "total_gross", precision = 15, scale = 2, nullable = false)
    private BigDecimal totalGross;

    @Column(name = "total_paye", precision = 15, scale = 2, nullable = false)
    private BigDecimal totalPaye;

    @Column(name = "total_uif", precision = 15, scale = 2, nullable = false)
    private BigDecimal totalUif;

    @Column(name = "total_sdl", precision = 15, scale = 2)
    private BigDecimal totalSdl;

    @Column(name = "total_pension", precision = 15, scale = 2)
    private BigDecimal totalPension;

    @Column(name = "total_medical", precision = 15, scale = 2)
    private BigDecimal totalMedical;

    @Column(name = "total_net", precision = 15, scale = 2, nullable = false)
    private BigDecimal totalNet;

    @Column(name = "total_employer_cost", precision = 15, scale = 2, nullable = false)
    private BigDecimal totalEmployerCost;

    @Column(name = "employee_count", nullable = false)
    private int employeeCount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private Status status = Status.CREATED;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    @Version
    @Column(name = "version")
    private Long version;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    /**
     * Create a new payroll journal entry record with minimal required fields.
     * Use setters to populate totals before saving.
     */
    public static PayrollJournalEntry create(
            UUID payrollRunId,
            String payrollRunNumber,
            JournalEntry journalEntry,
            int periodYear,
            int periodMonth
    ) {
        PayrollJournalEntry entry = new PayrollJournalEntry();
        entry.setPayrollRunId(payrollRunId);
        entry.setPayrollRunNumber(payrollRunNumber);
        entry.setJournalEntry(journalEntry);
        entry.setPeriodYear(periodYear);
        entry.setPeriodMonth(periodMonth);
        entry.setStatus(Status.CREATED);
        // Initialize totals to zero
        entry.setTotalGross(BigDecimal.ZERO);
        entry.setTotalPaye(BigDecimal.ZERO);
        entry.setTotalUif(BigDecimal.ZERO);
        entry.setTotalSdl(BigDecimal.ZERO);
        entry.setTotalPension(BigDecimal.ZERO);
        entry.setTotalMedical(BigDecimal.ZERO);
        entry.setTotalNet(BigDecimal.ZERO);
        entry.setTotalEmployerCost(BigDecimal.ZERO);
        return entry;
    }

    /**
     * Create a new payroll journal entry record with all fields.
     */
    public static PayrollJournalEntry create(
            UUID payrollRunId,
            String payrollRunNumber,
            JournalEntry journalEntry,
            int periodYear,
            int periodMonth,
            BigDecimal totalGross,
            BigDecimal totalPaye,
            BigDecimal totalUif,
            BigDecimal totalSdl,
            BigDecimal totalPension,
            BigDecimal totalMedical,
            BigDecimal totalNet,
            BigDecimal totalEmployerCost,
            int employeeCount
    ) {
        PayrollJournalEntry entry = new PayrollJournalEntry();
        entry.setPayrollRunId(payrollRunId);
        entry.setPayrollRunNumber(payrollRunNumber);
        entry.setJournalEntry(journalEntry);
        entry.setPeriodYear(periodYear);
        entry.setPeriodMonth(periodMonth);
        entry.setTotalGross(totalGross);
        entry.setTotalPaye(totalPaye);
        entry.setTotalUif(totalUif);
        entry.setTotalSdl(totalSdl);
        entry.setTotalPension(totalPension);
        entry.setTotalMedical(totalMedical);
        entry.setTotalNet(totalNet);
        entry.setTotalEmployerCost(totalEmployerCost);
        entry.setEmployeeCount(employeeCount);
        entry.setStatus(Status.CREATED);
        return entry;
    }

    /**
     * Mark as posted.
     */
    public void markAsPosted() {
        this.status = Status.POSTED;
    }

    /**
     * Mark as reversed.
     */
    public void markAsReversed() {
        this.status = Status.REVERSED;
    }

    /**
     * Get period display string.
     */
    public String getPeriodDisplay() {
        return String.format("%d-%02d", periodYear, periodMonth);
    }
}
