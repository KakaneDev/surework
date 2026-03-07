import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { SpinnerComponent, DialogService, ToastService, ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/ui';
import {
  DocumentService,
  EmployeeDocument,
  DocumentCategory,
  DocumentStatus
} from '@core/services/document.service';
import { selectCurrentUser, selectUserPermissions } from '@core/store/auth/auth.selectors';
import { DocumentCardComponent } from './document-card.component';
import { UploadDocumentDialogComponent, UploadDocumentDialogData } from '../dialogs/upload-document-dialog.component';

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'active' | 'expiring' | 'archived';

@Component({
  selector: 'app-documents-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule, SpinnerComponent, DocumentCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
            <span class="material-icons text-white text-2xl">folder</span>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ 'documents.list.title' | translate }}</h1>
            <p class="text-neutral-500 dark:text-neutral-400">{{ 'documents.list.subtitle' | translate }}</p>
          </div>
        </div>
        @if (canUpload()) {
          <button
            (click)="openUploadDialog()"
            class="sw-btn sw-btn-primary sw-btn-md shrink-0 whitespace-nowrap"
            [attr.aria-label]="'documents.list.uploadButton' | translate"
          >
            <span class="material-icons text-lg">cloud_upload</span>
            {{ 'documents.list.uploadButton' | translate }}
          </button>
        }
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-dark-surface rounded-xl p-4 border border-neutral-200 dark:border-dark-border">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span class="material-icons text-primary-600 dark:text-primary-400">description</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ documents().length }}</p>
              <p class="text-xs text-neutral-500">{{ 'documents.list.stats.totalFiles' | translate }}</p>
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
              <p class="text-xs text-neutral-500">{{ 'documents.list.stats.active' | translate }}</p>
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
              <p class="text-xs text-neutral-500">{{ 'documents.list.stats.expiringSoon' | translate }}</p>
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
              <p class="text-xs text-neutral-500">{{ 'documents.list.stats.confidential' | translate }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Access Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          routerLink="/documents/templates"
          class="group block bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-5 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span class="material-icons text-primary-600 dark:text-primary-400">description</span>
            </div>
            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">{{ 'documents.list.quickAccess.templates.title' | translate }}</h3>
              <p class="text-sm text-neutral-500">{{ 'documents.list.quickAccess.templates.description' | translate }}</p>
            </div>
            <span class="material-icons ml-auto text-neutral-300 group-hover:text-primary-500 transition-colors">
              chevron_right
            </span>
          </div>
        </a>

        <a
          routerLink="/documents/policies"
          class="group block bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-5 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span class="material-icons text-green-600 dark:text-green-400">policy</span>
            </div>
            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">{{ 'documents.list.quickAccess.policies.title' | translate }}</h3>
              <p class="text-sm text-neutral-500">{{ 'documents.list.quickAccess.policies.description' | translate }}</p>
            </div>
            <span class="material-icons ml-auto text-neutral-300 group-hover:text-primary-500 transition-colors">
              chevron_right
            </span>
          </div>
        </a>

        <a
          routerLink="/documents/hr"
          class="group block bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-5 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all"
        >
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span class="material-icons text-purple-600 dark:text-purple-400">folder_shared</span>
            </div>
            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">{{ 'documents.list.quickAccess.hrDocuments.title' | translate }}</h3>
              <p class="text-sm text-neutral-500">{{ 'documents.list.quickAccess.hrDocuments.description' | translate }}</p>
            </div>
            <span class="material-icons ml-auto text-neutral-300 group-hover:text-primary-500 transition-colors">
              chevron_right
            </span>
          </div>
        </a>
      </div>

      <!-- Document List Section -->
      <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
        <!-- Search & Filters -->
        <div class="p-4 border-b border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-elevated">
          <div class="flex flex-col lg:flex-row gap-4">
            <!-- Search -->
            <div class="relative flex-1">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-neutral-400 text-xl">search</span>
              <input
                type="text"
                [ngModel]="searchQuery()"
                (ngModelChange)="searchQuery.set($event)"
                [attr.placeholder]="'documents.list.searchPlaceholder' | translate"
                class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>

            <!-- Filters -->
            <div class="flex flex-wrap gap-2">
              <!-- Category Filter -->
              <select
                [ngModel]="selectedCategory()"
                (ngModelChange)="selectedCategory.set($event)"
                class="px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{{ 'documents.list.filters.allCategories' | translate }}</option>
                @for (group of categoryGroups; track group.name) {
                  <optgroup [label]="group.name">
                    @for (cat of group.categories; track cat.value) {
                      <option [value]="cat.value">{{ cat.label }}</option>
                    }
                  </optgroup>
                }
              </select>

              <!-- Status Filter -->
              <select
                [ngModel]="selectedStatus()"
                (ngModelChange)="selectedStatus.set($event)"
                class="px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">{{ 'documents.list.filters.allStatus' | translate }}</option>
                <option value="active">{{ 'documents.list.filters.active' | translate }}</option>
                <option value="expiring">{{ 'documents.list.filters.expiringSoon' | translate }}</option>
                <option value="archived">{{ 'documents.list.filters.archived' | translate }}</option>
              </select>

              <!-- View Toggle -->
              <div class="flex border border-neutral-200 dark:border-dark-border rounded-lg overflow-hidden">
                <button
                  (click)="viewMode.set('grid')"
                  [class.bg-primary-500]="viewMode() === 'grid'"
                  [class.text-white]="viewMode() === 'grid'"
                  [class.bg-white]="viewMode() !== 'grid'"
                  [class.dark:bg-dark-surface]="viewMode() !== 'grid'"
                  [class.text-neutral-600]="viewMode() !== 'grid'"
                  class="px-3 py-2 transition-colors"
                >
                  <span class="material-icons text-lg">grid_view</span>
                </button>
                <button
                  (click)="viewMode.set('list')"
                  [class.bg-primary-500]="viewMode() === 'list'"
                  [class.text-white]="viewMode() === 'list'"
                  [class.bg-white]="viewMode() !== 'list'"
                  [class.dark:bg-dark-surface]="viewMode() !== 'list'"
                  [class.text-neutral-600]="viewMode() !== 'list'"
                  class="px-3 py-2 transition-colors"
                >
                  <span class="material-icons text-lg">view_list</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        @if (loading()) {
          <div class="p-12 text-center flex flex-col items-center">
            <sw-spinner size="lg" />
            <p class="mt-4 text-neutral-500">{{ 'documents.list.loadingDocuments' | translate }}</p>
          </div>
        }

        <!-- Empty State -->
        @else if (filteredDocuments().length === 0) {
          <div class="p-12 text-center">
            <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-dark-elevated dark:to-dark-border flex items-center justify-center">
              <span class="material-icons text-5xl text-neutral-400 dark:text-neutral-500">folder_open</span>
            </div>
            <h2 class="text-xl font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{{ 'documents.list.empty.title' | translate }}</h2>
            <p class="text-neutral-500 dark:text-neutral-400 mb-6 max-w-md mx-auto">
              @if (searchQuery() || selectedCategory() || selectedStatus() !== 'all') {
                {{ 'documents.list.empty.filteredMessage' | translate }}
              } @else {
                {{ 'documents.list.empty.noDocuments' | translate }}
              }
            </p>
            @if (canUpload() && !searchQuery() && !selectedCategory() && selectedStatus() === 'all') {
              <button
                (click)="openUploadDialog()"
                class="sw-btn sw-btn-primary sw-btn-md"
                [attr.aria-label]="'documents.list.uploadFirstDocument' | translate"
              >
                <span class="material-icons text-lg">cloud_upload</span>
                {{ 'documents.list.uploadFirstDocument' | translate }}
              </button>
            }
          </div>
        }

        <!-- Documents Grid/List -->
        @else {
          <div class="p-4">
            @if (viewMode() === 'grid') {
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                @for (doc of filteredDocuments(); track doc.id) {
                  <app-document-card
                    [document]="doc"
                    [showArchive]="canManage()"
                    [showDelete]="canDelete()"
                    (onDownload)="downloadDocument($event)"
                    (onArchive)="archiveDocument($event)"
                    (onDelete)="deleteDocument($event)"
                  />
                }
              </div>
            } @else {
              <!-- List View -->
              <div class="divide-y divide-neutral-200 dark:divide-dark-border" role="list">
                @for (doc of filteredDocuments(); track doc.id) {
                  <div
                    role="listitem"
                    class="group flex items-center gap-4 py-3 px-2 hover:bg-neutral-50 dark:hover:bg-dark-elevated focus-within:bg-neutral-50 dark:focus-within:bg-dark-elevated rounded-lg transition-colors"
                  >
                    <div [class]="'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ' + getCategoryColor(doc.category)">
                      <span class="material-icons">{{ getCategoryIcon(doc.category) }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h4 class="font-medium text-neutral-900 dark:text-neutral-100 truncate">{{ doc.name }}</h4>
                      <p class="text-sm text-neutral-500">{{ doc.categoryName }}</p>
                    </div>
                    <div class="hidden sm:flex items-center gap-4 text-sm text-neutral-500">
                      <span>{{ doc.formattedFileSize }}</span>
                      <span>{{ doc.uploadedAt | date:'MMM d, y' }}</span>
                    </div>
                    <div class="flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                      <button
                        type="button"
                        (click)="downloadDocument(doc)"
                        class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-border text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        [attr.aria-label]="('documents.list.downloadAriaLabel' | translate) + ' ' + doc.name"
                      >
                        <span class="material-icons text-lg">download</span>
                      </button>
                      @if (canManage()) {
                        <button
                          type="button"
                          (click)="archiveDocument(doc)"
                          class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-border text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                          [attr.aria-label]="('documents.list.archiveAriaLabel' | translate) + ' ' + doc.name"
                        >
                          <span class="material-icons text-lg">archive</span>
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Results Count -->
          <div class="px-4 py-3 border-t border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-elevated">
            <p class="text-sm text-neutral-500">
              {{ 'documents.list.resultsCount' | translate:{ shown: filteredDocuments().length, total: documents().length } }}
            </p>
          </div>
        }
      </div>
    </div>
  `
})
export class DocumentsListComponent implements OnInit {
  private readonly documentService = inject(DocumentService);
  private readonly dialogService = inject(DialogService);
  private readonly toastService = inject(ToastService);
  private readonly store = inject(Store);
  private readonly translateService = inject(TranslateService);

  private readonly user = toSignal(this.store.select(selectCurrentUser));
  private readonly permissions = toSignal(this.store.select(selectUserPermissions));

  readonly categoryGroups = DocumentService.getCategoryGroups();

  // Data
  documents = signal<EmployeeDocument[]>([]);
  loading = signal(true);

  // Filters (use signals for reactivity with computed)
  searchQuery = signal('');
  selectedCategory = signal<DocumentCategory | ''>('');
  selectedStatus = signal<FilterStatus>('all');
  viewMode = signal<ViewMode>('grid');

  /** Computed signal for filtered documents - caches result until dependencies change */
  filteredDocuments = computed(() => {
    let docs = this.documents();
    const category = this.selectedCategory();
    const status = this.selectedStatus();
    const query = this.searchQuery().toLowerCase();

    // Category filter
    if (category) {
      docs = docs.filter(d => d.category === category);
    }

    // Status filter
    if (status !== 'all') {
      docs = docs.filter(d => {
        switch (status) {
          case 'active':
            return d.status === 'ACTIVE' && !d.expired;
          case 'expiring':
            return DocumentService.isExpiringSoon(d);
          case 'archived':
            return d.status === 'ARCHIVED';
          default:
            return true;
        }
      });
    }

    // Search filter
    if (query) {
      docs = docs.filter(d =>
        d.name.toLowerCase().includes(query) ||
        d.categoryName.toLowerCase().includes(query) ||
        d.fileName.toLowerCase().includes(query)
      );
    }

    return docs;
  });

  // Permission checks
  canUpload = computed(() => {
    const perms = this.permissions() || [];
    return perms.includes('ALL') ||
           perms.includes('*') ||
           perms.includes('TENANT_ALL') ||
           perms.includes('DOCUMENT_CREATE') ||
           perms.includes('DOCUMENT_MANAGE') ||
           this.hasRole('HR_MANAGER') ||
           this.hasRole('TENANT_ADMIN') ||
           this.hasRole('SUPER_ADMIN');
  });

  canManage = computed(() => {
    const perms = this.permissions() || [];
    return perms.includes('ALL') ||
           perms.includes('*') ||
           perms.includes('TENANT_ALL') ||
           perms.includes('DOCUMENT_MANAGE') ||
           this.hasRole('HR_MANAGER') ||
           this.hasRole('TENANT_ADMIN') ||
           this.hasRole('SUPER_ADMIN');
  });

  canDelete = computed(() => {
    const perms = this.permissions() || [];
    return perms.includes('ALL') ||
           perms.includes('*') ||
           perms.includes('TENANT_ALL') ||
           perms.includes('DOCUMENT_DELETE') ||
           this.hasRole('TENANT_ADMIN') ||
           this.hasRole('SUPER_ADMIN');
  });

  ngOnInit(): void {
    this.loadDocuments();
  }

  private hasRole(role: string): boolean {
    const user = this.user();
    if (!user?.roles) return false;
    return user.roles.some((r: string | { code?: string }) => {
      const roleStr = typeof r === 'string' ? r : r?.code ?? '';
      return roleStr.toUpperCase().replace(/^ROLE_/, '') === role;
    });
  }

  private loadDocuments(): void {
    const user = this.user();
    if (!user) {
      this.loading.set(false);
      return;
    }

    // Try to load all documents (company-wide access for admins/HR)
    this.documentService.searchDocuments().subscribe({
      next: (docs) => {
        this.documents.set(docs);
        this.loading.set(false);
      },
      error: () => {
        // Fallback to employee documents on error
        if (user.employeeId) {
          this.documentService.getEmployeeDocuments(user.employeeId).subscribe({
            next: (docs) => {
              this.documents.set(docs);
              this.loading.set(false);
            },
            error: () => this.loading.set(false)
          });
        } else {
          this.loading.set(false);
        }
      }
    });
  }

  getActiveCount(): number {
    return this.documents().filter(d => d.status === 'ACTIVE' && !d.expired).length;
  }

  getExpiringCount(): number {
    return this.documents().filter(d => DocumentService.isExpiringSoon(d)).length;
  }

  getConfidentialCount(): number {
    return this.documents().filter(d => d.confidential).length;
  }

  /** Delegate to centralized service method */
  getCategoryIcon(category: string): string {
    return DocumentService.getCategoryIcon(category);
  }

  /** Delegate to centralized service method */
  getCategoryColor(category: string): string {
    return DocumentService.getCategoryColor(category);
  }

  openUploadDialog(): void {
    const user = this.user();
    const dialogRef = this.dialogService.open<UploadDocumentDialogComponent, EmployeeDocument>(
      UploadDocumentDialogComponent,
      {
        data: {
          ownerType: 'COMPANY',
          ownerId: user?.employeeId || user?.userId || '',
          ownerName: 'Company'
        } as UploadDocumentDialogData,
        maxWidth: '36rem'
      }
    );

    dialogRef.afterClosed().then((result) => {
      if (result) {
        this.toastService.success(this.translateService.instant('documents.list.messages.uploadSuccess'));
        this.loadDocuments();
      }
    });
  }

  downloadDocument(doc: EmployeeDocument): void {
    this.documentService.downloadDocument(doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.toastService.error(this.translateService.instant('documents.list.messages.downloadError'));
      }
    });
  }

  archiveDocument(doc: EmployeeDocument): void {
    const dialogRef = this.dialogService.open<ConfirmActionDialogComponent, boolean>(
      ConfirmActionDialogComponent,
      {
        data: {
          title: this.translateService.instant('documents.list.dialogs.archive.title'),
          message: this.translateService.instant('documents.list.dialogs.archive.message'),
          confirmText: this.translateService.instant('documents.list.dialogs.archive.confirmText'),
          type: 'warning',
          icon: 'archive',
          itemName: doc.name
        } as ConfirmActionDialogData
      }
    );

    dialogRef.afterClosed().then((confirmed) => {
      if (confirmed) {
        this.documentService.archiveDocument(doc.id).subscribe({
          next: () => {
            this.toastService.success(
              this.translateService.instant('documents.list.messages.archiveSuccess', { name: doc.name })
            );
            this.loadDocuments();
          },
          error: () => {
            this.toastService.error(this.translateService.instant('documents.list.messages.archiveError'));
          }
        });
      }
    });
  }

  deleteDocument(doc: EmployeeDocument): void {
    const dialogRef = this.dialogService.open<ConfirmActionDialogComponent, boolean>(
      ConfirmActionDialogComponent,
      {
        data: {
          title: this.translateService.instant('documents.list.dialogs.delete.title'),
          message: this.translateService.instant('documents.list.dialogs.delete.message'),
          confirmText: this.translateService.instant('documents.list.dialogs.delete.confirmText'),
          type: 'danger',
          itemName: doc.name,
          additionalInfo: this.translateService.instant('documents.list.dialogs.delete.additionalInfo')
        } as ConfirmActionDialogData
      }
    );

    dialogRef.afterClosed().then((confirmed) => {
      if (confirmed) {
        this.documentService.deleteDocument(doc.id).subscribe({
          next: () => {
            this.toastService.success(
              this.translateService.instant('documents.list.messages.deleteSuccess', { name: doc.name })
            );
            this.loadDocuments();
          },
          error: () => {
            this.toastService.error(this.translateService.instant('documents.list.messages.deleteError'));
          }
        });
      }
    });
  }
}
