import { Routes } from '@angular/router';

export const FINANCE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./finance-dashboard/finance-dashboard.component').then(m => m.FinanceDashboardComponent)
  },
  {
    path: 'reports',
    loadComponent: () => import('./finance-reports/finance-reports.component').then(m => m.FinanceReportsComponent)
  }
];
