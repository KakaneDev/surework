package com.surework.tenant.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Exception thrown when user creation fails during tenant signup.
 * This typically indicates an issue with the identity-service.
 */
@ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
public class UserCreationFailedException extends RuntimeException {

    public UserCreationFailedException(String message) {
        super(message);
    }

    public UserCreationFailedException(String message, Throwable cause) {
        super(message, cause);
    }
}
