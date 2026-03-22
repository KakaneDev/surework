package com.surework.billing.controller;

import com.surework.billing.dto.BillingDto.*;
import com.surework.billing.entity.Discount;
import com.surework.billing.service.DiscountService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/discounts")
public class DiscountController {

    private final DiscountService discountService;

    public DiscountController(DiscountService discountService) {
        this.discountService = discountService;
    }

    @PostMapping
    public ResponseEntity<DiscountResponse> createDiscount(
            @RequestBody CreateDiscountRequest request,
            @RequestHeader("X-User-Id") UUID userId) {
        DiscountResponse response = discountService.createDiscount(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DiscountResponse> getDiscount(@PathVariable UUID id) {
        return ResponseEntity.ok(discountService.getDiscount(id));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<DiscountResponse> getDiscountByCode(@PathVariable String code) {
        return ResponseEntity.ok(discountService.getDiscountByCode(code));
    }

    @GetMapping
    public ResponseEntity<PagedResponse<DiscountResponse>> listDiscounts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Discount.DiscountStatus status,
            @RequestParam(required = false) Discount.DiscountType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(discountService.listDiscounts(search, status, type, pageable));
    }

    @GetMapping("/active")
    public ResponseEntity<List<DiscountResponse>> getActiveDiscounts() {
        return ResponseEntity.ok(discountService.getActiveDiscounts());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<DiscountResponse> updateDiscount(
            @PathVariable UUID id,
            @RequestBody UpdateDiscountRequest request) {
        return ResponseEntity.ok(discountService.updateDiscount(id, request));
    }

    @PostMapping("/apply")
    public ResponseEntity<TenantDiscountResponse> applyDiscountToTenant(
            @RequestBody ApplyDiscountRequest request) {
        TenantDiscountResponse response = discountService.applyDiscountToTenant(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<TenantDiscountResponse>> getTenantDiscounts(@PathVariable UUID tenantId) {
        return ResponseEntity.ok(discountService.getTenantDiscounts(tenantId));
    }

    @DeleteMapping("/tenant/{tenantId}/discount/{discountId}")
    public ResponseEntity<Void> cancelTenantDiscount(
            @PathVariable UUID tenantId,
            @PathVariable UUID discountId) {
        discountService.cancelTenantDiscount(tenantId, discountId);
        return ResponseEntity.noContent().build();
    }
}
