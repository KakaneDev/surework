import { Routes } from '@angular/router';

export const EMPLOYEES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./employees-list/employees-list.component').then(m => m.EmployeesListComponent)
  },
  {
    path: 'organogram',
    loadComponent: () => import('./employees-organogram/employees-organogram.component').then(m => m.EmployeesOrganogramComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./employee-form/employee-form.component').then(m => m.EmployeeFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./employee-detail/employee-detail.component').then(m => m.EmployeeDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./employee-form/employee-form.component').then(m => m.EmployeeFormComponent)
  }
];
