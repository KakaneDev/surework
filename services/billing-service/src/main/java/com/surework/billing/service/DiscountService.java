package com.surework.billing.service;

import com.surework.billing.dto.BillingDto.*;
import com.surework.billing.entity.Discount;
import com.surework.billing.entity.TenantDiscount;
import com.surework.billing.repository.DiscountRepository;
import com.surework.billing.repository.TenantDiscountRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class DiscountService {

    private static final Logger log = LoggerFactory.getLogger(DiscountService.class);

    private final DiscountRepository discountRepository;
    private final TenantDiscountRepository tenantDiscountRepository;

    public DiscountService(DiscountRepository discountRepository, TenantDiscountRepository tenantDiscountRepository) {
        this.discountRepository = discountRepository;
        this.tenantDiscountRepository = tenantDiscountRepository;
    }

    public DiscountResponse createDiscount(CreateDiscountRequest request, UUID createdBy) {
        if (discountRepository.existsByCode(request.code())) {
            throw new IllegalArgumentException("Discount code already exists: " + request.code());
        }

        Discount discount = new Discount();
        discount.setCode(request.code().toUpperCase());
        discount.setType(request.type());
        discount.setValue(request.value());
        discount.setDurationMonths(request.durationMonths());
        discount.setValidFrom(request.validFrom() != null ? request.validFrom() : Instant.now());
        discount.setValidUntil(request.validUntil());
        discount.setMaxUses(request.maxUses());
        discount.setCurrentUses(0);
        discount.setStatus(Discount.DiscountStatus.ACTIVE);
        discount.setCreatedBy(createdBy);

        discount = discountRepository.save(discount);
        log.info("Created discount: {} by user: {}", discount.getCode(), createdBy);

        return DiscountResponse.from(discount);
    }

    @Transactional(readOnly = true)
    public DiscountResponse getDiscount(UUID id) {
        Discount discount = discountRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Discount not found: " + id));
        return DiscountResponse.from(discount);
    }

    @Transactional(readOnly = true)
    public DiscountResponse getDiscountByCode(String code) {
        Discount discount = discountRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new EntityNotFoundException("Discount not found: " + code));
        return DiscountResponse.from(discount);
    }

    @Transactional(readOnly = true)
    public PagedResponse<DiscountResponse> listDiscounts(String search, Discount.DiscountStatus status,
                                                          Discount.DiscountType type, Pageable pageable) {
        Page<Discount> page;
        if (search != null && !search.isEmpty()) {
            page = discountRepository.searchDiscounts(search, status, type, pageable);
        } else if (status != null) {
            page = discountRepository.findByStatus(status, pageable);
        } else {
            page = discountRepository.findAll(pageable);
        }

        List<DiscountResponse> content = page.getContent().stream()
                .map(DiscountResponse::from)
                .toList();

        return new PagedResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast()
        );
    }

    @Transactional(readOnly = true)
    public List<DiscountResponse> getActiveDiscounts() {
        return discountRepository.findActiveDiscounts(Discount.DiscountStatus.ACTIVE, Instant.now())
                .stream()
                .map(DiscountResponse::from)
                .toList();
    }

    public DiscountResponse updateDiscount(UUID id, UpdateDiscountRequest request) {
        Discount discount = discountRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Discount not found: " + id));

        if (request.status() != null) {
            discount.setStatus(request.status());
        }
        if (request.validUntil() != null) {
            discount.setValidUntil(request.validUntil());
        }
        if (request.maxUses() != null) {
            discount.setMaxUses(request.maxUses());
        }

        discount = discountRepository.save(discount);
        log.info("Updated discount: {}", discount.getCode());

        return DiscountResponse.from(discount);
    }

    public TenantDiscountResponse applyDiscountToTenant(ApplyDiscountRequest request) {
        Discount discount = discountRepository.findById(request.discountId())
                .orElseThrow(() -> new EntityNotFoundException("Discount not found: " + request.discountId()));

        // Validate discount is usable
        validateDiscountUsable(discount);

        // Check if tenant already has this discount
        if (tenantDiscountRepository.existsByTenantIdAndDiscountIdAndStatus(
                request.tenantId(), request.discountId(), TenantDiscount.Status.ACTIVE)) {
            throw new IllegalArgumentException("Tenant already has this discount applied");
        }

        // Calculate expiration
        Instant expiresAt = null;
        if (discount.getDurationMonths() != null) {
            expiresAt = Instant.now().plus(discount.getDurationMonths() * 30L, ChronoUnit.DAYS);
        }

        // Create tenant discount
        TenantDiscount tenantDiscount = new TenantDiscount();
        tenantDiscount.setTenantId(request.tenantId());
        tenantDiscount.setDiscount(discount);
        tenantDiscount.setAppliedAt(Instant.now());
        tenantDiscount.setExpiresAt(expiresAt);
        tenantDiscount.setStatus(TenantDiscount.Status.ACTIVE);

        tenantDiscount = tenantDiscountRepository.save(tenantDiscount);

        // Increment usage
        discount.setCurrentUses(discount.getCurrentUses() + 1);
        if (discount.getMaxUses() != null && discount.getCurrentUses() >= discount.getMaxUses()) {
            discount.setStatus(Discount.DiscountStatus.EXHAUSTED);
        }
        discountRepository.save(discount);

        log.info("Applied discount {} to tenant {}", discount.getCode(), request.tenantId());

        return TenantDiscountResponse.from(tenantDiscount);
    }

    @Transactional(readOnly = true)
    public List<TenantDiscountResponse> getTenantDiscounts(UUID tenantId) {
        return tenantDiscountRepository.findActiveTenantDiscountsWithDetails(tenantId)
                .stream()
                .map(TenantDiscountResponse::from)
                .toList();
    }

    public void cancelTenantDiscount(UUID tenantId, UUID discountId) {
        TenantDiscount tenantDiscount = tenantDiscountRepository
                .findByTenantIdAndDiscountId(tenantId, discountId)
                .orElseThrow(() -> new EntityNotFoundException("Tenant discount not found"));

        tenantDiscount.setStatus(TenantDiscount.Status.CANCELLED);
        tenantDiscountRepository.save(tenantDiscount);

        log.info("Cancelled discount {} for tenant {}", discountId, tenantId);
    }

    private void validateDiscountUsable(Discount discount) {
        Instant now = Instant.now();

        if (discount.getStatus() != Discount.DiscountStatus.ACTIVE) {
            throw new IllegalArgumentException("Discount is not active");
        }

        if (discount.getValidFrom().isAfter(now)) {
            throw new IllegalArgumentException("Discount is not yet valid");
        }

        if (discount.getValidUntil() != null && discount.getValidUntil().isBefore(now)) {
            throw new IllegalArgumentException("Discount has expired");
        }

        if (discount.getMaxUses() != null && discount.getCurrentUses() >= discount.getMaxUses()) {
            throw new IllegalArgumentException("Discount has reached maximum uses");
        }
    }

    // Scheduled job to expire discounts
    @Scheduled(cron = "0 0 * * * *") // Every hour
    public void expireDiscounts() {
        Instant now = Instant.now();

        // Expire discount codes
        List<Discount> expiredDiscounts = discountRepository.findExpiredActiveDiscounts(now);
        for (Discount discount : expiredDiscounts) {
            discount.setStatus(Discount.DiscountStatus.EXPIRED);
            discountRepository.save(discount);
            log.info("Expired discount: {}", discount.getCode());
        }

        // Expire tenant discounts
        List<TenantDiscount> expiredTenantDiscounts = tenantDiscountRepository.findExpiredActiveDiscounts(now);
        for (TenantDiscount td : expiredTenantDiscounts) {
            td.setStatus(TenantDiscount.Status.EXPIRED);
            tenantDiscountRepository.save(td);
            log.info("Expired tenant discount: {} for tenant {}", td.getDiscount().getCode(), td.getTenantId());
        }

        // Mark exhausted discounts
        List<Discount> exhaustedDiscounts = discountRepository.findExhaustedActiveDiscounts();
        for (Discount discount : exhaustedDiscounts) {
            discount.setStatus(Discount.DiscountStatus.EXHAUSTED);
            discountRepository.save(discount);
            log.info("Exhausted discount: {}", discount.getCode());
        }
    }
}
