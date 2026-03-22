package com.surework.accounting.controller;

import com.surework.accounting.domain.PayrollAccountMapping;
import com.surework.accounting.dto.PayrollAccountingDto;
import com.surework.accounting.service.PayrollAccountingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for payroll accounting integration.
 * Provides endpoints for managing payroll-to-accounting mappings,
 * viewing payroll journal entries, and configuring integration settings.
 */
@RestController
@RequestMapping("/api/v1/accounting/payroll")
@RequiredArgsConstructor
@Slf4j
@Validated
@Tag(name = "Payroll Accounting", description = "Payroll accounting integration management")
public class PayrollAccountingController {

    private final PayrollAccountingService payrollAccountingService;

    // === Dashboard ===

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'FINANCE_MANAGER', 'HR_MANAGER')")
    @Operation(summary = "Get payroll accounting dashboard")
    public ResponseEntity<PayrollAccountingDto.PayrollAccountingDashboard> getDashboard(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId) {
        return ResponseEntity.ok(payrollAccountingService.getDashboard(tenantId));
    }

    @GetMapping("/summary/{year}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'FINANCE_MANAGER')")
    @Operation(summary = "Get year summary")
    public ResponseEntity<PayrollAccountingDto.PayrollYearSummary> getYearSummary(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable int year) {
        return ResponseEntity.ok(payrollAccountingService.getYearSummary(tenantId, year));
    }

    // === Payroll Journals ===

    @GetMapping("/journals")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'FINANCE_MANAGER')")
    @Operation(summary = "Get recent payroll journal entries")
    public ResponseEntity<List<PayrollAccountingDto.PayrollJournalResponse>> getRecentJournals(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(payrollAccountingService.getRecentPayrollJournals(tenantId, limit));
    }

    @GetMapping("/journals/year/{year}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'FINANCE_MANAGER')")
    @Operation(summary = "Get payroll journal entries for a year")
    public ResponseEntity<List<PayrollAccountingDto.PayrollJournalResponse>> getJournalsForYear(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable int year) {
        return ResponseEntity.ok(payrollAccountingService.getPayrollJournalsForYear(tenantId, year));
    }

    @GetMapping("/journals/run/{payrollRunId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'FINANCE_MANAGER')")
    @Operation(summary = "Get journal entry for a payroll run")
    public ResponseEntity<PayrollAccountingDto.PayrollJournalResponse> getJournalByPayrollRun(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID payrollRunId) {
        return payrollAccountingService.getPayrollJournal(tenantId, payrollRunId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/journals/run/{payrollRunId}/exists")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'FINANCE_MANAGER', 'PAYROLL_ADMIN')")
    @Operation(summary = "Check if payroll run has been journaled")
    public ResponseEntity<Boolean> isPayrollRunJournaled(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID payrollRunId) {
        return ResponseEntity.ok(payrollAccountingService.isPayrollRunJournaled(tenantId, payrollRunId));
    }

    // === Account Mappings ===

    @GetMapping("/mappings")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'FINANCE_MANAGER')")
    @Operation(summary = "Get all account mappings")
    public ResponseEntity<List<PayrollAccountingDto.AccountMappingResponse>> getAllMappings(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId) {
        return ResponseEntity.ok(payrollAccountingService.getAllMappings(tenantId));
    }

    @GetMapping("/mappings/defaults")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'FINANCE_MANAGER')")
    @Operation(summary = "Get default account mappings")
    public ResponseEntity<List<PayrollAccountingDto.AccountMappingResponse>> getDefaultMappings(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId) {
        return ResponseEntity.ok(payrollAccountingService.getDefaultMappings(tenantId));
    }

    @GetMapping("/mappings/type/{type}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'FINANCE_MANAGER')")
    @Operation(summary = "Get mappings by type")
    public ResponseEntity<List<PayrollAccountingDto.AccountMappingResponse>> getMappingsByType(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable PayrollAccountMapping.MappingType type) {
        return ResponseEntity.ok(payrollAccountingService.getMappingsByType(tenantId, type));
    }

    @PostMapping("/mappings")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Create new account mapping")
    public ResponseEntity<PayrollAccountingDto.AccountMappingResponse> createMapping(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @Valid @RequestBody PayrollAccountingDto.CreateAccountMappingRequest request) {
        log.info("Creating account mapping: type={}, tenant={}", request.mappingType(), tenantId);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(payrollAccountingService.createMapping(tenantId, request));
    }

    @PutMapping("/mappings/{mappingId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Update account mapping")
    public ResponseEntity<PayrollAccountingDto.AccountMappingResponse> updateMapping(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID mappingId,
            @Valid @RequestBody PayrollAccountingDto.UpdateAccountMappingRequest request) {
        log.info("Updating account mapping: id={}, tenant={}", mappingId, tenantId);
        return ResponseEntity.ok(payrollAccountingService.updateMapping(tenantId, mappingId, request));
    }

    @DeleteMapping("/mappings/{mappingId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Delete account mapping")
    public ResponseEntity<Void> deleteMapping(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID mappingId) {
        log.info("Deleting account mapping: id={}, tenant={}", mappingId, tenantId);
        payrollAccountingService.deleteMapping(tenantId, mappingId);
        return ResponseEntity.noContent().build();
    }

    // === Integration Settings ===

    @GetMapping("/settings")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'FINANCE_MANAGER')")
    @Operation(summary = "Get integration settings")
    public ResponseEntity<PayrollAccountingDto.IntegrationSettingsResponse> getSettings(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId) {
        return ResponseEntity.ok(payrollAccountingService.getSettings(tenantId));
    }

    @PutMapping("/settings")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Update integration settings")
    public ResponseEntity<PayrollAccountingDto.IntegrationSettingsResponse> updateSettings(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @Valid @RequestBody PayrollAccountingDto.UpdateIntegrationSettingsRequest request) {
        log.info("Updating integration settings for tenant: {}", tenantId);
        return ResponseEntity.ok(payrollAccountingService.updateSettings(tenantId, request));
    }

    @GetMapping("/settings/auto-journal-enabled")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'FINANCE_MANAGER', 'PAYROLL_ADMIN')")
    @Operation(summary = "Check if auto-journaling is enabled")
    public ResponseEntity<Boolean> isAutoJournalEnabled(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId) {
        return ResponseEntity.ok(payrollAccountingService.isAutoJournalEnabled(tenantId));
    }

    // === Mapping Types (for UI dropdowns) ===

    @GetMapping("/mapping-types")
    @Operation(summary = "Get available mapping types")
    public ResponseEntity<List<MappingTypeInfo>> getMappingTypes() {
        List<MappingTypeInfo> types = java.util.Arrays.stream(PayrollAccountMapping.MappingType.values())
                .map(type -> new MappingTypeInfo(
                        type.name(),
                        getMappingTypeDisplay(type),
                        getMappingTypeCategory(type)
                ))
                .toList();
        return ResponseEntity.ok(types);
    }

    record MappingTypeInfo(String code, String display, String category) {}

    private String getMappingTypeDisplay(PayrollAccountMapping.MappingType type) {
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

    private String getMappingTypeCategory(PayrollAccountMapping.MappingType type) {
        return switch (type) {
            case SALARY_EXPENSE, UIF_EMPLOYER_EXPENSE, SDL_EXPENSE,
                 PENSION_EMPLOYER_EXPENSE, MEDICAL_EMPLOYER_EXPENSE -> "EXPENSE";
            case PAYE_LIABILITY, UIF_EMPLOYEE_LIABILITY, UIF_EMPLOYER_LIABILITY,
                 SDL_LIABILITY, PENSION_EMPLOYEE_LIABILITY, PENSION_EMPLOYER_LIABILITY,
                 MEDICAL_EMPLOYEE_LIABILITY, MEDICAL_EMPLOYER_LIABILITY,
                 OTHER_DEDUCTIONS_LIABILITY, NET_PAY_LIABILITY -> "LIABILITY";
            case BANK_ACCOUNT -> "ASSET";
        };
    }
}
