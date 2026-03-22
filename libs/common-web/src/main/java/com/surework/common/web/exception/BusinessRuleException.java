package com.surework.common.web.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a business rule is violated.
 * Maps to HTTP 422 Unprocessable Entity.
 *
 * Examples:
 * - Attempting to delete the last Owner role
 * - Two-Pot withdrawal exceeding available balance
 * - Payroll finalization without required data
 */
public class BusinessRuleException extends BaseException {

    public BusinessRuleException(String message) {
        super(message, "BUSINESS_RULE_VIOLATION", HttpStatus.UNPROCESSABLE_ENTITY);
    }

    public BusinessRuleException(String message, String errorCode) {
        super(message, errorCode, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    public BusinessRuleException(String message, String errorCode, Throwable cause) {
        super(message, errorCode, HttpStatus.UNPROCESSABLE_ENTITY, cause);
    }

    /**
     * Factory for last owner protection violation (FR-E13).
     */
    public static BusinessRuleException lastOwnerProtection() {
        return new BusinessRuleException(
                "Cannot delete or demote the last Owner. At least one Owner must exist per tenant.",
                "LAST_OWNER_PROTECTION"
        );
    }

    /**
     * Factory for insufficient balance.
     */
    public static BusinessRuleException insufficientBalance(String context) {
        return new BusinessRuleException(
                String.format("Insufficient balance for %s", context),
                "INSUFFICIENT_BALANCE"
        );
    }

    /**
     * Factory for immutable record violation.
     */
    public static BusinessRuleException immutableRecord(String recordType) {
        return new BusinessRuleException(
                String.format("%s is immutable and cannot be modified. Use rollback to create corrections.", recordType),
                "IMMUTABLE_RECORD"
        );
    }

    /**
     * Factory for expired consent.
     */
    public static BusinessRuleException expiredConsent() {
        return new BusinessRuleException(
                "Data retention consent has expired. Please renew consent to continue.",
                "EXPIRED_CONSENT"
        );
    }
}
