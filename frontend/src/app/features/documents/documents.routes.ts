import { Routes } from '@angular/router';
import { permissionGuard } from '@core/guards/permission.guard';

export const DOCUMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./documents-list/documents-list.component').then(m => m.DocumentsListComponent)
  },
  {
    path: 'templates',
    loadComponent: () => import('./templates/templates.component').then(m => m.TemplatesComponent)
  },
  {
    path: 'policies',
    loadComponent: () => import('./policies/policies.component').then(m => m.PoliciesComponent)
  },
  {
    path: 'hr',
    loadComponent: () => import('./hr-documents/hr-documents.component').then(m => m.HrDocumentsComponent),
    canActivate: [permissionGuard(['HR_READ', 'HR_MANAGE', 'DOCUMENT_MANAGE', 'TENANT_ALL', 'ALL'])]
  }
];
