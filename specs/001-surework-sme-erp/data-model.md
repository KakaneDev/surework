# Data Model: SureWork - South African SME ERP Platform

**Feature**: 001-surework-sme-erp
**Date**: 2026-01-21
**Phase**: 1 (Design)

## Overview

This document defines the data model for the SureWork platform, following Constitution Principle VII (Database Standards). All entities extend BaseEntity with UUID primary keys, optimistic locking, audit timestamps, and soft delete.

## Schema Strategy

**Multi-Tenancy**: Schema-per-tenant isolation
- Each tenant gets schema: `tenant_{tenantId}`
- Shared infrastructure schemas: `public` (tenant registry), `config` (tax tables)
- Flyway migrations applied per-tenant schema

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              IDENTITY SERVICE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐     ┌──────────┐     ┌──────────────────┐                     │
│  │  Tenant  │────<│   User   │>────│       Role       │                     │
│  └──────────┘     └──────────┘     └──────────────────┘                     │
│                         │                    │                               │
│                         │          ┌─────────────────────┐                   │
│                         │          │ RolePermissionOverride│                  │
│                         │          └─────────────────────┘                   │
│                         ▼                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               HR SERVICE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐     ┌──────────────┐     ┌──────────────┐                     │
│  │ Employee │────<│ LeaveBalance │     │ EmployeeAsset │                     │
│  └──────────┘     └──────────────┘     └──────────────┘                     │
│        │                                      │                              │
│        │          ┌──────────────┐           │                              │
│        └─────────>│ LeaveRequest │<──────────┘                              │
│                   └──────────────┘                                          │
│        │          ┌──────────────┐                                          │
│        └─────────>│EmploymentContract│                                       │
│                   └──────────────┘                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PAYROLL SERVICE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                 │
│  │  PayrollRun  │────<│PayrollLineItem│     │   TaxTable   │                 │
│  └──────────────┘     └──────────────┘     └──────────────┘                 │
│        │                     │                                               │
│        │              ┌──────────────┐                                      │
│        │              │ TwoPotRecord │                                      │
│        │              └──────────────┘                                      │
│        │                     │                                               │
│        │              ┌──────────────────┐                                  │
│        └─────────────>│TwoPotWithdrawalRequest│                              │
│                       └──────────────────┘                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ACCOUNTING SERVICE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                 │
│  │   Account    │────<│ JournalEntry │────<│JournalLineItem│                 │
│  └──────────────┘     └──────────────┘     └──────────────┘                 │
│                              │                                               │
│  ┌──────────────┐           │          ┌──────────────┐                     │
│  │ BankAccount  │───────────┼─────────>│BankTransaction│                    │
│  └──────────────┘           │          └──────────────┘                     │
│                              │                                               │
│  ┌──────────────┐           │                                               │
│  │   Invoice    │───────────┘                                               │
│  └──────────────┘                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RECRUITMENT SERVICE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                 │
│  │  JobPosting  │────<│  Candidate   │────<│BackgroundCheck│                 │
│  └──────────────┘     └──────────────┘     └──────────────┘                 │
│                              │                                               │
│                       ┌──────────────┐                                      │
│                       │  Interview   │                                      │
│                       └──────────────┘                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Base Entity

All entities inherit from BaseEntity (Constitution Principle VII):

```java
@MappedSuperclass
public abstract class BaseEntity {
    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @Version
    private Long version;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private Instant updatedAt;

    @CreatedBy
    @Column(length = 36, updatable = false)
    private String createdBy;

    @LastModifiedBy
    @Column(length = 36)
    private String updatedBy;

    @Column(nullable = false)
    private boolean deleted = false;
}
```

## Entity Definitions

### Identity Service Entities

#### Tenant (public schema)
```java
@Entity
@Table(name = "tenants", schema = "public")
public class Tenant extends BaseEntity {
    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 50)
    private String schemaName; // tenant_{uuid}

    @Column(length = 100)
    private String businessRegistrationNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TenantTier tier; // MICRO, GROWTH, SCALE

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TenantStatus status; // ACTIVE, SUSPENDED, TERMINATED

    private LocalDate subscriptionStartDate;
    private LocalDate subscriptionEndDate;
}
```

