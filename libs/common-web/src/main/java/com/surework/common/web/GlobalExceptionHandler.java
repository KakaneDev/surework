package com.surework.common.web;

import com.surework.common.web.exception.*;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Global exception handler for all SureWork services.
 * Implements Constitution Principle VI: Exception Handling.
 *
 * Converts exceptions to RFC 7807 ProblemDetail responses.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Handle resource not found exceptions.
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleResourceNotFound(
            ResourceNotFoundException ex,
            WebRequest request
    ) {
        log.debug("Resource not found: {} with ID {}", ex.getResourceType(), ex.getResourceId());
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ProblemDetailFactory.notFound(ex.getResourceType(), ex.getResourceId()));
    }

    /**
     * Handle business rule violations.
     */
    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ProblemDetail> handleBusinessRule(
            BusinessRuleException ex,
            WebRequest request
    ) {
        log.warn("Business rule violation: {} (code: {})", ex.getMessage(), ex.getErrorCode());
        return ResponseEntity
                .status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(ProblemDetailFactory.unprocessableEntity(ex.getMessage(), ex.getErrorCode()));
    }

    /**
     * Handle validation exceptions.
     */
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ProblemDetail> handleValidation(
            ValidationException ex,
            WebRequest request
    ) {
        log.debug("Validation error: {}", ex.getMessage());
        Map<String, Object> errors = new HashMap<>(ex.getFieldErrors());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ProblemDetailFactory.badRequest(ex.getMessage(), errors));
    }

    /**
     * Handle Bean Validation errors from @Valid.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            WebRequest request
    ) {
        Map<String, Object> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                errors.put(error.getField(), error.getDefaultMessage())
        );
        log.debug("Validation errors: {}", errors);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ProblemDetailFactory.badRequest("Validation failed", errors));
    }

    /**
     * Handle constraint violations.
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ProblemDetail> handleConstraintViolation(
            ConstraintViolationException ex,
            WebRequest request
    ) {
        Map<String, Object> errors = new HashMap<>();
        ex.getConstraintViolations().forEach(violation -> {
            String field = violation.getPropertyPath().toString();
            errors.put(field, violation.getMessage());
        });
        log.debug("Constraint violations: {}", errors);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ProblemDetailFactory.badRequest("Validation failed", errors));
    }

    /**
     * Handle conflict exceptions.
     */
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ProblemDetail> handleConflict(
            ConflictException ex,
            WebRequest request
    ) {
        log.warn("Conflict: {} (type: {})", ex.getMessage(), ex.getConflictType());
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ProblemDetailFactory.conflict(ex.getMessage(), ex.getConflictType()));
    }

    /**
     * Handle authentication failures.
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ProblemDetail> handleAuthentication(
            AuthenticationException ex,
            WebRequest request
    ) {
        log.debug("Authentication failed: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ProblemDetailFactory.unauthorized("Authentication required"));
    }

    /**
     * Handle access denied.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ProblemDetail> handleAccessDenied(
            AccessDeniedException ex,
            WebRequest request
    ) {
        log.debug("Access denied: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ProblemDetailFactory.forbidden("You do not have permission to access this resource"));
    }

    /**
     * Handle Spring's NoResourceFoundException (static resource not found).
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ProblemDetail> handleNoResourceFound(
            NoResourceFoundException ex,
            WebRequest request
    ) {
        log.debug("Resource not found: {}", ex.getResourcePath());
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ProblemDetailFactory.notFound("Resource", ex.getResourcePath()));
    }

    /**
     * Handle all other exceptions (fallback).
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleAllOther(
            Exception ex,
            WebRequest request
    ) {
        String traceId = UUID.randomUUID().toString();
        log.error("Unhandled exception [traceId={}]: {}", traceId, ex.getMessage(), ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ProblemDetailFactory.internalError(traceId));
    }
}
