import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, take, timeout, catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { selectCurrentUser } from '@core/store/auth/auth.selectors';
import { checkSession } from '@core/store/auth/auth.actions';

/**
 * Auth guard that protects routes requiring authentication.
 * Also ensures user data is loaded into the store.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const store = inject(Store);

  if (!authService.isAuthenticated()) {
    // Store the attempted URL for redirecting after login
    const returnUrl = window.location.pathname;
    router.navigate(['/auth/login'], { queryParams: { returnUrl } });
    return false;
  }

  // Dispatch checkSession to ensure user data is loaded
  store.dispatch(checkSession());

  // Wait for user data to be loaded (with 5s timeout)
  return store.select(selectCurrentUser).pipe(
    filter(user => user !== null && user !== undefined),
    take(1),
    timeout(5000),
    map(() => true),
    catchError(() => {
      // On timeout, still allow navigation - component handles loading state
      console.warn('Auth guard: Timeout waiting for user data');
      return of(true);
    })
  );
};
