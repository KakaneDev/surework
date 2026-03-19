import { Routes } from '@angular/router';
import { permissionGuard } from '@core/guards/permission.guard';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./settings-layout/settings-layout.component').then(m => m.SettingsLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'security',
        pathMatch: 'full'
      },
      // Personal Settings (all authenticated users)
      {
        path: 'security',
        loadComponent: () => import('./account-security/account-security.component').then(m => m.AccountSecurityComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./notification-preferences/notification-preferences.component').then(m => m.NotificationPreferencesComponent)
      },
      {
        path: 'appearance',
        loadComponent: () => import('./appearance/appearance.component').then(m => m.AppearanceComponent)
      },
      // Admin Settings (requires SYSTEM_ADMIN or TENANT_ALL permissions)
      {
        path: 'company',
        canActivate: [permissionGuard(['SYSTEM_ADMIN', 'TENANT_ALL'])],
        loadComponent: () => import('./company-profile/company-profile.component').then(m => m.CompanyProfileComponent)
      },
      {
        path: 'users',
        canActivate: [permissionGuard(['SYSTEM_ADMIN', 'TENANT_ALL'])],
        loadComponent: () => import('./user-management/user-management.component').then(m => m.UserManagementComponent)
      },
      {
        path: 'leave-policies',
        canActivate: [permissionGuard(['SYSTEM_ADMIN', 'TENANT_ALL', 'LEAVE_MANAGE'])],
        loadComponent: () => import('./leave-policies/leave-policies.component').then(m => m.LeavePoliciesComponent)
      },
      {
        path: 'notification-channels',
        canActivate: [permissionGuard(['SYSTEM_ADMIN', 'TENANT_ALL', 'TENANT_MANAGE'])],
        loadComponent: () => import('./notification-channels/notification-channels.component').then(m => m.NotificationChannelsComponent)
      },
      {
        path: 'compliance',
        canActivate: [permissionGuard(['SYSTEM_ADMIN', 'TENANT_ALL'])],
        loadComponent: () => import('./compliance/compliance.component').then(m => m.ComplianceComponent)
      }
    ]
  }
];
