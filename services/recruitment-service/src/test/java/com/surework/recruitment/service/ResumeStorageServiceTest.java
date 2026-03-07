package com.surework.recruitment.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for ResumeStorageService.
 * These tests focus on validation logic which doesn't require mocking the RestTemplate.
 * Integration tests with the document service should use @SpringBootTest with TestContainers.
 */
@DisplayName("ResumeStorageService Tests")
class ResumeStorageServiceTest {

    private ResumeStorageService resumeStorageService;

    @BeforeEach
    void setUp() {
        // Using a real RestTemplate - validation tests don't actually call external services
        // because validation fails before the HTTP call is made
        resumeStorageService = new ResumeStorageService(new RestTemplate());
    }

    @Nested
    @DisplayName("File Validation Tests")
    class FileValidationTests {

        @Test
        @DisplayName("Should reject invalid file extension (exe)")
        void test_invalidExeExtension_rejected() {
            String base64Content = createValidBase64Content();
            UUID candidateId = UUID.randomUUID();

            ResumeStorageService.ResumeStorageResult result = resumeStorageService.storeResume(
                    base64Content,
                    "malware.exe",
                    candidateId,
                    "APP-12345"
            );

            assertThat(result.success()).isFalse();
            assertThat(result.message()).contains("Invalid file type");
        }

        @Test
        @DisplayName("Should reject invalid file extension (dll)")
        void test_invalidDllExtension_rejected() {
            String base64Content = createValidBase64Content();
            UUID candidateId = UUID.randomUUID();

            ResumeStorageService.ResumeStorageResult result = resumeStorageService.storeResume(
                    base64Content,
                    "library.dll",
                    candidateId,
                    "APP-12345"
            );

            assertThat(result.success()).isFalse();
            assertThat(result.message()).contains("Invalid file type");
        }

        @Test
        @DisplayName("Should reject file exceeding size limit")
        void test_fileSizeExceedsLimit_rejected() {
            // Create content > 10MB (base64 encoded)
            byte[] largeContent = new byte[11 * 1024 * 1024];
            String base64Content = Base64.getEncoder().encodeToString(largeContent);
            UUID candidateId = UUID.randomUUID();

            ResumeStorageService.ResumeStorageResult result = resumeStorageService.storeResume(
                    base64Content,
                    "large-resume.pdf",
                    candidateId,
                    "APP-12345"
            );

            assertThat(result.success()).isFalse();
            assertThat(result.message()).contains("maximum size");
        }

        @Test
        @DisplayName("Should reject empty file content")
        void test_emptyFileContent_rejected() {
            UUID candidateId = UUID.randomUUID();

            ResumeStorageService.ResumeStorageResult result = resumeStorageService.storeResume(
                    "",
                    "resume.pdf",
                    candidateId,
                    "APP-12345"
            );

            assertThat(result.success()).isFalse();
            assertThat(result.message()).contains("No file content");
        }

        @Test
        @DisplayName("Should reject null file content")
        void test_nullFileContent_rejected() {
            UUID candidateId = UUID.randomUUID();

            ResumeStorageService.ResumeStorageResult result = resumeStorageService.storeResume(
                    null,
                    "resume.pdf",
                    candidateId,
                    "APP-12345"
            );

            assertThat(result.success()).isFalse();
            assertThat(result.message()).contains("No file content");
        }

        @Test
        @DisplayName("Should reject null file name")
        void test_nullFileName_rejected() {
            String base64Content = createValidBase64Content();
            UUID candidateId = UUID.randomUUID();

            ResumeStorageService.ResumeStorageResult result = resumeStorageService.storeResume(
                    base64Content,
                    null,
                    candidateId,
                    "APP-12345"
            );

            assertThat(result.success()).isFalse();
            assertThat(result.message()).contains("No file name");
        }

        @Test
        @DisplayName("Should reject blank file name")
        void test_blankFileName_rejected() {
            String base64Content = createValidBase64Content();
            UUID candidateId = UUID.randomUUID();

            ResumeStorageService.ResumeStorageResult result = resumeStorageService.storeResume(
                    base64Content,
                    "   ",
                    candidateId,
                    "APP-12345"
            );

            assertThat(result.success()).isFalse();
            assertThat(result.message()).contains("No file name");
        }

        @Test
        @DisplayName("Should reject JS file extension")
        void test_jsExtension_rejected() {
            String base64Content = createValidBase64Content();
            UUID candidateId = UUID.randomUUID();

            ResumeStorageService.ResumeStorageResult result = resumeStorageService.storeResume(
                    base64Content,
                    "script.js",
                    candidateId,
                    "APP-12345"
            );

            assertThat(result.success()).isFalse();
            assertThat(result.message()).contains("Invalid file type");
        }

        @Test
        @DisplayName("Should reject PHP file extension")
        void test_phpExtension_rejected() {
            String base64Content = createValidBase64Content();
            UUID candidateId = UUID.randomUUID();

            ResumeStorageService.ResumeStorageResult result = resumeStorageService.storeResume(
                    base64Content,
                    "backdoor.php",
                    candidateId,
                    "APP-12345"
            );

            assertThat(result.success()).isFalse();
            assertThat(result.message()).contains("Invalid file type");
        }
    }