#### User
```java
@Entity
@Table(name = "users")
public class User extends BaseEntity {
    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false, length = 72) // BCrypt hash
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MfaMethod mfaMethod; // SMS_OTP, AUTHENTICATOR_APP

    @Column(length = 20)
    private String mfaPhoneNumber; // For SMS OTP

    @Column(length = 64)
    private String mfaSecret; // For TOTP

    private boolean mfaEnabled = false;
    private boolean emailVerified = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(length = 36)
    private String employeeId; // Link to Employee entity (optional)

    private Instant lastLoginAt;
    private int failedLoginAttempts = 0;
    private Instant lockedUntil;
}
```

#### Role
```java
@Entity
@Table(name = "roles")
public class Role extends BaseEntity {
    @Column(nullable = false, length = 50)
    private String name; // OWNER, HR_MANAGER, PAYROLL_ADMIN, ACCOUNTANT, EMPLOYEE

    @Column(length = 255)
    private String description;

    @ElementCollection
    @CollectionTable(name = "role_default_permissions")
    private Set<String> defaultPermissions; // e.g., "hr:read", "payroll:write"

    private boolean systemRole = true; // Predefined roles cannot be deleted
}
```

#### RolePermissionOverride
```java
@Entity
@Table(name = "role_permission_overrides")
public class RolePermissionOverride extends BaseEntity {
    @Column(nullable = false, length = 36)
    private String userId;

    @Column(nullable = false, length = 100)
    private String permission;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OverrideType type; // GRANT, REVOKE

    @Column(length = 255)
    private String reason;
}
```

### HR Service Entities

#### Employee
```java
@Entity
@Table(name = "employees")
public class Employee extends BaseEntity {
    // Personal Information
    @Column(nullable = false, length = 13)
    private String saIdNumber;

    @Column(nullable = false, length = 100)
    private String firstName;

    @Column(nullable = false, length = 100)
    private String lastName;

    private LocalDate dateOfBirth; // Auto-extracted from ID

    @Enumerated(EnumType.STRING)
    private Gender gender; // Auto-extracted from ID

    @Column(length = 255)
    private String email;

    @Column(length = 20)
    private String phoneNumber;

    // Employment Equity (EEA2 mandatory fields)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Race race; // AFRICAN, COLOURED, INDIAN, WHITE

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OccupationalLevel occupationalLevel; // TOP_MANAGEMENT, SENIOR, SKILLED, SEMI_SKILLED, UNSKILLED

    // Employment Details
    @Column(nullable = false)
    private LocalDate hireDate;

    private LocalDate terminationDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmploymentStatus status; // ACTIVE, TERMINATED, ON_LEAVE

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContractType contractType; // PERMANENT, FIXED_TERM, PART_TIME

    @Column(length = 100)
    private String department;

    @Column(length = 100)
    private String jobTitle;

    @Column(length = 36)
    private String managerId; // Self-referencing for org structure

    // Payroll Link
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal monthlySalary;

    @Column(length = 50)
    private String bankName;

    @Column(length = 20)
    private String bankAccountNumber;

    @Column(length = 10)
    private String bankBranchCode;

    // Tax Information
    @Column(length = 20)
    private String taxNumber;

    private boolean etiEligible = false; // Employment Tax Incentive
}
```

#### LeaveBalance
```java
@Entity
@Table(name = "leave_balances")
public class LeaveBalance extends BaseEntity {
    @Column(nullable = false, length = 36)
    private String employeeId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeaveType leaveType; // ANNUAL, SICK, FAMILY_RESPONSIBILITY, UNPAID

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal accrued = BigDecimal.ZERO;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal used = BigDecimal.ZERO;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal pending = BigDecimal.ZERO; // Approved but not yet taken

    // For sick leave 36-month cycle tracking
    private LocalDate cycleStartDate;
    private LocalDate cycleEndDate;

    // Tax year for annual leave
    private int taxYear; // e.g., 2026 for March 2026 - Feb 2027
}
```

#### LeaveRequest
```java
@Entity
@Table(name = "leave_requests")
public class LeaveRequest extends BaseEntity {
    @Column(nullable = false, length = 36)
    private String employeeId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeaveType leaveType;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal days;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeaveRequestStatus status; // PENDING, APPROVED, REJECTED, CANCELLED

    @Column(length = 36)
    private String approverId;

    private Instant approvedAt;

    @Column(length = 500)
    private String reason;

    @Column(length = 500)
    private String rejectionReason;
}
```

