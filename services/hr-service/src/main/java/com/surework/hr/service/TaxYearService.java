package com.surework.hr.service;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Month;

/**
 * Service for handling South African tax year calculations.
 *
 * South African Tax Year: 1 March to 28/29 February
 *
 * Tax Year 2026 = 1 March 2025 to 28 February 2026
 * Tax Year 2027 = 1 March 2026 to 28 February 2027
 *
 * For leave purposes, a tax year is identified by its ending year.
 * e.g., Tax Year 2027 covers 1 March 2026 to 28 February 2027.
 */
@Service
public class TaxYearService {

    /**
     * Get the tax year for a given date.
     * Returns the year the tax year ends in.
     *
     * Examples:
     * - 15 January 2026 → Tax Year 2026 (1 March 2025 - 28 Feb 2026)
     * - 15 March 2026 → Tax Year 2027 (1 March 2026 - 28 Feb 2027)
     */
    public int getTaxYear(LocalDate date) {
        // If date is in January or February, it's in the tax year ending that same year
        // If date is March onwards, it's in the tax year ending next year
        if (date.getMonth() == Month.JANUARY || date.getMonth() == Month.FEBRUARY) {
            return date.getYear();
        } else {
            return date.getYear() + 1;
        }
    }

    /**
     * Get the current tax year.
     */
    public int getCurrentTaxYear() {
        return getTaxYear(LocalDate.now());
    }

    /**
     * Get the start date of a tax year.
     *
     * Tax Year 2026 starts on 1 March 2025.
     */
    public LocalDate getTaxYearStart(int taxYear) {
        return LocalDate.of(taxYear - 1, Month.MARCH, 1);
    }

    /**
     * Get the end date of a tax year.
     *
     * Tax Year 2026 ends on 28/29 February 2026 (depends on leap year).
     */
    public LocalDate getTaxYearEnd(int taxYear) {
        // Last day of February in the ending year
        return LocalDate.of(taxYear, Month.FEBRUARY, 1).plusMonths(1).minusDays(1);
    }

    /**
     * Check if a date falls within a specific tax year.
     */
    public boolean isInTaxYear(LocalDate date, int taxYear) {
        return getTaxYear(date) == taxYear;
    }

    /**
     * Get a human-readable label for the tax year.
     *
     * Example: Tax Year 2027 → "March 2026 - February 2027"
     */
    public String getTaxYearLabel(int taxYear) {
        return String.format("March %d - February %d", taxYear - 1, taxYear);
    }

    /**
     * Calculate the number of days worked in the tax year for accrual calculations.
     * This is used for the BCEA formula: 1 day of leave per 17 days worked.
     */
    public int getDaysWorkedInTaxYear(LocalDate hireDate, LocalDate asOfDate, int taxYear) {
        LocalDate taxYearStart = getTaxYearStart(taxYear);
        LocalDate taxYearEnd = getTaxYearEnd(taxYear);

        // If hired after tax year, no days worked
        if (hireDate.isAfter(taxYearEnd)) {
            return 0;
        }

        // Start counting from hire date or tax year start, whichever is later
        LocalDate countStart = hireDate.isAfter(taxYearStart) ? hireDate : taxYearStart;

        // End counting at asOfDate or tax year end, whichever is earlier
        LocalDate countEnd = asOfDate.isBefore(taxYearEnd) ? asOfDate : taxYearEnd;

        if (countStart.isAfter(countEnd)) {
            return 0;
        }

        // Count working days (simplified - would need to integrate with PublicHolidayService for accuracy)
        int daysWorked = 0;
        LocalDate current = countStart;
        while (!current.isAfter(countEnd)) {
            int dayOfWeek = current.getDayOfWeek().getValue();
            if (dayOfWeek < 6) { // Monday to Friday
                daysWorked++;
            }
            current = current.plusDays(1);
        }

        return daysWorked;
    }

    /**
     * Calculate accrued annual leave based on days worked.
     * BCEA formula: 1 day of leave per 17 working days.
     *
     * Maximum entitlement is 15 working days (21 consecutive days).
     */
    public double calculateAccruedAnnualLeave(int daysWorked) {
        // 1 day per 17 days worked, max 15 days
        double accrued = daysWorked / 17.0;
        return Math.min(accrued, 15.0);
    }

    /**
     * Get the previous tax year.
     */
    public int getPreviousTaxYear(int taxYear) {
        return taxYear - 1;
    }

    /**
     * Get the next tax year.
     */
    public int getNextTaxYear(int taxYear) {
        return taxYear + 1;
    }
}
