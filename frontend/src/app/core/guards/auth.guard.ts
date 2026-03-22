import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, take, timeout, catchError, map, first, switchMap } from 'rxjs/operators';
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

  // Only dispatch checkSession if user is not already loaded (prevents infinite loop)
  return store.select(selectCurrentUser).pipe(
    first(),
    switchMap(user => {
      if (user) {
        return of(true);
      }
      store.dispatch(checkSession());
      return store.select(selectCurrentUser).pipe(
        filter(u => u !== null && u !== undefined),
        take(1),
        timeout(5000),
        map(() => true),
        catchError(() => {
          console.warn('Auth guard: Timeout waiting for user data');
          return of(true);
        })
      );
    })
  );
};
