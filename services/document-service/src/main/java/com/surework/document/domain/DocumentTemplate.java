package com.surework.document.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Represents a document template.
 * Used for generating standardized documents (contracts, letters, etc.).
 */
@Entity
@Table(name = "document_templates", indexes = {
        @Index(name = "idx_document_templates_type", columnList = "template_type"),
        @Index(name = "idx_document_templates_category", columnList = "category")
})
@Getter
@Setter
@NoArgsConstructor
public class DocumentTemplate extends BaseEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "code", nullable = false, unique = true)
    private String code;

    @Column(name = "description")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "template_type", nullable = false)
    private TemplateType templateType;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private Document.DocumentCategory category;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "storage_path")
    private String storagePath;

    @Column(name = "content_type")
    private String contentType;

    @Column(name = "file_size")
    private long fileSize;

    // Template content (for HTML/text templates)
    @Column(name = "template_content", columnDefinition = "TEXT")
    private String templateContent;

    // Variables that can be substituted
    @Column(name = "variables", columnDefinition = "TEXT")
    private String variables; // JSON array of variable definitions

    @Column(name = "template_version")
    private int templateVersion = 1;

    @Column(name = "is_active")
    private boolean active = true;

    @Column(name = "is_default")
    private boolean defaultTemplate = false;

    // Compliance
    @Column(name = "is_compliant")
    private boolean compliant = true;

    @Column(name = "compliance_notes")
    private String complianceNotes;

    @Column(name = "last_reviewed_at")
    private Instant lastReviewedAt;

    @Column(name = "last_reviewed_by")
    private UUID lastReviewedBy;

    // Creator info
    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_by_name")
    private String createdByName;

    /**
     * Template types.
     */
    public enum TemplateType {
        // Employment
        EMPLOYMENT_CONTRACT_PERMANENT,
        EMPLOYMENT_CONTRACT_FIXED_TERM,
        EMPLOYMENT_CONTRACT_PART_TIME,
        OFFER_LETTER,
        APPOINTMENT_LETTER,
        PROBATION_CONFIRMATION,
        TERMINATION_LETTER,
        RESIGNATION_ACCEPTANCE,

        // HR
        WARNING_LETTER_VERBAL,
        WARNING_LETTER_WRITTEN,
        WARNING_LETTER_FINAL,
        DISMISSAL_LETTER,
        PERFORMANCE_REVIEW_FORM,
        LEAVE_APPLICATION,
        LEAVE_APPROVAL,
        LEAVE_REJECTION,

        // Payroll
        PAYSLIP,
        SALARY_INCREASE_LETTER,
        BONUS_LETTER,
        IRP5_COVER,

        // Statutory
        UIF_DECLARATION,
        TAX_DIRECTIVE_REQUEST,

        // Other
        GENERAL_LETTER,
        MEMO,
        CERTIFICATE,
        CUSTOM
    }

    /**
     * Create a new template.
     */
    public static DocumentTemplate create(String name, String code, TemplateType type,
                                           Document.DocumentCategory category, UUID createdBy) {
        DocumentTemplate template = new DocumentTemplate();
        template.setName(name);
        template.setCode(code);
        template.setTemplateType(type);
        template.setCategory(category);
        template.setCreatedBy(createdBy);
        template.setActive(true);
        template.setTemplateVersion(1);
        return template;
    }

    /**
     * Update template version.
     */
    public void updateTemplateVersion() {
        this.templateVersion++;
    }

    /**
     * Mark as reviewed.
     */
    public void markAsReviewed(UUID reviewerId) {
        this.lastReviewedAt = Instant.now();
        this.lastReviewedBy = reviewerId;
    }

    /**
     * Set as default template for this type.
     */
    public void setAsDefault() {
        this.defaultTemplate = true;
    }

    /**
     * Deactivate template.
     */
    public void deactivate() {
        this.active = false;
    }
}
