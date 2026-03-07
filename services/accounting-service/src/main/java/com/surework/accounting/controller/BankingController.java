package com.surework.accounting.controller;

import com.surework.accounting.dto.BankingDto;
import com.surework.accounting.service.BankingIntegrationService;
import com.surework.accounting.service.BankReconciliationService;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for Bank Integration operations.
 * Handles Open Banking connectivity, transaction management, and reconciliation.
 *
 * <p>All endpoints require authentication and appropriate role-based authorization.
 * Tenant isolation is enforced via the X-Tenant-Id header.
 */
@RestController
@RequestMapping("/api/v1/accounting/banking")
@RequiredArgsConstructor
@Validated
@PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'FINANCE_MANAGER')")
public class BankingController {

    private final BankingIntegrationService bankingService;
    private final BankReconciliationService reconciliationService;

    // === Bank Account Endpoints ===

    @GetMapping("/accounts")
    public ResponseEntity<List<BankingDto.BankAccountResponse>> getBankAccounts(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId) {
        List<BankingDto.BankAccountResponse> accounts = bankingService.getBankAccounts(tenantId);
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/accounts/{bankAccountId}")
    public ResponseEntity<BankingDto.BankAccountResponse> getBankAccount(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID bankAccountId) {
        return bankingService.getBankAccount(tenantId, bankAccountId)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("BankAccount", bankAccountId));
    }

