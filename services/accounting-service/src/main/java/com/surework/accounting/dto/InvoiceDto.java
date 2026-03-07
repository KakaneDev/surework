package com.surework.accounting.dto;

import com.surework.accounting.domain.*;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * DTOs for Invoice operations.
 */
public sealed interface InvoiceDto {

    // === Customer DTOs ===

    record CreateCustomerRequest(
            @NotBlank(message = "Customer code is required")
            @Size(max = 20, message = "Customer code must not exceed 20 characters")
            String customerCode,

            @NotBlank(message = "Customer name is required")
            @Size(max = 200, message = "Customer name must not exceed 200 characters")
            String customerName,

            String tradingName,
            @Email(message = "Invalid email format")
            String email,
            String phone,
            String mobile,
            String contactPerson,
            String contactEmail,
            String addressLine1,
            String addressLine2,
            String city,
            String province,
            String postalCode,
            String country,
            String vatNumber,
            boolean taxExempt,
            Integer paymentTerms,
            BigDecimal creditLimit,
            UUID defaultRevenueAccountId,
            UUID defaultReceivableAccountId,
            String notes
    ) implements InvoiceDto {}

    record UpdateCustomerRequest(
            String customerName,
            String tradingName,
            @Email(message = "Invalid email format")
            String email,
            String phone,
            String mobile,
            String contactPerson,
            String contactEmail,
            String addressLine1,
            String addressLine2,
            String city,
            String province,
            String postalCode,
            String country,
            String billingAddressLine1,
            String billingAddressLine2,
            String billingCity,
            String billingProvince,
            String billingPostalCode,
            String billingCountry,
            String vatNumber,
            boolean taxExempt,
            Integer paymentTerms,
            BigDecimal creditLimit,
            Boolean active,
            UUID defaultRevenueAccountId,
            UUID defaultReceivableAccountId,
            String notes
    ) implements InvoiceDto {}

    record CustomerResponse(
            UUID id,
            String customerCode,
            String customerName,
            String tradingName,
            String email,
            String phone,
            String mobile,
            String contactPerson,
            String contactEmail,
            String addressLine1,
            String addressLine2,
            String city,
            String province,
            String postalCode,
            String country,
            String fullAddress,
            String billingAddressLine1,
            String billingAddressLine2,
            String billingCity,
            String billingProvince,
            String billingPostalCode,
            String billingCountry,
            String fullBillingAddress,
            String vatNumber,
            boolean vatRegistered,
            boolean taxExempt,
            int paymentTerms,
            BigDecimal creditLimit,
            String currency,
            UUID defaultRevenueAccountId,
            UUID defaultReceivableAccountId,
            boolean active,
            String notes,
            Instant createdAt
    ) implements InvoiceDto {

        public static CustomerResponse fromEntity(Customer customer) {
            return new CustomerResponse(
                    customer.getId(),
                    customer.getCustomerCode(),
                    customer.getCustomerName(),
                    customer.getTradingName(),
                    customer.getEmail(),
                    customer.getPhone(),
                    customer.getMobile(),
                    customer.getContactPerson(),
                    customer.getContactEmail(),
                    customer.getAddressLine1(),
                    customer.getAddressLine2(),
                    customer.getCity(),
                    customer.getProvince(),
                    customer.getPostalCode(),
                    customer.getCountry(),
                    customer.getFullAddress(),
                    customer.getBillingAddressLine1(),
                    customer.getBillingAddressLine2(),
                    customer.getBillingCity(),
                    customer.getBillingProvince(),
                    customer.getBillingPostalCode(),
                    customer.getBillingCountry(),
                    customer.getFullBillingAddress(),
                    customer.getVatNumber(),
                    customer.isVatRegistered(),
                    customer.isTaxExempt(),
                    customer.getPaymentTerms(),
                    customer.getCreditLimit(),
                    customer.getCurrency(),
                    customer.getDefaultRevenueAccount() != null ? customer.getDefaultRevenueAccount().getId() : null,
                    customer.getDefaultReceivableAccount() != null ? customer.getDefaultReceivableAccount().getId() : null,
                    customer.isActive(),
                    customer.getNotes(),
                    customer.getCreatedAt()
            );
        }
    }

    record CustomerSummary(
            UUID id,
            String customerCode,
            String customerName,
            String email,
            boolean active
    ) implements InvoiceDto {

        public static CustomerSummary fromEntity(Customer customer) {
            return new CustomerSummary(
                    customer.getId(),
                    customer.getCustomerCode(),
                    customer.getDisplayName(),
                    customer.getEmail(),
                    customer.isActive()
            );
        }
    }

    // === Invoice DTOs ===

