package com.surework.recruitment.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Represents a candidate/job seeker in the system.
 * The tenantId field provides defense-in-depth for tenant isolation.
 */
@Entity
@Table(name = "candidates", indexes = {
        @Index(name = "idx_candidates_email", columnList = "email"),
        @Index(name = "idx_candidates_phone", columnList = "phone"),
        @Index(name = "idx_candidates_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
public class Candidate extends BaseEntity {

    /**
     * Tenant ID for defense-in-depth isolation.
     * Primary isolation is via schema-per-tenant; this is a secondary safeguard.
     */
    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "candidate_reference", nullable = false, unique = true)
    private String candidateReference;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "phone")
    private String phone;

    @Column(name = "alternate_phone")
    private String alternatePhone;

    @Column(name = "id_number")
    private String idNumber;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender")
    private Gender gender;

    @Column(name = "nationality")
    private String nationality;

    // Address
    @Column(name = "address_line1")
    private String addressLine1;

    @Column(name = "address_line2")
    private String addressLine2;

    @Column(name = "city")
    private String city;

    @Column(name = "province")
    private String province;

    @Column(name = "postal_code")
    private String postalCode;

    // Professional Information
    @Column(name = "current_job_title")
    private String currentJobTitle;

    @Column(name = "current_employer")
    private String currentEmployer;

    @Column(name = "years_experience")
    private Integer yearsExperience;

    @Column(name = "highest_qualification")
    private String highestQualification;

    @Column(name = "field_of_study")
    private String fieldOfStudy;

    @Column(name = "skills", columnDefinition = "TEXT")
    private String skills;

    @Column(name = "languages")
    private String languages;

    // Employment Preferences
    @Column(name = "expected_salary", precision = 12, scale = 2)
    private java.math.BigDecimal expectedSalary;

    @Column(name = "notice_period_days")
    private Integer noticePeriodDays;

    @Column(name = "available_from")
    private LocalDate availableFrom;

    @Column(name = "willing_to_relocate")
    private boolean willingToRelocate = false;

    @Column(name = "preferred_locations")
    private String preferredLocations;

    // Documents
    @Column(name = "resume_file_id")
    private UUID resumeFileId;

    @Column(name = "resume_file_name")
    private String resumeFileName;

    @Column(name = "cover_letter_file_id")
    private UUID coverLetterFileId;

    @Column(name = "linkedin_url")
    private String linkedinUrl;

    @Column(name = "portfolio_url")
    private String portfolioUrl;

    // Status
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private CandidateStatus status = CandidateStatus.ACTIVE;

    @Column(name = "source")
    private String source; // Where did they find us?

    @Column(name = "referred_by")
    private String referredBy;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // Internal fields
    @Column(name = "internal_candidate")
    private boolean internalCandidate = false;

    @Column(name = "employee_id")
    private UUID employeeId; // If internal candidate

    @Column(name = "blacklisted")
    private boolean blacklisted = false;

    @Column(name = "blacklist_reason")
    private String blacklistReason;

    @OneToMany(mappedBy = "candidate", cascade = CascadeType.ALL)
    private List<Application> applications = new ArrayList<>();

    /**
     * Gender options.
     */
    public enum Gender {
        MALE,
        FEMALE,
        OTHER,
        PREFER_NOT_TO_SAY
    }

    /**
     * Candidate statuses.
     */
    public enum CandidateStatus {
        ACTIVE,         // Active in the system
        INACTIVE,       // Not actively looking
        HIRED,          // Hired by the company
        BLACKLISTED,    // Not eligible for hire
        ARCHIVED        // Old record, archived
    }

    /**
     * Create a new candidate.
     */
    public static Candidate create(String firstName, String lastName, String email) {
        Candidate candidate = new Candidate();
        candidate.setFirstName(firstName);
        candidate.setLastName(lastName);
        candidate.setEmail(email);
        candidate.setCandidateReference(generateCandidateReference());
        candidate.setStatus(CandidateStatus.ACTIVE);
        return candidate;
    }

    private static String generateCandidateReference() {
        return "CAN-" + System.currentTimeMillis() % 100000 + "-" +
                UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    }

    /**
     * Get full name.
     */
    public String getFullName() {
        return firstName + " " + lastName;
    }

    /**
     * Mark candidate as hired.
     */
    public void markAsHired(UUID employeeId) {
        this.status = CandidateStatus.HIRED;
        this.employeeId = employeeId;
    }

    /**
     * Blacklist the candidate.
     */
    public void blacklist(String reason) {
        this.status = CandidateStatus.BLACKLISTED;
        this.blacklisted = true;
        this.blacklistReason = reason;
    }

    /**
     * Remove from blacklist.
     */
    public void removeFromBlacklist() {
        this.status = CandidateStatus.ACTIVE;
        this.blacklisted = false;
        this.blacklistReason = null;
    }

    /**
     * Archive the candidate.
     */
    public void archive() {
        this.status = CandidateStatus.ARCHIVED;
    }

    /**
     * Check if candidate can apply for jobs.
     */
    public boolean canApply() {
        return status == CandidateStatus.ACTIVE && !blacklisted;
    }

    /**
     * Get experience level description.
     */
    public String getExperienceLevel() {
        if (yearsExperience == null) {
            return "Not specified";
        }
        if (yearsExperience < 1) {
            return "Entry Level";
        }
        if (yearsExperience < 3) {
            return "Junior (1-2 years)";
        }
        if (yearsExperience < 6) {
            return "Mid-Level (3-5 years)";
        }
        if (yearsExperience < 10) {
            return "Senior (6-9 years)";
        }
        return "Expert (10+ years)";
    }
}
