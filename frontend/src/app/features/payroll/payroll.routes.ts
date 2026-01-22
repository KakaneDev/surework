import { Routes } from '@angular/router';

export const PAYROLL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./payroll-dashboard/payroll-dashboard.component').then(m => m.PayrollDashboardComponent)
  }
];
