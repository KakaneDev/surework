package com.surework.reporting.service;

import com.surework.reporting.domain.Dashboard;
import com.surework.reporting.domain.DashboardWidget;
import com.surework.reporting.dto.ReportingDto.*;
import com.surework.reporting.repository.DashboardRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of DashboardService.
 */
@Service
@Transactional
public class DashboardServiceImpl implements DashboardService {

    private final DashboardRepository dashboardRepository;

    public DashboardServiceImpl(DashboardRepository dashboardRepository) {
        this.dashboardRepository = dashboardRepository;
    }

    @Override
    public DashboardResponse createDashboard(CreateDashboardRequest request, UUID tenantId, UUID userId) {
        Dashboard dashboard = new Dashboard();
        dashboard.setTenantId(tenantId);
        dashboard.setName(request.name());
        dashboard.setDescription(request.description());
        dashboard.setDashboardType(request.dashboardType());
        dashboard.setLayout(request.layout() != null ? request.layout() : new HashMap<>());
        dashboard.setDefault(request.isDefault());
        dashboard.setShared(request.shared());
        dashboard.setSharedWithRoles(request.sharedWithRoles() != null ? request.sharedWithRoles() : new ArrayList<>());
        dashboard.setAutoRefresh(request.autoRefresh());
        dashboard.setRefreshIntervalSeconds(request.refreshIntervalSeconds() != null ? request.refreshIntervalSeconds() : 300);
        dashboard.setCreatedBy(userId);

        // If set as default, unset other defaults
        if (request.isDefault()) {
            dashboardRepository.findByTenantIdAndIsDefaultTrue(tenantId)
                    .ifPresent(d -> {
                        d.setDefault(false);
                        dashboardRepository.save(d);
                    });
        }

        dashboard = dashboardRepository.save(dashboard);
        return toDashboardResponse(dashboard);
    }

