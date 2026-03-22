package com.surework.common.dto;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Base entity with common fields for all SureWork entities.
 * Implements Constitution Principle VII: Database Standards.
 *
 * Features:
 * - UUID primary key (no sequential IDs for security)
 * - Optimistic locking via @Version
 * - Automatic timestamps (createdAt, updatedAt)
 * - Soft delete support (deleted flag)
 */
@MappedSuperclass
@Getter
@Setter
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "deleted", nullable = false)
    private boolean deleted = false;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    /**
     * Soft delete the entity.
     * Sets deleted flag and timestamp without removing from database.
     */
    public void softDelete() {
        this.deleted = true;
        this.deletedAt = Instant.now();
    }

    /**
     * Restore a soft-deleted entity.
     */
    public void restore() {
        this.deleted = false;
        this.deletedAt = null;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BaseEntity that = (BaseEntity) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
