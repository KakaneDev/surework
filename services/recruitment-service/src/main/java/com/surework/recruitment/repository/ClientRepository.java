package com.surework.recruitment.repository;

import com.surework.recruitment.domain.Client;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for Client entities.
 */
@Repository
public interface ClientRepository extends JpaRepository<Client, UUID> {

    /**
     * Search clients with optional filters.
     */
    @Query("SELECT c FROM Client c WHERE c.deleted = false " +
            "AND (:active IS NULL OR c.active = :active) " +
            "AND (:searchTerm IS NULL OR :searchTerm = '' OR " +
            "    LOWER(c.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "    LOWER(c.contactPerson) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "    LOWER(c.contactEmail) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "ORDER BY c.name ASC")
    Page<Client> search(
            @Param("active") Boolean active,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    /**
     * Find all active clients (for dropdowns).
     */
    @Query("SELECT c FROM Client c WHERE c.deleted = false AND c.active = true ORDER BY c.name ASC")
    List<Client> findAllActive();

    /**
     * Find all non-deleted clients.
     */
    @Query("SELECT c FROM Client c WHERE c.deleted = false ORDER BY c.name ASC")
    List<Client> findAllNotDeleted();
}
