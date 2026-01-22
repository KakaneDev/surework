package com.surework.document.dto;

import com.surework.document.domain.*;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * DTOs for Document operations.
 */
public sealed interface DocumentDto {

    // === Upload DTOs ===

    record UploadRequest(
            @NotBlank(message = "Document name is required")
            String name,

            String description,

            @NotNull(message = "Category is required")
            Document.DocumentCategory category,

            @NotNull(message = "Owner type is required")
            Document.OwnerType ownerType,

            @NotNull(message = "Owner ID is required")
            UUID ownerId,

            String ownerName,
            LocalDate validFrom,
            LocalDate validUntil,
            Document.Visibility visibility,
            boolean confidential,
            boolean requiresAcknowledgment,
            String tags,
            String notes
    ) implements DocumentDto {}

    record UploadResponse(
            UUID id,
            String documentReference,
            String name,
            String fileName,
            long fileSize,
            String formattedFileSize,
            String contentType,
            String uploadUrl,  // Pre-signed URL for direct upload
            Instant uploadedAt
    ) implements DocumentDto {}

    // === Document Response DTOs ===

    record DocumentResponse(
            UUID id,
            String documentReference,
            String name,
            String description,
            Document.DocumentCategory category,
            String categoryName,
            Document.OwnerType ownerType,
            UUID ownerId,
            String ownerName,
            int currentVersion,
            String fileName,
            String fileExtension,
            String contentType,
            long fileSize,
            String formattedFileSize,
            Document.DocumentStatus status,
            LocalDate validFrom,
            LocalDate validUntil,
            boolean expired,
            Integer retentionYears,
            LocalDate retentionUntil,
            Document.Visibility visibility,
            boolean confidential,
            boolean requiresAcknowledgment,
            Instant acknowledgedAt,
            String tags,
            String notes,
            UUID uploadedBy,
            String uploadedByName,
            Instant uploadedAt,
            Instant createdAt
    ) implements DocumentDto {

        public static DocumentResponse fromEntity(Document doc) {
            return new DocumentResponse(
                    doc.getId(),
                    doc.getDocumentReference(),
                    doc.getName(),
                    doc.getDescription(),
                    doc.getCategory(),
                    doc.getCategory().name().replace("_", " "),
                    doc.getOwnerType(),
                    doc.getOwnerId(),
                    doc.getOwnerName(),
                    doc.getCurrentVersion(),
                    doc.getFileName(),
                    doc.getFileExtension(),
                    doc.getContentType(),
                    doc.getFileSize(),
                    doc.getFormattedFileSize(),
                    doc.getStatus(),
                    doc.getValidFrom(),
                    doc.getValidUntil(),
                    doc.isExpired(),
                    doc.getRetentionYears(),
                    doc.getRetentionUntil(),
                    doc.getVisibility(),
                    doc.isConfidential(),
                    doc.isRequiresAcknowledgment(),
                    doc.getAcknowledgedAt(),
                    doc.getTags(),
                    doc.getNotes(),
                    doc.getUploadedBy(),
                    doc.getUploadedByName(),
                    doc.getUploadedAt(),
                    doc.getCreatedAt()
            );
        }
    }

    record DocumentSummary(
            UUID id,
            String documentReference,
            String name,
            Document.DocumentCategory category,
            String fileName,
            long fileSize,
            String formattedFileSize,
            Document.DocumentStatus status,
            Instant uploadedAt
    ) implements DocumentDto {

        public static DocumentSummary fromEntity(Document doc) {
            return new DocumentSummary(
                    doc.getId(),
                    doc.getDocumentReference(),
                    doc.getName(),
                    doc.getCategory(),
                    doc.getFileName(),
                    doc.getFileSize(),
                    doc.getFormattedFileSize(),
                    doc.getStatus(),
                    doc.getUploadedAt()
            );
        }
    }

    // === Version DTOs ===

    record VersionResponse(
            UUID id,
            int versionNumber,
            String fileName,
            long fileSize,
            String formattedFileSize,
            String checksum,
            String changeNotes,
            UUID uploadedBy,
            String uploadedByName,
            Instant uploadedAt,
            boolean current
    ) implements DocumentDto {

        public static VersionResponse fromEntity(DocumentVersion version) {
            return new VersionResponse(
                    version.getId(),
                    version.getVersionNumber(),
                    version.getFileName(),
                    version.getFileSize(),
                    version.getFormattedFileSize(),
                    version.getChecksum(),
                    version.getChangeNotes(),
                    version.getUploadedBy(),
                    version.getUploadedByName(),
                    version.getUploadedAt(),
                    version.isCurrent()
            );
        }
    }

