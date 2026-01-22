package com.surework.accounting.controller;

import com.surework.accounting.domain.Account;
import com.surework.accounting.domain.JournalEntry;
import com.surework.accounting.dto.AccountingDto;
import com.surework.accounting.service.AccountingService;
import com.surework.common.web.PageResponse;
import com.surework.common.web.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for Accounting operations.
 * Implements User Story 4: Accounting Module.
 */
@RestController
@RequestMapping("/api/v1/accounting")
@RequiredArgsConstructor
public class AccountingController {

    private final AccountingService accountingService;

    // === Account Endpoints ===

    @PostMapping("/accounts")
    public ResponseEntity<AccountingDto.AccountResponse> createAccount(
            @Valid @RequestBody AccountingDto.CreateAccountRequest request) {
        AccountingDto.AccountResponse response = accountingService.createAccount(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/accounts/{accountId}")
    public ResponseEntity<AccountingDto.AccountResponse> updateAccount(
            @PathVariable UUID accountId,
            @Valid @RequestBody AccountingDto.UpdateAccountRequest request) {
        AccountingDto.AccountResponse response = accountingService.updateAccount(accountId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/accounts/{accountId}")
    public ResponseEntity<AccountingDto.AccountResponse> getAccount(@PathVariable UUID accountId) {
        return accountingService.getAccount(accountId)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Account", accountId));
    }

    @GetMapping("/accounts/code/{accountCode}")
    public ResponseEntity<AccountingDto.AccountResponse> getAccountByCode(@PathVariable String accountCode) {
        return accountingService.getAccountByCode(accountCode)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Account", accountCode));
    }

    @GetMapping("/accounts")
    public ResponseEntity<PageResponse<AccountingDto.AccountResponse>> searchAccounts(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) Account.AccountType type,
            @RequestParam(required = false, defaultValue = "true") boolean activeOnly,
            @PageableDefault(size = 50) Pageable pageable) {
        Page<AccountingDto.AccountResponse> page = accountingService.searchAccounts(
                searchTerm, type, activeOnly, pageable);
        return ResponseEntity.ok(PageResponse.of(page));
    }

    @GetMapping("/accounts/type/{type}")
    public ResponseEntity<List<AccountingDto.AccountResponse>> getAccountsByType(
            @PathVariable Account.AccountType type) {
        List<AccountingDto.AccountResponse> accounts = accountingService.getAccountsByType(type);
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/accounts/postable")
    public ResponseEntity<List<AccountingDto.AccountResponse>> getPostableAccounts() {
        List<AccountingDto.AccountResponse> accounts = accountingService.getPostableAccounts();
        return ResponseEntity.ok(accounts);
    }

    @PostMapping("/accounts/{accountId}/deactivate")
    public ResponseEntity<Void> deactivateAccount(@PathVariable UUID accountId) {
        accountingService.deactivateAccount(accountId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/accounts/{accountId}/activate")
    public ResponseEntity<Void> activateAccount(@PathVariable UUID accountId) {
        accountingService.activateAccount(accountId);
        return ResponseEntity.noContent().build();
    }

    // === Journal Entry Endpoints ===

    @PostMapping("/journal-entries")
    public ResponseEntity<AccountingDto.JournalEntryResponse> createJournalEntry(
            @Valid @RequestBody AccountingDto.CreateJournalEntryRequest request) {
        AccountingDto.JournalEntryResponse response = accountingService.createJournalEntry(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/journal-entries/{entryId}")
    public ResponseEntity<AccountingDto.JournalEntryResponse> getJournalEntry(@PathVariable UUID entryId) {
        return accountingService.getJournalEntry(entryId)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("JournalEntry", entryId));
    }

    @GetMapping("/journal-entries/number/{entryNumber}")
    public ResponseEntity<AccountingDto.JournalEntryResponse> getJournalEntryByNumber(
            @PathVariable String entryNumber) {
        return accountingService.getJournalEntryByNumber(entryNumber)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("JournalEntry", entryNumber));
    }

    @GetMapping("/journal-entries")
    public ResponseEntity<PageResponse<AccountingDto.JournalEntryResponse>> searchJournalEntries(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) JournalEntry.EntryStatus status,
            @RequestParam(required = false) JournalEntry.EntryType type,
            @RequestParam(required = false) String searchTerm,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<AccountingDto.JournalEntryResponse> page = accountingService.searchJournalEntries(
                startDate, endDate, status, type, searchTerm, pageable);
        return ResponseEntity.ok(PageResponse.of(page));
    }

    @GetMapping("/journal-entries/drafts")
    public ResponseEntity<List<AccountingDto.JournalEntryResponse>> getDraftEntries() {
        List<AccountingDto.JournalEntryResponse> entries = accountingService.getDraftEntries();
        return ResponseEntity.ok(entries);
    }

    @PostMapping("/journal-entries/{entryId}/post")
    public ResponseEntity<AccountingDto.JournalEntryResponse> postJournalEntry(
            @PathVariable UUID entryId,
            @RequestHeader("X-User-Id") UUID postedBy) {
        AccountingDto.JournalEntryResponse response = accountingService.postJournalEntry(entryId, postedBy);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/journal-entries/{entryId}/reverse")
    public ResponseEntity<AccountingDto.JournalEntryResponse> reverseJournalEntry(
            @PathVariable UUID entryId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate reversalDate,
            @RequestParam String reason,
            @RequestHeader("X-User-Id") UUID reversedBy) {
        AccountingDto.JournalEntryResponse response = accountingService.reverseJournalEntry(
                entryId, reversalDate, reason, reversedBy);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/journal-entries/{entryId}")
    public ResponseEntity<Void> deleteJournalEntry(@PathVariable UUID entryId) {
        accountingService.deleteJournalEntry(entryId);
        return ResponseEntity.noContent().build();
    }

    // === Fiscal Period Endpoints ===

    @PostMapping("/fiscal-periods/generate/{fiscalYear}")
    public ResponseEntity<List<AccountingDto.FiscalPeriodResponse>> generateFiscalYear(
            @PathVariable int fiscalYear) {
        List<AccountingDto.FiscalPeriodResponse> periods = accountingService.generateFiscalYear(fiscalYear);
        return ResponseEntity.status(HttpStatus.CREATED).body(periods);
    }

    @GetMapping("/fiscal-periods/year/{fiscalYear}")
    public ResponseEntity<List<AccountingDto.FiscalPeriodResponse>> getFiscalPeriodsForYear(
            @PathVariable int fiscalYear) {
        List<AccountingDto.FiscalPeriodResponse> periods = accountingService.getFiscalPeriodsForYear(fiscalYear);
        return ResponseEntity.ok(periods);
    }

    @GetMapping("/fiscal-periods/current")
    public ResponseEntity<AccountingDto.FiscalPeriodResponse> getCurrentPeriod() {
        return accountingService.getCurrentPeriod()
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("FiscalPeriod", "current"));
    }

    @PostMapping("/fiscal-periods/{periodId}/open")
    public ResponseEntity<AccountingDto.FiscalPeriodResponse> openPeriod(@PathVariable UUID periodId) {
        AccountingDto.FiscalPeriodResponse response = accountingService.openPeriod(periodId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/fiscal-periods/{periodId}/close")
    public ResponseEntity<AccountingDto.FiscalPeriodResponse> closePeriod(
            @PathVariable UUID periodId,
            @RequestHeader("X-User-Id") UUID closedBy) {
        AccountingDto.FiscalPeriodResponse response = accountingService.closePeriod(periodId, closedBy);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/fiscal-periods/{periodId}/reopen")
    public ResponseEntity<AccountingDto.FiscalPeriodResponse> reopenPeriod(
            @PathVariable UUID periodId,
            @RequestHeader("X-User-Id") UUID reopenedBy) {
        AccountingDto.FiscalPeriodResponse response = accountingService.reopenPeriod(periodId, reopenedBy);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/fiscal-periods/{periodId}/lock")
    public ResponseEntity<AccountingDto.FiscalPeriodResponse> lockPeriod(@PathVariable UUID periodId) {
        AccountingDto.FiscalPeriodResponse response = accountingService.lockPeriod(periodId);
        return ResponseEntity.ok(response);
    }

    // === Reports Endpoints ===

    @GetMapping("/reports/trial-balance")
    public ResponseEntity<AccountingDto.TrialBalanceReport> getTrialBalance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate) {
        LocalDate date = asOfDate != null ? asOfDate : LocalDate.now();
        AccountingDto.TrialBalanceReport report = accountingService.generateTrialBalance(date);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/reports/balance-sheet")
    public ResponseEntity<AccountingDto.BalanceSheetReport> getBalanceSheet(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate) {
        LocalDate date = asOfDate != null ? asOfDate : LocalDate.now();
        AccountingDto.BalanceSheetReport report = accountingService.generateBalanceSheet(date);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/reports/income-statement")
    public ResponseEntity<AccountingDto.IncomeStatementReport> getIncomeStatement(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        AccountingDto.IncomeStatementReport report = accountingService.generateIncomeStatement(startDate, endDate);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/reports/general-ledger/{accountId}")
    public ResponseEntity<AccountingDto.GeneralLedgerReport> getGeneralLedger(
            @PathVariable UUID accountId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        AccountingDto.GeneralLedgerReport report = accountingService.generateGeneralLedger(
                accountId, startDate, endDate);
        return ResponseEntity.ok(report);
    }

    // === Year-End Processing ===

    @PostMapping("/year-end-close/{fiscalYear}")
    public ResponseEntity<Void> performYearEndClose(
            @PathVariable int fiscalYear,
            @RequestHeader("X-User-Id") UUID performedBy) {
        accountingService.performYearEndClose(fiscalYear, performedBy);
        return ResponseEntity.noContent().build();
    }
}
