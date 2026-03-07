package com.surework.analytics.controller;

import com.surework.analytics.dto.AnalyticsDto.FeatureUsageStats;
import com.surework.analytics.service.FeatureUsageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics/feature-usage")
@RequiredArgsConstructor
@Tag(name = "Feature Usage", description = "Feature usage analytics endpoints")
public class FeatureUsageController {

    private final FeatureUsageService featureUsageService;

    @GetMapping
    @Operation(summary = "Get feature usage statistics")
    public ResponseEntity<List<FeatureUsageStats>> getFeatureUsage(
            @RequestParam(defaultValue = "month") String period) {
        return ResponseEntity.ok(featureUsageService.getFeatureUsage(period));
    }
}
