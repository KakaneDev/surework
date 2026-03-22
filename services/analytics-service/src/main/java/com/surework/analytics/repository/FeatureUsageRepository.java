package com.surework.analytics.repository;

import com.surework.analytics.entity.FeatureUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface FeatureUsageRepository extends JpaRepository<FeatureUsage, UUID> {

    @Query("""
        SELECT f.featureCode, COUNT(f), COUNT(DISTINCT f.userId), COUNT(DISTINCT f.tenantId)
        FROM FeatureUsage f
        WHERE f.recordedAt >= :since
        GROUP BY f.featureCode
        ORDER BY COUNT(f) DESC
        """)
    List<Object[]> getFeatureUsageStats(@Param("since") Instant since);

    @Query("""
        SELECT COUNT(f)
        FROM FeatureUsage f
        WHERE f.tenantId = :tenantId AND f.recordedAt >= :since
        """)
    long countByTenantIdSince(@Param("tenantId") UUID tenantId, @Param("since") Instant since);

    List<FeatureUsage> findByTenantIdOrderByRecordedAtDesc(UUID tenantId);
}
