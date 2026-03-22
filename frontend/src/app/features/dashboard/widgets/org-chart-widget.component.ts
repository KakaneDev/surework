import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OrgChartService } from '@shared/components/org-chart/org-chart.service';
import { OrgChartNode } from '@shared/components/org-chart/org-chart.models';
import { SpinnerComponent } from '@shared/ui';

/**
 * Compact org chart widget for the dashboard.
 * Shows a preview of the top hierarchy levels.
 */
@Component({
  selector: 'app-org-chart-widget',
  standalone: true,
  imports: [CommonModule, RouterLink, SpinnerComponent, TranslateModule],
  template: `
    <div class="sw-card">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-200 dark:border-dark-border">
        <div class="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
          <span class="material-icons">account_tree</span>
        </div>
        <div class="flex-1">
          <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">{{ 'dashboard.widgets.orgChart.title' | translate }}</h3>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'dashboard.widgets.orgChart.subtitle' | translate }}</p>
        </div>
      </div>

      <!-- Content -->
      <div class="min-h-[180px]">
        @if (loading()) {
          <div class="flex justify-center items-center h-[150px]">
            <sw-spinner size="md" />
          </div>
        } @else if (roots().length === 0) {
          <div class="text-center py-6">
            <span class="material-icons text-4xl text-neutral-300 mb-2">account_tree</span>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'dashboard.widgets.orgChart.noData' | translate }}</p>
          </div>
        } @else {
          <!-- Compact Tree Preview -->
          <div class="space-y-3">
            @for (root of roots().slice(0, 3); track root.id) {
              <div class="org-preview-node">
                <!-- Root Node -->
                <a
                  [routerLink]="['/employees', root.id]"
                  class="org-preview-card org-preview-card--root"
                >
                  <div
                    class="org-preview-avatar"
                    [style.background-color]="getAvatarColor(root.fullName)"
                  >
                    {{ root.initials }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-sm text-neutral-900 dark:text-neutral-100 truncate">
                      {{ root.fullName }}
                    </p>
                    <p class="text-xs text-neutral-500 truncate">{{ root.jobTitle || (getDefaultJobTitle()) }}</p>
                  </div>
                </a>

                <!-- Direct Reports Preview -->
                @if (root.children.length > 0) {
                  <div class="org-preview-children">
                    <div class="org-preview-connector"></div>
                    <div class="flex flex-wrap gap-2">
                      @for (child of root.children.slice(0, 4); track child.id) {
                        <a
                          [routerLink]="['/employees', child.id]"
                          class="org-preview-card org-preview-card--child"
                          [title]="child.fullName + (child.jobTitle ? ' - ' + child.jobTitle : '')"
                        >
                          <div
                            class="org-preview-avatar org-preview-avatar--sm"
                            [style.background-color]="getAvatarColor(child.fullName)"
                          >
                            {{ child.initials }}
                          </div>
                          <span class="text-xs text-neutral-700 dark:text-neutral-300 truncate max-w-[80px]">
                            {{ child.fullName.split(' ')[0] }}
                          </span>
                        </a>
                      }
                      @if (root.children.length > 4) {
                        <span class="text-xs text-neutral-500 self-center">
                          {{ 'dashboard.widgets.orgChart.moreLabel' | translate: { count: root.children.length - 4 } }}
                        </span>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Stats Summary -->
          <div class="mt-4 pt-4 border-t border-neutral-200 dark:border-dark-border">
            <div class="flex items-center justify-between text-sm">
              <div class="flex items-center gap-4">
                <span class="text-neutral-500 dark:text-neutral-400">
                  <span class="font-medium text-neutral-900 dark:text-neutral-100">{{ totalEmployees() }}</span>
                  {{ 'dashboard.widgets.orgChart.employeesLabel' | translate }}
                </span>
                <span class="text-neutral-500 dark:text-neutral-400">
                  <span class="font-medium text-neutral-900 dark:text-neutral-100">{{ maxDepth() }}</span>
                  {{ 'dashboard.widgets.orgChart.levelsLabel' | translate }}
                </span>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Footer Link -->
      <div class="mt-4 pt-4 border-t border-neutral-200 dark:border-dark-border">
        <a
          routerLink="/hr/organogram"
          class="text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors"
        >
          {{ 'dashboard.widgets.orgChart.viewFullChart' | translate }} →
        </a>
      </div>
    </div>
  `,
  styles: [`
    .org-preview-node {
      padding-left: 0.5rem;
    }

    .org-preview-card {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      border-radius: 0.5rem;
      transition: all 0.2s ease;
    }

    .org-preview-card:hover {
      background: var(--color-neutral-50);
    }

    :host-context(.dark) .org-preview-card:hover {
      background: var(--color-dark-elevated);
    }

    .org-preview-card--root {
      background: var(--color-neutral-50);
    }

    :host-context(.dark) .org-preview-card--root {
      background: var(--color-dark-elevated);
    }

    .org-preview-card--child {
      background: white;
      border: 1px solid var(--color-neutral-200);
    }

    :host-context(.dark) .org-preview-card--child {
      background: var(--color-dark-surface);
      border-color: var(--color-dark-border);
    }

    .org-preview-avatar {
      flex-shrink: 0;
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.75rem;
      color: white;
    }

    .org-preview-avatar--sm {
      width: 1.5rem;
      height: 1.5rem;
      font-size: 0.625rem;
    }

    .org-preview-children {
      position: relative;
      margin-left: 1.5rem;
      padding-left: 1rem;
      padding-top: 0.5rem;
    }

    .org-preview-connector {
      position: absolute;
      left: 0;
      top: 0;
      width: 2px;
      height: 100%;
      background: var(--color-neutral-300);
    }

    :host-context(.dark) .org-preview-connector {
      background: var(--color-dark-border);
    }

    .org-preview-connector::before {
      content: '';
      position: absolute;
      top: 1rem;
      left: 0;
      width: 0.75rem;
      height: 2px;
      background: var(--color-neutral-300);
    }

    :host-context(.dark) .org-preview-connector::before {
      background: var(--color-dark-border);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrgChartWidgetComponent implements OnInit {
  private readonly orgChartService = inject(OrgChartService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);

  roots = signal<OrgChartNode[]>([]);
  loading = signal(true);

  // Avatar color palette (TailAdmin teal/cyan theme)
  private readonly avatarColors = [
    '#14b8a6', '#06b6d4', '#0d9488', '#0891b2',
    '#10b981', '#0ea5e9', '#0f766e', '#0284c7',
    '#059669', '#0369a1', '#047857', '#155e75'
  ];

  // Computed stats
  totalEmployees = computed(() => this.countNodes(this.roots()));
  maxDepth = computed(() => this.calculateMaxDepth(this.roots()));

  ngOnInit(): void {
    this.loadHierarchy();
  }

  private loadHierarchy(): void {
    this.orgChartService.getFullHierarchy().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (hierarchy) => {
        this.roots.set(hierarchy);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return this.avatarColors[Math.abs(hash) % this.avatarColors.length];
  }

  getDefaultJobTitle(): string {
    return this.translate.instant('dashboard.widgets.orgChart.defaultJobTitle');
  }

  private countNodes(nodes: OrgChartNode[]): number {
    return nodes.reduce((count, node) => {
      return count + 1 + this.countNodes(node.children);
    }, 0);
  }

  private calculateMaxDepth(nodes: OrgChartNode[], currentDepth = 1): number {
    if (nodes.length === 0) return currentDepth - 1;
    return Math.max(...nodes.map(node =>
      this.calculateMaxDepth(node.children, currentDepth + 1)
    ));
  }
}
