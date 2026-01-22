package com.surework.common.messaging.event;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Sealed interface for Accounting domain events.
 * Implements Constitution Principle III: Java 21 Features (Sealed Interfaces).
 */
public sealed interface AccountingEvent extends DomainEvent permits
        AccountingEvent.JournalEntryCreated,
        AccountingEvent.JournalEntryPosted,
        AccountingEvent.InvoiceCreated,
        AccountingEvent.InvoicePaid,
        AccountingEvent.ExpenseRecorded {

    /**
     * Event raised when a journal entry is created.
     */
    record JournalEntryCreated(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID journalEntryId,
            String reference,
            String description,
            BigDecimal totalAmount
    ) implements AccountingEvent {}

    /**
     * Event raised when a journal entry is posted.
     */
    record JournalEntryPosted(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID journalEntryId,
            String reference,
            Instant postedDate
    ) implements AccountingEvent {}

    /**
     * Event raised when an invoice is created.
     */
    record InvoiceCreated(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID invoiceId,
            String invoiceNumber,
            UUID customerId,
            BigDecimal totalAmount,
            BigDecimal vatAmount
    ) implements AccountingEvent {}

    /**
     * Event raised when an invoice is paid.
     */
    record InvoicePaid(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID invoiceId,
            String invoiceNumber,
            BigDecimal amountPaid,
            String paymentReference
    ) implements AccountingEvent {}

    /**
     * Event raised when an expense is recorded.
     */
    record ExpenseRecorded(
            UUID eventId,
            UUID tenantId,
            Instant timestamp,
            UUID expenseId,
            String category,
            BigDecimal amount,
            String description,
            UUID supplierId
    ) implements AccountingEvent {}
}
