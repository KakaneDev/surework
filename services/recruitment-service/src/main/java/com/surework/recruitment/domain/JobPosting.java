package com.surework.recruitment.domain;

import com.surework.common.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Represents a job posting/vacancy.
 */
@Entity
@Table(name = "job_postings", indexes = {
        @Index(name = "idx_job_postings_status", columnList = "status"),
        @Index(name = "idx_job_postings_department", columnList = "department_id"),
        @Index(name = "idx_job_postings_dates", columnList = "posting_date, closing_date")
})
@Getter
@Setter
@NoArgsConstructor
public class JobPosting extends BaseEntity {

    @Column(name = "job_reference", nullable = false, unique = true)
    private String jobReference;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(name = "department_name")
    private String departmentName;

    @Column(name = "location")
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_type", nullable = false)
    private EmploymentType employmentType;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "requirements", columnDefinition = "TEXT")
    private String requirements;

    @Column(name = "responsibilities", columnDefinition = "TEXT")
    private String responsibilities;

    @Column(name = "qualifications", columnDefinition = "TEXT")
    private String qualifications;

    @Column(name = "skills", columnDefinition = "TEXT")
    private String skills;

    @Column(name = "experience_years_min")
    private Integer experienceYearsMin;

    @Column(name = "experience_years_max")
    private Integer experienceYearsMax;

    @Column(name = "salary_min", precision = 12, scale = 2)
    private BigDecimal salaryMin;

    @Column(name = "salary_max", precision = 12, scale = 2)
    private BigDecimal salaryMax;

    @Column(name = "show_salary")
    private boolean showSalary = false;

    @Column(name = "benefits", columnDefinition = "TEXT")
    private String benefits;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private JobStatus status = JobStatus.DRAFT;

    @Column(name = "posting_date")
    private LocalDate postingDate;

    @Column(name = "closing_date")
    private LocalDate closingDate;

    @Column(name = "positions_available")
    private int positionsAvailable = 1;

    @Column(name = "positions_filled")
    private int positionsFilled = 0;

    @Column(name = "hiring_manager_id")
    private UUID hiringManagerId;

    @Column(name = "hiring_manager_name")
    private String hiringManagerName;

    @Column(name = "recruiter_id")
    private UUID recruiterId;

    @Column(name = "recruiter_name")
    private String recruiterName;

    @Column(name = "is_internal_only")
    private boolean internalOnly = false;

    @Column(name = "is_remote")
    private boolean remote = false;

    @Column(name = "application_count")
    private int applicationCount = 0;

    @Column(name = "view_count")
    private int viewCount = 0;

    @OneToMany(mappedBy = "jobPosting", cascade = CascadeType.ALL)
    private List<Application> applications = new ArrayList<>();

    /**
     * Employment types.
     */
    public enum EmploymentType {
        FULL_TIME,
        PART_TIME,
        CONTRACT,
        TEMPORARY,
        INTERNSHIP,
        FREELANCE
    }

    /**
     * Job posting statuses.
     */
    public enum JobStatus {
        DRAFT,          // Not yet published
        OPEN,           // Accepting applications
        ON_HOLD,        // Temporarily paused
        CLOSED,         // No longer accepting applications
        FILLED,         // Position(s) filled
        CANCELLED       // Cancelled
    }

    /**
     * Create a new job posting.
     */
    public static JobPosting create(String title, EmploymentType employmentType) {
        JobPosting job = new JobPosting();
        job.setTitle(title);
        job.setEmploymentType(employmentType);
        job.setJobReference(generateJobReference());
        job.setStatus(JobStatus.DRAFT);
        return job;
    }

    private static String generateJobReference() {
        return "JOB-" + System.currentTimeMillis() % 100000 + "-" +
                UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    }

    /**
     * Publish the job posting.
     */
    public void publish(LocalDate closingDate) {
        if (this.status != JobStatus.DRAFT && this.status != JobStatus.ON_HOLD) {
            throw new IllegalStateException("Can only publish draft or on-hold jobs");
        }
        this.status = JobStatus.OPEN;
        this.postingDate = LocalDate.now();
        this.closingDate = closingDate;
    }

    /**
     * Put the job on hold.
     */
    public void putOnHold() {
        if (this.status != JobStatus.OPEN) {
            throw new IllegalStateException("Can only put open jobs on hold");
        }
        this.status = JobStatus.ON_HOLD;
    }

    /**
     * Reopen the job.
     */
    public void reopen() {
        if (this.status != JobStatus.ON_HOLD && this.status != JobStatus.CLOSED) {
            throw new IllegalStateException("Can only reopen on-hold or closed jobs");
        }
        this.status = JobStatus.OPEN;
    }

    /**
     * Close the job posting.
     */
    public void close() {
        this.status = JobStatus.CLOSED;
    }

    /**
     * Mark positions as filled.
     */
    public void markAsFilled() {
        this.status = JobStatus.FILLED;
        this.positionsFilled = this.positionsAvailable;
    }

    /**
     * Cancel the job posting.
     */
    public void cancel() {
        this.status = JobStatus.CANCELLED;
    }

    /**
     * Increment application count.
     */
    public void incrementApplicationCount() {
        this.applicationCount++;
    }

    /**
     * Increment applications (alias for incrementApplicationCount).
     */
    public void incrementApplications() {
        incrementApplicationCount();
    }

    /**
     * Increment view count.
     */
    public void incrementViewCount() {
        this.viewCount++;
    }

    /**
     * Increment views (alias for incrementViewCount).
     */
    public void incrementViews() {
        incrementViewCount();
    }

    /**
     * Fill a position.
     */
    public void fillPosition() {
        this.positionsFilled++;
        if (this.positionsFilled >= this.positionsAvailable) {
            this.status = JobStatus.FILLED;
        }
    }

    /**
     * Check if the job is accepting applications.
     */
    public boolean isAcceptingApplications() {
        if (status != JobStatus.OPEN) {
            return false;
        }
        if (closingDate != null && LocalDate.now().isAfter(closingDate)) {
            return false;
        }
        return positionsFilled < positionsAvailable;
    }

    /**
     * Get salary range display.
     */
    public String getSalaryRange() {
        if (!showSalary || (salaryMin == null && salaryMax == null)) {
            return "Negotiable";
        }
        if (salaryMin != null && salaryMax != null) {
            return String.format("R%,.0f - R%,.0f", salaryMin, salaryMax);
        }
        if (salaryMin != null) {
            return String.format("From R%,.0f", salaryMin);
        }
        return String.format("Up to R%,.0f", salaryMax);
    }
}
