package com.surework.document.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Represents a version of a document.
 * Supports full version history and rollback capabilities.
 */
@Entity
@Table(name = "document_versions", indexes = {
        @Index(name = "idx_document_versions_doc", columnList = "document_id"),
        @Index(name = "idx_document_versions_number", columnList = "document_id, version_number")
})
@Getter
@Setter
@NoArgsConstructor
public class DocumentVersion extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Column(name = "version_number", nullable = false)
    private int versionNumber;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "storage_path", nullable = false)
    private String storagePath;

    @Column(name = "file_size", nullable = false)
    private long fileSize;

    @Column(name = "checksum")
    private String checksum;

    @Column(name = "change_notes", columnDefinition = "TEXT")
    private String changeNotes;

    @Column(name = "uploaded_by", nullable = false)
    private UUID uploadedBy;

    @Column(name = "uploaded_by_name")
    private String uploadedByName;

    @Column(name = "uploaded_at", nullable = false)
    private Instant uploadedAt;

    @Column(name = "is_current")
    private boolean current = true;

    /**
     * Create a new version.
     */
    public static DocumentVersion create(Document document, int versionNumber,
                                          String storagePath, long fileSize,
                                          String checksum, UUID uploadedBy) {
        DocumentVersion version = new DocumentVersion();
        version.setDocument(document);
        version.setVersionNumber(versionNumber);
        version.setFileName(document.getFileName());
        version.setStoragePath(storagePath);
        version.setFileSize(fileSize);
        version.setChecksum(checksum);
        version.setUploadedBy(uploadedBy);
        version.setUploadedAt(Instant.now());
        version.setCurrent(true);
        return version;
    }

    /**
     * Mark as not current (when new version is added).
     */
    public void markAsNotCurrent() {
        this.current = false;
    }

    /**
     * Get formatted file size.
     */
    public String getFormattedFileSize() {
        if (fileSize < 1024) {
            return fileSize + " B";
        } else if (fileSize < 1024 * 1024) {
            return String.format("%.1f KB", fileSize / 1024.0);
        } else {
            return String.format("%.1f MB", fileSize / (1024.0 * 1024));
        }
    }
}
