package com.surework.accounting.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Represents a line item in a VAT report, grouped by account and VAT category.
 */
@Entity
@Table(name = "vat_report_lines", indexes = {
        @Index(name = "idx_vat_report_lines_report", columnList = "vat_report_id"),
        @Index(name = "idx_vat_report_lines_account", columnList = "account_id")
})
@Getter
@Setter
@NoArgsConstructor
public class VatReportLine extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vat_report_id", nullable = false)
    private VatReport vatReport;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private Account account;

    @Column(name = "account_code", length = 20)
    private String accountCode;

    @Column(name = "account_name", length = 200)
    private String accountName;

    @Enumerated(EnumType.STRING)
    @Column(name = "vat_category", nullable = false)
    private VatCategory vatCategory;

    @Column(name = "taxable_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal taxableAmount = BigDecimal.ZERO;

    @Column(name = "vat_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal vatAmount = BigDecimal.ZERO;

    @Column(name = "vat_box", nullable = false, length = 10)
    private String vatBox;

    @Column(name = "transaction_count")
    private int transactionCount = 0;

    /**
     * VAT categories for South African VAT.
     */
    public enum VatCategory {
        STANDARD,       // Standard rated (15%)
        ZERO_RATED,     // Zero-rated (exports, basic food)
        EXEMPT,         // VAT exempt supplies
        OUT_OF_SCOPE,   // Outside VAT scope
        INPUT_VAT,      // Input VAT on purchases
        OUTPUT_VAT,     // Output VAT on sales
        CAPITAL_INPUT   // Input VAT on capital goods
    }

    /**
     * Create a line for an account summary.
     */
    public static VatReportLine create(
            Account account,
            VatCategory category,
            BigDecimal taxableAmount,
            BigDecimal vatAmount,
            String vatBox,
            int transactionCount) {
        VatReportLine line = new VatReportLine();
        line.setAccount(account);
        line.setAccountCode(account.getAccountCode());
        line.setAccountName(account.getAccountName());
        line.setVatCategory(category);
        line.setTaxableAmount(taxableAmount);
        line.setVatAmount(vatAmount);
        line.setVatBox(vatBox);
        line.setTransactionCount(transactionCount);
        return line;
    }

    /**
     * Get the gross amount (taxable + VAT).
     */
    public BigDecimal getGrossAmount() {
        return taxableAmount.add(vatAmount);
    }

    /**
     * Calculate effective VAT rate.
     */
    public BigDecimal getEffectiveVatRate() {
        if (taxableAmount.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return vatAmount.divide(taxableAmount, 4, java.math.RoundingMode.HALF_UP);
    }
}
