import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, exhaustMap, catchError, tap } from 'rxjs/operators';
import { AuthService } from '@core/services/auth.service';
import * as AuthActions from './auth.actions';

@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ request }) =>
        this.authService.login(request).pipe(
          map(response => {
            if (response.mfaRequired) {
              return AuthActions.mfaRequired({ challengeToken: response.mfaChallengeToken! });
            }
            return AuthActions.loginSuccess({ response });
          }),
          catchError(error => of(AuthActions.loginFailure({ error: error.error?.detail || 'Login failed' })))
        )
      )
    )
  );

  loginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess, AuthActions.verifyMfaSuccess),
      map(action => {
        // Extract user from login response instead of making separate API call
        const user = action.response.user;
        if (user) {
          return AuthActions.loadCurrentUserSuccess({
            user: {
              userId: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              fullName: `${user.firstName} ${user.lastName}`,
              roles: user.roles.map((r: { code: string }) => r.code),
              permissions: [],
              mfaEnabled: false
            }
          });
        }
        return AuthActions.loadCurrentUser();
      })
    )
  );

  verifyMfa$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.verifyMfa),
      exhaustMap(({ request }) =>
        this.authService.verifyMfa(request).pipe(
          map(response => AuthActions.verifyMfaSuccess({ response })),
          catchError(error => of(AuthActions.verifyMfaFailure({ error: error.error?.detail || 'MFA verification failed' })))
        )
      )
    )
  );

  loadCurrentUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadCurrentUser),
      exhaustMap(() =>
        this.authService.getCurrentUser().pipe(
          map(user => AuthActions.loadCurrentUserSuccess({ user })),
          catchError(error => of(AuthActions.loadCurrentUserFailure({ error: error.message })))
        )
      )
    )
  );

  loadCurrentUserSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadCurrentUserSuccess),
      tap(() => {
        // Navigate to dashboard or return URL after successful login
        const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
        this.router.navigateByUrl(returnUrl || '/dashboard');
      })
    ),
    { dispatch: false }
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      exhaustMap(() =>
        this.authService.logout().pipe(
          map(() => AuthActions.logoutSuccess()),
          catchError(() => {
            // Even if logout fails on server, clear local state
            this.authService.clearTokens();
            return of(AuthActions.logoutSuccess());
          })
        )
      )
    )
  );

  logoutSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logoutSuccess, AuthActions.sessionExpired),
      tap(() => this.router.navigate(['/auth/login']))
    ),
    { dispatch: false }
  );

  checkSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.checkSession),
      map(() => {
        if (this.authService.isAuthenticated()) {
          return AuthActions.loadCurrentUser();
        }
        return AuthActions.sessionExpired();
      })
    )
  );
}
