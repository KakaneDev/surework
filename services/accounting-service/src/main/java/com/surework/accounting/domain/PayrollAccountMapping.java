package com.surework.accounting.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * Maps payroll components to GL accounts for automated journal entries.
 * Supports department-specific mappings for cost allocation.
 */
@Entity
@Table(name = "payroll_account_mappings", indexes = {
        @Index(name = "idx_payroll_mappings_type", columnList = "mapping_type"),
        @Index(name = "idx_payroll_mappings_tenant", columnList = "tenant_id"),
        @Index(name = "idx_payroll_mappings_type_tenant", columnList = "mapping_type, tenant_id")
})
@Getter
@Setter
@NoArgsConstructor
public class PayrollAccountMapping extends BaseEntity {

    /**
     * Types of payroll account mappings.
     */
    public enum MappingType {
        // Expense accounts (debits)
        SALARY_EXPENSE,           // Gross salaries expense
        UIF_EMPLOYER_EXPENSE,     // UIF employer contribution expense
        SDL_EXPENSE,              // Skills Development Levy expense
        PENSION_EMPLOYER_EXPENSE, // Pension employer contribution expense
        MEDICAL_EMPLOYER_EXPENSE, // Medical aid employer contribution expense

        // Liability accounts (credits)
        PAYE_LIABILITY,              // PAYE payable to SARS
        UIF_EMPLOYEE_LIABILITY,      // UIF employee portion payable
        UIF_EMPLOYER_LIABILITY,      // UIF employer portion payable
        SDL_LIABILITY,               // SDL payable
        PENSION_EMPLOYEE_LIABILITY,  // Pension employee deductions payable
        PENSION_EMPLOYER_LIABILITY,  // Pension employer contribution payable
        MEDICAL_EMPLOYEE_LIABILITY,  // Medical aid employee deductions payable
        MEDICAL_EMPLOYER_LIABILITY,  // Medical aid employer contribution payable
        OTHER_DEDUCTIONS_LIABILITY,  // Other deductions payable
        NET_PAY_LIABILITY,           // Net salaries payable to employees

        // Bank account
        BANK_ACCOUNT                 // Bank account for salary payments
    }

    /**
     * Tenant ID for multi-tenant data isolation.
     */
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "mapping_type", nullable = false, length = 50)
    private MappingType mappingType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    /**
     * Optional department ID for department-specific expense allocation.
     */
    @Column(name = "department_id")
    private UUID departmentId;

    /**
     * Whether this is the default mapping (used when no department-specific mapping exists).
     */
    @Column(name = "is_default", nullable = false)
    private boolean isDefault = false;

    /**
     * Whether this mapping is active.
     */
    @Column(name = "active", nullable = false)
    private boolean active = true;

    /**
     * Create a new default mapping.
     */
    public static PayrollAccountMapping createDefault(MappingType mappingType, Account account) {
        PayrollAccountMapping mapping = new PayrollAccountMapping();
        mapping.setMappingType(mappingType);
        mapping.setAccount(account);
        mapping.setDefault(true);
        mapping.setActive(true);
        return mapping;
    }

    /**
     * Create a department-specific mapping.
     */
    public static PayrollAccountMapping createForDepartment(MappingType mappingType, Account account, UUID departmentId) {
        PayrollAccountMapping mapping = new PayrollAccountMapping();
        mapping.setMappingType(mappingType);
        mapping.setAccount(account);
        mapping.setDepartmentId(departmentId);
        mapping.setDefault(false);
        mapping.setActive(true);
        return mapping;
    }
}