    @PostMapping("/accounts")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<BankingDto.BankAccountResponse> connectBankAccount(
            @Valid @RequestBody BankingDto.ConnectBankRequest request,
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @RequestHeader("X-User-Id") @NotNull UUID userId) {
        BankingDto.BankAccountResponse response = bankingService.connectBankAccount(tenantId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/accounts/{bankAccountId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<BankingDto.BankAccountResponse> updateBankAccount(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID bankAccountId,
            @Valid @RequestBody BankingDto.UpdateBankAccountRequest request) {
        BankingDto.BankAccountResponse response = bankingService.updateBankAccount(tenantId, bankAccountId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/accounts/{bankAccountId}/disconnect")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<Void> disconnectBankAccount(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID bankAccountId) {
        bankingService.disconnectBankAccount(tenantId, bankAccountId);
        return ResponseEntity.noContent().build();
    }

    // === OAuth Endpoints ===

    @PostMapping("/oauth/initiate")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<BankingDto.StitchOAuthResponse> initiateOAuth(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @RequestParam String redirectUri) {
        BankingDto.StitchOAuthResponse response = bankingService.initiateStitchOAuth(tenantId, redirectUri);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/oauth/callback")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<List<BankingDto.BankAccountResponse>> completeOAuth(
            @Valid @RequestBody BankingDto.StitchCallbackRequest callback,
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @RequestHeader("X-User-Id") @NotNull UUID userId) {
        List<BankingDto.BankAccountResponse> accounts = bankingService.completeStitchOAuth(tenantId, callback, userId);
        return ResponseEntity.ok(accounts);
    }

    // === Transaction Sync Endpoints ===

    @PostMapping("/accounts/{bankAccountId}/sync")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<BankingDto.SyncResult> syncTransactions(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID bankAccountId) {
        BankingDto.SyncResult result = bankingService.syncTransactions(tenantId, bankAccountId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/sync-all")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<List<BankingDto.SyncResult>> syncAllAccounts(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId) {
        List<BankingDto.SyncResult> results = bankingService.syncAllAccounts(tenantId);
        return ResponseEntity.ok(results);
    }

    @PostMapping("/accounts/{bankAccountId}/import")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<List<BankingDto.BankTransactionResponse>> importTransactions(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID bankAccountId,
            @Valid @RequestBody List<BankingDto.ImportTransactionRequest> transactions) {
        List<BankingDto.BankTransactionResponse> imported = bankingService.importTransactions(tenantId, bankAccountId, transactions);
        return ResponseEntity.status(HttpStatus.CREATED).body(imported);
    }

    // === Transaction Endpoints ===

    @GetMapping("/accounts/{bankAccountId}/transactions")
    public ResponseEntity<PageResponse<BankingDto.BankTransactionResponse>> getTransactions(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID bankAccountId,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false, defaultValue = "ALL") BankingDto.ReconciliationStatusFilter status,
            @RequestParam(required = false, defaultValue = "ALL") BankingDto.TransactionTypeFilter type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 50) Pageable pageable) {
        Page<BankingDto.BankTransactionResponse> page = bankingService.searchTransactions(
                tenantId, bankAccountId, searchTerm, status, type, startDate, endDate, pageable);
        return ResponseEntity.ok(PageResponse.from(page));
    }

    @GetMapping("/accounts/{bankAccountId}/transactions/unreconciled")
    public ResponseEntity<List<BankingDto.BankTransactionResponse>> getUnreconciledTransactions(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID bankAccountId) {
        List<BankingDto.BankTransactionResponse> transactions = bankingService.getUnreconciledTransactions(tenantId, bankAccountId);
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/transactions/{transactionId}")
    public ResponseEntity<BankingDto.BankTransactionResponse> getTransaction(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID transactionId) {
        return bankingService.getTransaction(tenantId, transactionId)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("BankTransaction", transactionId));
    }

    // === Bank Rule Endpoints ===

    @GetMapping("/rules")
    public ResponseEntity<List<BankingDto.BankRuleResponse>> getBankRules(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId) {
        List<BankingDto.BankRuleResponse> rules = bankingService.getBankRules(tenantId);
        return ResponseEntity.ok(rules);
    }

    @GetMapping("/rules/{ruleId}")
    public ResponseEntity<BankingDto.BankRuleResponse> getBankRule(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID ruleId) {
        return bankingService.getBankRule(tenantId, ruleId)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("BankRule", ruleId));
    }

    @PostMapping("/rules")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<BankingDto.BankRuleResponse> createBankRule(
            @Valid @RequestBody BankingDto.CreateBankRuleRequest request,
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @RequestHeader("X-User-Id") @NotNull UUID userId) {
        BankingDto.BankRuleResponse response = bankingService.createBankRule(tenantId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/rules/{ruleId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<BankingDto.BankRuleResponse> updateBankRule(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID ruleId,
            @Valid @RequestBody BankingDto.UpdateBankRuleRequest request) {
        BankingDto.BankRuleResponse response = bankingService.updateBankRule(tenantId, ruleId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/rules/{ruleId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<Void> deleteBankRule(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID ruleId) {
        bankingService.deleteBankRule(tenantId, ruleId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/rules/{ruleId}/test/{transactionId}")
    public ResponseEntity<Boolean> testRule(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID ruleId,
            @PathVariable UUID transactionId) {
        boolean matches = bankingService.testRule(tenantId, ruleId, transactionId);
        return ResponseEntity.ok(matches);
    }

    @PostMapping("/accounts/{bankAccountId}/apply-rules")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<Integer> applyRulesToTransactions(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID bankAccountId) {
        int applied = bankingService.applyRulesToTransactions(tenantId, bankAccountId);
        return ResponseEntity.ok(applied);
    }

    // === Reconciliation Endpoints ===

    @PostMapping("/transactions/{transactionId}/reconcile")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<BankingDto.BankTransactionResponse> reconcileTransaction(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID transactionId,
            @Valid @RequestBody BankingDto.ReconcileTransactionRequest request,
            @RequestHeader("X-User-Id") @NotNull UUID userId) {
        BankingDto.BankTransactionResponse response = reconciliationService.reconcileTransaction(
                tenantId, transactionId, request, userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reconcile/bulk")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<List<BankingDto.BankTransactionResponse>> bulkReconcile(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @Valid @RequestBody BankingDto.BulkReconcileRequest request,
            @RequestHeader("X-User-Id") @NotNull UUID userId) {
        List<BankingDto.BankTransactionResponse> response = reconciliationService.bulkReconcile(tenantId, request, userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/transactions/{transactionId}/accept-suggestion")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<BankingDto.BankTransactionResponse> acceptSuggestion(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID transactionId,
            @RequestHeader("X-User-Id") @NotNull UUID userId) {
        BankingDto.BankTransactionResponse response = reconciliationService.acceptSuggestion(tenantId, transactionId, userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/transactions/{transactionId}/unreconcile")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<BankingDto.BankTransactionResponse> unreconcile(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID transactionId,
            @RequestHeader("X-User-Id") @NotNull UUID userId) {
        BankingDto.BankTransactionResponse response = reconciliationService.unreconcile(tenantId, transactionId, userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/transactions/{transactionId}/exclude")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<BankingDto.BankTransactionResponse> excludeTransaction(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID transactionId,
            @RequestHeader("X-User-Id") @NotNull UUID userId) {
        BankingDto.BankTransactionResponse response = reconciliationService.excludeTransaction(tenantId, transactionId, userId);
        return ResponseEntity.ok(response);
    }

    // === Matching Endpoints ===

    @GetMapping("/transactions/{transactionId}/suggested-matches")
    public ResponseEntity<List<BankingDto.SuggestedMatch>> getSuggestedMatches(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID transactionId) {
        List<BankingDto.SuggestedMatch> matches = reconciliationService.getSuggestedMatches(tenantId, transactionId);
        return ResponseEntity.ok(matches);
    }

    @GetMapping("/accounts/{bankAccountId}/potential-matches")
    public ResponseEntity<List<BankingDto.BankTransactionResponse>> findPotentialMatches(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID bankAccountId,
            @RequestParam BigDecimal amount,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<BankingDto.BankTransactionResponse> matches = reconciliationService.findPotentialMatches(
                tenantId, bankAccountId, amount, startDate, endDate);
        return ResponseEntity.ok(matches);
    }

    @PostMapping("/accounts/{bankAccountId}/auto-match")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<Integer> autoMatchTransactions(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID bankAccountId) {
        int matched = reconciliationService.autoMatchTransactions(tenantId, bankAccountId);
        return ResponseEntity.ok(matched);
    }

    // === Reconciliation Reports ===

    @GetMapping("/accounts/{bankAccountId}/reconciliation-summary")
    public ResponseEntity<BankingDto.ReconciliationSummary> getReconciliationSummary(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID bankAccountId) {
        BankingDto.ReconciliationSummary summary = reconciliationService.getReconciliationSummary(tenantId, bankAccountId);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/reconciliation-summaries")
    public ResponseEntity<List<BankingDto.ReconciliationSummary>> getAllReconciliationSummaries(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId) {
        List<BankingDto.ReconciliationSummary> summaries = reconciliationService.getAllReconciliationSummaries(tenantId);
        return ResponseEntity.ok(summaries);
    }

    @GetMapping("/accounts/{bankAccountId}/reconciliation-statement")
    public ResponseEntity<BankReconciliationService.BankReconciliationStatement> getReconciliationStatement(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID bankAccountId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate) {
        LocalDate date = asOfDate != null ? asOfDate : LocalDate.now();
        BankReconciliationService.BankReconciliationStatement statement =
                reconciliationService.generateReconciliationStatement(tenantId, bankAccountId, date);
        return ResponseEntity.ok(statement);
    }

    // === Dashboard ===

    @GetMapping("/dashboard")
    public ResponseEntity<BankingDto.BankingDashboard> getDashboard(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId) {
        BankingDto.BankingDashboard dashboard = bankingService.getDashboard(tenantId);
        return ResponseEntity.ok(dashboard);
    }

    // === Institutions ===

    @GetMapping("/institutions")
    public ResponseEntity<List<BankingDto.InstitutionInfo>> getSupportedInstitutions() {
        List<BankingDto.InstitutionInfo> institutions = bankingService.getSupportedInstitutions();
        return ResponseEntity.ok(institutions);
    }
}
