package com.surework.admin.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Audit log entity for tracking system activities.
 * Essential for POPI Act compliance.
 */
@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id")
    private UUID tenantId;

    // Event identification
    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private EventType eventType;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_category", nullable = false)
    private EventCategory eventCategory;

    @Column(name = "event_action", nullable = false)
    private String eventAction;

    // Resource information
    @Column(name = "resource_type", nullable = false)
    private String resourceType;

    @Column(name = "resource_id")
    private String resourceId;

    @Column(name = "resource_name")
    private String resourceName;

    // Actor information
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "username")
    private String username;

    @Column(name = "user_email")
    private String userEmail;

    @Column(name = "actor_type")
    @Enumerated(EnumType.STRING)
    private ActorType actorType = ActorType.USER;

    // Request information
    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "request_method")
    private String requestMethod;

    @Column(name = "request_path")
    private String requestPath;

    @Column(name = "request_id")
    private String requestId;

    // Change tracking
    @Column(name = "old_value", columnDefinition = "jsonb")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "jsonb")
    private String newValue;

    @Column(name = "changes", columnDefinition = "jsonb")
    private String changes;  // Summary of what changed

    // Status
    @Column(nullable = false)
    private boolean success = true;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "error_code")
    private String errorCode;

    // Timing
    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    @Column(name = "duration_ms")
    private Long durationMs;

    // Additional context
    @Column(name = "context", columnDefinition = "jsonb")
    private String context;

    // Enums
    public enum EventType {
        // Authentication events
        LOGIN_SUCCESS,
        LOGIN_FAILURE,
        LOGOUT,
        PASSWORD_CHANGE,
        PASSWORD_RESET,
        MFA_ENABLED,
        MFA_DISABLED,
        ACCOUNT_LOCKED,
        ACCOUNT_UNLOCKED,

        // CRUD events
        CREATE,
        READ,
        UPDATE,
        DELETE,

        // Business events
        APPROVE,
        REJECT,
        SUBMIT,
        PROCESS,
        EXPORT,
        IMPORT,

        // System events
        SYSTEM_START,
        SYSTEM_STOP,
        CONFIG_CHANGE,
        TENANT_CREATE,
        TENANT_SUSPEND,
        TENANT_ACTIVATE,

        // Access events
        ACCESS_GRANTED,
        ACCESS_DENIED,
        PERMISSION_CHANGE,
        ROLE_CHANGE
    }

    public enum EventCategory {
        AUTHENTICATION,
        AUTHORIZATION,
        DATA_ACCESS,
        DATA_MODIFICATION,
        SYSTEM,
        COMPLIANCE,
        SECURITY,
        BUSINESS_PROCESS
    }

    public enum ActorType {
        USER,
        SYSTEM,
        API,
        SCHEDULED_JOB,
        INTEGRATION
    }

    // Builder pattern for easier creation
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final AuditLog log = new AuditLog();

        public Builder tenantId(UUID tenantId) {
            log.tenantId = tenantId;
            return this;
        }

        public Builder eventType(EventType eventType) {
            log.eventType = eventType;
            return this;
        }

        public Builder eventCategory(EventCategory category) {
            log.eventCategory = category;
            return this;
        }

        public Builder eventAction(String action) {
            log.eventAction = action;
            return this;
        }

        public Builder resource(String type, String id, String name) {
            log.resourceType = type;
            log.resourceId = id;
            log.resourceName = name;
            return this;
        }

        public Builder user(UUID userId, String username, String email) {
            log.userId = userId;
            log.username = username;
            log.userEmail = email;
            return this;
        }

        public Builder actorType(ActorType actorType) {
            log.actorType = actorType;
            return this;
        }

        public Builder request(String method, String path, String ipAddress, String userAgent) {
            log.requestMethod = method;
            log.requestPath = path;
            log.ipAddress = ipAddress;
            log.userAgent = userAgent;
            return this;
        }

        public Builder requestId(String requestId) {
            log.requestId = requestId;
            return this;
        }

        public Builder changes(String oldValue, String newValue, String changes) {
            log.oldValue = oldValue;
            log.newValue = newValue;
            log.changes = changes;
            return this;
        }

        public Builder success(boolean success) {
            log.success = success;
            return this;
        }

        public Builder error(String code, String message) {
            log.success = false;
            log.errorCode = code;
            log.errorMessage = message;
            return this;
        }

        public Builder duration(Long durationMs) {
            log.durationMs = durationMs;
            return this;
        }

        public Builder context(String context) {
            log.context = context;
            return this;
        }

        public AuditLog build() {
            if (log.eventType == null) throw new IllegalStateException("Event type is required");
            if (log.eventCategory == null) throw new IllegalStateException("Event category is required");
            if (log.eventAction == null) throw new IllegalStateException("Event action is required");
            if (log.resourceType == null) throw new IllegalStateException("Resource type is required");
            return log;
        }
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }

    public EventType getEventType() { return eventType; }
    public void setEventType(EventType eventType) { this.eventType = eventType; }

    public EventCategory getEventCategory() { return eventCategory; }
    public void setEventCategory(EventCategory eventCategory) { this.eventCategory = eventCategory; }

    public String getEventAction() { return eventAction; }
    public void setEventAction(String eventAction) { this.eventAction = eventAction; }

    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }

    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }

    public String getResourceName() { return resourceName; }
    public void setResourceName(String resourceName) { this.resourceName = resourceName; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public ActorType getActorType() { return actorType; }
    public void setActorType(ActorType actorType) { this.actorType = actorType; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public String getRequestMethod() { return requestMethod; }
    public void setRequestMethod(String requestMethod) { this.requestMethod = requestMethod; }

    public String getRequestPath() { return requestPath; }
    public void setRequestPath(String requestPath) { this.requestPath = requestPath; }

    public String getRequestId() { return requestId; }
    public void setRequestId(String requestId) { this.requestId = requestId; }

    public String getOldValue() { return oldValue; }
    public void setOldValue(String oldValue) { this.oldValue = oldValue; }

    public String getNewValue() { return newValue; }
    public void setNewValue(String newValue) { this.newValue = newValue; }

    public String getChanges() { return changes; }
    public void setChanges(String changes) { this.changes = changes; }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public Long getDurationMs() { return durationMs; }
    public void setDurationMs(Long durationMs) { this.durationMs = durationMs; }

    public String getContext() { return context; }
    public void setContext(String context) { this.context = context; }
}
