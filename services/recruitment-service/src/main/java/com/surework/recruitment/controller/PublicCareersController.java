package com.surework.recruitment.controller;

import com.surework.common.messaging.DomainEventPublisher;
import com.surework.common.messaging.event.RecruitmentEvent;
import com.surework.common.security.TenantContext;
import com.surework.recruitment.domain.Application;
import com.surework.recruitment.domain.Candidate;
import com.surework.recruitment.domain.JobPosting;
import com.surework.recruitment.dto.RecruitmentDto;
import com.surework.recruitment.domain.Client;
import com.surework.recruitment.repository.ApplicationRepository;
import com.surework.recruitment.repository.CandidateRepository;
import com.surework.recruitment.repository.ClientRepository;
import com.surework.recruitment.repository.JobPostingRepository;
import com.surework.recruitment.service.ResumeStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Public API for the careers page.
 * No authentication required - these endpoints are for job seekers.
 */
@RestController
@RequestMapping("/api/public/careers")
@Tag(name = "Public Careers", description = "Public job listings and application submission")
public class PublicCareersController {

    private static final Logger log = LoggerFactory.getLogger(PublicCareersController.class);

    private final JobPostingRepository jobPostingRepository;
    private final ApplicationRepository applicationRepository;
    private final CandidateRepository candidateRepository;
    private final ClientRepository clientRepository;
    private final ResumeStorageService resumeStorageService;
    private final DomainEventPublisher eventPublisher;

    public PublicCareersController(
            JobPostingRepository jobPostingRepository,
            ApplicationRepository applicationRepository,
            CandidateRepository candidateRepository,
            ClientRepository clientRepository,
            ResumeStorageService resumeStorageService,
            DomainEventPublisher eventPublisher) {
        this.jobPostingRepository = jobPostingRepository;
        this.applicationRepository = applicationRepository;
        this.candidateRepository = candidateRepository;
        this.clientRepository = clientRepository;
        this.resumeStorageService = resumeStorageService;
        this.eventPublisher = eventPublisher;
    }

    // ==================== DTOs ====================

    public record PublicJobResponse(
            UUID id,
            String jobReference,
            String title,
            String description,
            String requirements,
            String responsibilities,
            String location,
            String city,
            String province,
            String employmentType,
            boolean remote,
            BigDecimal salaryMin,
            BigDecimal salaryMax,
            String salaryCurrency,
            String salaryFrequency,
            boolean hideSalary,
            String industry,
            Integer experienceYearsMin,
            Integer experienceYearsMax,
            String educationLevel,
            List<String> skills,
            List<String> benefits,
            LocalDate publishedAt,
            LocalDate closingDate,
            String companyDescription,
            String clientName,
            String projectName
    ) {}

    public record JobSearchRequest(
            String keyword,
            String location,
            String province,
            String employmentType,
            String industry,
            Boolean remote,
            int page,
            int size,
            String sortBy,
            String sortDirection
    ) {}

    public record ApplicationRequest(
            @NotNull UUID jobPostingId,
            @NotBlank String firstName,
            @NotBlank String lastName,
            @NotBlank @Email String email,
            @NotBlank String phone,
            String linkedInUrl,
            String portfolioUrl,
            String coverLetter,
            String resumeBase64,
            String resumeFileName,
            String noticePeriod,
            BigDecimal expectedSalary,
            String source,
            String referredBy,
            String additionalInfo
    ) {}

    public record ApplicationResponse(
            UUID id,
            String applicationReference,
            String status,
            LocalDateTime submittedAt,
            String message
    ) {}

    public record JobCountsResponse(
            long total,
            Map<String, Long> byLocation,
            Map<String, Long> byType
    ) {}

    public record OfferDetailsResponse(
            String candidateName,
            String jobTitle,
            String department,
            String location,
            BigDecimal offerSalary,
            String salaryCurrency,
            LocalDate startDate,
            LocalDate expiryDate,
            String status
    ) {}

