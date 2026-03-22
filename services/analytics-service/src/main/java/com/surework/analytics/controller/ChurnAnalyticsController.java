package com.surework.analytics.controller;

import com.surework.analytics.dto.AnalyticsDto.*;
import com.surework.analytics.service.ChurnPredictionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Tag(name = "Churn Analytics", description = "Churn prediction and health score endpoints")
public class ChurnAnalyticsController {

    private final ChurnPredictionService churnPredictionService;

    @GetMapping("/health-scores")
    @Operation(summary = "Get tenant health scores")
    public ResponseEntity<Page<TenantHealthScoreDto>> getHealthScores(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String risk) {
        return ResponseEntity.ok(
            churnPredictionService.getHealthScores(PageRequest.of(page, size), risk)
        );
    }

    @GetMapping("/churn")
    @Operation(summary = "Get churn metrics")
    public ResponseEntity<ChurnMetrics> getChurnMetrics() {
        return ResponseEntity.ok(churnPredictionService.getChurnMetrics());
    }

    @GetMapping("/cohorts")
    @Operation(summary = "Get cohort retention analysis")
    public ResponseEntity<List<CohortAnalysis>> getCohortAnalysis(
            @RequestParam(defaultValue = "6") int months) {
        return ResponseEntity.ok(churnPredictionService.getCohortAnalysis(months));
    }
}
