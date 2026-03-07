package com.surework.reporting.client.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Interview data transfer object from Recruitment Service.
 */
public record InterviewDto(
        UUID id,
        UUID applicationId,
        String interviewType,
        int roundNumber,
        LocalDateTime scheduledAt,
        int durationMinutes,
        LocalDateTime endTime,
        String locationType,
        String locationDetails,
        String meetingLink,
        UUID interviewerId,
        String interviewerName,
        String interviewerEmail,
        String status,
        LocalDateTime confirmedAt,
        LocalDateTime startedAt,
        LocalDateTime completedAt,
        LocalDateTime cancelledAt,
        String cancellationReason,
        Integer technicalRating,
        Integer communicationRating,
        Integer culturalFitRating,
        Integer overallRating,
        String recommendation,
        String feedback,
        String strengths,
        String concerns,
        LocalDateTime feedbackSubmittedAt
) {}
