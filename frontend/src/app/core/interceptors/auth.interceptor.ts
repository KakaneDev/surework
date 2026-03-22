import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '@core/services/auth.service';

/**
 * HTTP interceptor that adds JWT token to requests and handles token refresh.
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip auth for login/register endpoints
  if (req.url.includes('/auth/login') ||
      req.url.includes('/auth/register') ||
      req.url.includes('/auth/refresh')) {
    return next(req);
  }

  const token = authService.getAccessToken();

  if (token) {
    req = addTokenToRequest(req, token);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && authService.getRefreshToken()) {
        // Try to refresh token
        return authService.refreshToken().pipe(
          switchMap(response => {
            if (response.accessToken) {
              return next(addTokenToRequest(req, response.accessToken));
            }
            authService.clearTokens();
            router.navigate(['/auth/login']);
            return throwError(() => error);
          }),
          catchError(refreshError => {
            authService.clearTokens();
            router.navigate(['/auth/login']);
            return throwError(() => refreshError);
          })
        );
      }

      if (error.status === 401) {
        authService.clearTokens();
        router.navigate(['/auth/login']);
      }

      return throwError(() => error);
    })
  );
};

function addTokenToRequest(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}
