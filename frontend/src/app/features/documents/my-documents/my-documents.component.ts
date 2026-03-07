import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonComponent, IconButtonComponent, SpinnerComponent } from '@shared/ui';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { DocumentService, EmployeeDocument, DocumentCategory } from '@core/services/document.service';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '@core/store/auth/auth.selectors';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-my-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ButtonComponent, IconButtonComponent, SpinnerComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
            <span class="material-icons text-white text-2xl">folder_special</span>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ 'documents.myDocuments.title' | translate }}</h1>
            <p class="text-neutral-500 dark:text-neutral-400">{{ 'documents.myDocuments.subtitle' | translate }}</p>
          </div>
        </div>
        <label class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                      cursor-pointer transition-all duration-200
                      border-2 border-primary-500 text-primary-600 dark:text-primary-400
                      hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:shadow-sm">
          <span class="material-icons text-lg">cloud_upload</span>
          {{ 'documents.myDocuments.uploadDocument' | translate }}
          <input type="file" class="hidden" (change)="onFileSelected($event)" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />
        </label>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-dark-surface rounded-xl p-4 border border-neutral-200 dark:border-dark-border">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span class="material-icons text-primary-600 dark:text-primary-400">description</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ documents().length }}</p>
              <p class="text-xs text-neutral-500">{{ 'documents.myDocuments.stats.totalFiles' | translate }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-dark-surface rounded-xl p-4 border border-neutral-200 dark:border-dark-border">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span class="material-icons text-green-600 dark:text-green-400">verified</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ getActiveCount() }}</p>
              <p class="text-xs text-neutral-500">{{ 'documents.myDocuments.stats.active' | translate }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-dark-surface rounded-xl p-4 border border-neutral-200 dark:border-dark-border">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <span class="material-icons text-yellow-600 dark:text-yellow-400">schedule</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ getExpiringCount() }}</p>
              <p class="text-xs text-neutral-500">{{ 'documents.myDocuments.stats.expiringSoon' | translate }}</p>
            </div>
          </div>
        </div>
        <div class="bg-white dark:bg-dark-surface rounded-xl p-4 border border-neutral-200 dark:border-dark-border">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <span class="material-icons text-purple-600 dark:text-purple-400">lock</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ getConfidentialCount() }}</p>
              <p class="text-xs text-neutral-500">{{ 'documents.myDocuments.stats.confidential' | translate }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Document Categories -->
      <div class="flex flex-wrap items-center gap-3">
        <button
          (click)="selectedCategory.set(null)"
          [class]="getCategoryPillClass(null)">
          {{ 'documents.myDocuments.allDocuments' | translate }}
        </button>
        @for (cat of categories; track cat.value) {
          <button
            (click)="selectedCategory.set(cat.value)"
            [class]="getCategoryPillClass(cat.value)">
            <span class="material-icons text-base">{{ cat.icon }}</span>
            {{ cat.labelKey | translate }}
          </button>
        }
      </div>

      <!-- Main Content -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
        <!-- Search & Filters -->
        <div class="p-4 border-b border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-elevated">
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="relative flex-1">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-neutral-400 text-xl">search</span>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                [placeholder]="'documents.myDocuments.searchPlaceholder' | translate"
                class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
            <div class="flex gap-2">
              <button class="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                             text-neutral-600 dark:text-neutral-400
                             bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border
                             hover:bg-neutral-50 dark:hover:bg-dark-elevated hover:text-neutral-900 dark:hover:text-neutral-200
                             transition-all duration-200">
                <span class="material-icons text-lg">filter_list</span>
                {{ 'common.filter' | translate }}
              </button>
              <button class="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                             text-neutral-600 dark:text-neutral-400
                             bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border
                             hover:bg-neutral-50 dark:hover:bg-dark-elevated hover:text-neutral-900 dark:hover:text-neutral-200
                             transition-all duration-200">
                <span class="material-icons text-lg">sort</span>
                {{ 'common.sort' | translate }}
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        @if (loading()) {
          <div class="p-12 text-center flex flex-col items-center">
            <sw-spinner size="lg" />
            <p class="mt-4 text-neutral-500">{{ 'documents.myDocuments.loading' | translate }}</p>
          </div>
        }

        <!-- Empty State -->
        @else if (filteredDocuments().length === 0) {
          <div class="p-12 text-center">
            <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-dark-elevated dark:to-dark-border flex items-center justify-center">
              <span class="material-icons text-5xl text-neutral-400 dark:text-neutral-500">folder_open</span>
            </div>
            <h2 class="text-xl font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{{ 'documents.myDocuments.noDocuments' | translate }}</h2>
            <p class="text-neutral-500 dark:text-neutral-400 mb-6 max-w-md mx-auto">
              @if (searchQuery || selectedCategory()) {
                {{ 'documents.myDocuments.noMatchingDocuments' | translate }}
              } @else {
                {{ 'documents.myDocuments.emptyStateMessage' | translate }}
              }
            </p>
            <label class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium
                          cursor-pointer transition-all duration-200
                          bg-primary-500 text-white hover:bg-primary-600
                          shadow-sm hover:shadow-md">
              <span class="material-icons text-lg">cloud_upload</span>
              {{ 'documents.myDocuments.uploadFirstDocument' | translate }}
              <input type="file" class="hidden" (change)="onFileSelected($event)" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />
            </label>
          </div>
        }

        <!-- Documents Grid -->
        @else {
          <div class="p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (doc of filteredDocuments(); track doc.id) {
                <div class="group relative bg-neutral-50 dark:bg-dark-elevated rounded-xl p-4 border border-neutral-200 dark:border-dark-border hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all cursor-pointer">
                  <div class="flex items-start gap-3">
                    <div [class]="'w-12 h-12 rounded-lg flex items-center justify-center ' + getCategoryColor(doc.category)">
                      <span class="material-icons text-2xl">{{ getCategoryIcon(doc.category) }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="font-medium text-neutral-900 dark:text-neutral-100 truncate">{{ doc.name }}</h3>
                      <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ doc.categoryName }}</p>
                      <div class="flex items-center gap-2 mt-1">
                        <span class="text-xs text-neutral-400">{{ doc.formattedFileSize }}</span>
                        <span class="text-neutral-300">•</span>
                        <span class="text-xs text-neutral-400">{{ doc.uploadedAt | date:'MMM d, y' }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Action buttons on hover -->
                  <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <sw-icon-button variant="secondary" size="sm" (clicked)="downloadDocument(doc)" [ariaLabel]="'common.download' | translate">
                      <span class="material-icons text-sm">download</span>
                    </sw-icon-button>
                    <sw-icon-button variant="secondary" size="sm" [ariaLabel]="'common.moreOptions' | translate">
                      <span class="material-icons text-sm">more_vert</span>
                    </sw-icon-button>
                  </div>

                  <!-- Status badge -->
                  @if (doc.expired) {
                    <span class="absolute bottom-2 right-2 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{{ 'documents.myDocuments.status.expired' | translate }}</span>
                  } @else if (doc.confidential) {
                    <span class="absolute bottom-2 right-2 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">{{ 'documents.myDocuments.status.confidential' | translate }}</span>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Upload Progress -->
      @if (uploading()) {
        <div class="fixed bottom-4 right-4 bg-white dark:bg-dark-surface rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border p-4 w-80">
          <div class="flex items-center gap-3">
            <sw-spinner size="md" />
            <div class="flex-1">
              <p class="font-medium text-neutral-900 dark:text-neutral-100">{{ 'documents.myDocuments.uploading' | translate }}</p>
              <p class="text-sm text-neutral-500 truncate">{{ uploadingFileName() }}</p>
            </div>
          </div>
          <div class="mt-3 h-1.5 bg-neutral-200 dark:bg-dark-border rounded-full overflow-hidden">
            <div class="h-full bg-primary-500 transition-all duration-300" [style.width.%]="uploadProgress()"></div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyDocumentsComponent implements OnInit {
  private readonly documentService = inject(DocumentService);
  private readonly store = inject(Store);

  private readonly user = toSignal(this.store.select(selectCurrentUser));

  documents = signal<EmployeeDocument[]>([]);
  loading = signal(true);
  searchQuery = '';
  selectedCategory = signal<DocumentCategory | null>(null);

  uploading = signal(false);
  uploadingFileName = signal('');
  uploadProgress = signal(0);

  categories = [
    { value: 'ID_DOCUMENT' as DocumentCategory, labelKey: 'documents.categories.idDocuments', icon: 'badge' },
    { value: 'EMPLOYMENT_CONTRACT' as DocumentCategory, labelKey: 'documents.categories.contracts', icon: 'description' },
    { value: 'QUALIFICATION' as DocumentCategory, labelKey: 'documents.categories.qualifications', icon: 'school' },
    { value: 'OTHER' as DocumentCategory, labelKey: 'documents.categories.other', icon: 'folder' },
  ];

  ngOnInit(): void {
    this.loadDocuments();
  }

  private loadDocuments(): void {
    const user = this.user();
    if (!user?.employeeId) {
      this.loading.set(false);
      return;
    }

    this.documentService.getEmployeeDocuments(user.employeeId).subscribe({
      next: (docs: EmployeeDocument[]) => {
        this.documents.set(docs);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  filteredDocuments(): EmployeeDocument[] {
    let docs = this.documents();

    if (this.selectedCategory()) {
      docs = docs.filter(d => d.category === this.selectedCategory());
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      docs = docs.filter(d =>
        d.name.toLowerCase().includes(query) ||
        d.categoryName.toLowerCase().includes(query)
      );
    }

    return docs;
  }

  getActiveCount(): number {
    return this.documents().filter(d => d.status === 'ACTIVE' && !d.expired).length;
  }

  getExpiringCount(): number {
    return this.documents().filter(d => {
      if (!d.validUntil) return false;
      const expiry = new Date(d.validUntil);
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return expiry <= thirtyDaysFromNow && expiry > now;
    }).length;
  }

  getConfidentialCount(): number {
    return this.documents().filter(d => d.confidential).length;
  }

  getCategoryIcon(category: string): string {
    return DocumentService.getCategoryIcon(category);
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      ID_DOCUMENT: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
      EMPLOYMENT_CONTRACT: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      QUALIFICATION: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      PAYSLIP: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      CV: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
    };
    return colors[category] || 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400';
  }

  getCategoryPillClass(category: DocumentCategory | null): string {
    const isSelected = this.selectedCategory() === category;
    const base = 'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200';

    if (isSelected) {
      return `${base} bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 border border-primary-200 dark:border-primary-800 shadow-sm`;
    }
    return `${base} bg-white text-neutral-600 dark:bg-dark-surface dark:text-neutral-400 border border-neutral-200 dark:border-dark-border hover:bg-neutral-50 dark:hover:bg-dark-elevated hover:text-neutral-900 dark:hover:text-neutral-200`;
  }

  downloadDocument(doc: EmployeeDocument): void {
    this.documentService.downloadDocument(doc.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const user = this.user();
    if (!user?.employeeId) return;

    this.uploadingFileName.set(file.name);
    this.uploading.set(true);
    this.uploadProgress.set(0);

    const metadata = {
      name: file.name.replace(/\.[^/.]+$/, ''),
      category: 'OTHER' as DocumentCategory,
      ownerType: 'EMPLOYEE' as const,
      ownerId: user.employeeId,
    };

    this.documentService.uploadDocument(file, metadata, user.userId).subscribe({
      next: (event: HttpEvent<EmployeeDocument>) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress.set(Math.round(100 * event.loaded / event.total));
        } else if (event.type === HttpEventType.Response) {
          this.uploading.set(false);
          this.loadDocuments();
        }
      },
      error: () => {
        this.uploading.set(false);
      }
    });

    input.value = '';
  }
}
