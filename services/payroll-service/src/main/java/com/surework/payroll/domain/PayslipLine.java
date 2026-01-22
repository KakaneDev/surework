package com.surework.payroll.domain;

import com.surework.common.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Represents a line item on a payslip.
 * Can be an earning, deduction, or employer contribution.
 */
@Entity
@Table(name = "payslip_lines", indexes = {
        @Index(name = "idx_payslip_lines_payslip", columnList = "payslip_id"),
        @Index(name = "idx_payslip_lines_type", columnList = "line_type")
})
@Getter
@Setter
@NoArgsConstructor
public class PayslipLine extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payslip_id", nullable = false)
    private Payslip payslip;

    @Enumerated(EnumType.STRING)
    @Column(name = "line_type", nullable = false)
    private LineType lineType;

    @Column(name = "code", nullable = false, length = 20)
    private String code;

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "quantity", precision = 10, scale = 2)
    private BigDecimal quantity;

    @Column(name = "rate", precision = 12, scale = 2)
    private BigDecimal rate;

    @Column(name = "amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "ytd_amount", precision = 15, scale = 2)
    private BigDecimal ytdAmount = BigDecimal.ZERO;

    @Column(name = "is_taxable")
    private boolean taxable = true;

    @Column(name = "is_pensionable")
    private boolean pensionable = true;

    @Column(name = "sort_order")
    private int sortOrder = 0;

    @Column(name = "notes")
    private String notes;

    /**
     * Type of payslip line.
     */
    public enum LineType {
        EARNING,                // Regular earnings (salary, wages)
        ALLOWANCE,              // Allowances (travel, housing, etc.)
        BONUS,                  // Bonuses and incentives
        OVERTIME,               // Overtime payments
        COMMISSION,             // Sales commission
        STATUTORY_DEDUCTION,    // PAYE, UIF employee contribution
        VOLUNTARY_DEDUCTION,    // Pension, medical aid, etc.
        LOAN_DEDUCTION,         // Loan repayments
        OTHER_DEDUCTION,        // Other deductions
        EMPLOYER_CONTRIBUTION,  // UIF employer, pension employer
        REIMBURSEMENT,          // Expense reimbursements (non-taxable)
        BENEFIT_IN_KIND         // Fringe benefits
    }

    /**
     * Common earning codes.
     */
    public static class EarningCodes {
        public static final String BASIC_SALARY = "BASIC";
        public static final String OVERTIME = "OT";
        public static final String OVERTIME_1_5 = "OT15";
        public static final String OVERTIME_2_0 = "OT20";
        public static final String BONUS = "BONUS";
        public static final String COMMISSION = "COMM";
        public static final String TRAVEL_ALLOWANCE = "TRAVEL";
        public static final String HOUSING_ALLOWANCE = "HOUSING";
        public static final String PHONE_ALLOWANCE = "PHONE";
        public static final String SHIFT_ALLOWANCE = "SHIFT";
        public static final String LEAVE_PAYOUT = "LVPAY";
    }

    /**
     * Common deduction codes.
     */
    public static class DeductionCodes {
        public static final String PAYE = "PAYE";
        public static final String UIF_EMPLOYEE = "UIF";
        public static final String PENSION = "PEN";
        public static final String MEDICAL_AID = "MED";
        public static final String RETIREMENT_ANNUITY = "RA";
        public static final String LOAN = "LOAN";
        public static final String GARNISHEE = "GARN";
        public static final String UNION_FEE = "UNION";
    }

    /**
     * Common employer contribution codes.
     */
    public static class EmployerCodes {
        public static final String UIF_EMPLOYER = "UIFER";
        public static final String PENSION_EMPLOYER = "PENER";
        public static final String MEDICAL_EMPLOYER = "MEDER";
        public static final String SDL = "SDL";
    }

    /**
     * Create an earning line.
     */
    public static PayslipLine earning(String code, String description, BigDecimal amount) {
        PayslipLine line = new PayslipLine();
        line.setLineType(LineType.EARNING);
        line.setCode(code);
        line.setDescription(description);
        line.setAmount(amount);
        return line;
    }

    /**
     * Create an earning line with quantity and rate.
     */
    public static PayslipLine earning(String code, String description, BigDecimal quantity, BigDecimal rate) {
        PayslipLine line = earning(code, description, quantity.multiply(rate));
        line.setQuantity(quantity);
        line.setRate(rate);
        return line;
    }

    /**
     * Create an allowance line.
     */
    public static PayslipLine allowance(String code, String description, BigDecimal amount, boolean taxable) {
        PayslipLine line = new PayslipLine();
        line.setLineType(LineType.ALLOWANCE);
        line.setCode(code);
        line.setDescription(description);
        line.setAmount(amount);
        line.setTaxable(taxable);
        line.setPensionable(false);
        return line;
    }

    /**
     * Create a statutory deduction line.
     */
    public static PayslipLine statutoryDeduction(String code, String description, BigDecimal amount) {
        PayslipLine line = new PayslipLine();
        line.setLineType(LineType.STATUTORY_DEDUCTION);
        line.setCode(code);
        line.setDescription(description);
        line.setAmount(amount);
        line.setTaxable(false);
        line.setPensionable(false);
        return line;
    }

    /**
     * Create a voluntary deduction line.
     */
    public static PayslipLine voluntaryDeduction(String code, String description, BigDecimal amount) {
        PayslipLine line = new PayslipLine();
        line.setLineType(LineType.VOLUNTARY_DEDUCTION);
        line.setCode(code);
        line.setDescription(description);
        line.setAmount(amount);
        line.setTaxable(false);
        line.setPensionable(false);
        return line;
    }

    /**
     * Create an employer contribution line.
     */
    public static PayslipLine employerContribution(String code, String description, BigDecimal amount) {
        PayslipLine line = new PayslipLine();
        line.setLineType(LineType.EMPLOYER_CONTRIBUTION);
        line.setCode(code);
        line.setDescription(description);
        line.setAmount(amount);
        line.setTaxable(false);
        line.setPensionable(false);
        return line;
    }
}
