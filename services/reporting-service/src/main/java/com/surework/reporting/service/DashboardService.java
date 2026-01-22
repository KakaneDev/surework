package com.surework.reporting.service;

import com.surework.reporting.domain.Dashboard;
import com.surework.reporting.dto.ReportingDto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service interface for dashboard management.
 */
public interface DashboardService {

    // ==================== Dashboard CRUD ====================

    /**
     * Create a new dashboard.
     */
    DashboardResponse createDashboard(CreateDashboardRequest request, UUID tenantId, UUID userId);

    /**
     * Update a dashboard.
     */
    DashboardResponse updateDashboard(UUID dashboardId, UpdateDashboardRequest request);

    /**
     * Get dashboard by ID.
     */
    Optional<DashboardResponse> getDashboard(UUID dashboardId);

    /**
     * Get default dashboard for tenant.
     */
    Optional<DashboardResponse> getDefaultDashboard(UUID tenantId);

    /**
     * List dashboards for a tenant.
     */
    Page<DashboardListItem> listDashboards(UUID tenantId, Pageable pageable);

    /**
     * Get dashboards accessible to a user.
     */
    List<DashboardListItem> getAccessibleDashboards(UUID tenantId, UUID userId);

    /**
     * Get dashboards by type.
     */
    List<DashboardListItem> getDashboardsByType(UUID tenantId, Dashboard.DashboardType type);

    /**
     * Set dashboard as default.
     */
    DashboardResponse setAsDefault(UUID dashboardId, UUID tenantId);

    /**
     * Duplicate a dashboard.
     */
    DashboardResponse duplicateDashboard(UUID dashboardId, String newName, UUID userId);

    /**
     * Delete a dashboard.
     */
    void deleteDashboard(UUID dashboardId);

    // ==================== Widget Management ====================

    /**
     * Add a widget to a dashboard.
     */
    WidgetResponse addWidget(UUID dashboardId, CreateWidgetRequest request);

    /**
     * Update a widget.
     */
    WidgetResponse updateWidget(UUID widgetId, UpdateWidgetRequest request);

    /**
     * Get widget by ID.
     */
    Optional<WidgetResponse> getWidget(UUID widgetId);

    /**
     * Reorder widgets on a dashboard.
     */
    DashboardResponse reorderWidgets(UUID dashboardId, ReorderWidgetsRequest request);

    /**
     * Remove a widget from a dashboard.
     */
    void removeWidget(UUID dashboardId, UUID widgetId);

    // ==================== Dashboard Templates ====================

    /**
     * Create default HR dashboard.
     */
    DashboardResponse createHRDashboard(UUID tenantId, UUID userId);

    /**
     * Create default Payroll dashboard.
     */
    DashboardResponse createPayrollDashboard(UUID tenantId, UUID userId);

    /**
     * Create default Leave dashboard.
     */
    DashboardResponse createLeaveDashboard(UUID tenantId, UUID userId);

    /**
     * Create default Executive dashboard.
     */
    DashboardResponse createExecutiveDashboard(UUID tenantId, UUID userId);

    /**
     * Create default Recruitment dashboard.
     */
    DashboardResponse createRecruitmentDashboard(UUID tenantId, UUID userId);

    // ==================== Dashboard Sharing ====================

    /**
     * Share a dashboard with roles.
     */
    DashboardResponse shareDashboard(UUID dashboardId, List<String> roles);

    /**
     * Unshare a dashboard.
     */
    DashboardResponse unshareDashboard(UUID dashboardId);
}
