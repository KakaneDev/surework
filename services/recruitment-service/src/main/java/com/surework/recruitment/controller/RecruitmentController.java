package com.surework.recruitment.controller;

import com.surework.recruitment.domain.*;
import com.surework.recruitment.dto.RecruitmentDto;
import com.surework.recruitment.integration.portals.JobPortalDistributionService;
import com.surework.recruitment.repository.ExternalJobPostingRepository;
import com.surework.recruitment.service.RecruitmentService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.surework.recruitment.domain.PlatformPortalCredentials;
import com.surework.recruitment.repository.PlatformPortalCredentialsRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for recruitment operations.
 *
 * Role-based access control:
 * - SUPER_ADMIN, TENANT_ADMIN: Full access
 * - HR_MANAGER: Full recruitment management
 * - RECRUITER: Manage job postings, candidates, applications, interviews
 * - HIRING_MANAGER: View candidates, provide interview feedback
 */
@RestController
@RequestMapping("/api/recruitment")
@PreAuthorize("isAuthenticated()")
public class RecruitmentController {

    private final RecruitmentService recruitmentService;
    private final JobPortalDistributionService portalDistributionService;
    private final ExternalJobPostingRepository externalJobPostingRepository;
    private final PlatformPortalCredentialsRepository portalCredentialsRepository;

    public RecruitmentController(
            RecruitmentService recruitmentService,
            JobPortalDistributionService portalDistributionService,
            ExternalJobPostingRepository externalJobPostingRepository,
            PlatformPortalCredentialsRepository portalCredentialsRepository) {
        this.recruitmentService = recruitmentService;
        this.portalDistributionService = portalDistributionService;
        this.externalJobPostingRepository = externalJobPostingRepository;
        this.portalCredentialsRepository = portalCredentialsRepository;
    }

    // === Job Posting Endpoints ===

