package com.surework.payroll.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Represents an employee's payslip for a specific payroll period.
 * Contains all earnings, deductions, and statutory contributions.
 */
@Entity
@Table(name = "payslips", indexes = {
        @Index(name = "idx_payslips_employee", columnList = "employee_id"),
        @Index(name = "idx_payslips_period", columnList = "period_year, period_month"),
        @Index(name = "idx_payslips_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
public class Payslip extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_run_id", nullable = false)
    private PayrollRun payrollRun;

    @Column(name = "payslip_number", nullable = false, unique = true)
    private String payslipNumber;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_number", nullable = false)
    private String employeeNumber;

    @Column(name = "employee_name", nullable = false)
    private String employeeName;

    @Column(name = "id_number")
    private String idNumber;

    @Column(name = "tax_number")
    private String taxNumber;

    @Column(name = "department")
    private String department;

    @Column(name = "job_title")
    private String jobTitle;

    @Column(name = "period_year", nullable = false)
    private int periodYear;

    @Column(name = "period_month", nullable = false)
    private int periodMonth;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    // Earnings
    @Column(name = "basic_salary", precision = 12, scale = 2, nullable = false)
    private BigDecimal basicSalary = BigDecimal.ZERO;

    @Column(name = "gross_earnings", precision = 12, scale = 2, nullable = false)
    private BigDecimal grossEarnings = BigDecimal.ZERO;

    // Statutory Deductions
    @Column(name = "paye", precision = 12, scale = 2, nullable = false)
    private BigDecimal paye = BigDecimal.ZERO;

    @Column(name = "uif_employee", precision = 12, scale = 2, nullable = false)
    private BigDecimal uifEmployee = BigDecimal.ZERO;

    @Column(name = "uif_employer", precision = 12, scale = 2, nullable = false)
    private BigDecimal uifEmployer = BigDecimal.ZERO;

    // Other Deductions
    @Column(name = "pension_fund", precision = 12, scale = 2)
    private BigDecimal pensionFund = BigDecimal.ZERO;

    @Column(name = "medical_aid", precision = 12, scale = 2)
    private BigDecimal medicalAid = BigDecimal.ZERO;

    @Column(name = "other_deductions", precision = 12, scale = 2)
    private BigDecimal otherDeductions = BigDecimal.ZERO;

    @Column(name = "total_deductions", precision = 12, scale = 2, nullable = false)
    private BigDecimal totalDeductions = BigDecimal.ZERO;

    // Net Pay
    @Column(name = "net_pay", precision = 12, scale = 2, nullable = false)
    private BigDecimal netPay = BigDecimal.ZERO;

    // Employer Contributions
    @Column(name = "employer_pension", precision = 12, scale = 2)
    private BigDecimal employerPension = BigDecimal.ZERO;

    @Column(name = "employer_medical", precision = 12, scale = 2)
    private BigDecimal employerMedical = BigDecimal.ZERO;

    @Column(name = "sdl", precision = 12, scale = 2)
    private BigDecimal sdl = BigDecimal.ZERO;

    @Column(name = "total_employer_cost", precision = 12, scale = 2, nullable = false)
    private BigDecimal totalEmployerCost = BigDecimal.ZERO;

    // Year-to-date totals
    @Column(name = "ytd_gross", precision = 15, scale = 2)
    private BigDecimal ytdGross = BigDecimal.ZERO;

    @Column(name = "ytd_paye", precision = 15, scale = 2)
    private BigDecimal ytdPaye = BigDecimal.ZERO;

    @Column(name = "ytd_uif", precision = 15, scale = 2)
    private BigDecimal ytdUif = BigDecimal.ZERO;

    @Column(name = "ytd_net", precision = 15, scale = 2)
    private BigDecimal ytdNet = BigDecimal.ZERO;

    // Tax calculation details
    @Column(name = "taxable_income", precision = 12, scale = 2)
    private BigDecimal taxableIncome = BigDecimal.ZERO;

    @Column(name = "annual_equivalent", precision = 15, scale = 2)
    private BigDecimal annualEquivalent = BigDecimal.ZERO;

    @Column(name = "tax_rebate", precision = 12, scale = 2)
    private BigDecimal taxRebate = BigDecimal.ZERO;

    @Column(name = "medical_tax_credit", precision = 12, scale = 2)
    private BigDecimal medicalTaxCredit = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PayslipStatus status = PayslipStatus.DRAFT;

    @Column(name = "bank_account")
    private String bankAccount;

    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "branch_code")
    private String branchCode;

    @Column(name = "notes", length = 1000)
    private String notes;

    @OneToMany(mappedBy = "payslip", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("lineType, sortOrder")
    private List<PayslipLine> lines = new ArrayList<>();

    /**
     * Status of a payslip.
     */
    public enum PayslipStatus {
        DRAFT,          // Initial calculation
        CALCULATED,     // Calculations complete
        APPROVED,       // Approved for payment
        PAID,           // Payment made
        EXCLUDED,       // Excluded from this run
        VOID            // Voided/cancelled
    }

    /**
     * Create a new payslip for an employee.
     */
    public static Payslip create(UUID employeeId, String employeeNumber, String employeeName,
                                  int periodYear, int periodMonth, LocalDate paymentDate) {
        Payslip payslip = new Payslip();
        payslip.setEmployeeId(employeeId);
        payslip.setEmployeeNumber(employeeNumber);
        payslip.setEmployeeName(employeeName);
        payslip.setPeriodYear(periodYear);
        payslip.setPeriodMonth(periodMonth);
        payslip.setPaymentDate(paymentDate);
        payslip.setPayslipNumber(generatePayslipNumber(employeeNumber, periodYear, periodMonth));
        payslip.setStatus(PayslipStatus.DRAFT);
        return payslip;
    }

    private static String generatePayslipNumber(String employeeNumber, int year, int month) {
        return String.format("PS-%s-%d%02d", employeeNumber, year, month);
    }

    /**
     * Add a line item to the payslip.
     */
    public void addLine(PayslipLine line) {
        lines.add(line);
        line.setPayslip(this);
    }

    /**
     * Remove a line item from the payslip.
     */
    public void removeLine(PayslipLine line) {
        lines.remove(line);
        line.setPayslip(null);
    }

    /**
     * Calculate total deductions.
     */
    public void calculateTotalDeductions() {
        this.totalDeductions = this.paye
                .add(this.uifEmployee)
                .add(this.pensionFund != null ? this.pensionFund : BigDecimal.ZERO)
                .add(this.medicalAid != null ? this.medicalAid : BigDecimal.ZERO)
                .add(this.otherDeductions != null ? this.otherDeductions : BigDecimal.ZERO);
    }

    /**
     * Calculate net pay.
     */
    public void calculateNetPay() {
        this.netPay = this.grossEarnings.subtract(this.totalDeductions);
    }

    /**
     * Calculate total employer cost.
     */
    public void calculateTotalEmployerCost() {
        this.totalEmployerCost = this.grossEarnings
                .add(this.uifEmployer)
                .add(this.employerPension != null ? this.employerPension : BigDecimal.ZERO)
                .add(this.employerMedical != null ? this.employerMedical : BigDecimal.ZERO)
                .add(this.sdl != null ? this.sdl : BigDecimal.ZERO);
    }

    /**
     * Mark the payslip as calculated.
     */
    public void markAsCalculated() {
        this.status = PayslipStatus.CALCULATED;
    }

    /**
     * Approve the payslip.
     */
    public void approve() {
        if (this.status != PayslipStatus.CALCULATED) {
            throw new IllegalStateException("Can only approve a calculated payslip");
        }
        this.status = PayslipStatus.APPROVED;
    }

    /**
     * Mark the payslip as paid.
     */
    public void markAsPaid() {
        if (this.status != PayslipStatus.APPROVED) {
            throw new IllegalStateException("Can only mark an approved payslip as paid");
        }
        this.status = PayslipStatus.PAID;
    }

    /**
     * Exclude the payslip from the current run.
     */
    public void exclude() {
        this.status = PayslipStatus.EXCLUDED;
    }

    /**
     * Void the payslip.
     */
    public void voidPayslip() {
        this.status = PayslipStatus.VOID;
    }
}
