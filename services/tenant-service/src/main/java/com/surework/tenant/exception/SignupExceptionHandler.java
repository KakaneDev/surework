package com.surework.tenant.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.Instant;
import java.util.Map;

/**
 * Exception handler for signup-related exceptions.
 * Provides proper HTTP responses and headers for rate limiting.
 */
@ControllerAdvice
@Slf4j
public class SignupExceptionHandler {

    /**
     * Handles rate limit exceeded exceptions.
     * Returns HTTP 429 with Retry-After header.
     */
    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<Map<String, Object>> handleRateLimitExceeded(
            RateLimitExceededException ex) {

        HttpHeaders headers = new HttpHeaders();
        headers.add("Retry-After", String.valueOf(ex.getRetryAfterSeconds()));

        Map<String, Object> body = Map.of(
                "type", "https://api.surework.co.za/errors/rate-limit",
                "title", "Rate Limit Exceeded",
                "status", HttpStatus.TOO_MANY_REQUESTS.value(),
                "detail", ex.getMessage(),
                "instance", "/api/v1/signup",
                "timestamp", Instant.now().toString(),
                "retryAfterSeconds", ex.getRetryAfterSeconds()
        );

        return ResponseEntity
                .status(HttpStatus.TOO_MANY_REQUESTS)
                .headers(headers)
                .body(body);
    }
}
