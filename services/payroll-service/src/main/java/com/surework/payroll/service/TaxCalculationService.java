package com.surework.payroll.service;

import com.surework.payroll.domain.TaxBracket;
import com.surework.payroll.domain.TaxTable;
import com.surework.payroll.dto.PayrollDto;
import com.surework.payroll.repository.TaxTableRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Period;

/**
 * Service for South African PAYE tax calculations.
 * Implements the SARS PAYE calculation methodology.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class TaxCalculationService {

    private final TaxTableRepository taxTableRepository;

    // Standard rates
    private static final BigDecimal UIF_RATE = new BigDecimal("0.01"); // 1%
    private static final BigDecimal SDL_RATE = new BigDecimal("0.01"); // 1% (Skills Development Levy)
    private static final int MONTHS_IN_YEAR = 12;

    /**
     * Calculate PAYE and other statutory deductions for monthly income.
     *
     * @param grossMonthlyIncome Monthly gross income
     * @param dateOfBirth        Employee's date of birth (for rebate calculation)
     * @param pensionContribution Monthly pension fund contribution (pre-tax deduction)
     * @param retirementAnnuity  Monthly retirement annuity contribution
     * @param medicalAidMembers  Number of medical aid main members
     * @param medicalAidDependants Number of medical aid dependants
     * @param paymentDate        Date of payment (for tax table lookup)
     * @return Tax calculation result
     */
    public PayrollDto.TaxCalculationResult calculateMonthlyTax(
            BigDecimal grossMonthlyIncome,
            LocalDate dateOfBirth,
            BigDecimal pensionContribution,
            BigDecimal retirementAnnuity,
            int medicalAidMembers,
            int medicalAidDependants,
            LocalDate paymentDate) {

        // Get the applicable tax table
        TaxTable taxTable = taxTableRepository.findActiveForDate(paymentDate)
                .orElseGet(TaxTable::create2025_2026);

        // Calculate age for rebate determination
        int age = calculateAge(dateOfBirth, paymentDate);

        // Calculate taxable income after pension deductions
        BigDecimal pensionDeduction = pensionContribution != null ? pensionContribution : BigDecimal.ZERO;
        BigDecimal raDeduction = retirementAnnuity != null ? retirementAnnuity : BigDecimal.ZERO;

        // Pension fund deduction is limited (section 11F) - up to 27.5% of remuneration, max R350,000 annually
        BigDecimal maxPensionDeductionAnnual = grossMonthlyIncome.multiply(BigDecimal.valueOf(MONTHS_IN_YEAR))
                .multiply(new BigDecimal("0.275"))
                .min(new BigDecimal("350000"));
        BigDecimal maxPensionDeductionMonthly = maxPensionDeductionAnnual.divide(BigDecimal.valueOf(MONTHS_IN_YEAR), 2, RoundingMode.HALF_UP);

        BigDecimal actualPensionDeduction = pensionDeduction.add(raDeduction).min(maxPensionDeductionMonthly);
        BigDecimal taxableMonthlyIncome = grossMonthlyIncome.subtract(actualPensionDeduction);

        // Annualize for tax calculation
        BigDecimal annualTaxableIncome = taxableMonthlyIncome.multiply(BigDecimal.valueOf(MONTHS_IN_YEAR));

        // Get applicable threshold
        BigDecimal threshold = taxTable.getApplicableThreshold(age);

        BigDecimal annualTaxBeforeRebate = BigDecimal.ZERO;
        BigDecimal monthlyPaye = BigDecimal.ZERO;
        String taxBracketDescription = "Below threshold";

        // Only calculate tax if above threshold
        if (annualTaxableIncome.compareTo(threshold) > 0) {
            // Find the applicable tax bracket and calculate tax
            TaxBracket applicableBracket = null;
            for (TaxBracket bracket : taxTable.getBrackets()) {
                if (bracket.containsIncome(annualTaxableIncome)) {
                    applicableBracket = bracket;
                    break;
                }
            }

            if (applicableBracket != null) {
                annualTaxBeforeRebate = applicableBracket.calculateTax(annualTaxableIncome);
                taxBracketDescription = applicableBracket.getDescription();
            }

            // Apply rebates
            BigDecimal rebate = taxTable.getApplicableRebate(age);
            BigDecimal annualTaxAfterRebate = annualTaxBeforeRebate.subtract(rebate).max(BigDecimal.ZERO);

            // Apply medical tax credits
            BigDecimal medicalTaxCredit = taxTable.calculateMedicalTaxCredit(medicalAidMembers, medicalAidDependants);
            BigDecimal annualTaxAfterCredits = annualTaxAfterRebate.subtract(medicalTaxCredit).max(BigDecimal.ZERO);

            // Calculate monthly PAYE
            monthlyPaye = annualTaxAfterCredits.divide(BigDecimal.valueOf(MONTHS_IN_YEAR), 2, RoundingMode.HALF_UP);

            // Calculate UIF
            BigDecimal uifBase = grossMonthlyIncome.min(taxTable.getUifMonthlyCeiling());
            BigDecimal uifEmployee = uifBase.multiply(UIF_RATE).setScale(2, RoundingMode.HALF_UP);
            BigDecimal uifEmployer = uifBase.multiply(UIF_RATE).setScale(2, RoundingMode.HALF_UP);

            // Calculate effective tax rate
            BigDecimal effectiveRate = annualTaxableIncome.compareTo(BigDecimal.ZERO) > 0
                    ? annualTaxAfterCredits.divide(annualTaxableIncome, 4, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            return new PayrollDto.TaxCalculationResult(
                    grossMonthlyIncome,
                    taxableMonthlyIncome,
                    annualTaxableIncome,
                    annualTaxBeforeRebate,
                    rebate,
                    medicalTaxCredit.divide(BigDecimal.valueOf(MONTHS_IN_YEAR), 2, RoundingMode.HALF_UP),
                    annualTaxAfterCredits,
                    monthlyPaye,
                    uifEmployee,
                    uifEmployer,
                    taxBracketDescription,
                    effectiveRate
            );
        }

        // Below threshold - no PAYE
        BigDecimal uifBase = grossMonthlyIncome.min(taxTable.getUifMonthlyCeiling());
        BigDecimal uifEmployee = uifBase.multiply(UIF_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal uifEmployer = uifBase.multiply(UIF_RATE).setScale(2, RoundingMode.HALF_UP);

        return new PayrollDto.TaxCalculationResult(
                grossMonthlyIncome,
                taxableMonthlyIncome,
                annualTaxableIncome,
                BigDecimal.ZERO,
                taxTable.getApplicableRebate(age),
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                uifEmployee,
                uifEmployer,
                taxBracketDescription,
                BigDecimal.ZERO
        );
    }

    /**
     * Calculate UIF contribution.
     *
     * @param grossMonthlyIncome Monthly gross income
     * @param paymentDate        Date for ceiling lookup
     * @return Array of [employee contribution, employer contribution]
     */
    public BigDecimal[] calculateUif(BigDecimal grossMonthlyIncome, LocalDate paymentDate) {
        TaxTable taxTable = taxTableRepository.findActiveForDate(paymentDate)
                .orElseGet(TaxTable::create2025_2026);

        BigDecimal uifBase = grossMonthlyIncome.min(taxTable.getUifMonthlyCeiling());
        BigDecimal uifEmployee = uifBase.multiply(UIF_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal uifEmployer = uifBase.multiply(UIF_RATE).setScale(2, RoundingMode.HALF_UP);

        return new BigDecimal[]{uifEmployee, uifEmployer};
    }

    /**
     * Calculate Skills Development Levy (employer only).
     *
     * @param grossMonthlyPayroll Total monthly payroll
     * @return SDL amount
     */
    public BigDecimal calculateSdl(BigDecimal grossMonthlyPayroll) {
        return grossMonthlyPayroll.multiply(SDL_RATE).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Calculate age from date of birth.
     */
    private int calculateAge(LocalDate dateOfBirth, LocalDate currentDate) {
        if (dateOfBirth == null) {
            return 30; // Default age if not provided
        }
        return Period.between(dateOfBirth, currentDate).getYears();
    }

    /**
     * Determine the South African tax year for a given date.
     * Tax year runs from 1 March to end of February.
     *
     * @param date The date to check
     * @return Tax year string (e.g., "2025/2026")
     */
    public String getTaxYear(LocalDate date) {
        int year = date.getYear();
        int month = date.getMonthValue();

        // If before March, we're in the previous tax year
        if (month < 3) {
            return (year - 1) + "/" + year;
        }
        return year + "/" + (year + 1);
    }

    /**
     * Get the start date of the tax year containing the given date.
     */
    public LocalDate getTaxYearStartDate(LocalDate date) {
        int year = date.getYear();
        int month = date.getMonthValue();

        if (month < 3) {
            return LocalDate.of(year - 1, 3, 1);
        }
        return LocalDate.of(year, 3, 1);
    }

    /**
     * Get the end date of the tax year containing the given date.
     */
    public LocalDate getTaxYearEndDate(LocalDate date) {
        int year = date.getYear();
        int month = date.getMonthValue();

        if (month < 3) {
            // End is end of February in current year
            return LocalDate.of(year, 2, 28);
        }
        // End is end of February next year
        return LocalDate.of(year + 1, 2, 28);
    }
}
