import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, computed } from '@angular/core';
import { NgClass, NgFor } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

let paginationIdCounter = 0;

@Component({
  selector: 'sw-pagination',
  standalone: true,
  imports: [NgClass, NgFor, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 py-3">
      <!-- Page size selector - TailAdmin style -->
      <div class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <label [for]="pageSizeSelectId" class="sr-only">{{ 'common.pagination.itemsPerPage' | translate }}</label>
        <span aria-hidden="true">{{ 'common.pagination.show' | translate }}</span>
        <select
          [id]="pageSizeSelectId"
          [value]="pageSize"
          (change)="onPageSizeChange($event)"
          class="px-2 py-1 rounded-lg border border-neutral-200 dark:border-dark-border dark:bg-dark-surface text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors duration-200"
          [attr.aria-label]="'common.pagination.itemsPerPage' | translate"
        >
          @for (size of pageSizeOptions; track size) {
            <option [value]="size">{{ size }}</option>
          }
        </select>
        <span>{{ 'common.pagination.ofItems' | translate: { total: total } }}</span>
      </div>

      <!-- Pagination controls - TailAdmin style -->
      <div class="flex items-center gap-1">
        <!-- Previous button -->
        <button
          type="button"
          [disabled]="page <= 1"
          (click)="goToPage(page - 1)"
          class="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          [attr.aria-label]="'common.pagination.previousPage' | translate"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <!-- Page numbers - Active page with teal background -->
        @for (pageNum of visiblePages(); track pageNum) {
          @if (pageNum === -1) {
            <span class="px-2 text-neutral-400">...</span>
          } @else {
            <button
              type="button"
              (click)="goToPage(pageNum)"
              [ngClass]="pageNum === page
                ? 'bg-primary-500 text-white'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-elevated'"
              class="min-w-[36px] h-9 px-3 rounded-lg font-medium text-sm transition-colors duration-200"
            >
              {{ pageNum }}
            </button>
          }
        }

        <!-- Next button -->
        <button
          type="button"
          [disabled]="page >= totalPages()"
          (click)="goToPage(page + 1)"
          class="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          [attr.aria-label]="'common.pagination.nextPage' | translate"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  `
})
export class PaginationComponent {
  @Input() total = 0;
  @Input() page = 1;
  @Input() pageSize = 10;
  @Input() pageSizeOptions = [10, 25, 50, 100];
  @Input() maxVisiblePages = 5;

  readonly pageSizeSelectId = `sw-pagination-select-${++paginationIdCounter}`;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  totalPages = computed(() => Math.ceil(this.total / this.pageSize) || 1);

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.page;
    const max = this.maxVisiblePages;

    if (total <= max) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: number[] = [];
    const half = Math.floor(max / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(total, start + max - 1);

    if (end - start < max - 1) {
      start = Math.max(1, end - max + 1);
    }

    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push(-1); // Ellipsis
      }
    }

    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== total) {
        pages.push(i);
      }
    }

    if (end < total) {
      if (end < total - 1) {
        pages.push(-1); // Ellipsis
      }
      pages.push(total);
    }

    return pages;
  });

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.page) {
      this.pageChange.emit(page);
    }
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newSize = parseInt(select.value, 10);
    this.pageSizeChange.emit(newSize);
    // Reset to first page when changing page size
    this.pageChange.emit(1);
  }
}
