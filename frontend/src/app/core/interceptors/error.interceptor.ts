import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

/**
 * HTTP interceptor for global error handling.
 * Displays error messages using Material Snackbar.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Silently handle certain errors that are expected or handled elsewhere:
      // - Notification service errors (service may not be running)
      // - Auth API errors (handled by login form)
      // - Dashboard API 403 errors (user may not have permissions for all dashboard data)
      // - Admin API 403 errors for non-admin users viewing dashboard
      if (req.url.includes('/api/notifications') ||
          req.url.includes('/ws/notifications') ||
          req.url.includes('/api/admin/auth')) {
        return throwError(() => error);
      }

      // Silently handle 403 errors for dashboard aggregation endpoints
      // and admin/HR pages where permission-based access is expected
      // Components handle these errors with their own UI (empty states, access denied)
      if (error.status === 403 && (
          req.url.includes('/api/admin/dashboard') ||
          req.url.includes('/api/recruitment/dashboard') ||
          req.url.includes('/api/v1/leave/pending') ||
          req.url.includes('/api/v1/leave/employees') ||
          req.url.includes('/api/recruitment/pipeline') ||
          req.url.includes('/api/recruitment/interviews/upcoming') ||
          req.url.includes('/api/v1/leave/on-leave-today') ||
          req.url.includes('/api/v1/employees') ||
          req.url.includes('/api/payroll')
      )) {
        return throwError(() => error);
      }

      let message = 'An unexpected error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        message = error.error.message;
      } else {
        // Server-side error
        switch (error.status) {
          case 0:
            message = 'Unable to connect to server. Please check your internet connection.';
            break;
          case 400:
            message = error.error?.detail || 'Invalid request. Please check your input.';
            break;
          case 401:
            // Handled by auth interceptor
            return throwError(() => error);
          case 403:
            message = 'You do not have permission to perform this action.';
            break;
          case 404:
            message = error.error?.detail || 'The requested resource was not found.';
            break;
          case 409:
            message = error.error?.detail || 'This resource already exists.';
            break;
          case 422:
            // Validation errors - get specific field errors
            if (error.error?.errors) {
              const errors = Object.values(error.error.errors).flat();
              message = errors.join('. ');
            } else {
              message = error.error?.detail || 'Validation failed. Please check your input.';
            }
            break;
          case 429:
            message = 'Too many requests. Please wait a moment and try again.';
            break;
          case 500:
            message = 'Server error. Please try again later.';
            break;
          case 503:
            message = 'Service temporarily unavailable. Please try again later.';
            break;
          default:
            message = error.error?.detail || `Error: ${error.statusText}`;
        }
      }

      // Don't show snackbar for 401 (handled by auth interceptor)
      if (error.status !== 401) {
        snackBar.open(message, 'Dismiss', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: error.status >= 500 ? 'snackbar-error' : 'snackbar-warning'
        });
      }

      return throwError(() => error);
    })
  );
};
