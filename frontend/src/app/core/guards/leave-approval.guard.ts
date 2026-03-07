import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { selectCanApproveLeave, selectIsAuthenticated } from '@core/store/auth/auth.selectors';
import { combineLatest } from 'rxjs';

/**
 * Guard that protects routes requiring leave approval permissions.
 * Allows access only for users with HR, Admin, or Manager roles.
 */
export const leaveApprovalGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return combineLatest([
    store.select(selectIsAuthenticated),
    store.select(selectCanApproveLeave)
  ]).pipe(
    take(1),
    map(([isAuthenticated, canApproveLeave]) => {
      if (!isAuthenticated) {
        const returnUrl = window.location.pathname;
        router.navigate(['/auth/login'], { queryParams: { returnUrl } });
        return false;
      }

      if (!canApproveLeave) {
        router.navigate(['/leave']);
        return false;
      }

      return true;
    })
  );
};
