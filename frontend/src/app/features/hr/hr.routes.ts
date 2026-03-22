import { Routes } from '@angular/router';

export const HR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./hr-dashboard/hr-dashboard.component').then(m => m.HrDashboardComponent)
  },
  {
    path: 'organogram',
    loadComponent: () => import('./organogram/organogram.component').then(m => m.OrganogramComponent)
  }
];
