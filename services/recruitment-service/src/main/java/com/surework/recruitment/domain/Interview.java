package com.surework.recruitment.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Represents an interview scheduled for a job application.
 * The tenantId field provides defense-in-depth for tenant isolation.
 */
@Entity
@Table(name = "interviews", indexes = {
        @Index(name = "idx_interviews_application", columnList = "application_id"),
        @Index(name = "idx_interviews_scheduled", columnList = "scheduled_at"),
        @Index(name = "idx_interviews_interviewer", columnList = "interviewer_id"),
        @Index(name = "idx_interviews_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
public class Interview extends BaseEntity {

    /**
     * Tenant ID for defense-in-depth isolation.
     * Primary isolation is via schema-per-tenant; this is a secondary safeguard.
     */
    @Column(name = "tenant_id")
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Enumerated(EnumType.STRING)
    @Column(name = "interview_type", nullable = false)
    private InterviewType interviewType;

    @Column(name = "round_number")
    private int roundNumber = 1;

    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    @Column(name = "duration_minutes")
    private int durationMinutes = 60;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "location_type", nullable = false)
    private LocationType locationType;

    @Column(name = "location_details")
    private String locationDetails; // Office address, meeting room, etc.

    @Column(name = "meeting_link")
    private String meetingLink; // Video call link

    @Column(name = "meeting_id")
    private String meetingId;

    @Column(name = "meeting_password")
    private String meetingPassword;

    // Interviewer information
    @Column(name = "interviewer_id")
    private UUID interviewerId;

    @Column(name = "interviewer_name")
    private String interviewerName;

    @Column(name = "interviewer_email")
    private String interviewerEmail;

    // Additional interviewers (comma-separated IDs)
    @Column(name = "panel_interviewer_ids")
    private String panelInterviewerIds;

    @Column(name = "panel_interviewer_names")
    private String panelInterviewerNames;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private InterviewStatus status = InterviewStatus.SCHEDULED;

    // Preparation
    @Column(name = "agenda", columnDefinition = "TEXT")
    private String agenda;

    @Column(name = "topics_to_cover", columnDefinition = "TEXT")
    private String topicsToCover;

    @Column(name = "preparation_notes", columnDefinition = "TEXT")
    private String preparationNotes;

    // Feedback
    @Column(name = "technical_rating")
    private Integer technicalRating; // 1-5

    @Column(name = "communication_rating")
    private Integer communicationRating; // 1-5

    @Column(name = "cultural_fit_rating")
    private Integer culturalFitRating; // 1-5

    @Column(name = "overall_rating")
    private Integer overallRating; // 1-5

    @Enumerated(EnumType.STRING)
    @Column(name = "recommendation")
    private Recommendation recommendation;

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "strengths", columnDefinition = "TEXT")
    private String strengths;

    @Column(name = "concerns", columnDefinition = "TEXT")
    private String concerns;

    @Column(name = "questions_asked", columnDefinition = "TEXT")
    private String questionsAsked;

    @Column(name = "candidate_questions", columnDefinition = "TEXT")
    private String candidateQuestions;

    // Completion tracking
    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "feedback_submitted_at")
    private Instant feedbackSubmittedAt;

    // Cancellation/reschedule
    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "cancellation_reason")
    private String cancellationReason;

    @Column(name = "rescheduled_from")
    private LocalDateTime rescheduledFrom;

    @Column(name = "reschedule_reason")
    private String rescheduleReason;

    // Notifications
    @Column(name = "candidate_notified")
    private boolean candidateNotified = false;

    @Column(name = "interviewer_notified")
    private boolean interviewerNotified = false;

    @Column(name = "reminder_sent")
    private boolean reminderSent = false;

    /**
     * Interview types.
     */
    public enum InterviewType {
        PHONE_SCREEN,       // Initial phone screening
        VIDEO_CALL,         // Video interview
        IN_PERSON,          // Face-to-face
        TECHNICAL,          // Technical assessment
        BEHAVIORAL,         // Behavioral interview
        PANEL,              // Panel interview
        GROUP,              // Group interview
        CASE_STUDY,         // Case study presentation
        FINAL               // Final round
    }

    /**
     * Location types.
     */
    public enum LocationType {
        ONSITE,             // At company office
        REMOTE,             // Online video/phone call
        HYBRID              // Mix of onsite and remote
    }

    /**
     * Interview statuses.
     */
    public enum InterviewStatus {
        SCHEDULED,          // Interview scheduled
        CONFIRMED,          // Candidate confirmed
        IN_PROGRESS,        // Currently happening
        COMPLETED,          // Interview done
        FEEDBACK_PENDING,   // Awaiting feedback
        FEEDBACK_SUBMITTED, // Feedback provided
        CANCELLED,          // Cancelled
        NO_SHOW,            // Candidate didn't show
        RESCHEDULED         // Being rescheduled
    }

    /**
     * Interview recommendations.
     */
    public enum Recommendation {
        STRONG_HIRE,        // Definitely hire
        HIRE,               // Recommend hiring
        LEAN_HIRE,          // Slightly positive
        NEUTRAL,            // No strong opinion
        LEAN_NO_HIRE,       // Slightly negative
        NO_HIRE,            // Don't recommend
        STRONG_NO_HIRE      // Definitely don't hire
    }

    /**
     * Create a new interview.
     */
    public static Interview create(Application application, InterviewType type,
                                    LocalDateTime scheduledAt, int durationMinutes) {
        Interview interview = new Interview();
        interview.setApplication(application);
        interview.setInterviewType(type);
        interview.setScheduledAt(scheduledAt);
        interview.setDurationMinutes(durationMinutes);
        interview.setEndTime(scheduledAt.plusMinutes(durationMinutes));
        interview.setStatus(InterviewStatus.SCHEDULED);
        interview.setLocationType(type == InterviewType.IN_PERSON ?
                LocationType.ONSITE : LocationType.REMOTE);
        return interview;
    }

    /**
     * Confirm the interview.
     */
    public void confirm() {
        if (status != InterviewStatus.SCHEDULED) {
            throw new IllegalStateException("Can only confirm scheduled interviews");
        }
        this.status = InterviewStatus.CONFIRMED;
    }

    /**
     * Start the interview.
     */
    public void start() {
        this.status = InterviewStatus.IN_PROGRESS;
        this.startedAt = Instant.now();
    }

    /**
     * Complete the interview.
     */
    public void complete() {
        this.status = InterviewStatus.COMPLETED;
        this.completedAt = Instant.now();
    }

    /**
     * Submit feedback.
     */
    public void submitFeedback(Integer technicalRating, Integer communicationRating,
                                Integer culturalFitRating, Integer overallRating,
                                Recommendation recommendation, String feedback) {
        this.technicalRating = technicalRating;
        this.communicationRating = communicationRating;
        this.culturalFitRating = culturalFitRating;
        this.overallRating = overallRating;
        this.recommendation = recommendation;
        this.feedback = feedback;
        this.feedbackSubmittedAt = Instant.now();
        this.status = InterviewStatus.FEEDBACK_SUBMITTED;
    }

    /**
     * Submit feedback with strengths and concerns.
     */
    public void submitFeedback(Integer technicalRating, Integer communicationRating,
                                Integer culturalFitRating, Integer overallRating,
                                Recommendation recommendation, String feedback,
                                String strengths, String concerns) {
        submitFeedback(technicalRating, communicationRating, culturalFitRating,
                overallRating, recommendation, feedback);
        this.strengths = strengths;
        this.concerns = concerns;
    }

    /**
     * Cancel the interview.
     */
    public void cancel(String reason) {
        this.status = InterviewStatus.CANCELLED;
        this.cancellationReason = reason;
        this.cancelledAt = Instant.now();
    }

    /**
     * Mark as no-show.
     */
    public void markAsNoShow() {
        this.status = InterviewStatus.NO_SHOW;
        this.completedAt = Instant.now();
    }

    /**
     * Reschedule the interview.
     */
    public void reschedule(LocalDateTime newDateTime, String reason) {
        this.rescheduledFrom = this.scheduledAt;
        this.rescheduleReason = reason;
        this.scheduledAt = newDateTime;
        this.endTime = newDateTime.plusMinutes(this.durationMinutes);
        this.status = InterviewStatus.SCHEDULED;
        this.candidateNotified = false;
        this.interviewerNotified = false;
    }

    /**
     * Calculate average rating.
     */
    public Double getAverageRating() {
        int count = 0;
        int total = 0;

        if (technicalRating != null) {
            total += technicalRating;
            count++;
        }
        if (communicationRating != null) {
            total += communicationRating;
            count++;
        }
        if (culturalFitRating != null) {
            total += culturalFitRating;
            count++;
        }
        if (overallRating != null) {
            total += overallRating;
            count++;
        }

        return count > 0 ? (double) total / count : null;
    }

    /**
     * Check if interview is upcoming.
     */
    public boolean isUpcoming() {
        return (status == InterviewStatus.SCHEDULED || status == InterviewStatus.CONFIRMED) &&
                scheduledAt.isAfter(LocalDateTime.now());
    }

    /**
     * Check if interview needs feedback.
     */
    public boolean needsFeedback() {
        return status == InterviewStatus.COMPLETED || status == InterviewStatus.FEEDBACK_PENDING;
    }
}
