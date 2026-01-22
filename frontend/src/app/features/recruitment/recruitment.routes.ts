import { Routes } from '@angular/router';

export const RECRUITMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./recruitment-dashboard/recruitment-dashboard.component').then(m => m.RecruitmentDashboardComponent)
  }
];
