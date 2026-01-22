package com.surework.recruitment.controller;

import com.surework.recruitment.domain.*;
import com.surework.recruitment.dto.RecruitmentDto;
import com.surework.recruitment.service.RecruitmentService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for recruitment operations.
 */
@RestController
@RequestMapping("/api/recruitment")
public class RecruitmentController {

    private final RecruitmentService recruitmentService;

    public RecruitmentController(RecruitmentService recruitmentService) {
        this.recruitmentService = recruitmentService;
    }

    // === Job Posting Endpoints ===

    @PostMapping("/jobs")
    public ResponseEntity<RecruitmentDto.JobPostingResponse> createJob(
            @Valid @RequestBody RecruitmentDto.CreateJobRequest request) {
        RecruitmentDto.JobPostingResponse response = recruitmentService.createJob(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/jobs/{jobId}")
    public ResponseEntity<RecruitmentDto.JobPostingResponse> updateJob(
            @PathVariable UUID jobId,
            @Valid @RequestBody RecruitmentDto.UpdateJobRequest request) {
        RecruitmentDto.JobPostingResponse response = recruitmentService.updateJob(jobId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<RecruitmentDto.JobPostingResponse> getJob(@PathVariable UUID jobId) {
        return recruitmentService.getJob(jobId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/jobs/reference/{jobReference}")
    public ResponseEntity<RecruitmentDto.JobPostingResponse> getJobByReference(
            @PathVariable String jobReference) {
        return recruitmentService.getJobByReference(jobReference)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/jobs")
    public ResponseEntity<Page<RecruitmentDto.JobPostingSummary>> searchJobs(
            @RequestParam(required = false) JobPosting.JobStatus status,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) JobPosting.EmploymentType employmentType,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String searchTerm,
            Pageable pageable) {
        Page<RecruitmentDto.JobPostingSummary> jobs = recruitmentService.searchJobs(
                status, departmentId, employmentType, location, searchTerm, pageable);
        return ResponseEntity.ok(jobs);
    }

    @GetMapping("/jobs/public")
    public ResponseEntity<Page<RecruitmentDto.JobPostingSummary>> getPublicJobs(Pageable pageable) {
        Page<RecruitmentDto.JobPostingSummary> jobs = recruitmentService.getPublicJobs(pageable);
        return ResponseEntity.ok(jobs);
    }

    @PostMapping("/jobs/{jobId}/publish")
    public ResponseEntity<RecruitmentDto.JobPostingResponse> publishJob(
            @PathVariable UUID jobId,
            @RequestParam LocalDate closingDate) {
        RecruitmentDto.JobPostingResponse response = recruitmentService.publishJob(jobId, closingDate);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/jobs/{jobId}/hold")
    public ResponseEntity<RecruitmentDto.JobPostingResponse> putJobOnHold(@PathVariable UUID jobId) {
        RecruitmentDto.JobPostingResponse response = recruitmentService.putJobOnHold(jobId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/jobs/{jobId}/reopen")
    public ResponseEntity<RecruitmentDto.JobPostingResponse> reopenJob(@PathVariable UUID jobId) {
        RecruitmentDto.JobPostingResponse response = recruitmentService.reopenJob(jobId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/jobs/{jobId}/close")
    public ResponseEntity<RecruitmentDto.JobPostingResponse> closeJob(@PathVariable UUID jobId) {
        RecruitmentDto.JobPostingResponse response = recruitmentService.closeJob(jobId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/jobs/{jobId}/fill")
    public ResponseEntity<RecruitmentDto.JobPostingResponse> markJobAsFilled(@PathVariable UUID jobId) {
        RecruitmentDto.JobPostingResponse response = recruitmentService.markJobAsFilled(jobId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/jobs/{jobId}")
    public ResponseEntity<Void> cancelJob(@PathVariable UUID jobId) {
        recruitmentService.cancelJob(jobId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/jobs/{jobId}/view")
    public ResponseEntity<Void> incrementJobViews(@PathVariable UUID jobId) {
        recruitmentService.incrementJobViews(jobId);
        return ResponseEntity.ok().build();
    }

    // === Candidate Endpoints ===

    @PostMapping("/candidates")
    public ResponseEntity<RecruitmentDto.CandidateResponse> createCandidate(
            @Valid @RequestBody RecruitmentDto.CreateCandidateRequest request) {
        RecruitmentDto.CandidateResponse response = recruitmentService.createCandidate(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/candidates/{candidateId}")
    public ResponseEntity<RecruitmentDto.CandidateResponse> updateCandidate(
            @PathVariable UUID candidateId,
            @Valid @RequestBody RecruitmentDto.UpdateCandidateRequest request) {
        RecruitmentDto.CandidateResponse response = recruitmentService.updateCandidate(candidateId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/candidates/{candidateId}")
    public ResponseEntity<RecruitmentDto.CandidateResponse> getCandidate(@PathVariable UUID candidateId) {
        return recruitmentService.getCandidate(candidateId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/candidates/email/{email}")
    public ResponseEntity<RecruitmentDto.CandidateResponse> getCandidateByEmail(@PathVariable String email) {
        return recruitmentService.getCandidateByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/candidates")
    public ResponseEntity<Page<RecruitmentDto.CandidateResponse>> searchCandidates(
            @RequestParam(required = false) Candidate.CandidateStatus status,
            @RequestParam(required = false) String searchTerm,
            Pageable pageable) {
        Page<RecruitmentDto.CandidateResponse> candidates = recruitmentService.searchCandidates(
                status, searchTerm, pageable);
        return ResponseEntity.ok(candidates);
    }

    @PostMapping("/candidates/{candidateId}/blacklist")
    public ResponseEntity<Void> blacklistCandidate(
            @PathVariable UUID candidateId,
            @RequestParam String reason) {
        recruitmentService.blacklistCandidate(candidateId, reason);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/candidates/{candidateId}/blacklist")
    public ResponseEntity<Void> removeFromBlacklist(@PathVariable UUID candidateId) {
        recruitmentService.removeFromBlacklist(candidateId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/candidates/{candidateId}/archive")
    public ResponseEntity<Void> archiveCandidate(@PathVariable UUID candidateId) {
        recruitmentService.archiveCandidate(candidateId);
        return ResponseEntity.ok().build();
    }

    // === Application Endpoints ===

    @PostMapping("/applications")
    public ResponseEntity<RecruitmentDto.ApplicationResponse> createApplication(
            @Valid @RequestBody RecruitmentDto.CreateApplicationRequest request) {
        RecruitmentDto.ApplicationResponse response = recruitmentService.createApplication(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/applications/{applicationId}")
    public ResponseEntity<RecruitmentDto.ApplicationResponse> getApplication(
            @PathVariable UUID applicationId) {
        return recruitmentService.getApplication(applicationId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/applications/reference/{reference}")
    public ResponseEntity<RecruitmentDto.ApplicationResponse> getApplicationByReference(
            @PathVariable String reference) {
        return recruitmentService.getApplicationByReference(reference)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/jobs/{jobId}/applications")
    public ResponseEntity<List<RecruitmentDto.ApplicationResponse>> getApplicationsForJob(
            @PathVariable UUID jobId) {
        List<RecruitmentDto.ApplicationResponse> applications = recruitmentService.getApplicationsForJob(jobId);
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/candidates/{candidateId}/applications")
    public ResponseEntity<List<RecruitmentDto.ApplicationResponse>> getApplicationsForCandidate(
            @PathVariable UUID candidateId) {
        List<RecruitmentDto.ApplicationResponse> applications = recruitmentService.getApplicationsForCandidate(candidateId);
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/applications")
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
    public ResponseEntity<RecruitmentDto.ApplicationResponse> moveToScreening(
            @PathVariable UUID applicationId) {
        RecruitmentDto.ApplicationResponse response = recruitmentService.moveToScreening(applicationId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/applications/{applicationId}/screen/complete")
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
    public ResponseEntity<RecruitmentDto.ApplicationResponse> shortlistApplication(
            @PathVariable UUID applicationId) {
        RecruitmentDto.ApplicationResponse response = recruitmentService.shortlistApplication(applicationId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/applications/{applicationId}/interview")
    public ResponseEntity<RecruitmentDto.ApplicationResponse> moveToInterview(
            @PathVariable UUID applicationId,
            @RequestParam Application.RecruitmentStage stage) {
        RecruitmentDto.ApplicationResponse response = recruitmentService.moveToInterview(applicationId, stage);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/applications/{applicationId}/offer")
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
    public ResponseEntity<RecruitmentDto.ApplicationResponse> acceptOffer(
            @PathVariable UUID applicationId) {
        RecruitmentDto.ApplicationResponse response = recruitmentService.acceptOffer(applicationId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/applications/{applicationId}/offer/decline")
    public ResponseEntity<RecruitmentDto.ApplicationResponse> declineOffer(
            @PathVariable UUID applicationId,
            @RequestParam String reason) {
        RecruitmentDto.ApplicationResponse response = recruitmentService.declineOffer(applicationId, reason);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/applications/{applicationId}/hire")
    public ResponseEntity<RecruitmentDto.ApplicationResponse> markAsHired(
            @PathVariable UUID applicationId) {
        RecruitmentDto.ApplicationResponse response = recruitmentService.markAsHired(applicationId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/applications/{applicationId}/reject")
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
    public ResponseEntity<RecruitmentDto.ApplicationResponse> withdrawApplication(
            @PathVariable UUID applicationId,
            @RequestParam String reason) {
        RecruitmentDto.ApplicationResponse response = recruitmentService.withdrawApplication(applicationId, reason);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/applications/{applicationId}/star")
    public ResponseEntity<Void> toggleStarred(@PathVariable UUID applicationId) {
        recruitmentService.toggleStarred(applicationId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/applications/{applicationId}/rating")
    public ResponseEntity<Void> updateApplicationRating(
            @PathVariable UUID applicationId,
            @RequestParam int rating) {
        recruitmentService.updateApplicationRating(applicationId, rating);
        return ResponseEntity.ok().build();
    }

    // === Interview Endpoints ===

    @PostMapping("/interviews")
    public ResponseEntity<RecruitmentDto.InterviewResponse> scheduleInterview(
            @Valid @RequestBody RecruitmentDto.ScheduleInterviewRequest request) {
        RecruitmentDto.InterviewResponse response = recruitmentService.scheduleInterview(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/interviews/{interviewId}")
    public ResponseEntity<RecruitmentDto.InterviewResponse> getInterview(@PathVariable UUID interviewId) {
        return recruitmentService.getInterview(interviewId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/applications/{applicationId}/interviews")
    public ResponseEntity<List<RecruitmentDto.InterviewResponse>> getInterviewsForApplication(
            @PathVariable UUID applicationId) {
        List<RecruitmentDto.InterviewResponse> interviews = recruitmentService.getInterviewsForApplication(applicationId);
        return ResponseEntity.ok(interviews);
    }

    @GetMapping("/interviewers/{interviewerId}/upcoming")
    public ResponseEntity<List<RecruitmentDto.InterviewResponse>> getUpcomingInterviewsForInterviewer(
            @PathVariable UUID interviewerId) {
        List<RecruitmentDto.InterviewResponse> interviews = recruitmentService.getUpcomingInterviewsForInterviewer(interviewerId);
        return ResponseEntity.ok(interviews);
    }

    @GetMapping("/interviews")
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
    public ResponseEntity<RecruitmentDto.InterviewResponse> confirmInterview(
            @PathVariable UUID interviewId) {
        RecruitmentDto.InterviewResponse response = recruitmentService.confirmInterview(interviewId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/interviews/{interviewId}/start")
    public ResponseEntity<RecruitmentDto.InterviewResponse> startInterview(
            @PathVariable UUID interviewId) {
        RecruitmentDto.InterviewResponse response = recruitmentService.startInterview(interviewId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/interviews/{interviewId}/complete")
    public ResponseEntity<RecruitmentDto.InterviewResponse> completeInterview(
            @PathVariable UUID interviewId) {
        RecruitmentDto.InterviewResponse response = recruitmentService.completeInterview(interviewId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/interviews/{interviewId}/feedback")
    public ResponseEntity<RecruitmentDto.InterviewResponse> submitFeedback(
            @PathVariable UUID interviewId,
            @Valid @RequestBody RecruitmentDto.InterviewFeedbackRequest feedback) {
        RecruitmentDto.InterviewResponse response = recruitmentService.submitFeedback(interviewId, feedback);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/interviews/{interviewId}/cancel")
    public ResponseEntity<RecruitmentDto.InterviewResponse> cancelInterview(
            @PathVariable UUID interviewId,
            @RequestParam String reason) {
        RecruitmentDto.InterviewResponse response = recruitmentService.cancelInterview(interviewId, reason);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/interviews/{interviewId}/no-show")
    public ResponseEntity<RecruitmentDto.InterviewResponse> markAsNoShow(
            @PathVariable UUID interviewId) {
        RecruitmentDto.InterviewResponse response = recruitmentService.markAsNoShow(interviewId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/interviews/{interviewId}/reschedule")
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
    public ResponseEntity<RecruitmentDto.RecruitmentDashboard> getDashboard() {
        RecruitmentDto.RecruitmentDashboard dashboard = recruitmentService.getDashboard();
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/pipeline")
    public ResponseEntity<List<RecruitmentDto.PipelineStage>> getPipelineSummary() {
        List<RecruitmentDto.PipelineStage> pipeline = recruitmentService.getPipelineSummary();
        return ResponseEntity.ok(pipeline);
    }

    @GetMapping("/interviews/today")
    public ResponseEntity<List<RecruitmentDto.InterviewResponse>> getTodaysInterviews() {
        List<RecruitmentDto.InterviewResponse> interviews = recruitmentService.getTodaysInterviews();
        return ResponseEntity.ok(interviews);
    }

    @GetMapping("/applications/stale")
    public ResponseEntity<List<RecruitmentDto.ApplicationResponse>> getStaleApplications(
            @RequestParam(defaultValue = "14") int daysOld) {
        List<RecruitmentDto.ApplicationResponse> applications = recruitmentService.getStaleApplications(daysOld);
        return ResponseEntity.ok(applications);
    }
}
