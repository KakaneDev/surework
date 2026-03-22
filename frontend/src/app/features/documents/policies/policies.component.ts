import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SpinnerComponent, ToastService, DialogService, ConfirmActionDialogComponent, ConfirmActionDialogData } from '@shared/ui';
import { DocumentService, EmployeeDocument, DocumentCategory } from '@core/services/document.service';
import { selectCurrentUser, selectUserPermissions } from '@core/store/auth/auth.selectors';
import { UploadDocumentDialogComponent, UploadDocumentDialogData } from '../dialogs/upload-document-dialog.component';
import { DocumentCardComponent } from '../documents-list/document-card.component';

@Component({
  selector: 'app-policies',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, SpinnerComponent, DocumentCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-4">
          <a routerLink="/documents" class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors">
            <span class="material-icons text-neutral-500">arrow_back</span>
          </a>
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
            <span class="material-icons text-white text-2xl">policy</span>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ 'documents.policies.title' | translate }}</h1>
            <p class="text-neutral-500 dark:text-neutral-400">{{ 'documents.policies.subtitle' | translate }}</p>
          </div>
        </div>
        @if (canUpload()) {
          <button
            (click)="openUploadDialog()"
            class="sw-btn sw-btn-primary sw-btn-md shrink-0 whitespace-nowrap"
          >
            <span class="material-icons text-lg">add</span>
            {{ 'documents.policies.addPolicy' | translate }}
          </button>
        }
      </div>

      <!-- Category Pills -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          (click)="selectedCategory.set(null)"
          [class]="getCategoryPillClass(null)"
        >
          {{ 'documents.policies.allPolicies' | translate }}
          <span class="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-neutral-200 dark:bg-dark-border">
            {{ documents().length }}
          </span>
        </button>
        <button
          (click)="selectedCategory.set('POLICY_DOCUMENT')"
          [class]="getCategoryPillClass('POLICY_DOCUMENT')"
        >
          <span class="material-icons text-base">policy</span>
          {{ 'documents.policies.categoriesPolicies' | translate }}
        </button>
        <button
          (click)="selectedCategory.set('PROCEDURE')"
          [class]="getCategoryPillClass('PROCEDURE')"
        >
          <span class="material-icons text-base">list_alt</span>
          {{ 'documents.policies.categoriesProcedures' | translate }}
        </button>
      </div>

      <!-- Search -->
      <div class="relative max-w-md">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-neutral-400 text-xl">search</span>
        <input
          type="text"
          [ngModel]="searchQuery()"
          (ngModelChange)="searchQuery.set($event)"
          [placeholder]="'documents.policies.searchPlaceholder' | translate"
          class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <sw-spinner size="lg" />
          <p class="mt-4 text-neutral-500">{{ 'documents.policies.loading' | translate }}</p>
        </div>
      }

      <!-- Empty State -->
      @else if (filteredDocuments().length === 0) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-dark-elevated dark:to-dark-border flex items-center justify-center">
            <span class="material-icons text-5xl text-neutral-400 dark:text-neutral-500">policy</span>
          </div>
          <h2 class="text-xl font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{{ 'documents.policies.noPoliciesFound' | translate }}</h2>
          <p class="text-neutral-500 dark:text-neutral-400 mb-6 max-w-md mx-auto">
            @if (searchQuery() || selectedCategory()) {
              {{ 'documents.policies.noMatchingPolicies' | translate }}
            } @else {
              {{ 'documents.policies.noPoliciesUploaded' | translate }}
            }
          </p>
          @if (canUpload() && !searchQuery && !selectedCategory()) {
            <button
              (click)="openUploadDialog()"
              class="sw-btn sw-btn-primary sw-btn-md"
            >
              <span class="material-icons text-lg">add</span>
              {{ 'documents.policies.addFirstPolicy' | translate }}
            </button>
          }
        </div>
      }

      <!-- Documents Grid -->
      @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (doc of filteredDocuments(); track doc.id) {
            <app-document-card
              [document]="doc"
              [showArchive]="canManage()"
              [showDelete]="false"
              (onDownload)="downloadDocument($event)"
              (onArchive)="archiveDocument($event)"
            />
          }
        </div>

        <!-- Results Count -->
        <div class="text-sm text-neutral-500 text-center">
          {{ 'documents.policies.resultsCount' | translate: { showing: filteredDocuments().length, total: documents().length } }}
        </div>
      }
    </div>
  `
})
export class PoliciesComponent implements OnInit {
  private readonly documentService = inject(DocumentService);
  private readonly toastService = inject(ToastService);
  private readonly dialogService = inject(DialogService);
  private readonly store = inject(Store);
  private readonly translate = inject(TranslateService);

  private readonly user = toSignal(this.store.select(selectCurrentUser));
  private readonly permissions = toSignal(this.store.select(selectUserPermissions));

  documents = signal<EmployeeDocument[]>([]);
  loading = signal(true);
  selectedCategory = signal<DocumentCategory | null>(null);
  searchQuery = signal('');

  /** Computed signal for filtered documents - caches result until dependencies change */
  filteredDocuments = computed(() => {
    let docs = this.documents();
    const category = this.selectedCategory();
    const query = this.searchQuery().toLowerCase();

    // Category filter
    if (category) {
      docs = docs.filter(d => d.category === category);
    }

    // Search filter
    if (query) {
      docs = docs.filter(d =>
        d.name.toLowerCase().includes(query) ||
        (d.description?.toLowerCase().includes(query) ?? false)
      );
    }

    return docs;
  });

  canUpload = computed(() => {
    const perms = this.permissions() || [];
    return perms.includes('ALL') ||
           perms.includes('*') ||
           perms.includes('TENANT_ALL') ||
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

  ngOnInit(): void {
    this.loadPolicies();
  }

  private hasRole(role: string): boolean {
    const user = this.user();
    if (!user?.roles) return false;
    return user.roles.some((r: any) => {
      const roleStr = typeof r === 'string' ? r : r?.code ?? '';
      return roleStr.toUpperCase().replace(/^ROLE_/, '') === role;
    });
  }

  private loadPolicies(): void {
    // Load policy documents (POLICY_DOCUMENT and PROCEDURE categories)
    this.documentService.searchDocuments({ category: 'POLICY_DOCUMENT' }).subscribe({
      next: (policies) => {
        // Also load procedures
        this.documentService.searchDocuments({ category: 'PROCEDURE' }).subscribe({
          next: (procedures) => {
            this.documents.set([...policies, ...procedures]);
            this.loading.set(false);
          },
          error: () => {
            this.documents.set(policies);
            this.loading.set(false);
          }
        });
      },
      error: () => {
        this.loading.set(false);
        // Mock data for development
        this.documents.set([
          {
            id: '1',
            documentReference: 'POL-001',
            name: 'Employee Code of Conduct',
            description: 'Guidelines for professional behavior',
            category: 'POLICY_DOCUMENT' as DocumentCategory,
            categoryName: 'Policy Document',
            ownerType: 'COMPANY',
            ownerId: '1',
            visibility: 'COMPANY',
            currentVersion: 1,
            fileName: 'code_of_conduct.pdf',
            fileExtension: 'pdf',
            contentType: 'application/pdf',
            fileSize: 250000,
            formattedFileSize: '250 KB',
            status: 'ACTIVE',
            expired: false,
            confidential: false,
            uploadedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            documentReference: 'POL-002',
            name: 'Leave Policy',
            description: 'Company leave entitlements and procedures',
            category: 'POLICY_DOCUMENT' as DocumentCategory,
            categoryName: 'Policy Document',
            ownerType: 'COMPANY',
            ownerId: '1',
            visibility: 'COMPANY',
            currentVersion: 2,
            fileName: 'leave_policy.pdf',
            fileExtension: 'pdf',
            contentType: 'application/pdf',
            fileSize: 180000,
            formattedFileSize: '180 KB',
            status: 'ACTIVE',
            expired: false,
            confidential: false,
            uploadedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          },
          {
            id: '3',
            documentReference: 'PROC-001',
            name: 'Expense Claim Procedure',
            description: 'Step-by-step guide for expense reimbursement',
            category: 'PROCEDURE' as DocumentCategory,
            categoryName: 'Procedure',
            ownerType: 'COMPANY',
            ownerId: '1',
            visibility: 'COMPANY',
            currentVersion: 1,
            fileName: 'expense_procedure.pdf',
            fileExtension: 'pdf',
            contentType: 'application/pdf',
            fileSize: 120000,
            formattedFileSize: '120 KB',
            status: 'ACTIVE',
            expired: false,
            confidential: false,
            uploadedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          }
        ]);
      }
    });
  }

  getCategoryPillClass(category: DocumentCategory | null): string {
    const isSelected = this.selectedCategory() === category;
    const base = 'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200';

    if (isSelected) {
      return `${base} bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 border border-primary-200 dark:border-primary-800 shadow-sm`;
    }
    return `${base} bg-white text-neutral-600 dark:bg-dark-surface dark:text-neutral-400 border border-neutral-200 dark:border-dark-border hover:bg-neutral-50 dark:hover:bg-dark-elevated`;
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
        this.toastService.success(this.translate.instant('documents.policies.downloadSuccess', { name: doc.name }));
      },
      error: () => {
        this.toastService.error(this.translate.instant('documents.policies.downloadError'));
      }
    });
  }

  archiveDocument(doc: EmployeeDocument): void {
    const dialogRef = this.dialogService.open<ConfirmActionDialogComponent, boolean>(
      ConfirmActionDialogComponent,
      {
        data: {
          title: this.translate.instant('documents.policies.archiveTitle'),
          message: this.translate.instant('documents.policies.archiveMessage'),
          confirmText: this.translate.instant('documents.policies.archiveConfirm'),
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
            this.toastService.success(this.translate.instant('documents.policies.archiveSuccess', { name: doc.name }));
            this.loadPolicies();
          },
          error: () => {
            this.toastService.error(this.translate.instant('documents.policies.archiveError'));
          }
        });
      }
    });
  }

  openUploadDialog(): void {
    const user = this.user();
    const dialogRef = this.dialogService.open(
      UploadDocumentDialogComponent,
      {
        data: {
          ownerType: 'COMPANY',
          ownerId: user?.employeeId || user?.userId || '',
          ownerName: 'Company',
          preselectedCategory: 'POLICY_DOCUMENT' as DocumentCategory
        } as UploadDocumentDialogData,
        maxWidth: '36rem'
      }
    );

    dialogRef.afterClosed().then((result) => {
      if (result) {
        this.toastService.success(this.translate.instant('documents.policies.uploadSuccess'));
        this.loadPolicies();
      }
    });
  }
}
