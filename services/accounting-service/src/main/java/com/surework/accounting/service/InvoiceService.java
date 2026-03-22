package com.surework.accounting.service;

import com.surework.accounting.domain.Invoice;
import com.surework.accounting.dto.InvoiceDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service interface for invoice operations.
 * Handles invoice creation, sending, payments, and reporting.
 * All methods require tenant ID for multi-tenant data isolation.
 */
public interface InvoiceService {

    // === Customer Operations ===

    InvoiceDto.CustomerResponse createCustomer(UUID tenantId, InvoiceDto.CreateCustomerRequest request);

    InvoiceDto.CustomerResponse updateCustomer(UUID tenantId, UUID customerId, InvoiceDto.UpdateCustomerRequest request);

    Optional<InvoiceDto.CustomerResponse> getCustomer(UUID tenantId, UUID customerId);

    Optional<InvoiceDto.CustomerResponse> getCustomerByCode(UUID tenantId, String customerCode);

    List<InvoiceDto.CustomerResponse> getAllCustomers(UUID tenantId);

    List<InvoiceDto.CustomerSummary> getActiveCustomers(UUID tenantId);

    Page<InvoiceDto.CustomerResponse> searchCustomers(UUID tenantId, String searchTerm, boolean activeOnly, Pageable pageable);

    void deactivateCustomer(UUID tenantId, UUID customerId);

    void activateCustomer(UUID tenantId, UUID customerId);

    // === Invoice Operations ===

    InvoiceDto.InvoiceResponse createInvoice(UUID tenantId, InvoiceDto.CreateInvoiceRequest request);

    InvoiceDto.InvoiceResponse updateInvoice(UUID tenantId, UUID invoiceId, InvoiceDto.UpdateInvoiceRequest request);

    Optional<InvoiceDto.InvoiceResponse> getInvoice(UUID tenantId, UUID invoiceId);

    Optional<InvoiceDto.InvoiceResponse> getInvoiceByNumber(UUID tenantId, String invoiceNumber);

    List<InvoiceDto.InvoiceSummary> getInvoicesByCustomer(UUID tenantId, UUID customerId);

    Page<InvoiceDto.InvoiceSummary> searchInvoices(
            UUID tenantId,
            Invoice.InvoiceStatus status,
            UUID customerId,
            LocalDate startDate,
            LocalDate endDate,
            String searchTerm,
            Pageable pageable);

    List<InvoiceDto.InvoiceSummary> getOverdueInvoices(UUID tenantId);

    List<InvoiceDto.InvoiceSummary> getUnpaidInvoices(UUID tenantId);

    List<InvoiceDto.InvoiceSummary> getDraftInvoices(UUID tenantId);

    List<InvoiceDto.InvoiceSummary> getRecentInvoices(UUID tenantId, int limit);

    void deleteInvoice(UUID tenantId, UUID invoiceId);

    // === Invoice Actions ===

    /**
     * Send invoice to customer via email.
     * Creates accounting entry and changes status to SENT.
     */
    InvoiceDto.InvoiceResponse sendInvoice(UUID tenantId, UUID invoiceId, InvoiceDto.SendInvoiceRequest request, UUID sentBy);

    /**
     * Post invoice to accounting (create journal entry).
     * For manual posting without sending.
     */
    InvoiceDto.InvoiceResponse postInvoice(UUID tenantId, UUID invoiceId, UUID postedBy);

    /**
     * Record a payment against an invoice.
     */
    InvoiceDto.InvoiceResponse recordPayment(UUID tenantId, UUID invoiceId, InvoiceDto.RecordPaymentRequest request);

    /**
     * Void an invoice.
     */
    InvoiceDto.InvoiceResponse voidInvoice(UUID tenantId, UUID invoiceId, InvoiceDto.VoidInvoiceRequest request);

    /**
     * Write off invoice as bad debt.
     */
    InvoiceDto.InvoiceResponse writeOffInvoice(UUID tenantId, UUID invoiceId, InvoiceDto.WriteOffInvoiceRequest request);

    /**
     * Create a credit note for an invoice.
     */
    InvoiceDto.InvoiceResponse createCreditNote(UUID tenantId, UUID invoiceId, String reason);

    /**
     * Send payment reminder.
     */
    void sendPaymentReminder(UUID tenantId, UUID invoiceId);

    // === Dashboard and Reporting ===

    /**
     * Get invoice dashboard summary.
     */
    InvoiceDto.InvoiceDashboardSummary getDashboardSummary(UUID tenantId);

    /**
     * Get aging summary.
     */
    InvoiceDto.AgingSummary getAgingSummary(UUID tenantId);

    /**
     * Get aging report by customer.
     */
    List<InvoiceDto.CustomerAgingReport> getAgingByCustomer(UUID tenantId);

    /**
     * Update overdue statuses.
     * Should be run daily to mark invoices as overdue.
     */
    void updateOverdueStatuses(UUID tenantId);

    // === PDF Generation ===

    /**
     * Generate PDF for invoice.
     */
    byte[] generatePdf(UUID tenantId, UUID invoiceId);

    // === Number Generation ===

    /**
     * Generate next invoice number.
     */
    String generateInvoiceNumber(UUID tenantId);
}
