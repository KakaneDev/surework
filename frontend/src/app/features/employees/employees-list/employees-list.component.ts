import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { EmployeeService, EmployeeListItem, EmploymentStatus, Department } from '@core/services/employee.service';
import {
  SpinnerComponent,
  BadgeComponent,
  PaginationComponent,
  DropdownComponent,
  DropdownItemComponent,
  TableSkeletonComponent,
  EMPLOYEE_STATUS_CONFIG,
  getEmployeeStatusConfig
} from '@shared/ui';

@Component({
  selector: 'app-employees-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    TranslateModule,
    SpinnerComponent,
    BadgeComponent,
    PaginationComponent,
    DropdownComponent,
    DropdownItemComponent,
    TableSkeletonComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="sw-page-header">
        <div>
          <h1 class="sw-page-title">{{ 'employees.title' | translate }}</h1>
          <p class="sw-page-description">{{ 'employees.subtitle' | translate }}</p>
        </div>
        <div class="flex items-center gap-3">
          <!-- View Toggle -->
          <div class="inline-flex rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface p-1">
            <span
              class="px-4 py-2 text-sm font-medium rounded-md bg-primary-500 text-white"
            >
              <span class="material-icons text-lg align-middle mr-1">list</span>
              {{ 'employees.view.list' | translate }}
            </span>
            <a
              routerLink="organogram"
              class="px-4 py-2 text-sm font-medium rounded-md text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors"
            >
              <span class="material-icons text-lg align-middle mr-1">account_tree</span>
              {{ 'employees.view.chart' | translate }}
            </a>
          </div>
          <a
            routerLink="new"
            class="sw-btn sw-btn-primary sw-btn-md"
          >
            <span class="material-icons text-xl">add</span>
            {{ 'employees.addEmployee' | translate }}
          </a>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-4">
        <!-- Search -->
        <div class="flex-1 min-w-[250px]">
          <label for="employee-search" class="sr-only">{{ 'common.search' | translate }}</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-neutral-400 text-xl" aria-hidden="true">search</span>
            <input
              id="employee-search"
              type="search"
              [formControl]="searchControl"
              [placeholder]="'employees.filters.searchPlaceholder' | translate"
              class="sw-input pl-10"
              [attr.aria-label]="'employees.filters.searchPlaceholder' | translate"
            />
          </div>
        </div>

        <!-- Status Filter -->
        <div class="w-40">
          <label for="status-filter" class="sr-only">{{ 'common.filter' | translate }}</label>
          <select id="status-filter" [formControl]="statusControl" class="sw-input" [attr.aria-label]="'common.filter' | translate">
            <option [ngValue]="null">{{ 'employees.filters.allStatus' | translate }}</option>
            <option value="ACTIVE">{{ 'employees.status.active' | translate }}</option>
            <option value="ON_LEAVE">{{ 'employees.status.onLeave' | translate }}</option>
            <option value="SUSPENDED">{{ 'employees.status.suspended' | translate }}</option>
            <option value="TERMINATED">{{ 'employees.status.terminated' | translate }}</option>
          </select>
        </div>

        <!-- Department Filter -->
        <div class="w-48">
          <label for="department-filter" class="sr-only">{{ 'common.filter' | translate }}</label>
          <select id="department-filter" [formControl]="departmentControl" class="sw-input" [attr.aria-label]="'common.filter' | translate">
            <option [ngValue]="null">{{ 'employees.filters.allDepartments' | translate }}</option>
            @for (dept of departments; track dept.id) {
              <option [ngValue]="dept.id">{{ dept.name }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <sw-table-skeleton [columns]="7" [rows]="10" [showAvatar]="true" [showActions]="true" />
        </div>
      } @else {
        <!-- Table -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
          <div class="overflow-x-auto">
            <table class="sw-table">
              <thead>
                <tr>
                  <th class="w-32">{{ 'employees.table.employeeNumber' | translate }}</th>
                  <th>{{ 'employees.table.name' | translate }}</th>
                  <th>{{ 'employees.table.email' | translate }}</th>
                  <th>{{ 'employees.table.department' | translate }}</th>
                  <th>{{ 'employees.table.jobTitle' | translate }}</th>
                  <th class="w-28">{{ 'employees.table.status' | translate }}</th>
                  <th class="w-32">{{ 'employees.table.hireDate' | translate }}</th>
                  <th class="w-16"></th>
                </tr>
              </thead>
              <tbody>
                @if (employees.length === 0) {
                  <tr>
                    <td colspan="8" class="text-center py-12 text-neutral-500 dark:text-neutral-400">
                      <span class="material-icons text-4xl mb-2 opacity-50">people_outline</span>
                      <p>{{ 'employees.noEmployees' | translate }}</p>
                    </td>
                  </tr>
                } @else {
                  @for (employee of employees; track employee.id) {
                    <tr class="group">
                      <td class="font-mono text-sm">{{ employee.employeeNumber }}</td>
                      <td>
                        <a
                          [routerLink]="[employee.id]"
                          class="font-medium text-primary-500 hover:text-primary-600 transition-colors"
                        >
                          {{ employee.fullName }}
                        </a>
                      </td>
                      <td class="text-neutral-600 dark:text-neutral-400">{{ employee.email }}</td>
                      <td>{{ employee.departmentName || '-' }}</td>
                      <td>{{ employee.jobTitle || '-' }}</td>
                      <td>
                        <sw-badge
                          [variant]="statusVariantMap[employee.status] || 'neutral'"
                          [dot]="true"
                          [rounded]="true"
                          size="sm"
                        >
                          {{ statusLabelKeyMap[employee.status] | translate }}
                        </sw-badge>
                      </td>
                      <td class="text-neutral-600 dark:text-neutral-400">
                        {{ employee.hireDate | date:'mediumDate' }}
                      </td>
                      <td>
                        <sw-dropdown align="right">
                          <button
                            trigger
                            type="button"
                            class="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            [attr.aria-label]="('employees.actions.menuFor' | translate) + ' ' + employee.fullName"
                          >
                            <span class="material-icons" aria-hidden="true">more_vert</span>
                          </button>
                          <sw-dropdown-item (onClick)="navigateTo(employee.id)">
                            <div class="flex items-center gap-2">
                              <span class="material-icons text-lg">visibility</span>
                              {{ 'employees.actions.view' | translate }}
                            </div>
                          </sw-dropdown-item>
                          <sw-dropdown-item (onClick)="navigateTo(employee.id + '/edit')">
                            <div class="flex items-center gap-2">
                              <span class="material-icons text-lg">edit</span>
                              {{ 'employees.actions.edit' | translate }}
                            </div>
                          </sw-dropdown-item>
                        </sw-dropdown>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (employees.length > 0) {
            <div class="border-t border-neutral-200 dark:border-dark-border px-4">
              <sw-pagination
                [total]="totalElements"
                [page]="pageIndex + 1"
                [pageSize]="pageSize"
                [pageSizeOptions]="[10, 20, 50]"
                (pageChange)="onPageChange($event)"
                (pageSizeChange)="onPageSizeChange($event)"
              />
            </div>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeesListComponent implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Lookup maps derived from centralized configuration (avoids function calls on every CD cycle)
  readonly statusVariantMap: Record<string, 'success' | 'warning' | 'error' | 'neutral' | 'primary' | 'info'> =
    Object.fromEntries(
      Object.entries(EMPLOYEE_STATUS_CONFIG).map(([key, config]) => [key, config.variant])
    );

  readonly statusLabelKeyMap: Record<string, string> =
    Object.fromEntries(
      Object.entries(EMPLOYEE_STATUS_CONFIG).map(([key, config]) => [key, config.translationKey])
    );

  employees: EmployeeListItem[] = [];
  departments: Department[] = [];
  loading = true;
  totalElements = 0;
  pageIndex = 0;
  pageSize = 20;

  searchControl = new FormControl('');
  statusControl = new FormControl<EmploymentStatus | null>(null);
  departmentControl = new FormControl<string | null>(null);

  ngOnInit(): void {
    this.loadDepartments();
    this.loadEmployees();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.loadEmployees());

    this.statusControl.valueChanges.pipe(
      debounceTime(100),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.loadEmployees());

    this.departmentControl.valueChanges.pipe(
      debounceTime(100),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.loadEmployees());
  }

  loadEmployees(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.employeeService.searchEmployees(
      this.pageIndex,
      this.pageSize,
      this.statusControl.value ?? undefined,
      this.departmentControl.value ?? undefined,
      this.searchControl.value ?? undefined
    ).subscribe({
      next: (response) => {
        this.employees = response.content;
        this.totalElements = response.totalElements;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadDepartments(): void {
    this.employeeService.getDepartments().subscribe({
      next: (departments) => {
        this.departments = departments;
        this.cdr.markForCheck();
      }
    });
  }

  onPageChange(page: number): void {
    this.pageIndex = page - 1;
    this.loadEmployees();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 0;
    this.loadEmployees();
  }

  navigateTo(path: string): void {
    // Navigation handled by routerLink
  }
}
