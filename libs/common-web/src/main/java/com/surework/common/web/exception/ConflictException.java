package com.surework.common.web.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Exception thrown for resource conflicts.
 * Maps to HTTP 409 Conflict.
 */
@Getter
public class ConflictException extends BaseException {

    private final String conflictType;

    public ConflictException(String message, String conflictType) {
        super(message, "CONFLICT", HttpStatus.CONFLICT);
        this.conflictType = conflictType;
    }

    /**
     * Factory for duplicate resource.
     */
    public static ConflictException duplicate(String resourceType, String identifier) {
        return new ConflictException(
                String.format("%s with identifier '%s' already exists", resourceType, identifier),
                "DUPLICATE_RESOURCE"
        );
    }

    /**
     * Factory for optimistic lock failure.
     */
    public static ConflictException optimisticLock(String resourceType) {
        return new ConflictException(
                String.format("%s was modified by another user. Please refresh and try again.", resourceType),
                "OPTIMISTIC_LOCK_FAILURE"
        );
    }
}
