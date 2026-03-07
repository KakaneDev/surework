package com.surework.admin.service;

import com.surework.admin.config.JwtHeaderAuthenticationFilter.UserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Security service providing SpEL expressions for method-level security.
 * Used in @PreAuthorize annotations to check resource ownership.
 *
 * <p>Example usage in controller:
 * <pre>
 * {@code @PreAuthorize("@securityService.isCurrentUser(#userId, authentication)")}
 * public ResponseEntity<Void> updateProfile(@PathVariable UUID userId) { ... }
 * </pre>
 */
@Service("securityService")
public class SecurityService {

    /**
     * Checks if the authenticated user is the same as the target user.
     * Allows users to access/modify their own resources.
     *
     * @param targetUserId the user ID being accessed
     * @param authentication the current authentication context
     * @return true if the authenticated user matches the target user
     */
    public boolean isCurrentUser(UUID targetUserId, Authentication authentication) {
        if (targetUserId == null || authentication == null) {
            return false;
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserPrincipal userPrincipal) {
            return targetUserId.equals(userPrincipal.userId());
        }

        return false;
    }

    /**
     * Checks if the authenticated user belongs to the specified tenant.
     * Used to restrict tenant-scoped operations.
     *
     * @param targetTenantId the tenant ID being accessed
     * @param authentication the current authentication context
     * @return true if the authenticated user belongs to the tenant
     */
    public boolean belongsToTenant(UUID targetTenantId, Authentication authentication) {
        if (targetTenantId == null || authentication == null) {
            return false;
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof UserPrincipal userPrincipal) {
            return targetTenantId.equals(userPrincipal.tenantId());
        }

        return false;
    }

    /**
     * Checks if the authenticated user has a specific role.
     *
     * @param role the role to check (without ROLE_ prefix)
     * @param authentication the current authentication context
     * @return true if the user has the specified role
     */
    public boolean hasRole(String role, Authentication authentication) {
        if (role == null || authentication == null) {
            return false;
        }

        String roleWithPrefix = role.startsWith("ROLE_") ? role : "ROLE_" + role;
        return authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals(roleWithPrefix));
    }
}
