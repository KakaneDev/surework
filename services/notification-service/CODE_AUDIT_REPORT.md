# Notification Service - Code Audit Report

**Project:** Notification Service (SureWork ERP)
**Audit Date:** 2026-01-27
**Auditor:** Java Code Auditor (20yr exp)
**Scope:** All notification service Java code (`services/notification-service/src/main/java/...`)
**Fixes Applied:** 2026-01-27

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Overall Score** | A- (was B+) |
| **Critical Issues** | 0 |
| **High Issues** | 1 (was 3, 2 fixed) |
| **Medium Issues** | 2 (was 5, 3 fixed) |
| **Low Issues** | 4 |
| **Lines of Code** | ~2,100 |
| **Test Coverage** | 0% (No tests found) |

The notification service demonstrates solid architectural patterns with proper layering, clean use of Java 21 features (records, sealed interfaces, pattern matching), and good security practices.

### Fixes Applied (2026-01-27)
- ✅ **[HIGH-001]** Removed development authentication fallback - now throws AccessDeniedException
- ✅ **[HIGH-003]** Reject anonymous WebSocket connections with MessageDeliveryException
- ✅ **[MED-002]** Added JWT secret validation at startup with profile-aware checks
- ✅ **[MED-004]** Added @Min/@Max validation on limit parameter
- ✅ **[MED-005]** Added Resilience4j retry and circuit breaker for HTTP calls

---

## Critical Findings

**None** - No critical security vulnerabilities or data loss risks found.

---

## High Priority Issues

### [HIGH-001] Development Authentication Fallback in Production Code
**Location:** `NotificationController.java:165-172`
**Severity:** HIGH
**Category:** Security

**Issue:** Controller has a hardcoded fallback user ID for when no authentication is present.

```java
private UUID getUserId(UserPrincipal user) {
    if (user != null && user.userId() != null) {
        return user.userId();
    }
    // Development fallback - use a fixed UUID for testing without authentication
    log.warn("No authenticated user found, using development fallback user ID");
    return UUID.fromString("00000000-0000-0000-0000-000000000001");
}
```

**Risk:** In production, an unauthenticated request would receive a fallback user ID, potentially exposing another user's notifications or allowing unauthorized notification creation.

**Recommendation:**
```java
private UUID getUserId(UserPrincipal user) {
    if (user == null || user.userId() == null) {
        throw new AccessDeniedException("User authentication required");
    }
    return user.userId();
}
```

---

### [HIGH-002] Missing Test Coverage
**Location:** `src/test/java/...` (empty)
**Severity:** HIGH
**Category:** Quality Assurance

**Issue:** No unit tests, integration tests, or test classes found in the project.

**Risk:**
- Regressions can be introduced without detection
- Service behavior is undocumented through tests
- Refactoring becomes risky

**Recommendation:** Add comprehensive tests:
1. Unit tests for `NotificationServiceImpl` (CRUD operations)
2. Unit tests for `DomainEventNotificationListener` (event handling)
3. Integration tests for `NotificationController` (API endpoints)
4. WebSocket tests for `NotificationWebSocketHandler`

---

### [HIGH-003] Anonymous WebSocket Connections Allowed
**Location:** `WebSocketSecurityConfig.java:109-111`
**Severity:** HIGH
**Category:** Security

**Issue:** WebSocket connections proceed without authentication when no token is present.

```java
} else {
    log.debug("No auth token in WebSocket CONNECT, allowing anonymous connection");
}
```

**Risk:** Anonymous users can subscribe to WebSocket topics. While `convertAndSendToUser()` requires a principal, broadcast messages on `/topic/notifications` could be received by unauthenticated clients.

**Recommendation:**
```java
} else {
    log.warn("WebSocket connection rejected - no authentication provided");
    throw new MessageDeliveryException("Authentication required for WebSocket connection");
}
```

---

## Medium Priority Issues

### [MED-001] No Rate Limiting on Notification Endpoints
**Location:** `NotificationController.java`
**Severity:** MEDIUM
**Category:** Security/Performance

