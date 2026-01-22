package com.surework.document.repository;

import com.surework.document.domain.DocumentVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for DocumentVersion entities.
 */
@Repository
public interface DocumentVersionRepository extends JpaRepository<DocumentVersion, UUID> {

    /**
     * Find all versions for a document.
     */
    @Query("SELECT v FROM DocumentVersion v WHERE v.document.id = :documentId " +
            "ORDER BY v.versionNumber DESC")
    List<DocumentVersion> findByDocumentId(@Param("documentId") UUID documentId);

    /**
     * Find specific version.
     */
    @Query("SELECT v FROM DocumentVersion v WHERE v.document.id = :documentId " +
            "AND v.versionNumber = :versionNumber")
    Optional<DocumentVersion> findByDocumentIdAndVersion(
            @Param("documentId") UUID documentId,
            @Param("versionNumber") int versionNumber);

    /**
     * Find current version.
     */
    @Query("SELECT v FROM DocumentVersion v WHERE v.document.id = :documentId " +
            "AND v.current = true")
    Optional<DocumentVersion> findCurrentVersion(@Param("documentId") UUID documentId);

    /**
     * Count versions for document.
     */
    @Query("SELECT COUNT(v) FROM DocumentVersion v WHERE v.document.id = :documentId")
    long countByDocumentId(@Param("documentId") UUID documentId);

    /**
     * Get latest version number.
     */
    @Query("SELECT MAX(v.versionNumber) FROM DocumentVersion v WHERE v.document.id = :documentId")
    Integer getLatestVersionNumber(@Param("documentId") UUID documentId);
}
