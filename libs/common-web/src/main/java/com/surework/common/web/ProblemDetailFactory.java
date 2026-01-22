package com.surework.common.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.context.request.WebRequest;

import java.net.URI;
import java.time.Instant;
import java.util.Map;

/**
 * Factory for creating RFC 7807 ProblemDetail responses.
 * Implements Constitution Principle IV: API Design.
 *
 * Standard error response format for all SureWork APIs.
 */
public final class ProblemDetailFactory {

    private static final String ERROR_TYPE_BASE = "https://api.surework.co.za/errors/";

    private ProblemDetailFactory() {
        // Utility class
    }

    /**
     * Create a ProblemDetail for validation errors (400 Bad Request).
     */
    public static ProblemDetail badRequest(String detail, Map<String, Object> errors) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                detail
        );
        problem.setType(URI.create(ERROR_TYPE_BASE + "validation-error"));
        problem.setTitle("Validation Error");
        problem.setProperty("timestamp", Instant.now());
        if (errors != null && !errors.isEmpty()) {
            problem.setProperty("errors", errors);
        }
        return problem;
    }

    /**
     * Create a ProblemDetail for not found errors (404 Not Found).
     */
    public static ProblemDetail notFound(String resourceType, String resourceId) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND,
                String.format("%s with ID '%s' not found", resourceType, resourceId)
        );
        problem.setType(URI.create(ERROR_TYPE_BASE + "resource-not-found"));
        problem.setTitle("Resource Not Found");
        problem.setProperty("timestamp", Instant.now());
        problem.setProperty("resourceType", resourceType);
        problem.setProperty("resourceId", resourceId);
        return problem;
    }

    /**
     * Create a ProblemDetail for business rule violations (422 Unprocessable Entity).
     */
    public static ProblemDetail unprocessableEntity(String detail, String errorCode) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNPROCESSABLE_ENTITY,
                detail
        );
        problem.setType(URI.create(ERROR_TYPE_BASE + "business-rule-violation"));
        problem.setTitle("Business Rule Violation");
        problem.setProperty("timestamp", Instant.now());
        problem.setProperty("errorCode", errorCode);
        return problem;
    }

    /**
     * Create a ProblemDetail for authentication errors (401 Unauthorized).
     */
    public static ProblemDetail unauthorized(String detail) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNAUTHORIZED,
                detail
        );
        problem.setType(URI.create(ERROR_TYPE_BASE + "authentication-error"));
        problem.setTitle("Authentication Required");
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    /**
     * Create a ProblemDetail for authorization errors (403 Forbidden).
     */
    public static ProblemDetail forbidden(String detail) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.FORBIDDEN,
                detail
        );
        problem.setType(URI.create(ERROR_TYPE_BASE + "authorization-error"));
        problem.setTitle("Access Denied");
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    /**
     * Create a ProblemDetail for conflict errors (409 Conflict).
     */
    public static ProblemDetail conflict(String detail, String conflictType) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT,
                detail
        );
        problem.setType(URI.create(ERROR_TYPE_BASE + "conflict"));
        problem.setTitle("Resource Conflict");
        problem.setProperty("timestamp", Instant.now());
        problem.setProperty("conflictType", conflictType);
        return problem;
    }

    /**
     * Create a ProblemDetail for rate limiting (429 Too Many Requests).
     */
    public static ProblemDetail tooManyRequests(String detail, long retryAfterSeconds) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.TOO_MANY_REQUESTS,
                detail
        );
        problem.setType(URI.create(ERROR_TYPE_BASE + "rate-limit-exceeded"));
        problem.setTitle("Rate Limit Exceeded");
        problem.setProperty("timestamp", Instant.now());
        problem.setProperty("retryAfterSeconds", retryAfterSeconds);
        return problem;
    }

    /**
     * Create a ProblemDetail for internal server errors (500 Internal Server Error).
     */
    public static ProblemDetail internalError(String traceId) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred. Please contact support if the problem persists."
        );
        problem.setType(URI.create(ERROR_TYPE_BASE + "internal-error"));
        problem.setTitle("Internal Server Error");
        problem.setProperty("timestamp", Instant.now());
        if (traceId != null) {
            problem.setProperty("traceId", traceId);
        }
        return problem;
    }

    /**
     * Create a ProblemDetail for service unavailable (503 Service Unavailable).
     */
    public static ProblemDetail serviceUnavailable(String serviceName, long retryAfterSeconds) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.SERVICE_UNAVAILABLE,
                String.format("The %s service is temporarily unavailable. Please try again later.", serviceName)
        );
        problem.setType(URI.create(ERROR_TYPE_BASE + "service-unavailable"));
        problem.setTitle("Service Unavailable");
        problem.setProperty("timestamp", Instant.now());
        problem.setProperty("serviceName", serviceName);
        problem.setProperty("retryAfterSeconds", retryAfterSeconds);
        return problem;
    }
}
