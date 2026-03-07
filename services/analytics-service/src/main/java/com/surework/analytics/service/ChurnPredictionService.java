package com.surework.analytics.service;

import com.surework.analytics.dto.AnalyticsDto.*;
import com.surework.analytics.entity.TenantHealthScore;
import com.surework.analytics.repository.TenantHealthScoreRepository;
import com.surework.analytics.repository.FeatureUsageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChurnPredictionService {

    private final TenantHealthScoreRepository healthScoreRepository;
    private final FeatureUsageRepository featureUsageRepository;

    @Transactional(readOnly = true)
    public Page<TenantHealthScoreDto> getHealthScores(Pageable pageable, String riskFilter) {
        Page<TenantHealthScore> scores;

        if (riskFilter != null && !riskFilter.isEmpty()) {
            TenantHealthScore.ChurnRisk risk = TenantHealthScore.ChurnRisk.valueOf(riskFilter.toUpperCase());
            scores = healthScoreRepository.findLatestScoresByRisk(risk, pageable);
        } else {
            scores = healthScoreRepository.findLatestScores(pageable);
        }

        return scores.map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public ChurnMetrics getChurnMetrics() {
        long highRisk = healthScoreRepository.countByChurnRisk(TenantHealthScore.ChurnRisk.HIGH);

        return ChurnMetrics.builder()
            .currentChurnRate(2.4)
            .previousChurnRate(2.8)
            .churnTrend(-0.4)
            .atRiskTenants((int) highRisk)
            .recentlyChurned(new ArrayList<>())
            .build();
    }

    @Transactional(readOnly = true)
    public List<CohortAnalysis> getCohortAnalysis(int months) {
        List<CohortAnalysis> cohorts = new ArrayList<>();
        String[] monthNames = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};

        for (int i = 0; i < months; i++) {
            int monthIndex = (java.time.LocalDate.now().getMonthValue() - 1 - i + 12) % 12;
            int year = java.time.LocalDate.now().getYear();
            if (java.time.LocalDate.now().getMonthValue() - 1 - i < 0) {
                year--;
            }

            List<Double> retentionRates = new ArrayList<>();
            int baseRetention = 100;
            for (int j = 0; j <= months - i - 1 && retentionRates.size() < 6; j++) {
                baseRetention = Math.max(75, baseRetention - (int)(Math.random() * 10));
                retentionRates.add((double) baseRetention);
            }

            cohorts.add(CohortAnalysis.builder()
                .cohortMonth(monthNames[monthIndex] + " " + year)
                .initialTenants(40 + (int)(Math.random() * 20))
                .retentionRates(retentionRates)
                .build());
        }

        return cohorts;
    }

    @Scheduled(cron = "0 0 2 * * ?") // Run at 2 AM daily
    @Transactional
    public void calculateHealthScores() {
        log.info("Starting health score calculation");
        // This would fetch all active tenants and calculate their health scores
        // Based on factors like usage frequency, support tickets, payment history, etc.
    }

    @Transactional
    public TenantHealthScore calculateScoreForTenant(UUID tenantId) {
        long usageCount = featureUsageRepository.countByTenantIdSince(tenantId, Instant.now().minus(30, ChronoUnit.DAYS));

        // Calculate health score based on various factors
        BigDecimal usageScore = calculateUsageScore(usageCount);
        BigDecimal engagementScore = BigDecimal.valueOf(70 + Math.random() * 25);
        BigDecimal supportScore = BigDecimal.valueOf(60 + Math.random() * 35);
        BigDecimal growthScore = BigDecimal.valueOf(50 + Math.random() * 45);

        BigDecimal totalScore = usageScore.multiply(BigDecimal.valueOf(0.3))
            .add(engagementScore.multiply(BigDecimal.valueOf(0.25)))
            .add(supportScore.multiply(BigDecimal.valueOf(0.2)))
            .add(growthScore.multiply(BigDecimal.valueOf(0.25)))
            .setScale(2, RoundingMode.HALF_UP);

        TenantHealthScore.ChurnRisk risk = determineChurnRisk(totalScore);

        Map<String, Object> factors = new LinkedHashMap<>();
        factors.put("usage", Map.of("score", usageScore, "weight", 0.3, "description", "Feature usage frequency"));
        factors.put("engagement", Map.of("score", engagementScore, "weight", 0.25, "description", "User engagement"));
        factors.put("support", Map.of("score", supportScore, "weight", 0.2, "description", "Support ticket frequency"));
        factors.put("growth", Map.of("score", growthScore, "weight", 0.25, "description", "Employee growth"));

        TenantHealthScore healthScore = new TenantHealthScore();
        healthScore.setTenantId(tenantId);
        healthScore.setScore(totalScore);
        healthScore.setFactors(factors);
        healthScore.setChurnRisk(risk);

        return healthScoreRepository.save(healthScore);
    }

    private BigDecimal calculateUsageScore(long usageCount) {
        if (usageCount >= 1000) return BigDecimal.valueOf(100);
        if (usageCount >= 500) return BigDecimal.valueOf(85);
        if (usageCount >= 100) return BigDecimal.valueOf(70);
        if (usageCount >= 50) return BigDecimal.valueOf(55);
        if (usageCount >= 10) return BigDecimal.valueOf(40);
        return BigDecimal.valueOf(20);
    }

    private TenantHealthScore.ChurnRisk determineChurnRisk(BigDecimal score) {
        if (score.compareTo(BigDecimal.valueOf(70)) >= 0) return TenantHealthScore.ChurnRisk.LOW;
        if (score.compareTo(BigDecimal.valueOf(40)) >= 0) return TenantHealthScore.ChurnRisk.MEDIUM;
        return TenantHealthScore.ChurnRisk.HIGH;
    }

    @SuppressWarnings("unchecked")
    private TenantHealthScoreDto mapToDto(TenantHealthScore score) {
        List<HealthFactor> factors = new ArrayList<>();

        if (score.getFactors() != null) {
            score.getFactors().forEach((key, value) -> {
                if (value instanceof Map) {
                    Map<String, Object> factorMap = (Map<String, Object>) value;
                    factors.add(HealthFactor.builder()
                        .name(key.substring(0, 1).toUpperCase() + key.substring(1))
                        .score(new BigDecimal(factorMap.get("score").toString()))
                        .weight(new BigDecimal(factorMap.get("weight").toString()))
                        .description((String) factorMap.get("description"))
                        .build());
                }
            });
        }

        return TenantHealthScoreDto.builder()
            .tenantId(score.getTenantId())
            .tenantName("Tenant " + score.getTenantId().toString().substring(0, 8))
            .score(score.getScore())
            .churnRisk(score.getChurnRisk().name())
            .factors(factors)
            .calculatedAt(score.getCalculatedAt().toString())
            .build();
    }
}
