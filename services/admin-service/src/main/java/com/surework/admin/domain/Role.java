package com.surework.admin.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Role entity for Role-Based Access Control (RBAC).
 */
@Entity
@Table(name = "roles")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id")
    private UUID tenantId;  // NULL for system roles

    @Column(nullable = false)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(length = 500)
    private String description;

    // Role hierarchy
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_role_id")
    private Role parentRole;

    @OneToMany(mappedBy = "parentRole", fetch = FetchType.LAZY)
    private Set<Role> childRoles = new HashSet<>();

    // Permissions
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "role_permissions",
        joinColumns = @JoinColumn(name = "role_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    private Set<Permission> permissions = new HashSet<>();

    // Status
    @Column(nullable = false)
    private boolean active = true;

    // System role flag (cannot be modified by tenants)
    @Column(name = "is_system_role")
    private boolean systemRole = false;

    // Default role for new users
    @Column(name = "is_default")
    private boolean defaultRole = false;

    // Audit
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by")
    private UUID updatedBy;

    // Business Methods
    public void addPermission(Permission permission) {
        this.permissions.add(permission);
        this.updatedAt = LocalDateTime.now();
    }

    public void removePermission(Permission permission) {
        this.permissions.remove(permission);
        this.updatedAt = LocalDateTime.now();
    }

    public boolean hasPermission(String permissionCode) {
        return this.permissions.stream()
                .anyMatch(p -> p.getCode().equals(permissionCode));
    }

    public Set<Permission> getAllPermissions() {
        Set<Permission> allPermissions = new HashSet<>(this.permissions);
        if (this.parentRole != null) {
            allPermissions.addAll(this.parentRole.getAllPermissions());
        }
        return allPermissions;
    }

    public void activate() {
        this.active = true;
        this.updatedAt = LocalDateTime.now();
    }

    public void deactivate() {
        this.active = false;
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Role getParentRole() { return parentRole; }
    public void setParentRole(Role parentRole) { this.parentRole = parentRole; }

    public UUID getParentRoleId() { return parentRole != null ? parentRole.getId() : null; }
    public void setParentRoleId(UUID parentRoleId) {
        // This is a convenience method - actual parent role should be set via setParentRole
        // The service layer should load the Role by ID and call setParentRole
    }

    public Set<Role> getChildRoles() { return childRoles; }
    public void setChildRoles(Set<Role> childRoles) { this.childRoles = childRoles; }

    public Set<Permission> getPermissions() { return permissions; }
    public void setPermissions(Set<Permission> permissions) { this.permissions = permissions; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public boolean isSystemRole() { return systemRole; }
    public void setSystemRole(boolean systemRole) { this.systemRole = systemRole; }

    public boolean isDefaultRole() { return defaultRole; }
    public void setDefaultRole(boolean defaultRole) { this.defaultRole = defaultRole; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public UUID getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(UUID updatedBy) { this.updatedBy = updatedBy; }
}
