import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { selectUserPermissions, selectCurrentEmployeeId } from '@core/store/auth/auth.selectors';
import { OrgChartComponent } from '@shared/components/org-chart';
import { OrgChartConfig, OrgChartAccessMode } from '@shared/components/org-chart/org-chart.models';

/**
 * Organizational chart view within the Employees section.
 * Provides an alternative view to the employee list.
 */
@Component({
  selector: 'app-employees-organogram',
  standalone: true,
  imports: [CommonModule, RouterLink, OrgChartComponent, TranslateModule],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="sw-page-header">
        <div>
          <h1 class="sw-page-title">{{ 'employees.title' | translate }}</h1>
          <p class="sw-page-description">{{ 'employees.organogram.description' | translate }}</p>
        </div>
        <div class="flex items-center gap-3">
          <!-- View Toggle -->
          <div class="inline-flex rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface p-1">
            <a
              routerLink="/employees"
              class="px-4 py-2 text-sm font-medium rounded-md text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors"
            >
              <span class="material-icons text-lg align-middle mr-1">list</span>
              {{ 'employees.view.list' | translate }}
            </a>
            <span
              class="px-4 py-2 text-sm font-medium rounded-md bg-primary-500 text-white"
            >
              <span class="material-icons text-lg align-middle mr-1">account_tree</span>
              {{ 'employees.view.chart' | translate }}
            </span>
          </div>
          <a
            routerLink="/employees/new"
            class="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
          >
            <span class="material-icons text-xl">add</span>
            {{ 'employees.addEmployee' | translate }}
          </a>
        </div>
      </div>

      <!-- Access Mode Indicator -->
      @if (accessMode() !== 'full') {
        <div class="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <span class="material-icons text-blue-500">info</span>
          <p class="text-sm text-blue-800 dark:text-blue-200">
            @if (accessMode() === 'subtree') {
              {{ 'employees.organogram.subtreeMessage' | translate }}
              <a routerLink="/hr/organogram" class="font-medium underline hover:no-underline">{{ 'employees.organogram.hrChart' | translate }}</a>.
            } @else {
              {{ 'employees.organogram.chainMessage' | translate }}
            }
          </p>
        </div>
      }

      <!-- Org Chart -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
        <app-org-chart [config]="chartConfig()" />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeesOrganogramComponent {
  private readonly store = inject(Store);
  private readonly translate = inject(TranslateService);

  private userPermissions = toSignal(this.store.select(selectUserPermissions), { initialValue: [] as string[] });
  private currentEmployeeId = toSignal(this.store.select(selectCurrentEmployeeId), { initialValue: null as string | null });

  // Compute access mode based on user permissions
  accessMode = computed<OrgChartAccessMode>(() => {
    const perms = this.userPermissions();

    const isAdmin = perms.some(p =>
      ['ALL', '*', 'TENANT_ALL', 'EMPLOYEE_MANAGE'].includes(p)
    );
    if (isAdmin) return 'full';

    const isManager = perms.some(p => ['LEAVE_APPROVE', 'DEPARTMENT_MANAGE'].includes(p));
    if (isManager) return 'subtree';

    return 'chain';
  });

  // Chart configuration based on access mode
  chartConfig = computed<OrgChartConfig>(() => ({
    mode: this.accessMode(),
    rootEmployeeId: this.accessMode() !== 'full' ? (this.currentEmployeeId() ?? undefined) : undefined
  }));
}
