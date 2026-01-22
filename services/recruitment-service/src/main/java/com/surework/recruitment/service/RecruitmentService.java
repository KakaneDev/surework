package com.surework.recruitment.service;

import com.surework.recruitment.domain.*;
import com.surework.recruitment.dto.RecruitmentDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service interface for recruitment operations.
 */
public interface RecruitmentService {

    // === Job Posting Operations ===

    RecruitmentDto.JobPostingResponse createJob(RecruitmentDto.CreateJobRequest request);

    RecruitmentDto.JobPostingResponse updateJob(UUID jobId, RecruitmentDto.UpdateJobRequest request);

    Optional<RecruitmentDto.JobPostingResponse> getJob(UUID jobId);

    Optional<RecruitmentDto.JobPostingResponse> getJobByReference(String jobReference);

    Page<RecruitmentDto.JobPostingSummary> searchJobs(
            JobPosting.JobStatus status,
            UUID departmentId,
            JobPosting.EmploymentType employmentType,
            String location,
            String searchTerm,
            Pageable pageable);

    Page<RecruitmentDto.JobPostingSummary> getPublicJobs(Pageable pageable);

    RecruitmentDto.JobPostingResponse publishJob(UUID jobId, LocalDate closingDate);

    RecruitmentDto.JobPostingResponse putJobOnHold(UUID jobId);

    RecruitmentDto.JobPostingResponse reopenJob(UUID jobId);

    RecruitmentDto.JobPostingResponse closeJob(UUID jobId);

    RecruitmentDto.JobPostingResponse markJobAsFilled(UUID jobId);

    void cancelJob(UUID jobId);

    void incrementJobViews(UUID jobId);

    // === Candidate Operations ===

    RecruitmentDto.CandidateResponse createCandidate(RecruitmentDto.CreateCandidateRequest request);

    RecruitmentDto.CandidateResponse updateCandidate(UUID candidateId, RecruitmentDto.UpdateCandidateRequest request);

    Optional<RecruitmentDto.CandidateResponse> getCandidate(UUID candidateId);

    Optional<RecruitmentDto.CandidateResponse> getCandidateByEmail(String email);

    Page<RecruitmentDto.CandidateResponse> searchCandidates(
            Candidate.CandidateStatus status,
            String searchTerm,
            Pageable pageable);

    void blacklistCandidate(UUID candidateId, String reason);

    void removeFromBlacklist(UUID candidateId);

    void archiveCandidate(UUID candidateId);

    // === Application Operations ===

    RecruitmentDto.ApplicationResponse createApplication(RecruitmentDto.CreateApplicationRequest request);

    Optional<RecruitmentDto.ApplicationResponse> getApplication(UUID applicationId);

    Optional<RecruitmentDto.ApplicationResponse> getApplicationByReference(String reference);

    List<RecruitmentDto.ApplicationResponse> getApplicationsForJob(UUID jobId);

    List<RecruitmentDto.ApplicationResponse> getApplicationsForCandidate(UUID candidateId);

    Page<RecruitmentDto.ApplicationResponse> searchApplications(
            UUID jobId,
            UUID candidateId,
            Application.ApplicationStatus status,
            Application.RecruitmentStage stage,
            Pageable pageable);

    RecruitmentDto.ApplicationResponse moveToScreening(UUID applicationId);

    RecruitmentDto.ApplicationResponse completeScreening(UUID applicationId, int score, String notes, UUID screenedBy);

    RecruitmentDto.ApplicationResponse shortlistApplication(UUID applicationId);

    RecruitmentDto.ApplicationResponse moveToInterview(UUID applicationId, Application.RecruitmentStage stage);

    RecruitmentDto.ApplicationResponse makeOffer(
            UUID applicationId, java.math.BigDecimal salary, LocalDate expiryDate, LocalDate startDate);

    RecruitmentDto.ApplicationResponse acceptOffer(UUID applicationId);

    RecruitmentDto.ApplicationResponse declineOffer(UUID applicationId, String reason);

    RecruitmentDto.ApplicationResponse markAsHired(UUID applicationId);

    RecruitmentDto.ApplicationResponse rejectApplication(UUID applicationId, String reason, String notes, UUID rejectedBy);

    RecruitmentDto.ApplicationResponse withdrawApplication(UUID applicationId, String reason);

    void toggleStarred(UUID applicationId);

    void updateApplicationRating(UUID applicationId, int rating);

    // === Interview Operations ===

    RecruitmentDto.InterviewResponse scheduleInterview(RecruitmentDto.ScheduleInterviewRequest request);

    Optional<RecruitmentDto.InterviewResponse> getInterview(UUID interviewId);

    List<RecruitmentDto.InterviewResponse> getInterviewsForApplication(UUID applicationId);

    List<RecruitmentDto.InterviewResponse> getUpcomingInterviewsForInterviewer(UUID interviewerId);

    Page<RecruitmentDto.InterviewResponse> searchInterviews(
            UUID interviewerId,
            Interview.InterviewStatus status,
            Interview.InterviewType type,
            java.time.LocalDateTime startDate,
            java.time.LocalDateTime endDate,
            Pageable pageable);

    RecruitmentDto.InterviewResponse confirmInterview(UUID interviewId);

    RecruitmentDto.InterviewResponse startInterview(UUID interviewId);

    RecruitmentDto.InterviewResponse completeInterview(UUID interviewId);

    RecruitmentDto.InterviewResponse submitFeedback(UUID interviewId, RecruitmentDto.InterviewFeedbackRequest feedback);

    RecruitmentDto.InterviewResponse cancelInterview(UUID interviewId, String reason);

    RecruitmentDto.InterviewResponse markAsNoShow(UUID interviewId);

    RecruitmentDto.InterviewResponse rescheduleInterview(
            UUID interviewId, java.time.LocalDateTime newDateTime, String reason);

    // === Dashboard & Reporting ===

    RecruitmentDto.RecruitmentDashboard getDashboard();

    List<RecruitmentDto.PipelineStage> getPipelineSummary();

    List<RecruitmentDto.InterviewResponse> getTodaysInterviews();

    List<RecruitmentDto.ApplicationResponse> getStaleApplications(int daysOld);
}
