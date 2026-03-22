package com.surework.accounting.dto;

import com.surework.accounting.domain.PayrollAccountMapping;
import com.surework.accounting.domain.PayrollIntegrationSettings;
import com.surework.accounting.domain.PayrollJournalEntry;
import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;
import jakarta.validation.constraints.NotNull;

import java.lang.annotation.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTOs for Payroll Accounting Integration.
 */
public sealed interface PayrollAccountingDto {

    // === Account Mapping DTOs ===

    record AccountMappingResponse(
            UUID id,
            PayrollAccountMapping.MappingType mappingType,
            String mappingTypeDisplay,
            UUID accountId,
            String accountCode,
            String accountName,
            UUID departmentId,
            String departmentName,
            boolean isDefault,
            boolean active,
            Instant createdAt
    ) implements PayrollAccountingDto {

        public static AccountMappingResponse fromEntity(PayrollAccountMapping mapping) {
            return fromEntity(mapping, null);
        }

        public static AccountMappingResponse fromEntity(PayrollAccountMapping mapping, String departmentName) {
            return new AccountMappingResponse(
                    mapping.getId(),
                    mapping.getMappingType(),
                    getMappingTypeDisplay(mapping.getMappingType()),
                    mapping.getAccount().getId(),
                    mapping.getAccount().getAccountCode(),
                    mapping.getAccount().getAccountName(),
                    mapping.getDepartmentId(),
                    departmentName,
                    mapping.isDefault(),
                    mapping.isActive(),
                    mapping.getCreatedAt()
            );
        }

        private static String getMappingTypeDisplay(PayrollAccountMapping.MappingType type) {
            return switch (type) {
                case SALARY_EXPENSE -> "Salary Expense";
                case UIF_EMPLOYER_EXPENSE -> "UIF Employer Expense";
                case SDL_EXPENSE -> "SDL Expense";
                case PENSION_EMPLOYER_EXPENSE -> "Pension Employer Expense";
                case MEDICAL_EMPLOYER_EXPENSE -> "Medical Aid Employer Expense";
                case PAYE_LIABILITY -> "PAYE Liability";
                case UIF_EMPLOYEE_LIABILITY -> "UIF Employee Liability";
                case UIF_EMPLOYER_LIABILITY -> "UIF Employer Liability";
                case SDL_LIABILITY -> "SDL Liability";
                case PENSION_EMPLOYEE_LIABILITY -> "Pension Employee Liability";
                case PENSION_EMPLOYER_LIABILITY -> "Pension Employer Liability";
                case MEDICAL_EMPLOYEE_LIABILITY -> "Medical Aid Employee Liability";
                case MEDICAL_EMPLOYER_LIABILITY -> "Medical Aid Employer Liability";
                case OTHER_DEDUCTIONS_LIABILITY -> "Other Deductions Liability";
                case NET_PAY_LIABILITY -> "Net Pay Liability";
                case BANK_ACCOUNT -> "Bank Account";
            };
        }
    }

    record CreateAccountMappingRequest(
            @NotNull(message = "Mapping type is required")
            PayrollAccountMapping.MappingType mappingType,

            @NotNull(message = "Account ID is required")
            UUID accountId,

            UUID departmentId,
            boolean isDefault
    ) implements PayrollAccountingDto {}

    @AtLeastOneFieldNotNull(message = "At least one field must be provided for update")
    record UpdateAccountMappingRequest(
            UUID accountId,
            UUID departmentId,
            Boolean isDefault,
            Boolean active
    ) implements PayrollAccountingDto {
        /**
         * Check if any field is set for update.
         */
        public boolean hasUpdates() {
            return accountId != null || departmentId != null || isDefault != null || active != null;
        }
    }

    // === Custom Validation Annotation ===

    @Target({ElementType.TYPE})
    @Retention(RetentionPolicy.RUNTIME)
    @Constraint(validatedBy = AtLeastOneFieldNotNullValidator.class)
    @Documented
    @interface AtLeastOneFieldNotNull {
        String message() default "At least one field must be provided";
        Class<?>[] groups() default {};
        Class<? extends Payload>[] payload() default {};
    }

    class AtLeastOneFieldNotNullValidator implements ConstraintValidator<AtLeastOneFieldNotNull, UpdateAccountMappingRequest> {
        @Override
        public boolean isValid(UpdateAccountMappingRequest request, ConstraintValidatorContext context) {
            if (request == null) {
                return true; // Let @NotNull handle null checks
            }
            return request.hasUpdates();
        }
    }

    // === Integration Settings DTOs ===

