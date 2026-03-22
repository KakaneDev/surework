package com.surework.document.repository;

import com.surework.document.domain.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Document entities.
 */
@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {

    /**
     * Find by document reference.
     */
    Optional<Document> findByDocumentReference(String reference);

    /**
     * Find by owner.
     */
    @Query("SELECT d FROM Document d WHERE d.ownerType = :ownerType AND d.ownerId = :ownerId " +
            "AND d.deleted = false ORDER BY d.uploadedAt DESC")
    List<Document> findByOwner(
            @Param("ownerType") Document.OwnerType ownerType,
            @Param("ownerId") UUID ownerId);

    /**
     * Find by owner and category.
     */
    @Query("SELECT d FROM Document d WHERE d.ownerType = :ownerType AND d.ownerId = :ownerId " +
            "AND d.category = :category AND d.deleted = false ORDER BY d.uploadedAt DESC")
    List<Document> findByOwnerAndCategory(
            @Param("ownerType") Document.OwnerType ownerType,
            @Param("ownerId") UUID ownerId,
            @Param("category") Document.DocumentCategory category);

    /**
     * Find active documents by owner.
     */
    @Query("SELECT d FROM Document d WHERE d.ownerType = :ownerType AND d.ownerId = :ownerId " +
            "AND d.status = 'ACTIVE' AND d.deleted = false ORDER BY d.uploadedAt DESC")
    List<Document> findActiveByOwner(
            @Param("ownerType") Document.OwnerType ownerType,
            @Param("ownerId") UUID ownerId);

    /**
     * Find by category.
     */
    @Query("SELECT d FROM Document d WHERE d.category = :category AND d.deleted = false " +
            "ORDER BY d.uploadedAt DESC")
    Page<Document> findByCategory(
            @Param("category") Document.DocumentCategory category,
            Pageable pageable);

    /**
     * Find expiring documents.
     */
    @Query("SELECT d FROM Document d WHERE d.validUntil BETWEEN :today AND :expiryDate " +
            "AND d.status = 'ACTIVE' AND d.deleted = false ORDER BY d.validUntil")
    List<Document> findExpiringSoon(
            @Param("today") LocalDate today,
            @Param("expiryDate") LocalDate expiryDate);

    /**
     * Find expired documents.
     */
    @Query("SELECT d FROM Document d WHERE d.validUntil < :today " +
            "AND d.status = 'ACTIVE' AND d.expired = false AND d.deleted = false")
    List<Document> findExpired(@Param("today") LocalDate today);

    /**
     * Find documents past retention date.
     */
    @Query("SELECT d FROM Document d WHERE d.retentionUntil < :today " +
            "AND d.status NOT IN ('DELETED') AND d.deleted = false")
    List<Document> findPastRetention(@Param("today") LocalDate today);

    /**
     * Find documents requiring acknowledgment.
     */
    @Query("SELECT d FROM Document d WHERE d.requiresAcknowledgment = true " +
            "AND d.acknowledgedAt IS NULL AND d.ownerId = :employeeId " +
            "AND d.status = 'ACTIVE' AND d.deleted = false")
    List<Document> findPendingAcknowledgment(@Param("employeeId") UUID employeeId);

    /**
     * Find confidential documents.
     */
    @Query("SELECT d FROM Document d WHERE d.confidential = true AND d.deleted = false " +
            "ORDER BY d.uploadedAt DESC")
    Page<Document> findConfidential(Pageable pageable);

    /**
     * Search documents.
     */
    @Query("SELECT d FROM Document d WHERE d.deleted = false " +
            "AND (:ownerType IS NULL OR d.ownerType = :ownerType) " +
            "AND (:ownerId IS NULL OR d.ownerId = :ownerId) " +
            "AND (:category IS NULL OR d.category = :category) " +
            "AND (:status IS NULL OR d.status = :status) " +
            "AND (:searchTerm IS NULL OR LOWER(d.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "    OR LOWER(d.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "    OR LOWER(d.tags) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "ORDER BY d.uploadedAt DESC")
    Page<Document> search(
            @Param("ownerType") Document.OwnerType ownerType,
            @Param("ownerId") UUID ownerId,
            @Param("category") Document.DocumentCategory category,
            @Param("status") Document.DocumentStatus status,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    /**
     * Count documents by owner.
     */
    @Query("SELECT COUNT(d) FROM Document d WHERE d.ownerType = :ownerType AND d.ownerId = :ownerId " +
            "AND d.deleted = false")
    long countByOwner(
            @Param("ownerType") Document.OwnerType ownerType,
            @Param("ownerId") UUID ownerId);

    /**
     * Count by category.
     */
    @Query("SELECT d.category, COUNT(d) FROM Document d WHERE d.deleted = false GROUP BY d.category")
    List<Object[]> countByCategory();

    /**
     * Get total storage used by owner.
     */
    @Query("SELECT SUM(d.fileSize) FROM Document d WHERE d.ownerType = :ownerType " +
            "AND d.ownerId = :ownerId AND d.deleted = false")
    Long getTotalStorageByOwner(
            @Param("ownerType") Document.OwnerType ownerType,
            @Param("ownerId") UUID ownerId);

    /**
     * Find recent uploads.
     */
    @Query("SELECT d FROM Document d WHERE d.deleted = false ORDER BY d.uploadedAt DESC")
    Page<Document> findRecentUploads(Pageable pageable);

    /**
     * Check if document with name exists for owner.
     */
    @Query("SELECT COUNT(d) > 0 FROM Document d WHERE d.ownerType = :ownerType " +
            "AND d.ownerId = :ownerId AND LOWER(d.name) = LOWER(:name) AND d.deleted = false")
    boolean existsByOwnerAndName(
            @Param("ownerType") Document.OwnerType ownerType,
            @Param("ownerId") UUID ownerId,
            @Param("name") String name);
}
