package com.surework.analytics.controller;

import com.surework.analytics.dto.AnalyticsDto.*;
import com.surework.analytics.service.RevenueProjectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Tag(name = "Revenue Analytics", description = "Revenue analytics and KPI endpoints")
public class RevenueAnalyticsController {

    private final RevenueProjectionService revenueProjectionService;

    @GetMapping("/kpis")
    @Operation(summary = "Get dashboard KPIs")
    public ResponseEntity<DashboardKpis> getDashboardKpis() {
        return ResponseEntity.ok(revenueProjectionService.getDashboardKpis());
    }

    @GetMapping("/onboarding-funnel")
    @Operation(summary = "Get onboarding funnel metrics")
    public ResponseEntity<List<OnboardingFunnel>> getOnboardingFunnel() {
        return ResponseEntity.ok(revenueProjectionService.getOnboardingFunnel());
    }

    @GetMapping("/recent-activity")
    @Operation(summary = "Get recent activity feed")
    public ResponseEntity<List<ActivityItem>> getRecentActivity(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(revenueProjectionService.getRecentActivity(limit));
    }
}
