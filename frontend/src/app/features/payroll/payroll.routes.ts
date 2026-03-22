import { Routes } from '@angular/router';

export const PAYROLL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./payroll-dashboard/payroll-dashboard.component').then(m => m.PayrollDashboardComponent)
  },
  {
    path: 'runs',
    loadComponent: () => import('./payroll-run-list/payroll-run-list.component').then(m => m.PayrollRunListComponent)
  },
  {
    path: 'runs/:id',
    loadComponent: () => import('./payroll-run-detail/payroll-run-detail.component').then(m => m.PayrollRunDetailComponent)
  }
];
