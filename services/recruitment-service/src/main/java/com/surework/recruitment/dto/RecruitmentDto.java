package com.surework.recruitment.dto;

import com.surework.recruitment.domain.*;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTOs for Recruitment operations.
 */
public sealed interface RecruitmentDto {

    // === Job Posting DTOs ===

    record CreateJobRequest(
            @NotBlank(message = "Title is required")
            String title,

            UUID departmentId,
            String departmentName,
            String location,

            @NotNull(message = "Employment type is required")
            JobPosting.EmploymentType employmentType,

            String description,
            String requirements,
            String responsibilities,
            String qualifications,
            String skills,

            Integer experienceYearsMin,
            Integer experienceYearsMax,

            BigDecimal salaryMin,
            BigDecimal salaryMax,
            boolean showSalary,

            String benefits,

            @Min(value = 1, message = "At least 1 position required")
            int positionsAvailable,

            UUID hiringManagerId,
            String hiringManagerName,
            UUID recruiterId,
            String recruiterName,

            boolean internalOnly,
            boolean remote
    ) implements RecruitmentDto {}

    record UpdateJobRequest(
            String title,
            String location,
            String description,
            String requirements,
            String responsibilities,
            String qualifications,
            String skills,
            Integer experienceYearsMin,
            Integer experienceYearsMax,
            BigDecimal salaryMin,
            BigDecimal salaryMax,
            boolean showSalary,
            String benefits,
            int positionsAvailable,
            boolean internalOnly,
            boolean remote
    ) implements RecruitmentDto {}

    record JobPostingResponse(
            UUID id,
            String jobReference,
            String title,
            UUID departmentId,
            String departmentName,
            String location,
            JobPosting.EmploymentType employmentType,
            String description,
            String requirements,
            String responsibilities,
            String qualifications,
            String skills,
            Integer experienceYearsMin,
            Integer experienceYearsMax,
            String salaryRange,
            BigDecimal salaryMin,
            BigDecimal salaryMax,
            boolean showSalary,
            String benefits,
            JobPosting.JobStatus status,
            LocalDate postingDate,
            LocalDate closingDate,
            int positionsAvailable,
            int positionsFilled,
            UUID hiringManagerId,
            String hiringManagerName,
            UUID recruiterId,
            String recruiterName,
            boolean internalOnly,
            boolean remote,
            int applicationCount,
            int viewCount,
            Instant createdAt
    ) implements RecruitmentDto {

        public static JobPostingResponse fromEntity(JobPosting job) {
            return new JobPostingResponse(
                    job.getId(),
                    job.getJobReference(),
                    job.getTitle(),
                    job.getDepartmentId(),
                    job.getDepartmentName(),
                    job.getLocation(),
                    job.getEmploymentType(),
                    job.getDescription(),
                    job.getRequirements(),
                    job.getResponsibilities(),
                    job.getQualifications(),
                    job.getSkills(),
                    job.getExperienceYearsMin(),
                    job.getExperienceYearsMax(),
                    job.getSalaryRange(),
                    job.getSalaryMin(),
                    job.getSalaryMax(),
                    job.isShowSalary(),
                    job.getBenefits(),
                    job.getStatus(),
                    job.getPostingDate(),
                    job.getClosingDate(),
                    job.getPositionsAvailable(),
                    job.getPositionsFilled(),
                    job.getHiringManagerId(),
                    job.getHiringManagerName(),
                    job.getRecruiterId(),
                    job.getRecruiterName(),
                    job.isInternalOnly(),
                    job.isRemote(),
                    job.getApplicationCount(),
                    job.getViewCount(),
                    job.getCreatedAt()
            );
        }
    }

    record JobPostingSummary(
            UUID id,
            String jobReference,
            String title,
            String departmentName,
            String location,
            JobPosting.EmploymentType employmentType,
            JobPosting.JobStatus status,
            LocalDate closingDate,
            int applicationCount,
            boolean remote
    ) implements RecruitmentDto {

        public static JobPostingSummary fromEntity(JobPosting job) {
            return new JobPostingSummary(
                    job.getId(),
                    job.getJobReference(),
                    job.getTitle(),
                    job.getDepartmentName(),
                    job.getLocation(),
                    job.getEmploymentType(),
                    job.getStatus(),
                    job.getClosingDate(),
                    job.getApplicationCount(),
                    job.isRemote()
            );
        }
    }

    // === Candidate DTOs ===

