import { Routes } from '@angular/router';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./reports-dashboard/reports-dashboard.component').then(m => m.ReportsDashboardComponent)
  },
  {
    path: 'hr',
    loadComponent: () => import('./hr-reports/hr-reports.component').then(m => m.HrReportsComponent)
  },
  {
    path: 'financial',
    loadComponent: () => import('./financial-reports/financial-reports.component').then(m => m.FinancialReportsComponent)
  },
  {
    path: 'recruitment',
    loadComponent: () => import('./recruitment-reports/recruitment-reports.component').then(m => m.RecruitmentReportsComponent)
  }
];
