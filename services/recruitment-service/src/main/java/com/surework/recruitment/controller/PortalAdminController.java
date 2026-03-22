package com.surework.recruitment.controller;

import com.surework.recruitment.domain.ExternalJobPosting;
import com.surework.recruitment.domain.JobPosting;
import com.surework.recruitment.domain.PlatformPortalCredentials;
import com.surework.recruitment.integration.portals.PortalCredentialsService;
import com.surework.recruitment.repository.ExternalJobPostingRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Admin controller for managing platform-level portal credentials and external postings.
 * These endpoints are for SureWork admin users only (not tenant admins).
 */
@RestController
@RequestMapping("/api/admin/portals")
@Tag(name = "Portal Administration", description = "Manage external job portal integrations")
@PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('PORTAL_ADMIN')")
public class PortalAdminController {

    private static final Logger log = LoggerFactory.getLogger(PortalAdminController.class);

    private final PortalCredentialsService credentialsService;
    private final ExternalJobPostingRepository externalPostingRepository;

    public PortalAdminController(
            PortalCredentialsService credentialsService,
            ExternalJobPostingRepository externalPostingRepository) {
        this.credentialsService = credentialsService;
        this.externalPostingRepository = externalPostingRepository;
    }

    // ==================== DTOs ====================

    public record PortalCredentialsResponse(
            UUID id,
            String portal,
            String username,  // Masked for security
            boolean hasPassword,
            boolean active,
            String connectionStatus,
            int dailyRateLimit,
            int postsToday,
            int remainingPosts,
            LocalDateTime lastVerifiedAt,
            String lastError,
            LocalDateTime rateLimitResetAt
    ) {}

    public record UpdateCredentialsRequest(
            @NotBlank String username,
            String password,           // blank = keep existing
            String additionalConfig,
            boolean active
    ) {}

    public record TestConnectionResponse(
            boolean success,
            String message,
            String connectionStatus
    ) {}

    public record PortalHealthSummary(
            int totalPortals,
            int activePortals,
            int portalsNeedingAttention,
            int totalPostsToday,
            List<PortalStatusSummary> portals
    ) {}

    public record PortalStatusSummary(
            String portal,
            String status,
            boolean active,
            int postsToday,
            int dailyLimit
    ) {}

    public record FailedPostingResponse(
            UUID id,
            UUID jobPostingId,
            String jobReference,
            String jobTitle,
            UUID tenantId,
            String portal,
            String status,
            String errorMessage,
            int retryCount,
            Instant createdAt,
            Instant lastAttemptAt
    ) {}

    public record ExternalPostingResponse(
            UUID id,
            UUID jobPostingId,
            String jobReference,
            String jobTitle,
            UUID tenantId,
            String portal,
            String externalJobId,
            String externalUrl,
            String status,
            String errorMessage,
            int retryCount,
            LocalDateTime postedAt,
            LocalDateTime expiresAt,
            LocalDateTime lastCheckedAt,
            Instant createdAt
    ) {}

    public record ExternalPostingStatsResponse(
            long totalRequests,
            long successfulPostings,
            long failedPostings,
            long pendingPostings,
            long requiresManualCount,
            double successRate,
            Map<String, Long> byPortal,
            Map<String, Long> byStatus
    ) {}

    public record PostingStatsResponse(
            List<DailyPostingStats> dailyData,
            List<SuccessRateTrendPoint> successRateTrend
    ) {}

    public record DailyPostingStats(
            String date,
            String portal,
            long count,
            long successCount,
            long failedCount
    ) {}

    public record SuccessRateTrendPoint(
            String date,
            double successRate,
            double failureRate
    ) {}

    public record TenantPostingStats(
            UUID tenantId,
            String portal,
            long count
    ) {}

    // ==================== Portal Credentials Endpoints ====================

    @GetMapping("/credentials")
    @Operation(summary = "List all portal credentials", description = "Get status of all configured portals")
    public ResponseEntity<List<PortalCredentialsResponse>> listCredentials() {
        log.info("Admin listing portal credentials");

        List<PortalCredentialsResponse> credentials = credentialsService.getAllCredentials().stream()
                .map(this::mapToResponse)
                .toList();

        return ResponseEntity.ok(credentials);
    }

