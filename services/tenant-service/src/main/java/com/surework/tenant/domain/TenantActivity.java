package com.surework.tenant.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Tracks tenant activity for monitoring engagement and onboarding progress.
 */
@Entity
@Table(name = "tenant_activities", schema = "public", indexes = {
        @Index(name = "idx_tenant_activities_tenant", columnList = "tenant_id"),
        @Index(name = "idx_tenant_activities_type", columnList = "activity_type"),
        @Index(name = "idx_tenant_activities_created", columnList = "created_at DESC")
})
@Getter
@Setter
@NoArgsConstructor
public class TenantActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_type", nullable = false)
    private ActivityType activityType;

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "user_name")
    private String userName;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Activity types for tracking tenant events.
     */
    public enum ActivityType {
        // Onboarding activities
        TENANT_CREATED,
        ADMIN_USER_CREATED,
        FIRST_LOGIN,
        FIRST_EMPLOYEE_ADDED,
        ONBOARDING_COMPLETED,

        // User activities
        USER_LOGIN,
        USER_INVITED,
        USER_ACTIVATED,

        // Module activities
        LEAVE_REQUEST_SUBMITTED,
        LEAVE_REQUEST_APPROVED,
        PAYROLL_RUN,
        DOCUMENT_UPLOADED,
        EMPLOYEE_ADDED,

        // Admin activities
        SETTINGS_UPDATED,
        INTEGRATION_CONNECTED,
        SUBSCRIPTION_CHANGED,
        PAYMENT_RECEIVED,

        // Support
        SUPPORT_TICKET_CREATED,
        SUPPORT_HELP_SENT,

        // System
        IMPERSONATION_STARTED,
        IMPERSONATION_ENDED
    }

    /**
     * Factory method to create a new activity.
     */
    public static TenantActivity create(UUID tenantId, ActivityType type, String description) {
        TenantActivity activity = new TenantActivity();
        activity.setTenantId(tenantId);
        activity.setActivityType(type);
        activity.setDescription(description);
        return activity;
    }

    /**
     * Factory method with user info.
     */
    public static TenantActivity create(UUID tenantId, ActivityType type, String description,
                                         UUID userId, String userName) {
        TenantActivity activity = create(tenantId, type, description);
        activity.setUserId(userId);
        activity.setUserName(userName);
        return activity;
    }
}