    record IntegrationSettingsResponse(
            UUID id,
            UUID tenantId,
            boolean autoJournalEnabled,
            boolean journalOnApproval,
            boolean createPaymentEntry,
            UUID defaultExpenseAccountId,
            String defaultExpenseAccountCode,
            String defaultExpenseAccountName,
            UUID defaultLiabilityAccountId,
            String defaultLiabilityAccountCode,
            String defaultLiabilityAccountName,
            UUID defaultBankAccountId,
            String defaultBankAccountCode,
            String defaultBankAccountName,
            String journalDescriptionTemplate,
            Instant updatedAt
    ) implements PayrollAccountingDto {

        public static IntegrationSettingsResponse fromEntity(PayrollIntegrationSettings settings) {
            return new IntegrationSettingsResponse(
                    settings.getId(),
                    settings.getTenantId(),
                    settings.isAutoJournalEnabled(),
                    settings.isJournalOnApproval(),
                    settings.isCreatePaymentEntry(),
                    settings.getDefaultExpenseAccount() != null ? settings.getDefaultExpenseAccount().getId() : null,
                    settings.getDefaultExpenseAccount() != null ? settings.getDefaultExpenseAccount().getAccountCode() : null,
                    settings.getDefaultExpenseAccount() != null ? settings.getDefaultExpenseAccount().getAccountName() : null,
                    settings.getDefaultLiabilityAccount() != null ? settings.getDefaultLiabilityAccount().getId() : null,
                    settings.getDefaultLiabilityAccount() != null ? settings.getDefaultLiabilityAccount().getAccountCode() : null,
                    settings.getDefaultLiabilityAccount() != null ? settings.getDefaultLiabilityAccount().getAccountName() : null,
                    settings.getDefaultBankAccount() != null ? settings.getDefaultBankAccount().getId() : null,
                    settings.getDefaultBankAccount() != null ? settings.getDefaultBankAccount().getAccountCode() : null,
                    settings.getDefaultBankAccount() != null ? settings.getDefaultBankAccount().getAccountName() : null,
                    settings.getJournalDescriptionTemplate(),
                    settings.getUpdatedAt()
            );
        }
    }

    record UpdateIntegrationSettingsRequest(
            Boolean autoJournalEnabled,
            Boolean journalOnApproval,
            Boolean createPaymentEntry,
            UUID defaultExpenseAccountId,
            UUID defaultLiabilityAccountId,
            UUID defaultBankAccountId,
            String journalDescriptionTemplate
    ) implements PayrollAccountingDto {}

    // === Payroll Journal Entry DTOs ===

    record PayrollJournalResponse(
            UUID id,
            UUID payrollRunId,
            String payrollRunNumber,
            UUID journalEntryId,
            String journalEntryNumber,
            int periodYear,
            int periodMonth,
            String periodDisplay,
            BigDecimal totalGross,
            BigDecimal totalPaye,
            BigDecimal totalUif,
            BigDecimal totalSdl,
            BigDecimal totalPension,
            BigDecimal totalMedical,
            BigDecimal totalNet,
            BigDecimal totalEmployerCost,
            int employeeCount,
            PayrollJournalEntry.Status status,
            String statusDisplay,
            Instant createdAt
    ) implements PayrollAccountingDto {

        public static PayrollJournalResponse fromEntity(PayrollJournalEntry entry) {
            return new PayrollJournalResponse(
                    entry.getId(),
                    entry.getPayrollRunId(),
                    entry.getPayrollRunNumber(),
                    entry.getJournalEntry().getId(),
                    entry.getJournalEntry().getEntryNumber(),
                    entry.getPeriodYear(),
                    entry.getPeriodMonth(),
                    entry.getPeriodDisplay(),
                    entry.getTotalGross(),
                    entry.getTotalPaye(),
                    entry.getTotalUif(),
                    entry.getTotalSdl(),
                    entry.getTotalPension(),
                    entry.getTotalMedical(),
                    entry.getTotalNet(),
                    entry.getTotalEmployerCost(),
                    entry.getEmployeeCount(),
                    entry.getStatus(),
                    getStatusDisplay(entry.getStatus()),
                    entry.getCreatedAt()
            );
        }

        private static String getStatusDisplay(PayrollJournalEntry.Status status) {
            return switch (status) {
                case CREATED -> "Created";
                case POSTED -> "Posted";
                case REVERSED -> "Reversed";
                case FAILED -> "Failed";
            };
        }
    }

    // === Dashboard DTOs ===

    record PayrollAccountingDashboard(
            boolean integrationEnabled,
            int currentYear,
            BigDecimal ytdGross,
            BigDecimal ytdPaye,
            BigDecimal ytdEmployerCost,
            int journaledRunsCount,
            List<PayrollJournalResponse> recentJournals,
            List<AccountMappingResponse> accountMappings
    ) implements PayrollAccountingDto {}

    record PayrollYearSummary(
            int year,
            BigDecimal totalGross,
            BigDecimal totalPaye,
            BigDecimal totalUif,
            BigDecimal totalSdl,
            BigDecimal totalNet,
            BigDecimal totalEmployerCost,
            int employeeCount,
            int runCount
    ) implements PayrollAccountingDto {}
}
