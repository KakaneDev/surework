import { Routes } from '@angular/router';

export const NOTIFICATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./notifications-inbox/notifications-inbox.component')
      .then(m => m.NotificationsInboxComponent)
  }
];
