package com.surework.common.web.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.util.UUID;

/**
 * Exception thrown when a requested resource is not found.
 * Maps to HTTP 404 Not Found.
 */
@Getter
public class ResourceNotFoundException extends BaseException {

    private final String resourceType;
    private final String resourceId;

    public ResourceNotFoundException(String resourceType, String resourceId) {
        super(
                String.format("%s with ID '%s' not found", resourceType, resourceId),
                "RESOURCE_NOT_FOUND",
                HttpStatus.NOT_FOUND
        );
        this.resourceType = resourceType;
        this.resourceId = resourceId;
    }

    public ResourceNotFoundException(String resourceType, UUID resourceId) {
        this(resourceType, resourceId.toString());
    }

    public ResourceNotFoundException(String resourceType, String resourceId, Throwable cause) {
        super(
                String.format("%s with ID '%s' not found", resourceType, resourceId),
                "RESOURCE_NOT_FOUND",
                HttpStatus.NOT_FOUND,
                cause
        );
        this.resourceType = resourceType;
        this.resourceId = resourceId;
    }

    public ResourceNotFoundException(String resourceType, UUID resourceId, Throwable cause) {
        this(resourceType, resourceId.toString(), cause);
    }
}
