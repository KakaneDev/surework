package com.surework.recruitment.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Represents a job posting/vacancy.
 * The tenantId field provides defense-in-depth for tenant isolation.
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

    /**
     * Tenant ID for defense-in-depth isolation.
     * Primary isolation is via schema-per-tenant; this is a secondary safeguard.
     */
    @Column(name = "tenant_id")
    private UUID tenantId;

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

    @Column(name = "internal_only")
    private boolean internalOnly = false;

    @Column(name = "remote")
    private boolean remote = false;

    // === Client & Engagement Fields ===

    @Column(name = "client_id")
    private UUID clientId;

    @Enumerated(EnumType.STRING)
    @Column(name = "client_visibility", length = 20)
    private ClientVisibility clientVisibility = ClientVisibility.HIDDEN;

    @Enumerated(EnumType.STRING)
    @Column(name = "compensation_type", length = 20)
    private CompensationType compensationType = CompensationType.MONTHLY;

    @Column(name = "salary_currency", length = 3)
    private String salaryCurrency = "ZAR";

    @Column(name = "project_name", length = 200)
    private String projectName;

    // === External Portal Publishing Fields ===

    @Column(name = "city", length = 100)
    private String city;

    @Enumerated(EnumType.STRING)
    @Column(name = "province", length = 50)
    private Province province;

    @Column(name = "postal_code", length = 10)
    private String postalCode;

    @Column(name = "country_code", length = 3)
    private String countryCode = "ZA";

    @Enumerated(EnumType.STRING)
    @Column(name = "industry", length = 50)
    private Industry industry;

    @Enumerated(EnumType.STRING)
    @Column(name = "education_level", length = 50)
    private EducationLevel educationLevel;

    @Column(name = "keywords", columnDefinition = "TEXT")
    private String keywords;

    @Column(name = "contract_duration", length = 50)
    private String contractDuration;

    @Column(name = "publish_to_external")
    private boolean publishToExternal = false;

    @Column(name = "external_portals", columnDefinition = "TEXT")
    private String externalPortals; // JSON array: ["PNET", "LINKEDIN", etc.]

    @Enumerated(EnumType.STRING)
    @Column(name = "company_mention_preference", length = 50)
    private CompanyMentionPreference companyMentionPreference = CompanyMentionPreference.ANONYMOUS;

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
     * South African provinces.
     */
    public enum Province {
        GAUTENG,
        WESTERN_CAPE,
        KWAZULU_NATAL,
        EASTERN_CAPE,
        FREE_STATE,
        LIMPOPO,
        MPUMALANGA,
        NORTH_WEST,
        NORTHERN_CAPE
    }

    /**
     * Industry sectors.
     */
    public enum Industry {
        IT_SOFTWARE,
        FINANCE_BANKING,
        HEALTHCARE,
        RETAIL,
        MANUFACTURING,
        CONSTRUCTION,
        EDUCATION,
        HOSPITALITY_TOURISM,
        LOGISTICS_TRANSPORT,
        LEGAL,
        MARKETING_ADVERTISING,
        HUMAN_RESOURCES,
        ENGINEERING,
        MINING,
        AGRICULTURE,
        TELECOMMUNICATIONS,
        REAL_ESTATE,
        MEDIA_ENTERTAINMENT,
        GOVERNMENT_PUBLIC_SECTOR,
        NON_PROFIT,
        OTHER
    }

    /**
     * Education level requirements.
     */
    public enum EducationLevel {
        NO_REQUIREMENT,
        MATRIC,
        CERTIFICATE,
        DIPLOMA,
        DEGREE,
        HONOURS,
        MASTERS,
        DOCTORATE
    }

    /**
     * How to reference the tenant company in external job postings.
     */
    public enum CompanyMentionPreference {
        ANONYMOUS,          // "A leading company in [industry]..."
        NAMED_BY_SUREWORK,  // "SureWork on behalf of [Tenant Name]..."
        DIRECT_MENTION      // Include tenant name directly in job description
    }

    /**
     * Compensation frequency types.
     */
    public enum CompensationType {
        HOURLY, DAILY, WEEKLY, MONTHLY, ANNUAL
    }

    /**
     * How to display the client name on public listings.
     */
    public enum ClientVisibility {
        SHOW_NAME,      // Show the actual client company name
        CONFIDENTIAL,   // Show "Confidential Client"
        HIDDEN          // Don't show any client info
    }

    /**
     * External job portals.
     */
    public enum JobPortal {
        PNET,
        LINKEDIN,
        INDEED,
        CAREERS24
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

        String currency = salaryCurrency != null ? salaryCurrency : "ZAR";
        String prefix = "ZAR".equals(currency) ? "R" : currency + " ";
        String suffix = getCompensationSuffix();

        if (salaryMin != null && salaryMax != null) {
            return String.format("%s%,.0f - %s%,.0f%s", prefix, salaryMin, prefix, salaryMax, suffix);
        }
        if (salaryMin != null) {
            return String.format("From %s%,.0f%s", prefix, salaryMin, suffix);
        }
        return String.format("Up to %s%,.0f%s", prefix, salaryMax, suffix);
    }

    private String getCompensationSuffix() {
        if (compensationType == null) return "/mo";
        return switch (compensationType) {
            case HOURLY -> "/hr";
            case DAILY -> "/day";
            case WEEKLY -> "/wk";
            case MONTHLY -> "/mo";
            case ANNUAL -> "/yr";
        };
    }

    // === External Portal Helper Methods ===

    private static final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Get the list of external portals to post to.
     */
    public Set<JobPortal> getExternalPortalSet() {
        if (externalPortals == null || externalPortals.isBlank()) {
            return Set.of();
        }
        try {
            List<String> portalNames = objectMapper.readValue(externalPortals, new TypeReference<>() {});
            return portalNames.stream()
                    .map(JobPortal::valueOf)
                    .collect(java.util.stream.Collectors.toSet());
        } catch (JsonProcessingException e) {
            return Set.of();
        }
    }

    /**
     * Set the list of external portals to post to.
     */
    public void setExternalPortalSet(Set<JobPortal> portals) {
        if (portals == null || portals.isEmpty()) {
            this.externalPortals = null;
            return;
        }
        try {
            List<String> portalNames = portals.stream()
                    .map(Enum::name)
                    .toList();
            this.externalPortals = objectMapper.writeValueAsString(portalNames);
        } catch (JsonProcessingException e) {
            this.externalPortals = null;
        }
    }

    /**
     * Check if the job should be posted to a specific portal.
     */
    public boolean shouldPostToPortal(JobPortal portal) {
        return publishToExternal && getExternalPortalSet().contains(portal);
    }

    /**
     * Get the full location string for external portals.
     */
    public String getFullLocation() {
        StringBuilder sb = new StringBuilder();
        if (city != null && !city.isBlank()) {
            sb.append(city);
        }
        if (province != null) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(province.name().replace("_", " "));
        }
        if (countryCode != null && !countryCode.isBlank()) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(countryCode);
        }
        return sb.length() > 0 ? sb.toString() : location;
    }

    /**
     * Get keywords as a list.
     */
    public List<String> getKeywordList() {
        if (keywords == null || keywords.isBlank()) {
            return List.of();
        }
        return List.of(keywords.split(",")).stream()
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
