package com.surework.hr.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Employee entity representing a company employee.
 * Implements User Story 1: Employee Management.
 *
 * All employee records are tenant-scoped and stored in tenant-specific schemas.
 * The tenantId field provides defense-in-depth for tenant isolation.
 */
@Entity
@Table(name = "employees")
@Getter
@Setter
@NoArgsConstructor
public class Employee extends BaseEntity {

    /**
     * Tenant ID for defense-in-depth isolation.
     * Primary isolation is via schema-per-tenant; this is a secondary safeguard.
     */
    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(nullable = false, unique = true)
    private String employeeNumber;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    private String middleName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false, unique = true)
    private String idNumber; // South African ID number

    private String passportNumber;

    @Column(nullable = false)
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Gender gender;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MaritalStatus maritalStatus = MaritalStatus.SINGLE;

    // Address
    private String streetAddress;
    private String suburb;
    private String city;
    private String province;
    private String postalCode;

    // Employment Details
    @Column(nullable = false)
    private LocalDate hireDate;

    private LocalDate terminationDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmploymentStatus status = EmploymentStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmploymentType employmentType = EmploymentType.PERMANENT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_title_id")
    private JobTitle jobTitle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Employee manager;

    // Compensation
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal basicSalary;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PayFrequency payFrequency = PayFrequency.MONTHLY;

    // Tax Information
    private String taxNumber;

    @Enumerated(EnumType.STRING)
    private TaxStatus taxStatus = TaxStatus.NORMAL;

    // Banking
    private String bankName;
    private String bankAccountNumber;
    private String bankBranchCode;

    @Enumerated(EnumType.STRING)
    private BankAccountType bankAccountType = BankAccountType.SAVINGS;

    // Emergency Contact
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String emergencyContactRelationship;

    // Link to user account
    private UUID userId;

    /**
     * Get full name.
     */
    public String getFullName() {
        if (middleName != null && !middleName.isBlank()) {
            return firstName + " " + middleName + " " + lastName;
        }
        return firstName + " " + lastName;
    }

    /**
     * Check if employee is currently active.
     */
    public boolean isActive() {
        return status == EmploymentStatus.ACTIVE && !isDeleted();
    }

    /**
     * Terminate employee.
     */
    public void terminate(LocalDate terminationDate) {
        this.terminationDate = terminationDate;
        this.status = EmploymentStatus.TERMINATED;
    }

    // Enums

    public enum Gender {
        MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY
    }

    public enum MaritalStatus {
        SINGLE, MARRIED, DIVORCED, WIDOWED, DOMESTIC_PARTNERSHIP
    }

    public enum EmploymentStatus {
        ACTIVE,
        ON_LEAVE,
        SUSPENDED,
        TERMINATED,
        RETIRED
    }

    public enum EmploymentType {
        PERMANENT,
        CONTRACT,
        TEMPORARY,
        PART_TIME,
        INTERN
    }

    public enum PayFrequency {
        WEEKLY,
        FORTNIGHTLY,
        MONTHLY
    }

    public enum TaxStatus {
        NORMAL,
        DIRECTIVE
    }

    public enum BankAccountType {
        SAVINGS,
        CHEQUE,
        TRANSMISSION
    }
}
