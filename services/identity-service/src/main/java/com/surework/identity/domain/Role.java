package com.surework.identity.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Role entity for RBAC.
 * Implements Constitution Principle V: Security (RBAC).
 */
@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private List<String> permissions;

    @Column(nullable = false)
    private boolean isSystemRole = false;

    @Version
    private Long version = 0L;

    private Instant createdAt;

    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    /**
     * Check if this role has a specific permission.
     */
    public boolean hasPermission(String permission) {
        if (permissions == null) {
            return false;
        }
        // Check for wildcard permission
        if (permissions.contains("*")) {
            return true;
        }
        // Check for exact match
        if (permissions.contains(permission)) {
            return true;
        }
        // Check for domain wildcard (e.g., "hr:*" matches "hr:read")
        String domain = permission.split(":")[0];
        return permissions.contains(domain + ":*");
    }
}
