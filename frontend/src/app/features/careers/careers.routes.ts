import { Routes } from '@angular/router';

/**
 * Public careers page routes.
 * These routes do not require authentication.
 */
export const CAREERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./careers-list/careers-list.component').then(m => m.CareersListComponent)
  },
  {
    path: 'jobs/:jobRef',
    loadComponent: () => import('./job-detail/job-detail.component').then(m => m.JobDetailComponent)
  },
  {
    path: 'offer/:token',
    loadComponent: () => import('./offer-response/offer-response.component').then(m => m.OfferResponseComponent)
  }
];
