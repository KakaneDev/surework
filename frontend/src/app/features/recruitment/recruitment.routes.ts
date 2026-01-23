import { Routes } from '@angular/router';

export const RECRUITMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./recruitment-dashboard/recruitment-dashboard.component').then(m => m.RecruitmentDashboardComponent)
  },
  {
    path: 'jobs',
    loadComponent: () => import('./job-postings-list/job-postings-list.component').then(m => m.JobPostingsListComponent)
  },
  {
    path: 'jobs/new',
    loadComponent: () => import('./job-posting-form/job-posting-form.component').then(m => m.JobPostingFormComponent)
  },
  {
    path: 'jobs/:id',
    loadComponent: () => import('./job-posting-detail/job-posting-detail.component').then(m => m.JobPostingDetailComponent)
  },
  {
    path: 'jobs/:id/edit',
    loadComponent: () => import('./job-posting-form/job-posting-form.component').then(m => m.JobPostingFormComponent)
  },
  {
    path: 'candidates',
    loadComponent: () => import('./candidates-list/candidates-list.component').then(m => m.CandidatesListComponent)
  },
  {
    path: 'candidates/new',
    loadComponent: () => import('./candidate-form/candidate-form.component').then(m => m.CandidateFormComponent)
  },
  {
    path: 'candidates/:id',
    loadComponent: () => import('./candidate-detail/candidate-detail.component').then(m => m.CandidateDetailComponent)
  },
  {
    path: 'candidates/:id/edit',
    loadComponent: () => import('./candidate-form/candidate-form.component').then(m => m.CandidateFormComponent)
  }
];
