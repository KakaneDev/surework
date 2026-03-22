package com.surework.accounting.repository;

import com.surework.accounting.domain.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Customer entities.
 */
@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    /**
     * Find by customer code.
     */
    Optional<Customer> findByCustomerCodeAndDeletedFalse(String customerCode);

    /**
     * Check if customer code exists.
     */
    @Query("SELECT COUNT(c) > 0 FROM Customer c WHERE c.customerCode = :code AND c.deleted = false")
    boolean existsByCustomerCode(@Param("code") String customerCode);

    /**
     * Find active customers.
     */
    @Query("SELECT c FROM Customer c WHERE c.active = true AND c.deleted = false ORDER BY c.customerName")
    List<Customer> findAllActive();

    /**
     * Find by name (partial match).
     */
    @Query("SELECT c FROM Customer c WHERE c.deleted = false " +
            "AND (LOWER(c.customerName) LIKE LOWER(CONCAT('%', :name, '%')) " +
            "OR LOWER(c.tradingName) LIKE LOWER(CONCAT('%', :name, '%'))) " +
            "ORDER BY c.customerName")
    List<Customer> findByNameContaining(@Param("name") String name);

    /**
     * Find by email.
     */
    Optional<Customer> findByEmailAndDeletedFalse(String email);

    /**
     * Search customers.
     */
    @Query("SELECT c FROM Customer c WHERE c.deleted = false " +
            "AND (:searchTerm IS NULL OR " +
            "    LOWER(c.customerName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "    LOWER(c.tradingName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "    LOWER(c.customerCode) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "    LOWER(c.email) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "AND (:activeOnly = false OR c.active = true) " +
            "ORDER BY c.customerName")
    Page<Customer> search(
            @Param("searchTerm") String searchTerm,
            @Param("activeOnly") boolean activeOnly,
            Pageable pageable);

    /**
     * Find by VAT number.
     */
    Optional<Customer> findByVatNumberAndDeletedFalse(String vatNumber);

    /**
     * Find customers with outstanding invoices.
     */
    @Query("SELECT DISTINCT c FROM Customer c JOIN Invoice i ON i.customer = c " +
            "WHERE i.amountDue > 0 AND i.status NOT IN ('VOID', 'WRITTEN_OFF', 'DRAFT') " +
            "AND c.deleted = false AND i.deleted = false " +
            "ORDER BY c.customerName")
    List<Customer> findWithOutstandingInvoices();

    /**
     * Count active customers.
     */
    @Query("SELECT COUNT(c) FROM Customer c WHERE c.active = true AND c.deleted = false")
    long countActive();

    /**
     * Find customers by tenant.
     */
    @Query("SELECT c FROM Customer c WHERE c.tenantId = :tenantId AND c.deleted = false ORDER BY c.customerName")
    List<Customer> findByTenant(@Param("tenantId") UUID tenantId);

    /**
     * Check if customer code exists for tenant.
     */
    @Query("SELECT COUNT(c) > 0 FROM Customer c WHERE c.tenantId = :tenantId AND c.customerCode = :code AND c.deleted = false")
    boolean existsByTenantIdAndCustomerCode(@Param("tenantId") UUID tenantId, @Param("code") String customerCode);

    /**
     * Find by ID and tenant ID.
     */
    @Query("SELECT c FROM Customer c WHERE c.id = :id AND c.tenantId = :tenantId AND c.deleted = false")
    Optional<Customer> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    /**
     * Find by tenant and customer code.
     */
    @Query("SELECT c FROM Customer c WHERE c.tenantId = :tenantId AND c.customerCode = :code AND c.deleted = false")
    Optional<Customer> findByTenantIdAndCustomerCodeAndDeletedFalse(@Param("tenantId") UUID tenantId, @Param("code") String customerCode);

    /**
     * Find all active customers for tenant.
     */
    @Query("SELECT c FROM Customer c WHERE c.tenantId = :tenantId AND c.active = true AND c.deleted = false ORDER BY c.customerName")
    List<Customer> findAllActiveByTenantId(@Param("tenantId") UUID tenantId);

    /**
     * Search customers for tenant.
     */
    @Query("SELECT c FROM Customer c WHERE c.tenantId = :tenantId AND c.deleted = false " +
            "AND (:searchTerm IS NULL OR " +
            "    LOWER(c.customerName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "    LOWER(c.tradingName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "    LOWER(c.customerCode) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "    LOWER(c.email) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "AND (:activeOnly = false OR c.active = true) " +
            "ORDER BY c.customerName")
    Page<Customer> searchByTenantId(
            @Param("tenantId") UUID tenantId,
            @Param("searchTerm") String searchTerm,
            @Param("activeOnly") boolean activeOnly,
            Pageable pageable);
}
