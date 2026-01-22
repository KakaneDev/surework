package com.surework.gateway.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Global error handler for the API Gateway.
 * Provides consistent JSON error responses for all exceptions.
 */
@Component
@Order(-1) // Execute before default Spring error handler
public class GlobalErrorHandler implements ErrorWebExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalErrorHandler.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        ServerHttpResponse response = exchange.getResponse();

        // Determine HTTP status
        HttpStatus status = determineHttpStatus(ex);
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        // Log the error
        String path = exchange.getRequest().getPath().value();
        String requestId = exchange.getRequest().getHeaders().getFirst("X-Request-Id");

        if (status.is5xxServerError()) {
            log.error("Gateway error on path: {} - RequestId: {}", path, requestId, ex);
        } else {
            log.warn("Gateway client error on path: {} - RequestId: {} - Error: {}",
                    path, requestId, ex.getMessage());
        }

        // Build error response
        Map<String, Object> errorResponse = new LinkedHashMap<>();
        errorResponse.put("timestamp", Instant.now().toString());
        errorResponse.put("path", path);
        errorResponse.put("status", status.value());
        errorResponse.put("error", status.getReasonPhrase());
        errorResponse.put("message", getErrorMessage(ex, status));
        if (requestId != null) {
            errorResponse.put("requestId", requestId);
        }

        byte[] bytes;
        try {
            bytes = objectMapper.writeValueAsBytes(errorResponse);
        } catch (JsonProcessingException e) {
            bytes = "{\"error\":\"Internal Server Error\"}".getBytes();
        }

        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }

    private HttpStatus determineHttpStatus(Throwable ex) {
        if (ex instanceof ResponseStatusException rse) {
            return HttpStatus.valueOf(rse.getStatusCode().value());
        }

        // Circuit breaker open
        if (ex.getMessage() != null && ex.getMessage().contains("CircuitBreaker")) {
            return HttpStatus.SERVICE_UNAVAILABLE;
        }

        // Timeout
        if (ex.getMessage() != null && ex.getMessage().contains("timeout")) {
            return HttpStatus.GATEWAY_TIMEOUT;
        }

        // Service unavailable
        if (ex.getMessage() != null &&
                (ex.getMessage().contains("Connection refused") ||
                 ex.getMessage().contains("Unable to connect"))) {
            return HttpStatus.SERVICE_UNAVAILABLE;
        }

        return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    private String getErrorMessage(Throwable ex, HttpStatus status) {
        if (ex instanceof ResponseStatusException rse) {
            return rse.getReason() != null ? rse.getReason() : status.getReasonPhrase();
        }

        // Don't expose internal error details in production
        if (status.is5xxServerError()) {
            if (ex.getMessage() != null && ex.getMessage().contains("CircuitBreaker")) {
                return "Service temporarily unavailable. Please try again later.";
            }
            if (ex.getMessage() != null && ex.getMessage().contains("timeout")) {
                return "Request timed out. Please try again.";
            }
            if (ex.getMessage() != null && ex.getMessage().contains("Connection refused")) {
                return "Service unavailable. Please try again later.";
            }
            return "An unexpected error occurred. Please try again later.";
        }

        return ex.getMessage() != null ? ex.getMessage() : status.getReasonPhrase();
    }
}
