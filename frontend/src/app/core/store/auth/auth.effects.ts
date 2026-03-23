import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, merge } from 'rxjs';
import { map, exhaustMap, catchError, tap, mergeMap } from 'rxjs/operators';
import { AuthService } from '@core/services/auth.service';
import {
  login,
  loginSuccess,
  loginFailure,
  mfaRequired,
  verifyMfa,
  verifyMfaSuccess,
  verifyMfaFailure,
  loadCurrentUser,
  loadCurrentUserSuccess,
  loadCurrentUserFailure,
  logout,
  logoutSuccess,
  checkSession,
  sessionExpired,
  loginRateLimited,
  accountLocked,
  clearRateLimit
} from './auth.actions';

@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(login),
      exhaustMap(({ request }) =>
        this.authService.login(request).pipe(
          mergeMap(response => {
            // Check if login failed (accessToken is null but we got a response)
            // This happens when credentials are invalid - backend returns 200 with null tokens
            if (!response.accessToken && !response.mfaRequired) {
              // Handle remaining attempts from response body
              if (response.remainingAttempts !== undefined && response.remainingAttempts !== null) {
                if (response.remainingAttempts === 0) {
                  // Account is locked - 30 minute lockout
                  const lockoutEndTime = Date.now() + (30 * 60 * 1000);
                  return of(accountLocked({ lockoutEndTime }));
                }
                return merge(
                  of(loginFailure({ error: 'Invalid credentials' })),
                  of(loginRateLimited({ remainingAttempts: response.remainingAttempts }))
                );
              }
              return of(loginFailure({ error: 'Invalid credentials' }));
            }

            if (response.mfaRequired) {
              return of(mfaRequired({ challengeToken: response.mfaChallengeToken! }));
            }
            return of(loginSuccess({ response }));
          }),
          catchError(error => {
            // Handle rate limiting (429 Too Many Requests)
            if (error.status === 429) {
              const retryAfter = error.headers?.get('Retry-After');
              const remainingAttempts = error.headers?.get('X-RateLimit-Remaining');

              if (retryAfter) {
                // Account is locked
                const lockoutEndTime = Date.now() + (parseInt(retryAfter, 10) * 1000);
                return of(accountLocked({ lockoutEndTime }));
              } else if (remainingAttempts !== null) {
                return of(loginRateLimited({ remainingAttempts: parseInt(remainingAttempts, 10) }));
              }
            }

            // Extract remaining attempts from response if available
            const remaining = error.error?.remainingAttempts;
            if (remaining !== undefined && remaining <= 3) {
              return merge(
                of(loginFailure({ error: error.error?.detail || 'Login failed' })),
                of(loginRateLimited({ remainingAttempts: remaining }))
              );
            }

            return of(loginFailure({ error: error.error?.detail || error.error?.message || 'Login failed' }));
          })
        )
      )
    )
  );

  loginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loginSuccess, verifyMfaSuccess),
      map(action => {
        // Extract user from login response instead of making separate API call
        const user = action.response.user;
        if (user) {
          // Extract unique permission codes from all roles
          const permissions = [...new Set(
            (user.roles as Array<{ code: string; permissions?: { code: string }[] }>).flatMap(
              r => r.permissions?.map(p => p.code) ?? []
            )
          )];
          return loadCurrentUserSuccess({
            user: {
              userId: user.id,
              employeeId: user.employeeId ?? null,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              fullName: `${user.firstName} ${user.lastName}`,
              roles: user.roles.map((r: { code: string }) => r.code),
              permissions,
              mfaEnabled: user.mfaEnabled ?? false,
              mustChangePassword: (user as any).mustChangePassword ?? false
            }
          });
        }
        return loadCurrentUser();
      })
    )
  );

  verifyMfa$ = createEffect(() =>
    this.actions$.pipe(
      ofType(verifyMfa),
      exhaustMap(({ request }) =>
        this.authService.verifyMfa(request).pipe(
          map(response => verifyMfaSuccess({ response })),
          catchError(error => of(verifyMfaFailure({ error: error.error?.detail || 'MFA verification failed' })))
        )
      )
    )
  );

  loadCurrentUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCurrentUser),
      exhaustMap(() =>
        this.authService.getCurrentUser().pipe(
          map(user => loadCurrentUserSuccess({ user })),
          catchError(error => of(loadCurrentUserFailure({ error: error.message })))
        )
      )
    )
  );

  loadCurrentUserSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCurrentUserSuccess),
      tap((action) => {
        // Only navigate if on login page (not when session is being restored)
        const currentPath = window.location.pathname;
        if (currentPath.includes('/auth/')) {
          // Check if user must change password (invited users on first login)
          if (action.user?.mustChangePassword) {
            this.router.navigate(['/settings/security'], {
              queryParams: { changePassword: true }
            });
            return;
          }

          let returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
          // Strip base href prefix if present (e.g. /main/dashboard -> /dashboard)
          const baseHref = document.querySelector('base')?.getAttribute('href') || '/';
          if (returnUrl && baseHref !== '/' && returnUrl.startsWith(baseHref)) {
            returnUrl = returnUrl.substring(baseHref.length - 1);
          }
          this.router.navigateByUrl(returnUrl || '/dashboard');
        }
      })
    ),
    { dispatch: false }
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logout),
      exhaustMap(() =>
        this.authService.logout().pipe(
          map(() => logoutSuccess()),
          catchError(() => {
            // Even if logout fails on server, clear local state
            this.authService.clearTokens();
            return of(logoutSuccess());
          })
        )
      )
    )
  );

  logoutSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logoutSuccess, sessionExpired),
      tap(() => this.router.navigate(['/auth/login']))
    ),
    { dispatch: false }
  );

  checkSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(checkSession),
      map(() => {
        if (this.authService.isAuthenticated()) {
          return loadCurrentUser();
        }
        return sessionExpired();
      })
    )
  );

  clearRateLimitOnSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loginSuccess),
      map(() => clearRateLimit())
    )
  );
}
