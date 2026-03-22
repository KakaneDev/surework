package com.surework.accounting.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Represents a bank rule for auto-categorization of transactions.
 * Rules are evaluated in priority order to suggest account matches.
 */
@Entity
@Table(name = "bank_rules", indexes = {
        @Index(name = "idx_bank_rules_active", columnList = "is_active, priority"),
        @Index(name = "idx_bank_rules_bank_account", columnList = "bank_account_id")
})
@Getter
@Setter
@NoArgsConstructor
public class BankRule extends BaseEntity {

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    // Rule conditions
    @Enumerated(EnumType.STRING)
    @Column(name = "condition_field", nullable = false)
    private ConditionField conditionField;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_operator", nullable = false)
    private ConditionOperator conditionOperator;

    @Column(name = "condition_value", nullable = false, length = 200)
    private String conditionValue;

    @Column(name = "condition_value_secondary", length = 200)
    private String conditionValueSecondary; // For BETWEEN operator

    // Rule actions
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_account_id", nullable = false)
    private Account targetAccount;

    @Column(name = "payee_name_override", length = 200)
    private String payeeNameOverride;

    // Rule settings
    @Column(name = "is_active")
    private boolean active = true;

    @Column(name = "priority", nullable = false)
    private int priority = 100;

    @Column(name = "match_count")
    private int matchCount = 0;

    @Column(name = "last_matched_at")
    private Instant lastMatchedAt;

    // Scope - null means applies to all bank accounts
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_account_id")
    private BankAccount bankAccount;

    // Multi-tenant
    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "created_by")
    private UUID createdBy;

    /**
     * Fields that can be matched against.
     */
    public enum ConditionField {
        DESCRIPTION,    // Transaction description
        PAYEE_NAME,     // Payee/merchant name
        AMOUNT,         // Transaction amount
        REFERENCE,      // Bank reference
        CATEGORY,       // Bank-provided category
        MCC             // Merchant Category Code
    }

    /**
     * Comparison operators for conditions.
     */
    public enum ConditionOperator {
        CONTAINS,       // Text contains value (case-insensitive)
        STARTS_WITH,    // Text starts with value
        ENDS_WITH,      // Text ends with value
        EQUALS,         // Exact match (case-insensitive for text)
        NOT_CONTAINS,   // Text does not contain value
        GREATER_THAN,   // Number greater than value
        LESS_THAN,      // Number less than value
        BETWEEN,        // Number between value and valueSecondary
        REGEX           // Regular expression match
    }

    /**
     * Create a simple contains rule.
     */
    public static BankRule containsRule(String name, ConditionField field, String value, Account targetAccount) {
        BankRule rule = new BankRule();
        rule.setName(name);
        rule.setConditionField(field);
        rule.setConditionOperator(ConditionOperator.CONTAINS);
        rule.setConditionValue(value);
        rule.setTargetAccount(targetAccount);
        return rule;
    }

    /**
     * Create an amount range rule.
     */
    public static BankRule amountBetweenRule(String name, BigDecimal min, BigDecimal max, Account targetAccount) {
        BankRule rule = new BankRule();
        rule.setName(name);
        rule.setConditionField(ConditionField.AMOUNT);
        rule.setConditionOperator(ConditionOperator.BETWEEN);
        rule.setConditionValue(min.toString());
        rule.setConditionValueSecondary(max.toString());
        rule.setTargetAccount(targetAccount);
        return rule;
    }

    /**
     * Test if this rule matches a transaction.
     */
    public boolean matches(BankTransaction transaction) {
        // Check bank account scope
        if (bankAccount != null && !bankAccount.getId().equals(transaction.getBankAccount().getId())) {
            return false;
        }

        String fieldValue = getFieldValue(transaction);
        if (fieldValue == null && conditionField != ConditionField.AMOUNT) {
            return false;
        }

        return switch (conditionOperator) {
            case CONTAINS -> fieldValue != null &&
                    fieldValue.toLowerCase().contains(conditionValue.toLowerCase());
            case STARTS_WITH -> fieldValue != null &&
                    fieldValue.toLowerCase().startsWith(conditionValue.toLowerCase());
            case ENDS_WITH -> fieldValue != null &&
                    fieldValue.toLowerCase().endsWith(conditionValue.toLowerCase());
            case EQUALS -> fieldValue != null &&
                    fieldValue.equalsIgnoreCase(conditionValue);
            case NOT_CONTAINS -> fieldValue == null ||
                    !fieldValue.toLowerCase().contains(conditionValue.toLowerCase());
            case GREATER_THAN -> compareAmount(transaction.getAbsoluteAmount(), new BigDecimal(conditionValue)) > 0;
            case LESS_THAN -> compareAmount(transaction.getAbsoluteAmount(), new BigDecimal(conditionValue)) < 0;
            case BETWEEN -> {
                BigDecimal amount = transaction.getAbsoluteAmount();
                BigDecimal min = new BigDecimal(conditionValue);
                BigDecimal max = new BigDecimal(conditionValueSecondary);
                yield compareAmount(amount, min) >= 0 && compareAmount(amount, max) <= 0;
            }
            case REGEX -> {
                if (fieldValue == null) yield false;
                try {
                    yield Pattern.matches(conditionValue, fieldValue);
                } catch (Exception e) {
                    yield false;
                }
            }
        };
    }

    /**
     * Get the value of the specified field from transaction.
     */
    private String getFieldValue(BankTransaction transaction) {
        return switch (conditionField) {
            case DESCRIPTION -> transaction.getDescription();
            case PAYEE_NAME -> transaction.getPayeeName();
            case AMOUNT -> transaction.getAbsoluteAmount().toString();
            case REFERENCE -> transaction.getReference();
            case CATEGORY -> transaction.getCategory();
            case MCC -> transaction.getMerchantCategoryCode();
        };
    }

    /**
     * Compare two amounts for ordering.
     */
    private int compareAmount(BigDecimal a, BigDecimal b) {
        return a.compareTo(b);
    }

    /**
     * Record that this rule matched a transaction.
     */
    public void recordMatch() {
        this.matchCount++;
        this.lastMatchedAt = Instant.now();
    }

    /**
     * Get a human-readable description of the rule condition.
     */
    public String getConditionDescription() {
        String fieldName = conditionField.name().toLowerCase().replace("_", " ");
        return switch (conditionOperator) {
            case CONTAINS -> fieldName + " contains \"" + conditionValue + "\"";
            case STARTS_WITH -> fieldName + " starts with \"" + conditionValue + "\"";
            case ENDS_WITH -> fieldName + " ends with \"" + conditionValue + "\"";
            case EQUALS -> fieldName + " equals \"" + conditionValue + "\"";
            case NOT_CONTAINS -> fieldName + " does not contain \"" + conditionValue + "\"";
            case GREATER_THAN -> fieldName + " > " + conditionValue;
            case LESS_THAN -> fieldName + " < " + conditionValue;
            case BETWEEN -> fieldName + " between " + conditionValue + " and " + conditionValueSecondary;
            case REGEX -> fieldName + " matches pattern \"" + conditionValue + "\"";
        };
    }
}
