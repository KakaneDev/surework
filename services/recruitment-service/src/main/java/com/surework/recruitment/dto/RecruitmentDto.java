package com.surework.recruitment.dto;

import com.surework.recruitment.domain.*;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * DTOs for Recruitment operations.
 */
public sealed interface RecruitmentDto {

    // === Client DTOs ===

    record CreateClientRequest(
            @NotBlank(message = "Client name is required")
            String name,
            String industry,
            String contactPerson,
            String contactEmail,
            String contactPhone,
            String website,
            String notes
    ) implements RecruitmentDto {}

    record UpdateClientRequest(
            String name,
            String industry,
            String contactPerson,
            String contactEmail,
            String contactPhone,
            String website,
            String notes,
            Boolean active
    ) implements RecruitmentDto {}

    record ClientResponse(
            UUID id,
            String name,
            String industry,
            String contactPerson,
            String contactEmail,
            String contactPhone,
            String website,
            String notes,
            boolean active,
            Instant createdAt
    ) implements RecruitmentDto {

        public static ClientResponse fromEntity(com.surework.recruitment.domain.Client client) {
            return new ClientResponse(
                    client.getId(),
                    client.getName(),
                    client.getIndustry(),
                    client.getContactPerson(),
                    client.getContactEmail(),
                    client.getContactPhone(),
                    client.getWebsite(),
                    client.getNotes(),
                    client.isActive(),
                    client.getCreatedAt()
            );
        }
    }

    record ClientSummary(
            UUID id,
            String name,
            String industry,
            boolean active
    ) implements RecruitmentDto {

        public static ClientSummary fromEntity(com.surework.recruitment.domain.Client client) {
            return new ClientSummary(
                    client.getId(),
                    client.getName(),
                    client.getIndustry(),
                    client.isActive()
            );
        }
    }

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
            boolean remote,

            // Client & compensation fields
            UUID clientId,
            JobPosting.ClientVisibility clientVisibility,
            JobPosting.CompensationType compensationType,
            String salaryCurrency,
            String projectName,

            // External portal publishing fields
            String city,
            JobPosting.Province province,
            String postalCode,
            String countryCode,
            JobPosting.Industry industry,
            JobPosting.EducationLevel educationLevel,
            String keywords,
            String contractDuration,
            boolean publishToExternal,
            List<JobPosting.JobPortal> externalPortals,
            JobPosting.CompanyMentionPreference companyMentionPreference
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
            boolean remote,

            // Client & compensation fields
            UUID clientId,
            JobPosting.ClientVisibility clientVisibility,
            JobPosting.CompensationType compensationType,
            String salaryCurrency,
            String projectName,

            // External portal publishing fields
            String city,
            JobPosting.Province province,
            String postalCode,
            String countryCode,
            JobPosting.Industry industry,
            JobPosting.EducationLevel educationLevel,
            String keywords,
            String contractDuration,
            boolean publishToExternal,
            List<JobPosting.JobPortal> externalPortals,
            JobPosting.CompanyMentionPreference companyMentionPreference
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

            // Client & compensation fields
            UUID clientId,
            String clientName,
            JobPosting.ClientVisibility clientVisibility,
            JobPosting.CompensationType compensationType,
            String salaryCurrency,
            String projectName,

            int applicationCount,
            int viewCount,
            Instant createdAt,

