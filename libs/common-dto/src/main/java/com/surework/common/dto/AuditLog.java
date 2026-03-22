package com.surework.common.dto;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Audit log entity for tracking all field changes on Employee and Financial records.
 * Implements FR-E03: Comprehensive audit logging.
 *
 * Captured fields per spec:
 * - User ID (who made the change)
 * - Timestamp (when the change occurred)
 * - Old Value (previous field value)
 * - New Value (new field value)
 * - IP Address (client IP for non-repudiation)
 *
 * Additional fields for compliance:
 * - Entity Type (Employee, JournalEntry, etc.)
 * - Entity ID (which record was changed)
 * - Field Name (which field was modified)
 *
 * Audit logs are immutable (append-only, no updates or deletes).
 */
@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_entity", columnList = "entity_type, entity_id"),
    @Index(name = "idx_audit_user", columnList = "user_id"),
    @Index(name = "idx_audit_timestamp", columnList = "timestamp")
})
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @CreationTimestamp
    @Column(name = "timestamp", nullable = false, updatable = false)
    private Instant timestamp;

    @Column(name = "old_value", columnDefinition = "TEXT", updatable = false)
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT", updatable = false)
    private String newValue;

    @Column(name = "ip_address", length = 45, updatable = false) // IPv6 max length
    private String ipAddress;

    @Column(name = "entity_type", nullable = false, length = 100, updatable = false)
    private String entityType;

    @Column(name = "entity_id", nullable = false, updatable = false)
    private UUID entityId;

    @Column(name = "field_name", nullable = false, length = 100, updatable = false)
    private String fieldName;

    @Column(name = "action", nullable = false, length = 20, updatable = false)
    @Enumerated(EnumType.STRING)
    private AuditAction action;

    @Column(name = "tenant_id", nullable = false, updatable = false)
    private UUID tenantId;

    /**
     * Types of audit actions.
     */
    public enum AuditAction {
        CREATE,
        UPDATE,
        DELETE,
        RESTORE
    }

    /**
     * Create an audit log entry for a field change.
     */
    public static AuditLog fieldChange(
            UUID userId,
            String ipAddress,
            String entityType,
            UUID entityId,
            String fieldName,
            String oldValue,
            String newValue,
            UUID tenantId
    ) {
        return AuditLog.builder()
                .userId(userId)
                .ipAddress(ipAddress)
                .entityType(entityType)
                .entityId(entityId)
                .fieldName(fieldName)
                .oldValue(oldValue)
                .newValue(newValue)
                .action(AuditAction.UPDATE)
                .tenantId(tenantId)
                .build();
    }

    /**
     * Create an audit log entry for entity creation.
     */
    public static AuditLog entityCreated(
            UUID userId,
            String ipAddress,
            String entityType,
            UUID entityId,
            UUID tenantId
    ) {
        return AuditLog.builder()
                .userId(userId)
                .ipAddress(ipAddress)
                .entityType(entityType)
                .entityId(entityId)
                .fieldName("*")
                .newValue("CREATED")
                .action(AuditAction.CREATE)
                .tenantId(tenantId)
                .build();
    }

    /**
     * Create an audit log entry for entity deletion.
     */
    public static AuditLog entityDeleted(
            UUID userId,
            String ipAddress,
            String entityType,
            UUID entityId,
            UUID tenantId
    ) {
        return AuditLog.builder()
                .userId(userId)
                .ipAddress(ipAddress)
                .entityType(entityType)
                .entityId(entityId)
                .fieldName("*")
                .oldValue("DELETED")
                .action(AuditAction.DELETE)
                .tenantId(tenantId)
                .build();
    }
}
