package com.surework.admin.repository;

import com.surework.admin.domain.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    Page<AuditLog> findByTenantIdOrderByTimestampDesc(UUID tenantId, Pageable pageable);

    Page<AuditLog> findByTenantId(UUID tenantId, Pageable pageable);

    Page<AuditLog> findByUserIdOrderByTimestampDesc(UUID userId, Pageable pageable);

    Page<AuditLog> findByUserId(UUID userId, Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.tenantId = :tenantId " +
           "AND (:eventType IS NULL OR a.eventType = :eventType) " +
           "AND (:eventCategory IS NULL OR a.eventCategory = :eventCategory) " +
           "AND (:userId IS NULL OR a.userId = :userId) " +
           "AND (:resourceType IS NULL OR a.resourceType = :resourceType) " +
           "AND (:from IS NULL OR a.timestamp >= :from) " +
           "AND (:to IS NULL OR a.timestamp <= :to) " +
           "ORDER BY a.timestamp DESC")
    Page<AuditLog> searchAuditLogs(
            @Param("tenantId") UUID tenantId,
            @Param("eventType") AuditLog.EventType eventType,
            @Param("eventCategory") AuditLog.EventCategory eventCategory,
            @Param("userId") UUID userId,
            @Param("resourceType") String resourceType,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);

    // Find by resource
    List<AuditLog> findByResourceTypeAndResourceIdOrderByTimestampDesc(String resourceType, String resourceId);

    Page<AuditLog> findByResourceTypeAndResourceIdOrderByTimestampDesc(
            String resourceType, String resourceId, Pageable pageable);

    Page<AuditLog> findByResourceTypeAndResourceId(String resourceType, String resourceId, Pageable pageable);

    // Count by tenant and time range
    long countByTenantIdAndTimestampBetween(UUID tenantId, LocalDateTime from, LocalDateTime to);

    // Find failed events
    Page<AuditLog> findByTenantIdAndSuccessFalseOrderByTimestampDesc(UUID tenantId, Pageable pageable);

    // Count by event type
    @Query("SELECT a.eventType, COUNT(a) FROM AuditLog a " +
           "WHERE a.tenantId = :tenantId AND a.timestamp >= :since " +
           "GROUP BY a.eventType")
    List<Object[]> countByEventType(@Param("tenantId") UUID tenantId, @Param("since") LocalDateTime since);

    // Count login attempts
    @Query("SELECT COUNT(a) FROM AuditLog a " +
           "WHERE a.userId = :userId AND a.eventType = 'LOGIN_FAILURE' " +
           "AND a.timestamp >= :since")
    long countRecentLoginFailures(@Param("userId") UUID userId, @Param("since") LocalDateTime since);

    // Delete old logs
    @Modifying
    @Query("DELETE FROM AuditLog a WHERE a.timestamp < :before")
    int deleteOldLogs(@Param("before") LocalDateTime before);
}
