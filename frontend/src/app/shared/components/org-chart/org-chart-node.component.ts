import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { OrgChartNode } from './org-chart.models';
import { BadgeComponent } from '@shared/ui';

/**
 * Recursive component for displaying a node in the organizational chart.
 * Each node shows an employee card with connector lines to children.
 */
@Component({
  selector: 'app-org-chart-node',
  standalone: true,
  imports: [CommonModule, TranslateModule, BadgeComponent],
  template: `
    <div class="flex flex-col items-center">
      <!-- Employee Card Container (relative for expand button positioning) -->
      <div class="relative">
        <!-- Employee Card Button -->
        <button
          type="button"
          [ngClass]="getCardClasses()"
          (click)="onCardClick()"
          [attr.aria-label]="node.fullName + (node.jobTitle ? ', ' + node.jobTitle : '') + (node.department ? ', ' + node.department : '')"
        >
          <!-- Avatar -->
          <div
            [ngClass]="getAvatarClasses()"
            [style.background-color]="getAvatarColor(node.fullName)"
          >
            {{ node.initials }}
          </div>

          <!-- Info -->
          <span class="flex-1 min-w-0 pr-14 flex flex-col">
            <span [ngClass]="getNameClasses()">
              {{ node.fullName }}
            </span>
            @if (node.jobTitle) {
              <span [ngClass]="getTitleClasses()">
                {{ node.jobTitle }}
              </span>
            }
            @if (node.department && !compact) {
              <span class="text-xs text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
                {{ node.department }}
              </span>
            }
          </span>

          <!-- Status Badge -->
          @if (!compact) {
            <sw-badge
              [variant]="getStatusVariant(node.status)"
              size="sm"
              [dot]="true"
              class="absolute top-2 right-2"
            >
              {{ getStatusLabel(node.status) | translate }}
            </sw-badge>
          }
        </button>

        <!-- Expand/Collapse Button (outside main button to avoid nesting) -->
        @if (node.children.length > 0) {
          <button
            type="button"
            [ngClass]="getExpandButtonClasses()"
            (click)="onToggleExpand($event)"
            [attr.aria-expanded]="node.expanded"
            [attr.aria-label]="node.expanded ? 'Collapse subordinates' : 'Expand subordinates'"
          >
            <span class="material-icons text-sm" aria-hidden="true">
              {{ node.expanded ? 'expand_less' : 'expand_more' }}
            </span>
            <span class="text-xs">{{ node.children.length }}</span>
          </button>
        }
      </div>

      <!-- Children Container -->
      @if (node.children.length > 0 && node.expanded && (!maxDepth || node.level < maxDepth - 1)) {
        <div class="flex flex-col items-center mt-6">
          <!-- Connector Line Down -->
          <div class="w-0.5 h-6 bg-neutral-300 dark:bg-neutral-600"></div>

          <!-- Children Wrapper -->
          <div class="flex gap-4 relative">
            @for (child of visibleChildren; track child.id; let first = $first; let last = $last; let idx = $index) {
              <div class="flex flex-col items-center">
                <!-- Horizontal Connector -->
                <div
                  class="org-connector-horizontal relative h-6 w-full min-w-[2rem]"
                  [class.org-connector-first]="first && visibleChildren.length > 1"
                  [class.org-connector-last]="last && visibleChildren.length > 1 && !hasMoreChildren"
                  [class.org-connector-single]="visibleChildren.length === 1 && !hasMoreChildren"
                ></div>

                <!-- Recursive Child Node -->
                <app-org-chart-node
                  [node]="child"
                  [compact]="compact"
                  [maxDepth]="maxDepth"
                  [searchQuery]="searchQuery"
                  (nodeClick)="nodeClick.emit($event)"
                  (toggleExpand)="toggleExpand.emit($event)"
                  (showMore)="showMore.emit($event)"
                />
              </div>
            }

            <!-- Show More Button -->
            @if (hasMoreChildren) {
              <div class="flex flex-col items-center">
                <div
                  class="org-connector-horizontal org-connector-last relative h-6 w-full min-w-[2rem]"
                ></div>
                <button
                  type="button"
                  class="flex items-center gap-1 py-2 px-4 text-[13px] font-medium text-primary-500 dark:text-primary-400 bg-white dark:bg-dark-bg border-2 border-dashed border-primary-500 dark:border-primary-400 rounded-lg cursor-pointer transition-colors whitespace-nowrap hover:bg-primary-50 dark:hover:bg-primary-900/20 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  (click)="onShowMore($event)"
                  [attr.aria-label]="'Show ' + hiddenChildrenCount + ' more subordinates'"
                >
                  <span class="material-icons text-base" aria-hidden="true">add</span>
                  <span>{{ hiddenChildrenCount }} more</span>
                </button>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* Connector lines require pseudo-elements - kept minimal */
    .org-connector-horizontal::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      width: 2px;
      height: 100%;
      @apply bg-neutral-300 dark:bg-neutral-600;
    }

    .org-connector-horizontal::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      @apply bg-neutral-300 dark:bg-neutral-600;
    }

    .org-connector-first::after {
      left: 50%;
    }

    .org-connector-last::after {
      right: 50%;
    }

    .org-connector-single::after {
      display: none;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrgChartNodeComponent {
  @Input({ required: true }) node!: OrgChartNode;
  @Input() compact = false;
  @Input() maxDepth?: number;
  @Input() searchQuery = '';

  @Output() nodeClick = new EventEmitter<OrgChartNode>();
  @Output() toggleExpand = new EventEmitter<OrgChartNode>();
  @Output() showMore = new EventEmitter<OrgChartNode>();

  /** Get the visible children based on pagination limit */
  get visibleChildren(): OrgChartNode[] {
    return this.node.children.slice(0, this.node.visibleChildCount);
  }

  /** Check if there are more children to show */
  get hasMoreChildren(): boolean {
    return this.node.children.length > this.node.visibleChildCount;
  }

  /** Get count of hidden children */
  get hiddenChildrenCount(): number {
    return Math.max(0, this.node.children.length - this.node.visibleChildCount);
  }

  /** Handle "Show more" click */
  onShowMore(event: MouseEvent): void {
    event.stopPropagation();
    this.showMore.emit(this.node);
  }

  private readonly statusVariantMap: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
    ACTIVE: 'success',
    ON_LEAVE: 'warning',
    SUSPENDED: 'error',
    TERMINATED: 'neutral',
    RETIRED: 'neutral'
  };

  private readonly statusLabelMap: Record<string, string> = {
    ACTIVE: 'employees.status.active',
    ON_LEAVE: 'employees.status.onLeave',
    SUSPENDED: 'employees.status.suspended',
    TERMINATED: 'employees.status.terminated',
    RETIRED: 'employees.status.retired'
  };

  // Color palette for avatars - using Tailwind-compatible colors
  private readonly avatarColors = [
    '#2563eb', '#dc2626', '#9333ea', '#0d9488',
    '#ea580c', '#7c3aed', '#0891b2', '#16a34a',
    '#4f46e5', '#be185d', '#0e7490', '#78716c'
  ];

  getAvatarClasses(): string {
    const base = 'shrink-0 rounded-full flex items-center justify-center font-semibold text-white';
    const size = this.compact ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
    return `${base} ${size}`;
  }

  getNameClasses(): string {
    const base = 'font-semibold text-neutral-900 dark:text-neutral-100 truncate';
    const size = this.compact ? 'text-xs' : 'text-sm';
    return `${base} ${size}`;
  }

  getTitleClasses(): string {
    const base = 'text-neutral-500 dark:text-neutral-400 truncate mt-0.5';
    const size = this.compact ? 'text-xs' : 'text-xs';
    return `${base} ${size}`;
  }

  getExpandButtonClasses(): string {
    const base = 'absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-primary-500 hover:bg-primary-600 text-white border-2 border-white dark:border-dark-bg rounded-full text-xs font-semibold cursor-pointer transition-colors z-10';
    const position = this.compact ? '-bottom-2.5 py-px px-1' : '-bottom-3 py-0.5 px-1.5';
    return `${base} ${position}`;
  }

  getCardClasses(): string {
    const base = 'relative flex items-center p-4 bg-white dark:bg-dark-bg border border-neutral-200 dark:border-dark-border rounded-xl shadow-sm transition-all text-left font-inherit cursor-pointer hover:shadow-md hover:-translate-y-px focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 group';
    const size = this.compact
      ? 'py-2 px-3 min-w-40 max-w-[200px] gap-2'
      : 'gap-3 min-w-[220px] max-w-[280px]';
    const search = this.node.isSearchMatch
      ? 'border-warning-400 bg-warning-50 dark:bg-warning-900/20 dark:border-warning-600 ring-2 ring-warning-400/30'
      : '';
    return `${base} ${size} ${search}`;
  }

  getStatusVariant(status: string): 'success' | 'warning' | 'error' | 'neutral' {
    return this.statusVariantMap[status] || 'neutral';
  }

  getStatusLabel(status: string): string {
    return this.statusLabelMap[status] || status;
  }

  getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return this.avatarColors[Math.abs(hash) % this.avatarColors.length];
  }

  onCardClick(): void {
    this.nodeClick.emit(this.node);
  }

  onToggleExpand(event: MouseEvent): void {
    event.stopPropagation();
    this.node.expanded = !this.node.expanded;
    this.toggleExpand.emit(this.node);
  }
}