    record CreateCandidateRequest(
            @NotBlank(message = "First name is required")
            String firstName,

            @NotBlank(message = "Last name is required")
            String lastName,

            @NotBlank(message = "Email is required")
            @Email(message = "Invalid email format")
            String email,

            String phone,
            String idNumber,
            LocalDate dateOfBirth,
            Candidate.Gender gender,
            String nationality,

            String addressLine1,
            String addressLine2,
            String city,
            String province,
            String postalCode,

            String currentJobTitle,
            String currentEmployer,
            Integer yearsExperience,
            String highestQualification,
            String fieldOfStudy,
            String skills,
            String languages,

            BigDecimal expectedSalary,
            Integer noticePeriodDays,
            LocalDate availableFrom,
            boolean willingToRelocate,
            String preferredLocations,

            String linkedinUrl,
            String portfolioUrl,
            String source,
            String referredBy
    ) implements RecruitmentDto {}

    record UpdateCandidateRequest(
            String firstName,
            String lastName,
            String phone,
            String currentJobTitle,
            String currentEmployer,
            Integer yearsExperience,
            String skills,
            BigDecimal expectedSalary,
            Integer noticePeriodDays,
            boolean willingToRelocate,
            String notes
    ) implements RecruitmentDto {}

    record CandidateResponse(
            UUID id,
            String candidateReference,
            String firstName,
            String lastName,
            String fullName,
            String email,
            String phone,
            String idNumber,
            LocalDate dateOfBirth,
            Candidate.Gender gender,
            String nationality,
            String city,
            String province,
            String currentJobTitle,
            String currentEmployer,
            Integer yearsExperience,
            String experienceLevel,
            String highestQualification,
            String fieldOfStudy,
            String skills,
            String languages,
            BigDecimal expectedSalary,
            Integer noticePeriodDays,
            LocalDate availableFrom,
            boolean willingToRelocate,
            String preferredLocations,
            String linkedinUrl,
            String portfolioUrl,
            Candidate.CandidateStatus status,
            String source,
            boolean internalCandidate,
            boolean blacklisted,
            Instant createdAt
    ) implements RecruitmentDto {

        public static CandidateResponse fromEntity(Candidate candidate) {
            return new CandidateResponse(
                    candidate.getId(),
                    candidate.getCandidateReference(),
                    candidate.getFirstName(),
                    candidate.getLastName(),
                    candidate.getFullName(),
                    candidate.getEmail(),
                    candidate.getPhone(),
                    candidate.getIdNumber(),
                    candidate.getDateOfBirth(),
                    candidate.getGender(),
                    candidate.getNationality(),
                    candidate.getCity(),
                    candidate.getProvince(),
                    candidate.getCurrentJobTitle(),
                    candidate.getCurrentEmployer(),
                    candidate.getYearsExperience(),
                    candidate.getExperienceLevel(),
                    candidate.getHighestQualification(),
                    candidate.getFieldOfStudy(),
                    candidate.getSkills(),
                    candidate.getLanguages(),
                    candidate.getExpectedSalary(),
                    candidate.getNoticePeriodDays(),
                    candidate.getAvailableFrom(),
                    candidate.isWillingToRelocate(),
                    candidate.getPreferredLocations(),
                    candidate.getLinkedinUrl(),
                    candidate.getPortfolioUrl(),
                    candidate.getStatus(),
                    candidate.getSource(),
                    candidate.isInternalCandidate(),
                    candidate.isBlacklisted(),
                    candidate.getCreatedAt()
            );
        }
    }

    // === Application DTOs ===

    record CreateApplicationRequest(
            @NotNull(message = "Candidate ID is required")
            UUID candidateId,

            @NotNull(message = "Job ID is required")
            UUID jobId,

            String coverLetter,
            String source
    ) implements RecruitmentDto {}

    record ApplicationResponse(
            UUID id,
            String applicationReference,
            CandidateSummary candidate,
            JobPostingSummary job,
            LocalDate applicationDate,
            Application.ApplicationStatus status,
            Application.RecruitmentStage stage,
            String coverLetter,
            Integer screeningScore,
            Integer assessmentScore,
            int interviewCount,
            Integer overallInterviewRating,
            BigDecimal offerSalary,
            LocalDate offerDate,
            LocalDate offerExpiryDate,
            LocalDate expectedStartDate,
            String rejectionReason,
            Integer overallRating,
            boolean starred,
            String source,
            long daysSinceApplication,
            Instant createdAt
    ) implements RecruitmentDto {

        public static ApplicationResponse fromEntity(Application app) {
            return new ApplicationResponse(
                    app.getId(),
                    app.getApplicationReference(),
                    CandidateSummary.fromEntity(app.getCandidate()),
                    JobPostingSummary.fromEntity(app.getJobPosting()),
                    app.getApplicationDate(),
                    app.getStatus(),
                    app.getStage(),
                    app.getCoverLetter(),
                    app.getScreeningScore(),
                    app.getAssessmentScore(),
                    app.getInterviewCount(),
                    app.getOverallInterviewRating(),
                    app.getOfferSalary(),
                    app.getOfferDate(),
                    app.getOfferExpiryDate(),
                    app.getExpectedStartDate(),
                    app.getRejectionReason(),
                    app.getOverallRating(),
                    app.isStarred(),
                    app.getSource(),
                    app.getDaysSinceApplication(),
                    app.getCreatedAt()
            );
        }
    }

