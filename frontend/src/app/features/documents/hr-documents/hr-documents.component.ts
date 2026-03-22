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

type HRCategoryFilter = 'all' | 'contracts' | 'disciplinary' | 'performance' | 'leave' | 'medical';

@Component({
  selector: 'app-hr-documents',
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
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span class="material-icons text-white text-2xl">folder_shared</span>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ 'documents.hr.title' | translate }}</h1>
            <p class="text-neutral-500 dark:text-neutral-400">{{ 'documents.hr.subtitle' | translate }}</p>
          </div>
        </div>
        @if (canUpload()) {
          <button
            (click)="openUploadDialog()"
            class="sw-btn sw-btn-primary sw-btn-md shrink-0 whitespace-nowrap"
          >
            <span class="material-icons text-lg">add</span>
            {{ 'documents.hr.addDocument' | translate }}
          </button>
        }
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        @for (stat of categoryStats(); track stat.label) {
          <button
            (click)="selectedFilter.set(stat.filter)"
            [class]="getStatCardClass(stat.filter)"
          >
            <div class="flex items-center gap-3">
              <div [class]="'w-10 h-10 rounded-lg flex items-center justify-center ' + stat.colorClass">
                <span class="material-icons">{{ stat.icon }}</span>
              </div>
              <div class="text-left">
                <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ stat.count }}</p>
                <p class="text-xs text-neutral-500">{{ stat.label }}</p>
              </div>
            </div>
          </button>
        }
      </div>

      <!-- Search -->
      <div class="relative max-w-md">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-neutral-400 text-xl">search</span>
        <input
          type="text"
          [ngModel]="searchQuery()"
          (ngModelChange)="searchQuery.set($event)"
          [placeholder]="'documents.hr.searchPlaceholder' | translate"
          class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <sw-spinner size="lg" />
          <p class="mt-4 text-neutral-500">{{ 'documents.hr.loading' | translate }}</p>
        </div>
      }

      <!-- Empty State -->
      @else if (filteredDocuments().length === 0) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-dark-elevated dark:to-dark-border flex items-center justify-center">
            <span class="material-icons text-5xl text-neutral-400 dark:text-neutral-500">folder_shared</span>
          </div>
          <h2 class="text-xl font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{{ 'documents.hr.noDocumentsFound' | translate }}</h2>
          <p class="text-neutral-500 dark:text-neutral-400 mb-6 max-w-md mx-auto">
            @if (searchQuery() || selectedFilter() !== 'all') {
              {{ 'documents.hr.noDocumentsMatchFilters' | translate }}
            } @else {
              {{ 'documents.hr.noDocumentsUploaded' | translate }}
            }
          </p>
          @if (canUpload() && !searchQuery && selectedFilter() === 'all') {
            <button
              (click)="openUploadDialog()"
              class="sw-btn sw-btn-primary sw-btn-md"
            >
              <span class="material-icons text-lg">add</span>
              {{ 'documents.hr.addFirstDocument' | translate }}
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
              [showDelete]="canDelete()"
              (onDownload)="downloadDocument($event)"
              (onArchive)="archiveDocument($event)"
              (onDelete)="deleteDocument($event)"
            />
          }
        </div>

        <!-- Results Count -->
        <div class="text-sm text-neutral-500 text-center">
          {{ 'documents.hr.showingResults' | translate: { showing: filteredDocuments().length, total: documents().length } }}
        </div>
      }
    </div>
  `
})
export class HrDocumentsComponent implements OnInit {
  private readonly documentService = inject(DocumentService);
  private readonly toastService = inject(ToastService);
  private readonly dialogService = inject(DialogService);
  private readonly store = inject(Store);
  private readonly translate = inject(TranslateService);

  private readonly user = toSignal(this.store.select(selectCurrentUser));
  private readonly permissions = toSignal(this.store.select(selectUserPermissions));

  // HR document categories
  private readonly hrCategories: DocumentCategory[] = [
    'EMPLOYMENT_CONTRACT', 'OFFER_LETTER', 'TERMINATION_LETTER', 'RESIGNATION_LETTER',
    'DISCIPLINARY', 'WARNING_LETTER', 'PERFORMANCE_REVIEW', 'SKILLS_ASSESSMENT',
    'LEAVE_FORM', 'MEDICAL_CERTIFICATE'
  ];

  documents = signal<EmployeeDocument[]>([]);
  loading = signal(true);
  selectedFilter = signal<HRCategoryFilter>('all');
  searchQuery = signal('');

  /** Filter category mappings */
  private readonly filterCategories: Record<HRCategoryFilter, DocumentCategory[]> = {
    all: this.hrCategories,
    contracts: ['EMPLOYMENT_CONTRACT', 'OFFER_LETTER', 'TERMINATION_LETTER', 'RESIGNATION_LETTER'],
    disciplinary: ['DISCIPLINARY', 'WARNING_LETTER'],
    performance: ['PERFORMANCE_REVIEW', 'SKILLS_ASSESSMENT'],
    leave: ['LEAVE_FORM', 'MEDICAL_CERTIFICATE'],
    medical: ['MEDICAL_CERTIFICATE']
  };

  /** Computed signal for filtered documents - caches result until dependencies change */
  filteredDocuments = computed(() => {
    let docs = this.documents();
    const filter = this.selectedFilter();
    const query = this.searchQuery().toLowerCase();

    // Category filter
    if (filter !== 'all') {
      docs = docs.filter(d => this.filterCategories[filter].includes(d.category));
    }

    // Search filter
    if (query) {
      docs = docs.filter(d =>
        d.name.toLowerCase().includes(query) ||
        (d.description?.toLowerCase().includes(query) ?? false) ||
        d.categoryName.toLowerCase().includes(query)
      );
    }

    return docs;
  });

  categoryStats = computed(() => {
    const docs = this.documents();
    return [
      {
        filter: 'all' as HRCategoryFilter,
        label: this.translate.instant('documents.hr.stats.allHrDocs'),
        count: docs.length,
        icon: 'folder_shared',
        colorClass: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
      },
      {
        filter: 'contracts' as HRCategoryFilter,
        label: this.translate.instant('documents.hr.stats.contracts'),
        count: docs.filter(d => ['EMPLOYMENT_CONTRACT', 'OFFER_LETTER', 'TERMINATION_LETTER', 'RESIGNATION_LETTER'].includes(d.category)).length,
        icon: 'description',
        colorClass: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
      },
      {
        filter: 'disciplinary' as HRCategoryFilter,
        label: this.translate.instant('documents.hr.stats.disciplinary'),
        count: docs.filter(d => ['DISCIPLINARY', 'WARNING_LETTER'].includes(d.category)).length,
        icon: 'gavel',
        colorClass: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
      },
      {
        filter: 'performance' as HRCategoryFilter,
        label: this.translate.instant('documents.hr.stats.performance'),
        count: docs.filter(d => ['PERFORMANCE_REVIEW', 'SKILLS_ASSESSMENT'].includes(d.category)).length,
        icon: 'assessment',
        colorClass: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400'
      },
      {
        filter: 'leave' as HRCategoryFilter,
        label: this.translate.instant('documents.hr.stats.leaveMedical'),
        count: docs.filter(d => ['LEAVE_FORM', 'MEDICAL_CERTIFICATE'].includes(d.category)).length,
        icon: 'event_available',
        colorClass: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
      }
    ];
  });

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
    this.loadHrDocuments();
  }

  private hasRole(role: string): boolean {
    const user = this.user();
    if (!user?.roles) return false;
    return user.roles.some((r: any) => {
      const roleStr = typeof r === 'string' ? r : r?.code ?? '';
      return roleStr.toUpperCase().replace(/^ROLE_/, '') === role;
    });
  }

  private loadHrDocuments(): void {
    // Load all HR-related documents
    this.documentService.searchDocuments().subscribe({
      next: (allDocs) => {
        // Filter to only HR categories
        const hrDocs = allDocs.filter(d => this.hrCategories.includes(d.category));
        this.documents.set(hrDocs);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        // Mock data for development
        this.documents.set([
          {
            id: '1',
            documentReference: 'HR-001',
            name: 'John Smith - Employment Contract',
            description: 'Permanent employment contract',
            category: 'EMPLOYMENT_CONTRACT' as DocumentCategory,
            categoryName: 'Employment Contract',
            ownerType: 'EMPLOYEE',
            ownerId: '1',
            visibility: 'RESTRICTED',
            currentVersion: 1,
            fileName: 'john_smith_contract.pdf',
            fileExtension: 'pdf',
            contentType: 'application/pdf',
            fileSize: 350000,
            formattedFileSize: '350 KB',
            status: 'ACTIVE',
            expired: false,
            confidential: true,
            uploadedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            documentReference: 'HR-002',
            name: 'Performance Review - Q4 2025',
            description: 'Quarterly performance assessment',
            category: 'PERFORMANCE_REVIEW' as DocumentCategory,
            categoryName: 'Performance Review',
            ownerType: 'EMPLOYEE',
            ownerId: '2',
            visibility: 'RESTRICTED',
            currentVersion: 1,
            fileName: 'q4_review.pdf',
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
            documentReference: 'HR-003',
            name: 'Leave Application - Annual Leave',
            description: 'Annual leave request form',
            category: 'LEAVE_FORM' as DocumentCategory,
            categoryName: 'Leave Form',
            ownerType: 'EMPLOYEE',
            ownerId: '3',
            visibility: 'DEPARTMENT',
            currentVersion: 1,
            fileName: 'leave_application.pdf',
            fileExtension: 'pdf',
            contentType: 'application/pdf',
            fileSize: 85000,
            formattedFileSize: '85 KB',
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

  getStatCardClass(filter: HRCategoryFilter): string {
    const isSelected = this.selectedFilter() === filter;
    const base = 'w-full bg-white dark:bg-dark-surface rounded-xl p-4 border transition-all text-left';

    if (isSelected) {
      return `${base} border-primary-300 dark:border-primary-700 ring-2 ring-primary-100 dark:ring-primary-900/30`;
    }
    return `${base} border-neutral-200 dark:border-dark-border hover:border-primary-200 dark:hover:border-primary-800`;
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
        this.toastService.success(this.translate.instant('documents.hr.downloadSuccess', { name: doc.name }));
      },
      error: () => {
        this.toastService.error(this.translate.instant('documents.hr.downloadError'));
      }
    });
  }

  archiveDocument(doc: EmployeeDocument): void {
    const dialogRef = this.dialogService.open<ConfirmActionDialogComponent, boolean>(
      ConfirmActionDialogComponent,
      {
        data: {
          title: this.translate.instant('documents.hr.archiveTitle'),
          message: this.translate.instant('documents.hr.archiveMessage'),
          confirmText: this.translate.instant('documents.hr.archiveConfirm'),
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
            this.toastService.success(this.translate.instant('documents.hr.archiveSuccess', { name: doc.name }));
            this.loadHrDocuments();
          },
          error: () => {
            this.toastService.error(this.translate.instant('documents.hr.archiveError'));
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
          title: this.translate.instant('documents.hr.deleteTitle'),
          message: this.translate.instant('documents.hr.deleteMessage'),
          confirmText: this.translate.instant('documents.hr.deleteConfirm'),
          type: 'danger',
          itemName: doc.name,
          additionalInfo: this.translate.instant('documents.hr.deleteWarning')
        } as ConfirmActionDialogData
      }
    );

    dialogRef.afterClosed().then((confirmed) => {
      if (confirmed) {
        this.documentService.deleteDocument(doc.id).subscribe({
          next: () => {
            this.toastService.success(this.translate.instant('documents.hr.deleteSuccess', { name: doc.name }));
            this.loadHrDocuments();
          },
          error: () => {
            this.toastService.error(this.translate.instant('documents.hr.deleteError'));
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
          ownerType: 'EMPLOYEE',
          ownerId: user?.employeeId || '',
          ownerName: user?.fullName || 'Employee'
        } as UploadDocumentDialogData,
        maxWidth: '36rem'
      }
    );

    dialogRef.afterClosed().then((result) => {
      if (result) {
        this.toastService.success(this.translate.instant('documents.hr.uploadSuccess'));
        this.loadHrDocuments();
      }
    });
  }
}
