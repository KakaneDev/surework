import { Routes } from '@angular/router';
import { leaveApprovalGuard } from '@core/guards/leave-approval.guard';

export const LEAVE_ROUTES: Routes = [
  // Self-service: Employee's own leave dashboard
  {
    path: '',
    loadComponent: () => import('./leave-dashboard/leave-dashboard.component').then(m => m.LeaveDashboardComponent)
  },
  // Admin routes: For managers/admins to manage all leave
  {
    path: 'admin',
    loadComponent: () => import('./leave-list/leave-list.component').then(m => m.LeaveListComponent),
    canActivate: [leaveApprovalGuard]
  },
  {
    path: 'admin/pending',
    loadComponent: () => import('./pending-approvals/pending-approvals.component').then(m => m.PendingApprovalsComponent),
    canActivate: [leaveApprovalGuard]
  },
  // Legacy routes for backwards compatibility
  {
    path: 'pending',
    redirectTo: 'admin/pending',
    pathMatch: 'full'
  },
  {
    path: 'employees',
    redirectTo: 'admin',
    pathMatch: 'full'
  }
];
