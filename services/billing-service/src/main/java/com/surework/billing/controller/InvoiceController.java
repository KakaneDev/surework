package com.surework.billing.controller;

import com.surework.billing.dto.BillingDto.*;
import com.surework.billing.entity.Invoice;
import com.surework.billing.service.InvoiceService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @PostMapping
    public ResponseEntity<InvoiceResponse> createInvoice(@RequestBody CreateInvoiceRequest request) {
        InvoiceResponse response = invoiceService.createInvoice(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceResponse> getInvoice(@PathVariable UUID id) {
        return ResponseEntity.ok(invoiceService.getInvoice(id));
    }

    @GetMapping("/number/{invoiceNumber}")
    public ResponseEntity<InvoiceResponse> getInvoiceByNumber(@PathVariable String invoiceNumber) {
        return ResponseEntity.ok(invoiceService.getInvoiceByNumber(invoiceNumber));
    }

    @GetMapping
    public ResponseEntity<PagedResponse<InvoiceResponse>> listInvoices(
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) Invoice.InvoiceStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(invoiceService.listInvoices(tenantId, status, pageable));
    }

    @GetMapping("/tenant/{tenantId}/recent")
    public ResponseEntity<List<InvoiceResponse>> getRecentInvoices(
            @PathVariable UUID tenantId,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(invoiceService.getRecentInvoices(tenantId, limit));
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<InvoiceResponse>> getOverdueInvoices() {
        return ResponseEntity.ok(invoiceService.getOverdueInvoices());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<InvoiceResponse> updateInvoiceStatus(
            @PathVariable UUID id,
            @RequestBody UpdateInvoiceStatusRequest request) {
        return ResponseEntity.ok(invoiceService.updateInvoiceStatus(id, request));
    }

    @PostMapping("/{id}/send")
    public ResponseEntity<InvoiceResponse> sendInvoice(@PathVariable UUID id) {
        return ResponseEntity.ok(invoiceService.sendInvoice(id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<InvoiceResponse> cancelInvoice(@PathVariable UUID id) {
        return ResponseEntity.ok(invoiceService.cancelInvoice(id));
    }

    @GetMapping("/stats/revenue")
    public ResponseEntity<RevenueMetrics> getRevenueMetrics() {
        return ResponseEntity.ok(invoiceService.getRevenueMetrics());
    }

    @GetMapping("/stats/monthly")
    public ResponseEntity<List<RevenueTrend>> getMonthlyRevenueTrends(
            @RequestParam(defaultValue = "12") int months) {
        return ResponseEntity.ok(invoiceService.getMonthlyRevenueTrends(months));
    }
}
