package com.surework.payroll.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a tax table for a specific tax year.
 * Contains PAYE brackets and rebates for South African tax calculations.
 */
@Entity
@Table(name = "tax_tables", indexes = {
        @Index(name = "idx_tax_tables_year", columnList = "tax_year")
})
@Getter
@Setter
@NoArgsConstructor
public class TaxTable extends BaseEntity {

    @Column(name = "tax_year", nullable = false, unique = true)
    private String taxYear; // e.g., "2025/2026"

    @Column(name = "start_year", nullable = false)
    private int startYear; // e.g., 2025

    @Column(name = "end_year", nullable = false)
    private int endYear; // e.g., 2026

    @Column(name = "effective_from", nullable = false)
    private java.time.LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private java.time.LocalDate effectiveTo;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    // Tax rebates (annual amounts)
    @Column(name = "primary_rebate", precision = 12, scale = 2, nullable = false)
    private BigDecimal primaryRebate; // All taxpayers

    @Column(name = "secondary_rebate", precision = 12, scale = 2, nullable = false)
    private BigDecimal secondaryRebate; // 65 years and older

    @Column(name = "tertiary_rebate", precision = 12, scale = 2, nullable = false)
    private BigDecimal tertiaryRebate; // 75 years and older

    // Tax thresholds (annual amounts)
    @Column(name = "threshold_under_65", precision = 12, scale = 2, nullable = false)
    private BigDecimal thresholdUnder65;

    @Column(name = "threshold_65_to_74", precision = 12, scale = 2, nullable = false)
    private BigDecimal threshold65To74;

    @Column(name = "threshold_75_and_over", precision = 12, scale = 2, nullable = false)
    private BigDecimal threshold75AndOver;

    // Medical tax credits (monthly amounts per dependant)
    @Column(name = "medical_credit_main_member", precision = 10, scale = 2, nullable = false)
    private BigDecimal medicalCreditMainMember;

    @Column(name = "medical_credit_first_dependant", precision = 10, scale = 2, nullable = false)
    private BigDecimal medicalCreditFirstDependant;

    @Column(name = "medical_credit_additional", precision = 10, scale = 2, nullable = false)
    private BigDecimal medicalCreditAdditional;

    // UIF ceiling
    @Column(name = "uif_monthly_ceiling", precision = 12, scale = 2, nullable = false)
    private BigDecimal uifMonthlyCeiling;

    @OneToMany(mappedBy = "taxTable", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("minIncome")
    private List<TaxBracket> brackets = new ArrayList<>();

    /**
     * Add a tax bracket to this table.
     */
    public void addBracket(TaxBracket bracket) {
        brackets.add(bracket);
        bracket.setTaxTable(this);
    }

    /**
     * Get the applicable rebate based on age.
     */
    public BigDecimal getApplicableRebate(int age) {
        BigDecimal rebate = primaryRebate;
        if (age >= 65) {
            rebate = rebate.add(secondaryRebate);
        }
        if (age >= 75) {
            rebate = rebate.add(tertiaryRebate);
        }
        return rebate;
    }

    /**
     * Get the applicable threshold based on age.
     */
    public BigDecimal getApplicableThreshold(int age) {
        if (age >= 75) {
            return threshold75AndOver;
        } else if (age >= 65) {
            return threshold65To74;
        }
        return thresholdUnder65;
    }

    /**
     * Calculate medical tax credit for the year.
     */
    public BigDecimal calculateMedicalTaxCredit(int mainMembers, int dependants) {
        BigDecimal annual = BigDecimal.ZERO;

        // Main member(s)
        if (mainMembers > 0) {
            annual = annual.add(medicalCreditMainMember.multiply(BigDecimal.valueOf(mainMembers)));
        }

        // First dependant
        if (dependants > 0) {
            annual = annual.add(medicalCreditFirstDependant);
            dependants--;
        }

        // Additional dependants
        if (dependants > 0) {
            annual = annual.add(medicalCreditAdditional.multiply(BigDecimal.valueOf(dependants)));
        }

        // Return annual amount (monthly * 12)
        return annual.multiply(BigDecimal.valueOf(12));
    }

    /**
     * Create the 2025/2026 tax table with current SARS rates.
     */
    public static TaxTable create2025_2026() {
        TaxTable table = new TaxTable();
        table.setTaxYear("2025/2026");
        table.setStartYear(2025);
        table.setEndYear(2026);
        table.setEffectiveFrom(java.time.LocalDate.of(2025, 3, 1));
        table.setEffectiveTo(java.time.LocalDate.of(2026, 2, 28));
        table.setActive(true);

        // Rebates
        table.setPrimaryRebate(new BigDecimal("17235"));
        table.setSecondaryRebate(new BigDecimal("9444"));
        table.setTertiaryRebate(new BigDecimal("3145"));

        // Thresholds
        table.setThresholdUnder65(new BigDecimal("95750"));
        table.setThreshold65To74(new BigDecimal("148217"));
        table.setThreshold75AndOver(new BigDecimal("165689"));

        // Medical tax credits (monthly)
        table.setMedicalCreditMainMember(new BigDecimal("364"));
        table.setMedicalCreditFirstDependant(new BigDecimal("364"));
        table.setMedicalCreditAdditional(new BigDecimal("246"));

        // UIF ceiling
        table.setUifMonthlyCeiling(new BigDecimal("17712"));

        // Tax brackets (annual income)
        table.addBracket(TaxBracket.create(BigDecimal.ZERO, new BigDecimal("237100"),
                new BigDecimal("0.18"), BigDecimal.ZERO));
        table.addBracket(TaxBracket.create(new BigDecimal("237101"), new BigDecimal("370500"),
                new BigDecimal("0.26"), new BigDecimal("42678")));
        table.addBracket(TaxBracket.create(new BigDecimal("370501"), new BigDecimal("512800"),
                new BigDecimal("0.31"), new BigDecimal("77362")));
        table.addBracket(TaxBracket.create(new BigDecimal("512801"), new BigDecimal("673000"),
                new BigDecimal("0.36"), new BigDecimal("121475")));
        table.addBracket(TaxBracket.create(new BigDecimal("673001"), new BigDecimal("857900"),
                new BigDecimal("0.39"), new BigDecimal("179147")));
        table.addBracket(TaxBracket.create(new BigDecimal("857901"), new BigDecimal("1817000"),
                new BigDecimal("0.41"), new BigDecimal("251258")));
        table.addBracket(TaxBracket.create(new BigDecimal("1817001"), null,
                new BigDecimal("0.45"), new BigDecimal("644489")));

        return table;
    }
}
