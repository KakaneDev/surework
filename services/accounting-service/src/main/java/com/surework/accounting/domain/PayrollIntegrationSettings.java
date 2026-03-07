package com.surework.accounting.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Tenant-specific settings for payroll accounting integration.
 */
@Entity
@Table(name = "payroll_integration_settings")
@Getter
@Setter
@NoArgsConstructor
public class PayrollIntegrationSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", unique = true)
    private UUID tenantId;

    /**
     * Whether automatic journal entry creation is enabled.
     */
    @Column(name = "auto_journal_enabled", nullable = false)
    private boolean autoJournalEnabled = true;

    /**
     * Whether to create journal entries when payroll is approved (vs. when paid).
     */
    @Column(name = "journal_on_approval", nullable = false)
    private boolean journalOnApproval = true;

    /**
     * Whether to create a separate journal entry when payroll is actually paid.
     */
    @Column(name = "create_payment_entry", nullable = false)
    private boolean createPaymentEntry = false;

    /**
     * Default expense account if no mapping exists.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_expense_account_id")
    private Account defaultExpenseAccount;

    /**
     * Default liability account if no mapping exists.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_liability_account_id")
    private Account defaultLiabilityAccount;

    /**
     * Default bank account for salary payments.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_bank_account_id")
    private Account defaultBankAccount;

    /**
     * Template for journal entry descriptions.
     * Placeholders: {period}, {runNumber}, {year}, {month}, {employeeCount}
     */
    @Column(name = "journal_description_template", length = 500)
    private String journalDescriptionTemplate = "Payroll for {period} - {runNumber}";

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "updated_by")
    private UUID updatedBy;

    @Version
    @Column(name = "version")
    private Long version;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    /**
     * Create default settings for a tenant.
     */
    public static PayrollIntegrationSettings createDefault(UUID tenantId) {
        PayrollIntegrationSettings settings = new PayrollIntegrationSettings();
        settings.setTenantId(tenantId);
        settings.setAutoJournalEnabled(true);
        settings.setJournalOnApproval(true);
        settings.setCreatePaymentEntry(false);
        settings.setJournalDescriptionTemplate("Payroll for {period} - {runNumber}");
        return settings;
    }

    /**
     * Format the journal description using the template.
     */
    public String formatJournalDescription(int year, int month, String runNumber, int employeeCount) {
        String period = String.format("%d-%02d", year, month);
        return journalDescriptionTemplate
                .replace("{period}", period)
                .replace("{runNumber}", runNumber)
                .replace("{year}", String.valueOf(year))
                .replace("{month}", String.format("%02d", month))
                .replace("{employeeCount}", String.valueOf(employeeCount));
    }
}
