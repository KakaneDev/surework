package com.surework.admin.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Permission entity for fine-grained access control.
 */
@Entity
@Table(name = "permissions")
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(length = 500)
    private String description;

    // Permission category for grouping
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PermissionCategory category;

    // Resource this permission applies to
    @Column(nullable = false)
    private String resource;

    // Action type
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActionType action;

    // Status
    @Column(nullable = false)
    private boolean active = true;

    // System permission (cannot be deleted)
    @Column(name = "is_system")
    private boolean systemPermission = true;

    // Audit
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Enums
    public enum PermissionCategory {
        SYSTEM,         // System administration
        TENANT,         // Tenant management
        USER,           // User management
        EMPLOYEE,       // Employee management
        LEAVE,          // Leave management
        PAYROLL,        // Payroll operations
        TIME,           // Time & attendance
        RECRUITMENT,    // Recruitment
        DOCUMENT,       // Document management
        REPORT,         // Reporting
        FINANCE,        // Financial operations
        ACCOUNTING      // Accounting
    }

    public enum ActionType {
        CREATE,
        READ,
        UPDATE,
        DELETE,
        APPROVE,
        PROCESS,
        EXPORT,
        IMPORT,
        MANAGE,
        ALL
    }

    // Common permission codes
    public static final String ALL = "ALL";
    public static final String TENANT_ALL = "TENANT_ALL";

    // System permissions
    public static final String SYSTEM_ADMIN = "SYSTEM_ADMIN";
    public static final String TENANT_MANAGE = "TENANT_MANAGE";
    public static final String USER_MANAGE = "USER_MANAGE";
    public static final String ROLE_MANAGE = "ROLE_MANAGE";
    public static final String AUDIT_VIEW = "AUDIT_VIEW";

    // Employee permissions
    public static final String EMPLOYEE_CREATE = "EMPLOYEE_CREATE";
    public static final String EMPLOYEE_READ = "EMPLOYEE_READ";
    public static final String EMPLOYEE_UPDATE = "EMPLOYEE_UPDATE";
    public static final String EMPLOYEE_DELETE = "EMPLOYEE_DELETE";

    // Leave permissions
    public static final String LEAVE_REQUEST = "LEAVE_REQUEST";
    public static final String LEAVE_APPROVE = "LEAVE_APPROVE";
    public static final String LEAVE_MANAGE = "LEAVE_MANAGE";

    // Payroll permissions
    public static final String PAYROLL_READ = "PAYROLL_READ";
    public static final String PAYROLL_WRITE = "PAYROLL_WRITE";
    public static final String PAYROLL_PROCESS = "PAYROLL_PROCESS";
    public static final String PAYROLL_APPROVE = "PAYROLL_APPROVE";

    // Time permissions
    public static final String TIME_ENTRY = "TIME_ENTRY";
    public static final String TIME_APPROVE = "TIME_APPROVE";
    public static final String TIME_MANAGE = "TIME_MANAGE";

    // Self-service permissions
    public static final String SELF_READ = "SELF_READ";
    public static final String SELF_UPDATE = "SELF_UPDATE";

    // Helper methods
    public String getFullCode() {
        return resource.toUpperCase() + "_" + action.name();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public PermissionCategory getCategory() { return category; }
    public void setCategory(PermissionCategory category) { this.category = category; }

    public String getResource() { return resource; }
    public void setResource(String resource) { this.resource = resource; }

    public ActionType getAction() { return action; }
    public void setAction(ActionType action) { this.action = action; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public boolean isSystemPermission() { return systemPermission; }
    public void setSystemPermission(boolean systemPermission) { this.systemPermission = systemPermission; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
