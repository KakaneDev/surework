package com.surework.accounting.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.YearMonth;

/**
 * Represents a fiscal/accounting period.
 * Used for period-end closing and financial reporting.
 */
@Entity
@Table(name = "fiscal_periods", indexes = {
        @Index(name = "idx_fiscal_periods_year", columnList = "fiscal_year"),
        @Index(name = "idx_fiscal_periods_dates", columnList = "start_date, end_date")
})
@Getter
@Setter
@NoArgsConstructor
public class FiscalPeriod extends BaseEntity {

    @Column(name = "fiscal_year", nullable = false)
    private int fiscalYear;

    @Column(name = "period_number", nullable = false)
    private int periodNumber; // 1-12 for monthly, or 1-4 for quarterly

    @Column(name = "period_name", nullable = false)
    private String periodName;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PeriodStatus status = PeriodStatus.OPEN;

    @Column(name = "is_adjustment_period")
    private boolean adjustmentPeriod = false;

    @Column(name = "is_year_end")
    private boolean yearEnd = false;

    @Column(name = "closed_at")
    private java.time.Instant closedAt;

    @Column(name = "closed_by")
    private java.util.UUID closedBy;

    @Column(name = "reopened_at")
    private java.time.Instant reopenedAt;

    @Column(name = "reopened_by")
    private java.util.UUID reopenedBy;

    @Column(name = "notes", length = 1000)
    private String notes;

    /**
     * Period statuses.
     */
    public enum PeriodStatus {
        FUTURE,     // Not yet open
        OPEN,       // Currently open for posting
        CLOSED,     // Closed, no new postings
        LOCKED      // Permanently locked
    }

    /**
     * Create a fiscal period.
     */
    public static FiscalPeriod create(int fiscalYear, int periodNumber,
                                       LocalDate startDate, LocalDate endDate) {
        FiscalPeriod period = new FiscalPeriod();
        period.setFiscalYear(fiscalYear);
        period.setPeriodNumber(periodNumber);
        period.setStartDate(startDate);
        period.setEndDate(endDate);
        period.setPeriodName(generatePeriodName(fiscalYear, periodNumber));
        period.setStatus(PeriodStatus.FUTURE);
        return period;
    }

    private static String generatePeriodName(int year, int period) {
        String[] monthNames = {"January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"};
        if (period >= 1 && period <= 12) {
            return monthNames[period - 1] + " " + year;
        }
        return "Period " + period + " " + year;
    }

    /**
     * Generate fiscal periods for a year.
     * South African fiscal year typically ends in February.
     */
    public static java.util.List<FiscalPeriod> generateFiscalYear(int fiscalYear, int yearEndMonth) {
        java.util.List<FiscalPeriod> periods = new java.util.ArrayList<>();

        // Start from March (month after year end) of previous calendar year
        // to February of the fiscal year
        int startYear = yearEndMonth == 2 ? fiscalYear - 1 : fiscalYear;
        int startMonth = yearEndMonth + 1;
        if (startMonth > 12) {
            startMonth = 1;
            startYear++;
        }

        for (int i = 0; i < 12; i++) {
            int month = (startMonth - 1 + i) % 12 + 1;
            int year = startYear + ((startMonth - 1 + i) / 12);

            YearMonth ym = YearMonth.of(year, month);
            LocalDate startDate = ym.atDay(1);
            LocalDate endDate = ym.atEndOfMonth();

            FiscalPeriod period = FiscalPeriod.create(fiscalYear, i + 1, startDate, endDate);

            // Mark the last period as year-end
            if (i == 11) {
                period.setYearEnd(true);
            }

            periods.add(period);
        }

        return periods;
    }

    /**
     * Check if a date falls within this period.
     */
    public boolean containsDate(LocalDate date) {
        return !date.isBefore(startDate) && !date.isAfter(endDate);
    }

    /**
     * Check if posting is allowed.
     */
    public boolean isPostingAllowed() {
        return status == PeriodStatus.OPEN;
    }

    /**
     * Open the period for posting.
     */
    public void open() {
        if (status == PeriodStatus.LOCKED) {
            throw new IllegalStateException("Cannot open a locked period");
        }
        this.status = PeriodStatus.OPEN;
    }

    /**
     * Close the period.
     */
    public void close(java.util.UUID closedBy) {
        if (status != PeriodStatus.OPEN) {
            throw new IllegalStateException("Only open periods can be closed");
        }
        this.status = PeriodStatus.CLOSED;
        this.closedBy = closedBy;
        this.closedAt = java.time.Instant.now();
    }

    /**
     * Reopen a closed period.
     */
    public void reopen(java.util.UUID reopenedBy) {
        if (status == PeriodStatus.LOCKED) {
            throw new IllegalStateException("Cannot reopen a locked period");
        }
        if (status != PeriodStatus.CLOSED) {
            throw new IllegalStateException("Only closed periods can be reopened");
        }
        this.status = PeriodStatus.OPEN;
        this.reopenedBy = reopenedBy;
        this.reopenedAt = java.time.Instant.now();
    }

    /**
     * Lock the period permanently.
     */
    public void lock() {
        if (status != PeriodStatus.CLOSED) {
            throw new IllegalStateException("Only closed periods can be locked");
        }
        this.status = PeriodStatus.LOCKED;
    }
}