    record CandidateSummary(
            UUID id,
            String candidateReference,
            String fullName,
            String email,
            String currentJobTitle,
            Integer yearsExperience
    ) implements RecruitmentDto {

        public static CandidateSummary fromEntity(Candidate candidate) {
            return new CandidateSummary(
                    candidate.getId(),
                    candidate.getCandidateReference(),
                    candidate.getFullName(),
                    candidate.getEmail(),
                    candidate.getCurrentJobTitle(),
                    candidate.getYearsExperience()
            );
        }
    }

    // === Interview DTOs ===

    record ScheduleInterviewRequest(
            @NotNull(message = "Application ID is required")
            UUID applicationId,

            @NotNull(message = "Interview type is required")
            Interview.InterviewType interviewType,

            @NotNull(message = "Scheduled time is required")
            LocalDateTime scheduledAt,

            @Min(value = 15, message = "Minimum duration is 15 minutes")
            int durationMinutes,

            @NotNull(message = "Location type is required")
            Interview.LocationType locationType,

            String locationDetails,
            String meetingLink,

            @NotNull(message = "Interviewer ID is required")
            UUID interviewerId,

            String interviewerName,
            String interviewerEmail,

            String panelInterviewerIds,
            String panelInterviewerNames,

            String agenda,
            String topicsToCover
    ) implements RecruitmentDto {}

    record InterviewFeedbackRequest(
            @Min(1) @Max(5)
            Integer technicalRating,

            @Min(1) @Max(5)
            Integer communicationRating,

            @Min(1) @Max(5)
            Integer culturalFitRating,

            @Min(1) @Max(5)
            Integer overallRating,

            Interview.Recommendation recommendation,

            String feedback,
            String strengths,
            String concerns
    ) implements RecruitmentDto {}

    record InterviewResponse(
            UUID id,
            UUID applicationId,
            String candidateName,
            String jobTitle,
            Interview.InterviewType interviewType,
            int roundNumber,
            LocalDateTime scheduledAt,
            int durationMinutes,
            LocalDateTime endTime,
            Interview.LocationType locationType,
            String locationDetails,
            String meetingLink,
            UUID interviewerId,
            String interviewerName,
            Interview.InterviewStatus status,
            Integer technicalRating,
            Integer communicationRating,
            Integer culturalFitRating,
            Integer overallRating,
            Double averageRating,
            Interview.Recommendation recommendation,
            String feedback,
            boolean isUpcoming,
            boolean needsFeedback,
            Instant createdAt
    ) implements RecruitmentDto {

        public static InterviewResponse fromEntity(Interview interview) {
            return new InterviewResponse(
                    interview.getId(),
                    interview.getApplication().getId(),
                    interview.getApplication().getCandidate().getFullName(),
                    interview.getApplication().getJobPosting().getTitle(),
                    interview.getInterviewType(),
                    interview.getRoundNumber(),
                    interview.getScheduledAt(),
                    interview.getDurationMinutes(),
                    interview.getEndTime(),
                    interview.getLocationType(),
                    interview.getLocationDetails(),
                    interview.getMeetingLink(),
                    interview.getInterviewerId(),
                    interview.getInterviewerName(),
                    interview.getStatus(),
                    interview.getTechnicalRating(),
                    interview.getCommunicationRating(),
                    interview.getCulturalFitRating(),
                    interview.getOverallRating(),
                    interview.getAverageRating(),
                    interview.getRecommendation(),
                    interview.getFeedback(),
                    interview.isUpcoming(),
                    interview.needsFeedback(),
                    interview.getCreatedAt()
            );
        }
    }

    // === Pipeline/Dashboard DTOs ===

    record RecruitmentDashboard(
            int openJobs,
            int totalApplications,
            int interviewsThisWeek,
            int offersPending,
            List<PipelineStage> pipeline,
            List<JobPostingSummary> recentJobs,
            List<InterviewResponse> upcomingInterviews
    ) implements RecruitmentDto {}

    record PipelineStage(
            Application.RecruitmentStage stage,
            String stageName,
            int count
    ) implements RecruitmentDto {}
}
