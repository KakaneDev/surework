package com.surework.billing.repository;

import com.surework.billing.entity.Discount;
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
public interface DiscountRepository extends JpaRepository<Discount, UUID> {

    Optional<Discount> findByCode(String code);

    boolean existsByCode(String code);

    Page<Discount> findByStatus(Discount.DiscountStatus status, Pageable pageable);

    @Query("SELECT d FROM Discount d WHERE d.status = :status AND d.validFrom <= :now AND (d.validUntil IS NULL OR d.validUntil > :now)")
    List<Discount> findActiveDiscounts(@Param("status") Discount.DiscountStatus status, @Param("now") Instant now);

    @Query("SELECT d FROM Discount d WHERE d.validUntil IS NOT NULL AND d.validUntil <= :now AND d.status = 'ACTIVE'")
    List<Discount> findExpiredActiveDiscounts(@Param("now") Instant now);

    @Query("SELECT d FROM Discount d WHERE d.maxUses IS NOT NULL AND d.currentUses >= d.maxUses AND d.status = 'ACTIVE'")
    List<Discount> findExhaustedActiveDiscounts();

    @Query("SELECT d FROM Discount d WHERE d.createdBy = :createdBy ORDER BY d.createdAt DESC")
    Page<Discount> findByCreatedBy(@Param("createdBy") UUID createdBy, Pageable pageable);

    @Query("SELECT d FROM Discount d WHERE " +
           "(LOWER(d.code) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:status IS NULL OR d.status = :status) " +
           "AND (:type IS NULL OR d.type = :type)")
    Page<Discount> searchDiscounts(
            @Param("search") String search,
            @Param("status") Discount.DiscountStatus status,
            @Param("type") Discount.DiscountType type,
            Pageable pageable);
}
