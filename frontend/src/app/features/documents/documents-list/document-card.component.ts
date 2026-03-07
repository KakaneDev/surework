import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IconButtonComponent } from '@shared/ui';
import { DocumentService, EmployeeDocument } from '@core/services/document.service';

@Component({
  selector: 'app-document-card',
  standalone: true,
  imports: [CommonModule, TranslateModule, IconButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="button"
      tabindex="0"
      class="group relative bg-white dark:bg-dark-surface rounded-xl p-4 border border-neutral-200 dark:border-dark-border hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 transition-all cursor-pointer"
      (click)="onView.emit(document)"
      (keydown.enter)="onView.emit(document)"
      (keydown.space)="onView.emit(document); $event.preventDefault()"
      [attr.aria-label]="'documents.card.view' | translate: { name: document.name }"
    >
      <div class="flex items-start gap-3">
        <!-- Category Icon -->
        <div [class]="'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ' + getCategoryColor(document.category)">
          <span class="material-icons text-2xl">{{ getCategoryIcon(document.category) }}</span>
        </div>

        <!-- Document Info -->
        <div class="flex-1 min-w-0">
          <h3 class="font-medium text-neutral-900 dark:text-neutral-100 truncate pr-16" [title]="document.name">
            {{ document.name }}
          </h3>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ document.categoryName }}</p>
          <div class="flex items-center gap-2 mt-1.5 flex-wrap">
            <span class="inline-flex items-center gap-1 text-xs text-neutral-400">
              <span class="material-icons text-xs">schedule</span>
              {{ document.uploadedAt | date:'MMM d, y' }}
            </span>
            <span class="text-neutral-300 dark:text-neutral-600">|</span>
            <span class="text-xs text-neutral-400">{{ document.formattedFileSize }}</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons (visible on hover and focus-within) -->
      <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex gap-1">
        <sw-icon-button
          variant="secondary"
          size="sm"
          (clicked)="onDownload.emit(document); $event.stopPropagation()"
          [ariaLabel]="'documents.card.download' | translate"
        >
          <span class="material-icons text-sm">download</span>
        </sw-icon-button>
        @if (showArchive) {
          <sw-icon-button
            variant="secondary"
            size="sm"
            (clicked)="onArchive.emit(document); $event.stopPropagation()"
            [ariaLabel]="'documents.card.archive' | translate"
          >
            <span class="material-icons text-sm">archive</span>
          </sw-icon-button>
        }
        @if (showDelete) {
          <sw-icon-button
            variant="danger"
            size="sm"
            (clicked)="onDelete.emit(document); $event.stopPropagation()"
            [ariaLabel]="'documents.card.delete' | translate"
          >
            <span class="material-icons text-sm">delete</span>
          </sw-icon-button>
        }
      </div>

      <!-- Status Badges -->
      <div class="absolute bottom-3 right-3 flex gap-1.5">
        @if (document.expired) {
          <span class="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium">
            {{ 'documents.card.status.expired' | translate }}
          </span>
        } @else if (isExpiringSoon(document)) {
          <span class="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 font-medium">
            {{ 'documents.card.status.expiring' | translate }}
          </span>
        }
        @if (document.confidential) {
          <span class="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 font-medium inline-flex items-center gap-1">
            <span class="material-icons text-xs">lock</span>
            {{ 'documents.card.status.confidential' | translate }}
          </span>
        }
        @if (document.status === 'ARCHIVED') {
          <span class="px-2 py-0.5 text-xs rounded-full bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 font-medium">
            {{ 'documents.card.status.archived' | translate }}
          </span>
        }
      </div>

      <!-- File Type Indicator (hidden on hover/focus to show actions) -->
      <div class="absolute top-3 right-3 group-hover:hidden group-focus-within:hidden">
        <span class="text-xs font-medium text-neutral-400 uppercase">
          {{ getFileExtension(document.fileName) }}
        </span>
      </div>
    </div>
  `
})
export class DocumentCardComponent {
  private readonly translate = inject(TranslateService);

  @Input({ required: true }) document!: EmployeeDocument;
  @Input() showArchive = true;
  @Input() showDelete = false;

  @Output() onView = new EventEmitter<EmployeeDocument>();
  @Output() onDownload = new EventEmitter<EmployeeDocument>();
  @Output() onArchive = new EventEmitter<EmployeeDocument>();
  @Output() onDelete = new EventEmitter<EmployeeDocument>();

  /** Delegate to centralized service method */
  getCategoryIcon(category: string): string {
    return DocumentService.getCategoryIcon(category);
  }

  /** Delegate to centralized service method */
  getCategoryColor(category: string): string {
    return DocumentService.getCategoryColor(category);
  }

  /** Delegate to centralized service method */
  isExpiringSoon(doc: EmployeeDocument): boolean {
    return DocumentService.isExpiringSoon(doc);
  }

  /** Delegate to centralized service method */
  getFileExtension(fileName: string): string {
    return DocumentService.getFileExtension(fileName);
  }
}
