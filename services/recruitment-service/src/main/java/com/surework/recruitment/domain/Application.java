package com.surework.recruitment.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Represents a job application from a candidate.
 * The tenantId field provides defense-in-depth for tenant isolation.
 */
@Entity
@Table(name = "applications", indexes = {
        @Index(name = "idx_applications_candidate", columnList = "candidate_id"),
        @Index(name = "idx_applications_job", columnList = "job_posting_id"),
        @Index(name = "idx_applications_status", columnList = "status"),
        @Index(name = "idx_applications_stage", columnList = "stage")
})
@Getter
@Setter
@NoArgsConstructor
public class Application extends BaseEntity {

    /**
     * Tenant ID for defense-in-depth isolation.
     * Primary isolation is via schema-per-tenant; this is a secondary safeguard.
     */
    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "application_reference", nullable = false, unique = true)
    private String applicationReference;

    /**
     * Linked candidate profile (optional for public applications).
     * Public applications store applicant info directly on the Application.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id")
    private Candidate candidate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_posting_id", nullable = false)
    private JobPosting jobPosting;

    // ==================== Direct Applicant Fields ====================
    // These fields are used for public career page applications
    // where no Candidate profile exists yet.

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "email")
    private String email;

    @Column(name = "phone")
    private String phone;

    @Column(name = "linkedin_url")
    private String linkedInUrl;

    @Column(name = "portfolio_url")
    private String portfolioUrl;

    @Column(name = "notice_period")
    private String noticePeriod;

    @Column(name = "expected_salary", precision = 12, scale = 2)
    private BigDecimal expectedSalary;

    @Column(name = "referred_by")
    private String referredBy;

    @Column(name = "additional_notes", columnDefinition = "TEXT")
    private String additionalNotes;

    @Column(name = "applied_at")
    private LocalDateTime appliedAt;

    @Column(name = "application_date", nullable = false)
    private LocalDate applicationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ApplicationStatus status = ApplicationStatus.NEW;

    @Enumerated(EnumType.STRING)
    @Column(name = "stage", nullable = false)
    private RecruitmentStage stage = RecruitmentStage.NEW;

    @Column(name = "cover_letter", columnDefinition = "TEXT")
    private String coverLetter;

    @Column(name = "resume_file_id")
    private UUID resumeFileId;

    @Column(name = "resume_file_name")
    private String resumeFileName;

    // Screening information
    @Column(name = "screening_score")
    private Integer screeningScore;

    @Column(name = "screening_notes", columnDefinition = "TEXT")
    private String screeningNotes;

    @Column(name = "screened_by")
    private UUID screenedBy;

    @Column(name = "screened_at")
    private java.time.Instant screenedAt;

    // Assessment
    @Column(name = "assessment_score")
    private Integer assessmentScore;

    @Column(name = "assessment_notes", columnDefinition = "TEXT")
    private String assessmentNotes;

    // Interview information
    @Column(name = "interview_count")
    private int interviewCount = 0;

    @Column(name = "overall_interview_rating")
    private Integer overallInterviewRating;

    // Offer information
    @Column(name = "offer_token", unique = true, length = 64)
    private String offerToken;

    @Column(name = "offer_salary", precision = 12, scale = 2)
    private BigDecimal offerSalary;

    @Column(name = "offer_date")
    private LocalDate offerDate;

    @Column(name = "offer_expiry_date")
    private LocalDate offerExpiryDate;

    @Column(name = "offer_accepted_date")
    private LocalDate offerAcceptedDate;

    @Column(name = "expected_start_date")
    private LocalDate expectedStartDate;

    // Rejection information
    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "rejection_notes", columnDefinition = "TEXT")
    private String rejectionNotes;

    @Column(name = "rejected_by")
    private UUID rejectedBy;

    @Column(name = "rejected_at")
    private java.time.Instant rejectedAt;

    // Withdrawal information
    @Column(name = "withdrawal_reason")
    private String withdrawalReason;

    @Column(name = "withdrawn_at")
    private java.time.Instant withdrawnAt;

    // General notes and rating
    @Column(name = "internal_notes", columnDefinition = "TEXT")
    private String internalNotes;

    @Column(name = "overall_rating")
    private Integer overallRating; // 1-5 stars

    @Column(name = "starred")
    private boolean starred = false;

    @Column(name = "source")
    private String source; // How did they apply?

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL)
    @OrderBy("scheduledAt DESC")
    private List<Interview> interviews = new ArrayList<>();

    /**
     * Application statuses.
     */
    public enum ApplicationStatus {
        RECEIVED,       // Received from public careers page (not yet reviewed)
        NEW,            // Just submitted (internal)
        IN_REVIEW,      // Being reviewed
        SCREENED,       // Initial screening complete
        SHORTLISTED,    // Made the shortlist
        INTERVIEWING,   // In interview process
        OFFER_MADE,     // Offer extended
        OFFER_ACCEPTED, // Candidate accepted
        OFFER_DECLINED, // Candidate declined offer
        HIRED,          // Successfully hired
        REJECTED,       // Not successful
        WITHDRAWN,      // Candidate withdrew
        ON_HOLD         // Temporarily on hold
    }

    /**
     * Recruitment stages.
     */
    public enum RecruitmentStage {
        NEW,                // New application
        SCREENING,          // Initial screening
        PHONE_SCREEN,       // Phone screening
        ASSESSMENT,         // Skills assessment
        FIRST_INTERVIEW,    // First interview
        SECOND_INTERVIEW,   // Second interview
        FINAL_INTERVIEW,    // Final interview
        REFERENCE_CHECK,    // Reference checking
        BACKGROUND_CHECK,   // Background verification
        OFFER,              // Offer stage
        ONBOARDING,         // Preparing for onboarding
        COMPLETED           // Process completed
    }

    /**
     * Create a new application from a Candidate.
     */
    public static Application create(Candidate candidate, JobPosting jobPosting) {
        Application application = new Application();
        application.setCandidate(candidate);
        application.setJobPosting(jobPosting);
        application.setApplicationReference(generateApplicationReference());
        application.setApplicationDate(LocalDate.now());
        application.setStatus(ApplicationStatus.NEW);
        application.setStage(RecruitmentStage.NEW);
        return application;
    }

    /**
     * Create a public application (from careers page, no Candidate profile).
     */
    public static Application createPublicApplication(JobPosting jobPosting, String firstName,
            String lastName, String email, String phone) {
        Application application = new Application();
        application.setJobPosting(jobPosting);
        application.setTenantId(jobPosting.getTenantId());
        application.setFirstName(firstName);
        application.setLastName(lastName);
        application.setEmail(email);
        application.setPhone(phone);
        application.setApplicationReference(generateApplicationReference());
        application.setApplicationDate(LocalDate.now());
        application.setAppliedAt(LocalDateTime.now());
        application.setStatus(ApplicationStatus.RECEIVED);
        application.setStage(RecruitmentStage.NEW);
        application.setSource("careers_page");
        return application;
    }

    private static String generateApplicationReference() {
        return "APP-" + System.currentTimeMillis() % 100000 + "-" +
                UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    }

    /**
     * Get the applicant's full name (from Candidate or direct fields).
     */
    public String getApplicantFullName() {
        if (candidate != null) {
            return candidate.getFirstName() + " " + candidate.getLastName();
        }
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        }
        return firstName != null ? firstName : (lastName != null ? lastName : "Unknown");
    }

    /**
     * Get the applicant's email (from Candidate or direct fields).
     */
    public String getApplicantEmail() {
        if (candidate != null) {
            return candidate.getEmail();
        }
        return email;
    }

    /**
     * Get the applicant's phone (from Candidate or direct fields).
     */
    public String getApplicantPhone() {
        if (candidate != null) {
            return candidate.getPhone();
        }
        return phone;
    }

    /**
     * Check if this is a public application (no linked Candidate).
     */
    public boolean isPublicApplication() {
        return candidate == null;
    }

    /**
     * Move to screening.
     */
    public void moveToScreening() {
        this.status = ApplicationStatus.IN_REVIEW;
        this.stage = RecruitmentStage.SCREENING;
    }

    /**
     * Complete screening.
     */
    public void completeScreening(int score, String notes, UUID screenedBy) {
        this.screeningScore = score;
        this.screeningNotes = notes;
        this.screenedBy = screenedBy;
        this.screenedAt = java.time.Instant.now();
    }

    /**
     * Shortlist the application.
     */
    public void shortlist() {
        this.status = ApplicationStatus.SHORTLISTED;
    }

    /**
     * Move to interview stage.
     */
    public void moveToInterview(RecruitmentStage interviewStage) {
        this.status = ApplicationStatus.INTERVIEWING;
        this.stage = interviewStage;
    }

    /**
     * Add an interview.
     */
    public void addInterview(Interview interview) {
        interviews.add(interview);
        interview.setApplication(this);
        this.interviewCount++;
    }

    /**
     * Generate a unique offer token for public acceptance link.
     */
    public void generateOfferToken() {
        this.offerToken = UUID.randomUUID().toString().replace("-", "");
    }

    /**
     * Make an offer.
     */
    public void makeOffer(BigDecimal salary, LocalDate expiryDate, LocalDate startDate) {
        this.status = ApplicationStatus.OFFER_MADE;
        this.stage = RecruitmentStage.OFFER;
        this.offerSalary = salary;
        this.offerDate = LocalDate.now();
        this.offerExpiryDate = expiryDate;
        this.expectedStartDate = startDate;
        generateOfferToken();
    }

    /**
     * Accept the offer.
     */
    public void acceptOffer() {
        if (this.status != ApplicationStatus.OFFER_MADE) {
            throw new IllegalStateException("No offer to accept");
        }
        this.status = ApplicationStatus.OFFER_ACCEPTED;
        this.stage = RecruitmentStage.ONBOARDING;
        this.offerAcceptedDate = LocalDate.now();
    }

    /**
     * Decline the offer.
     */
    public void declineOffer(String reason) {
        if (this.status != ApplicationStatus.OFFER_MADE) {
            throw new IllegalStateException("No offer to decline");
        }
        this.status = ApplicationStatus.OFFER_DECLINED;
        this.rejectionReason = "Offer declined: " + (reason != null ? reason : "No reason provided");
    }

    /**
     * Mark as hired.
     */
    public void markAsHired() {
        this.status = ApplicationStatus.HIRED;
        this.stage = RecruitmentStage.COMPLETED;
    }

    /**
     * Hire the candidate (alias for markAsHired).
     */
    public void hire() {
        markAsHired();
    }

    /**
     * Increment interview count.
     */
    public void incrementInterviews() {
        this.interviewCount++;
    }

    /**
     * Toggle starred status.
     */
    public void toggleStarred() {
        this.starred = !this.starred;
    }

    /**
     * Reject the application.
     */
    public void reject(String reason, String notes, UUID rejectedBy) {
        this.status = ApplicationStatus.REJECTED;
        this.rejectionReason = reason;
        this.rejectionNotes = notes;
        this.rejectedBy = rejectedBy;
        this.rejectedAt = java.time.Instant.now();
    }

    /**
     * Withdraw the application.
     */
    public void withdraw(String reason) {
        this.status = ApplicationStatus.WITHDRAWN;
        this.withdrawalReason = reason;
        this.withdrawnAt = java.time.Instant.now();
    }

    /**
     * Put on hold.
     */
    public void putOnHold() {
        this.status = ApplicationStatus.ON_HOLD;
    }

    /**
     * Resume from hold.
     */
    public void resumeFromHold(ApplicationStatus previousStatus) {
        this.status = previousStatus;
    }

    /**
     * Check if application is active.
     */
    public boolean isActive() {
        return status != ApplicationStatus.REJECTED &&
                status != ApplicationStatus.WITHDRAWN &&
                status != ApplicationStatus.HIRED;
    }

    /**
     * Get days since application.
     */
    public long getDaysSinceApplication() {
        return java.time.temporal.ChronoUnit.DAYS.between(applicationDate, LocalDate.now());
    }
}
