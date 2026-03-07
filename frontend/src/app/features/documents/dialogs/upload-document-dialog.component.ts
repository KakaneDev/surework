import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpEventType, HttpEvent } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  DialogComponent,
  ButtonComponent,
  SpinnerComponent,
  SelectComponent,
  type SelectOption
} from '@shared/ui';
import {
  DocumentService,
  DocumentCategory,
  DocumentVisibility,
  OwnerType,
  EmployeeDocument
} from '@core/services/document.service';
import { selectCurrentUser } from '@core/store/auth/auth.selectors';

export interface UploadDocumentDialogData {
  ownerType?: OwnerType;
  ownerId?: string;
  ownerName?: string;
  preselectedCategory?: DocumentCategory;
}

@Component({
  selector: 'app-upload-document-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, DialogComponent, ButtonComponent, SpinnerComponent, SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sw-dialog [title]="'documents.uploadDialog.title' | translate" [subtitle]="'documents.uploadDialog.subtitle' | translate">
      <div class="space-y-5 min-w-[28rem]">
        <!-- Drop Zone -->
        <div
          class="relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200"
          [ngClass]="{
            'border-primary-400 bg-primary-50 dark:bg-primary-900/10': isDragging(),
            'border-neutral-300 dark:border-dark-border': !isDragging() && !selectedFile(),
            'border-green-400 bg-green-50 dark:bg-green-900/10': selectedFile()
          }"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
        >
          @if (selectedFile()) {
            <div class="flex flex-col items-center gap-3">
              <div class="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <span class="material-icons text-3xl text-green-600 dark:text-green-400">check_circle</span>
              </div>
              <div>
                <p class="font-medium text-neutral-900 dark:text-neutral-100">{{ selectedFile()?.name }}</p>
                <p class="text-sm text-neutral-500">{{ formatFileSize(selectedFile()?.size || 0) }}</p>
              </div>
              <button
                type="button"
                (click)="clearFile()"
                class="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 underline"
              >
                {{ 'documents.uploadDialog.chooseDifferentFile' | translate }}
              </button>
            </div>
          } @else {
            <div class="flex flex-col items-center gap-3">
              <div class="w-14 h-14 rounded-xl bg-neutral-100 dark:bg-dark-elevated flex items-center justify-center">
                <span class="material-icons text-3xl text-neutral-400">cloud_upload</span>
              </div>
              <div>
                <p class="font-medium text-neutral-700 dark:text-neutral-300">
                  {{ 'documents.uploadDialog.dragAndDrop' | translate }}
                </p>
                <p class="text-sm text-neutral-500">{{ 'documents.uploadDialog.or' | translate }}</p>
              </div>
              <label class="sw-btn sw-btn-outline sw-btn-sm cursor-pointer">
                {{ 'documents.uploadDialog.browseFiles' | translate }}
                <input
                  type="file"
                  class="hidden"
                  (change)="onFileSelected($event)"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.csv"
                />
              </label>
              <p class="text-xs text-neutral-400">{{ 'documents.uploadDialog.fileFormatsAndSize' | translate }}</p>
            </div>
          }
        </div>

        <!-- Document Name -->
        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            {{ 'documents.uploadDialog.documentName' | translate }} <span class="text-error-500">*</span>
          </label>
          <input
            type="text"
            [(ngModel)]="documentName"
            [placeholder]="'documents.uploadDialog.enterDocumentName' | translate"
            class="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <!-- Category Selection -->
        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            {{ 'documents.uploadDialog.category' | translate }} <span class="text-error-500">*</span>
          </label>
          <select
            [(ngModel)]="selectedCategory"
            (ngModelChange)="onCategoryChange($event)"
            class="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="" disabled>{{ 'documents.uploadDialog.selectCategory' | translate }}</option>
            @for (group of categoryGroups; track group.name) {
              <optgroup [label]="group.name">
                @for (cat of group.categories; track cat.value) {
                  <option [value]="cat.value">{{ cat.label }}</option>
                }
              </optgroup>
            }
          </select>
        </div>

        <!-- Visibility -->
        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            {{ 'documents.uploadDialog.visibility' | translate }}
          </label>
          <select
            [(ngModel)]="selectedVisibility"
            class="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            @for (vis of visibilityOptions; track vis.value) {
              <option [value]="vis.value">{{ vis.label }}</option>
            }
          </select>
          <p class="text-xs text-neutral-500 mt-1">
            @switch (selectedVisibility) {
              @case ('PRIVATE') { {{ 'documents.uploadDialog.visibilityDescriptions.private' | translate }} }
              @case ('RESTRICTED') { {{ 'documents.uploadDialog.visibilityDescriptions.restricted' | translate }} }
              @case ('DEPARTMENT') { {{ 'documents.uploadDialog.visibilityDescriptions.department' | translate }} }
              @case ('COMPANY') { {{ 'documents.uploadDialog.visibilityDescriptions.company' | translate }} }
              @case ('PUBLIC') { {{ 'documents.uploadDialog.visibilityDescriptions.public' | translate }} }
            }
          </p>
        </div>

        <!-- Description (optional) -->
        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            {{ 'documents.uploadDialog.description' | translate }}
          </label>
          <textarea
            [(ngModel)]="description"
            [placeholder]="'documents.uploadDialog.optionalDescription' | translate"
            rows="2"
            class="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          ></textarea>
        </div>

        <!-- Optional Fields -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              {{ 'documents.uploadDialog.validFrom' | translate }}
            </label>
            <input
              type="date"
              [(ngModel)]="validFrom"
              (ngModelChange)="validateDateRange()"
              [max]="validUntil || undefined"
              class="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              {{ 'documents.uploadDialog.validUntil' | translate }}
            </label>
            <input
              type="date"
              [(ngModel)]="validUntil"
              (ngModelChange)="validateDateRange()"
              [min]="validFrom || undefined"
              class="w-full px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              [class.border-error-500]="dateRangeError()"
            />
          </div>
        </div>
        @if (dateRangeError()) {
          <p class="text-xs text-error-500 -mt-3">{{ 'documents.uploadDialog.dateRangeError' | translate }}</p>
        }

        <!-- Confidential Flag -->
        <label class="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            [(ngModel)]="isConfidential"
            class="w-4 h-4 rounded border-neutral-300 dark:border-dark-border text-primary-500 focus:ring-primary-500"
          />
          <div>
            <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {{ 'documents.uploadDialog.markConfidential' | translate }}
            </span>
            <p class="text-xs text-neutral-500">{{ 'documents.uploadDialog.confidentialDescription' | translate }}</p>
          </div>
        </label>

        <!-- Upload Progress -->
        @if (uploading()) {
          <div class="bg-neutral-50 dark:bg-dark-elevated rounded-lg p-4">
            <div class="flex items-center gap-3 mb-2">
              <sw-spinner size="sm" />
              <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {{ 'documents.uploadDialog.uploading' | translate: {progress: uploadProgress()} }}
              </span>
            </div>
            <div class="h-2 bg-neutral-200 dark:bg-dark-border rounded-full overflow-hidden">
              <div
                class="h-full bg-primary-500 transition-all duration-300"
                [style.width.%]="uploadProgress()"
              ></div>
            </div>
          </div>
        }

        <!-- Error Message -->
        @if (errorMessage()) {
          <div class="bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-400 rounded-lg p-3 text-sm">
            {{ errorMessage() }}
          </div>
        }
      </div>

      <div dialogFooter class="flex gap-3">
        <button
          type="button"
          (click)="onCancel()"
          class="sw-btn sw-btn-outline sw-btn-md"
          [disabled]="uploading()"
        >
          {{ 'common.cancel' | translate }}
        </button>
        <button
          type="button"
          (click)="onUpload()"
          class="sw-btn sw-btn-primary sw-btn-md"
          [disabled]="!canUpload() || uploading()"
        >
          @if (uploading()) {
            <sw-spinner size="sm" />
            {{ 'documents.uploadDialog.uploading' | translate: {progress: uploadProgress()} }}
          } @else {
            <span class="material-icons text-lg">cloud_upload</span>
            {{ 'documents.uploadDialog.upload' | translate }}
          }
        </button>
      </div>
    </sw-dialog>
  `
})
export class UploadDocumentDialogComponent {
  private readonly dialogRef = inject<{ close: (result?: EmployeeDocument) => void }>('DIALOG_REF' as any);
  private readonly dialogData = inject<UploadDocumentDialogData>('DIALOG_DATA' as any, { optional: true });
  private readonly documentService = inject(DocumentService);
  private readonly store = inject(Store);
  private readonly translate = inject(TranslateService);

  private readonly user = toSignal(this.store.select(selectCurrentUser));

  readonly categoryGroups = DocumentService.getCategoryGroups();
  readonly visibilityOptions: { value: DocumentVisibility; label: string }[] = [
    { value: 'PRIVATE', label: this.translate.instant('documents.uploadDialog.visibilityOptions.private') },
    { value: 'RESTRICTED', label: this.translate.instant('documents.uploadDialog.visibilityOptions.restricted') },
    { value: 'DEPARTMENT', label: this.translate.instant('documents.uploadDialog.visibilityOptions.department') },
    { value: 'COMPANY', label: this.translate.instant('documents.uploadDialog.visibilityOptions.company') },
    { value: 'PUBLIC', label: this.translate.instant('documents.uploadDialog.visibilityOptions.public') }
  ];

  // Form state
  selectedFile = signal<File | null>(null);
  documentName = '';
  selectedCategory: DocumentCategory | '' = this.dialogData?.preselectedCategory || '';
  selectedVisibility: DocumentVisibility = 'PRIVATE';
  description = '';
  validFrom = '';
  validUntil = '';
  isConfidential = false;

  // UI state
  isDragging = signal(false);
  uploading = signal(false);
  uploadProgress = signal(0);
  errorMessage = signal('');
  dateRangeError = signal(false);

  canUpload = computed(() => {
    return this.selectedFile() !== null &&
           this.documentName.trim() !== '' &&
           this.selectedCategory !== '' &&
           !this.dateRangeError();
  });

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.setFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.setFile(input.files[0]);
    }
  }

  private setFile(file: File): void {
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      this.errorMessage.set(this.translate.instant('documents.uploadDialog.fileSizeError'));
      return;
    }

    this.selectedFile.set(file);
    this.errorMessage.set('');

    // Auto-fill document name if empty
    if (!this.documentName) {
      this.documentName = file.name.replace(/\.[^/.]+$/, '');
    }
  }

  clearFile(): void {
    this.selectedFile.set(null);
  }

  onCategoryChange(category: DocumentCategory): void {
    // Auto-suggest visibility based on category
    this.selectedVisibility = DocumentService.getSuggestedVisibility(category);
  }

  /** Validates that validFrom is before validUntil when both are set */
  validateDateRange(): void {
    if (this.validFrom && this.validUntil) {
      const from = new Date(this.validFrom);
      const until = new Date(this.validUntil);
      this.dateRangeError.set(from >= until);
    } else {
      this.dateRangeError.set(false);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onUpload(): void {
    const file = this.selectedFile();
    const user = this.user();

    if (!file || !user) {
      this.errorMessage.set(this.translate.instant('documents.uploadDialog.uploadError'));
      return;
    }

    const ownerType = this.dialogData?.ownerType || 'EMPLOYEE';
    const ownerId = this.dialogData?.ownerId || user.employeeId || '';

    if (!ownerId) {
      this.errorMessage.set(this.translate.instant('documents.uploadDialog.ownerDeterminationError'));
      return;
    }

    this.uploading.set(true);
    this.uploadProgress.set(0);
    this.errorMessage.set('');

    const metadata = {
      name: this.documentName.trim(),
      description: this.description.trim() || undefined,
      category: this.selectedCategory as DocumentCategory,
      ownerType,
      ownerId,
      ownerName: this.dialogData?.ownerName,
      visibility: this.selectedVisibility,
      validFrom: this.validFrom || undefined,
      validUntil: this.validUntil || undefined,
      confidential: this.isConfidential
    };

    this.documentService.uploadDocument(file, metadata, user.userId).subscribe({
      next: (event: HttpEvent<EmployeeDocument>) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress.set(Math.round(100 * event.loaded / event.total));
        } else if (event.type === HttpEventType.Response && event.body) {
          this.uploading.set(false);
          this.dialogRef.close(event.body);
        }
      },
      error: (err) => {
        this.uploading.set(false);
        this.errorMessage.set(err?.error?.message || this.translate.instant('documents.uploadDialog.uploadFailedError'));
      }
    });
  }
}
