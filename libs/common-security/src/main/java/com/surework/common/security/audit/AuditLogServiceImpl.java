package com.surework.common.security.audit;

import com.surework.common.dto.AuditLog;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Implementation of AuditLogService with async processing.
 * Implements FR-E03: Comprehensive audit logging.
 *
 * Uses async processing to minimize performance impact on main operations.
 * Only loaded if AuditLogRepository bean is available.
 */
@Service
@ConditionalOnBean(AuditLogRepository.class)
public class AuditLogServiceImpl implements AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogServiceImpl.class);

    private final AuditLogRepository auditLogRepository;

    public AuditLogServiceImpl(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    @Async("auditLogExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logFieldChange(
            UUID userId,
            String ipAddress,
            String entityType,
            UUID entityId,
            String fieldName,
            String oldValue,
            String newValue,
            UUID tenantId
    ) {
        try {
            AuditLog auditLog = AuditLog.fieldChange(
                    userId, ipAddress, entityType, entityId,
                    fieldName, oldValue, newValue, tenantId
            );
            auditLogRepository.save(auditLog);
            log.debug("Audit log created for {}.{} field change on entity {}",
                    entityType, fieldName, entityId);
        } catch (Exception ex) {
            log.error("Failed to create audit log for field change: {}", ex.getMessage(), ex);
            // Don't rethrow - audit logging should not fail the main operation
        }
    }

    @Override
    @Async("auditLogExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logEntityCreated(
            UUID userId,
            String ipAddress,
            String entityType,
            UUID entityId,
            UUID tenantId
    ) {
        try {
            AuditLog auditLog = AuditLog.entityCreated(
                    userId, ipAddress, entityType, entityId, tenantId
            );
            auditLogRepository.save(auditLog);
            log.debug("Audit log created for {} creation: {}", entityType, entityId);
        } catch (Exception ex) {
            log.error("Failed to create audit log for entity creation: {}", ex.getMessage(), ex);
        }
    }

    @Override
    @Async("auditLogExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logEntityDeleted(
            UUID userId,
            String ipAddress,
            String entityType,
            UUID entityId,
            UUID tenantId
    ) {
        try {
            AuditLog auditLog = AuditLog.entityDeleted(
                    userId, ipAddress, entityType, entityId, tenantId
            );
            auditLogRepository.save(auditLog);
            log.debug("Audit log created for {} deletion: {}", entityType, entityId);
        } catch (Exception ex) {
            log.error("Failed to create audit log for entity deletion: {}", ex.getMessage(), ex);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLog> findByEntity(String entityType, UUID entityId) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLog> findByUser(UUID userId) {
        return auditLogRepository.findByUserIdOrderByTimestampDesc(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLog> search(AuditLogSearchCriteria criteria) {
        return auditLogRepository.search(
                criteria.tenantId(),
                criteria.entityType(),
                criteria.entityId(),
                criteria.userId(),
                criteria.fromDate(),
                criteria.toDate(),
                criteria.page(),
                criteria.size()
        );
    }
}
