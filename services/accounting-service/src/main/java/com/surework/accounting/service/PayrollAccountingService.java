package com.surework.accounting.service;

import com.surework.accounting.domain.PayrollAccountMapping;
import com.surework.accounting.dto.PayrollAccountingDto;
import com.surework.common.messaging.event.PayrollEvent;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service interface for payroll accounting integration.
 * Handles automatic journal entry creation from payroll events.
 *
 * <p>All methods are tenant-scoped to ensure proper data isolation
 * in multi-tenant deployments.
 */
public interface PayrollAccountingService {

    // === Payroll Event Processing ===

    /**
     * Process a payroll run approved event.
     * Creates journal entries for all payroll components.
     * Idempotent - will not create duplicate entries for the same payroll run.
     *
     * @param event The payroll run approved event (contains tenant ID)
     * @return The created payroll journal entry record, or existing if already processed
     */
    PayrollAccountingDto.PayrollJournalResponse processPayrollRunApproved(PayrollEvent.PayrollRunApproved event);

    /**
     * Check if a payroll run has already been journaled (tenant-scoped).
     *
     * @param tenantId The tenant ID
     * @param payrollRunId The payroll run ID
     * @return true if already journaled
     */
    boolean isPayrollRunJournaled(UUID tenantId, UUID payrollRunId);

    /**
     * Get the journal entry for a payroll run (tenant-scoped).
     *
     * @param tenantId The tenant ID
     * @param payrollRunId The payroll run ID
     * @return The payroll journal entry if exists
     */
    Optional<PayrollAccountingDto.PayrollJournalResponse> getPayrollJournal(UUID tenantId, UUID payrollRunId);

    /**
     * Get recent payroll journal entries (tenant-scoped).
     *
     * @param tenantId The tenant ID
     * @param limit Maximum number of entries to return
     * @return List of recent payroll journal entries
     */
    List<PayrollAccountingDto.PayrollJournalResponse> getRecentPayrollJournals(UUID tenantId, int limit);

    /**
     * Get payroll journal entries for a year (tenant-scoped).
     *
     * @param tenantId The tenant ID
     * @param year The fiscal year
     * @return List of payroll journal entries for the year
     */
    List<PayrollAccountingDto.PayrollJournalResponse> getPayrollJournalsForYear(UUID tenantId, int year);

    // === Account Mappings ===

    /**
     * Get all account mappings (tenant-scoped).
     *
     * @param tenantId The tenant ID
     * @return List of all account mappings
     */
    List<PayrollAccountingDto.AccountMappingResponse> getAllMappings(UUID tenantId);

    /**
     * Get default account mappings (tenant-scoped).
     *
     * @param tenantId The tenant ID
     * @return List of default account mappings
     */
    List<PayrollAccountingDto.AccountMappingResponse> getDefaultMappings(UUID tenantId);

    /**
     * Get mappings by type (tenant-scoped).
     *
     * @param tenantId The tenant ID
     * @param type The mapping type
     * @return List of mappings for the type
     */
    List<PayrollAccountingDto.AccountMappingResponse> getMappingsByType(UUID tenantId, PayrollAccountMapping.MappingType type);

    /**
     * Create a new account mapping (tenant-scoped).
     *
     * @param tenantId The tenant ID
     * @param request The create request
     * @return The created mapping
     */
    PayrollAccountingDto.AccountMappingResponse createMapping(UUID tenantId, PayrollAccountingDto.CreateAccountMappingRequest request);

    /**
     * Update an account mapping (tenant-scoped).
     *
     * @param tenantId The tenant ID
     * @param mappingId The mapping ID
     * @param request The update request
     * @return The updated mapping
     */
    PayrollAccountingDto.AccountMappingResponse updateMapping(UUID tenantId, UUID mappingId, PayrollAccountingDto.UpdateAccountMappingRequest request);

    /**
     * Delete an account mapping (tenant-scoped).
     *
     * @param tenantId The tenant ID
     * @param mappingId The mapping ID
     */
    void deleteMapping(UUID tenantId, UUID mappingId);

    // === Integration Settings ===

    /**
     * Get integration settings for a tenant.
     * Creates default settings if none exist.
     *
     * @param tenantId The tenant ID
     * @return The integration settings
     */
    PayrollAccountingDto.IntegrationSettingsResponse getSettings(UUID tenantId);

    /**
     * Update integration settings.
     *
     * @param tenantId The tenant ID
     * @param request The update request
     * @return The updated settings
     */
    PayrollAccountingDto.IntegrationSettingsResponse updateSettings(UUID tenantId, PayrollAccountingDto.UpdateIntegrationSettingsRequest request);

    /**
     * Check if auto-journaling is enabled.
     *
     * @param tenantId The tenant ID
     * @return true if auto-journaling is enabled
     */
    boolean isAutoJournalEnabled(UUID tenantId);

    // === Dashboard ===

    /**
     * Get payroll accounting dashboard (tenant-scoped).
     *
     * @param tenantId The tenant ID
     * @return Dashboard summary
     */
    PayrollAccountingDto.PayrollAccountingDashboard getDashboard(UUID tenantId);

    /**
     * Get year summary (tenant-scoped).
     *
     * @param tenantId The tenant ID
     * @param year The fiscal year
     * @return Year summary
     */
    PayrollAccountingDto.PayrollYearSummary getYearSummary(UUID tenantId, int year);
}