    @PostMapping("/jobs")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.JobPostingResponse> createJob(
            @Valid @RequestBody RecruitmentDto.CreateJobRequest request) {
        RecruitmentDto.JobPostingResponse response = recruitmentService.createJob(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/jobs/{jobId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.JobPostingResponse> updateJob(
            @PathVariable UUID jobId,
            @Valid @RequestBody RecruitmentDto.UpdateJobRequest request) {
        RecruitmentDto.JobPostingResponse response = recruitmentService.updateJob(jobId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/jobs/{jobId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<RecruitmentDto.JobPostingResponse> getJob(@PathVariable UUID jobId) {
        return recruitmentService.getJob(jobId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/jobs/reference/{jobReference}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<RecruitmentDto.JobPostingResponse> getJobByReference(
            @PathVariable String jobReference) {
        return recruitmentService.getJobByReference(jobReference)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/jobs")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<Page<RecruitmentDto.JobPostingSummary>> searchJobs(
            @RequestParam(required = false) JobPosting.JobStatus status,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) JobPosting.EmploymentType employmentType,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) UUID clientId,
            Pageable pageable) {
        Page<RecruitmentDto.JobPostingSummary> jobs = recruitmentService.searchJobs(
                status, departmentId, employmentType, location, searchTerm, clientId, pageable);
        return ResponseEntity.ok(jobs);
    }

    @GetMapping("/jobs/public")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Page<RecruitmentDto.JobPostingSummary>> getPublicJobs(Pageable pageable) {
        Page<RecruitmentDto.JobPostingSummary> jobs = recruitmentService.getPublicJobs(pageable);
        return ResponseEntity.ok(jobs);
    }

    @PostMapping("/jobs/{jobId}/publish")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.JobPostingResponse> publishJob(
            @PathVariable UUID jobId,
            @RequestParam LocalDate closingDate) {
        RecruitmentDto.JobPostingResponse response = recruitmentService.publishJob(jobId, closingDate);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/jobs/{jobId}/hold")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.JobPostingResponse> putJobOnHold(@PathVariable UUID jobId) {
        RecruitmentDto.JobPostingResponse response = recruitmentService.putJobOnHold(jobId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/jobs/{jobId}/reopen")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.JobPostingResponse> reopenJob(@PathVariable UUID jobId) {
        RecruitmentDto.JobPostingResponse response = recruitmentService.reopenJob(jobId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/jobs/{jobId}/close")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.JobPostingResponse> closeJob(@PathVariable UUID jobId) {
        RecruitmentDto.JobPostingResponse response = recruitmentService.closeJob(jobId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/jobs/{jobId}/fill")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.JobPostingResponse> markJobAsFilled(@PathVariable UUID jobId) {
        RecruitmentDto.JobPostingResponse response = recruitmentService.markJobAsFilled(jobId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/jobs/{jobId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Void> cancelJob(@PathVariable UUID jobId) {
        recruitmentService.cancelJob(jobId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/jobs/{jobId}/view")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Void> incrementJobViews(@PathVariable UUID jobId) {
        recruitmentService.incrementJobViews(jobId);
        return ResponseEntity.ok().build();
    }

    // === Client Endpoints ===

    @PostMapping("/clients")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.ClientResponse> createClient(
            @Valid @RequestBody RecruitmentDto.CreateClientRequest request) {
        RecruitmentDto.ClientResponse response = recruitmentService.createClient(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/clients/{clientId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.ClientResponse> updateClient(
            @PathVariable UUID clientId,
            @Valid @RequestBody RecruitmentDto.UpdateClientRequest request) {
        RecruitmentDto.ClientResponse response = recruitmentService.updateClient(clientId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/clients/{clientId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<RecruitmentDto.ClientResponse> getClient(@PathVariable UUID clientId) {
        return recruitmentService.getClient(clientId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/clients")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<Page<RecruitmentDto.ClientResponse>> searchClients(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String searchTerm,
            Pageable pageable) {
        Page<RecruitmentDto.ClientResponse> clients = recruitmentService.searchClients(active, searchTerm, pageable);
        return ResponseEntity.ok(clients);
    }

    @GetMapping("/clients/active")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<List<RecruitmentDto.ClientSummary>> getActiveClients() {
        List<RecruitmentDto.ClientSummary> clients = recruitmentService.getActiveClients();
        return ResponseEntity.ok(clients);
    }

    @PostMapping("/clients/{clientId}/deactivate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Void> deactivateClient(@PathVariable UUID clientId) {
        recruitmentService.deactivateClient(clientId);
        return ResponseEntity.ok().build();
    }

    // === Candidate Endpoints ===

    @PostMapping("/candidates")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.CandidateResponse> createCandidate(
            @Valid @RequestBody RecruitmentDto.CreateCandidateRequest request) {
        RecruitmentDto.CandidateResponse response = recruitmentService.createCandidate(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/candidates/{candidateId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.CandidateResponse> updateCandidate(
            @PathVariable UUID candidateId,
            @Valid @RequestBody RecruitmentDto.UpdateCandidateRequest request) {
        RecruitmentDto.CandidateResponse response = recruitmentService.updateCandidate(candidateId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/candidates/{candidateId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<RecruitmentDto.CandidateResponse> getCandidate(@PathVariable UUID candidateId) {
        return recruitmentService.getCandidate(candidateId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/candidates/email/{email}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.CandidateResponse> getCandidateByEmail(@PathVariable String email) {
        return recruitmentService.getCandidateByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/candidates")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<Page<RecruitmentDto.CandidateResponse>> searchCandidates(
            @RequestParam(required = false) Candidate.CandidateStatus status,
            @RequestParam(required = false) String searchTerm,
            Pageable pageable) {
        Page<RecruitmentDto.CandidateResponse> candidates = recruitmentService.searchCandidates(
                status, searchTerm, pageable);
        return ResponseEntity.ok(candidates);
    }

    @PostMapping("/candidates/{candidateId}/blacklist")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Void> blacklistCandidate(
            @PathVariable UUID candidateId,
            @RequestParam String reason) {
        recruitmentService.blacklistCandidate(candidateId, reason);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/candidates/{candidateId}/blacklist")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Void> removeFromBlacklist(@PathVariable UUID candidateId) {
        recruitmentService.removeFromBlacklist(candidateId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/candidates/{candidateId}/archive")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<Void> archiveCandidate(@PathVariable UUID candidateId) {
        recruitmentService.archiveCandidate(candidateId);
        return ResponseEntity.ok().build();
    }

    // === Application Endpoints ===

    @PostMapping("/applications")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.ApplicationResponse> createApplication(
            @Valid @RequestBody RecruitmentDto.CreateApplicationRequest request) {
        RecruitmentDto.ApplicationResponse response = recruitmentService.createApplication(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/applications/{applicationId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<RecruitmentDto.ApplicationResponse> getApplication(
            @PathVariable UUID applicationId) {
        return recruitmentService.getApplication(applicationId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/applications/reference/{reference}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<RecruitmentDto.ApplicationResponse> getApplicationByReference(
            @PathVariable String reference) {
        return recruitmentService.getApplicationByReference(reference)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/jobs/{jobId}/applications")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<List<RecruitmentDto.ApplicationResponse>> getApplicationsForJob(
            @PathVariable UUID jobId) {
        List<RecruitmentDto.ApplicationResponse> applications = recruitmentService.getApplicationsForJob(jobId);
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/candidates/{candidateId}/applications")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<List<RecruitmentDto.ApplicationResponse>> getApplicationsForCandidate(
            @PathVariable UUID candidateId) {
        List<RecruitmentDto.ApplicationResponse> applications = recruitmentService.getApplicationsForCandidate(candidateId);
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/applications")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<Page<RecruitmentDto.ApplicationResponse>> searchApplications(
            @RequestParam(required = false) UUID jobId,
            @RequestParam(required = false) UUID candidateId,
            @RequestParam(required = false) Application.ApplicationStatus status,
            @RequestParam(required = false) Application.RecruitmentStage stage,
            Pageable pageable) {
        Page<RecruitmentDto.ApplicationResponse> applications = recruitmentService.searchApplications(
                jobId, candidateId, status, stage, pageable);
        return ResponseEntity.ok(applications);
    }

    @PostMapping("/applications/{applicationId}/screen")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.ApplicationResponse> moveToScreening(
            @PathVariable UUID applicationId) {
        RecruitmentDto.ApplicationResponse response = recruitmentService.moveToScreening(applicationId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/applications/{applicationId}/screen/complete")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.ApplicationResponse> completeScreening(
            @PathVariable UUID applicationId,
            @RequestParam int score,
            @RequestParam(required = false) String notes,
            @RequestParam UUID screenedBy) {
        RecruitmentDto.ApplicationResponse response = recruitmentService.completeScreening(
                applicationId, score, notes, screenedBy);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/applications/{applicationId}/shortlist")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.ApplicationResponse> shortlistApplication(
            @PathVariable UUID applicationId) {
        RecruitmentDto.ApplicationResponse response = recruitmentService.shortlistApplication(applicationId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/applications/{applicationId}/interview")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.ApplicationResponse> moveToInterview(
            @PathVariable UUID applicationId,
            @RequestParam Application.RecruitmentStage stage) {
        RecruitmentDto.ApplicationResponse response = recruitmentService.moveToInterview(applicationId, stage);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/applications/{applicationId}/offer")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER')")
    public ResponseEntity<RecruitmentDto.ApplicationResponse> makeOffer(
            @PathVariable UUID applicationId,
            @RequestParam BigDecimal salary,
            @RequestParam LocalDate expiryDate,
            @RequestParam LocalDate startDate) {
        RecruitmentDto.ApplicationResponse response = recruitmentService.makeOffer(
                applicationId, salary, expiryDate, startDate);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/applications/{applicationId}/offer/accept")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.ApplicationResponse> acceptOffer(
            @PathVariable UUID applicationId) {
        RecruitmentDto.ApplicationResponse response = recruitmentService.acceptOffer(applicationId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/applications/{applicationId}/offer/decline")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.ApplicationResponse> declineOffer(
            @PathVariable UUID applicationId,
            @RequestParam String reason) {
        RecruitmentDto.ApplicationResponse response = recruitmentService.declineOffer(applicationId, reason);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/applications/{applicationId}/hire")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER')")
    public ResponseEntity<RecruitmentDto.ApplicationResponse> markAsHired(
            @PathVariable UUID applicationId) {
        RecruitmentDto.ApplicationResponse response = recruitmentService.markAsHired(applicationId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/applications/{applicationId}/reject")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.ApplicationResponse> rejectApplication(
            @PathVariable UUID applicationId,
            @RequestParam String reason,
            @RequestParam(required = false) String notes,
            @RequestParam UUID rejectedBy) {
        RecruitmentDto.ApplicationResponse response = recruitmentService.rejectApplication(
                applicationId, reason, notes, rejectedBy);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/applications/{applicationId}/withdraw")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.ApplicationResponse> withdrawApplication(
            @PathVariable UUID applicationId,
            @RequestParam String reason) {
        RecruitmentDto.ApplicationResponse response = recruitmentService.withdrawApplication(applicationId, reason);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/applications/{applicationId}/star")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<Void> toggleStarred(@PathVariable UUID applicationId) {
        recruitmentService.toggleStarred(applicationId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/applications/{applicationId}/rating")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<Void> updateApplicationRating(
            @PathVariable UUID applicationId,
            @RequestParam int rating) {
        recruitmentService.updateApplicationRating(applicationId, rating);
        return ResponseEntity.ok().build();
    }

    // === Interview Endpoints ===

    @PostMapping("/interviews")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.InterviewResponse> scheduleInterview(
            @Valid @RequestBody RecruitmentDto.ScheduleInterviewRequest request) {
        RecruitmentDto.InterviewResponse response = recruitmentService.scheduleInterview(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/interviews/{interviewId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<RecruitmentDto.InterviewResponse> getInterview(@PathVariable UUID interviewId) {
        return recruitmentService.getInterview(interviewId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/applications/{applicationId}/interviews")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<List<RecruitmentDto.InterviewResponse>> getInterviewsForApplication(
            @PathVariable UUID applicationId) {
        List<RecruitmentDto.InterviewResponse> interviews = recruitmentService.getInterviewsForApplication(applicationId);
        return ResponseEntity.ok(interviews);
    }

    @GetMapping("/interviewers/{interviewerId}/upcoming")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<List<RecruitmentDto.InterviewResponse>> getUpcomingInterviewsForInterviewer(
            @PathVariable UUID interviewerId) {
        List<RecruitmentDto.InterviewResponse> interviews = recruitmentService.getUpcomingInterviewsForInterviewer(interviewerId);
        return ResponseEntity.ok(interviews);
    }

    @GetMapping("/interviews")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<Page<RecruitmentDto.InterviewResponse>> searchInterviews(
            @RequestParam(required = false) UUID interviewerId,
            @RequestParam(required = false) Interview.InterviewStatus status,
            @RequestParam(required = false) Interview.InterviewType type,
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate,
            Pageable pageable) {
        Page<RecruitmentDto.InterviewResponse> interviews = recruitmentService.searchInterviews(
                interviewerId, status, type, startDate, endDate, pageable);
        return ResponseEntity.ok(interviews);
    }

    @PostMapping("/interviews/{interviewId}/confirm")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.InterviewResponse> confirmInterview(
            @PathVariable UUID interviewId) {
        RecruitmentDto.InterviewResponse response = recruitmentService.confirmInterview(interviewId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/interviews/{interviewId}/start")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<RecruitmentDto.InterviewResponse> startInterview(
            @PathVariable UUID interviewId) {
        RecruitmentDto.InterviewResponse response = recruitmentService.startInterview(interviewId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/interviews/{interviewId}/complete")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<RecruitmentDto.InterviewResponse> completeInterview(
            @PathVariable UUID interviewId) {
        RecruitmentDto.InterviewResponse response = recruitmentService.completeInterview(interviewId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/interviews/{interviewId}/feedback")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<RecruitmentDto.InterviewResponse> submitFeedback(
            @PathVariable UUID interviewId,
            @Valid @RequestBody RecruitmentDto.InterviewFeedbackRequest feedback) {
        RecruitmentDto.InterviewResponse response = recruitmentService.submitFeedback(interviewId, feedback);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/interviews/{interviewId}/cancel")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.InterviewResponse> cancelInterview(
            @PathVariable UUID interviewId,
            @RequestParam String reason) {
        RecruitmentDto.InterviewResponse response = recruitmentService.cancelInterview(interviewId, reason);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/interviews/{interviewId}/no-show")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<RecruitmentDto.InterviewResponse> markAsNoShow(
            @PathVariable UUID interviewId) {
        RecruitmentDto.InterviewResponse response = recruitmentService.markAsNoShow(interviewId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/interviews/{interviewId}/reschedule")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.InterviewResponse> rescheduleInterview(
            @PathVariable UUID interviewId,
            @RequestParam LocalDateTime newDateTime,
            @RequestParam String reason) {
        RecruitmentDto.InterviewResponse response = recruitmentService.rescheduleInterview(
                interviewId, newDateTime, reason);
        return ResponseEntity.ok(response);
    }

    // === Dashboard & Reporting Endpoints ===

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.RecruitmentDashboard> getDashboard() {
        RecruitmentDto.RecruitmentDashboard dashboard = recruitmentService.getDashboard();
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/pipeline")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<List<RecruitmentDto.PipelineStage>> getPipelineSummary() {
        List<RecruitmentDto.PipelineStage> pipeline = recruitmentService.getPipelineSummary();
        return ResponseEntity.ok(pipeline);
    }

    @GetMapping("/interviews/today")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<List<RecruitmentDto.InterviewResponse>> getTodaysInterviews() {
        List<RecruitmentDto.InterviewResponse> interviews = recruitmentService.getTodaysInterviews();
        return ResponseEntity.ok(interviews);
    }

    @GetMapping("/interviews/upcoming")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER')")
    public ResponseEntity<List<RecruitmentDto.InterviewResponse>> getUpcomingInterviews() {
        List<RecruitmentDto.InterviewResponse> interviews = recruitmentService.getUpcomingInterviews();
        return ResponseEntity.ok(interviews);
    }

    @GetMapping("/applications/stale")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<List<RecruitmentDto.ApplicationResponse>> getStaleApplications(
            @RequestParam(defaultValue = "14") int daysOld) {
        List<RecruitmentDto.ApplicationResponse> applications = recruitmentService.getStaleApplications(daysOld);
        return ResponseEntity.ok(applications);
    }

    /**
     * Get the hiring manager's user ID for a job posting.
     * Used by notification service to route notifications.
     * Internal service-to-service call, requires authentication.
     */
    @GetMapping("/jobs/{jobId}/hiring-manager-user-id")
    public ResponseEntity<UserIdResponse> getHiringManagerUserId(@PathVariable UUID jobId) {
        return recruitmentService.getHiringManagerUserId(jobId)
                .map(userId -> ResponseEntity.ok(new UserIdResponse(userId)))
                .orElse(ResponseEntity.notFound().build());
    }

    record UserIdResponse(UUID userId) {}

    // === Post to Portals Endpoint ===

    /**
     * Queue a job for posting to selected external portals.
     * Updates the job's portal settings and creates ExternalJobPosting records.
     */
    @PostMapping("/jobs/{jobId}/post-to-portals")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<Void> postToPortals(
            @PathVariable UUID jobId,
            @Valid @RequestBody RecruitmentDto.PostToPortalsRequest request) {
        JobPosting job = recruitmentService.getJobEntity(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found: " + jobId));

        // Update the job posting with selected portals and preferences
        job.setPublishToExternal(true);
        job.setExternalPortalSet(new java.util.HashSet<>(request.portals()));
        if (request.companyMentionPreference() != null) {
            job.setCompanyMentionPreference(request.companyMentionPreference());
        }
        recruitmentService.saveJobPosting(job);

        // Queue for distribution to selected portals
        portalDistributionService.queueForDistribution(job);

        return ResponseEntity.accepted().build();
    }

    // === Portal Status Endpoint (tenant-facing) ===

    /**
     * Returns the connection status of all job portals.
     * Returns real data from the platform_portal_credentials table.
     */
    @GetMapping("/portals/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<List<RecruitmentDto.PortalStatusResponse>> getPortalStatuses() {
        List<PlatformPortalCredentials> allCreds = portalCredentialsRepository.findAll();
        List<RecruitmentDto.PortalStatusResponse> statuses = allCreds.stream()
                .map(RecruitmentDto.PortalStatusResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(statuses);
    }

    // === External Job Posting Endpoints ===

    @GetMapping("/jobs/{jobId}/external-postings")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<List<RecruitmentDto.ExternalJobPostingResponse>> getExternalPostingsForJob(
            @PathVariable UUID jobId) {
        List<ExternalJobPosting> postings = externalJobPostingRepository.findByJobPostingIdWithJob(jobId);
        List<RecruitmentDto.ExternalJobPostingResponse> responses = postings.stream()
                .map(RecruitmentDto.ExternalJobPostingResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/external-postings")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<Page<RecruitmentDto.ExternalJobPostingResponse>> searchExternalPostings(
            @RequestParam(required = false) ExternalJobPosting.ExternalPostingStatus status,
            @RequestParam(required = false) JobPosting.JobPortal portal,
            @RequestParam(required = false) UUID tenantId,
            Pageable pageable) {
        Page<ExternalJobPosting> postings = externalJobPostingRepository.searchWithJob(status, portal, tenantId, pageable);
        Page<RecruitmentDto.ExternalJobPostingResponse> responses = postings
                .map(RecruitmentDto.ExternalJobPostingResponse::fromEntity);
        return ResponseEntity.ok(responses);
    }

    @PostMapping("/external-postings/{externalPostingId}/retry")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER')")
    public ResponseEntity<RecruitmentDto.ExternalJobPostingResponse> retryExternalPosting(
            @PathVariable UUID externalPostingId) {
        ExternalJobPosting posting = portalDistributionService.retryPosting(externalPostingId);
        return ResponseEntity.ok(RecruitmentDto.ExternalJobPostingResponse.fromEntity(posting));
    }

    @PostMapping("/external-postings/{externalPostingId}/resolve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<Void> resolveExternalPosting(
            @PathVariable UUID externalPostingId,
            @RequestParam String externalJobId,
            @RequestParam String externalUrl) {
        portalDistributionService.markAsManuallyResolved(externalPostingId, externalJobId, externalUrl);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/external-postings/{externalPostingId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER')")
    public ResponseEntity<RecruitmentDto.ExternalJobPostingResponse> removeExternalPosting(
            @PathVariable UUID externalPostingId) {
        ExternalJobPosting posting = portalDistributionService.removeFromPortal(externalPostingId);
        return ResponseEntity.ok(RecruitmentDto.ExternalJobPostingResponse.fromEntity(posting));
    }

    @GetMapping("/external-postings/requires-manual")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN')")
    public ResponseEntity<List<RecruitmentDto.ExternalJobPostingResponse>> getPostingsRequiringManual() {
        List<ExternalJobPosting> postings = portalDistributionService.getPostingsRequiringManualIntervention();
        List<RecruitmentDto.ExternalJobPostingResponse> responses = postings.stream()
                .map(RecruitmentDto.ExternalJobPostingResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(responses);
    }

    // === Analytics Endpoints ===

    @GetMapping("/analytics/portal-performance")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.PortalPerformanceStats> getPortalPerformanceStats() {
        return ResponseEntity.ok(recruitmentService.getPortalPerformanceStats());
    }

    @GetMapping("/analytics/portal-performance/{portal}/jobs")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<Page<RecruitmentDto.ExternalJobPostingResponse>> getPortalJobs(
            @PathVariable JobPosting.JobPortal portal,
            Pageable pageable) {
        Page<RecruitmentDto.ExternalJobPostingResponse> page = externalJobPostingRepository
                .findByPortalWithJob(portal, pageable)
                .map(RecruitmentDto.ExternalJobPostingResponse::fromEntity);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/analytics/advert-performance")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.AdvertPerformanceStats> getAdvertPerformanceStats() {
        return ResponseEntity.ok(recruitmentService.getAdvertPerformanceStats());
    }

    @GetMapping("/analytics/source-effectiveness")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.SourceEffectivenessStats> getSourceEffectivenessStats() {
        return ResponseEntity.ok(recruitmentService.getSourceEffectivenessStats());
    }

    @GetMapping("/analytics/offer-acceptance")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'RECRUITER')")
    public ResponseEntity<RecruitmentDto.OfferAcceptanceStats> getOfferAcceptanceStats() {
        return ResponseEntity.ok(recruitmentService.getOfferAcceptanceStats());
    }

    @GetMapping("/external-postings/stats")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER')")
    public ResponseEntity<RecruitmentDto.ExternalPostingStats> getExternalPostingStats() {
        long pending = externalJobPostingRepository.countByStatus(ExternalJobPosting.ExternalPostingStatus.PENDING);
        long posted = externalJobPostingRepository.countByStatus(ExternalJobPosting.ExternalPostingStatus.POSTED);
        long failed = externalJobPostingRepository.countByStatus(ExternalJobPosting.ExternalPostingStatus.FAILED);
        long requiresManual = externalJobPostingRepository.countByStatus(ExternalJobPosting.ExternalPostingStatus.REQUIRES_MANUAL);

        // Get per-portal stats
        java.time.LocalDateTime startOfDay = java.time.LocalDate.now().atStartOfDay();
        List<RecruitmentDto.PortalStats> portalStats = java.util.Arrays.stream(JobPosting.JobPortal.values())
                .map(portal -> new RecruitmentDto.PortalStats(
                        portal,
                        externalJobPostingRepository.countByPortal(portal), // pending
                        externalJobPostingRepository.countByPortal(portal), // posted
                        0L, // failed
                        externalJobPostingRepository.countPostedTodayByPortal(portal, startOfDay)
                ))
                .toList();

        RecruitmentDto.ExternalPostingStats stats = new RecruitmentDto.ExternalPostingStats(
                pending, posted, failed, requiresManual, portalStats);
        return ResponseEntity.ok(stats);
    }
}