#### EmploymentContract
```java
@Entity
@Table(name = "employment_contracts")
public class EmploymentContract extends BaseEntity {
    @Column(nullable = false, length = 36)
    private String employeeId;

    @Column(nullable = false)
    private LocalDate startDate;

    private LocalDate endDate; // Null for permanent

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContractType type;

    @Lob
    private byte[] documentContent; // Signed PDF

    @Column(length = 100)
    private String documentHash; // SHA-256 for integrity

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SignatureStatus signatureStatus; // PENDING, SIGNED, EXPIRED

    private Instant signedAt;

    @Column(length = 50)
    private String signatureIp;
}
```

#### EmployeeAsset
```java
@Entity
@Table(name = "employee_assets")
public class EmployeeAsset extends BaseEntity {
    @Column(nullable = false, length = 36)
    private String employeeId;

    @Column(nullable = false, length = 100)
    private String assetName;

    @Column(length = 50)
    private String assetTag;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssetType type; // LAPTOP, PHONE, VEHICLE, FURNITURE, OTHER

    @Column(precision = 10, scale = 2)
    private BigDecimal value;

    private LocalDate assignedDate;
    private LocalDate returnedDate;

    @Column(length = 500)
    private String notes;
}
```

### Payroll Service Entities

#### PayrollRun
```java
@Entity
@Table(name = "payroll_runs")
public class PayrollRun extends BaseEntity {
    @Column(nullable = false)
    private LocalDate periodStart;

    @Column(nullable = false)
    private LocalDate periodEnd;

    @Column(nullable = false)
    private LocalDate payDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PayrollStatus status; // DRAFT, PROCESSING, FINALIZED, ROLLED_BACK

    @Column(nullable = false)
    private int taxYear; // SA tax year (e.g., 2026 for March 2026 - Feb 2027)

    @Column(nullable = false)
    private int taxPeriod; // 1-12 (March = 1)

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalGross = BigDecimal.ZERO;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalPaye = BigDecimal.ZERO;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalUif = BigDecimal.ZERO;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalSdl = BigDecimal.ZERO;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalEti = BigDecimal.ZERO;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalNet = BigDecimal.ZERO;

    @Column(length = 36)
    private String journalEntryId; // Link to generated journal

    private Instant finalizedAt;

    @Column(length = 36)
    private String finalizedBy;
}
```

#### PayrollLineItem
```java
@Entity
@Table(name = "payroll_line_items")
public class PayrollLineItem extends BaseEntity {
    @Column(nullable = false, length = 36)
    private String payrollRunId;

    @Column(nullable = false, length = 36)
    private String employeeId;

    // Earnings
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal grossSalary;

    @Column(precision = 12, scale = 2)
    private BigDecimal overtime = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    private BigDecimal bonus = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    private BigDecimal commission = BigDecimal.ZERO;

    // Deductions
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal paye = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal uifEmployee = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal pensionEmployee = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    private BigDecimal unpaidLeaveDays = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    private BigDecimal unpaidLeaveDeduction = BigDecimal.ZERO;

    // Employer Contributions
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal uifEmployer = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal sdl = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    private BigDecimal eti = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    private BigDecimal pensionEmployer = BigDecimal.ZERO;

    // Net
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal netPay;

    // Payslip
    @Lob
    private byte[] payslipPdf;
}
```

#### TaxTable (config schema - shared across tenants)
```java
@Entity
@Table(name = "tax_tables", schema = "config")
public class TaxTable extends BaseEntity {
    @Column(nullable = false)
    private int taxYear; // e.g., 2026

    @Column(nullable = false)
    private LocalDate effectiveFrom;

    private LocalDate effectiveTo;

    // PAYE Brackets stored as JSON
    @Column(columnDefinition = "jsonb")
    private String payeBrackets;

    // Rebates
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal primaryRebate;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal secondaryRebate; // Age 65+

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal tertiaryRebate; // Age 75+

    // Thresholds
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal taxThresholdUnder65;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal taxThreshold65To74;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal taxThreshold75Plus;

    // UIF
    @Column(nullable = false, precision = 5, scale = 4)
    private BigDecimal uifRate; // 0.01 = 1%

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal uifCeiling;

    // SDL
    @Column(nullable = false, precision = 5, scale = 4)
    private BigDecimal sdlRate; // 0.01 = 1%
}
```

#### TwoPotRecord
```java
@Entity
@Table(name = "two_pot_records")
public class TwoPotRecord extends BaseEntity {
    @Column(nullable = false, length = 36)
    private String employeeId;

    @Column(nullable = false, length = 100)
    private String fundName;

    @Column(length = 50)
    private String fundMemberNumber;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal savingsComponent = BigDecimal.ZERO;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal retirementComponent = BigDecimal.ZERO;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal vestedComponent = BigDecimal.ZERO; // Pre-Sept 2024

    private LocalDate lastUpdated;
}
```

