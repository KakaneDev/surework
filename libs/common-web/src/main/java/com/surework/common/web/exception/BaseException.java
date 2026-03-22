package com.surework.common.web.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Base exception for all SureWork application exceptions.
 * Implements Constitution Principle VI: Exception Handling.
 *
 * All custom exceptions should extend this class to ensure
 * consistent error handling and ProblemDetail response generation.
 */
@Getter
public abstract class BaseException extends RuntimeException {

    private final String errorCode;
    private final HttpStatus httpStatus;

    protected BaseException(String message, String errorCode, HttpStatus httpStatus) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }

    protected BaseException(String message, String errorCode, HttpStatus httpStatus, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }
}
