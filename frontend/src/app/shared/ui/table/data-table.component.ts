import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ContentChild, TemplateRef } from '@angular/core';
import { NgClass, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';

export interface TableColumn<T = unknown> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  template?: TemplateRef<{ $implicit: T; row: T; index: number }>;
}

export interface SortEvent {
  column: string;
  direction: 'asc' | 'desc' | null;
}

@Component({
  selector: 'sw-data-table',
  standalone: true,
  imports: [NgClass, NgFor, NgIf, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- TailAdmin style table container with rounded corners -->
    <div class="overflow-x-auto rounded-xl border border-neutral-200 dark:border-dark-border">
      <table class="min-w-full divide-y divide-neutral-200 dark:divide-dark-border">
        <thead class="bg-neutral-50 dark:bg-dark-surface/50">
          <tr>
            @for (col of columns; track col.key) {
              <th
                scope="col"
                [ngClass]="getHeaderClasses(col)"
                [style.width]="col.width"
                (click)="col.sortable ? onSort(col.key) : null"
              >
                <div class="flex items-center gap-1">
                  {{ col.header }}
                  @if (col.sortable) {
                    <span class="text-neutral-400">
                      @if (sortColumn === col.key) {
                        @if (sortDirection === 'asc') {
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                          </svg>
                        } @else if (sortDirection === 'desc') {
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        }
                      } @else {
                        <svg class="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      }
                    </span>
                  }
                </div>
              </th>
            }
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-neutral-100 dark:bg-dark-bg dark:divide-dark-border">
          @if (loading) {
            <tr>
              <td [attr.colspan]="columns.length" class="px-4 py-8 text-center">
                <div class="flex justify-center">
                  <span class="sw-spinner sw-spinner-md"></span>
                </div>
              </td>
            </tr>
          } @else if (data.length === 0) {
            <tr>
              <td [attr.colspan]="columns.length" class="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400">
                {{ emptyMessage }}
              </td>
            </tr>
          } @else {
            @for (row of data; track trackByFn ? trackByFn($index, row) : $index; let i = $index) {
              <tr
                class="hover:bg-neutral-50 dark:hover:bg-dark-elevated/30 transition-colors duration-200"
                [class.cursor-pointer]="clickable"
                [attr.role]="clickable ? 'button' : null"
                [attr.tabindex]="clickable ? 0 : null"
                (click)="onRowClick(row, i)"
                (keydown.enter)="clickable ? onRowClick(row, i) : null"
                (keydown.space)="clickable ? handleRowKeydown($any($event), row, i) : null"
              >
                @for (col of columns; track col.key) {
                  <td [ngClass]="getCellClasses(col)">
                    @if (col.template) {
                      <ng-container *ngTemplateOutlet="col.template; context: { $implicit: getValue(row, col.key), row: row, index: i }" />
                    } @else {
                      {{ getValue(row, col.key) }}
                    }
                  </td>
                }
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
  `
})
export class DataTableComponent<T = unknown> {
  @Input() columns: TableColumn<T>[] = [];
  @Input() data: T[] = [];
  @Input() loading = false;
  @Input() emptyMessage = 'No data available';
  @Input() clickable = false;
  @Input() sortColumn = '';
  @Input() sortDirection: 'asc' | 'desc' | null = null;
  @Input() trackByFn?: (index: number, item: T) => unknown;

  @Output() sort = new EventEmitter<SortEvent>();
  @Output() rowClick = new EventEmitter<{ row: T; index: number }>();

  getHeaderClasses(col: TableColumn<T>): string {
    // TailAdmin style header with clean typography
    const base = 'px-4 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-400';
    const align = col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left';
    const sortable = col.sortable ? 'cursor-pointer hover:bg-neutral-100 dark:hover:bg-dark-elevated select-none transition-colors duration-200' : '';

    return `${base} ${align} ${sortable}`;
  }

  getCellClasses(col: TableColumn<T>): string {
    const base = 'px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100';
    const align = col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left';

    return `${base} ${align}`;
  }

  getValue(row: T, key: string): unknown {
    const keys = key.split('.');
    let value: unknown = row;
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    return value;
  }

  onSort(column: string): void {
    let direction: 'asc' | 'desc' | null = 'asc';

    if (this.sortColumn === column) {
      if (this.sortDirection === 'asc') {
        direction = 'desc';
      } else if (this.sortDirection === 'desc') {
        direction = null;
      }
    }

    this.sort.emit({ column, direction });
  }

  onRowClick(row: T, index: number): void {
    if (this.clickable) {
      this.rowClick.emit({ row, index });
    }
  }

  handleRowKeydown(event: KeyboardEvent, row: T, index: number): void {
    event.preventDefault(); // Prevent page scroll on space
    this.onRowClick(row, index);
  }
}
