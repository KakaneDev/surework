package com.surework.tenant.repository;

import com.surework.tenant.domain.TenantActivity;
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

/**
 * Repository for tenant activity tracking.
 */
@Repository
public interface TenantActivityRepository extends JpaRepository<TenantActivity, UUID> {

    /**
     * Find activities for a tenant ordered by creation date.
     */
    Page<TenantActivity> findByTenantIdOrderByCreatedAtDesc(UUID tenantId, Pageable pageable);

    /**
     * Find recent activities for a tenant.
     */
    @Query("""
            SELECT ta FROM TenantActivity ta
            WHERE ta.tenantId = :tenantId
            ORDER BY ta.createdAt DESC
            LIMIT :limit
            """)
    List<TenantActivity> findRecentByTenantId(@Param("tenantId") UUID tenantId, @Param("limit") int limit);

    /**
     * Find the last activity of a specific type for a tenant.
     */
    @Query("""
            SELECT ta FROM TenantActivity ta
            WHERE ta.tenantId = :tenantId
            AND ta.activityType = :activityType
            ORDER BY ta.createdAt DESC
            LIMIT 1
            """)
    Optional<TenantActivity> findLastByTenantIdAndType(
            @Param("tenantId") UUID tenantId,
            @Param("activityType") TenantActivity.ActivityType activityType);

    /**
     * Check if tenant has completed a specific activity type.
     */
    @Query("""
            SELECT COUNT(ta) > 0 FROM TenantActivity ta
            WHERE ta.tenantId = :tenantId
            AND ta.activityType = :activityType
            """)
    boolean existsByTenantIdAndActivityType(
            @Param("tenantId") UUID tenantId,
            @Param("activityType") TenantActivity.ActivityType activityType);

    /**
     * Get the latest activity timestamp for a tenant.
     */
    @Query("""
            SELECT MAX(ta.createdAt) FROM TenantActivity ta
            WHERE ta.tenantId = :tenantId
            """)
    Optional<Instant> findLatestActivityTime(@Param("tenantId") UUID tenantId);

    /**
     * Count activities by type for a tenant.
     */
    @Query("""
            SELECT ta.activityType, COUNT(ta) FROM TenantActivity ta
            WHERE ta.tenantId = :tenantId
            GROUP BY ta.activityType
            """)
    List<Object[]> countByActivityType(@Param("tenantId") UUID tenantId);

    /**
     * Find activities within a time range.
     */
    @Query("""
            SELECT ta FROM TenantActivity ta
            WHERE ta.tenantId = :tenantId
            AND ta.createdAt >= :startTime
            AND ta.createdAt < :endTime
            ORDER BY ta.createdAt DESC
            """)
    List<TenantActivity> findByTenantIdAndTimeRange(
            @Param("tenantId") UUID tenantId,
            @Param("startTime") Instant startTime,
            @Param("endTime") Instant endTime);
}