    record CreateInvoiceRequest(
            @NotNull(message = "Customer ID is required")
            UUID customerId,

            @NotNull(message = "Invoice date is required")
            LocalDate invoiceDate,

            LocalDate dueDate,
            String reference,
            String purchaseOrder,
            Invoice.InvoiceType invoiceType,

            @NotNull(message = "At least one line item is required")
            @Size(min = 1, message = "At least one line item is required")
            List<CreateInvoiceLineRequest> lines,

            BigDecimal discountPercentage,
            BigDecimal discountAmount,
            String notes,
            String termsAndConditions,
            String footerText,
            String internalNotes
    ) implements InvoiceDto {}

    record CreateInvoiceLineRequest(
            @NotBlank(message = "Description is required")
            String description,

            UUID productId,
            String productCode,
            String productName,

            @NotNull(message = "Quantity is required")
            @Positive(message = "Quantity must be positive")
            BigDecimal quantity,

            String unitOfMeasure,

            @NotNull(message = "Unit price is required")
            @PositiveOrZero(message = "Unit price must not be negative")
            BigDecimal unitPrice,

            BigDecimal discountPercentage,
            BigDecimal discountAmount,

            InvoiceLine.VatCategory vatCategory,
            UUID revenueAccountId
    ) implements InvoiceDto {}

    record UpdateInvoiceRequest(
            LocalDate invoiceDate,
            LocalDate dueDate,
            String reference,
            String purchaseOrder,
            List<CreateInvoiceLineRequest> lines,
            BigDecimal discountPercentage,
            BigDecimal discountAmount,
            String notes,
            String termsAndConditions,
            String footerText,
            String internalNotes
    ) implements InvoiceDto {}

    record InvoiceResponse(
            UUID id,
            String invoiceNumber,
            Invoice.InvoiceType invoiceType,
            UUID customerId,
            String customerCode,
            String customerName,
            String customerEmail,
            String customerAddress,
            String customerVatNumber,
            LocalDate invoiceDate,
            LocalDate dueDate,
            Invoice.InvoiceStatus status,
            String reference,
            String purchaseOrder,
            BigDecimal subtotal,
            BigDecimal discountAmount,
            BigDecimal discountPercentage,
            BigDecimal subtotalAfterDiscount,
            BigDecimal vatAmount,
            BigDecimal total,
            BigDecimal amountPaid,
            BigDecimal amountDue,
            String currency,
            UUID journalEntryId,
            Instant postedAt,
            Instant sentAt,
            String sentToEmail,
            int reminderCount,
            String notes,
            String termsAndConditions,
            String footerText,
            String internalNotes,
            List<InvoiceLineResponse> lines,
            List<InvoicePaymentResponse> payments,
            boolean overdue,
            long daysOverdue,
            String agingBucket,
            Instant createdAt
    ) implements InvoiceDto {

        public static InvoiceResponse fromEntity(Invoice invoice) {
            return new InvoiceResponse(
                    invoice.getId(),
                    invoice.getInvoiceNumber(),
                    invoice.getInvoiceType(),
                    invoice.getCustomer() != null ? invoice.getCustomer().getId() : null,
                    invoice.getCustomer() != null ? invoice.getCustomer().getCustomerCode() : null,
                    invoice.getCustomerName(),
                    invoice.getCustomerEmail(),
                    invoice.getCustomerAddress(),
                    invoice.getCustomerVatNumber(),
                    invoice.getInvoiceDate(),
                    invoice.getDueDate(),
                    invoice.getStatus(),
                    invoice.getReference(),
                    invoice.getPurchaseOrder(),
                    invoice.getSubtotal(),
                    invoice.getDiscountAmount(),
                    invoice.getDiscountPercentage(),
                    invoice.getSubtotalAfterDiscount(),
                    invoice.getVatAmount(),
                    invoice.getTotal(),
                    invoice.getAmountPaid(),
                    invoice.getAmountDue(),
                    invoice.getCurrency(),
                    invoice.getJournalEntry() != null ? invoice.getJournalEntry().getId() : null,
                    invoice.getPostedAt(),
                    invoice.getSentAt(),
                    invoice.getSentToEmail(),
                    invoice.getReminderCount(),
                    invoice.getNotes(),
                    invoice.getTermsAndConditions(),
                    invoice.getFooterText(),
                    invoice.getInternalNotes(),
                    invoice.getLines().stream().map(InvoiceLineResponse::fromEntity).toList(),
                    invoice.getPayments().stream().map(InvoicePaymentResponse::fromEntity).toList(),
                    invoice.isOverdue(),
                    invoice.getDaysOverdue(),
                    invoice.getAgingBucket(),
                    invoice.getCreatedAt()
            );
        }
    }

