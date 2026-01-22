package com.surework.document.service;

import com.surework.document.domain.*;
import com.surework.document.dto.DocumentDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service interface for document operations.
 */
public interface DocumentService {

    // === Upload Operations ===

    DocumentDto.DocumentResponse uploadDocument(
            MultipartFile file,
            DocumentDto.UploadRequest request,
            UUID uploaderId);

    DocumentDto.DocumentResponse uploadNewVersion(
            UUID documentId,
            MultipartFile file,
            DocumentDto.NewVersionRequest request,
            UUID uploaderId);

    // === Read Operations ===

    Optional<DocumentDto.DocumentResponse> getDocument(UUID documentId);

    Optional<DocumentDto.DocumentResponse> getDocumentByReference(String reference);

    List<DocumentDto.DocumentResponse> getDocumentsByOwner(Document.OwnerType ownerType, UUID ownerId);

    List<DocumentDto.DocumentResponse> getDocumentsByOwnerAndCategory(
            Document.OwnerType ownerType, UUID ownerId, Document.DocumentCategory category);

    Page<DocumentDto.DocumentResponse> searchDocuments(
            Document.OwnerType ownerType,
            UUID ownerId,
            Document.DocumentCategory category,
            Document.DocumentStatus status,
            String searchTerm,
            Pageable pageable);

    // === Version Operations ===

    List<DocumentDto.VersionResponse> getVersions(UUID documentId);

    Optional<DocumentDto.VersionResponse> getVersion(UUID documentId, int versionNumber);

    // === Update Operations ===

    DocumentDto.DocumentResponse updateDocument(UUID documentId, DocumentDto.UpdateDocumentRequest request);

    void acknowledgeDocument(UUID documentId, UUID userId);

    DocumentDto.DocumentResponse archiveDocument(UUID documentId);

    DocumentDto.DocumentResponse restoreDocument(UUID documentId);

    void deleteDocument(UUID documentId);

    // === Download Operations ===

    DocumentDto.DownloadResponse getDownloadUrl(UUID documentId);

    DocumentDto.DownloadResponse getDownloadUrl(UUID documentId, int versionNumber);

    byte[] downloadDocument(UUID documentId);

    byte[] downloadVersion(UUID documentId, int versionNumber);

    // === Template Operations ===

    DocumentDto.TemplateResponse createTemplate(DocumentDto.CreateTemplateRequest request, UUID creatorId);

    DocumentDto.TemplateResponse uploadTemplate(
            MultipartFile file,
            DocumentDto.CreateTemplateRequest request,
            UUID creatorId);

    DocumentDto.TemplateResponse updateTemplate(UUID templateId, DocumentDto.UpdateTemplateRequest request);

    Optional<DocumentDto.TemplateResponse> getTemplate(UUID templateId);

    Optional<DocumentDto.TemplateResponse> getTemplateByCode(String code);

    List<DocumentDto.TemplateResponse> getTemplatesByType(DocumentTemplate.TemplateType type);

    List<DocumentDto.TemplateResponse> getTemplatesByCategory(Document.DocumentCategory category);

    Page<DocumentDto.TemplateResponse> searchTemplates(
            DocumentTemplate.TemplateType type,
            Document.DocumentCategory category,
            Boolean active,
            String searchTerm,
            Pageable pageable);

    byte[] generateDocument(UUID templateId, java.util.Map<String, Object> variables);

    // === Compliance Operations ===

    List<DocumentDto.DocumentResponse> getExpiringDocuments(int daysAhead);

    List<DocumentDto.DocumentResponse> getExpiredDocuments();

    List<DocumentDto.DocumentResponse> getPendingAcknowledgments(UUID employeeId);

    DocumentDto.ComplianceCheckResult checkCompliance(Document.OwnerType ownerType, UUID ownerId);

    // === Dashboard & Reporting ===

    DocumentDto.DocumentDashboard getDashboard();

    DocumentDto.OwnerDocumentSummary getOwnerSummary(Document.OwnerType ownerType, UUID ownerId);

    long getTotalStorageUsed();

    long getStorageByOwner(Document.OwnerType ownerType, UUID ownerId);

    // === Bulk Operations ===

    DocumentDto.BulkOperationResult bulkDelete(DocumentDto.BulkDeleteRequest request, UUID userId);

    DocumentDto.BulkOperationResult bulkArchive(DocumentDto.BulkArchiveRequest request);

    // === Maintenance Operations ===

    void processExpiredDocuments();

    void cleanupDeletedDocuments(int daysOld);
}