#### TwoPotWithdrawalRequest
```java
@Entity
@Table(name = "two_pot_withdrawal_requests")
public class TwoPotWithdrawalRequest extends BaseEntity {
    @Column(nullable = false, length = 36)
    private String employeeId;

    @Column(nullable = false, length = 36)
    private String twoPotRecordId;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal requestedAmount;

    @Column(precision = 14, scale = 2)
    private BigDecimal approvedAmount;

    @Column(precision = 14, scale = 2)
    private BigDecimal taxAmount;

    @Column(precision = 14, scale = 2)
    private BigDecimal netPayout;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WithdrawalStatus status; // PENDING, TAX_DIRECTIVE_REQUESTED, APPROVED, PAID, REJECTED

    @Column(length = 50)
    private String taxDirectiveNumber;

    private LocalDate taxDirectiveDate;

    @Column(length = 500)
    private String rejectionReason;

    private LocalDate paidDate;

    @Column(length = 36)
    private String journalEntryId;
}
```

### Accounting Service Entities

#### Account
```java
@Entity
@Table(name = "accounts")
public class Account extends BaseEntity {
    @Column(nullable = false, unique = true, length = 20)
    private String accountCode; // e.g., "1000", "2100"

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountType type; // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountSubType subType; // CURRENT_ASSET, FIXED_ASSET, CURRENT_LIABILITY, etc.

    @Column(length = 36)
    private String parentAccountId;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    private boolean systemAccount = false; // Cannot be deleted
    private boolean vatApplicable = false;

    @Enumerated(EnumType.STRING)
    private VatType vatType; // STANDARD, ZERO_RATED, EXEMPT
}
```

#### JournalEntry
```java
@Entity
@Table(name = "journal_entries")
public class JournalEntry extends BaseEntity {
    @Column(nullable = false, unique = true, length = 50)
    private String entryNumber; // JE-2026-00001

    @Column(nullable = false)
    private LocalDate postingDate;

    @Column(length = 255)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JournalEntrySource source; // MANUAL, PAYROLL, INVOICE, BANK_FEED

    @Column(length = 36)
    private String sourceReferenceId; // e.g., payrollRunId

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JournalEntryStatus status; // DRAFT, POSTED, REVERSED

    private boolean immutable = false; // True for payroll-generated (No-Touch Journal Rule)

    @Column(length = 36)
    private String reversalOfId; // If this reverses another entry

    @Column(length = 36)
    private String reversedById; // If this was reversed
}
```

#### JournalLineItem
```java
@Entity
@Table(name = "journal_line_items")
public class JournalLineItem extends BaseEntity {
    @Column(nullable = false, length = 36)
    private String journalEntryId;

    @Column(nullable = false, length = 36)
    private String accountId;

    @Column(precision = 14, scale = 2)
    private BigDecimal debit;

    @Column(precision = 14, scale = 2)
    private BigDecimal credit;

    @Column(length = 255)
    private String description;

    // VAT tracking
    @Enumerated(EnumType.STRING)
    private VatType vatType;

    @Column(precision = 14, scale = 2)
    private BigDecimal vatAmount;
}
```

#### BankAccount
```java
@Entity
@Table(name = "bank_accounts")
public class BankAccount extends BaseEntity {
    @Column(nullable = false, length = 100)
    private String bankName;

    @Column(nullable = false, length = 30)
    private String accountNumber;

    @Column(length = 10)
    private String branchCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BankAccountType type; // CURRENT, SAVINGS, CREDIT

    @Column(nullable = false, length = 36)
    private String linkedAccountId; // Link to Account entity

    // Open Banking connection
    @Column(length = 100)
    private String openBankingConnectionId;

    @Enumerated(EnumType.STRING)
    private ConnectionStatus connectionStatus; // CONNECTED, DISCONNECTED, PENDING, FAILED

    private Instant lastSyncAt;
    private Instant nextSyncAt;

    @Column(length = 255)
    private String lastSyncError;
}
```

