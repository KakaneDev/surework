import { Routes } from '@angular/router';

export const onboardingRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./onboarding-wizard.component')
      .then(m => m.OnboardingWizardComponent)
  },
  {
    path: 'verify',
    loadComponent: () => import('./verify-code.component')
      .then(m => m.VerifyCodeComponent)
  }
];
