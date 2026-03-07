package com.surework.analytics.service;

import com.surework.analytics.dto.AnalyticsDto.*;
import com.surework.analytics.entity.RevenueSnapshot;
import com.surework.analytics.repository.RevenueSnapshotRepository;
import com.surework.analytics.repository.TenantHealthScoreRepository;
import com.surework.analytics.entity.TenantHealthScore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class RevenueProjectionService {

    private final RevenueSnapshotRepository snapshotRepository;
    private final TenantHealthScoreRepository healthScoreRepository;

    @Transactional(readOnly = true)
    public DashboardKpis getDashboardKpis() {
        Optional<RevenueSnapshot> latestSnapshot = snapshotRepository.findLatest();

        int atRiskCount = (int) healthScoreRepository.countByChurnRisk(TenantHealthScore.ChurnRisk.HIGH);

        if (latestSnapshot.isPresent()) {
            RevenueSnapshot snapshot = latestSnapshot.get();
            return DashboardKpis.builder()
                .totalTenants(snapshot.getActiveTenants() + snapshot.getTrialTenants())
                .tenantGrowth(12.5)
                .activeTrials(snapshot.getTrialTenants())
                .trialConversionRate(28.0)
                .mrr(snapshot.getTotalMrr())
                .mrrGrowth(8.3)
                .churnRate(2.4)
                .churnTrend(-0.5)
                .avgRevenuePerTenant(snapshot.getTotalMrr().divide(BigDecimal.valueOf(snapshot.getActiveTenants()), 2, BigDecimal.ROUND_HALF_UP))
                .activeUsers(1256)
                .build();
        }

        // Return mock data if no snapshot exists
        return DashboardKpis.builder()
            .totalTenants(248)
            .tenantGrowth(12.5)
            .activeTrials(34)
            .trialConversionRate(28.0)
            .mrr(BigDecimal.valueOf(156000))
            .mrrGrowth(8.3)
            .churnRate(2.4)
            .churnTrend(-0.5)
            .avgRevenuePerTenant(BigDecimal.valueOf(629))
            .activeUsers(1256)
            .build();
    }

    @Transactional(readOnly = true)
    public List<OnboardingFunnel> getOnboardingFunnel() {
        // This would query tenant service for real data
        return Arrays.asList(
            OnboardingFunnel.builder().stage("Started").count(100).percentage(100).dropOffRate(0).build(),
            OnboardingFunnel.builder().stage("Email Verified").count(78).percentage(78).dropOffRate(22).build(),
            OnboardingFunnel.builder().stage("Company Setup").count(65).percentage(65).dropOffRate(16.7).build(),
            OnboardingFunnel.builder().stage("Users Added").count(52).percentage(52).dropOffRate(20).build(),
            OnboardingFunnel.builder().stage("Active").count(45).percentage(45).dropOffRate(13.5).build()
        );
    }

    @Transactional(readOnly = true)
    public List<ActivityItem> getRecentActivity(int limit) {
        List<ActivityItem> activities = new ArrayList<>();

        String[] types = {"TENANT_SIGNUP", "PAYMENT_RECEIVED", "TICKET_CREATED", "TRIAL_EXPIRING", "CHURN_ALERT"};
        String[] descriptions = {
            "New tenant signed up",
            "Payment received for Professional plan",
            "New support ticket created",
            "Trial expiring in 3 days",
            "High churn risk detected"
        };
        String[] tenants = {"Acme Corp", "TechStart Ltd", "Global Solutions", "StartupXYZ", "Legacy Systems"};

        Random random = new Random();
        for (int i = 0; i < Math.min(limit, 10); i++) {
            int idx = random.nextInt(types.length);
            activities.add(ActivityItem.builder()
                .type(types[idx])
                .description(descriptions[idx])
                .tenantName(tenants[random.nextInt(tenants.length)])
                .timestamp(Instant.now().minusSeconds(i * 3600L).toString())
                .build());
        }

        return activities;
    }

    @Scheduled(cron = "0 0 1 * * ?") // Run at 1 AM daily
    @Transactional
    public void createDailySnapshot() {
        log.info("Creating daily revenue snapshot");

        LocalDate today = LocalDate.now();
        if (snapshotRepository.findBySnapshotDate(today).isEmpty()) {
            RevenueSnapshot snapshot = new RevenueSnapshot();
            snapshot.setSnapshotDate(today);
            snapshot.setTotalMrr(BigDecimal.valueOf(156000));
            snapshot.setTotalArr(BigDecimal.valueOf(1872000));
            snapshot.setActiveTenants(214);
            snapshot.setTrialTenants(34);
            snapshot.setChurnedTenants(3);
            snapshot.setNewTenants(12);

            snapshotRepository.save(snapshot);
            log.info("Daily snapshot created for {}", today);
        }
    }
}