#### BankTransaction
```java
@Entity
@Table(name = "bank_transactions")
public class BankTransaction extends BaseEntity {
    @Column(nullable = false, length = 36)
    private String bankAccountId;

    @Column(nullable = false, length = 100)
    private String externalId; // From bank feed

    @Column(nullable = false)
    private LocalDate transactionDate;

    private LocalDate valueDate;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(length = 255)
    private String description;

    @Column(length = 50)
    private String reference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionDirection direction; // DEBIT, CREDIT

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReconciliationStatus reconciliationStatus; // UNMATCHED, MATCHED, MANUALLY_RECONCILED

    @Column(length = 36)
    private String matchedJournalEntryId;

    private Instant matchedAt;

    @Column(length = 36)
    private String matchedBy;

    @Column(precision = 6, scale = 2)
    private BigDecimal matchConfidence; // 0.00 - 100.00
}
```

#### Invoice
```java
@Entity
@Table(name = "invoices")
public class Invoice extends BaseEntity {
    @Column(nullable = false, unique = true, length = 50)
    private String invoiceNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvoiceType type; // SALES, PURCHASE

    @Column(nullable = false, length = 100)
    private String customerOrSupplierName;

    @Column(length = 20)
    private String vatNumber;

    @Column(nullable = false)
    private LocalDate invoiceDate;

    @Column(nullable = false)
    private LocalDate dueDate;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal subtotal;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal vatAmount;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal total;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvoiceStatus status; // DRAFT, SENT, PAID, OVERDUE, CANCELLED

    @Column(length = 36)
    private String journalEntryId;

    @Enumerated(EnumType.STRING)
    private VatType vatType; // STANDARD, ZERO_RATED
}
```

### Recruitment Service Entities

#### JobPosting
```java
@Entity
@Table(name = "job_postings")
public class JobPosting extends BaseEntity {
    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 100)
    private String department;

    @Lob
    private String description;

    @Lob
    private String requirements;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmploymentType employmentType; // PERMANENT, FIXED_TERM, PART_TIME, CONTRACT

    @Column(length = 100)
    private String location;

    @Column(precision = 12, scale = 2)
    private BigDecimal salaryMin;

    @Column(precision = 12, scale = 2)
    private BigDecimal salaryMax;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobStatus status; // DRAFT, OPEN, CLOSED, ON_HOLD

    private LocalDate openDate;
    private LocalDate closeDate;

    // External posting tracking
    @Column(columnDefinition = "jsonb")
    private String externalPostings; // [{board: "LinkedIn", postId: "xxx", status: "active"}]
}
```

#### Candidate
```java
@Entity
@Table(name = "candidates")
public class Candidate extends BaseEntity {
    @Column(length = 13)
    private String saIdNumber;

    @Column(nullable = false, length = 100)
    private String firstName;

    @Column(nullable = false, length = 100)
    private String lastName;

    private LocalDate dateOfBirth; // Auto-extracted from ID

    @Enumerated(EnumType.STRING)
    private Gender gender; // Auto-extracted from ID

    @Column(nullable = false, length = 255)
    private String email;

    @Column(length = 20)
    private String phoneNumber;

    @Column(nullable = false, length = 36)
    private String jobPostingId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CandidateStatus status; // APPLIED, SCREENING, INTERVIEW, OFFER, HIRED, REJECTED, WITHDRAWN

    @Lob
    private byte[] resumeContent;

    @Column(length = 100)
    private String resumeFileName;

    private boolean backgroundCheckConsent = false;
    private Instant backgroundCheckConsentAt;

    // POPIA consent
    private boolean dataRetentionConsent = false;
    private Instant dataRetentionConsentAt;
    private LocalDate dataRetentionExpiresAt; // 12 months from consent

    @Column(length = 500)
    private String notes;

    @Column(length = 36)
    private String convertedEmployeeId; // Set when status = HIRED
}
```

#### BackgroundCheck
```java
@Entity
@Table(name = "background_checks")
public class BackgroundCheck extends BaseEntity {
    @Column(nullable = false, length = 36)
    private String candidateId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CheckType checkType; // CRIMINAL, CREDIT, QUALIFICATION, REFERENCE

    @Column(length = 50)
    private String provider; // MIE, LEXISNEXIS

    @Column(length = 100)
    private String externalReferenceId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CheckStatus status; // PENDING, IN_PROGRESS, COMPLETED, FAILED

    private Instant initiatedAt;
    private Instant completedAt;

    @Enumerated(EnumType.STRING)
    private CheckResult result; // CLEAR, ADVERSE, INCONCLUSIVE

    @Lob
    private String resultDetails; // JSON from provider

    @Column(length = 255)
    private String failureReason;

    private int retryCount = 0;
    private Instant nextRetryAt;
}
```

