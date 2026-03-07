package com.surework.analytics.dto;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class AnalyticsDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardKpis {
        private int totalTenants;
        private double tenantGrowth;
        private int activeTrials;
        private double trialConversionRate;
        private BigDecimal mrr;
        private double mrrGrowth;
        private double churnRate;
        private double churnTrend;
        private BigDecimal avgRevenuePerTenant;
        private int activeUsers;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FeatureUsageStats {
        private String featureCode;
        private String featureName;
        private long totalEvents;
        private long uniqueUsers;
        private long uniqueTenants;
        private double trend;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TenantHealthScoreDto {
        private UUID tenantId;
        private String tenantName;
        private BigDecimal score;
        private String churnRisk;
        private List<HealthFactor> factors;
        private String calculatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HealthFactor {
        private String name;
        private BigDecimal score;
        private BigDecimal weight;
        private String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChurnMetrics {
        private double currentChurnRate;
        private double previousChurnRate;
        private double churnTrend;
        private int atRiskTenants;
        private List<ChurnedTenant> recentlyChurned;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChurnedTenant {
        private UUID tenantId;
        private String tenantName;
        private String churnedAt;
        private String reason;
        private BigDecimal mrr;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CohortAnalysis {
        private String cohortMonth;
        private int initialTenants;
        private List<Double> retentionRates;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OnboardingFunnel {
        private String stage;
        private int count;
        private double percentage;
        private double dropOffRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityItem {
        private String type;
        private String description;
        private String tenantName;
        private String timestamp;
    }
}
