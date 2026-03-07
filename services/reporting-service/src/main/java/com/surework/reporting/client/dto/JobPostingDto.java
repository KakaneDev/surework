package com.surework.reporting.client.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Job Posting data transfer object from Recruitment Service.
 */
public record JobPostingDto(
        UUID id,
        String jobReference,
        String title,
        UUID departmentId,
        String departmentName,
        String location,
        String employmentType,
        String status,
        String description,
        String requirements,
        Integer experienceYearsMin,
        Integer experienceYearsMax,
        BigDecimal salaryMin,
        BigDecimal salaryMax,
        boolean showSalary,
        int positionsAvailable,
        int positionsFilled,
        int applicationCount,
        int viewCount,
        UUID hiringManagerId,
        UUID recruiterId,
        boolean internalOnly,
        boolean remote,
        LocalDate postingDate,
        LocalDate closingDate,
        LocalDateTime createdAt
) {}
