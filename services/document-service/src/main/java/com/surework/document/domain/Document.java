package com.surework.document.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Represents a document in the system.
 * Supports versioning, categorization, and South African compliance requirements.
 */
@Entity
@Table(name = "documents", indexes = {
        @Index(name = "idx_documents_owner", columnList = "owner_type, owner_id"),
        @Index(name = "idx_documents_category", columnList = "category"),
        @Index(name = "idx_documents_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
public class Document extends BaseEntity {

    @Column(name = "document_reference", nullable = false, unique = true)
    private String documentReference;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private DocumentCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "owner_type", nullable = false)
    private OwnerType ownerType;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "owner_name")
    private String ownerName;

    // Current version info
    @Column(name = "current_version")
    private int currentVersion = 1;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "original_file_name")
    private String originalFileName;

    @Column(name = "file_extension")
    private String fileExtension;

    @Column(name = "content_type")
    private String contentType;

    @Column(name = "file_size")
    private long fileSize;

    @Column(name = "storage_path")
    private String storagePath;

    @Column(name = "storage_bucket")
    private String storageBucket;

    @Column(name = "checksum")
    private String checksum; // SHA-256 hash

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private DocumentStatus status = DocumentStatus.ACTIVE;

    // Validity period (for contracts, certificates, etc.)
    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Column(name = "valid_until")
    private LocalDate validUntil;

    @Column(name = "is_expired")
    private boolean expired = false;

    // Retention policy
    @Column(name = "retention_years")
    private Integer retentionYears;

    @Column(name = "retention_until")
    private LocalDate retentionUntil;

    @Column(name = "can_be_deleted")
    private boolean canBeDeleted = true;

    // Access control
    @Enumerated(EnumType.STRING)
    @Column(name = "visibility")
    private Visibility visibility = Visibility.PRIVATE;

    @Column(name = "is_confidential")
    private boolean confidential = false;

    @Column(name = "requires_acknowledgment")
    private boolean requiresAcknowledgment = false;

    @Column(name = "acknowledged_at")
    private Instant acknowledgedAt;

    @Column(name = "acknowledged_by")
    private UUID acknowledgedBy;

    // Metadata
    @Column(name = "tags")
    private String tags; // Comma-separated

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // Upload info
    @Column(name = "uploaded_by", nullable = false)
    private UUID uploadedBy;

    @Column(name = "uploaded_by_name")
    private String uploadedByName;

    @Column(name = "uploaded_at")
    private Instant uploadedAt;

    // Versions
    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("versionNumber DESC")
    private List<DocumentVersion> versions = new ArrayList<>();

    /**
     * Document categories for South African HR compliance.
     */
    public enum DocumentCategory {
        // Employment
        EMPLOYMENT_CONTRACT,
        OFFER_LETTER,
        TERMINATION_LETTER,
        RESIGNATION_LETTER,

        // Tax & Statutory
        IRP5,
        TAX_NUMBER,
        UIF_DECLARATION,

        // Payroll
        PAYSLIP,
        BANK_CONFIRMATION,
        SALARY_REVIEW,

        // Personal
        ID_DOCUMENT,
        PASSPORT,
        WORK_PERMIT,
        PROOF_OF_ADDRESS,

        // Qualifications
        QUALIFICATION,
        CERTIFICATION,
        TRAINING_CERTIFICATE,
        CV,

        // HR Records
        MEDICAL_CERTIFICATE,
        LEAVE_FORM,
        DISCIPLINARY,
        WARNING_LETTER,
        PERFORMANCE_REVIEW,
        SKILLS_ASSESSMENT,

        // Company
        POLICY_DOCUMENT,
        PROCEDURE,
        TEMPLATE,
        COMPANY_REGISTRATION,

        // Financial
        INVOICE,
        RECEIPT,
        QUOTATION,
        STATEMENT,

        // Other
        OTHER
    }

    /**
     * Owner types (what entity the document belongs to).
     */
    public enum OwnerType {
        EMPLOYEE,
        CANDIDATE,
        COMPANY,
        DEPARTMENT,
        JOB_POSTING,
        PAYROLL_RUN,
        LEAVE_REQUEST,
        CUSTOMER,
        SUPPLIER
    }

    /**
     * Document statuses.
     */
    public enum DocumentStatus {
        ACTIVE,         // Current and valid
        ARCHIVED,       // Old but retained
        SUPERSEDED,     // Replaced by newer version
        EXPIRED,        // Past validity date
        PENDING_REVIEW, // Awaiting approval
        REJECTED,       // Not approved
        DELETED         // Soft deleted
    }

    /**
     * Document visibility.
     */
    public enum Visibility {
        PRIVATE,        // Only owner and HR
        RESTRICTED,     // Owner, HR, and managers
        DEPARTMENT,     // Department-wide
        COMPANY,        // Company-wide
        PUBLIC          // Public access
    }

    /**
     * Create a new document.
     */
    public static Document create(String name, DocumentCategory category,
                                   OwnerType ownerType, UUID ownerId, UUID uploadedBy) {
        Document doc = new Document();
        doc.setName(name);
        doc.setCategory(category);
        doc.setOwnerType(ownerType);
        doc.setOwnerId(ownerId);
        doc.setUploadedBy(uploadedBy);
        doc.setUploadedAt(Instant.now());
        doc.setDocumentReference(generateReference());
        doc.setStatus(DocumentStatus.ACTIVE);
        return doc;
    }

    private static String generateReference() {
        return "DOC-" + System.currentTimeMillis() % 100000 + "-" +
                UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    /**
     * Add a new version.
     */
    public DocumentVersion addVersion(String storagePath, long fileSize, String checksum,
                                       UUID uploadedBy, String changeNotes) {
        this.currentVersion++;

        DocumentVersion version = new DocumentVersion();
        version.setDocument(this);
        version.setVersionNumber(this.currentVersion);
        version.setFileName(this.fileName);
        version.setStoragePath(storagePath);
        version.setFileSize(fileSize);
        version.setChecksum(checksum);
        version.setUploadedBy(uploadedBy);
        version.setUploadedAt(Instant.now());
        version.setChangeNotes(changeNotes);

        this.versions.add(version);
        this.storagePath = storagePath;
        this.fileSize = fileSize;
        this.checksum = checksum;

        return version;
    }

    /**
     * Archive the document.
     */
    public void archive() {
        this.status = DocumentStatus.ARCHIVED;
    }

    /**
     * Mark as expired.
     */
    public void markAsExpired() {
        this.status = DocumentStatus.EXPIRED;
        this.expired = true;
    }

    /**
     * Supersede with new document.
     */
    public void supersede() {
        this.status = DocumentStatus.SUPERSEDED;
    }

    /**
     * Mark as acknowledged.
     */
    public void acknowledge(UUID userId) {
        this.acknowledgedBy = userId;
        this.acknowledgedAt = Instant.now();
    }

    /**
     * Soft delete.
     */
    public void softDelete() {
        if (!canBeDeleted) {
            throw new IllegalStateException("Document cannot be deleted due to retention policy");
        }
        this.status = DocumentStatus.DELETED;
        this.setDeleted(true);
    }

    /**
     * Check if document is valid.
     */
    public boolean isValid() {
        if (validUntil != null && LocalDate.now().isAfter(validUntil)) {
            return false;
        }
        return status == DocumentStatus.ACTIVE;
    }

    /**
     * Check if within retention period.
     */
    public boolean isWithinRetention() {
        if (retentionUntil == null) {
            return true;
        }
        return LocalDate.now().isBefore(retentionUntil);
    }

    /**
     * Calculate retention date.
     */
    public void calculateRetention(LocalDate fromDate) {
        if (retentionYears != null && retentionYears > 0) {
            this.retentionUntil = fromDate.plusYears(retentionYears);
            this.canBeDeleted = false;
        }
    }

    /**
     * Get file extension.
     */
    public String getFileExtension() {
        if (fileExtension != null) {
            return fileExtension;
        }
        if (fileName != null && fileName.contains(".")) {
            return fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
        }
        return null;
    }

    /**
     * Get human-readable file size.
     */
    public String getFormattedFileSize() {
        if (fileSize < 1024) {
            return fileSize + " B";
        } else if (fileSize < 1024 * 1024) {
            return String.format("%.1f KB", fileSize / 1024.0);
        } else if (fileSize < 1024 * 1024 * 1024) {
            return String.format("%.1f MB", fileSize / (1024.0 * 1024));
        } else {
            return String.format("%.1f GB", fileSize / (1024.0 * 1024 * 1024));
        }
    }
}
