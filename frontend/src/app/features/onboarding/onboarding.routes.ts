import { Routes } from '@angular/router';

export const onboardingRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./onboarding-wizard.component')
      .then(m => m.OnboardingWizardComponent)
  },
  {
    path: 'success',
    loadComponent: () => import('./signup-success.component')
      .then(m => m.SignupSuccessComponent)
  }
];