    public record DeclineOfferRequest(
            String reason
    ) {}

    // ==================== Endpoints ====================

    @GetMapping("/jobs")
    @Operation(summary = "Search published jobs", description = "Search and filter published job postings")
    public ResponseEntity<Page<PublicJobResponse>> searchJobs(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String province,
            @RequestParam(required = false) String employmentType,
            @RequestParam(required = false) String industry,
            @RequestParam(required = false) Boolean remote,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "postingDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {

        // Set tenant context for RLS — public endpoints have no JWT authentication
        TenantContext.setTenantId(tenantId);

        log.debug("Public job search: keyword={}, location={}, page={}, tenant={}", keyword, location, page, tenantId);

        Sort sort = "desc".equalsIgnoreCase(sortDirection)
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, Math.min(size, 50), sort);

        // Convert string parameters to enums if provided
        JobPosting.EmploymentType empType = null;
        if (employmentType != null && !employmentType.isBlank()) {
            try {
                empType = JobPosting.EmploymentType.valueOf(employmentType);
            } catch (IllegalArgumentException ignored) {}
        }

        JobPosting.Province prov = null;
        if (province != null && !province.isBlank()) {
            try {
                prov = JobPosting.Province.valueOf(province);
            } catch (IllegalArgumentException ignored) {}
        }

        JobPosting.Industry ind = null;
        if (industry != null && !industry.isBlank()) {
            try {
                ind = JobPosting.Industry.valueOf(industry);
            } catch (IllegalArgumentException ignored) {}
        }

        Page<JobPosting> jobs = jobPostingRepository.searchPublishedJobs(
                keyword, location, prov, empType, ind, remote, pageable);