**Issue:** No rate limiting on notification creation or read operations.

**Risk:** Malicious actors could flood the system with notification requests, causing:
- Database exhaustion
- WebSocket broadcast storms
- Denial of service for legitimate users

**Recommendation:** Add rate limiting with Spring annotations or Bucket4j:
```java
@RateLimiter(name = "notificationCreate", fallbackMethod = "rateLimitFallback")
@PostMapping("/test")
public ResponseEntity<NotificationDto.Response> createTestNotification(...) {
```

---

### [MED-002] Hardcoded JWT Secret Default Value
**Location:** `JwtHeaderAuthenticationFilter.java:43-44`, `WebSocketSecurityConfig.java:39`
**Severity:** MEDIUM
**Category:** Security

**Issue:** JWT secret has a default value that could be used if environment variable is not set.

```java
@Value("${surework.admin.jwt.secret:surework-jwt-secret-key-for-development-only-change-in-production}")
private String jwtSecret;
```

**Risk:** If `JWT_SECRET` environment variable is not configured in production, the default development secret would be used, allowing token forgery.

**Recommendation:**
1. Remove the default value in production profiles
2. Add startup validation to fail if secret is too short or matches default
```java
@PostConstruct
public void validateSecret() {
    if (jwtSecret.contains("development") || jwtSecret.length() < 32) {
        throw new IllegalStateException("Invalid JWT secret - production secret required");
    }
}
```

---

### [MED-003] TODO Markers in Production Code
**Location:** `NotificationCommandConsumer.java:49,56,63`
**Severity:** MEDIUM
**Category:** Code Quality

**Issue:** TODO markers indicate incomplete functionality.

```java
// TODO: Implement email service when needed
// TODO: Implement SMS service integration
// TODO: Implement push notification service integration
```

**Risk:** Features may appear complete to users but are not implemented. TODOs in production code indicate technical debt.

**Recommendation:** Either:
1. Implement the features
2. Remove the TODO code and track as backlog items
3. Throw `UnsupportedOperationException` with clear message

---

### [MED-004] Missing Input Validation on `limit` Parameter
**Location:** `NotificationController.java:51-54`
**Severity:** MEDIUM
**Category:** Validation

**Issue:** The `limit` parameter is capped at 20 but has no minimum validation.

```java
@RequestParam(defaultValue = "10") int limit
...
Math.min(limit, 20)
```

**Risk:** A negative or zero limit could cause unexpected behavior depending on repository implementation.

**Recommendation:**
```java
@RequestParam(defaultValue = "10") @Min(1) @Max(50) int limit
```

---

### [MED-005] No Retry Logic for RecipientResolver HTTP Calls
**Location:** `RecipientResolverImpl.java:32-80`
**Severity:** MEDIUM
**Category:** Resilience

**Issue:** HTTP calls to HR and Recruitment services have no retry logic or circuit breaker.

**Risk:** Transient network failures cause notification delivery failures silently (logged as warning but notification not sent).

**Recommendation:** Add resilience4j retry and circuit breaker:
```java
@Retry(name = "hrService", fallbackMethod = "getUserIdFallback")
@CircuitBreaker(name = "hrService")
public Optional<UUID> getEmployeeUserId(UUID employeeId) {
```

---

## Low Priority Issues

### [LOW-001] DomainEventNotificationListener Size
**Location:** `DomainEventNotificationListener.java` (417 lines)
**Severity:** LOW
**Category:** Maintainability

**Issue:** Single class handles all domain events. While pattern matching keeps it readable, it may grow unwieldy as more event types are added.

**Recommendation:** Consider splitting into domain-specific handlers (HrEventHandler, PayrollEventHandler, etc.) using a common interface.

---

### [LOW-002] Magic Numbers in WebSocket Configuration
**Location:** `WebSocketConfig.java:47-62`
**Severity:** LOW
**Category:** Maintainability

**Issue:** Buffer sizes and timeouts are hardcoded.