    record InvoiceSummary(
            UUID id,
            String invoiceNumber,
            Invoice.InvoiceType invoiceType,
            String customerName,
            LocalDate invoiceDate,
            LocalDate dueDate,
            Invoice.InvoiceStatus status,
            BigDecimal total,
            BigDecimal amountDue,
            boolean overdue,
            String agingBucket
    ) implements InvoiceDto {

        public static InvoiceSummary fromEntity(Invoice invoice) {
            return new InvoiceSummary(
                    invoice.getId(),
                    invoice.getInvoiceNumber(),
                    invoice.getInvoiceType(),
                    invoice.getCustomerName(),
                    invoice.getInvoiceDate(),
                    invoice.getDueDate(),
                    invoice.getStatus(),
                    invoice.getTotal(),
                    invoice.getAmountDue(),
                    invoice.isOverdue(),
                    invoice.getAgingBucket()
            );
        }
    }

    record InvoiceLineResponse(
            UUID id,
            int lineNumber,
            String description,
            UUID productId,
            String productCode,
            String productName,
            BigDecimal quantity,
            String unitOfMeasure,
            BigDecimal unitPrice,
            BigDecimal discountPercentage,
            BigDecimal discountAmount,
            InvoiceLine.VatCategory vatCategory,
            BigDecimal vatRate,
            BigDecimal vatAmount,
            BigDecimal lineSubtotal,
            BigDecimal lineTotal,
            UUID revenueAccountId
    ) implements InvoiceDto {

        public static InvoiceLineResponse fromEntity(InvoiceLine line) {
            return new InvoiceLineResponse(
                    line.getId(),
                    line.getLineNumber(),
                    line.getDescription(),
                    line.getProductId(),
                    line.getProductCode(),
                    line.getProductName(),
                    line.getQuantity(),
                    line.getUnitOfMeasure(),
                    line.getUnitPrice(),
                    line.getDiscountPercentage(),
                    line.getDiscountAmount(),
                    line.getVatCategory(),
                    line.getVatRate(),
                    line.getVatAmount(),
                    line.getLineSubtotal(),
                    line.getLineTotal(),
                    line.getRevenueAccount() != null ? line.getRevenueAccount().getId() : null
            );
        }
    }

    // === Payment DTOs ===

    record RecordPaymentRequest(
            @NotNull(message = "Payment date is required")
            LocalDate paymentDate,

            @NotNull(message = "Amount is required")
            @Positive(message = "Amount must be positive")
            BigDecimal amount,

            InvoicePayment.PaymentMethod paymentMethod,
            String reference,
            UUID bankAccountId,
            UUID bankTransactionId,
            String notes
    ) implements InvoiceDto {}

    record InvoicePaymentResponse(
            UUID id,
            LocalDate paymentDate,
            BigDecimal amount,
            InvoicePayment.PaymentMethod paymentMethod,
            String paymentMethodDisplay,
            String reference,
            UUID bankAccountId,
            UUID bankTransactionId,
            UUID journalEntryId,
            String notes,
            Instant createdAt
    ) implements InvoiceDto {

        public static InvoicePaymentResponse fromEntity(InvoicePayment payment) {
            return new InvoicePaymentResponse(
                    payment.getId(),
                    payment.getPaymentDate(),
                    payment.getAmount(),
                    payment.getPaymentMethod(),
                    payment.getPaymentMethodDisplay(),
                    payment.getReference(),
                    payment.getBankAccount() != null ? payment.getBankAccount().getId() : null,
                    payment.getBankTransaction() != null ? payment.getBankTransaction().getId() : null,
                    payment.getJournalEntry() != null ? payment.getJournalEntry().getId() : null,
                    payment.getNotes(),
                    payment.getCreatedAt()
            );
        }
    }

    // === Dashboard and Reporting DTOs ===

    record InvoiceDashboardSummary(
            int totalInvoices,
            int draftCount,
            int sentCount,
            int overdueCount,
            BigDecimal totalOutstanding,
            BigDecimal totalOverdue,
            AgingSummary aging,
            List<InvoiceSummary> recentInvoices,
            List<InvoiceSummary> overdueInvoices
    ) implements InvoiceDto {}

    record AgingSummary(
            BigDecimal current,
            BigDecimal days1To30,
            BigDecimal days31To60,
            BigDecimal days61To90,
            BigDecimal days90Plus,
            BigDecimal total
    ) implements InvoiceDto {}

    record CustomerAgingReport(
            UUID customerId,
            String customerCode,
            String customerName,
            BigDecimal current,
            BigDecimal days1To30,
            BigDecimal days31To60,
            BigDecimal days61To90,
            BigDecimal days90Plus,
            BigDecimal total
    ) implements InvoiceDto {}

    // === Action DTOs ===

    record SendInvoiceRequest(
            @NotBlank(message = "Email address is required")
            @Email(message = "Invalid email format")
            String toEmail,

            String ccEmail,
            String subject,
            String message,
            boolean attachPdf
    ) implements InvoiceDto {}

    record VoidInvoiceRequest(
            @NotBlank(message = "Reason is required")
            String reason
    ) implements InvoiceDto {}

    record WriteOffInvoiceRequest(
            @NotBlank(message = "Reason is required")
            String reason
    ) implements InvoiceDto {}
}
