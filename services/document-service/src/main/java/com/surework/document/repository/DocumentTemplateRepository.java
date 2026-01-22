package com.surework.document.repository;

import com.surework.document.domain.Document;
import com.surework.document.domain.DocumentTemplate;
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
 * Repository for DocumentTemplate entities.
 */
@Repository
public interface DocumentTemplateRepository extends JpaRepository<DocumentTemplate, UUID> {

    /**
     * Find by code.
     */
    Optional<DocumentTemplate> findByCode(String code);

    /**
     * Find by template type.
     */
    @Query("SELECT t FROM DocumentTemplate t WHERE t.templateType = :type " +
            "AND t.active = true AND t.deleted = false ORDER BY t.name")
    List<DocumentTemplate> findByTemplateType(@Param("type") DocumentTemplate.TemplateType type);

    /**
     * Find by category.
     */
    @Query("SELECT t FROM DocumentTemplate t WHERE t.category = :category " +
            "AND t.active = true AND t.deleted = false ORDER BY t.name")
    List<DocumentTemplate> findByCategory(@Param("category") Document.DocumentCategory category);

    /**
     * Find default template for type.
     */
    @Query("SELECT t FROM DocumentTemplate t WHERE t.templateType = :type " +
            "AND t.defaultTemplate = true AND t.active = true AND t.deleted = false")
    Optional<DocumentTemplate> findDefaultByType(@Param("type") DocumentTemplate.TemplateType type);

    /**
     * Find active templates.
     */
    @Query("SELECT t FROM DocumentTemplate t WHERE t.active = true AND t.deleted = false " +
            "ORDER BY t.category, t.name")
    List<DocumentTemplate> findActiveTemplates();

    /**
     * Find active templates (paginated).
     */
    @Query("SELECT t FROM DocumentTemplate t WHERE t.active = true AND t.deleted = false")
    Page<DocumentTemplate> findActiveTemplates(Pageable pageable);

    /**
     * Search templates.
     */
    @Query("SELECT t FROM DocumentTemplate t WHERE t.deleted = false " +
            "AND (:type IS NULL OR t.templateType = :type) " +
            "AND (:category IS NULL OR t.category = :category) " +
            "AND (:active IS NULL OR t.active = :active) " +
            "AND (:searchTerm IS NULL OR LOWER(t.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "    OR LOWER(t.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "ORDER BY t.name")
    Page<DocumentTemplate> search(
            @Param("type") DocumentTemplate.TemplateType type,
            @Param("category") Document.DocumentCategory category,
            @Param("active") Boolean active,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    /**
     * Find templates needing review.
     */
    @Query("SELECT t FROM DocumentTemplate t WHERE t.active = true AND t.deleted = false " +
            "AND (t.lastReviewedAt IS NULL OR t.lastReviewedAt < :cutoffDate) " +
            "ORDER BY t.lastReviewedAt NULLS FIRST")
    List<DocumentTemplate> findNeedingReview(@Param("cutoffDate") java.time.Instant cutoffDate);

    /**
     * Check if code exists.
     */
    boolean existsByCode(String code);
}
