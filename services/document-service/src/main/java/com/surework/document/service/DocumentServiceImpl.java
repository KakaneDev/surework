package com.surework.document.service;

import com.surework.document.domain.*;
import com.surework.document.dto.DocumentDto;
import com.surework.document.repository.*;
import org.apache.tika.Tika;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of DocumentService.
 */
@Service
@Transactional
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentVersionRepository versionRepository;
    private final DocumentTemplateRepository templateRepository;
    private final StorageService storageService;
    private final Tika tika;

    // Required document categories for compliance
    private static final Set<Document.DocumentCategory> REQUIRED_EMPLOYEE_DOCUMENTS = Set.of(
            Document.DocumentCategory.EMPLOYMENT_CONTRACT,
            Document.DocumentCategory.ID_DOCUMENT,
            Document.DocumentCategory.TAX_NUMBER,
            Document.DocumentCategory.BANK_CONFIRMATION
    );

    public DocumentServiceImpl(
            DocumentRepository documentRepository,
            DocumentVersionRepository versionRepository,
            DocumentTemplateRepository templateRepository,
            StorageService storageService) {
        this.documentRepository = documentRepository;
        this.versionRepository = versionRepository;
        this.templateRepository = templateRepository;
        this.storageService = storageService;
        this.tika = new Tika();
    }

    // === Upload Operations ===

    @Override
    public DocumentDto.DocumentResponse uploadDocument(
            MultipartFile file, DocumentDto.UploadRequest request, UUID uploaderId) {
        try {
            String originalFilename = file.getOriginalFilename();
            String contentType = tika.detect(file.getInputStream(), originalFilename);
            String extension = getFileExtension(originalFilename);
            String checksum = calculateChecksum(file.getBytes());

            // Generate storage path
            String storagePath = generateStoragePath(request.ownerType(), request.ownerId(),
                    request.category(), extension);

            // Store the file
            storageService.store(storagePath, file.getInputStream(), file.getSize(), contentType);

            // Create document record
            Document document = Document.create(
                    request.name(),
                    request.category(),
                    request.ownerType(),
                    request.ownerId(),
                    uploaderId
            );
            document.setDescription(request.description());
            document.setOwnerName(request.ownerName());
            document.setFileName(originalFilename);
            document.setOriginalFileName(originalFilename);
            document.setFileExtension(extension);
            document.setContentType(contentType);
            document.setFileSize(file.getSize());
            document.setStoragePath(storagePath);
            document.setChecksum(checksum);
            document.setValidFrom(request.validFrom());
            document.setValidUntil(request.validUntil());
            document.setVisibility(request.visibility() != null ? request.visibility() : Document.Visibility.PRIVATE);
            document.setConfidential(request.confidential());
            document.setRequiresAcknowledgment(request.requiresAcknowledgment());
            document.setTags(request.tags());
            document.setNotes(request.notes());

            // Set retention based on category
            setRetentionPolicy(document);

            // Create initial version
            DocumentVersion version = DocumentVersion.create(
                    document, 1, storagePath, file.getSize(), checksum, uploaderId);
            document.getVersions().add(version);

            document = documentRepository.save(document);
            return DocumentDto.DocumentResponse.fromEntity(document);

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload document", e);
        }
    }

    @Override
    public DocumentDto.DocumentResponse uploadNewVersion(
            UUID documentId, MultipartFile file, DocumentDto.NewVersionRequest request, UUID uploaderId) {
        try {
            Document document = documentRepository.findById(documentId)
                    .orElseThrow(() -> new IllegalArgumentException("Document not found"));

            String contentType = tika.detect(file.getInputStream(), file.getOriginalFilename());
            String checksum = calculateChecksum(file.getBytes());
            String extension = getFileExtension(file.getOriginalFilename());

            // Generate new storage path
            String storagePath = generateStoragePath(
                    document.getOwnerType(), document.getOwnerId(),
                    document.getCategory(), extension);

            // Store the file
            storageService.store(storagePath, file.getInputStream(), file.getSize(), contentType);

            // Mark previous versions as not current
            document.getVersions().forEach(v -> v.markAsNotCurrent());

            // Add new version
            document.addVersion(storagePath, file.getSize(), checksum, uploaderId, request.changeNotes());
            document.setContentType(contentType);
            document.setFileName(file.getOriginalFilename());

            document = documentRepository.save(document);
            return DocumentDto.DocumentResponse.fromEntity(document);

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload new version", e);
        }
    }

    // === Read Operations ===

    @Override
    @Transactional(readOnly = true)
    public Optional<DocumentDto.DocumentResponse> getDocument(UUID documentId) {
        return documentRepository.findById(documentId)
                .filter(d -> !d.isDeleted())
                .map(DocumentDto.DocumentResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DocumentDto.DocumentResponse> getDocumentByReference(String reference) {
        return documentRepository.findByDocumentReference(reference)
                .map(DocumentDto.DocumentResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentDto.DocumentResponse> getDocumentsByOwner(
            Document.OwnerType ownerType, UUID ownerId) {
        return documentRepository.findByOwner(ownerType, ownerId).stream()
                .map(DocumentDto.DocumentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentDto.DocumentResponse> getDocumentsByOwnerAndCategory(
            Document.OwnerType ownerType, UUID ownerId, Document.DocumentCategory category) {
        return documentRepository.findByOwnerAndCategory(ownerType, ownerId, category).stream()
                .map(DocumentDto.DocumentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DocumentDto.DocumentResponse> searchDocuments(
            Document.OwnerType ownerType,
            UUID ownerId,
            Document.DocumentCategory category,
            Document.DocumentStatus status,
            String searchTerm,
            Pageable pageable) {
        return documentRepository.search(ownerType, ownerId, category, status, searchTerm, pageable)
                .map(DocumentDto.DocumentResponse::fromEntity);
    }

    // === Version Operations ===

    @Override
    @Transactional(readOnly = true)
    public List<DocumentDto.VersionResponse> getVersions(UUID documentId) {
        return versionRepository.findByDocumentId(documentId).stream()
                .map(DocumentDto.VersionResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DocumentDto.VersionResponse> getVersion(UUID documentId, int versionNumber) {
        return versionRepository.findByDocumentIdAndVersion(documentId, versionNumber)
                .map(DocumentDto.VersionResponse::fromEntity);
    }

    // === Update Operations ===

    @Override
    public DocumentDto.DocumentResponse updateDocument(
            UUID documentId, DocumentDto.UpdateDocumentRequest request) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        if (request.name() != null) document.setName(request.name());
        if (request.description() != null) document.setDescription(request.description());
        if (request.validFrom() != null) document.setValidFrom(request.validFrom());
        if (request.validUntil() != null) document.setValidUntil(request.validUntil());
        if (request.visibility() != null) document.setVisibility(request.visibility());
        document.setConfidential(request.confidential());
        if (request.tags() != null) document.setTags(request.tags());
        if (request.notes() != null) document.setNotes(request.notes());

        document = documentRepository.save(document);
        return DocumentDto.DocumentResponse.fromEntity(document);
    }

    @Override
    public void acknowledgeDocument(UUID documentId, UUID userId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        document.acknowledge(userId);
        documentRepository.save(document);
    }

    @Override
    public DocumentDto.DocumentResponse archiveDocument(UUID documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        document.archive();
        document = documentRepository.save(document);
        return DocumentDto.DocumentResponse.fromEntity(document);
    }

    @Override
    public DocumentDto.DocumentResponse restoreDocument(UUID documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        document.setStatus(Document.DocumentStatus.ACTIVE);
        document = documentRepository.save(document);
        return DocumentDto.DocumentResponse.fromEntity(document);
    }

    @Override
    public void deleteDocument(UUID documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        document.softDelete();
        documentRepository.save(document);
    }

    // === Download Operations ===

    @Override
    @Transactional(readOnly = true)
    public DocumentDto.DownloadResponse getDownloadUrl(UUID documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        String url = storageService.getDownloadUrl(document.getStoragePath(), 60);
        return new DocumentDto.DownloadResponse(
                url,
                document.getFileName(),
                document.getContentType(),
                document.getFileSize(),
                Instant.now().plus(60, ChronoUnit.MINUTES)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentDto.DownloadResponse getDownloadUrl(UUID documentId, int versionNumber) {
        DocumentVersion version = versionRepository.findByDocumentIdAndVersion(documentId, versionNumber)
                .orElseThrow(() -> new IllegalArgumentException("Version not found"));

        String url = storageService.getDownloadUrl(version.getStoragePath(), 60);
        return new DocumentDto.DownloadResponse(
                url,
                version.getFileName(),
                null,
                version.getFileSize(),
                Instant.now().plus(60, ChronoUnit.MINUTES)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] downloadDocument(UUID documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        return storageService.retrieve(document.getStoragePath());
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] downloadVersion(UUID documentId, int versionNumber) {
        DocumentVersion version = versionRepository.findByDocumentIdAndVersion(documentId, versionNumber)
                .orElseThrow(() -> new IllegalArgumentException("Version not found"));

        return storageService.retrieve(version.getStoragePath());
    }

    // === Template Operations ===

    @Override
    public DocumentDto.TemplateResponse createTemplate(
            DocumentDto.CreateTemplateRequest request, UUID creatorId) {
        if (templateRepository.existsByCode(request.code())) {
            throw new IllegalArgumentException("Template code already exists");
        }

        DocumentTemplate template = DocumentTemplate.create(
                request.name(),
                request.code(),
                request.templateType(),
                request.category(),
                creatorId
        );
        template.setDescription(request.description());
        template.setTemplateContent(request.templateContent());
        template.setVariables(request.variables());
        template.setDefaultTemplate(request.defaultTemplate());

        template = templateRepository.save(template);
        return DocumentDto.TemplateResponse.fromEntity(template);
    }

    @Override
    public DocumentDto.TemplateResponse uploadTemplate(
            MultipartFile file, DocumentDto.CreateTemplateRequest request, UUID creatorId) {
        try {
            String contentType = tika.detect(file.getInputStream(), file.getOriginalFilename());
            String storagePath = "templates/" + request.code() + "/" + file.getOriginalFilename();

            storageService.store(storagePath, file.getInputStream(), file.getSize(), contentType);

            DocumentTemplate template = DocumentTemplate.create(
                    request.name(),
                    request.code(),
                    request.templateType(),
                    request.category(),
                    creatorId
            );
            template.setDescription(request.description());
            template.setFileName(file.getOriginalFilename());
            template.setStoragePath(storagePath);
            template.setContentType(contentType);
            template.setFileSize(file.getSize());
            template.setVariables(request.variables());
            template.setDefaultTemplate(request.defaultTemplate());

            template = templateRepository.save(template);
            return DocumentDto.TemplateResponse.fromEntity(template);

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload template", e);
        }
    }

    @Override
    public DocumentDto.TemplateResponse updateTemplate(
            UUID templateId, DocumentDto.UpdateTemplateRequest request) {
        DocumentTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new IllegalArgumentException("Template not found"));

        if (request.name() != null) template.setName(request.name());
        if (request.description() != null) template.setDescription(request.description());
        if (request.templateContent() != null) template.setTemplateContent(request.templateContent());
        if (request.variables() != null) template.setVariables(request.variables());
        template.setActive(request.active());
        template.setDefaultTemplate(request.defaultTemplate());
        template.updateTemplateVersion();

        template = templateRepository.save(template);
        return DocumentDto.TemplateResponse.fromEntity(template);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DocumentDto.TemplateResponse> getTemplate(UUID templateId) {
        return templateRepository.findById(templateId)
                .map(DocumentDto.TemplateResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DocumentDto.TemplateResponse> getTemplateByCode(String code) {
        return templateRepository.findByCode(code)
                .map(DocumentDto.TemplateResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentDto.TemplateResponse> getTemplatesByType(DocumentTemplate.TemplateType type) {
        return templateRepository.findByTemplateType(type).stream()
                .map(DocumentDto.TemplateResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentDto.TemplateResponse> getTemplatesByCategory(Document.DocumentCategory category) {
        return templateRepository.findByCategory(category).stream()
                .map(DocumentDto.TemplateResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DocumentDto.TemplateResponse> searchTemplates(
            DocumentTemplate.TemplateType type,
            Document.DocumentCategory category,
            Boolean active,
            String searchTerm,
            Pageable pageable) {
        return templateRepository.search(type, category, active, searchTerm, pageable)
                .map(DocumentDto.TemplateResponse::fromEntity);
    }

    @Override
    public byte[] generateDocument(UUID templateId, Map<String, Object> variables) {
        // TODO: Implement document generation from template
        throw new UnsupportedOperationException("Document generation not yet implemented");
    }

    // === Compliance Operations ===

    @Override
    @Transactional(readOnly = true)
    public List<DocumentDto.DocumentResponse> getExpiringDocuments(int daysAhead) {
        LocalDate today = LocalDate.now();
        LocalDate expiryDate = today.plusDays(daysAhead);
        return documentRepository.findExpiringSoon(today, expiryDate).stream()
                .map(DocumentDto.DocumentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentDto.DocumentResponse> getExpiredDocuments() {
        return documentRepository.findExpired(LocalDate.now()).stream()
                .map(DocumentDto.DocumentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentDto.DocumentResponse> getPendingAcknowledgments(UUID employeeId) {
        return documentRepository.findPendingAcknowledgment(employeeId).stream()
                .map(DocumentDto.DocumentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentDto.ComplianceCheckResult checkCompliance(Document.OwnerType ownerType, UUID ownerId) {
        List<Document> existingDocs = documentRepository.findActiveByOwner(ownerType, ownerId);
        Set<Document.DocumentCategory> existingCategories = existingDocs.stream()
                .map(Document::getCategory)
                .collect(Collectors.toSet());

        List<DocumentDto.MissingDocument> missing = new ArrayList<>();
        if (ownerType == Document.OwnerType.EMPLOYEE) {
            for (Document.DocumentCategory required : REQUIRED_EMPLOYEE_DOCUMENTS) {
                if (!existingCategories.contains(required)) {
                    missing.add(new DocumentDto.MissingDocument(
                            required,
                            required.name().replace("_", " "),
                            true
                    ));
                }
            }
        }

        LocalDate today = LocalDate.now();
        List<DocumentDto.ExpiringDocument> expiring = existingDocs.stream()
                .filter(d -> d.getValidUntil() != null && d.getValidUntil().isAfter(today) &&
                        d.getValidUntil().isBefore(today.plusDays(30)))
                .map(d -> new DocumentDto.ExpiringDocument(
                        d.getId(),
                        d.getName(),
                        d.getCategory(),
                        d.getValidUntil(),
                        (int) ChronoUnit.DAYS.between(today, d.getValidUntil())
                ))
                .collect(Collectors.toList());

        List<DocumentDto.ExpiredDocument> expired = existingDocs.stream()
                .filter(d -> d.getValidUntil() != null && d.getValidUntil().isBefore(today))
                .map(d -> new DocumentDto.ExpiredDocument(
                        d.getId(),
                        d.getName(),
                        d.getCategory(),
                        d.getValidUntil(),
                        (int) ChronoUnit.DAYS.between(d.getValidUntil(), today)
                ))
                .collect(Collectors.toList());

        boolean compliant = missing.isEmpty() && expired.isEmpty();

        return new DocumentDto.ComplianceCheckResult(
                ownerId,
                ownerType,
                null,
                missing,
                expiring,
                expired,
                compliant
        );
    }

    // === Dashboard & Reporting ===

    @Override
    @Transactional(readOnly = true)
    public DocumentDto.DocumentDashboard getDashboard() {
        long totalDocuments = documentRepository.count();

        List<Object[]> categoryStats = documentRepository.countByCategory();
        List<DocumentDto.CategoryCount> byCategory = categoryStats.stream()
                .map(row -> new DocumentDto.CategoryCount(
                        (Document.DocumentCategory) row[0],
                        ((Document.DocumentCategory) row[0]).name().replace("_", " "),
                        ((Number) row[1]).longValue()
                ))
                .collect(Collectors.toList());

        List<DocumentDto.DocumentSummary> recentUploads = documentRepository
                .findRecentUploads(PageRequest.of(0, 10))
                .map(DocumentDto.DocumentSummary::fromEntity)
                .getContent();

        List<DocumentDto.DocumentSummary> expiring = getExpiringDocuments(30).stream()
                .map(d -> new DocumentDto.DocumentSummary(
                        d.id(), d.documentReference(), d.name(), d.category(),
                        d.fileName(), d.fileSize(), d.formattedFileSize(), d.status(), d.uploadedAt()
                ))
                .collect(Collectors.toList());

        return new DocumentDto.DocumentDashboard(
                totalDocuments,
                0, // Would need to calculate total storage
                "0 B",
                byCategory,
                recentUploads,
                expiring,
                List.of()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentDto.OwnerDocumentSummary getOwnerSummary(Document.OwnerType ownerType, UUID ownerId) {
        long count = documentRepository.countByOwner(ownerType, ownerId);
        Long storage = documentRepository.getTotalStorageByOwner(ownerType, ownerId);

        return new DocumentDto.OwnerDocumentSummary(
                ownerId,
                ownerType,
                null,
                count,
                storage != null ? storage : 0,
                formatFileSize(storage != null ? storage : 0),
                List.of()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public long getTotalStorageUsed() {
        // Would need a query to sum all file sizes
        return 0;
    }

    @Override
    @Transactional(readOnly = true)
    public long getStorageByOwner(Document.OwnerType ownerType, UUID ownerId) {
        Long storage = documentRepository.getTotalStorageByOwner(ownerType, ownerId);
        return storage != null ? storage : 0;
    }

    // === Bulk Operations ===

    @Override
    public DocumentDto.BulkOperationResult bulkDelete(DocumentDto.BulkDeleteRequest request, UUID userId) {
        int success = 0;
        int failure = 0;
        List<String> errors = new ArrayList<>();

        for (UUID docId : request.documentIds()) {
            try {
                deleteDocument(docId);
                success++;
            } catch (Exception e) {
                failure++;
                errors.add("Failed to delete " + docId + ": " + e.getMessage());
            }
        }

        return new DocumentDto.BulkOperationResult(success, failure, errors);
    }

    @Override
    public DocumentDto.BulkOperationResult bulkArchive(DocumentDto.BulkArchiveRequest request) {
        int success = 0;
        int failure = 0;
        List<String> errors = new ArrayList<>();

        for (UUID docId : request.documentIds()) {
            try {
                archiveDocument(docId);
                success++;
            } catch (Exception e) {
                failure++;
                errors.add("Failed to archive " + docId + ": " + e.getMessage());
            }
        }

        return new DocumentDto.BulkOperationResult(success, failure, errors);
    }

    // === Maintenance Operations ===

    @Override
    @Scheduled(cron = "0 0 1 * * *") // Daily at 1 AM
    public void processExpiredDocuments() {
        List<Document> expired = documentRepository.findExpired(LocalDate.now());
        for (Document doc : expired) {
            doc.markAsExpired();
            documentRepository.save(doc);
        }
    }

    @Override
    public void cleanupDeletedDocuments(int daysOld) {
        // Would delete files from storage for documents deleted > daysOld days ago
    }

    // === Helper Methods ===

    private String generateStoragePath(Document.OwnerType ownerType, UUID ownerId,
                                        Document.DocumentCategory category, String extension) {
        return String.format("%s/%s/%s/%s.%s",
                ownerType.name().toLowerCase(),
                ownerId.toString(),
                category.name().toLowerCase(),
                UUID.randomUUID().toString(),
                extension);
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }

    private String calculateChecksum(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    private void setRetentionPolicy(Document document) {
        // Set retention based on South African requirements
        Integer years = switch (document.getCategory()) {
            case EMPLOYMENT_CONTRACT, IRP5, PAYSLIP, BANK_CONFIRMATION,
                 TAX_NUMBER, UIF_DECLARATION, TRAINING_CERTIFICATE -> 5;
            case MEDICAL_CERTIFICATE, LEAVE_FORM, DISCIPLINARY,
                 WARNING_LETTER, PERFORMANCE_REVIEW -> 3;
            case CV -> 2;
            case ID_DOCUMENT, QUALIFICATION, CERTIFICATION, PASSPORT -> null; // Keep indefinitely
            default -> 3;
        };

        if (years != null) {
            document.setRetentionYears(years);
            document.calculateRetention(LocalDate.now());
        }
    }

    private String formatFileSize(long bytes) {
        if (bytes < 1024) {
            return bytes + " B";
        } else if (bytes < 1024 * 1024) {
            return String.format("%.1f KB", bytes / 1024.0);
        } else if (bytes < 1024 * 1024 * 1024) {
            return String.format("%.1f MB", bytes / (1024.0 * 1024));
        } else {
            return String.format("%.1f GB", bytes / (1024.0 * 1024 * 1024));
        }
    }
}