    record NewVersionRequest(
            String changeNotes
    ) implements DocumentDto {}

    // === Update DTOs ===

    record UpdateDocumentRequest(
            String name,
            String description,
            LocalDate validFrom,
            LocalDate validUntil,
            Document.Visibility visibility,
            boolean confidential,
            String tags,
            String notes
    ) implements DocumentDto {}

    // === Template DTOs ===

    record CreateTemplateRequest(
            @NotBlank(message = "Name is required")
            String name,

            @NotBlank(message = "Code is required")
            String code,

            String description,

            @NotNull(message = "Template type is required")
            DocumentTemplate.TemplateType templateType,

            @NotNull(message = "Category is required")
            Document.DocumentCategory category,

            String templateContent,
            String variables,
            boolean defaultTemplate
    ) implements DocumentDto {}

    record UpdateTemplateRequest(
            String name,
            String description,
            String templateContent,
            String variables,
            boolean active,
            boolean defaultTemplate
    ) implements DocumentDto {}

    record TemplateResponse(
            UUID id,
            String name,
            String code,
            String description,
            DocumentTemplate.TemplateType templateType,
            Document.DocumentCategory category,
            String fileName,
            String contentType,
            long fileSize,
            int version,
            boolean active,
            boolean defaultTemplate,
            boolean compliant,
            Instant lastReviewedAt,
            Instant createdAt
    ) implements DocumentDto {

        public static TemplateResponse fromEntity(DocumentTemplate template) {
            return new TemplateResponse(
                    template.getId(),
                    template.getName(),
                    template.getCode(),
                    template.getDescription(),
                    template.getTemplateType(),
                    template.getCategory(),
                    template.getFileName(),
                    template.getContentType(),
                    template.getFileSize(),
                    template.getVersion(),
                    template.isActive(),
                    template.isDefaultTemplate(),
                    template.isCompliant(),
                    template.getLastReviewedAt(),
                    template.getCreatedAt()
            );
        }
    }

    // === Download DTOs ===

    record DownloadResponse(
            String downloadUrl,  // Pre-signed URL
            String fileName,
            String contentType,
            long fileSize,
            Instant expiresAt
    ) implements DocumentDto {}

    // === Dashboard DTOs ===

    record DocumentDashboard(
            long totalDocuments,
            long totalStorageBytes,
            String formattedTotalStorage,
            List<CategoryCount> documentsByCategory,
            List<DocumentSummary> recentUploads,
            List<DocumentSummary> expiringDocuments,
            List<DocumentSummary> pendingAcknowledgment
    ) implements DocumentDto {}

    record CategoryCount(
            Document.DocumentCategory category,
            String categoryName,
            long count
    ) implements DocumentDto {}

    record OwnerDocumentSummary(
            UUID ownerId,
            Document.OwnerType ownerType,
            String ownerName,
            long documentCount,
            long totalStorageBytes,
            String formattedStorage,
            List<CategoryCount> byCategory
    ) implements DocumentDto {}

    // === Compliance DTOs ===

    record ComplianceCheckResult(
            UUID ownerId,
            Document.OwnerType ownerType,
            String ownerName,
            List<MissingDocument> missingDocuments,
            List<ExpiringDocument> expiringDocuments,
            List<ExpiredDocument> expiredDocuments,
            boolean compliant
    ) implements DocumentDto {}

    record MissingDocument(
            Document.DocumentCategory category,
            String categoryName,
            boolean required
    ) implements DocumentDto {}

    record ExpiringDocument(
            UUID documentId,
            String name,
            Document.DocumentCategory category,
            LocalDate expiresOn,
            int daysUntilExpiry
    ) implements DocumentDto {}

    record ExpiredDocument(
            UUID documentId,
            String name,
            Document.DocumentCategory category,
            LocalDate expiredOn,
            int daysSinceExpiry
    ) implements DocumentDto {}

    // === Bulk Operations ===

    record BulkDeleteRequest(
            List<UUID> documentIds,
            String reason
    ) implements DocumentDto {}

    record BulkArchiveRequest(
            List<UUID> documentIds
    ) implements DocumentDto {}

    record BulkOperationResult(
            int successCount,
            int failureCount,
            List<String> errors
    ) implements DocumentDto {}
}
