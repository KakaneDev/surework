import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { permissionGuard } from '@core/guards/permission.guard';
import { companyDetailsGuard, complianceGuard } from './core/guards/setup.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'signup',
    loadChildren: () => import('./features/onboarding/onboarding.routes').then(m => m.onboardingRoutes)
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard-content.component').then(m => m.DashboardContentComponent),
        data: { preload: true }
      },
      {
        path: 'employees',
        canActivate: [permissionGuard(['EMPLOYEE_READ', 'EMPLOYEE_MANAGE'])],
        loadChildren: () => import('./features/employees/employees.routes').then(m => m.EMPLOYEES_ROUTES),
        data: { preload: true }
      },
      {
        path: 'leave',
        canActivate: [permissionGuard(['LEAVE_REQUEST', 'LEAVE_APPROVE', 'LEAVE_MANAGE'])],
        loadChildren: () => import('./features/leave/leave.routes').then(m => m.LEAVE_ROUTES),
        data: { preload: true }
      },
      {
        path: 'payroll',
        canActivate: [permissionGuard(['PAYROLL_READ', 'PAYROLL_MANAGE']), complianceGuard()],
        loadChildren: () => import('./features/payroll/payroll.routes').then(m => m.PAYROLL_ROUTES)
      },
      {
        path: 'accounting',
        canActivate: [permissionGuard(['ACCOUNTING_READ', 'FINANCE_READ'])],
        loadChildren: () => import('./features/accounting/accounting.routes').then(m => m.ACCOUNTING_ROUTES)
      },
      {
        path: 'recruitment',
        canActivate: [permissionGuard(['RECRUITMENT_READ', 'RECRUITMENT_MANAGE'])],
        loadChildren: () => import('./features/recruitment/recruitment.routes').then(m => m.RECRUITMENT_ROUTES)
      },
      {
        path: 'settings',
        // No permission guard here - all authenticated users can access personal settings
        // Admin-only sections have their own guards in child routes
        loadChildren: () => import('./features/settings/settings.routes').then(m => m.SETTINGS_ROUTES)
      },
      {
        path: 'my-payslips',
        // Any authenticated user can access their own payslips
        loadComponent: () => import('./features/payslips/my-payslips.component').then(m => m.MyPayslipsComponent)
      },
      {
        path: 'my-documents',
        // Any authenticated user can access their own documents
        loadComponent: () => import('./features/documents/my-documents/my-documents.component').then(m => m.MyDocumentsComponent)
      },
      {
        path: 'profile',
        // Any authenticated user can access their own profile
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'notifications',
        // Any authenticated user can access their notifications
        loadChildren: () => import('./features/notifications/notifications.routes')
          .then(m => m.NOTIFICATIONS_ROUTES)
      },
      {
        path: 'support',
        // Any authenticated user can submit support tickets
        loadChildren: () => import('./features/support/support.routes').then(m => m.SUPPORT_ROUTES)
      },
      {
        path: 'hr',
        canActivate: [permissionGuard(['EMPLOYEE_READ', 'EMPLOYEE_MANAGE', 'LEAVE_APPROVE', 'LEAVE_MANAGE'])],
        loadChildren: () => import('./features/hr/hr.routes').then(m => m.HR_ROUTES)
      },
      {
        path: 'finance',
        canActivate: [permissionGuard(['PAYROLL_READ', 'PAYROLL_MANAGE', 'ACCOUNTING_READ', 'FINANCE_READ']), companyDetailsGuard()],
        loadChildren: () => import('./features/finance/finance.routes').then(m => m.FINANCE_ROUTES)
      },
      {
        path: 'reports',
        canActivate: [permissionGuard(['REPORTS_READ', 'HR_REPORTS', 'FINANCE_REPORTS', 'EMPLOYEE_READ', 'PAYROLL_READ'])],
        loadChildren: () => import('./features/reports/reports.routes').then(m => m.REPORTS_ROUTES)
      },
      {
        path: 'documents',
        canActivate: [permissionGuard(['DOCUMENTS_READ', 'DOCUMENTS_MANAGE', 'EMPLOYEE_READ'])],
        loadChildren: () => import('./features/documents/documents.routes').then(m => m.DOCUMENTS_ROUTES)
      },
      {
        path: 'setup-required',
        loadComponent: () => import('./shared/components/setup-block/setup-block.component')
          .then(m => m.SetupBlockComponent)
      }
    ]
  },
  {
    // Public careers page - no authentication required
    path: 'careers',
    loadChildren: () => import('./features/careers/careers.routes').then(m => m.CAREERS_ROUTES)
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
