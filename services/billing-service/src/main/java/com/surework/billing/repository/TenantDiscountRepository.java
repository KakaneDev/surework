package com.surework.billing.repository;

import com.surework.billing.entity.TenantDiscount;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantDiscountRepository extends JpaRepository<TenantDiscount, UUID> {

    List<TenantDiscount> findByTenantId(UUID tenantId);

    List<TenantDiscount> findByTenantIdAndStatus(UUID tenantId, TenantDiscount.Status status);

    @Query("SELECT td FROM TenantDiscount td WHERE td.discount.id = :discountId")
    Page<TenantDiscount> findByDiscountId(@Param("discountId") UUID discountId, Pageable pageable);

    @Query("SELECT td FROM TenantDiscount td WHERE td.tenantId = :tenantId AND td.discount.id = :discountId")
    Optional<TenantDiscount> findByTenantIdAndDiscountId(@Param("tenantId") UUID tenantId, @Param("discountId") UUID discountId);

    @Query("SELECT td FROM TenantDiscount td WHERE td.status = 'ACTIVE' AND td.expiresAt IS NOT NULL AND td.expiresAt <= :now")
    List<TenantDiscount> findExpiredActiveDiscounts(@Param("now") Instant now);

    @Query("SELECT td FROM TenantDiscount td JOIN FETCH td.discount WHERE td.tenantId = :tenantId AND td.status = 'ACTIVE'")
    List<TenantDiscount> findActiveTenantDiscountsWithDetails(@Param("tenantId") UUID tenantId);

    @Query("SELECT COUNT(td) FROM TenantDiscount td WHERE td.discount.id = :discountId AND td.status = 'ACTIVE'")
    Long countActiveByDiscountId(@Param("discountId") UUID discountId);

    boolean existsByTenantIdAndDiscountIdAndStatus(UUID tenantId, UUID discountId, TenantDiscount.Status status);
}
