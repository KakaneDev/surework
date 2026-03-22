package com.surework.notification.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for resolving notification recipients.
 * Translates employee IDs and other entity IDs to user IDs
 * for notification routing.
 */
public interface RecipientResolver {

    /**
     * Get the user ID for an employee.
     *
     * @param employeeId the employee ID
     * @return the user ID if found
     */
    Optional<UUID> getEmployeeUserId(UUID employeeId);

    /**
     * Get the manager's user ID for an employee.
     *
     * @param employeeId the employee ID
     * @return the manager's user ID if found
     */
    Optional<UUID> getManagerUserId(UUID employeeId);

    /**
     * Get the hiring manager's user ID for a job posting.
     *
     * @param jobPostingId the job posting ID
     * @return the hiring manager's user ID if found
     */
    Optional<UUID> getHiringManagerUserId(UUID jobPostingId);

    /**
     * Get user IDs for portal administrators.
     * These are users with SUPER_ADMIN or PORTAL_ADMIN role.
     *
     * @return list of admin user IDs
     */
    List<UUID> getPortalAdminUserIds();

    /**
     * Get user IDs for recruitment team members for a tenant.
     *
     * @param tenantId the tenant ID
     * @return list of recruitment team user IDs
     */
    List<UUID> getRecruitmentTeamUserIds(UUID tenantId);
}
