package com.surework.accounting.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Represents a sales invoice.
 * Supports VAT calculation, status workflow, and accounting integration.
 */
@Entity
@Table(name = "invoices", indexes = {
        @Index(name = "idx_invoices_number", columnList = "invoice_number"),
        @Index(name = "idx_invoices_customer", columnList = "customer_id"),
        @Index(name = "idx_invoices_status", columnList = "status"),
        @Index(name = "idx_invoices_date", columnList = "invoice_date"),
        @Index(name = "idx_invoices_due_date", columnList = "due_date"),
        @Index(name = "idx_invoices_tenant", columnList = "tenant_id")
})
@Getter
@Setter
@NoArgsConstructor
public class Invoice extends BaseEntity {

    @Column(name = "invoice_number", nullable = false, unique = true, length = 50)
    private String invoiceNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "invoice_type", nullable = false, length = 20)
    private InvoiceType invoiceType = InvoiceType.INVOICE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "invoice_date", nullable = false)
    private LocalDate invoiceDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private InvoiceStatus status = InvoiceStatus.DRAFT;

    @Column(name = "reference", length = 100)
    private String reference;

    @Column(name = "purchase_order", length = 100)
    private String purchaseOrder;

    // Amounts
    @Column(name = "subtotal", nullable = false, precision = 15, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "discount_amount", precision = 15, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "discount_percentage", precision = 5, scale = 2)
    private BigDecimal discountPercentage = BigDecimal.ZERO;

    @Column(name = "subtotal_after_discount", nullable = false, precision = 15, scale = 2)
    private BigDecimal subtotalAfterDiscount = BigDecimal.ZERO;

    @Column(name = "vat_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal vatAmount = BigDecimal.ZERO;

    @Column(name = "total", nullable = false, precision = 15, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;

    // Payment tracking
    @Column(name = "amount_paid", precision = 15, scale = 2)
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @Column(name = "amount_due", precision = 15, scale = 2)
    private BigDecimal amountDue = BigDecimal.ZERO;

    // Currency
    @Column(name = "currency", length = 3)
    private String currency = "ZAR";

    @Column(name = "exchange_rate", precision = 10, scale = 6)
    private BigDecimal exchangeRate = BigDecimal.ONE;

    // Accounting integration
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_entry_id")
    private JournalEntry journalEntry;

    @Column(name = "posted_at")
    private Instant postedAt;

    @Column(name = "posted_by")
    private UUID postedBy;

    // Customer snapshot
    @Column(name = "customer_name", length = 200)
    private String customerName;

    @Column(name = "customer_email", length = 255)
    private String customerEmail;

    @Column(name = "customer_address", columnDefinition = "TEXT")
    private String customerAddress;

    @Column(name = "customer_vat_number", length = 20)
    private String customerVatNumber;

    // Sending details
    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "sent_by")
    private UUID sentBy;

    @Column(name = "sent_to_email", length = 255)
    private String sentToEmail;

    @Column(name = "last_reminder_at")
    private Instant lastReminderAt;

    @Column(name = "reminder_count")
    private int reminderCount = 0;

    // Notes
    @Column(name = "notes", length = 2000)
    private String notes;

    @Column(name = "terms_and_conditions", columnDefinition = "TEXT")
    private String termsAndConditions;

    @Column(name = "footer_text", length = 500)
    private String footerText;

    @Column(name = "internal_notes", length = 2000)
    private String internalNotes;

    // Multi-tenant
    @Column(name = "tenant_id")
    private UUID tenantId;

    // Line items
    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("lineNumber")
    private List<InvoiceLine> lines = new ArrayList<>();

    // Payments
    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("paymentDate DESC")
    private List<InvoicePayment> payments = new ArrayList<>();

    /**
     * Invoice types.
     */
    public enum InvoiceType {
        INVOICE,        // Standard sales invoice
        CREDIT_NOTE,    // Credit note (negative invoice)
        DEBIT_NOTE,     // Debit note (additional charge)
        PROFORMA        // Proforma invoice (quote)
    }

    /**
     * Invoice status workflow.
     */
    public enum InvoiceStatus {
        DRAFT,          // Not yet sent
        SENT,           // Sent to customer
        VIEWED,         // Customer has viewed (if tracked)
        PARTIALLY_PAID, // Some payment received
        PAID,           // Fully paid
        OVERDUE,        // Past due date, not fully paid
        VOID,           // Cancelled
        WRITTEN_OFF     // Bad debt written off
    }

    /**
     * Create a new invoice for a customer.
     */
    public static Invoice create(Customer customer, LocalDate invoiceDate) {
        Invoice invoice = new Invoice();
        invoice.setCustomer(customer);
        invoice.setInvoiceDate(invoiceDate);
        invoice.setDueDate(invoiceDate.plusDays(customer.getPaymentTerms()));
        invoice.setInvoiceType(InvoiceType.INVOICE);
        invoice.setStatus(InvoiceStatus.DRAFT);
        invoice.setCurrency(customer.getCurrency());

        // Snapshot customer details
        invoice.setCustomerName(customer.getDisplayName());
        invoice.setCustomerEmail(customer.getEmail());
        invoice.setCustomerAddress(customer.getFullBillingAddress());
        invoice.setCustomerVatNumber(customer.getVatNumber());

        return invoice;
    }

    /**
     * Create a credit note for this invoice.
     */
    public Invoice createCreditNote(String reason) {
        Invoice creditNote = new Invoice();
        creditNote.setCustomer(this.customer);
        creditNote.setInvoiceDate(LocalDate.now());
        creditNote.setDueDate(LocalDate.now());
        creditNote.setInvoiceType(InvoiceType.CREDIT_NOTE);
        creditNote.setStatus(InvoiceStatus.DRAFT);
        creditNote.setReference("Credit for " + this.invoiceNumber);
        creditNote.setNotes(reason);
        creditNote.setCurrency(this.currency);

        // Copy customer snapshot
        creditNote.setCustomerName(this.customerName);
        creditNote.setCustomerEmail(this.customerEmail);
        creditNote.setCustomerAddress(this.customerAddress);
        creditNote.setCustomerVatNumber(this.customerVatNumber);

        return creditNote;
    }

    /**
     * Add a line item to this invoice.
     */
    public void addLine(InvoiceLine line) {
        line.setLineNumber(lines.size() + 1);
        line.setInvoice(this);
        lines.add(line);
        recalculateTotals();
    }

    /**
     * Remove a line item from this invoice.
     */
    public void removeLine(InvoiceLine line) {
        lines.remove(line);
        line.setInvoice(null);
        renumberLines();
        recalculateTotals();
    }

    private void renumberLines() {
        for (int i = 0; i < lines.size(); i++) {
            lines.get(i).setLineNumber(i + 1);
        }
    }

    /**
     * Recalculate all totals from line items.
     */
    public void recalculateTotals() {
        // Sum line subtotals (before VAT)
        this.subtotal = lines.stream()
                .map(InvoiceLine::getLineSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Apply invoice-level discount
        if (discountPercentage != null && discountPercentage.compareTo(BigDecimal.ZERO) > 0) {
            this.discountAmount = subtotal.multiply(discountPercentage)
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        }

        this.subtotalAfterDiscount = subtotal.subtract(
                discountAmount != null ? discountAmount : BigDecimal.ZERO);

        // Sum VAT from lines
        this.vatAmount = lines.stream()
                .map(InvoiceLine::getVatAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calculate total
        this.total = subtotalAfterDiscount.add(vatAmount);

        // Update amount due
        this.amountDue = total.subtract(amountPaid != null ? amountPaid : BigDecimal.ZERO);
    }

    /**
     * Record a payment against this invoice.
     */
    public void recordPayment(InvoicePayment payment) {
        payment.setInvoice(this);
        payments.add(payment);

        // Update totals
        this.amountPaid = payments.stream()
                .filter(p -> !p.isDeleted())
                .map(InvoicePayment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        this.amountDue = total.subtract(amountPaid);

        // Update status
        updatePaymentStatus();
    }

    /**
     * Update status based on payment amount.
     */
    public void updatePaymentStatus() {
        if (status == InvoiceStatus.VOID || status == InvoiceStatus.WRITTEN_OFF) {
            return; // Don't change void/written-off status
        }

        if (amountDue.compareTo(BigDecimal.ZERO) <= 0) {
            this.status = InvoiceStatus.PAID;
        } else if (amountPaid.compareTo(BigDecimal.ZERO) > 0) {
            this.status = InvoiceStatus.PARTIALLY_PAID;
        } else if (dueDate.isBefore(LocalDate.now()) && status != InvoiceStatus.DRAFT) {
            this.status = InvoiceStatus.OVERDUE;
        }
    }

    /**
     * Mark invoice as sent.
     */
    public void markAsSent(UUID sentBy, String sentToEmail) {
        if (this.status != InvoiceStatus.DRAFT) {
            throw new IllegalStateException("Only draft invoices can be sent");
        }
        this.status = InvoiceStatus.SENT;
        this.sentAt = Instant.now();
        this.sentBy = sentBy;
        this.sentToEmail = sentToEmail;
    }

    /**
     * Mark invoice as viewed by customer.
     */
    public void markAsViewed() {
        if (this.status == InvoiceStatus.SENT) {
            this.status = InvoiceStatus.VIEWED;
        }
    }

    /**
     * Void this invoice.
     */
    public void voidInvoice(String reason) {
        if (this.status == InvoiceStatus.PAID) {
            throw new IllegalStateException("Cannot void a paid invoice");
        }
        this.status = InvoiceStatus.VOID;
        this.internalNotes = (this.internalNotes != null ? this.internalNotes + "\n" : "") +
                "Voided: " + reason;
    }

    /**
     * Write off as bad debt.
     */
    public void writeOff(String reason) {
        this.status = InvoiceStatus.WRITTEN_OFF;
        this.internalNotes = (this.internalNotes != null ? this.internalNotes + "\n" : "") +
                "Written off: " + reason;
    }

    /**
     * Check if invoice is editable.
     */
    public boolean isEditable() {
        return this.status == InvoiceStatus.DRAFT;
    }

    /**
     * Check if invoice is overdue.
     */
    public boolean isOverdue() {
        return dueDate.isBefore(LocalDate.now()) &&
                amountDue.compareTo(BigDecimal.ZERO) > 0 &&
                status != InvoiceStatus.VOID &&
                status != InvoiceStatus.WRITTEN_OFF;
    }

    /**
     * Get days overdue.
     */
    public long getDaysOverdue() {
        if (!isOverdue()) {
            return 0;
        }
        return java.time.temporal.ChronoUnit.DAYS.between(dueDate, LocalDate.now());
    }

    /**
     * Get aging bucket (Current, 30, 60, 90+).
     */
    public String getAgingBucket() {
        long daysOverdue = getDaysOverdue();
        if (daysOverdue <= 0) return "Current";
        if (daysOverdue <= 30) return "1-30 Days";
        if (daysOverdue <= 60) return "31-60 Days";
        if (daysOverdue <= 90) return "61-90 Days";
        return "90+ Days";
    }
}
