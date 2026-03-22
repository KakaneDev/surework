package com.surework.billing.controller;

import com.surework.billing.dto.BillingDto.*;
import com.surework.billing.entity.Payment;
import com.surework.billing.service.PaymentService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    public ResponseEntity<PaymentResponse> createPayment(@RequestBody CreatePaymentRequest request) {
        PaymentResponse response = paymentService.createPayment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> getPayment(@PathVariable UUID id) {
        return ResponseEntity.ok(paymentService.getPayment(id));
    }

    @GetMapping("/external/{externalId}")
    public ResponseEntity<PaymentResponse> getPaymentByExternalId(@PathVariable String externalId) {
        return ResponseEntity.ok(paymentService.getPaymentByExternalId(externalId));
    }

    @GetMapping
    public ResponseEntity<PagedResponse<PaymentResponse>> listPayments(
            @RequestParam(required = false) UUID tenantId,
            @RequestParam(required = false) Payment.PaymentStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(paymentService.listPayments(tenantId, status, pageable));
    }

    @GetMapping("/tenant/{tenantId}/recent")
    public ResponseEntity<List<PaymentResponse>> getRecentPayments(
            @PathVariable UUID tenantId,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(paymentService.getRecentPayments(tenantId, limit));
    }

    @GetMapping("/failed")
    public ResponseEntity<PagedResponse<PaymentResponse>> getFailedPayments(
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(paymentService.getFailedPayments(days, pageable));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<PaymentResponse> updatePaymentStatus(
            @PathVariable UUID id,
            @RequestBody UpdatePaymentStatusRequest request) {
        return ResponseEntity.ok(paymentService.updatePaymentStatus(id, request));
    }

    @PostMapping("/{id}/refund")
    public ResponseEntity<PaymentResponse> refundPayment(@PathVariable UUID id) {
        return ResponseEntity.ok(paymentService.processRefund(id));
    }

    /**
     * Retry a failed payment.
     */
    @PostMapping("/{id}/retry")
    public ResponseEntity<PaymentResponse> retryPayment(@PathVariable UUID id) {
        return ResponseEntity.ok(paymentService.retryPayment(id));
    }

    @GetMapping("/stats/total")
    public ResponseEntity<BigDecimal> getTotalPayments(
            @RequestParam(defaultValue = "30") int days) {
        Instant startDate = Instant.now().minus(days, ChronoUnit.DAYS);
        Instant endDate = Instant.now();
        return ResponseEntity.ok(paymentService.getTotalPayments(startDate, endDate));
    }

    @GetMapping("/stats/count")
    public ResponseEntity<Long> getPaymentCount(
            @RequestParam(defaultValue = "30") int days) {
        Instant startDate = Instant.now().minus(days, ChronoUnit.DAYS);
        Instant endDate = Instant.now();
        return ResponseEntity.ok(paymentService.getPaymentCount(startDate, endDate));
    }

    @GetMapping("/stats/methods")
    public ResponseEntity<List<PaymentMethodStats>> getPaymentMethodStats(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(paymentService.getPaymentMethodStats(days));
    }

    @GetMapping("/stats/daily")
    public ResponseEntity<List<RevenueTrend>> getDailyPaymentTrends(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(paymentService.getDailyPaymentTrends(days));
    }
}
