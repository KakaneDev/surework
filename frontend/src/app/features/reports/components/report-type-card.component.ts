import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

export type ReportTypeBadge = 'popular' | 'new' | 'recommended' | null;

@Component({
  selector: 'app-report-type-card',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <button
      type="button"
      class="group relative w-full text-left p-4 rounded-xl border-2 transition-colors duration-normal focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      [class]="getCardClasses()"
      (click)="onSelect()"
    >
      <!-- Badge -->
      @if (badge) {
        <div
          class="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-medium"
          [class]="getBadgeClasses()"
        >
          {{ getBadgeLabel() }}
        </div>
      }

      <div class="flex items-start gap-3">
        <!-- Icon -->
        <div
          class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-fast"
          [class]="getIconClasses()"
        >
          <span class="material-icons" [class]="getIconTextClass()">{{ icon }}</span>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <h4 class="font-medium text-neutral-900 dark:text-neutral-100 truncate">{{ title }}</h4>
            @if (selected) {
              <span class="material-icons text-green-500 text-lg">check_circle</span>
            }
          </div>
          @if (description) {
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">{{ description }}</p>
          }
        </div>
      </div>

      <!-- Hover indicator -->
      @if (selected) {
        <div
          class="absolute inset-0 rounded-xl ring-2 ring-inset ring-primary-500 dark:ring-primary-400 pointer-events-none"
        ></div>
      }
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportTypeCardComponent {
  private readonly translate = inject(TranslateService);

  @Input() title = '';
  @Input() description?: string;
  @Input() icon = 'description';
  @Input() selected = false;
  @Input() badge: ReportTypeBadge = null;

  @Output() selectCard = new EventEmitter<void>();

  getCardClasses(): string {
    const baseClasses = 'bg-white dark:bg-dark-surface';

    if (this.selected) {
      return `${baseClasses} border-primary-500 dark:border-primary-400 shadow-md`;
    }
    return `${baseClasses} border-neutral-200 dark:border-dark-border hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-sm`;
  }

  getIconClasses(): string {
    if (this.selected) {
      return 'bg-primary-500 text-white';
    }
    return 'bg-neutral-100 dark:bg-dark-border text-neutral-500 dark:text-neutral-400 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:text-primary-500';
  }

  getIconTextClass(): string {
    return this.selected ? 'text-white' : '';
  }

  getBadgeClasses(): string {
    switch (this.badge) {
      case 'popular':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'new':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'recommended':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return '';
    }
  }

  getBadgeLabel(): string {
    switch (this.badge) {
      case 'popular':
        return this.translate.instant('reports.typeCard.popular');
      case 'new':
        return this.translate.instant('reports.typeCard.new');
      case 'recommended':
        return this.translate.instant('reports.typeCard.recommended');
      default:
        return '';
    }
  }

  onSelect(): void {
    this.selectCard.emit();
  }
}
