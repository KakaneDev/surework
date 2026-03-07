package com.surework.analytics.repository;

import com.surework.analytics.entity.TenantHealthScore;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantHealthScoreRepository extends JpaRepository<TenantHealthScore, UUID> {

    @Query("""
        SELECT h FROM TenantHealthScore h
        WHERE h.tenantId = :tenantId
        ORDER BY h.calculatedAt DESC
        LIMIT 1
        """)
    Optional<TenantHealthScore> findLatestByTenantId(@Param("tenantId") UUID tenantId);

    @Query("""
        SELECT h FROM TenantHealthScore h
        WHERE h.id IN (
            SELECT MAX(h2.id) FROM TenantHealthScore h2 GROUP BY h2.tenantId
        )
        ORDER BY h.score ASC
        """)
    Page<TenantHealthScore> findLatestScores(Pageable pageable);

    @Query("""
        SELECT h FROM TenantHealthScore h
        WHERE h.churnRisk = :risk
        AND h.id IN (
            SELECT MAX(h2.id) FROM TenantHealthScore h2 GROUP BY h2.tenantId
        )
        ORDER BY h.score ASC
        """)
    Page<TenantHealthScore> findLatestScoresByRisk(@Param("risk") TenantHealthScore.ChurnRisk risk, Pageable pageable);

    @Query("""
        SELECT COUNT(DISTINCT h.tenantId) FROM TenantHealthScore h
        WHERE h.churnRisk = :risk
        """)
    long countByChurnRisk(@Param("risk") TenantHealthScore.ChurnRisk risk);
}