            // External portal publishing fields
            String city,
            JobPosting.Province province,
            String postalCode,
            String countryCode,
            JobPosting.Industry industry,
            JobPosting.EducationLevel educationLevel,
            String keywords,
            String contractDuration,
            boolean publishToExternal,
            List<JobPosting.JobPortal> externalPortals,
            JobPosting.CompanyMentionPreference companyMentionPreference
    ) implements RecruitmentDto {

        public static JobPostingResponse fromEntity(JobPosting job, String clientName) {
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
                    // Client & compensation fields
                    job.getClientId(),
                    clientName,
                    job.getClientVisibility(),
                    job.getCompensationType(),
                    job.getSalaryCurrency(),
                    job.getProjectName(),
                    job.getApplicationCount(),
                    job.getViewCount(),
                    job.getCreatedAt(),
                    // External portal fields
                    job.getCity(),
                    job.getProvince(),
                    job.getPostalCode(),
                    job.getCountryCode(),
                    job.getIndustry(),
                    job.getEducationLevel(),
                    job.getKeywords(),
                    job.getContractDuration(),
                    job.isPublishToExternal(),
                    new ArrayList<>(job.getExternalPortalSet()),
                    job.getCompanyMentionPreference()
            );
        }

        public static JobPostingResponse fromEntity(JobPosting job) {
            return fromEntity(job, null);
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
            boolean remote,
            String clientName,
            JobPosting.CompensationType compensationType,
            String projectName
    ) implements RecruitmentDto {

        public static JobPostingSummary fromEntity(JobPosting job, String clientName) {
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
                    job.isRemote(),
                    clientName,
                    job.getCompensationType(),
                    job.getProjectName()
            );
        }

        public static JobPostingSummary fromEntity(JobPosting job) {
            return fromEntity(job, null);
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
            Candidate candidate = app.getCandidate();
            CandidateSummary candidateSummary = candidate != null
                    ? CandidateSummary.fromEntity(candidate)
                    : new CandidateSummary(null, null, app.getApplicantFullName(),
                            app.getApplicantEmail(), null, null);
            return new ApplicationResponse(
                    app.getId(),
                    app.getApplicationReference(),
                    candidateSummary,
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
            UUID candidateId,
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
                    interview.getApplication().getCandidate().getId(),
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

    // === External Job Posting DTOs ===

    record ExternalJobPostingResponse(
            UUID id,
            UUID jobPostingId,
            String jobTitle,
            String jobReference,
            JobPosting.JobPortal portal,
            String externalJobId,
            String externalUrl,
            ExternalJobPosting.ExternalPostingStatus status,
            String errorMessage,
            int retryCount,
            LocalDateTime postedAt,
            LocalDateTime expiresAt,
            LocalDateTime lastCheckedAt,
            Instant createdAt
    ) implements RecruitmentDto {

        public static ExternalJobPostingResponse fromEntity(ExternalJobPosting posting) {
            JobPosting job = posting.getJobPosting();
            return new ExternalJobPostingResponse(
                    posting.getId(),
                    job.getId(),
                    job.getTitle(),
                    job.getJobReference(),
                    posting.getPortal(),
                    posting.getExternalJobId(),
                    posting.getExternalUrl(),
                    posting.getStatus(),
                    posting.getErrorMessage(),
                    posting.getRetryCount(),
                    posting.getPostedAt(),
                    posting.getExpiresAt(),
                    posting.getLastCheckedAt(),
                    posting.getCreatedAt()
            );
        }
    }

    record ExternalPostingSummary(
            UUID id,
            JobPosting.JobPortal portal,
            ExternalJobPosting.ExternalPostingStatus status,
            String externalUrl,
            LocalDateTime postedAt
    ) implements RecruitmentDto {

        public static ExternalPostingSummary fromEntity(ExternalJobPosting posting) {
            return new ExternalPostingSummary(
                    posting.getId(),
                    posting.getPortal(),
                    posting.getStatus(),
                    posting.getExternalUrl(),
                    posting.getPostedAt()
            );
        }
    }

    record ExternalPostingStats(
            long totalPending,
            long totalPosted,
            long totalFailed,
            long totalRequiresManual,
            List<PortalStats> byPortal
    ) implements RecruitmentDto {}

    record PortalStats(
            JobPosting.JobPortal portal,
            long pending,
            long posted,
            long failed,
            long postedToday
    ) implements RecruitmentDto {}

    // === Analytics DTOs ===

    record PortalPerformanceStats(
            List<PortalDetail> portals,
            long totalPosted,
            long totalActive,
            long totalFailed,
            long totalExpired
    ) implements RecruitmentDto {}

    record PortalDetail(
            String portal,
            long totalPostings,
            long activePostings,
            long failedPostings,
            long expiredPostings,
            double avgDaysLive,
            long postsToday
    ) implements RecruitmentDto {}

    record AdvertPerformanceStats(
            List<AdvertDetail> adverts,
            double avgConversionRate,
            double avgDaysLive,
            int totalViews,
            int totalApplications
    ) implements RecruitmentDto {}

    record AdvertDetail(
            UUID jobId,
            String title,
            String status,
            String departmentName,
            int views,
            int applications,
            double conversionRate,
            String postingDate,
            String closingDate,
            long daysLive
    ) implements RecruitmentDto {}

    record SourceEffectivenessStats(
            Map<String, Long> applicationsBySource,
            Map<String, Long> hiredBySource,
            Map<String, Double> conversionRateBySource,
            Map<String, Double> avgDaysToHireBySource,
            long totalApplications,
            long totalHires
    ) implements RecruitmentDto {}

    record OfferAcceptanceStats(
            long totalOffersMade,
            long totalAccepted,
            long totalDeclined,
            double acceptanceRatePercent,
            double avgDaysToAccept,
            Map<String, Double> acceptanceRateByDepartment,
            List<OfferTrend> monthlyTrend
    ) implements RecruitmentDto {}

    record OfferTrend(
            String month,
            long offers,
            long accepted,
            long declined,
            double acceptanceRate
    ) implements RecruitmentDto {}

    // === Post to Portals Request ===

    record PostToPortalsRequest(
            @NotEmpty(message = "At least one portal is required")
            List<JobPosting.JobPortal> portals,
            JobPosting.CompanyMentionPreference companyMentionPreference
    ) implements RecruitmentDto {}

    // === Portal Status DTO (tenant-facing) ===

    record PortalStatusResponse(
            JobPosting.JobPortal portal,
            String connectionStatus,
            boolean isActive,
            int dailyRateLimit,
            int postsToday
    ) implements RecruitmentDto {

        public static PortalStatusResponse fromEntity(
                com.surework.recruitment.domain.PlatformPortalCredentials creds) {
            return new PortalStatusResponse(
                    creds.getPortal(),
                    creds.getConnectionStatus().name(),
                    creds.isActive(),
                    creds.getDailyRateLimit(),
                    creds.getPostsToday()
            );
        }
    }
}
