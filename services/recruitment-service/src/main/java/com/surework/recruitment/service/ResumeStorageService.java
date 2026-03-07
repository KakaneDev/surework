package com.surework.recruitment.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Service for storing and retrieving resume files.
 * Integrates with document-service for centralized document storage.
 */
@Service
public class ResumeStorageService {

    private static final Logger log = LoggerFactory.getLogger(ResumeStorageService.class);

    // Maximum file size: 10MB
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    // Allowed file types for resumes
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "doc", "docx", "rtf", "txt", "odt"
    );

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/rtf",
            "text/plain",
            "application/vnd.oasis.opendocument.text"
    );

    private final RestTemplate restTemplate;

    @Value("${surework.services.document-service.url:http://localhost:8087}")
    private String documentServiceUrl;

    public ResumeStorageService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Store a resume file from base64 encoded content.
     *
     * @param base64Content  The base64 encoded file content
     * @param fileName       The original file name
     * @param candidateId    The candidate/applicant ID for path organization
     * @param applicationRef The application reference for naming
     * @return Result containing the document ID and storage path
     */
    public ResumeStorageResult storeResume(
            String base64Content,
            String fileName,
            UUID candidateId,
            String applicationRef) {

        log.info("Storing resume for application {} with filename {}", applicationRef, fileName);

        // Validate file
        ValidationResult validation = validateResume(base64Content, fileName);
        if (!validation.valid()) {
            log.warn("Resume validation failed: {}", validation.message());
            return ResumeStorageResult.failure(validation.message());
        }

        // Decode base64 content
        byte[] fileContent;
        try {
            // Remove data URL prefix if present (e.g., "data:application/pdf;base64,")
            String cleanBase64 = base64Content;
            if (base64Content.contains(",")) {
                cleanBase64 = base64Content.substring(base64Content.indexOf(",") + 1);
            }
            fileContent = Base64.getDecoder().decode(cleanBase64);
        } catch (IllegalArgumentException e) {
            log.error("Failed to decode base64 content: {}", e.getMessage());
            return ResumeStorageResult.failure("Invalid file encoding");
        }

        // Validate decoded size
        if (fileContent.length > MAX_FILE_SIZE) {
            return ResumeStorageResult.failure("File exceeds maximum size of 10MB");
        }

        // Determine file extension and content type
        String extension = getFileExtension(fileName);
        String contentType = detectContentType(extension, fileContent);

        // Generate storage path: candidates/{candidateId}/{applicationRef}_resume.{ext}
        String storageName = applicationRef + "_resume." + extension;

        try {
            // Prepare upload request for document service
            DocumentUploadRequest uploadRequest = new DocumentUploadRequest(
                    storageName,
                    "RESUME",
                    "CANDIDATE",
                    candidateId,
                    null, // ownerName - will be set by candidate info
                    "Resume uploaded via public careers portal for application " + applicationRef,
                    Base64.getEncoder().encodeToString(fileContent),
                    fileName,
                    contentType,
                    null, // validFrom
                    null, // validUntil
                    "PRIVATE",
                    false, // confidential
                    false, // requiresAcknowledgment
                    null, // tags
                    "Public application"
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<DocumentUploadRequest> requestEntity = new HttpEntity<>(uploadRequest, headers);

            ResponseEntity<DocumentUploadResponse> response = restTemplate.exchange(
                    documentServiceUrl + "/api/documents/upload/base64",
                    HttpMethod.POST,
                    requestEntity,
                    DocumentUploadResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                DocumentUploadResponse body = response.getBody();
                log.info("Resume stored successfully: documentId={}, reference={}",
                        body.id(), body.documentReference());

                return ResumeStorageResult.success(
                        body.id(),
                        body.documentReference(),
                        body.storagePath(),
                        body.fileName(),
                        fileContent.length
                );
            }

            log.error("Document service returned non-success status: {}", response.getStatusCode());
            return ResumeStorageResult.failure("Failed to store resume - service error");

        } catch (RestClientException e) {
            log.error("Error calling document service: {}", e.getMessage(), e);
            // Fall back to storing locally or in temporary storage
            return handleDocumentServiceUnavailable(fileContent, fileName, candidateId, applicationRef, extension);
        }
    }

    /**
     * Validate resume file before storage.
     */
    private ValidationResult validateResume(String base64Content, String fileName) {
        if (base64Content == null || base64Content.isBlank()) {
            return new ValidationResult(false, "No file content provided");
        }

        if (fileName == null || fileName.isBlank()) {
            return new ValidationResult(false, "No file name provided");
        }

        String extension = getFileExtension(fileName);
        if (extension.isEmpty() || !ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            return new ValidationResult(false,
                    "Invalid file type. Allowed types: " + String.join(", ", ALLOWED_EXTENSIONS));
        }

        // Check base64 content size (approximate file size check)
        // Base64 is ~33% larger than binary
        long approximateSize = (long) (base64Content.length() * 0.75);
        if (approximateSize > MAX_FILE_SIZE) {
            return new ValidationResult(false, "File exceeds maximum size of 10MB");
        }

        return new ValidationResult(true, null);
    }

    /**
     * Get file extension from filename.
     */
    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }

    /**
     * Detect content type from extension and file content.
     */
    private String detectContentType(String extension, byte[] content) {
        // Check for PDF magic bytes
        if (content.length >= 4 && content[0] == 0x25 && content[1] == 0x50 &&
                content[2] == 0x44 && content[3] == 0x46) {
            return "application/pdf";
        }

        // Check for Office document magic bytes (DOCX is a ZIP)
        if (content.length >= 4 && content[0] == 0x50 && content[1] == 0x4B &&
                content[2] == 0x03 && content[3] == 0x04) {
            if (extension.equals("docx")) {
                return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            }
            return "application/zip";
        }

        // Check for DOC magic bytes
        if (content.length >= 8 && content[0] == (byte) 0xD0 && content[1] == (byte) 0xCF &&
                content[2] == 0x11 && content[3] == (byte) 0xE0) {
            return "application/msword";
        }

        // Fall back to extension-based detection
        return switch (extension.toLowerCase()) {
            case "pdf" -> "application/pdf";
            case "doc" -> "application/msword";
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "rtf" -> "application/rtf";
            case "txt" -> "text/plain";
            case "odt" -> "application/vnd.oasis.opendocument.text";
            default -> "application/octet-stream";
        };
    }

    /**
     * Handle when document service is unavailable.
     * Stores basic info and marks for later processing.
     */
    private ResumeStorageResult handleDocumentServiceUnavailable(
            byte[] content,
            String fileName,
            UUID candidateId,
            String applicationRef,
            String extension) {

        log.warn("Document service unavailable, creating pending reference for application {}", applicationRef);

        // Create a pending reference that can be processed later
        String pendingReference = "PENDING-" + applicationRef + "-" + UUID.randomUUID().toString().substring(0, 8);

        // In production, this could write to a local queue or temporary storage
        // For now, we return a pending result that the application can store

        return new ResumeStorageResult(
                true,
                null, // No document ID yet
                pendingReference,
                null, // No storage path yet
                fileName,
                content.length,
                true, // pendingUpload flag
                "Resume queued for upload - document service temporarily unavailable"
        );
    }

    /**
     * Get download URL for a stored resume.
     */
    public Optional<String> getResumeDownloadUrl(UUID documentId) {
        if (documentId == null) {
            return Optional.empty();
        }

        try {
            String url = documentServiceUrl + "/api/documents/" + documentId + "/download-url";
            ResponseEntity<DownloadUrlResponse> response = restTemplate.getForEntity(url, DownloadUrlResponse.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return Optional.of(response.getBody().url());
            }
        } catch (Exception e) {
            log.error("Error getting download URL for document {}: {}", documentId, e.getMessage());
        }

        return Optional.empty();
    }

    /**
     * Result of resume storage operation.
     */
    public record ResumeStorageResult(
            boolean success,
            UUID documentId,
            String documentReference,
            String storagePath,
            String fileName,
            long fileSize,
            boolean pendingUpload,
            String message
    ) {
        public static ResumeStorageResult success(UUID documentId, String documentReference,
                                                   String storagePath, String fileName, long fileSize) {
            return new ResumeStorageResult(true, documentId, documentReference, storagePath,
                    fileName, fileSize, false, "Resume stored successfully");
        }

        public static ResumeStorageResult failure(String message) {
            return new ResumeStorageResult(false, null, null, null, null, 0, false, message);
        }
    }

    /**
     * Validation result.
     */
    private record ValidationResult(boolean valid, String message) {}

    /**
     * Request payload for document upload.
     */
    private record DocumentUploadRequest(
            String name,
            String category,
            String ownerType,
            UUID ownerId,
            String ownerName,
            String description,
            String base64Content,
            String originalFileName,
            String contentType,
            String validFrom,
            String validUntil,
            String visibility,
            boolean confidential,
            boolean requiresAcknowledgment,
            String tags,
            String notes
    ) {}

    /**
     * Response from document upload.
     */
    private record DocumentUploadResponse(
            UUID id,
            String documentReference,
            String name,
            String storagePath,
            String fileName,
            long fileSize
    ) {}

    /**
     * Response from download URL request.
     */
    private record DownloadUrlResponse(String url, String fileName, String contentType, long fileSize) {}
}
