import { Component, ChangeDetectionStrategy, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SpinnerComponent, ToastService, DialogService } from '@shared/ui';
import { DocumentService, DocumentTemplate, DocumentCategory } from '@core/services/document.service';
import { selectCurrentUser, selectUserPermissions } from '@core/store/auth/auth.selectors';
import { UploadDocumentDialogComponent, UploadDocumentDialogData } from '../dialogs/upload-document-dialog.component';

type TemplateType = 'ALL' | 'WORD' | 'PDF' | 'EXCEL';

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SpinnerComponent, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-4">
          <a routerLink="/documents" class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors">
            <span class="material-icons text-neutral-500">arrow_back</span>
          </a>
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
            <span class="material-icons text-white text-2xl">description</span>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ 'documents.templates.title' | translate }}</h1>
            <p class="text-neutral-500 dark:text-neutral-400">{{ 'documents.templates.subtitle' | translate }}</p>
          </div>
        </div>
        @if (canUploadTemplates()) {
          <button
            (click)="openUploadDialog()"
            class="sw-btn sw-btn-primary sw-btn-md shrink-0 whitespace-nowrap"
            [title]="'documents.templates.addButton' | translate"
          >
            <span class="material-icons text-lg">add</span>
            {{ 'documents.templates.addButton' | translate }}
          </button>
        }
      </div>

      <!-- Filter Tabs -->
      <div class="flex items-center gap-2">
        @for (type of templateTypes; track type.value) {
          <button
            (click)="selectedType.set(type.value)"
            [class]="getTypeTabClass(type.value)"
          >
            <span class="material-icons text-lg">{{ type.icon }}</span>
            {{ type.labelKey | translate }}
            @if (type.value === 'ALL') {
              <span class="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-neutral-200 dark:bg-dark-border">
                {{ templates().length }}
              </span>
            }
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
          [placeholder]="'documents.templates.searchPlaceholder' | translate"
          class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-surface text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <sw-spinner size="lg" />
          <p class="mt-4 text-neutral-500">{{ 'documents.templates.loading' | translate }}</p>
        </div>
      }

      <!-- Empty State -->
      @else if (filteredTemplates().length === 0) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-dark-elevated dark:to-dark-border flex items-center justify-center">
            <span class="material-icons text-5xl text-neutral-400 dark:text-neutral-500">description</span>
          </div>
          <h2 class="text-xl font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{{ 'documents.templates.noTemplates' | translate }}</h2>
          <p class="text-neutral-500 dark:text-neutral-400 mb-6 max-w-md mx-auto">
            @if (searchQuery()) {
              {{ 'documents.templates.noSearchResults' | translate }}
            } @else {
              {{ 'documents.templates.noTemplatesUploaded' | translate }}
            }
          </p>
        </div>
      }

      <!-- Templates Grid -->
      @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          @for (template of filteredTemplates(); track template.id) {
            <div class="group bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-5 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all">
              <!-- File Type Icon -->
              <div class="flex items-center justify-between mb-4">
                <div [class]="'w-12 h-12 rounded-xl flex items-center justify-center ' + getTemplateTypeColor(template.templateType)">
                  <span class="material-icons text-2xl">{{ getTemplateTypeIcon(template.templateType) }}</span>
                </div>
                <span class="text-xs font-semibold px-2 py-1 rounded-full" [class]="getTemplateTypeBadgeClass(template.templateType)">
                  {{ template.templateType }}
                </span>
              </div>

              <!-- Template Info -->
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100 truncate mb-1" [title]="template.name">
                {{ template.name }}
              </h3>
              @if (template.description) {
                <p class="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-3">
                  {{ template.description }}
                </p>
              }
              <div class="flex items-center gap-2 text-xs text-neutral-400 mb-4">
                <span>{{ template.formattedFileSize }}</span>
                <span>|</span>
                <span>{{ template.createdAt | date:'MMM d, y' }}</span>
              </div>

              <!-- Actions -->
              <div class="flex gap-2">
                <button
                  (click)="downloadTemplate(template)"
                  [title]="'documents.templates.downloadButton' | translate"
                  class="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                         bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400
                         hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                >
                  <span class="material-icons text-lg">download</span>
                  {{ 'documents.templates.downloadButton' | translate }}
                </button>
                <button
                  (click)="previewTemplate(template)"
                  [title]="'documents.templates.previewButton' | translate"
                  class="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium
                         bg-neutral-100 dark:bg-dark-elevated text-neutral-600 dark:text-neutral-400
                         hover:bg-neutral-200 dark:hover:bg-dark-border transition-colors"
                >
                  <span class="material-icons text-lg">visibility</span>
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Results Count -->
        <div class="text-sm text-neutral-500 text-center">
          {{ 'documents.templates.showingResults' | translate: { count: filteredTemplates().length, total: templates().length } }}
        </div>
      }
    </div>
  `
})
export class TemplatesComponent implements OnInit {
  private readonly documentService = inject(DocumentService);
  private readonly toastService = inject(ToastService);
  private readonly dialogService = inject(DialogService);
  private readonly store = inject(Store);
  private readonly translate = inject(TranslateService);

  private readonly user = toSignal(this.store.select(selectCurrentUser));
  private readonly permissions = toSignal(this.store.select(selectUserPermissions));

  readonly templateTypes: { value: TemplateType; label: string; icon: string; labelKey: string }[] = [
    { value: 'ALL', label: 'All', icon: 'folder', labelKey: 'documents.templates.filterAll' },
    { value: 'WORD', label: 'Word', icon: 'description', labelKey: 'documents.templates.filterWord' },
    { value: 'PDF', label: 'PDF', icon: 'picture_as_pdf', labelKey: 'documents.templates.filterPdf' },
    { value: 'EXCEL', label: 'Excel', icon: 'table_chart', labelKey: 'documents.templates.filterExcel' }
  ];

  templates = signal<DocumentTemplate[]>([]);
  loading = signal(true);
  selectedType = signal<TemplateType>('ALL');
  searchQuery = signal('');

  /** Computed signal for filtered templates - caches result until dependencies change */
  filteredTemplates = computed(() => {
    let templates = this.templates();
    const type = this.selectedType();
    const query = this.searchQuery().toLowerCase();

    // Type filter
    if (type !== 'ALL') {
      templates = templates.filter(t => t.templateType === type);
    }

    // Search filter
    if (query) {
      templates = templates.filter(t =>
        t.name.toLowerCase().includes(query) ||
        (t.description?.toLowerCase().includes(query) ?? false)
      );
    }

    return templates;
  });

  canUploadTemplates = computed(() => {
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
    this.loadTemplates();
  }

  private hasRole(role: string): boolean {
    const user = this.user();
    if (!user?.roles) return false;
    return user.roles.some((r: any) => {
      const roleStr = typeof r === 'string' ? r : r?.code ?? '';
      return roleStr.toUpperCase().replace(/^ROLE_/, '') === role;
    });
  }

  private loadTemplates(): void {
    this.documentService.getTemplates().subscribe({
      next: (templates) => {
        this.templates.set(templates);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        // Mock data for development
        this.templates.set([
          {
            id: '1',
            name: 'Employment Contract Template',
            description: 'Standard employment contract for permanent employees',
            category: 'EMPLOYMENT_CONTRACT' as DocumentCategory,
            fileName: 'employment_contract_template.docx',
            fileExtension: 'docx',
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileSize: 45000,
            formattedFileSize: '45 KB',
            templateType: 'WORD',
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Leave Application Form',
            description: 'Standard leave request form for all leave types',
            category: 'LEAVE_FORM' as DocumentCategory,
            fileName: 'leave_application.pdf',
            fileExtension: 'pdf',
            contentType: 'application/pdf',
            fileSize: 120000,
            formattedFileSize: '120 KB',
            templateType: 'PDF',
            createdAt: new Date().toISOString()
          },
          {
            id: '3',
            name: 'Expense Report Template',
            description: 'Monthly expense report for reimbursements',
            category: 'OTHER' as DocumentCategory,
            fileName: 'expense_report.xlsx',
            fileExtension: 'xlsx',
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            fileSize: 35000,
            formattedFileSize: '35 KB',
            templateType: 'EXCEL',
            createdAt: new Date().toISOString()
          }
        ]);
      }
    });
  }

  getTypeTabClass(type: TemplateType): string {
    const isSelected = this.selectedType() === type;
    const base = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all';

    if (isSelected) {
      return `${base} bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400`;
    }
    return `${base} text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-elevated`;
  }

  getTemplateTypeColor(type: string): string {
    const colors: Record<string, string> = {
      WORD: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
      PDF: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      EXCEL: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
    };
    return colors[type] || 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400';
  }

  getTemplateTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      WORD: 'description',
      PDF: 'picture_as_pdf',
      EXCEL: 'table_chart'
    };
    return icons[type] || 'insert_drive_file';
  }

  getTemplateTypeBadgeClass(type: string): string {
    const classes: Record<string, string> = {
      WORD: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
      PDF: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      EXCEL: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    };
    return classes[type] || 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400';
  }

  downloadTemplate(template: DocumentTemplate): void {
    this.documentService.downloadTemplate(template.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = template.fileName;
        a.click();
        window.URL.revokeObjectURL(url);
        const message = this.translate.instant('documents.templates.downloadSuccess', { name: template.name });
        this.toastService.success(message);
      },
      error: () => {
        const message = this.translate.instant('documents.templates.downloadError');
        this.toastService.error(message);
      }
    });
  }

  previewTemplate(template: DocumentTemplate): void {
    // For PDF files, open in new tab
    if (template.templateType === 'PDF') {
      this.documentService.downloadTemplate(template.id).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
        },
        error: () => {
          const message = this.translate.instant('documents.templates.previewError');
          this.toastService.error(message);
        }
      });
    } else {
      // For other files, just download
      this.downloadTemplate(template);
    }
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
          preselectedCategory: 'TEMPLATE' as DocumentCategory
        } as UploadDocumentDialogData,
        maxWidth: '36rem'
      }
    );

    dialogRef.afterClosed().then((result) => {
      if (result) {
        const message = this.translate.instant('documents.templates.uploadSuccess');
        this.toastService.success(message);
        this.loadTemplates();
      }
    });
  }
}
