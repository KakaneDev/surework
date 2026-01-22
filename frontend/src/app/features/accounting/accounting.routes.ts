import { Routes } from '@angular/router';

export const ACCOUNTING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./accounting-dashboard/accounting-dashboard.component').then(m => m.AccountingDashboardComponent)
  }
];
