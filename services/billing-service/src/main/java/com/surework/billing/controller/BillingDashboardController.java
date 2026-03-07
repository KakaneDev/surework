package com.surework.billing.controller;

import com.surework.billing.dto.BillingDto.*;
import com.surework.billing.service.DiscountService;
import com.surework.billing.service.InvoiceService;
import com.surework.billing.service.PaymentService;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/billing/dashboard")
public class BillingDashboardController {

    private final InvoiceService invoiceService;
    private final PaymentService paymentService;
    private final DiscountService discountService;

    public BillingDashboardController(
            InvoiceService invoiceService,
            PaymentService paymentService,
            DiscountService discountService) {
        this.invoiceService = invoiceService;
        this.paymentService = paymentService;
        this.discountService = discountService;
    }

    @GetMapping
    public ResponseEntity<BillingDashboard> getDashboard() {
        RevenueMetrics metrics = invoiceService.getRevenueMetrics();
        List<RevenueTrend> monthlyTrends = invoiceService.getMonthlyRevenueTrends(6);
        List<PaymentMethodStats> paymentMethods = paymentService.getPaymentMethodStats(30);

        // Get recent payments (all tenants)
        PagedResponse<PaymentResponse> recentPaymentsPage = paymentService.listPayments(
                null, null, PageRequest.of(0, 10));
        List<PaymentResponse> recentPayments = recentPaymentsPage.content();

        List<InvoiceResponse> overdueInvoices = invoiceService.getOverdueInvoices();

        return ResponseEntity.ok(new BillingDashboard(
                metrics,
                monthlyTrends,
                paymentMethods,
                recentPayments,
                overdueInvoices
        ));
    }

    @GetMapping("/revenue")
    public ResponseEntity<RevenueMetrics> getRevenueMetrics() {
        return ResponseEntity.ok(invoiceService.getRevenueMetrics());
    }

    @GetMapping("/projections")
    public ResponseEntity<RevenueProjectionResponse> getRevenueProjections(
            @RequestParam(defaultValue = "6") int months,
            @RequestParam(defaultValue = "0.05") double growthRate,
            @RequestParam(defaultValue = "0.02") double churnRate) {

        RevenueMetrics currentMetrics = invoiceService.getRevenueMetrics();
        List<RevenueProjection> projections = calculateProjections(
                currentMetrics.mrr(), months, growthRate, churnRate);

        return ResponseEntity.ok(new RevenueProjectionResponse(
                currentMetrics,
                projections,
                BigDecimal.valueOf(growthRate),
                BigDecimal.valueOf(churnRate)
        ));
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<TenantBillingSummary> getTenantBillingSummary(@PathVariable UUID tenantId) {
        List<InvoiceResponse> recentInvoices = invoiceService.getRecentInvoices(tenantId, 5);
        List<PaymentResponse> recentPayments = paymentService.getRecentPayments(tenantId, 5);
        List<TenantDiscountResponse> activeDiscounts = discountService.getTenantDiscounts(tenantId);

        BigDecimal totalPaid = recentPayments.stream()
                .map(PaymentResponse::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal outstanding = recentInvoices.stream()
                .filter(i -> i.status().name().equals("PENDING") || i.status().name().equals("OVERDUE"))
                .map(InvoiceResponse::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return ResponseEntity.ok(new TenantBillingSummary(
                tenantId,
                totalPaid,
                outstanding,
                recentInvoices,
                recentPayments,
                activeDiscounts
        ));
    }

    private List<RevenueProjection> calculateProjections(
            BigDecimal currentMrr, int months, double growthRate, double churnRate) {

        List<RevenueProjection> projections = new ArrayList<>();
        BigDecimal mrr = currentMrr;
        YearMonth currentMonth = YearMonth.now();

        for (int i = 1; i <= months; i++) {
            YearMonth projectionMonth = currentMonth.plusMonths(i);

            // Apply net growth (growth - churn)
            double netGrowth = growthRate - churnRate;
            mrr = mrr.multiply(BigDecimal.valueOf(1 + netGrowth));

            BigDecimal arr = mrr.multiply(BigDecimal.valueOf(12));

            // Confidence interval (wider as we go further)
            double confidenceMultiplier = 0.1 * i;
            BigDecimal confidenceLow = mrr.multiply(BigDecimal.valueOf(1 - confidenceMultiplier))
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal confidenceHigh = mrr.multiply(BigDecimal.valueOf(1 + confidenceMultiplier))
                    .setScale(2, RoundingMode.HALF_UP);

            projections.add(new RevenueProjection(
                    projectionMonth.toString(),
                    mrr.setScale(2, RoundingMode.HALF_UP),
                    arr.setScale(2, RoundingMode.HALF_UP),
                    confidenceLow,
                    confidenceHigh
            ));
        }

        return projections;
    }

    // Additional DTO for tenant billing summary
    public record TenantBillingSummary(
            UUID tenantId,
            BigDecimal totalPaid,
            BigDecimal outstanding,
            List<InvoiceResponse> recentInvoices,
            List<PaymentResponse> recentPayments,
            List<TenantDiscountResponse> activeDiscounts
    ) {}
}
