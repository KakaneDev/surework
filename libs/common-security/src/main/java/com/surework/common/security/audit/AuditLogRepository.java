package com.surework.common.security.audit;

import com.surework.common.dto.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Repository for audit log queries.
 * Implements FR-E03: Audit log query/retrieval for compliance officers.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    List<AuditLog> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, UUID entityId);

    List<AuditLog> findByUserIdOrderByTimestampDesc(UUID userId);

    @Query("""
        SELECT a FROM AuditLog a
        WHERE (:tenantId IS NULL OR a.tenantId = :tenantId)
        AND (:entityType IS NULL OR a.entityType = :entityType)
        AND (:entityId IS NULL OR a.entityId = :entityId)
        AND (:userId IS NULL OR a.userId = :userId)
        AND (:fromDate IS NULL OR a.timestamp >= :fromDate)
        AND (:toDate IS NULL OR a.timestamp <= :toDate)
        ORDER BY a.timestamp DESC
        LIMIT :size OFFSET :offset
        """)
    List<AuditLog> search(
            @Param("tenantId") UUID tenantId,
            @Param("entityType") String entityType,
            @Param("entityId") UUID entityId,
            @Param("userId") UUID userId,
            @Param("fromDate") Instant fromDate,
            @Param("toDate") Instant toDate,
            @Param("offset") int offset,
            @Param("size") int size
    );

    default List<AuditLog> search(
            UUID tenantId,
            String entityType,
            UUID entityId,
            UUID userId,
            Instant fromDate,
            Instant toDate,
            int page,
            int size
    ) {
        return search(tenantId, entityType, entityId, userId, fromDate, toDate, page * size, size);
    }
}
