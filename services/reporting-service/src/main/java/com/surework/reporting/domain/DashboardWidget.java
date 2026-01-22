package com.surework.reporting.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Individual widget on a dashboard.
 * Represents a single visualization or metric display.
 */
@Entity
@Table(name = "dashboard_widgets")
public class DashboardWidget {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dashboard_id", nullable = false)
    private Dashboard dashboard;

    @Column(nullable = false)
    private String title;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "widget_type", nullable = false)
    private WidgetType widgetType;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_source", nullable = false)
    private DataSource dataSource;

    // Widget configuration
    @Column(name = "config", columnDefinition = "jsonb")
    @Convert(converter = MapToJsonConverter.class)
    private Map<String, Object> config = new HashMap<>();

    // Layout position (grid coordinates)
    @Column(nullable = false)
    private Integer position = 0;

    @Column(name = "grid_x")
    private Integer gridX = 0;

    @Column(name = "grid_y")
    private Integer gridY = 0;

    @Column(name = "grid_width")
    private Integer gridWidth = 4;

    @Column(name = "grid_height")
    private Integer gridHeight = 3;

    // Data filtering
    @Column(name = "filters", columnDefinition = "jsonb")
    @Convert(converter = MapToJsonConverter.class)
    private Map<String, Object> filters = new HashMap<>();

    // Cache settings
    @Column(name = "cache_ttl_seconds")
    private Integer cacheTtlSeconds = 300;

    @Column(name = "last_data_refresh")
    private LocalDateTime lastDataRefresh;

    // Display settings
    @Column(name = "show_title")
    private boolean showTitle = true;

    @Column(name = "show_border")
    private boolean showBorder = true;

    @Column(name = "background_color")
    private String backgroundColor;

    @Column(name = "text_color")
    private String textColor;

    // Status
    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Enums
    public enum WidgetType {
        // Numeric displays
        METRIC_CARD,          // Single KPI with trend
        METRIC_COMPARISON,    // Compare two values
        GAUGE,                // Gauge/speedometer

        // Charts
        LINE_CHART,
        BAR_CHART,
        PIE_CHART,
        DONUT_CHART,
        STACKED_BAR,
        AREA_CHART,
        COMBO_CHART,

        // Tables and Lists
        DATA_TABLE,
        RANKED_LIST,
        SCROLLING_LIST,

        // Special
        CALENDAR_HEATMAP,
        TIMELINE,
        MAP,
        PROGRESS_BAR,
        SPARKLINE,

        // HR Specific
        ORG_CHART,
        HEADCOUNT_TREND,
        LEAVE_CALENDAR,
        BIRTHDAY_LIST,
        ANNIVERSARY_LIST,

        // Status
        STATUS_INDICATOR,
        ALERT_LIST
    }

    public enum DataSource {
        // HR Metrics
        HEADCOUNT,
        TURNOVER_RATE,
        NEW_HIRES,
        TERMINATIONS,
        DEMOGRAPHICS_AGE,
        DEMOGRAPHICS_GENDER,
        DEMOGRAPHICS_RACE,
        DEMOGRAPHICS_DEPARTMENT,
        TENURE_DISTRIBUTION,
        PROBATION_STATUS,

        // Leave Metrics
        LEAVE_BALANCE,
        LEAVE_UTILIZATION,
        SICK_LEAVE_TREND,
        LEAVE_REQUESTS_PENDING,
        ABSENCE_RATE,

        // Payroll Metrics
        PAYROLL_COST,
        PAYROLL_COST_BY_DEPT,
        AVERAGE_SALARY,
        OVERTIME_COST,
        STATUTORY_DEDUCTIONS,
        COST_TO_COMPANY,

        // Time & Attendance
        ATTENDANCE_RATE,
        LATE_ARRIVALS,
        OVERTIME_HOURS,
        HOURS_WORKED,
        TIMESHEET_COMPLIANCE,

        // Recruitment
        OPEN_POSITIONS,
        APPLICATIONS_RECEIVED,
        TIME_TO_HIRE,
        OFFER_ACCEPTANCE_RATE,
        RECRUITMENT_PIPELINE,
        SOURCE_BREAKDOWN,

        // Compliance
        EXPIRING_DOCUMENTS,
        PENDING_ACKNOWLEDGMENTS,
        COMPLIANCE_SCORE,
        TRAINING_COMPLETION,

        // Financial
        LABOR_COST_TREND,
        BUDGET_VARIANCE,
        HEADCOUNT_FORECAST,

        // Lists
        UPCOMING_BIRTHDAYS,
        UPCOMING_ANNIVERSARIES,
        UPCOMING_REVIEWS,
        RECENT_ACTIVITIES,
        ALERTS_NOTIFICATIONS,

        // Custom
        CUSTOM_QUERY
    }

    // Helper method to get default config based on widget type
    public static Map<String, Object> getDefaultConfig(WidgetType type) {
        Map<String, Object> config = new HashMap<>();

        switch (type) {
            case METRIC_CARD -> {
                config.put("showTrend", true);
                config.put("trendPeriod", "month");
                config.put("format", "number");
            }
            case LINE_CHART, AREA_CHART -> {
                config.put("showLegend", true);
                config.put("showGrid", true);
                config.put("smoothLine", true);
            }
            case BAR_CHART, STACKED_BAR -> {
                config.put("showLegend", true);
                config.put("orientation", "vertical");
                config.put("showValues", true);
            }
            case PIE_CHART, DONUT_CHART -> {
                config.put("showLegend", true);
                config.put("showPercentage", true);
                config.put("showLabels", true);
            }
            case DATA_TABLE -> {
                config.put("pageSize", 10);
                config.put("sortable", true);
                config.put("exportable", true);
            }
            case GAUGE -> {
                config.put("min", 0);
                config.put("max", 100);
                config.put("thresholds", new int[]{30, 70});
                config.put("colors", new String[]{"#ff4d4f", "#faad14", "#52c41a"});
            }
            default -> {}
        }

        return config;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Dashboard getDashboard() { return dashboard; }
    public void setDashboard(Dashboard dashboard) { this.dashboard = dashboard; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public WidgetType getWidgetType() { return widgetType; }
    public void setWidgetType(WidgetType widgetType) { this.widgetType = widgetType; }

    public DataSource getDataSource() { return dataSource; }
    public void setDataSource(DataSource dataSource) { this.dataSource = dataSource; }

    public Map<String, Object> getConfig() { return config; }
    public void setConfig(Map<String, Object> config) { this.config = config; }

    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }

    public Integer getGridX() { return gridX; }
    public void setGridX(Integer gridX) { this.gridX = gridX; }

    public Integer getGridY() { return gridY; }
    public void setGridY(Integer gridY) { this.gridY = gridY; }

    public Integer getGridWidth() { return gridWidth; }
    public void setGridWidth(Integer gridWidth) { this.gridWidth = gridWidth; }

    public Integer getGridHeight() { return gridHeight; }
    public void setGridHeight(Integer gridHeight) { this.gridHeight = gridHeight; }

    public Map<String, Object> getFilters() { return filters; }
    public void setFilters(Map<String, Object> filters) { this.filters = filters; }

    public Integer getCacheTtlSeconds() { return cacheTtlSeconds; }
    public void setCacheTtlSeconds(Integer cacheTtlSeconds) { this.cacheTtlSeconds = cacheTtlSeconds; }

    public LocalDateTime getLastDataRefresh() { return lastDataRefresh; }
    public void setLastDataRefresh(LocalDateTime lastDataRefresh) { this.lastDataRefresh = lastDataRefresh; }

    public boolean isShowTitle() { return showTitle; }
    public void setShowTitle(boolean showTitle) { this.showTitle = showTitle; }

    public boolean isShowBorder() { return showBorder; }
    public void setShowBorder(boolean showBorder) { this.showBorder = showBorder; }

    public String getBackgroundColor() { return backgroundColor; }
    public void setBackgroundColor(String backgroundColor) { this.backgroundColor = backgroundColor; }

    public String getTextColor() { return textColor; }
    public void setTextColor(String textColor) { this.textColor = textColor; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
