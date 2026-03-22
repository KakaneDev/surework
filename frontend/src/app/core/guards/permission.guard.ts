import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, filter, take, timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { selectUserPermissions, selectCurrentUser } from '@core/store/auth/auth.selectors';

/**
 * Permission guard factory that creates a guard checking for specific permissions.
 * Waits for user data to be loaded before checking permissions.
 *
 * @param requiredPermissions - Array of permission codes. User must have at least one.
 * @returns CanActivateFn that checks user permissions
 *
 * @example
 * // In routes:
 * {
 *   path: 'payroll',
 *   canActivate: [permissionGuard(['PAYROLL_READ', 'PAYROLL_MANAGE'])],
 *   loadComponent: () => import('./payroll-dashboard.component')
 * }
 */
export const permissionGuard = (
  requiredPermissions: string[] = []
): CanActivateFn => {
  return () => {
    const store = inject(Store);
    const router = inject(Router);

    // Wait for user to be loaded (permissions come with user)
    return store.select(selectCurrentUser).pipe(
      filter(user => user !== null && user !== undefined),
      take(1),
      timeout(5000),
      map(user => {
        const permissions = user?.permissions ?? [];

        // Super admin bypasses all permission checks
        if (permissions.includes('ALL') || permissions.includes('*') || permissions.includes('TENANT_ALL')) {
          return true;
        }

        // If no permissions required, allow access
        if (requiredPermissions.length === 0) {
          return true;
        }

        // Check if user has ANY of the required permissions
        const hasPermission = requiredPermissions.some(p => permissions.includes(p));

        if (!hasPermission) {
          console.warn(`Permission guard: User lacks required permissions. Required: ${requiredPermissions.join(', ')}, Has: ${permissions.join(', ')}`);
          router.navigate(['/dashboard'], {
            queryParams: { error: 'insufficient_permissions' }
          });
          return false;
        }

        return true;
      }),
      catchError(() => {
        // On timeout, redirect to dashboard
        console.warn('Permission guard: Timeout waiting for user data');
        router.navigate(['/dashboard']);
        return of(false);
      })
    );
  };
};

/**
 * Permission guard that requires ALL specified permissions (stricter).
 * Waits for user data to be loaded before checking permissions.
 *
 * @param requiredPermissions - Array of permission codes. User must have all of them.
 * @returns CanActivateFn that checks user permissions
 */
export const permissionGuardAll = (
  requiredPermissions: string[] = []
): CanActivateFn => {
  return () => {
    const store = inject(Store);
    const router = inject(Router);

    // Wait for user to be loaded (permissions come with user)
    return store.select(selectCurrentUser).pipe(
      filter(user => user !== null && user !== undefined),
      take(1),
      timeout(5000),
      map(user => {
        const permissions = user?.permissions ?? [];

        // Super admin bypasses all permission checks
        if (permissions.includes('ALL') || permissions.includes('*') || permissions.includes('TENANT_ALL')) {
          return true;
        }

        // If no permissions required, allow access
        if (requiredPermissions.length === 0) {
          return true;
        }

        // Check if user has ALL required permissions
        const hasAllPermissions = requiredPermissions.every(p => permissions.includes(p));

        if (!hasAllPermissions) {
          console.warn(`Permission guard: User lacks required permissions. Required all: ${requiredPermissions.join(', ')}, Has: ${permissions.join(', ')}`);
          router.navigate(['/dashboard'], {
            queryParams: { error: 'insufficient_permissions' }
          });
          return false;
        }

        return true;
      }),
      catchError(() => {
        // On timeout, redirect to dashboard
        console.warn('Permission guard: Timeout waiting for user data');
        router.navigate(['/dashboard']);
        return of(false);
      })
    );
  };
};