        return ResponseEntity.ok(jobs.map(this::mapToPublicResponse));
    }

    @GetMapping("/jobs/{jobReference}")
    @Operation(summary = "Get job by reference", description = "Get a published job posting by its reference code")
    public ResponseEntity<PublicJobResponse> getJobByReference(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @PathVariable String jobReference) {
        TenantContext.setTenantId(tenantId);
        log.debug("Public job lookup: {} (tenant: {})", jobReference, tenantId);

        return jobPostingRepository.findByJobReferenceAndStatus(jobReference, JobPosting.JobStatus.OPEN)
                .map(this::mapToPublicResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/jobs/featured")
    @Operation(summary = "Get featured jobs", description = "Get a list of featured/recent job postings")
    public ResponseEntity<List<PublicJobResponse>> getFeaturedJobs(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @RequestParam(defaultValue = "6") int limit) {

        TenantContext.setTenantId(tenantId);
        Pageable pageable = PageRequest.of(0, Math.min(limit, 12),
                Sort.by("postingDate").descending());

        List<PublicJobResponse> jobs = jobPostingRepository
                .findByStatus(JobPosting.JobStatus.OPEN, pageable)
                .stream()
                .map(this::mapToPublicResponse)
                .toList();

        return ResponseEntity.ok(jobs);
    }

    @GetMapping("/jobs/counts")
    @Operation(summary = "Get job counts", description = "Get job count summary")
    public ResponseEntity<JobCountsResponse> getJobCounts(
            @RequestHeader("X-Tenant-Id") UUID tenantId) {
        TenantContext.setTenantId(tenantId);
        long total = jobPostingRepository.countByStatus(JobPosting.JobStatus.OPEN);

        // These would need custom queries - returning empty for now
        return ResponseEntity.ok(new JobCountsResponse(total, Map.of(), Map.of()));
    }

    @PostMapping("/apply")
    @Operation(summary = "Submit application", description = "Submit a job application")
    public ResponseEntity<ApplicationResponse> submitApplication(
            @RequestHeader("X-Tenant-Id") UUID tenantId,
            @Valid @RequestBody ApplicationRequest request) {

        TenantContext.setTenantId(tenantId);
        log.info("Receiving application for job {} from {} (tenant: {})", request.jobPostingId(), request.email(), tenantId);

        // Validate job exists and is published
        JobPosting job = jobPostingRepository.findById(request.jobPostingId())
                .filter(j -> j.getStatus() == JobPosting.JobStatus.OPEN)
                .orElseThrow(() -> new IllegalArgumentException("Job posting not found or not available"));

        // Check if already applied (by email)
        if (applicationRepository.existsByJobPostingIdAndEmail(job.getId(), request.email())) {
            return ResponseEntity.badRequest().body(new ApplicationResponse(
                    null,
                    null,
                    "DUPLICATE",
                    LocalDateTime.now(),
                    "You have already applied for this position"
            ));
        }

        // Find or create a Candidate profile for the applicant
        Candidate candidate = candidateRepository.findByEmail(request.email())
                .orElseGet(() -> {
                    Candidate c = Candidate.create(request.firstName(), request.lastName(), request.email());
                    c.setPhone(request.phone());
                    c.setTenantId(job.getTenantId());
                    c.setSource("careers_page");
                    c.setLinkedinUrl(request.linkedInUrl());
                    c.setPortfolioUrl(request.portfolioUrl());
                    c.setExpectedSalary(request.expectedSalary());
                    c.setReferredBy(request.referredBy());
                    return candidateRepository.save(c);
                });

        // Create application linked to the Candidate
        Application application = Application.create(candidate, job);
        application.setTenantId(job.getTenantId());
        application.setFirstName(request.firstName());
        application.setLastName(request.lastName());
        application.setEmail(request.email());
        application.setPhone(request.phone());
        application.setAppliedAt(LocalDateTime.now());
        application.setStatus(Application.ApplicationStatus.RECEIVED);
        application.setSource("careers_page");

        // Set optional fields
        application.setLinkedInUrl(request.linkedInUrl());
        application.setPortfolioUrl(request.portfolioUrl());
        application.setCoverLetter(request.coverLetter());
        application.setNoticePeriod(request.noticePeriod());
        application.setExpectedSalary(request.expectedSalary());
        application.setReferredBy(request.referredBy());
        application.setAdditionalNotes(request.additionalInfo());
        if (request.source() != null && !request.source().isBlank()) {
            application.setSource(request.source());
        }

        // Handle resume upload (base64)
        if (request.resumeBase64() != null && !request.resumeBase64().isBlank()) {
            // Generate a temporary candidate ID for storage path organization
            UUID candidateId = UUID.randomUUID();
            String applicationRef = application.getApplicationReference();

            ResumeStorageService.ResumeStorageResult storageResult = resumeStorageService.storeResume(
                    request.resumeBase64(),
                    request.resumeFileName(),
                    candidateId,
                    applicationRef
            );

            if (storageResult.success()) {
                application.setResumeFileId(storageResult.documentId());
                application.setResumeFileName(storageResult.fileName());
                log.info("Resume stored successfully for application {}: documentRef={}",
                        applicationRef, storageResult.documentReference());

                // If pending upload, add note
                if (storageResult.pendingUpload()) {
                    String existingNotes = application.getAdditionalNotes();
                    application.setAdditionalNotes(
                            (existingNotes != null ? existingNotes + "\n" : "") +
                                    "[Resume pending upload: " + storageResult.documentReference() + "]"
                    );
                }
            } else {
                log.warn("Failed to store resume for application {}: {}",
                        applicationRef, storageResult.message());
                // Still proceed with application, just note the failure
                application.setResumeFileName(request.resumeFileName());
                String existingNotes = application.getAdditionalNotes();
                application.setAdditionalNotes(
                        (existingNotes != null ? existingNotes + "\n" : "") +
                                "[Resume upload failed: " + storageResult.message() + "]"
                );
            }
        }

        application = applicationRepository.save(application);

        // Increment the denormalized application count on the job posting
        job.incrementApplicationCount();
        jobPostingRepository.save(job);

        log.info("Application created: {} for job {}", application.getApplicationReference(), job.getJobReference());

        // Publish ApplicationReceived event to notify recruitment team
        publishApplicationReceivedEvent(application, job);

        return ResponseEntity.ok(new ApplicationResponse(
                application.getId(),
                application.getApplicationReference(),
                application.getStatus().name(),
                application.getAppliedAt(),
                "Your application has been submitted successfully. We will review it and get back to you soon."
        ));
    }

    /**
     * Publish ApplicationReceived event for notification and workflow triggers.
     */
    private void publishApplicationReceivedEvent(Application application, JobPosting job) {
        try {
            var event = new RecruitmentEvent.ApplicationReceived(
                    UUID.randomUUID(),
                    job.getTenantId(),
                    Instant.now(),
                    application.getId(),
                    job.getId(),
                    application.getApplicantFullName(),
                    application.getApplicantEmail()
            );

            eventPublisher.publish(event);
            log.debug("Published ApplicationReceived event for application {}", application.getApplicationReference());
        } catch (Exception e) {
            // Log but don't fail the application submission
            log.error("Failed to publish ApplicationReceived event for application {}: {}",
                    application.getApplicationReference(), e.getMessage(), e);
        }
    }

    // ==================== Offer Endpoints ====================

    @GetMapping("/offer/{token}")
    @Operation(summary = "Get offer details", description = "View offer details by token")
    public ResponseEntity<OfferDetailsResponse> getOfferDetails(@PathVariable String token) {
        log.debug("Public offer lookup: token={}", token);

        return applicationRepository.findByOfferToken(token)
                .map(application -> {
                    JobPosting job = application.getJobPosting();
                    return ResponseEntity.ok(new OfferDetailsResponse(
                            application.getApplicantFullName(),
                            job.getTitle(),
                            job.getDepartmentName(),
                            job.getLocation(),
                            application.getOfferSalary(),
                            job.getSalaryCurrency() != null ? job.getSalaryCurrency() : "ZAR",
                            application.getExpectedStartDate(),
                            application.getOfferExpiryDate(),
                            application.getStatus().name()
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/offer/{token}/accept")
    @Transactional
    @Operation(summary = "Accept offer", description = "Accept a job offer by token")
    public ResponseEntity<Map<String, String>> acceptOffer(@PathVariable String token) {
        log.info("Offer acceptance: token={}", token);

        Application application = applicationRepository.findByOfferToken(token)
                .orElse(null);

        if (application == null) {
            return ResponseEntity.notFound().build();
        }

        if (application.getStatus() != Application.ApplicationStatus.OFFER_MADE) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "This offer has already been responded to.",
                    "status", application.getStatus().name()
            ));
        }

        if (application.getOfferExpiryDate() != null && application.getOfferExpiryDate().isBefore(LocalDate.now())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "This offer has expired.",
                    "status", "EXPIRED"
            ));
        }

        application.acceptOffer();
        applicationRepository.save(application);

        // Publish OfferAccepted event with contract data
        JobPosting job = application.getJobPosting();
        try {
            Instant startDateInstant = application.getExpectedStartDate() != null
                    ? application.getExpectedStartDate().atStartOfDay(java.time.ZoneId.of("Africa/Johannesburg")).toInstant()
                    : null;
            String employmentType = job.getEmploymentType() != null ? job.getEmploymentType().name() : "FULL_TIME";
            String currency = job.getSalaryCurrency() != null ? job.getSalaryCurrency() : "ZAR";

            eventPublisher.publish(new RecruitmentEvent.OfferAccepted(
                    UUID.randomUUID(),
                    application.getTenantId(),
                    Instant.now(),
                    application.getId(),
                    job.getId(),
                    application.getApplicantFullName(),
                    application.getApplicantEmail(),
                    job.getHiringManagerId(),
                    job.getTitle(),
                    job.getDepartmentName(),
                    job.getLocation(),
                    employmentType,
                    application.getOfferSalary(),
                    currency,
                    startDateInstant,
                    "08:00 - 17:00, Monday to Friday"
            ));
        } catch (Exception e) {
            log.error("Failed to publish OfferAccepted event: {}", e.getMessage(), e);
        }

        return ResponseEntity.ok(Map.of("message", "Offer accepted successfully. Congratulations!"));
    }

    @PostMapping("/offer/{token}/decline")
    @Transactional
    @Operation(summary = "Decline offer", description = "Decline a job offer by token")
    public ResponseEntity<Map<String, String>> declineOffer(
            @PathVariable String token,
            @RequestBody(required = false) DeclineOfferRequest request) {
        log.info("Offer decline: token={}", token);

        Application application = applicationRepository.findByOfferToken(token)
                .orElse(null);

        if (application == null) {
            return ResponseEntity.notFound().build();
        }

        if (application.getStatus() != Application.ApplicationStatus.OFFER_MADE) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "This offer has already been responded to.",
                    "status", application.getStatus().name()
            ));
        }

        String reason = (request != null && request.reason() != null) ? request.reason() : "No reason provided";
        application.declineOffer(reason);
        applicationRepository.save(application);

        // Publish OfferDeclined event
        JobPosting job = application.getJobPosting();
        try {
            eventPublisher.publish(new RecruitmentEvent.OfferDeclined(
                    UUID.randomUUID(),
                    application.getTenantId(),
                    Instant.now(),
                    application.getId(),
                    job.getId(),
                    application.getApplicantFullName(),
                    application.getApplicantEmail(),
                    job.getHiringManagerId(),
                    reason
            ));
        } catch (Exception e) {
            log.error("Failed to publish OfferDeclined event: {}", e.getMessage(), e);
        }

        return ResponseEntity.ok(Map.of("message", "Offer declined. Thank you for your consideration."));
    }

    // ==================== Helper Methods ====================

    private PublicJobResponse mapToPublicResponse(JobPosting job) {
        // Resolve client name based on visibility setting
        String clientName = resolvePublicClientName(job);

        return new PublicJobResponse(
                job.getId(),
                job.getJobReference(),
                job.getTitle(),
                job.getDescription(),
                job.getRequirements(),
                job.getResponsibilities(),
                job.getLocation(),
                job.getCity(),
                job.getProvince() != null ? job.getProvince().name() : null,
                job.getEmploymentType() != null ? job.getEmploymentType().name() : null,
                job.isRemote(),
                job.getSalaryMin(),
                job.getSalaryMax(),
                job.getSalaryCurrency() != null ? job.getSalaryCurrency() : "ZAR",
                job.getCompensationType() != null ? job.getCompensationType().name() : "MONTHLY",
                !job.isShowSalary(),
                job.getIndustry() != null ? job.getIndustry().name() : null,
                job.getExperienceYearsMin(),
                job.getExperienceYearsMax(),
                job.getEducationLevel() != null ? job.getEducationLevel().name() : null,
                job.getSkills() != null ? List.of(job.getSkills().split(",")) : List.of(),
                job.getBenefits() != null ? List.of(job.getBenefits().split(",")) : List.of(),
                job.getPostingDate(),
                job.getClosingDate(),
                null, // Company description would come from tenant settings
                clientName,
                job.getProjectName()
        );
    }

    /**
     * Resolve client name for public display based on the visibility setting.
     */
    private String resolvePublicClientName(JobPosting job) {
        if (job.getClientId() == null || job.getClientVisibility() == null) {
            return null;
        }
        return switch (job.getClientVisibility()) {
            case SHOW_NAME -> clientRepository.findById(job.getClientId())
                    .filter(c -> !c.isDeleted())
                    .map(Client::getName)
                    .orElse(null);
            case CONFIDENTIAL -> "Confidential Client";
            case HIDDEN -> null;
        };
    }
}
