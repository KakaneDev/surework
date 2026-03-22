import { Routes } from '@angular/router';
import { permissionGuard } from '@core/guards/permission.guard';

export const SUPPORT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./support-dashboard/support-dashboard.component').then(m => m.SupportDashboardComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./ticket-create/ticket-create.component').then(m => m.TicketCreateComponent)
  },
  {
    path: 'admin',
    canActivate: [permissionGuard(['SUPPORT_ADMIN', 'SUPER_ADMIN'])],
    loadComponent: () => import('./support-admin/support-admin.component').then(m => m.SupportAdminComponent)
  },
  {
    path: 'admin/tickets/:id',
    canActivate: [permissionGuard(['SUPPORT_ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN'])],
    loadComponent: () => import('./admin-ticket-detail/admin-ticket-detail.component').then(m => m.AdminTicketDetailComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./ticket-detail/ticket-detail.component').then(m => m.TicketDetailComponent)
  }
];
