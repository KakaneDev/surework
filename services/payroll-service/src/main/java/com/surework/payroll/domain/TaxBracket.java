package com.surework.payroll.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Represents a PAYE tax bracket within a tax table.
 * South African tax is calculated progressively using these brackets.
 */
@Entity
@Table(name = "tax_brackets", indexes = {
        @Index(name = "idx_tax_brackets_table", columnList = "tax_table_id"),
        @Index(name = "idx_tax_brackets_income", columnList = "min_income")
})
@Getter
@Setter
@NoArgsConstructor
public class TaxBracket extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tax_table_id", nullable = false)
    private TaxTable taxTable;

    @Column(name = "min_income", precision = 15, scale = 2, nullable = false)
    private BigDecimal minIncome;

    @Column(name = "max_income", precision = 15, scale = 2)
    private BigDecimal maxIncome; // null for the top bracket

    @Column(name = "rate", precision = 5, scale = 4, nullable = false)
    private BigDecimal rate; // e.g., 0.18 for 18%

    @Column(name = "base_tax", precision = 15, scale = 2, nullable = false)
    private BigDecimal baseTax; // Cumulative tax from lower brackets

    /**
     * Create a tax bracket.
     */
    public static TaxBracket create(BigDecimal minIncome, BigDecimal maxIncome,
                                     BigDecimal rate, BigDecimal baseTax) {
        TaxBracket bracket = new TaxBracket();
        bracket.setMinIncome(minIncome);
        bracket.setMaxIncome(maxIncome);
        bracket.setRate(rate);
        bracket.setBaseTax(baseTax);
        return bracket;
    }

    /**
     * Check if an income falls within this bracket.
     */
    public boolean containsIncome(BigDecimal annualIncome) {
        if (annualIncome.compareTo(minIncome) < 0) {
            return false;
        }
        return maxIncome == null || annualIncome.compareTo(maxIncome) <= 0;
    }

    /**
     * Calculate tax for income in this bracket.
     *
     * @param annualIncome The annual taxable income
     * @return The calculated tax before rebates
     */
    public BigDecimal calculateTax(BigDecimal annualIncome) {
        if (!containsIncome(annualIncome)) {
            throw new IllegalArgumentException("Income does not fall within this bracket");
        }

        // Tax = Base tax + (Income - Bracket minimum) * Rate
        BigDecimal incomeInBracket = annualIncome.subtract(minIncome);
        BigDecimal taxInBracket = incomeInBracket.multiply(rate).setScale(2, RoundingMode.HALF_UP);

        return baseTax.add(taxInBracket);
    }

    /**
     * Get the rate as a percentage string.
     */
    public String getRatePercentage() {
        return rate.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP) + "%";
    }

    /**
     * Get a description of this bracket.
     */
    public String getDescription() {
        if (maxIncome == null) {
            return String.format("R%,.0f and above at %s",
                    minIncome.doubleValue(), getRatePercentage());
        }
        return String.format("R%,.0f - R%,.0f at %s",
                minIncome.doubleValue(), maxIncome.doubleValue(), getRatePercentage());
    }
}
