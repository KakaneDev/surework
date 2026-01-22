package com.surework.common.security.audit;

import com.surework.common.dto.AuditLog;

import java.util.List;
import java.util.UUID;

/**
 * Service interface for audit logging operations.
 * Implements FR-E03: Comprehensive audit logging.
 *
 * Audit logs capture:
 * - User ID (who made the change)
 * - Timestamp (when the change occurred)
 * - Old Value (previous field value)
 * - New Value (new field value)
 * - IP Address (client IP for non-repudiation)
 */
public interface AuditLogService {

    /**
     * Log a field change asynchronously.
     */
    void logFieldChange(
            UUID userId,
            String ipAddress,
            String entityType,
            UUID entityId,
            String fieldName,
            String oldValue,
            String newValue,
            UUID tenantId
    );

    /**
     * Log entity creation asynchronously.
     */
    void logEntityCreated(
            UUID userId,
            String ipAddress,
            String entityType,
            UUID entityId,
            UUID tenantId
    );

    /**
     * Log entity deletion asynchronously.
     */
    void logEntityDeleted(
            UUID userId,
            String ipAddress,
            String entityType,
            UUID entityId,
            UUID tenantId
    );

    /**
     * Query audit logs by entity.
     */
    List<AuditLog> findByEntity(String entityType, UUID entityId);

    /**
     * Query audit logs by user.
     */
    List<AuditLog> findByUser(UUID userId);

    /**
     * Query audit logs with filters.
     */
    List<AuditLog> search(AuditLogSearchCriteria criteria);

    /**
     * Search criteria for audit log queries.
     */
    record AuditLogSearchCriteria(
            UUID tenantId,
            String entityType,
            UUID entityId,
            UUID userId,
            java.time.Instant fromDate,
            java.time.Instant toDate,
            int page,
            int size
    ) {
        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private UUID tenantId;
            private String entityType;
            private UUID entityId;
            private UUID userId;
            private java.time.Instant fromDate;
            private java.time.Instant toDate;
            private int page = 0;
            private int size = 50;

            public Builder tenantId(UUID tenantId) {
                this.tenantId = tenantId;
                return this;
            }

            public Builder entityType(String entityType) {
                this.entityType = entityType;
                return this;
            }

            public Builder entityId(UUID entityId) {
                this.entityId = entityId;
                return this;
            }

            public Builder userId(UUID userId) {
                this.userId = userId;
                return this;
            }

            public Builder fromDate(java.time.Instant fromDate) {
                this.fromDate = fromDate;
                return this;
            }

            public Builder toDate(java.time.Instant toDate) {
                this.toDate = toDate;
                return this;
            }

            public Builder page(int page) {
                this.page = page;
                return this;
            }

            public Builder size(int size) {
                this.size = size;
                return this;
            }

            public AuditLogSearchCriteria build() {
                return new AuditLogSearchCriteria(
                        tenantId, entityType, entityId, userId,
                        fromDate, toDate, page, size
                );
            }
        }
    }
}
