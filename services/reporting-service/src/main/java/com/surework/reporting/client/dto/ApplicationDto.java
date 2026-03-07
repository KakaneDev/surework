package com.surework.reporting.client.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Application data transfer object from Recruitment Service.
 */
public record ApplicationDto(
        UUID id,
        String applicationReference,
        UUID candidateId,
        String candidateName,
        UUID jobPostingId,
        String jobTitle,
        LocalDate applicationDate,
        String status,
        String stage,
        Integer screeningScore,
        String screeningNotes,
        UUID screenedBy,
        LocalDateTime screenedAt,
        Integer assessmentScore,
        String assessmentNotes,
        int interviewCount,
        Integer overallInterviewRating,
        BigDecimal offerSalary,
        LocalDate offerDate,
        LocalDate offerExpiryDate,
        LocalDate offerResponseDate,
        LocalDate expectedStartDate,
        String rejectionReason,
        String rejectionNotes,
        UUID rejectedBy,
        LocalDateTime rejectedAt,
        String withdrawnReason,
        LocalDateTime withdrawnAt,
        Integer overallRating,
        boolean starred,
        String source,
        LocalDateTime createdAt
) {}
