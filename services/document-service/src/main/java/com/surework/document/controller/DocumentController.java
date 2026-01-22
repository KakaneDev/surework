package com.surework.document.controller;

import com.surework.document.domain.*;
import com.surework.document.dto.DocumentDto;
import com.surework.document.service.DocumentService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for document operations.
 */
@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    // === Upload Endpoints ===

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentDto.DocumentResponse> uploadDocument(
            @RequestPart("file") MultipartFile file,
            @RequestPart("metadata") @Valid DocumentDto.UploadRequest request,
            @RequestParam UUID uploaderId) {
        DocumentDto.DocumentResponse response = documentService.uploadDocument(file, request, uploaderId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(value = "/{documentId}/versions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentDto.DocumentResponse> uploadNewVersion(
            @PathVariable UUID documentId,
            @RequestPart("file") MultipartFile file,
            @RequestPart(value = "metadata", required = false) DocumentDto.NewVersionRequest request,
            @RequestParam UUID uploaderId) {
        DocumentDto.DocumentResponse response = documentService.uploadNewVersion(
                documentId, file, request != null ? request : new DocumentDto.NewVersionRequest(null), uploaderId);
        return ResponseEntity.ok(response);
    }

    // === Read Endpoints ===

    @GetMapping("/{documentId}")
    public ResponseEntity<DocumentDto.DocumentResponse> getDocument(@PathVariable UUID documentId) {
        return documentService.getDocument(documentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/reference/{reference}")
    public ResponseEntity<DocumentDto.DocumentResponse> getDocumentByReference(
            @PathVariable String reference) {
        return documentService.getDocumentByReference(reference)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/owner/{ownerType}/{ownerId}")
    public ResponseEntity<List<DocumentDto.DocumentResponse>> getDocumentsByOwner(
            @PathVariable Document.OwnerType ownerType,
            @PathVariable UUID ownerId) {
        List<DocumentDto.DocumentResponse> documents = documentService.getDocumentsByOwner(ownerType, ownerId);
        return ResponseEntity.ok(documents);
    }

    @GetMapping("/owner/{ownerType}/{ownerId}/category/{category}")
    public ResponseEntity<List<DocumentDto.DocumentResponse>> getDocumentsByOwnerAndCategory(
            @PathVariable Document.OwnerType ownerType,
            @PathVariable UUID ownerId,
            @PathVariable Document.DocumentCategory category) {
        List<DocumentDto.DocumentResponse> documents = documentService.getDocumentsByOwnerAndCategory(
                ownerType, ownerId, category);
        return ResponseEntity.ok(documents);
    }

    @GetMapping
    public ResponseEntity<Page<DocumentDto.DocumentResponse>> searchDocuments(
            @RequestParam(required = false) Document.OwnerType ownerType,
            @RequestParam(required = false) UUID ownerId,
            @RequestParam(required = false) Document.DocumentCategory category,
            @RequestParam(required = false) Document.DocumentStatus status,
            @RequestParam(required = false) String searchTerm,
            Pageable pageable) {
        Page<DocumentDto.DocumentResponse> documents = documentService.searchDocuments(
                ownerType, ownerId, category, status, searchTerm, pageable);
        return ResponseEntity.ok(documents);
    }

    // === Version Endpoints ===

    @GetMapping("/{documentId}/versions")
    public ResponseEntity<List<DocumentDto.VersionResponse>> getVersions(@PathVariable UUID documentId) {
        List<DocumentDto.VersionResponse> versions = documentService.getVersions(documentId);
        return ResponseEntity.ok(versions);
    }

    @GetMapping("/{documentId}/versions/{versionNumber}")
    public ResponseEntity<DocumentDto.VersionResponse> getVersion(
            @PathVariable UUID documentId,
            @PathVariable int versionNumber) {
        return documentService.getVersion(documentId, versionNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // === Update Endpoints ===

    @PutMapping("/{documentId}")
    public ResponseEntity<DocumentDto.DocumentResponse> updateDocument(
            @PathVariable UUID documentId,
            @Valid @RequestBody DocumentDto.UpdateDocumentRequest request) {
        DocumentDto.DocumentResponse response = documentService.updateDocument(documentId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{documentId}/acknowledge")
    public ResponseEntity<Void> acknowledgeDocument(
            @PathVariable UUID documentId,
            @RequestParam UUID userId) {
        documentService.acknowledgeDocument(documentId, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{documentId}/archive")
    public ResponseEntity<DocumentDto.DocumentResponse> archiveDocument(@PathVariable UUID documentId) {
        DocumentDto.DocumentResponse response = documentService.archiveDocument(documentId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{documentId}/restore")
    public ResponseEntity<DocumentDto.DocumentResponse> restoreDocument(@PathVariable UUID documentId) {
        DocumentDto.DocumentResponse response = documentService.restoreDocument(documentId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> deleteDocument(@PathVariable UUID documentId) {
        documentService.deleteDocument(documentId);
        return ResponseEntity.noContent().build();
    }

    // === Download Endpoints ===

    @GetMapping("/{documentId}/download-url")
    public ResponseEntity<DocumentDto.DownloadResponse> getDownloadUrl(@PathVariable UUID documentId) {
        DocumentDto.DownloadResponse response = documentService.getDownloadUrl(documentId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{documentId}/versions/{versionNumber}/download-url")
    public ResponseEntity<DocumentDto.DownloadResponse> getVersionDownloadUrl(
            @PathVariable UUID documentId,
            @PathVariable int versionNumber) {
        DocumentDto.DownloadResponse response = documentService.getDownloadUrl(documentId, versionNumber);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{documentId}/download")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable UUID documentId) {
        byte[] content = documentService.downloadDocument(documentId);

        return documentService.getDocument(documentId)
                .map(doc -> ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION,
                                "attachment; filename=\"" + doc.fileName() + "\"")
                        .contentType(MediaType.parseMediaType(
                                doc.contentType() != null ? doc.contentType() : "application/octet-stream"))
                        .contentLength(content.length)
                        .body(content))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{documentId}/versions/{versionNumber}/download")
    public ResponseEntity<byte[]> downloadVersion(
            @PathVariable UUID documentId,
            @PathVariable int versionNumber) {
        byte[] content = documentService.downloadVersion(documentId, versionNumber);

        return documentService.getVersion(documentId, versionNumber)
                .map(version -> ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION,
                                "attachment; filename=\"" + version.fileName() + "\"")
                        .contentType(MediaType.APPLICATION_OCTET_STREAM)
                        .contentLength(content.length)
                        .body(content))
                .orElse(ResponseEntity.notFound().build());
    }

    // === Template Endpoints ===

    @PostMapping("/templates")
    public ResponseEntity<DocumentDto.TemplateResponse> createTemplate(
            @Valid @RequestBody DocumentDto.CreateTemplateRequest request,
            @RequestParam UUID creatorId) {
        DocumentDto.TemplateResponse response = documentService.createTemplate(request, creatorId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping(value = "/templates/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentDto.TemplateResponse> uploadTemplate(
            @RequestPart("file") MultipartFile file,
            @RequestPart("metadata") @Valid DocumentDto.CreateTemplateRequest request,
            @RequestParam UUID creatorId) {
        DocumentDto.TemplateResponse response = documentService.uploadTemplate(file, request, creatorId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/templates/{templateId}")
    public ResponseEntity<DocumentDto.TemplateResponse> updateTemplate(
            @PathVariable UUID templateId,
            @Valid @RequestBody DocumentDto.UpdateTemplateRequest request) {
        DocumentDto.TemplateResponse response = documentService.updateTemplate(templateId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/templates/{templateId}")
    public ResponseEntity<DocumentDto.TemplateResponse> getTemplate(@PathVariable UUID templateId) {
        return documentService.getTemplate(templateId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/templates/code/{code}")
    public ResponseEntity<DocumentDto.TemplateResponse> getTemplateByCode(@PathVariable String code) {
        return documentService.getTemplateByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/templates/type/{type}")
    public ResponseEntity<List<DocumentDto.TemplateResponse>> getTemplatesByType(
            @PathVariable DocumentTemplate.TemplateType type) {
        List<DocumentDto.TemplateResponse> templates = documentService.getTemplatesByType(type);
        return ResponseEntity.ok(templates);
    }

    @GetMapping("/templates/category/{category}")
    public ResponseEntity<List<DocumentDto.TemplateResponse>> getTemplatesByCategory(
            @PathVariable Document.DocumentCategory category) {
        List<DocumentDto.TemplateResponse> templates = documentService.getTemplatesByCategory(category);
        return ResponseEntity.ok(templates);
    }

    @GetMapping("/templates")
    public ResponseEntity<Page<DocumentDto.TemplateResponse>> searchTemplates(
            @RequestParam(required = false) DocumentTemplate.TemplateType type,
            @RequestParam(required = false) Document.DocumentCategory category,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String searchTerm,
            Pageable pageable) {
        Page<DocumentDto.TemplateResponse> templates = documentService.searchTemplates(
                type, category, active, searchTerm, pageable);
        return ResponseEntity.ok(templates);
    }

    // === Compliance Endpoints ===

    @GetMapping("/expiring")
    public ResponseEntity<List<DocumentDto.DocumentResponse>> getExpiringDocuments(
            @RequestParam(defaultValue = "30") int daysAhead) {
        List<DocumentDto.DocumentResponse> documents = documentService.getExpiringDocuments(daysAhead);
        return ResponseEntity.ok(documents);
    }

    @GetMapping("/expired")
    public ResponseEntity<List<DocumentDto.DocumentResponse>> getExpiredDocuments() {
        List<DocumentDto.DocumentResponse> documents = documentService.getExpiredDocuments();
        return ResponseEntity.ok(documents);
    }

    @GetMapping("/pending-acknowledgment/{employeeId}")
    public ResponseEntity<List<DocumentDto.DocumentResponse>> getPendingAcknowledgments(
            @PathVariable UUID employeeId) {
        List<DocumentDto.DocumentResponse> documents = documentService.getPendingAcknowledgments(employeeId);
        return ResponseEntity.ok(documents);
    }

    @GetMapping("/compliance/{ownerType}/{ownerId}")
    public ResponseEntity<DocumentDto.ComplianceCheckResult> checkCompliance(
            @PathVariable Document.OwnerType ownerType,
            @PathVariable UUID ownerId) {
        DocumentDto.ComplianceCheckResult result = documentService.checkCompliance(ownerType, ownerId);
        return ResponseEntity.ok(result);
    }

    // === Dashboard & Reporting Endpoints ===

    @GetMapping("/dashboard")
    public ResponseEntity<DocumentDto.DocumentDashboard> getDashboard() {
        DocumentDto.DocumentDashboard dashboard = documentService.getDashboard();
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/owner/{ownerType}/{ownerId}/summary")
    public ResponseEntity<DocumentDto.OwnerDocumentSummary> getOwnerSummary(
            @PathVariable Document.OwnerType ownerType,
            @PathVariable UUID ownerId) {
        DocumentDto.OwnerDocumentSummary summary = documentService.getOwnerSummary(ownerType, ownerId);
        return ResponseEntity.ok(summary);
    }

    // === Bulk Operation Endpoints ===

    @PostMapping("/bulk/delete")
    public ResponseEntity<DocumentDto.BulkOperationResult> bulkDelete(
            @Valid @RequestBody DocumentDto.BulkDeleteRequest request,
            @RequestParam UUID userId) {
        DocumentDto.BulkOperationResult result = documentService.bulkDelete(request, userId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/bulk/archive")
    public ResponseEntity<DocumentDto.BulkOperationResult> bulkArchive(
            @Valid @RequestBody DocumentDto.BulkArchiveRequest request) {
        DocumentDto.BulkOperationResult result = documentService.bulkArchive(request);
        return ResponseEntity.ok(result);
    }
}
