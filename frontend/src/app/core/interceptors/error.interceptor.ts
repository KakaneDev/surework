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
