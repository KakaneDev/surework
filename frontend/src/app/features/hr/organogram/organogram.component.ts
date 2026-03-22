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
 * Full-page organizational chart view in HR section.
 * Shows the complete company hierarchy with role-based access control.
 */
@Component({
  selector: 'app-organogram',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, OrgChartComponent],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="sw-page-header">
        <div>
          <nav class="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mb-2">
            <a routerLink="/hr" class="hover:text-primary-500 transition-colors">{{ 'nav.groups.hr' | translate }}</a>
            <span class="material-icons text-sm">chevron_right</span>
            <span class="text-neutral-900 dark:text-neutral-100">{{ 'hr.organogram.title' | translate }}</span>
          </nav>
          <h1 class="sw-page-title">{{ 'hr.organogram.title' | translate }}</h1>
          <p class="sw-page-description">{{ getAccessDescription() }}</p>
        </div>
      </div>

      <!-- Access Mode Indicator -->
      @if (accessMode() !== 'full') {
        <div class="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <span class="material-icons text-blue-500">info</span>
          <div class="flex-1">
            <p class="text-sm text-blue-800 dark:text-blue-200">
              @if (accessMode() === 'subtree') {
                {{ 'hr.organogram.accessMode.subtreeMessage' | translate }}
              } @else {
                {{ 'hr.organogram.accessMode.chainMessage' | translate }}
              }
            </p>
          </div>
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
export class OrganogramComponent {
  private readonly store = inject(Store);
  private readonly translateService = inject(TranslateService);

  private userPermissions = toSignal(this.store.select(selectUserPermissions), { initialValue: [] as string[] });
  private currentEmployeeId = toSignal(this.store.select(selectCurrentEmployeeId), { initialValue: null as string | null });

  // Compute access mode based on user permissions
  accessMode = computed<OrgChartAccessMode>(() => {
    const perms = this.userPermissions();

    // Super admin / HR Admin gets full view
    const isAdmin = perms.some(p =>
      ['ALL', '*', 'TENANT_ALL', 'EMPLOYEE_MANAGE'].includes(p)
    );
    if (isAdmin) return 'full';

    // Managers with approval permissions see their subtree
    const isManager = perms.some(p => ['LEAVE_APPROVE', 'DEPARTMENT_MANAGE'].includes(p));
    if (isManager) return 'subtree';

    // Regular employees see their chain
    return 'chain';
  });

  // Chart configuration based on access mode
  chartConfig = computed<OrgChartConfig>(() => ({
    mode: this.accessMode(),
    rootEmployeeId: this.accessMode() !== 'full' ? (this.currentEmployeeId() ?? undefined) : undefined
  }));

  getAccessDescription(): string {
    switch (this.accessMode()) {
      case 'full':
        return this.translateService.instant('hr.organogram.accessMode.fullDescription');
      case 'subtree':
        return this.translateService.instant('hr.organogram.accessMode.subtreeDescription');
      case 'chain':
        return this.translateService.instant('hr.organogram.accessMode.chainDescription');
    }
  }
}
