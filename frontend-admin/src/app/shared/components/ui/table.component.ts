import { Component, Input, Output, EventEmitter, ContentChildren, QueryList, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="max-w-full overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead class="bg-gray-50/80 dark:bg-gray-800/30">
            <tr>
              @for (column of columns; track column.key) {
                <th
                  [style.width]="column.width"
                  [class]="getHeaderClass(column)"
                  (click)="column.sortable && onSort(column.key)"
                >
                  <div class="flex items-center gap-1.5">
                    {{ column.label }}
                    @if (column.sortable) {
                      <svg class="h-4 w-4 text-gray-400" [class.text-brand-500]="sortBy === column.key" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        @if (sortBy === column.key && sortDirection === 'asc') {
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                        } @else if (sortBy === column.key && sortDirection === 'desc') {
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        } @else {
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
                        }
                      </svg>
                    }
                  </div>
                </th>
              }
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
            @if (loading) {
              @for (i of [1, 2, 3, 4, 5]; track i) {
                <tr>
                  @for (column of columns; track column.key) {
                    <td class="px-5 py-4">
                      <div class="h-4 w-full rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"></div>
                    </td>
                  }
                </tr>
              }
            } @else if (data.length === 0) {
              <tr>
                <td [attr.colspan]="columns.length" class="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  {{ emptyMessage }}
                </td>
              </tr>
            } @else {
              <ng-content></ng-content>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class TableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() loading = false;
  @Input() emptyMessage = 'No data available';
  @Input() sortBy?: string;
  @Input() sortDirection: 'asc' | 'desc' = 'asc';
  @Output() sort = new EventEmitter<{ key: string; direction: 'asc' | 'desc' }>();

  onSort(key: string): void {
    const direction = this.sortBy === key && this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sort.emit({ key, direction });
  }

  getHeaderClass(column: TableColumn): string {
    const baseClasses = 'px-5 py-4 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400';
    const alignClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right'
    };
    const cursorClass = column.sortable ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors' : '';

    return `${baseClasses} ${alignClasses[column.align || 'left']} ${cursorClass}`;
  }
}