#### Interview
```java
@Entity
@Table(name = "interviews")
public class Interview extends BaseEntity {
    @Column(nullable = false, length = 36)
    private String candidateId;

    @Column(nullable = false)
    private Instant scheduledAt;

    @Column(nullable = false)
    private int durationMinutes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InterviewType type; // PHONE, VIDEO, IN_PERSON, PANEL

    @Column(length = 255)
    private String location; // Physical location or video link

    @ElementCollection
    @CollectionTable(name = "interview_interviewers")
    private Set<String> interviewerIds;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InterviewStatus status; // SCHEDULED, COMPLETED, CANCELLED, NO_SHOW

    @Column(precision = 3, scale = 1)
    private BigDecimal rating; // 1.0 - 5.0

    @Lob
    private String feedback;

    @Enumerated(EnumType.STRING)
    private InterviewOutcome outcome; // PASS, FAIL, UNDECIDED
}
```

## Domain Events (Sealed Interfaces per Constitution Principle III)

```java
// HR Events
public sealed interface HrEvent permits
    EmployeeCreatedEvent,
    EmployeeTerminatedEvent,
    LeaveRequestApprovedEvent,
    LeaveRequestRejectedEvent {
    String aggregateId();
    String tenantId();
    Instant occurredAt();
}

// Payroll Events
public sealed interface PayrollEvent permits
    PayrollRunFinalizedEvent,
    PayrollRunRolledBackEvent,
    TwoPotWithdrawalApprovedEvent {
    String aggregateId();
    String tenantId();
    Instant occurredAt();
}

// Accounting Events
public sealed interface AccountingEvent permits
    JournalEntryPostedEvent,
    BankTransactionMatchedEvent,
    InvoicePaidEvent {
    String aggregateId();
    String tenantId();
    Instant occurredAt();
}

// Recruitment Events
public sealed interface RecruitmentEvent permits
    CandidateStatusChangedEvent,
    CandidateHiredEvent,
    BackgroundCheckCompletedEvent {
    String aggregateId();
    String tenantId();
    Instant occurredAt();
}
```

## Kafka Topics (per Constitution Principle XII)

| Topic | Partitions | Key | Events |
|-------|------------|-----|--------|
| `hr-events` | 10 | employeeId | EmployeeCreatedEvent, EmployeeTerminatedEvent, LeaveRequestApprovedEvent |
| `payroll-events` | 10 | payrollRunId | PayrollRunFinalizedEvent, PayrollRunRolledBackEvent |
| `accounting-events` | 10 | journalEntryId | JournalEntryPostedEvent, BankTransactionMatchedEvent |
| `recruitment-events` | 10 | candidateId | CandidateStatusChangedEvent, CandidateHiredEvent |
| `notification-commands` | 5 | userId | SendEmailCommand, SendSmsCommand |
| `retry-queue` | 3 | requestId | ExternalApiRetryCommand |

## Flyway Migration Naming

```
V{version}__{description}.sql

Examples:
V1.0.0__create_base_entity_trigger.sql
V1.0.1__create_employee_table.sql
V1.0.2__create_leave_balance_table.sql
V1.1.0__add_two_pot_tables.sql
```

## Indexes

Key indexes for performance (per service):

```sql
-- HR Service
CREATE INDEX idx_employee_tenant_status ON employees(tenant_id, status) WHERE deleted = false;
CREATE INDEX idx_employee_sa_id ON employees(sa_id_number) WHERE deleted = false;
CREATE INDEX idx_leave_balance_employee ON leave_balances(employee_id, leave_type) WHERE deleted = false;

-- Payroll Service
CREATE INDEX idx_payroll_run_period ON payroll_runs(tax_year, tax_period, status) WHERE deleted = false;
CREATE INDEX idx_payroll_line_employee ON payroll_line_items(employee_id, payroll_run_id) WHERE deleted = false;

-- Accounting Service
CREATE INDEX idx_journal_entry_date ON journal_entries(posting_date, status) WHERE deleted = false;
CREATE INDEX idx_bank_transaction_status ON bank_transactions(bank_account_id, reconciliation_status) WHERE deleted = false;

-- Recruitment Service
CREATE INDEX idx_candidate_job_status ON candidates(job_posting_id, status) WHERE deleted = false;
CREATE INDEX idx_candidate_retention ON candidates(data_retention_expires_at) WHERE deleted = false;
```
