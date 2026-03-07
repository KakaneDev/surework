package com.surework.support.repository;

import com.surework.support.domain.CannedResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for canned response operations.
 */
@Repository
public interface CannedResponseRepository extends JpaRepository<CannedResponse, UUID> {

    /**
     * Find all active (non-deleted) canned responses ordered by title.
     */
    @Query("""
            SELECT cr FROM CannedResponse cr
            WHERE cr.deleted = false
            ORDER BY cr.category ASC NULLS LAST, cr.title ASC
            """)
    List<CannedResponse> findAllActive();

    /**
     * Find active canned responses by category.
     */
    @Query("""
            SELECT cr FROM CannedResponse cr
            WHERE cr.deleted = false
            AND (:category IS NULL OR cr.category = :category)
            ORDER BY cr.title ASC
            """)
    List<CannedResponse> findByCategory(@Param("category") String category);

    /**
     * Find a canned response by ID only if not deleted.
     */
    @Query("""
            SELECT cr FROM CannedResponse cr
            WHERE cr.id = :id
            AND cr.deleted = false
            """)
    Optional<CannedResponse> findActiveById(@Param("id") UUID id);

    /**
     * Get distinct categories from active canned responses.
     */
    @Query("""
            SELECT DISTINCT cr.category FROM CannedResponse cr
            WHERE cr.deleted = false
            AND cr.category IS NOT NULL
            ORDER BY cr.category ASC
            """)
    List<String> findDistinctCategories();

    /**
     * Search canned responses by title or content.
     */
    @Query("""
            SELECT cr FROM CannedResponse cr
            WHERE cr.deleted = false
            AND (LOWER(CAST(cr.title AS string)) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%'))
                 OR LOWER(CAST(cr.content AS string)) LIKE LOWER(CONCAT('%', CAST(:searchTerm AS string), '%')))
            ORDER BY cr.category ASC NULLS LAST, cr.title ASC
            """)
    List<CannedResponse> search(@Param("searchTerm") String searchTerm);
}
