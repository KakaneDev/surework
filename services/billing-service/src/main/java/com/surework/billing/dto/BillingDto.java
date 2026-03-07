package com.surework.billing.dto;

import com.surework.billing.entity.Discount;
import com.surework.billing.entity.Invoice;
import com.surework.billing.entity.Payment;
import com.surework.billing.entity.TenantDiscount;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class BillingDto {

    // ==================== Discount DTOs ====================

    public record CreateDiscountRequest(
            String code,
            Discount.DiscountType type,
            BigDecimal value,
            Integer durationMonths,
            Instant validFrom,
            Instant validUntil,
            Integer maxUses
    ) {}

    public record UpdateDiscountRequest(
            Discount.DiscountStatus status,
            Instant validUntil,
            Integer maxUses
    ) {}

    public record DiscountResponse(
            UUID id,
            String code,
            Discount.DiscountType type,
            BigDecimal value,
            Integer durationMonths,
            Instant validFrom,
            Instant validUntil,
            Integer maxUses,
            Integer currentUses,
            Discount.DiscountStatus status,
            UUID createdBy,
            Instant createdAt
    ) {
        public static DiscountResponse from(Discount discount) {
            return new DiscountResponse(
                    discount.getId(),
                    discount.getCode(),
                    discount.getType(),
                    discount.getValue(),
                    discount.getDurationMonths(),
                    discount.getValidFrom(),
                    discount.getValidUntil(),
                    discount.getMaxUses(),
                    discount.getCurrentUses(),
                    discount.getStatus(),
                    discount.getCreatedBy(),
                    discount.getCreatedAt()
            );
        }
    }

    public record ApplyDiscountRequest(
            UUID tenantId,
            UUID discountId
    ) {}

    public record TenantDiscountResponse(
            UUID id,
            UUID tenantId,
            DiscountResponse discount,
            Instant appliedAt,
            Instant expiresAt,
            TenantDiscount.Status status
    ) {
        public static TenantDiscountResponse from(TenantDiscount td) {
            return new TenantDiscountResponse(
                    td.getId(),
                    td.getTenantId(),
                    DiscountResponse.from(td.getDiscount()),
                    td.getAppliedAt(),
                    td.getExpiresAt(),
                    td.getStatus()
            );
        }
    }

    // ==================== Payment DTOs ====================

    public record CreatePaymentRequest(
            UUID tenantId,
            BigDecimal amount,
            String currency,
            String paymentMethod,
            UUID invoiceId,
            String externalId
    ) {}

    public record UpdatePaymentStatusRequest(
            Payment.PaymentStatus status,
            String failureReason
    ) {}

    public record PaymentResponse(
            UUID id,
            UUID tenantId,
            BigDecimal amount,
            String currency,
            Payment.PaymentStatus status,
            String paymentMethod,
            UUID invoiceId,
            String failureReason,
            String externalId,
            Instant createdAt,
            Instant processedAt
    ) {
        public static PaymentResponse from(Payment payment) {
            return new PaymentResponse(
                    payment.getId(),
                    payment.getTenantId(),
                    payment.getAmount(),
                    payment.getCurrency(),
                    payment.getStatus(),
                    payment.getPaymentMethod(),
                    payment.getInvoiceId(),
                    payment.getFailureReason(),
                    payment.getExternalId(),
                    payment.getCreatedAt(),
                    payment.getProcessedAt()
            );
        }
    }

    public record PaymentMethodStats(
            String paymentMethod,
            Long count,
            BigDecimal totalAmount
    ) {}

    // ==================== Invoice DTOs ====================

    public record CreateInvoiceRequest(
            UUID tenantId,
            BigDecimal amount,
            String currency,
            LocalDate dueDate
    ) {}

    public record UpdateInvoiceStatusRequest(
            Invoice.InvoiceStatus status
    ) {}

    public record InvoiceResponse(
            UUID id,
            UUID tenantId,
            String invoiceNumber,
            BigDecimal amount,
            String currency,
            Invoice.InvoiceStatus status,
            LocalDate dueDate,
            Instant paidAt,
            Instant createdAt
    ) {
        public static InvoiceResponse from(Invoice invoice) {
            return new InvoiceResponse(
                    invoice.getId(),
                    invoice.getTenantId(),
                    invoice.getInvoiceNumber(),
                    invoice.getAmount(),
                    invoice.getCurrency(),
                    invoice.getStatus(),
                    invoice.getDueDate(),
                    invoice.getPaidAt(),
                    invoice.getCreatedAt()
            );
        }
    }

    // ==================== Revenue DTOs ====================

    public record RevenueMetrics(
            BigDecimal mrr,
            BigDecimal arr,
            BigDecimal totalRevenue,
            BigDecimal pendingRevenue,
            BigDecimal overdueRevenue,
            Long totalInvoices,
            Long paidInvoices,
            Long pendingInvoices,
            Long overdueInvoices
    ) {}

    public record RevenueTrend(
            String period,
            BigDecimal amount,
            Long count
    ) {}

    public record RevenueProjection(
            String month,
            BigDecimal projectedMrr,
            BigDecimal projectedArr,
            BigDecimal confidenceLow,
            BigDecimal confidenceHigh
    ) {}

    public record RevenueProjectionResponse(
            RevenueMetrics currentMetrics,
            List<RevenueProjection> projections,
            BigDecimal growthRate,
            BigDecimal churnRate
    ) {}

    // ==================== Dashboard DTOs ====================

    public record BillingDashboard(
            RevenueMetrics metrics,
            List<RevenueTrend> monthlyTrends,
            List<PaymentMethodStats> paymentMethods,
            List<PaymentResponse> recentPayments,
            List<InvoiceResponse> overdueInvoices
    ) {}

    // ==================== Pagination ====================

    public record PagedResponse<T>(
            List<T> content,
            int page,
            int size,
            long totalElements,
            int totalPages,
            boolean first,
            boolean last
    ) {}
}
