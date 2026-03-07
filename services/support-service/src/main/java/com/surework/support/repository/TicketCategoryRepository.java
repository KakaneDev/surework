package com.surework.support.repository;

import com.surework.support.domain.TicketCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for ticket categories.
 */
@Repository
public interface TicketCategoryRepository extends JpaRepository<TicketCategory, UUID> {

    Optional<TicketCategory> findByCode(String code);

    List<TicketCategory> findByActiveTrueOrderByDisplayOrderAsc();

    boolean existsByCode(String code);
}
