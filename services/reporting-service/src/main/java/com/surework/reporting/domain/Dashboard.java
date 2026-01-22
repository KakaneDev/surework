package com.surework.reporting.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Dashboard configuration for displaying analytics widgets.
 */
@Entity
@Table(name = "dashboards")
public class Dashboard {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "dashboard_type", nullable = false)
    private DashboardType dashboardType;

    // Widget layout configuration (stored as JSON)
    @Column(name = "layout", columnDefinition = "jsonb")
    @Convert(converter = MapToJsonConverter.class)
    private Map<String, Object> layout = new HashMap<>();

    // Individual widgets
    @OneToMany(mappedBy = "dashboard", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    private List<DashboardWidget> widgets = new ArrayList<>();

    // Access control
    @Column(name = "is_default")
    private boolean isDefault = false;

    @Column(name = "is_shared")
    private boolean shared = false;

    @Column(name = "shared_with_roles", columnDefinition = "text[]")
    private List<String> sharedWithRoles = new ArrayList<>();

    // Refresh settings
    @Column(name = "auto_refresh")
    private boolean autoRefresh = false;

    @Column(name = "refresh_interval_seconds")
    private Integer refreshIntervalSeconds = 300; // 5 minutes default

    // Audit
    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Enums
    public enum DashboardType {
        HR_OVERVIEW,
        PAYROLL_SUMMARY,
        LEAVE_MANAGEMENT,
        TIME_ATTENDANCE,
        RECRUITMENT,
        EXECUTIVE,
        DEPARTMENT,
        EMPLOYEE_SELF_SERVICE,
        COMPLIANCE,
        CUSTOM
    }

    // Business methods
    public void addWidget(DashboardWidget widget) {
        widget.setDashboard(this);
        widget.setPosition(this.widgets.size());
        this.widgets.add(widget);
        this.updatedAt = LocalDateTime.now();
    }

    public void removeWidget(UUID widgetId) {
        this.widgets.removeIf(w -> w.getId().equals(widgetId));
        // Reorder positions
        for (int i = 0; i < widgets.size(); i++) {
            widgets.get(i).setPosition(i);
        }
        this.updatedAt = LocalDateTime.now();
    }

    public void reorderWidgets(List<UUID> widgetIds) {
        Map<UUID, Integer> positionMap = new HashMap<>();
        for (int i = 0; i < widgetIds.size(); i++) {
            positionMap.put(widgetIds.get(i), i);
        }
        for (DashboardWidget widget : widgets) {
            Integer newPosition = positionMap.get(widget.getId());
            if (newPosition != null) {
                widget.setPosition(newPosition);
            }
        }
        widgets.sort(Comparator.comparingInt(DashboardWidget::getPosition));
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public DashboardType getDashboardType() { return dashboardType; }
    public void setDashboardType(DashboardType dashboardType) { this.dashboardType = dashboardType; }

    public Map<String, Object> getLayout() { return layout; }
    public void setLayout(Map<String, Object> layout) { this.layout = layout; }

    public List<DashboardWidget> getWidgets() { return widgets; }
    public void setWidgets(List<DashboardWidget> widgets) { this.widgets = widgets; }

    public boolean isDefault() { return isDefault; }
    public void setDefault(boolean aDefault) { isDefault = aDefault; }

    public boolean isShared() { return shared; }
    public void setShared(boolean shared) { this.shared = shared; }

    public List<String> getSharedWithRoles() { return sharedWithRoles; }
    public void setSharedWithRoles(List<String> sharedWithRoles) { this.sharedWithRoles = sharedWithRoles; }

    public boolean isAutoRefresh() { return autoRefresh; }
    public void setAutoRefresh(boolean autoRefresh) { this.autoRefresh = autoRefresh; }

    public Integer getRefreshIntervalSeconds() { return refreshIntervalSeconds; }
    public void setRefreshIntervalSeconds(Integer refreshIntervalSeconds) { this.refreshIntervalSeconds = refreshIntervalSeconds; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
