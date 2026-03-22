package com.surework.analytics.service;

import com.surework.analytics.dto.AnalyticsDto.FeatureUsageStats;
import com.surework.analytics.entity.FeatureUsage;
import com.surework.analytics.repository.FeatureUsageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeatureUsageService {

    private final FeatureUsageRepository featureUsageRepository;

    private static final Map<String, String> FEATURE_NAMES = Map.of(
        "payroll", "Payroll Processing",
        "leave", "Leave Management",
        "employees", "Employee Records",
        "reports", "Reporting",
        "time", "Time Tracking",
        "documents", "Documents",
        "recruitment", "Recruitment",
        "accounting", "Accounting"
    );

    @Transactional(readOnly = true)
    public List<FeatureUsageStats> getFeatureUsage(String period) {
        Instant since = calculateSinceDate(period);
        Instant previousPeriodStart = calculatePreviousPeriodStart(period, since);

        List<Object[]> currentStats = featureUsageRepository.getFeatureUsageStats(since);
        List<Object[]> previousStats = featureUsageRepository.getFeatureUsageStats(previousPeriodStart);

        Map<String, Long> previousCounts = previousStats.stream()
            .collect(Collectors.toMap(
                row -> (String) row[0],
                row -> (Long) row[1]
            ));

        return currentStats.stream()
            .map(row -> {
                String featureCode = (String) row[0];
                long currentCount = (Long) row[1];
                long previousCount = previousCounts.getOrDefault(featureCode, 0L);
                double trend = previousCount > 0
                    ? ((currentCount - previousCount) / (double) previousCount) * 100
                    : 0;

                return FeatureUsageStats.builder()
                    .featureCode(featureCode)
                    .featureName(FEATURE_NAMES.getOrDefault(featureCode, featureCode))
                    .totalEvents(currentCount)
                    .uniqueUsers((Long) row[2])
                    .uniqueTenants((Long) row[3])
                    .trend(Math.round(trend * 10) / 10.0)
                    .build();
            })
            .collect(Collectors.toList());
    }

    @Transactional
    public void recordUsage(UUID tenantId, UUID userId, String featureCode, String eventType, Map<String, Object> eventData) {
        FeatureUsage usage = new FeatureUsage();
        usage.setTenantId(tenantId);
        usage.setUserId(userId);
        usage.setFeatureCode(featureCode);
        usage.setEventType(eventType);
        usage.setEventData(eventData);
        usage.setRecordedAt(Instant.now());

        featureUsageRepository.save(usage);
        log.debug("Recorded feature usage: {} for tenant {}", featureCode, tenantId);
    }

    public long getTenantUsageCount(UUID tenantId, String period) {
        Instant since = calculateSinceDate(period);
        return featureUsageRepository.countByTenantIdSince(tenantId, since);
    }

    private Instant calculateSinceDate(String period) {
        return switch (period.toLowerCase()) {
            case "week" -> Instant.now().minus(7, ChronoUnit.DAYS);
            case "quarter" -> Instant.now().minus(90, ChronoUnit.DAYS);
            default -> Instant.now().minus(30, ChronoUnit.DAYS);
        };
    }

    private Instant calculatePreviousPeriodStart(String period, Instant currentPeriodStart) {
        return switch (period.toLowerCase()) {
            case "week" -> currentPeriodStart.minus(7, ChronoUnit.DAYS);
            case "quarter" -> currentPeriodStart.minus(90, ChronoUnit.DAYS);
            default -> currentPeriodStart.minus(30, ChronoUnit.DAYS);
        };
    }
}
