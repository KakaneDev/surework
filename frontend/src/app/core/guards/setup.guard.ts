import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard factory that blocks access until the tenant's company details are complete.
 * Redirects to /setup-required?gate=COMPANY_DETAILS when the gate is not satisfied.
 *
 * @example
 * // In routes:
 * {
 *   path: 'finance',
 *   canActivate: [companyDetailsGuard()],
 *   loadChildren: () => import('./features/finance/finance.routes')...
 * }
 */
export function companyDetailsGuard(): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.tenantSetupStatus().companyDetailsComplete) return true;
    return router.createUrlTree(['/setup-required'], {
      queryParams: { gate: 'COMPANY_DETAILS' }
    });
  };
}

/**
 * Guard factory that blocks access until the tenant's SARS compliance details are complete.
 * Redirects to /setup-required?gate=COMPLIANCE when the gate is not satisfied.
 *
 * @example
 * // In routes:
 * {
 *   path: 'payroll',
 *   canActivate: [complianceGuard()],
 *   loadChildren: () => import('./features/payroll/payroll.routes')...
 * }
 */
export function complianceGuard(): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.tenantSetupStatus().complianceDetailsComplete) return true;
    return router.createUrlTree(['/setup-required'], {
      queryParams: { gate: 'COMPLIANCE' }
    });
  };
}