    @Override
    public DashboardResponse updateDashboard(UUID dashboardId, UpdateDashboardRequest request) {
        Dashboard dashboard = dashboardRepository.findById(dashboardId)
                .orElseThrow(() -> new IllegalArgumentException("Dashboard not found"));

        if (request.name() != null) dashboard.setName(request.name());
        if (request.description() != null) dashboard.setDescription(request.description());
        if (request.layout() != null) dashboard.setLayout(request.layout());
        if (request.shared() != null) dashboard.setShared(request.shared());
        if (request.sharedWithRoles() != null) dashboard.setSharedWithRoles(request.sharedWithRoles());
        if (request.autoRefresh() != null) dashboard.setAutoRefresh(request.autoRefresh());
        if (request.refreshIntervalSeconds() != null) dashboard.setRefreshIntervalSeconds(request.refreshIntervalSeconds());

        if (request.isDefault() != null && request.isDefault() && !dashboard.isDefault()) {
            dashboardRepository.findByTenantIdAndIsDefaultTrue(dashboard.getTenantId())
                    .ifPresent(d -> {
                        d.setDefault(false);
                        dashboardRepository.save(d);
                    });
            dashboard.setDefault(true);
        }

        dashboard.setUpdatedAt(LocalDateTime.now());
        dashboard = dashboardRepository.save(dashboard);
        return toDashboardResponse(dashboard);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DashboardResponse> getDashboard(UUID dashboardId) {
        return dashboardRepository.findById(dashboardId).map(this::toDashboardResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DashboardResponse> getDefaultDashboard(UUID tenantId) {
        return dashboardRepository.findByTenantIdAndIsDefaultTrue(tenantId).map(this::toDashboardResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DashboardListItem> listDashboards(UUID tenantId, Pageable pageable) {
        return dashboardRepository.findByTenantId(tenantId, pageable).map(this::toDashboardListItem);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DashboardListItem> getAccessibleDashboards(UUID tenantId, UUID userId) {
        return dashboardRepository.findAccessibleDashboards(tenantId, userId).stream()
                .map(this::toDashboardListItem)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DashboardListItem> getDashboardsByType(UUID tenantId, Dashboard.DashboardType type) {
        return dashboardRepository.findByTenantIdAndDashboardType(tenantId, type).stream()
                .map(this::toDashboardListItem)
                .collect(Collectors.toList());
    }

    @Override
    public DashboardResponse setAsDefault(UUID dashboardId, UUID tenantId) {
        // Unset current default
        dashboardRepository.findByTenantIdAndIsDefaultTrue(tenantId)
                .ifPresent(d -> {
                    d.setDefault(false);
                    dashboardRepository.save(d);
                });

        // Set new default
        Dashboard dashboard = dashboardRepository.findById(dashboardId)
                .orElseThrow(() -> new IllegalArgumentException("Dashboard not found"));
        dashboard.setDefault(true);
        dashboard.setUpdatedAt(LocalDateTime.now());
        dashboard = dashboardRepository.save(dashboard);

        return toDashboardResponse(dashboard);
    }

    @Override
    public DashboardResponse duplicateDashboard(UUID dashboardId, String newName, UUID userId) {
        Dashboard original = dashboardRepository.findById(dashboardId)
                .orElseThrow(() -> new IllegalArgumentException("Dashboard not found"));

        Dashboard duplicate = new Dashboard();
        duplicate.setTenantId(original.getTenantId());
        duplicate.setName(newName);
        duplicate.setDescription(original.getDescription());
        duplicate.setDashboardType(original.getDashboardType());
        duplicate.setLayout(new HashMap<>(original.getLayout()));
        duplicate.setDefault(false);
        duplicate.setShared(false);
        duplicate.setAutoRefresh(original.isAutoRefresh());
        duplicate.setRefreshIntervalSeconds(original.getRefreshIntervalSeconds());
        duplicate.setCreatedBy(userId);

        duplicate = dashboardRepository.save(duplicate);

        // Duplicate widgets
        for (DashboardWidget widget : original.getWidgets()) {
            DashboardWidget newWidget = new DashboardWidget();
            newWidget.setDashboard(duplicate);
            newWidget.setTitle(widget.getTitle());
            newWidget.setDescription(widget.getDescription());
            newWidget.setWidgetType(widget.getWidgetType());
            newWidget.setDataSource(widget.getDataSource());
            newWidget.setConfig(new HashMap<>(widget.getConfig()));
            newWidget.setPosition(widget.getPosition());
            newWidget.setGridX(widget.getGridX());
            newWidget.setGridY(widget.getGridY());
            newWidget.setGridWidth(widget.getGridWidth());
            newWidget.setGridHeight(widget.getGridHeight());
            newWidget.setFilters(new HashMap<>(widget.getFilters()));
            newWidget.setCacheTtlSeconds(widget.getCacheTtlSeconds());
            newWidget.setShowTitle(widget.isShowTitle());
            newWidget.setShowBorder(widget.isShowBorder());
            newWidget.setBackgroundColor(widget.getBackgroundColor());
            newWidget.setTextColor(widget.getTextColor());
            duplicate.getWidgets().add(newWidget);
        }

        duplicate = dashboardRepository.save(duplicate);
        return toDashboardResponse(duplicate);
    }

    @Override
    public void deleteDashboard(UUID dashboardId) {
        dashboardRepository.deleteById(dashboardId);
    }

    // ==================== Widget Management ====================

    @Override
    public WidgetResponse addWidget(UUID dashboardId, CreateWidgetRequest request) {
        Dashboard dashboard = dashboardRepository.findById(dashboardId)
                .orElseThrow(() -> new IllegalArgumentException("Dashboard not found"));

        DashboardWidget widget = new DashboardWidget();
        widget.setTitle(request.title());
        widget.setDescription(request.description());
        widget.setWidgetType(request.widgetType());
        widget.setDataSource(request.dataSource());
        widget.setConfig(request.config() != null ? request.config() :
                DashboardWidget.getDefaultConfig(request.widgetType()));
        widget.setGridX(request.gridX() != null ? request.gridX() : 0);
        widget.setGridY(request.gridY() != null ? request.gridY() : 0);
        widget.setGridWidth(request.gridWidth() != null ? request.gridWidth() : 4);
        widget.setGridHeight(request.gridHeight() != null ? request.gridHeight() : 3);
        widget.setFilters(request.filters() != null ? request.filters() : new HashMap<>());
        widget.setCacheTtlSeconds(request.cacheTtlSeconds() != null ? request.cacheTtlSeconds() : 300);

        dashboard.addWidget(widget);
        dashboard = dashboardRepository.save(dashboard);

        // Find the just-added widget
        DashboardWidget addedWidget = dashboard.getWidgets().get(dashboard.getWidgets().size() - 1);
        return toWidgetResponse(addedWidget);
    }

    @Override
    public WidgetResponse updateWidget(UUID widgetId, UpdateWidgetRequest request) {
        // Find widget through dashboard (due to JPA relationship)
        Dashboard dashboard = dashboardRepository.findAll().stream()
                .filter(d -> d.getWidgets().stream().anyMatch(w -> w.getId().equals(widgetId)))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Widget not found"));

        DashboardWidget widget = dashboard.getWidgets().stream()
                .filter(w -> w.getId().equals(widgetId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Widget not found"));

        if (request.title() != null) widget.setTitle(request.title());
        if (request.description() != null) widget.setDescription(request.description());
        if (request.config() != null) widget.setConfig(request.config());
        if (request.gridX() != null) widget.setGridX(request.gridX());
        if (request.gridY() != null) widget.setGridY(request.gridY());
        if (request.gridWidth() != null) widget.setGridWidth(request.gridWidth());
        if (request.gridHeight() != null) widget.setGridHeight(request.gridHeight());
        if (request.filters() != null) widget.setFilters(request.filters());
        if (request.cacheTtlSeconds() != null) widget.setCacheTtlSeconds(request.cacheTtlSeconds());
        if (request.showTitle() != null) widget.setShowTitle(request.showTitle());
        if (request.showBorder() != null) widget.setShowBorder(request.showBorder());
        if (request.backgroundColor() != null) widget.setBackgroundColor(request.backgroundColor());
        if (request.textColor() != null) widget.setTextColor(request.textColor());

        widget.setUpdatedAt(LocalDateTime.now());
        dashboard.setUpdatedAt(LocalDateTime.now());
        dashboardRepository.save(dashboard);

        return toWidgetResponse(widget);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<WidgetResponse> getWidget(UUID widgetId) {
        return dashboardRepository.findAll().stream()
                .flatMap(d -> d.getWidgets().stream())
                .filter(w -> w.getId().equals(widgetId))
                .findFirst()
                .map(this::toWidgetResponse);
    }

    @Override
    public DashboardResponse reorderWidgets(UUID dashboardId, ReorderWidgetsRequest request) {
        Dashboard dashboard = dashboardRepository.findById(dashboardId)
                .orElseThrow(() -> new IllegalArgumentException("Dashboard not found"));

        dashboard.reorderWidgets(request.widgetIds());
        dashboard = dashboardRepository.save(dashboard);
        return toDashboardResponse(dashboard);
    }

    @Override
    public void removeWidget(UUID dashboardId, UUID widgetId) {
        Dashboard dashboard = dashboardRepository.findById(dashboardId)
                .orElseThrow(() -> new IllegalArgumentException("Dashboard not found"));

        dashboard.removeWidget(widgetId);
        dashboardRepository.save(dashboard);
    }

    // ==================== Dashboard Templates ====================

    @Override
    public DashboardResponse createHRDashboard(UUID tenantId, UUID userId) {
        CreateDashboardRequest request = new CreateDashboardRequest(
                "HR Overview Dashboard",
                "Comprehensive HR metrics and analytics",
                Dashboard.DashboardType.HR_OVERVIEW,
                Map.of("columns", 12, "rowHeight", 100),
                false, true, List.of("HR_MANAGER", "HR_ADMIN"),
                true, 300
        );

        Dashboard dashboard = createDashboardEntity(request, tenantId, userId);

        // Add HR-specific widgets
        addWidgetToDashboard(dashboard, "Total Headcount", DashboardWidget.WidgetType.METRIC_CARD,
                DashboardWidget.DataSource.HEADCOUNT, 0, 0, 3, 2);
        addWidgetToDashboard(dashboard, "Turnover Rate", DashboardWidget.WidgetType.GAUGE,
                DashboardWidget.DataSource.TURNOVER_RATE, 3, 0, 3, 2);
        addWidgetToDashboard(dashboard, "New Hires This Month", DashboardWidget.WidgetType.METRIC_CARD,
                DashboardWidget.DataSource.NEW_HIRES, 6, 0, 3, 2);
        addWidgetToDashboard(dashboard, "Open Positions", DashboardWidget.WidgetType.METRIC_CARD,
                DashboardWidget.DataSource.OPEN_POSITIONS, 9, 0, 3, 2);

        addWidgetToDashboard(dashboard, "Headcount by Department", DashboardWidget.WidgetType.BAR_CHART,
                DashboardWidget.DataSource.DEMOGRAPHICS_DEPARTMENT, 0, 2, 6, 4);
        addWidgetToDashboard(dashboard, "Gender Distribution", DashboardWidget.WidgetType.PIE_CHART,
                DashboardWidget.DataSource.DEMOGRAPHICS_GENDER, 6, 2, 3, 4);
        addWidgetToDashboard(dashboard, "Age Distribution", DashboardWidget.WidgetType.PIE_CHART,
                DashboardWidget.DataSource.DEMOGRAPHICS_AGE, 9, 2, 3, 4);

        addWidgetToDashboard(dashboard, "Headcount Trend", DashboardWidget.WidgetType.LINE_CHART,
                DashboardWidget.DataSource.HEADCOUNT, 0, 6, 12, 4);

        dashboard = dashboardRepository.save(dashboard);
        return toDashboardResponse(dashboard);
    }

    @Override
    public DashboardResponse createPayrollDashboard(UUID tenantId, UUID userId) {
        CreateDashboardRequest request = new CreateDashboardRequest(
                "Payroll Dashboard",
                "Payroll costs and statutory deductions overview",
                Dashboard.DashboardType.PAYROLL_SUMMARY,
                Map.of("columns", 12, "rowHeight", 100),
                false, true, List.of("PAYROLL_ADMIN", "FINANCE_MANAGER"),
                true, 300
        );

        Dashboard dashboard = createDashboardEntity(request, tenantId, userId);

        // Add Payroll-specific widgets
        addWidgetToDashboard(dashboard, "Total Payroll Cost", DashboardWidget.WidgetType.METRIC_CARD,
                DashboardWidget.DataSource.PAYROLL_COST, 0, 0, 3, 2);
        addWidgetToDashboard(dashboard, "Average Salary", DashboardWidget.WidgetType.METRIC_CARD,
                DashboardWidget.DataSource.AVERAGE_SALARY, 3, 0, 3, 2);
        addWidgetToDashboard(dashboard, "Overtime Cost", DashboardWidget.WidgetType.METRIC_CARD,
                DashboardWidget.DataSource.OVERTIME_COST, 6, 0, 3, 2);
        addWidgetToDashboard(dashboard, "Cost to Company", DashboardWidget.WidgetType.METRIC_CARD,
                DashboardWidget.DataSource.COST_TO_COMPANY, 9, 0, 3, 2);

        addWidgetToDashboard(dashboard, "Payroll by Department", DashboardWidget.WidgetType.BAR_CHART,
                DashboardWidget.DataSource.PAYROLL_COST_BY_DEPT, 0, 2, 6, 4);
        addWidgetToDashboard(dashboard, "Statutory Deductions", DashboardWidget.WidgetType.PIE_CHART,
                DashboardWidget.DataSource.STATUTORY_DEDUCTIONS, 6, 2, 6, 4);

        addWidgetToDashboard(dashboard, "Payroll Cost Trend", DashboardWidget.WidgetType.AREA_CHART,
                DashboardWidget.DataSource.LABOR_COST_TREND, 0, 6, 12, 4);

        dashboard = dashboardRepository.save(dashboard);
        return toDashboardResponse(dashboard);
    }

    @Override
    public DashboardResponse createLeaveDashboard(UUID tenantId, UUID userId) {
        CreateDashboardRequest request = new CreateDashboardRequest(
                "Leave Management Dashboard",
                "Leave balances and utilization analytics",
                Dashboard.DashboardType.LEAVE_MANAGEMENT,
                Map.of("columns", 12, "rowHeight", 100),
                false, true, List.of("HR_MANAGER", "DEPARTMENT_MANAGER"),
                true, 300
        );

        Dashboard dashboard = createDashboardEntity(request, tenantId, userId);

        addWidgetToDashboard(dashboard, "Pending Requests", DashboardWidget.WidgetType.METRIC_CARD,
                DashboardWidget.DataSource.LEAVE_REQUESTS_PENDING, 0, 0, 3, 2);
        addWidgetToDashboard(dashboard, "Absence Rate", DashboardWidget.WidgetType.GAUGE,
                DashboardWidget.DataSource.ABSENCE_RATE, 3, 0, 3, 2);
        addWidgetToDashboard(dashboard, "Average Leave Balance", DashboardWidget.WidgetType.METRIC_CARD,
                DashboardWidget.DataSource.LEAVE_BALANCE, 6, 0, 3, 2);

        addWidgetToDashboard(dashboard, "Leave by Type", DashboardWidget.WidgetType.DONUT_CHART,
                DashboardWidget.DataSource.LEAVE_UTILIZATION, 0, 2, 6, 4);
        addWidgetToDashboard(dashboard, "Sick Leave Trend", DashboardWidget.WidgetType.LINE_CHART,
                DashboardWidget.DataSource.SICK_LEAVE_TREND, 6, 2, 6, 4);

        dashboard = dashboardRepository.save(dashboard);
        return toDashboardResponse(dashboard);
    }

    @Override
    public DashboardResponse createExecutiveDashboard(UUID tenantId, UUID userId) {
        CreateDashboardRequest request = new CreateDashboardRequest(
                "Executive Dashboard",
                "High-level business metrics for executives",
                Dashboard.DashboardType.EXECUTIVE,
                Map.of("columns", 12, "rowHeight", 100),
                true, true, List.of("EXECUTIVE", "CEO", "CFO"),
                true, 300
        );

        Dashboard dashboard = createDashboardEntity(request, tenantId, userId);

        // Key metrics row
        addWidgetToDashboard(dashboard, "Total Headcount", DashboardWidget.WidgetType.METRIC_CARD,
                DashboardWidget.DataSource.HEADCOUNT, 0, 0, 3, 2);
        addWidgetToDashboard(dashboard, "Payroll Cost", DashboardWidget.WidgetType.METRIC_CARD,
                DashboardWidget.DataSource.PAYROLL_COST, 3, 0, 3, 2);
        addWidgetToDashboard(dashboard, "Turnover Rate", DashboardWidget.WidgetType.METRIC_CARD,
                DashboardWidget.DataSource.TURNOVER_RATE, 6, 0, 3, 2);
        addWidgetToDashboard(dashboard, "Compliance Score", DashboardWidget.WidgetType.GAUGE,
                DashboardWidget.DataSource.COMPLIANCE_SCORE, 9, 0, 3, 2);

        // Charts
        addWidgetToDashboard(dashboard, "Labor Cost Trend", DashboardWidget.WidgetType.AREA_CHART,
                DashboardWidget.DataSource.LABOR_COST_TREND, 0, 2, 6, 4);
        addWidgetToDashboard(dashboard, "Headcount by Department", DashboardWidget.WidgetType.BAR_CHART,
                DashboardWidget.DataSource.DEMOGRAPHICS_DEPARTMENT, 6, 2, 6, 4);

        // Alerts
        addWidgetToDashboard(dashboard, "Alerts & Notifications", DashboardWidget.WidgetType.ALERT_LIST,
                DashboardWidget.DataSource.ALERTS_NOTIFICATIONS, 0, 6, 6, 4);
        addWidgetToDashboard(dashboard, "Upcoming Events", DashboardWidget.WidgetType.SCROLLING_LIST,
                DashboardWidget.DataSource.RECENT_ACTIVITIES, 6, 6, 6, 4);

        dashboard = dashboardRepository.save(dashboard);
        return toDashboardResponse(dashboard);
    }

    @Override
    public DashboardResponse createRecruitmentDashboard(UUID tenantId, UUID userId) {
        CreateDashboardRequest request = new CreateDashboardRequest(
                "Recruitment Dashboard",
                "Recruitment pipeline and hiring metrics",
                Dashboard.DashboardType.RECRUITMENT,
                Map.of("columns", 12, "rowHeight", 100),
                false, true, List.of("RECRUITER", "HR_MANAGER"),
                true, 300
        );

        Dashboard dashboard = createDashboardEntity(request, tenantId, userId);

        addWidgetToDashboard(dashboard, "Open Positions", DashboardWidget.WidgetType.METRIC_CARD,
                DashboardWidget.DataSource.OPEN_POSITIONS, 0, 0, 3, 2);
        addWidgetToDashboard(dashboard, "Applications", DashboardWidget.WidgetType.METRIC_CARD,
                DashboardWidget.DataSource.APPLICATIONS_RECEIVED, 3, 0, 3, 2);
        addWidgetToDashboard(dashboard, "Time to Hire", DashboardWidget.WidgetType.METRIC_CARD,
                DashboardWidget.DataSource.TIME_TO_HIRE, 6, 0, 3, 2);
        addWidgetToDashboard(dashboard, "Offer Acceptance", DashboardWidget.WidgetType.GAUGE,
                DashboardWidget.DataSource.OFFER_ACCEPTANCE_RATE, 9, 0, 3, 2);

        addWidgetToDashboard(dashboard, "Recruitment Pipeline", DashboardWidget.WidgetType.STACKED_BAR,
                DashboardWidget.DataSource.RECRUITMENT_PIPELINE, 0, 2, 8, 4);
        addWidgetToDashboard(dashboard, "Source Breakdown", DashboardWidget.WidgetType.PIE_CHART,
                DashboardWidget.DataSource.SOURCE_BREAKDOWN, 8, 2, 4, 4);

        dashboard = dashboardRepository.save(dashboard);
        return toDashboardResponse(dashboard);
    }

    private Dashboard createDashboardEntity(CreateDashboardRequest request, UUID tenantId, UUID userId) {
        Dashboard dashboard = new Dashboard();
        dashboard.setTenantId(tenantId);
        dashboard.setName(request.name());
        dashboard.setDescription(request.description());
        dashboard.setDashboardType(request.dashboardType());
        dashboard.setLayout(request.layout() != null ? request.layout() : new HashMap<>());
        dashboard.setDefault(request.isDefault());
        dashboard.setShared(request.shared());
        dashboard.setSharedWithRoles(request.sharedWithRoles() != null ? request.sharedWithRoles() : new ArrayList<>());
        dashboard.setAutoRefresh(request.autoRefresh());
        dashboard.setRefreshIntervalSeconds(request.refreshIntervalSeconds() != null ? request.refreshIntervalSeconds() : 300);
        dashboard.setCreatedBy(userId);
        return dashboard;
    }

    private void addWidgetToDashboard(Dashboard dashboard, String title, DashboardWidget.WidgetType type,
                                      DashboardWidget.DataSource dataSource, int x, int y, int width, int height) {
        DashboardWidget widget = new DashboardWidget();
        widget.setDashboard(dashboard);
        widget.setTitle(title);
        widget.setWidgetType(type);
        widget.setDataSource(dataSource);
        widget.setConfig(DashboardWidget.getDefaultConfig(type));
        widget.setPosition(dashboard.getWidgets().size());
        widget.setGridX(x);
        widget.setGridY(y);
        widget.setGridWidth(width);
        widget.setGridHeight(height);
        dashboard.getWidgets().add(widget);
    }

    @Override
    public DashboardResponse shareDashboard(UUID dashboardId, List<String> roles) {
        Dashboard dashboard = dashboardRepository.findById(dashboardId)
                .orElseThrow(() -> new IllegalArgumentException("Dashboard not found"));

        dashboard.setShared(true);
        dashboard.setSharedWithRoles(roles);
        dashboard.setUpdatedAt(LocalDateTime.now());
        dashboard = dashboardRepository.save(dashboard);

        return toDashboardResponse(dashboard);
    }

    @Override
    public DashboardResponse unshareDashboard(UUID dashboardId) {
        Dashboard dashboard = dashboardRepository.findById(dashboardId)
                .orElseThrow(() -> new IllegalArgumentException("Dashboard not found"));

        dashboard.setShared(false);
        dashboard.setSharedWithRoles(new ArrayList<>());
        dashboard.setUpdatedAt(LocalDateTime.now());
        dashboard = dashboardRepository.save(dashboard);

        return toDashboardResponse(dashboard);
    }

    // ==================== Mapping Methods ====================

    private DashboardResponse toDashboardResponse(Dashboard dashboard) {
        List<WidgetResponse> widgets = dashboard.getWidgets().stream()
                .map(this::toWidgetResponse)
                .collect(Collectors.toList());

        return new DashboardResponse(
                dashboard.getId(),
                dashboard.getName(),
                dashboard.getDescription(),
                dashboard.getDashboardType(),
                dashboard.getLayout(),
                widgets,
                dashboard.isDefault(),
                dashboard.isShared(),
                dashboard.getSharedWithRoles(),
                dashboard.isAutoRefresh(),
                dashboard.getRefreshIntervalSeconds(),
                dashboard.getCreatedBy(),
                dashboard.getCreatedAt(),
                dashboard.getUpdatedAt()
        );
    }

    private DashboardListItem toDashboardListItem(Dashboard dashboard) {
        return new DashboardListItem(
                dashboard.getId(),
                dashboard.getName(),
                dashboard.getDashboardType(),
                dashboard.getWidgets().size(),
                dashboard.isDefault(),
                dashboard.isShared(),
                dashboard.getUpdatedAt()
        );
    }

    private WidgetResponse toWidgetResponse(DashboardWidget widget) {
        return new WidgetResponse(
                widget.getId(),
                widget.getTitle(),
                widget.getDescription(),
                widget.getWidgetType(),
                widget.getDataSource(),
                widget.getConfig(),
                widget.getPosition(),
                widget.getGridX(),
                widget.getGridY(),
                widget.getGridWidth(),
                widget.getGridHeight(),
                widget.getFilters(),
                widget.getCacheTtlSeconds(),
                widget.getLastDataRefresh(),
                widget.isShowTitle(),
                widget.isShowBorder(),
                widget.getBackgroundColor(),
                widget.getTextColor(),
                widget.isActive()
        );
    }
}
