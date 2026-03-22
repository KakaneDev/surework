import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectCurrentUser = createSelector(
  selectAuthState,
  (state) => state.user
);

export const selectIsAuthenticated = createSelector(
  selectCurrentUser,
  (user) => !!user
);

export const selectAuthLoading = createSelector(
  selectAuthState,
  (state) => state.loading
);

export const selectAuthError = createSelector(
  selectAuthState,
  (state) => state.error
);

export const selectMfaRequired = createSelector(
  selectAuthState,
  (state) => state.mfaRequired
);

export const selectMfaChallengeToken = createSelector(
  selectAuthState,
  (state) => state.mfaChallengeToken
);

export const selectUserRoles = createSelector(
  selectCurrentUser,
  (user) => user?.roles ?? []
);

export const selectUserPermissions = createSelector(
  selectCurrentUser,
  (user) => user?.permissions ?? []
);

export const selectHasRole = (role: string) => createSelector(
  selectUserRoles,
  (roles) => roles.includes(role)
);

export const selectHasPermission = (permission: string) => createSelector(
  selectUserPermissions,
  (permissions) => permissions.includes(permission) || permissions.includes('*')
);

/**
 * Check if user can approve leave requests (manager, HR, or admin).
 * Role check is case-insensitive and handles ROLE_ prefix.
 */
export const selectCanApproveLeave = createSelector(
  selectUserRoles,
  selectUserPermissions,
  (roles, permissions) => {
    // Match actual role codes from the database
    const approverRoles = [
      'SUPER_ADMIN',      // Full system access
      'TENANT_ADMIN',     // Full tenant access
      'HR_MANAGER',       // HR operations
      'DEPARTMENT_MANAGER', // Department management
      // Legacy/alternative names for compatibility
      'ADMIN', 'HR_ADMIN', 'MANAGER', 'DEPARTMENT_HEAD'
    ];
    const approverPermissions = ['leave:approve', 'leave:*', '*', 'LEAVE_APPROVE', 'LEAVE_MANAGE', 'ALL', 'TENANT_ALL'];

    // Normalize roles: handle both string and object formats, uppercase and strip ROLE_ prefix
    const normalizedRoles = roles
      .filter(r => r != null)
      .map(r => {
        // Handle both string roles and object roles with 'code' property
        const roleStr = typeof r === 'string' ? r : (r as any)?.code ?? '';
        return roleStr.toUpperCase().replace(/^ROLE_/, '');
      });

    return normalizedRoles.some(r => approverRoles.includes(r)) ||
           permissions.some(p => approverPermissions.includes(p));
  }
);

/**
 * Get the employee ID for the current user (used for leave API calls).
 */
export const selectCurrentEmployeeId = createSelector(
  selectCurrentUser,
  (user) => user?.employeeId ?? null
);

/**
 * Get rate limiting information (for login lockout feedback).
 */
export const selectRateLimitInfo = createSelector(
  selectAuthState,
  (state) => state.rateLimit
);