    @Nested
    @DisplayName("Base64 Decoding Tests")
    class Base64DecodingTests {

        @Test
        @DisplayName("Should fail on invalid base64 string")
        void test_invalidBase64_fails() {
            String invalidBase64 = "not-valid-base64!!!";
            UUID candidateId = UUID.randomUUID();

            ResumeStorageService.ResumeStorageResult result = resumeStorageService.storeResume(
                    invalidBase64,
                    "resume.pdf",
                    candidateId,
                    "APP-12345"
            );

            assertThat(result.success()).isFalse();
            assertThat(result.message()).contains("Invalid file encoding");
        }

        @Test
        @DisplayName("Should handle whitespace-only base64 string as empty")
        void test_whitespaceBase64_handled() {
            UUID candidateId = UUID.randomUUID();

            ResumeStorageService.ResumeStorageResult result = resumeStorageService.storeResume(
                    "   ",
                    "resume.pdf",
                    candidateId,
                    "APP-12345"
            );

            assertThat(result.success()).isFalse();
            assertThat(result.message()).contains("No file content");
        }
    }

    @Nested
    @DisplayName("File Extension Allowed Tests")
    class FileExtensionAllowedTests {

        // These tests verify the service allows valid extensions by checking that
        // validation passes (no "Invalid file type" message). The actual HTTP call
        // may fail but that's expected since we're not mocking external services.

        @Test
        @DisplayName("Should not reject valid PDF extension (validation passes)")
        void test_pdfExtension_passesValidation() {
            assertValidExtensionPassesValidation("resume.pdf");
        }

        @Test
        @DisplayName("Should not reject valid DOCX extension (validation passes)")
        void test_docxExtension_passesValidation() {
            assertValidExtensionPassesValidation("resume.docx");
        }

        @Test
        @DisplayName("Should not reject valid DOC extension (validation passes)")
        void test_docExtension_passesValidation() {
            assertValidExtensionPassesValidation("resume.doc");
        }

        @Test
        @DisplayName("Should not reject valid RTF extension (validation passes)")
        void test_rtfExtension_passesValidation() {
            assertValidExtensionPassesValidation("resume.rtf");
        }

        @Test
        @DisplayName("Should not reject valid TXT extension (validation passes)")
        void test_txtExtension_passesValidation() {
            assertValidExtensionPassesValidation("resume.txt");
        }

        @Test
        @DisplayName("Should not reject valid ODT extension (validation passes)")
        void test_odtExtension_passesValidation() {
            assertValidExtensionPassesValidation("resume.odt");
        }

        private void assertValidExtensionPassesValidation(String filename) {
            String base64Content = createValidBase64Content();
            UUID candidateId = UUID.randomUUID();

            try {
                ResumeStorageService.ResumeStorageResult result = resumeStorageService.storeResume(
                        base64Content,
                        filename,
                        candidateId,
                        "APP-12345"
                );
                // If we got a result, validation passed - check it's not a validation error
                assertThat(result.message()).doesNotContain("Invalid file type");
            } catch (Exception e) {
                // If an exception was thrown, it means validation passed (no early return)
                // and the error is from the HTTP call attempt (expected without mock)
                assertThat(e.getMessage()).doesNotContain("Invalid file type");
            }
        }
    }

    @Nested
    @DisplayName("Download URL Tests")
    class DownloadUrlTests {

        @Test
        @DisplayName("Should return empty for null document ID")
        void test_getDownloadUrl_nullId_returnsEmpty() {
            var result = resumeStorageService.getResumeDownloadUrl(null);

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("Storage Result Record Tests")
    class StorageResultTests {

        @Test
        @DisplayName("Should create success result correctly")
        void test_successResult_hasCorrectValues() {
            UUID documentId = UUID.randomUUID();
            ResumeStorageService.ResumeStorageResult result = ResumeStorageService.ResumeStorageResult.success(
                    documentId,
                    "DOC-REF-123",
                    "/path/to/file",
                    "resume.pdf",
                    1024
            );

            assertThat(result.success()).isTrue();
            assertThat(result.documentId()).isEqualTo(documentId);
            assertThat(result.documentReference()).isEqualTo("DOC-REF-123");
            assertThat(result.storagePath()).isEqualTo("/path/to/file");
            assertThat(result.fileName()).isEqualTo("resume.pdf");
            assertThat(result.fileSize()).isEqualTo(1024);
            assertThat(result.pendingUpload()).isFalse();
            assertThat(result.message()).contains("successfully");
        }

        @Test
        @DisplayName("Should create failure result correctly")
        void test_failureResult_hasCorrectValues() {
            ResumeStorageService.ResumeStorageResult result = ResumeStorageService.ResumeStorageResult.failure(
                    "Test error message"
            );

            assertThat(result.success()).isFalse();
            assertThat(result.documentId()).isNull();
            assertThat(result.documentReference()).isNull();
            assertThat(result.storagePath()).isNull();
            assertThat(result.fileName()).isNull();
            assertThat(result.fileSize()).isEqualTo(0);
            assertThat(result.pendingUpload()).isFalse();
            assertThat(result.message()).isEqualTo("Test error message");
        }
    }

    private String createValidBase64Content() {
        byte[] content = "Test resume content for unit testing".getBytes();
        return Base64.getEncoder().encodeToString(content);
    }
}