    @GetMapping("/credentials/{portal}")
    @Operation(summary = "Get portal credentials", description = "Get details for a specific portal")
    public ResponseEntity<PortalCredentialsResponse> getCredentials(@PathVariable String portal) {
        JobPosting.JobPortal portalEnum = JobPosting.JobPortal.valueOf(portal.toUpperCase());

        return credentialsService.getCredentialsEntity(portalEnum)
                .map(creds -> ResponseEntity.ok(mapToResponse(creds)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/credentials/{portal}")
    @Operation(summary = "Update portal credentials", description = "Save or update credentials for a portal")
    public ResponseEntity<PortalCredentialsResponse> updateCredentials(
            @PathVariable String portal,
            @Valid @RequestBody UpdateCredentialsRequest request) {

        log.info("Admin updating credentials for portal: {}", portal);
        JobPosting.JobPortal portalEnum = JobPosting.JobPortal.valueOf(portal.toUpperCase());

        PlatformPortalCredentials saved = credentialsService.saveCredentials(
                portalEnum,
                request.username(),
                request.password(),
                request.additionalConfig(),
                request.active()
        );

        return ResponseEntity.ok(mapToResponse(saved));
    }

    @PostMapping("/credentials/{portal}/test")
    @Operation(summary = "Test portal connection", description = "Verify credentials by attempting to log in")
    public ResponseEntity<TestConnectionResponse> testConnection(@PathVariable String portal) {
        log.info("Admin testing connection for portal: {}", portal);
        JobPosting.JobPortal portalEnum = JobPosting.JobPortal.valueOf(portal.toUpperCase());

        var credsOpt = credentialsService.getCredentials(portalEnum);
        if (credsOpt.isEmpty()) {
            return ResponseEntity.ok(new TestConnectionResponse(
                    false,
                    "Portal not configured",
                    "NOT_CONFIGURED"
            ));
        }

        boolean valid = credentialsService.validateCredentials(portalEnum, credsOpt.get());

        if (valid) {
            credentialsService.updateConnectionStatus(
                    portalEnum,
                    PlatformPortalCredentials.ConnectionStatus.CONNECTED,
                    null
            );
            return ResponseEntity.ok(new TestConnectionResponse(
                    true,
                    "Connection successful",
                    "CONNECTED"
            ));
        } else {
            credentialsService.updateConnectionStatus(
                    portalEnum,
                    PlatformPortalCredentials.ConnectionStatus.INVALID_CREDENTIALS,
                    "Test connection failed"
            );
            return ResponseEntity.ok(new TestConnectionResponse(
                    false,
                    "Connection failed - invalid credentials",
                    "INVALID_CREDENTIALS"
            ));
        }
    }

    @PostMapping("/credentials/{portal}/activate")
    @Operation(summary = "Activate portal", description = "Enable posting to this portal")
    public ResponseEntity<PortalCredentialsResponse> activatePortal(@PathVariable String portal) {
        log.info("Admin activating portal: {}", portal);
        JobPosting.JobPortal portalEnum = JobPosting.JobPortal.valueOf(portal.toUpperCase());

        credentialsService.setPortalActive(portalEnum, true);

        return credentialsService.getCredentialsEntity(portalEnum)
                .map(creds -> ResponseEntity.ok(mapToResponse(creds)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/credentials/{portal}/deactivate")
    @Operation(summary = "Deactivate portal", description = "Disable posting to this portal")
    public ResponseEntity<PortalCredentialsResponse> deactivatePortal(@PathVariable String portal) {
        log.info("Admin deactivating portal: {}", portal);
        JobPosting.JobPortal portalEnum = JobPosting.JobPortal.valueOf(portal.toUpperCase());

        credentialsService.setPortalActive(portalEnum, false);

        return credentialsService.getCredentialsEntity(portalEnum)
                .map(creds -> ResponseEntity.ok(mapToResponse(creds)))
                .orElse(ResponseEntity.notFound().build());
    }

    // ==================== Portal Health & Monitoring ====================

    @GetMapping("/health")
    @Operation(summary = "Get portal health summary", description = "Overview of all portal statuses")
    public ResponseEntity<PortalHealthSummary> getHealthSummary() {
        List<PlatformPortalCredentials> allCreds = credentialsService.getAllCredentials();

        int totalPortals = allCreds.size();
        int activePortals = (int) allCreds.stream().filter(PlatformPortalCredentials::isActive).count();
        int needingAttention = credentialsService.getCredentialsNeedingAttention().size();
        int totalPostsToday = allCreds.stream().mapToInt(PlatformPortalCredentials::getPostsToday).sum();

        List<PortalStatusSummary> summaries = allCreds.stream()
                .map(c -> new PortalStatusSummary(
                        c.getPortal().name(),
                        c.getConnectionStatus() != null ? c.getConnectionStatus().name() : "NOT_CONFIGURED",
                        c.isActive(),
                        c.getPostsToday(),
                        c.getDailyRateLimit()
                ))
                .toList();

        return ResponseEntity.ok(new PortalHealthSummary(
                totalPortals,
                activePortals,
                needingAttention,
                totalPostsToday,
                summaries
        ));
    }

    @GetMapping("/needing-attention")
    @Operation(summary = "Get portals needing attention", description = "Portals with errors or issues")
    public ResponseEntity<List<PortalCredentialsResponse>> getPortalsNeedingAttention() {
        List<PortalCredentialsResponse> portals = credentialsService.getCredentialsNeedingAttention().stream()
                .map(this::mapToResponse)
                .toList();

        return ResponseEntity.ok(portals);
    }

    // ==================== All Postings ====================

    @GetMapping("/postings")
    @Operation(summary = "Get all external postings", description = "List all external postings with optional filters")
    public ResponseEntity<Page<ExternalPostingResponse>> getAllPostings(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String portal,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        ExternalJobPosting.ExternalPostingStatus statusEnum = (status != null && !status.isBlank())
                ? ExternalJobPosting.ExternalPostingStatus.valueOf(status.toUpperCase())
                : null;

        JobPosting.JobPortal portalEnum = (portal != null && !portal.isBlank())
                ? JobPosting.JobPortal.valueOf(portal.toUpperCase())
                : null;

        String searchTerm = (search != null && !search.isBlank()) ? search : null;

        Pageable pageable = Pageable.ofSize(size).withPage(page);

        // Use searchAllPostingsWithJob which has JOIN FETCH for jobPosting (OSIV is off)
        List<ExternalJobPosting.ExternalPostingStatus> statuses = statusEnum != null
                ? List.of(statusEnum)
                : List.of(ExternalJobPosting.ExternalPostingStatus.values());

        Page<ExternalJobPosting> postings = externalPostingRepository.searchAllPostingsWithJob(
                statuses, portalEnum, searchTerm, pageable
        );

        return ResponseEntity.ok(postings.map(this::mapToExternalPostingResponse));
    }

    // ==================== Failed Postings Queue ====================

    @GetMapping("/failed-postings")
    @Operation(summary = "Get failed postings", description = "List postings that need manual intervention, with optional filters")
    public ResponseEntity<Page<FailedPostingResponse>> getFailedPostings(
            @RequestParam(required = false) String portal,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            Pageable pageable) {

        // Build status filter list
        List<ExternalJobPosting.ExternalPostingStatus> statuses;
        if (status != null && !status.isBlank()) {
            statuses = List.of(ExternalJobPosting.ExternalPostingStatus.valueOf(status.toUpperCase()));
        } else {
            // Default to FAILED + REQUIRES_MANUAL when no status filter
            statuses = List.of(
                    ExternalJobPosting.ExternalPostingStatus.FAILED,
                    ExternalJobPosting.ExternalPostingStatus.REQUIRES_MANUAL
            );
        }

        JobPosting.JobPortal portalEnum = (portal != null && !portal.isBlank())
                ? JobPosting.JobPortal.valueOf(portal.toUpperCase())
                : null;

        String searchTerm = (search != null && !search.isBlank()) ? search : null;

        Instant dateFromInstant = (dateFrom != null && !dateFrom.isBlank())
                ? LocalDate.parse(dateFrom).atStartOfDay(ZoneId.of("Africa/Johannesburg")).toInstant()
                : null;
        Instant dateToInstant = (dateTo != null && !dateTo.isBlank())
                ? LocalDate.parse(dateTo).plusDays(1).atStartOfDay(ZoneId.of("Africa/Johannesburg")).toInstant()
                : null;

        Page<ExternalJobPosting> postings = externalPostingRepository.searchFailedPostings(
                statuses, portalEnum, searchTerm, dateFromInstant, dateToInstant, pageable
        );

        return ResponseEntity.ok(postings.map(this::mapToFailedResponse));
    }

    @GetMapping("/failed-postings/count")
    @Operation(summary = "Get failed postings count", description = "Count of postings requiring manual intervention")
    public ResponseEntity<Map<String, Long>> getFailedPostingsCount() {
        long requiresManual = externalPostingRepository.countByStatus(
                ExternalJobPosting.ExternalPostingStatus.REQUIRES_MANUAL
        );
        long failed = externalPostingRepository.countByStatus(
                ExternalJobPosting.ExternalPostingStatus.FAILED
        );

        return ResponseEntity.ok(Map.of(
                "requiresManual", requiresManual,
                "failed", failed,
                "total", requiresManual + failed
        ));
    }

    @PostMapping("/failed-postings/{id}/resolve")
    @Operation(summary = "Resolve failed posting", description = "Mark a failed posting as resolved after manual intervention")
    public ResponseEntity<Void> resolveFailedPosting(
            @PathVariable UUID id,
            @RequestBody ResolvePostingRequest request) {

        log.info("Admin resolving failed posting: {} with external ID: {}", id, request.externalJobId());

        ExternalJobPosting posting = externalPostingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Posting not found"));

        if (request.success()) {
            posting.markAsPosted(
                    request.externalJobId(),
                    request.externalUrl(),
                    request.expiresAt()
            );
        } else {
            posting.markAsFailed(request.errorMessage());
        }

        externalPostingRepository.save(posting);
        return ResponseEntity.ok().build();
    }

    public record ResolvePostingRequest(
            boolean success,
            String externalJobId,
            String externalUrl,
            LocalDateTime expiresAt,
            String errorMessage
    ) {}

    @PostMapping("/failed-postings/{id}/retry")
    @Operation(summary = "Retry failed posting", description = "Reset a failed posting for automatic retry")
    public ResponseEntity<Void> retryFailedPosting(@PathVariable UUID id) {
        log.info("Admin retrying failed posting: {}", id);

        ExternalJobPosting posting = externalPostingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Posting not found"));

        posting.resetForRetry();
        externalPostingRepository.save(posting);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/failed-postings/bulk-retry")
    @Operation(summary = "Bulk retry failed postings", description = "Reset multiple failed postings for automatic retry")
    public ResponseEntity<Map<String, Integer>> bulkRetryFailedPostings(
            @RequestBody Map<String, List<String>> request) {

        List<String> ids = request.get("ids");
        if (ids == null || ids.isEmpty()) {
            return ResponseEntity.ok(Map.of("success", 0, "failed", 0));
        }

        log.info("Admin bulk retrying {} failed postings", ids.size());
        int success = 0;
        int failed = 0;

        for (String id : ids) {
            try {
                ExternalJobPosting posting = externalPostingRepository.findById(UUID.fromString(id))
                        .orElseThrow(() -> new IllegalArgumentException("Posting not found: " + id));
                posting.resetForRetry();
                externalPostingRepository.save(posting);
                success++;
            } catch (Exception e) {
                log.warn("Failed to retry posting {}: {}", id, e.getMessage());
                failed++;
            }
        }

        return ResponseEntity.ok(Map.of("success", success, "failed", failed));
    }

    // ==================== Statistics ====================

    @GetMapping("/stats")
    @Operation(summary = "Get external posting statistics", description = "Aggregated stats for external postings")
    public ResponseEntity<ExternalPostingStatsResponse> getStats() {
        long total = externalPostingRepository.count();
        long posted = externalPostingRepository.countByStatus(ExternalJobPosting.ExternalPostingStatus.POSTED);
        long failed = externalPostingRepository.countByStatus(ExternalJobPosting.ExternalPostingStatus.FAILED);
        long pending = externalPostingRepository.countByStatus(ExternalJobPosting.ExternalPostingStatus.PENDING) +
                       externalPostingRepository.countByStatus(ExternalJobPosting.ExternalPostingStatus.QUEUED);
        long requiresManual = externalPostingRepository.countByStatus(
                ExternalJobPosting.ExternalPostingStatus.REQUIRES_MANUAL);

        double successRate = total > 0 ? (double) posted / total * 100 : 0;

        // Get counts by portal
        Map<String, Long> byPortal = Map.of(
                "PNET", externalPostingRepository.countByPortal(JobPosting.JobPortal.PNET),
                "LINKEDIN", externalPostingRepository.countByPortal(JobPosting.JobPortal.LINKEDIN),
                "INDEED", externalPostingRepository.countByPortal(JobPosting.JobPortal.INDEED),
                "CAREERS24", externalPostingRepository.countByPortal(JobPosting.JobPortal.CAREERS24)
        );

        // Get counts by status
        Map<String, Long> byStatus = Map.of(
                "POSTED", posted,
                "FAILED", failed,
                "PENDING", pending,
                "REQUIRES_MANUAL", requiresManual
        );

        return ResponseEntity.ok(new ExternalPostingStatsResponse(
                total,
                posted,
                failed,
                pending,
                requiresManual,
                successRate,
                byPortal,
                byStatus
        ));
    }

    @GetMapping("/stats/by-tenant")
    @Operation(summary = "Get stats by tenant", description = "External posting stats grouped by tenant")
    public ResponseEntity<List<TenantPostingStats>> getStatsByTenant() {
        List<Object[]> rawStats = externalPostingRepository.getStatsByTenantAndPortal();

        List<TenantPostingStats> stats = rawStats.stream()
                .map(row -> new TenantPostingStats(
                        (UUID) row[0],
                        row[1].toString(),
                        ((Number) row[2]).longValue()
                ))
                .toList();

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/stats/range")
    @Operation(summary = "Get posting stats for date range", description = "Daily posting stats and success rate trends")
    public ResponseEntity<PostingStatsResponse> getStatsRange(
            @RequestParam String startDate,
            @RequestParam String endDate) {

        Instant start = LocalDate.parse(startDate).atStartOfDay(ZoneId.of("Africa/Johannesburg")).toInstant();
        Instant end = LocalDate.parse(endDate).plusDays(1).atStartOfDay(ZoneId.of("Africa/Johannesburg")).toInstant();

        List<ExternalJobPosting> postings = externalPostingRepository.findByCreatedAtBetween(start, end);

        // Group by date and portal for daily stats
        Map<String, Map<String, List<ExternalJobPosting>>> grouped = postings.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getCreatedAt().atZone(ZoneId.of("Africa/Johannesburg")).toLocalDate().toString(),
                        Collectors.groupingBy(p -> p.getPortal().name())
                ));

        List<DailyPostingStats> dailyData = new ArrayList<>();
        for (var dateEntry : grouped.entrySet()) {
            for (var portalEntry : dateEntry.getValue().entrySet()) {
                List<ExternalJobPosting> dayPortalPostings = portalEntry.getValue();
                long successCount = dayPortalPostings.stream()
                        .filter(p -> p.getStatus() == ExternalJobPosting.ExternalPostingStatus.POSTED)
                        .count();
                long failedCount = dayPortalPostings.stream()
                        .filter(p -> p.getStatus() == ExternalJobPosting.ExternalPostingStatus.FAILED
                                || p.getStatus() == ExternalJobPosting.ExternalPostingStatus.REQUIRES_MANUAL)
                        .count();

                dailyData.add(new DailyPostingStats(
                        dateEntry.getKey(),
                        portalEntry.getKey(),
                        dayPortalPostings.size(),
                        successCount,
                        failedCount
                ));
            }
        }
        dailyData.sort(Comparator.comparing(DailyPostingStats::date).thenComparing(DailyPostingStats::portal));

        // Success rate trend by date
        Map<String, List<ExternalJobPosting>> byDate = postings.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getCreatedAt().atZone(ZoneId.of("Africa/Johannesburg")).toLocalDate().toString()
                ));

        List<SuccessRateTrendPoint> trend = byDate.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    long total = entry.getValue().size();
                    long success = entry.getValue().stream()
                            .filter(p -> p.getStatus() == ExternalJobPosting.ExternalPostingStatus.POSTED)
                            .count();
                    long failures = entry.getValue().stream()
                            .filter(p -> p.getStatus() == ExternalJobPosting.ExternalPostingStatus.FAILED
                                    || p.getStatus() == ExternalJobPosting.ExternalPostingStatus.REQUIRES_MANUAL)
                            .count();
                    double successRate = total > 0 ? (double) success / total * 100 : 0;
                    double failureRate = total > 0 ? (double) failures / total * 100 : 0;
                    return new SuccessRateTrendPoint(entry.getKey(), successRate, failureRate);
                })
                .toList();

        return ResponseEntity.ok(new PostingStatsResponse(dailyData, trend));
    }

    // ==================== Helper Methods ====================

    private PortalCredentialsResponse mapToResponse(PlatformPortalCredentials creds) {
        String maskedUsername = null;
        if (creds.getUsernameEncrypted() != null) {
            try {
                maskedUsername = maskString(credentialsService.decrypt(creds.getUsernameEncrypted()));
            } catch (Exception e) {
                // Decryption may fail for seed/placeholder data — show masked placeholder
                maskedUsername = maskString(creds.getUsernameEncrypted());
            }
        }

        return new PortalCredentialsResponse(
                creds.getId(),
                creds.getPortal().name(),
                maskedUsername,
                creds.getPasswordEncrypted() != null,
                creds.isActive(),
                creds.getConnectionStatus() != null ? creds.getConnectionStatus().name() : "NOT_CONFIGURED",
                creds.getDailyRateLimit(),
                creds.getPostsToday(),
                creds.getRemainingPosts(),
                creds.getLastVerifiedAt(),
                creds.getLastError(),
                creds.getRateLimitResetAt()
        );
    }

    private String maskString(String value) {
        if (value == null || value.length() < 4) {
            return "****";
        }
        return value.substring(0, 2) + "****" + value.substring(value.length() - 2);
    }

    private FailedPostingResponse mapToFailedResponse(ExternalJobPosting posting) {
        return new FailedPostingResponse(
                posting.getId(),
                posting.getJobPosting().getId(),
                posting.getJobPosting().getJobReference(),
                posting.getJobPosting().getTitle(),
                posting.getTenantId(),
                posting.getPortal().name(),
                posting.getStatus().name(),
                posting.getErrorMessage(),
                posting.getRetryCount(),
                posting.getCreatedAt(),
                posting.getUpdatedAt()
        );
    }

    private ExternalPostingResponse mapToExternalPostingResponse(ExternalJobPosting posting) {
        return new ExternalPostingResponse(
                posting.getId(),
                posting.getJobPosting().getId(),
                posting.getJobPosting().getJobReference(),
                posting.getJobPosting().getTitle(),
                posting.getTenantId(),
                posting.getPortal().name(),
                posting.getExternalJobId(),
                posting.getExternalUrl(),
                posting.getStatus().name(),
                posting.getErrorMessage(),
                posting.getRetryCount(),
                posting.getPostedAt(),
                posting.getExpiresAt(),
                posting.getLastCheckedAt(),
                posting.getCreatedAt()
        );
    }
}
