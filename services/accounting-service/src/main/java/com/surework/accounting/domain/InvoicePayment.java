package com.surework.accounting.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Represents a payment received against an invoice.
 * Tracks payment method, bank details, and accounting entries.
 */
@Entity
@Table(name = "invoice_payments", indexes = {
        @Index(name = "idx_invoice_payments_invoice", columnList = "invoice_id"),
        @Index(name = "idx_invoice_payments_date", columnList = "payment_date")
})
@Getter
@Setter
@NoArgsConstructor
public class InvoicePayment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 50)
    private PaymentMethod paymentMethod;

    @Column(name = "reference", length = 100)
    private String reference;

    // Bank details
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_account_id")
    private BankAccount bankAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_transaction_id")
    private BankTransaction bankTransaction;

    // Accounting integration
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_entry_id")
    private JournalEntry journalEntry;

    @Column(name = "notes", length = 500)
    private String notes;

    /**
     * Payment methods.
     */
    public enum PaymentMethod {
        CASH,
        EFT,
        CARD,
        CHECK,
        OTHER
    }

    /**
     * Create a new payment.
     */
    public static InvoicePayment create(
            LocalDate paymentDate,
            BigDecimal amount,
            PaymentMethod method,
            String reference) {

        InvoicePayment payment = new InvoicePayment();
        payment.setPaymentDate(paymentDate);
        payment.setAmount(amount);
        payment.setPaymentMethod(method);
        payment.setReference(reference);
        return payment;
    }

    /**
     * Create a payment from bank transaction.
     */
    public static InvoicePayment fromBankTransaction(
            BankTransaction transaction,
            BankAccount bankAccount) {

        InvoicePayment payment = new InvoicePayment();
        payment.setPaymentDate(transaction.getTransactionDate());
        payment.setAmount(transaction.getAmount().abs());
        payment.setPaymentMethod(PaymentMethod.EFT);
        payment.setReference(transaction.getReference());
        payment.setBankTransaction(transaction);
        payment.setBankAccount(bankAccount);
        return payment;
    }

    /**
     * Get payment method display name.
     */
    public String getPaymentMethodDisplay() {
        if (paymentMethod == null) return "Unknown";
        return switch (paymentMethod) {
            case CASH -> "Cash";
            case EFT -> "EFT / Bank Transfer";
            case CARD -> "Card Payment";
            case CHECK -> "Cheque";
            case OTHER -> "Other";
        };
    }
}
