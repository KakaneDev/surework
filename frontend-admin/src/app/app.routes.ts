import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { roleGuard } from './shared/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    children: [
      {
        path: 'signin',
        loadComponent: () => import('./pages/auth/signin.component').then(m => m.SigninComponent)
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./pages/auth/forgot-password.component').then(m => m.ForgotPasswordComponent)
      }
    ]
  },
  {
    path: '',
    loadComponent: () => import('./shared/layout/app-layout.component').then(m => m.AppLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        data: { title: 'Dashboard' }
      },
      {
        path: 'tenants',
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/tenants/tenant-list.component').then(m => m.TenantListComponent),
            data: { title: 'Tenants' }
          },
          {
            path: ':id',
            loadComponent: () => import('./pages/tenants/tenant-detail.component').then(m => m.TenantDetailComponent),
            data: { title: 'Tenant Details' }
          }
        ]
      },
      {
        path: 'onboarding',
        loadComponent: () => import('./pages/onboarding/onboarding-tracker.component').then(m => m.OnboardingTrackerComponent),
        data: { title: 'Onboarding Tracking' }
      },
      {
        path: 'trials',
        loadComponent: () => import('./pages/trials/trial-list.component').then(m => m.TrialListComponent),
        data: { title: 'Trial Management' }
      },
      {
        path: 'support',
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/support/ticket-list.component').then(m => m.TicketListComponent),
            canActivate: [roleGuard],
            data: { title: 'Support Tickets', roles: ['SUPER_ADMIN', 'SUPPORT_MANAGER', 'SUPPORT_AGENT'] }
          },
          {
            path: ':id',
            loadComponent: () => import('./pages/support/ticket-detail.component').then(m => m.TicketDetailComponent),
            data: { title: 'Ticket Details' }
          },
          {
            path: 'canned-responses',
            loadComponent: () => import('./pages/support/canned-responses.component').then(m => m.CannedResponsesComponent),
            data: { title: 'Canned Responses' }
          }
        ]
      },
      {
        path: 'analytics',
        children: [
          {
            path: 'usage',
            loadComponent: () => import('./pages/analytics/feature-usage.component').then(m => m.FeatureUsageComponent),
            data: { title: 'Feature Usage' }
          },
          {
            path: 'churn',
            loadComponent: () => import('./pages/analytics/churn-analysis.component').then(m => m.ChurnAnalysisComponent),
            data: { title: 'Churn Analysis' }
          },
          {
            path: 'health',
            loadComponent: () => import('./pages/analytics/health-scores.component').then(m => m.HealthScoresComponent),
            data: { title: 'Health Scores' }
          }
        ]
      },
      {
        path: 'billing',
        children: [
          {
            path: 'revenue',
            loadComponent: () => import('./pages/billing/revenue-dashboard.component').then(m => m.RevenueDashboardComponent),
            canActivate: [roleGuard],
            data: { title: 'Revenue Dashboard', roles: ['SUPER_ADMIN', 'FINANCE_ANALYST'] }
          },
          {
            path: 'projections',
            loadComponent: () => import('./pages/billing/projections.component').then(m => m.ProjectionsComponent),
            data: { title: 'Revenue Projections' }
          },
          {
            path: 'payments',
            loadComponent: () => import('./pages/billing/payment-history.component').then(m => m.PaymentHistoryComponent),
            data: { title: 'Payment History' }
          }
        ]
      },
      {
        path: 'discounts',
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/discounts/discount-list.component').then(m => m.DiscountListComponent),
            data: { title: 'Discounts' }
          },
          {
            path: 'create',
            loadComponent: () => import('./pages/discounts/discount-form.component').then(m => m.DiscountFormComponent),
            data: { title: 'Create Discount' }
          },
          {
            path: ':id/edit',
            loadComponent: () => import('./pages/discounts/discount-form.component').then(m => m.DiscountFormComponent),
            data: { title: 'Edit Discount' }
          }
        ]
      },
      {
        path: 'portals',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'PORTAL_ADMIN'] },
        children: [
          {
            path: '',
            redirectTo: 'health',
            pathMatch: 'full'
          },
          {
            path: 'health',
            loadComponent: () => import('./pages/portals/portal-health-dashboard/portal-health-dashboard.component').then(m => m.PortalHealthDashboardComponent),
            data: { title: 'Portal Health Dashboard' }
          },
          {
            path: 'failed-queue',
            loadComponent: () => import('./pages/portals/failed-postings-queue/failed-postings-queue.component').then(m => m.FailedPostingsQueueComponent),
            data: { title: 'Failed Postings Queue' }
          },
          {
            path: 'credentials',
            loadComponent: () => import('./pages/portals/portal-credentials.component').then(m => m.PortalCredentialsComponent),
            data: { title: 'Portal Credentials' }
          },
          {
            path: 'queue',
            loadComponent: () => import('./pages/portals/posting-queue/posting-queue.component').then(m => m.PostingQueueComponent),
            data: { title: 'Posting Queue' }
          },
          {
            path: 'statistics',
            loadComponent: () => import('./pages/portals/external-posting-stats.component').then(m => m.ExternalPostingStatsComponent),
            data: { title: 'Portal Statistics' }
          },
          {
            path: 'failed',
            redirectTo: 'failed-queue',
            pathMatch: 'full'
          }
        ]
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
        data: { title: 'Profile' }
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent),
        data: { title: 'Settings' }
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
