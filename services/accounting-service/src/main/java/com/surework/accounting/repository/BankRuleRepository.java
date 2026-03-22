package com.surework.accounting.repository;

import com.surework.accounting.domain.BankRule;
import com.surework.accounting.domain.BankRule.ConditionField;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for BankRule entities.
 */
@Repository
public interface BankRuleRepository extends JpaRepository<BankRule, UUID> {

    /**
     * Find by ID and tenant ID for secure tenant-scoped access.
     */
    @Query("SELECT br FROM BankRule br WHERE br.id = :id AND br.tenantId = :tenantId AND br.deleted = false")
    Optional<BankRule> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    /**
     * Find active rules for a tenant, ordered by priority.
     */
    @Query("SELECT br FROM BankRule br WHERE br.tenantId = :tenantId " +
            "AND br.active = true AND br.deleted = false " +
            "ORDER BY br.priority ASC, br.matchCount DESC")
    List<BankRule> findActiveByTenantId(@Param("tenantId") UUID tenantId);

    /**
     * Find rules applicable to a specific bank account.
     */
    @Query("SELECT br FROM BankRule br WHERE br.tenantId = :tenantId " +
            "AND br.active = true AND br.deleted = false " +
            "AND (br.bankAccount IS NULL OR br.bankAccount.id = :bankAccountId) " +
            "ORDER BY br.priority ASC, br.matchCount DESC")
    List<BankRule> findApplicableRules(
            @Param("tenantId") UUID tenantId,
            @Param("bankAccountId") UUID bankAccountId);

    /**
     * Find all rules for a tenant.
     */
    @Query("SELECT br FROM BankRule br WHERE br.tenantId = :tenantId AND br.deleted = false " +
            "ORDER BY br.priority ASC, br.name ASC")
    List<BankRule> findByTenantId(@Param("tenantId") UUID tenantId);

    /**
     * Find rules by target account.
     */
    @Query("SELECT br FROM BankRule br WHERE br.targetAccount.id = :accountId AND br.deleted = false " +
            "ORDER BY br.priority ASC")
    List<BankRule> findByTargetAccountId(@Param("accountId") UUID accountId);

    /**
     * Find rules by condition field.
     */
    @Query("SELECT br FROM BankRule br WHERE br.tenantId = :tenantId " +
            "AND br.conditionField = :field AND br.deleted = false " +
            "ORDER BY br.priority ASC")
    List<BankRule> findByConditionField(
            @Param("tenantId") UUID tenantId,
            @Param("field") ConditionField field);

    /**
     * Find rules by bank account.
     */
    @Query("SELECT br FROM BankRule br WHERE br.bankAccount.id = :bankAccountId AND br.deleted = false " +
            "ORDER BY br.priority ASC")
    List<BankRule> findByBankAccountId(@Param("bankAccountId") UUID bankAccountId);

    /**
     * Find rules with similar condition value (for detecting duplicates).
     */
    @Query("SELECT br FROM BankRule br WHERE br.tenantId = :tenantId " +
            "AND br.conditionField = :field AND br.conditionOperator = :operator " +
            "AND LOWER(br.conditionValue) = LOWER(:value) AND br.deleted = false")
    List<BankRule> findSimilarRules(
            @Param("tenantId") UUID tenantId,
            @Param("field") ConditionField field,
            @Param("operator") BankRule.ConditionOperator operator,
            @Param("value") String value);

    /**
     * Search rules.
     */
    @Query("SELECT br FROM BankRule br WHERE br.deleted = false " +
            "AND (:tenantId IS NULL OR br.tenantId = :tenantId) " +
            "AND (:searchTerm IS NULL OR LOWER(br.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "    OR LOWER(br.conditionValue) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "AND (:activeOnly = false OR br.active = true) " +
            "ORDER BY br.priority ASC, br.name ASC")
    Page<BankRule> search(
            @Param("tenantId") UUID tenantId,
            @Param("searchTerm") String searchTerm,
            @Param("activeOnly") boolean activeOnly,
            Pageable pageable);

    /**
     * Count active rules for tenant.
     */
    @Query("SELECT COUNT(br) FROM BankRule br WHERE br.tenantId = :tenantId " +
            "AND br.active = true AND br.deleted = false")
    long countActiveByTenantId(@Param("tenantId") UUID tenantId);

    /**
     * Get most used rules.
     */
    @Query("SELECT br FROM BankRule br WHERE br.tenantId = :tenantId " +
            "AND br.active = true AND br.deleted = false " +
            "ORDER BY br.matchCount DESC")
    List<BankRule> findMostUsed(@Param("tenantId") UUID tenantId, Pageable pageable);

    /**
     * Increment match count and update last matched timestamp.
     */
    @Modifying
    @Query("UPDATE BankRule br SET br.matchCount = br.matchCount + 1, " +
            "br.lastMatchedAt = CURRENT_TIMESTAMP WHERE br.id = :ruleId")
    void incrementMatchCount(@Param("ruleId") UUID ruleId);

    /**
     * Deactivate rules targeting a specific account.
     */
    @Modifying
    @Query("UPDATE BankRule br SET br.active = false WHERE br.targetAccount.id = :accountId")
    int deactivateByTargetAccountId(@Param("accountId") UUID accountId);

    /**
     * Check if rule name exists for tenant.
     */
    @Query("SELECT CASE WHEN COUNT(br) > 0 THEN true ELSE false END FROM BankRule br " +
            "WHERE br.tenantId = :tenantId AND LOWER(br.name) = LOWER(:name) AND br.deleted = false")
    boolean existsByTenantIdAndName(@Param("tenantId") UUID tenantId, @Param("name") String name);

    /**
     * Get rule statistics for tenant.
     */
    @Query("SELECT br.active, COUNT(br), SUM(br.matchCount) FROM BankRule br " +
            "WHERE br.tenantId = :tenantId AND br.deleted = false GROUP BY br.active")
    List<Object[]> getRuleStatistics(@Param("tenantId") UUID tenantId);
}
