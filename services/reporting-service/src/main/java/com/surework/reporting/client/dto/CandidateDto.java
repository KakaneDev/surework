package com.surework.reporting.client.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Candidate data transfer object from Recruitment Service.
 */
public record CandidateDto(
        UUID id,
        String candidateReference,
        String firstName,
        String lastName,
        String email,
        String phone,
        String idNumber,
        LocalDate dateOfBirth,
        String gender,
        String nationality,
        String city,
        String province,
        String currentJobTitle,
        String currentEmployer,
        Integer yearsExperience,
        String highestQualification,
        String fieldOfStudy,
        String skills,
        BigDecimal expectedSalary,
        Integer noticePeriodDays,
        LocalDate availableFrom,
        boolean willingToRelocate,
        String preferredLocations,
        String linkedinUrl,
        String portfolioUrl,
        String status,
        String source,
        String referredBy,
        boolean internalCandidate,
        UUID employeeId,
        boolean blacklisted,
        LocalDateTime createdAt
) {
    public String fullName() {
        return firstName + " " + lastName;
    }
}
