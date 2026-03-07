package com.surework.accounting.controller;

import com.surework.accounting.domain.Account;
import com.surework.accounting.domain.JournalEntry;
import com.surework.accounting.dto.AccountingDto;
import com.surework.accounting.service.AccountingService;
import com.surework.common.web.PageResponse;
import com.surework.common.web.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for Accounting operations.
 * Implements User Story 4: Accounting Module.
 *
 * <p>All endpoints require authentication and appropriate role-based authorization.
 * Tenant isolation is enforced via the X-Tenant-Id header.
 */
@RestController
@RequestMapping("/api/v1/accounting")
@RequiredArgsConstructor
@Validated
@PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'FINANCE_MANAGER')")
public class AccountingController {

    private final AccountingService accountingService;

    // === Account Endpoints ===

    @PostMapping("/accounts")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<AccountingDto.AccountResponse> createAccount(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @Valid @RequestBody AccountingDto.CreateAccountRequest request) {
        AccountingDto.AccountResponse response = accountingService.createAccount(tenantId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/accounts/{accountId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<AccountingDto.AccountResponse> updateAccount(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID accountId,
            @Valid @RequestBody AccountingDto.UpdateAccountRequest request) {
        AccountingDto.AccountResponse response = accountingService.updateAccount(tenantId, accountId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/accounts/{accountId}")
    public ResponseEntity<AccountingDto.AccountResponse> getAccount(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID accountId) {
        return accountingService.getAccount(tenantId, accountId)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Account", accountId));
    }

    @GetMapping("/accounts/code/{accountCode}")
    public ResponseEntity<AccountingDto.AccountResponse> getAccountByCode(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable String accountCode) {
        return accountingService.getAccountByCode(tenantId, accountCode)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Account", accountCode));
    }

    @GetMapping("/accounts")
    public ResponseEntity<PageResponse<AccountingDto.AccountResponse>> searchAccounts(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) Account.AccountType type,
            @RequestParam(required = false, defaultValue = "true") boolean activeOnly,
            @PageableDefault(size = 50) Pageable pageable) {
        Page<AccountingDto.AccountResponse> page = accountingService.searchAccounts(
                tenantId, searchTerm, type, activeOnly, pageable);
        return ResponseEntity.ok(PageResponse.from(page));
    }

    @GetMapping("/accounts/type/{type}")
    public ResponseEntity<List<AccountingDto.AccountResponse>> getAccountsByType(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable Account.AccountType type) {
        List<AccountingDto.AccountResponse> accounts = accountingService.getAccountsByType(tenantId, type);
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/accounts/postable")
    public ResponseEntity<List<AccountingDto.AccountResponse>> getPostableAccounts(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId) {
        List<AccountingDto.AccountResponse> accounts = accountingService.getPostableAccounts(tenantId);
        return ResponseEntity.ok(accounts);
    }

    @PostMapping("/accounts/{accountId}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<Void> deactivateAccount(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID accountId) {
        accountingService.deactivateAccount(tenantId, accountId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/accounts/{accountId}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<Void> activateAccount(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID accountId) {
        accountingService.activateAccount(tenantId, accountId);
        return ResponseEntity.noContent().build();
    }

    // === Journal Entry Endpoints ===

    @PostMapping("/journal-entries")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<AccountingDto.JournalEntryResponse> createJournalEntry(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @Valid @RequestBody AccountingDto.CreateJournalEntryRequest request) {
        AccountingDto.JournalEntryResponse response = accountingService.createJournalEntry(tenantId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/journal-entries/{entryId}")
    public ResponseEntity<AccountingDto.JournalEntryResponse> getJournalEntry(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID entryId) {
        return accountingService.getJournalEntry(tenantId, entryId)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("JournalEntry", entryId));
    }

    @GetMapping("/journal-entries/number/{entryNumber}")
    public ResponseEntity<AccountingDto.JournalEntryResponse> getJournalEntryByNumber(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable String entryNumber) {
        return accountingService.getJournalEntryByNumber(tenantId, entryNumber)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("JournalEntry", entryNumber));
    }

    @GetMapping("/journal-entries")
    public ResponseEntity<PageResponse<AccountingDto.JournalEntryResponse>> searchJournalEntries(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) JournalEntry.EntryStatus status,
            @RequestParam(required = false) JournalEntry.EntryType type,
            @RequestParam(required = false) String searchTerm,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<AccountingDto.JournalEntryResponse> page = accountingService.searchJournalEntries(
                tenantId, startDate, endDate, status, type, searchTerm, pageable);
        return ResponseEntity.ok(PageResponse.from(page));
    }

    @GetMapping("/journal-entries/drafts")
    public ResponseEntity<List<AccountingDto.JournalEntryResponse>> getDraftEntries(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId) {
        List<AccountingDto.JournalEntryResponse> entries = accountingService.getDraftEntries(tenantId);
        return ResponseEntity.ok(entries);
    }

    @PostMapping("/journal-entries/{entryId}/post")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<AccountingDto.JournalEntryResponse> postJournalEntry(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID entryId,
            @RequestHeader("X-User-Id") @NotNull UUID postedBy) {
        AccountingDto.JournalEntryResponse response = accountingService.postJournalEntry(tenantId, entryId, postedBy);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/journal-entries/{entryId}/reverse")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<AccountingDto.JournalEntryResponse> reverseJournalEntry(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID entryId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate reversalDate,
            @RequestParam String reason,
            @RequestHeader("X-User-Id") @NotNull UUID reversedBy) {
        AccountingDto.JournalEntryResponse response = accountingService.reverseJournalEntry(
                tenantId, entryId, reversalDate, reason, reversedBy);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/journal-entries/{entryId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<Void> deleteJournalEntry(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID entryId) {
        accountingService.deleteJournalEntry(tenantId, entryId);
        return ResponseEntity.noContent().build();
    }

    // === Fiscal Period Endpoints ===

    @PostMapping("/fiscal-periods/generate/{fiscalYear}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AccountingDto.FiscalPeriodResponse>> generateFiscalYear(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable int fiscalYear) {
        List<AccountingDto.FiscalPeriodResponse> periods = accountingService.generateFiscalYear(tenantId, fiscalYear);
        return ResponseEntity.status(HttpStatus.CREATED).body(periods);
    }

    @GetMapping("/fiscal-periods/year/{fiscalYear}")
    public ResponseEntity<List<AccountingDto.FiscalPeriodResponse>> getFiscalPeriodsForYear(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable int fiscalYear) {
        List<AccountingDto.FiscalPeriodResponse> periods = accountingService.getFiscalPeriodsForYear(tenantId, fiscalYear);
        return ResponseEntity.ok(periods);
    }

    @GetMapping("/fiscal-periods/current")
    public ResponseEntity<AccountingDto.FiscalPeriodResponse> getCurrentPeriod(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId) {
        return accountingService.getCurrentPeriod(tenantId)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("FiscalPeriod", "current"));
    }

    @PostMapping("/fiscal-periods/{periodId}/open")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<AccountingDto.FiscalPeriodResponse> openPeriod(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID periodId) {
        AccountingDto.FiscalPeriodResponse response = accountingService.openPeriod(tenantId, periodId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/fiscal-periods/{periodId}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<AccountingDto.FiscalPeriodResponse> closePeriod(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID periodId,
            @RequestHeader("X-User-Id") @NotNull UUID closedBy) {
        AccountingDto.FiscalPeriodResponse response = accountingService.closePeriod(tenantId, periodId, closedBy);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/fiscal-periods/{periodId}/reopen")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AccountingDto.FiscalPeriodResponse> reopenPeriod(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID periodId,
            @RequestHeader("X-User-Id") @NotNull UUID reopenedBy) {
        AccountingDto.FiscalPeriodResponse response = accountingService.reopenPeriod(tenantId, periodId, reopenedBy);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/fiscal-periods/{periodId}/lock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AccountingDto.FiscalPeriodResponse> lockPeriod(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID periodId) {
        AccountingDto.FiscalPeriodResponse response = accountingService.lockPeriod(tenantId, periodId);
        return ResponseEntity.ok(response);
    }

    // === Reports Endpoints ===

    @GetMapping("/reports/trial-balance")
    public ResponseEntity<AccountingDto.TrialBalanceReport> getTrialBalance(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate) {
        LocalDate date = asOfDate != null ? asOfDate : LocalDate.now();
        AccountingDto.TrialBalanceReport report = accountingService.generateTrialBalance(tenantId, date);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/reports/balance-sheet")
    public ResponseEntity<AccountingDto.BalanceSheetReport> getBalanceSheet(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate) {
        LocalDate date = asOfDate != null ? asOfDate : LocalDate.now();
        AccountingDto.BalanceSheetReport report = accountingService.generateBalanceSheet(tenantId, date);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/reports/income-statement")
    public ResponseEntity<AccountingDto.IncomeStatementReport> getIncomeStatement(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        AccountingDto.IncomeStatementReport report = accountingService.generateIncomeStatement(tenantId, startDate, endDate);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/reports/general-ledger/{accountId}")
    public ResponseEntity<AccountingDto.GeneralLedgerReport> getGeneralLedger(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID accountId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        AccountingDto.GeneralLedgerReport report = accountingService.generateGeneralLedger(
                tenantId, accountId, startDate, endDate);
        return ResponseEntity.ok(report);
    }

    // === Year-End Processing ===

    @PostMapping("/year-end-close/{fiscalYear}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> performYearEndClose(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable int fiscalYear,
            @RequestHeader("X-User-Id") @NotNull UUID performedBy) {
        accountingService.performYearEndClose(tenantId, fiscalYear, performedBy);
        return ResponseEntity.noContent().build();
    }
}
