package com.surework.accounting.controller;

import com.surework.accounting.domain.Invoice;
import com.surework.accounting.dto.InvoiceDto;
import com.surework.accounting.service.InvoiceService;
import com.surework.common.web.PageResponse;
import com.surework.common.web.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for Invoice and Customer operations.
 * Handles invoicing, payments, and accounts receivable management.
 *
 * <p>All endpoints require authentication and appropriate role-based authorization.
 * Tenant isolation is enforced via the X-Tenant-Id header.
 */
@RestController
@RequestMapping("/api/v1/accounting/invoices")
@RequiredArgsConstructor
@Validated
@PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'FINANCE_MANAGER', 'SALES')")
public class InvoiceController {

    private final InvoiceService invoiceService;

    // ==================== Customer Endpoints ====================

    @PostMapping("/customers")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'SALES')")
    public ResponseEntity<InvoiceDto.CustomerResponse> createCustomer(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @Valid @RequestBody InvoiceDto.CreateCustomerRequest request) {
        InvoiceDto.CustomerResponse response = invoiceService.createCustomer(tenantId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/customers/{customerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'SALES')")
    public ResponseEntity<InvoiceDto.CustomerResponse> updateCustomer(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID customerId,
            @Valid @RequestBody InvoiceDto.UpdateCustomerRequest request) {
        InvoiceDto.CustomerResponse response = invoiceService.updateCustomer(tenantId, customerId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/customers/{customerId}")
    public ResponseEntity<InvoiceDto.CustomerResponse> getCustomer(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID customerId) {
        return invoiceService.getCustomer(tenantId, customerId)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", customerId));
    }

    @GetMapping("/customers/code/{customerCode}")
    public ResponseEntity<InvoiceDto.CustomerResponse> getCustomerByCode(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable String customerCode) {
        return invoiceService.getCustomerByCode(tenantId, customerCode)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", customerCode));
    }

    @GetMapping("/customers")
    public ResponseEntity<PageResponse<InvoiceDto.CustomerResponse>> searchCustomers(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<InvoiceDto.CustomerResponse> page = invoiceService.searchCustomers(tenantId, searchTerm, activeOnly, pageable);
        return ResponseEntity.ok(PageResponse.from(page));
    }

    @GetMapping("/customers/all")
    public ResponseEntity<List<InvoiceDto.CustomerResponse>> getAllCustomers(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId) {
        List<InvoiceDto.CustomerResponse> customers = invoiceService.getAllCustomers(tenantId);
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/customers/active")
    public ResponseEntity<List<InvoiceDto.CustomerSummary>> getActiveCustomers(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId) {
        List<InvoiceDto.CustomerSummary> customers = invoiceService.getActiveCustomers(tenantId);
        return ResponseEntity.ok(customers);
    }

    @PostMapping("/customers/{customerId}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<Void> deactivateCustomer(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID customerId) {
        invoiceService.deactivateCustomer(tenantId, customerId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/customers/{customerId}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<Void> activateCustomer(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID customerId) {
        invoiceService.activateCustomer(tenantId, customerId);
        return ResponseEntity.noContent().build();
    }

    // ==================== Invoice CRUD Endpoints ====================

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'SALES')")
    public ResponseEntity<InvoiceDto.InvoiceResponse> createInvoice(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @Valid @RequestBody InvoiceDto.CreateInvoiceRequest request) {
        InvoiceDto.InvoiceResponse response = invoiceService.createInvoice(tenantId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{invoiceId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'SALES')")
    public ResponseEntity<InvoiceDto.InvoiceResponse> updateInvoice(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID invoiceId,
            @Valid @RequestBody InvoiceDto.UpdateInvoiceRequest request) {
        InvoiceDto.InvoiceResponse response = invoiceService.updateInvoice(tenantId, invoiceId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{invoiceId}")
    public ResponseEntity<InvoiceDto.InvoiceResponse> getInvoice(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID invoiceId) {
        return invoiceService.getInvoice(tenantId, invoiceId)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", invoiceId));
    }

    @GetMapping("/number/{invoiceNumber}")
    public ResponseEntity<InvoiceDto.InvoiceResponse> getInvoiceByNumber(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable String invoiceNumber) {
        return invoiceService.getInvoiceByNumber(tenantId, invoiceNumber)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", invoiceNumber));
    }

    @GetMapping
    public ResponseEntity<PageResponse<InvoiceDto.InvoiceSummary>> searchInvoices(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @RequestParam(required = false) Invoice.InvoiceStatus status,
            @RequestParam(required = false) UUID customerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String searchTerm,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<InvoiceDto.InvoiceSummary> page = invoiceService.searchInvoices(
                tenantId, status, customerId, startDate, endDate, searchTerm, pageable);
        return ResponseEntity.ok(PageResponse.from(page));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<InvoiceDto.InvoiceSummary>> getInvoicesByCustomer(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID customerId) {
        List<InvoiceDto.InvoiceSummary> invoices = invoiceService.getInvoicesByCustomer(tenantId, customerId);
        return ResponseEntity.ok(invoices);
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<InvoiceDto.InvoiceSummary>> getOverdueInvoices(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId) {
        List<InvoiceDto.InvoiceSummary> invoices = invoiceService.getOverdueInvoices(tenantId);
        return ResponseEntity.ok(invoices);
    }

    @GetMapping("/unpaid")
    public ResponseEntity<List<InvoiceDto.InvoiceSummary>> getUnpaidInvoices(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId) {
        List<InvoiceDto.InvoiceSummary> invoices = invoiceService.getUnpaidInvoices(tenantId);
        return ResponseEntity.ok(invoices);
    }

    @GetMapping("/drafts")
    public ResponseEntity<List<InvoiceDto.InvoiceSummary>> getDraftInvoices(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId) {
        List<InvoiceDto.InvoiceSummary> invoices = invoiceService.getDraftInvoices(tenantId);
        return ResponseEntity.ok(invoices);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<InvoiceDto.InvoiceSummary>> getRecentInvoices(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @RequestParam(required = false, defaultValue = "10") int limit) {
        List<InvoiceDto.InvoiceSummary> invoices = invoiceService.getRecentInvoices(tenantId, limit);
        return ResponseEntity.ok(invoices);
    }

    @DeleteMapping("/{invoiceId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<Void> deleteInvoice(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID invoiceId) {
        invoiceService.deleteInvoice(tenantId, invoiceId);
        return ResponseEntity.noContent().build();
    }

    // ==================== Invoice Action Endpoints ====================

    /**
     * Send invoice to customer via email.
     * Creates accounting entry and changes status to SENT.
     */
    @PostMapping("/{invoiceId}/send")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'SALES')")
    public ResponseEntity<InvoiceDto.InvoiceResponse> sendInvoice(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID invoiceId,
            @Valid @RequestBody InvoiceDto.SendInvoiceRequest request,
            @RequestHeader("X-User-Id") @NotNull UUID sentBy) {
        InvoiceDto.InvoiceResponse response = invoiceService.sendInvoice(tenantId, invoiceId, request, sentBy);
        return ResponseEntity.ok(response);
    }

    /**
     * Post invoice to accounting (create journal entry).
     * For manual posting without sending.
     */
    @PostMapping("/{invoiceId}/post")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<InvoiceDto.InvoiceResponse> postInvoice(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID invoiceId,
            @RequestHeader("X-User-Id") @NotNull UUID postedBy) {
        InvoiceDto.InvoiceResponse response = invoiceService.postInvoice(tenantId, invoiceId, postedBy);
        return ResponseEntity.ok(response);
    }

    /**
     * Record a payment against an invoice.
     */
    @PostMapping("/{invoiceId}/payments")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<InvoiceDto.InvoiceResponse> recordPayment(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID invoiceId,
            @Valid @RequestBody InvoiceDto.RecordPaymentRequest request) {
        InvoiceDto.InvoiceResponse response = invoiceService.recordPayment(tenantId, invoiceId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Void an invoice.
     */
    @PostMapping("/{invoiceId}/void")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<InvoiceDto.InvoiceResponse> voidInvoice(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID invoiceId,
            @Valid @RequestBody InvoiceDto.VoidInvoiceRequest request) {
        InvoiceDto.InvoiceResponse response = invoiceService.voidInvoice(tenantId, invoiceId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Write off invoice as bad debt.
     */
    @PostMapping("/{invoiceId}/write-off")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<InvoiceDto.InvoiceResponse> writeOffInvoice(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID invoiceId,
            @Valid @RequestBody InvoiceDto.WriteOffInvoiceRequest request) {
        InvoiceDto.InvoiceResponse response = invoiceService.writeOffInvoice(tenantId, invoiceId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Create a credit note for an invoice.
     */
    @PostMapping("/{invoiceId}/credit-note")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<InvoiceDto.InvoiceResponse> createCreditNote(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID invoiceId,
            @RequestParam String reason) {
        InvoiceDto.InvoiceResponse response = invoiceService.createCreditNote(tenantId, invoiceId, reason);
        return ResponseEntity.ok(response);
    }

    /**
     * Send payment reminder.
     */
    @PostMapping("/{invoiceId}/reminder")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT', 'SALES')")
    public ResponseEntity<Void> sendPaymentReminder(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID invoiceId) {
        invoiceService.sendPaymentReminder(tenantId, invoiceId);
        return ResponseEntity.noContent().build();
    }

    // ==================== Dashboard and Reporting Endpoints ====================

    /**
     * Get invoice dashboard summary.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<InvoiceDto.InvoiceDashboardSummary> getDashboardSummary(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId) {
        InvoiceDto.InvoiceDashboardSummary summary = invoiceService.getDashboardSummary(tenantId);
        return ResponseEntity.ok(summary);
    }

    /**
     * Get aging summary.
     */
    @GetMapping("/reports/aging")
    public ResponseEntity<InvoiceDto.AgingSummary> getAgingSummary(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId) {
        InvoiceDto.AgingSummary summary = invoiceService.getAgingSummary(tenantId);
        return ResponseEntity.ok(summary);
    }

    /**
     * Get aging report by customer.
     */
    @GetMapping("/reports/aging/by-customer")
    public ResponseEntity<List<InvoiceDto.CustomerAgingReport>> getAgingByCustomer(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId) {
        List<InvoiceDto.CustomerAgingReport> report = invoiceService.getAgingByCustomer(tenantId);
        return ResponseEntity.ok(report);
    }

    /**
     * Update overdue statuses.
     * Should be called by a scheduled job.
     */
    @PostMapping("/update-overdue-statuses")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateOverdueStatuses(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId) {
        invoiceService.updateOverdueStatuses(tenantId);
        return ResponseEntity.noContent().build();
    }

    // ==================== PDF Generation ====================

    /**
     * Generate PDF for invoice.
     */
    @GetMapping("/{invoiceId}/pdf")
    public ResponseEntity<byte[]> generatePdf(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId,
            @PathVariable UUID invoiceId) {
        byte[] pdfBytes = invoiceService.generatePdf(tenantId, invoiceId);

        // Get invoice number for filename
        String invoiceNumber = invoiceService.getInvoice(tenantId, invoiceId)
                .map(InvoiceDto.InvoiceResponse::invoiceNumber)
                .orElse("invoice");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", invoiceNumber + ".pdf");
        headers.setContentLength(pdfBytes.length);

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    /**
     * Generate next invoice number preview.
     */
    @GetMapping("/next-number")
    public ResponseEntity<String> getNextInvoiceNumber(
            @RequestHeader("X-Tenant-Id") @NotNull UUID tenantId) {
        String nextNumber = invoiceService.generateInvoiceNumber(tenantId);
        return ResponseEntity.ok(nextNumber);
    }
}