```java
registry.setMessageSizeLimit(128 * 1024);  // 128KB
registry.setSendBufferSizeLimit(512 * 1024);  // 512KB
.setDisconnectDelay(30 * 1000)  // 30 seconds
```

**Recommendation:** Extract to configuration properties for environment-specific tuning.

---

### [LOW-003] Missing OpenAPI Documentation Annotations
**Location:** `NotificationController.java`
**Severity:** LOW
**Category:** Documentation

**Issue:** Controller endpoints lack `@Operation`, `@ApiResponse` annotations for OpenAPI documentation.

**Recommendation:** Add swagger annotations:
```java
@Operation(summary = "Get paginated notifications for current user")
@ApiResponses({
    @ApiResponse(responseCode = "200", description = "Notifications retrieved"),
    @ApiResponse(responseCode = "401", description = "Not authenticated")
})
@GetMapping
public ResponseEntity<PageResponse<NotificationDto.Response>> getNotifications(...)
```

---

### [LOW-004] Overly Permissive CORS Configuration
**Location:** `WebSocketConfig.java:57,66`
**Severity:** LOW
**Category:** Security

**Issue:** WebSocket endpoints allow all origins with `setAllowedOriginPatterns("*")`.

**Recommendation:** Restrict to known origins in production:
```java
.setAllowedOriginPatterns("https://*.surework.com", "http://localhost:*")
```

---

## Positive Observations

### Modern Java Usage (Excellent)
- Proper use of Java 21 sealed interfaces and records for DTOs
- Pattern matching in switch expressions for type-safe event handling
- Records for immutable data structures (`UserPrincipal`, `NotificationDto.*`)

### Clean Architecture (Good)
- Proper separation: Controller → Service → Repository
- Domain events handled in dedicated listener
- WebSocket concerns isolated from business logic

### Database Design (Good)
- Proper indexing for query patterns (user + read status, user + created_at)
- Soft delete pattern implemented
- Flyway migrations for schema management

### Security Implementation (Good)
- JWT validation in both HTTP and WebSocket paths
- Multi-tenant support via header propagation
- User isolation in all database queries

---

## Recommendations Summary

### Immediate (Before Release)
1. **[HIGH-001]** Remove development fallback authentication - throw exception instead
2. **[HIGH-003]** Reject unauthenticated WebSocket connections
3. **[MED-002]** Add startup validation for JWT secret

### Short-term (Next Sprint)
4. **[HIGH-002]** Add unit and integration test coverage (target 80%)
5. **[MED-001]** Implement rate limiting on API endpoints
6. **[MED-005]** Add retry/circuit breaker for HTTP calls

### Long-term (Backlog)
7. **[MED-003]** Implement or remove TODO email/SMS/push features
8. **[LOW-001]** Consider splitting event listener by domain
9. **[LOW-003]** Add OpenAPI annotations
10. **[LOW-004]** Restrict CORS origins

---

## Files Audited

| File | Lines | Issues Found |
|------|-------|--------------|
| `DomainEventNotificationListener.java` | 417 | 1 (size) |
| `JwtHeaderAuthenticationFilter.java` | 192 | 1 (default secret) |
| `NotificationController.java` | 173 | 2 (fallback auth, missing validation) |
| `WebSocketSecurityConfig.java` | 159 | 2 (anonymous allowed, default secret) |
| `Notification.java` (entity) | 142 | 0 |
| `NotificationServiceImpl.java` | 135 | 0 |
| `NotificationDto.java` | 119 | 0 |
| `NotificationRepository.java` | 91 | 0 |
| `RecipientResolverImpl.java` | 86 | 1 (no retry) |
| `NotificationWebSocketHandler.java` | 81 | 0 |
| `WebSocketConfig.java` | 70 | 2 (magic numbers, CORS) |
| `NotificationCommandConsumer.java` | 66 | 1 (TODOs) |
| Other files | 207 | 0 |

---

*Report generated by Java Code Auditor skill. For implementation of fixes, use the `/java-backend-developer` skill.*
