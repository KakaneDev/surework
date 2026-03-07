import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SupportService, CategoryResponse, TicketCategory, TicketPriority } from '@core/services/support.service';

@Component({
  selector: 'app-ticket-create',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, TranslateModule],
  template: `
    <div class="space-y-6">
      <div class="sw-page-header">
        <div class="flex items-center gap-4">
          <a routerLink="/support" class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors">
            <span class="material-icons">arrow_back</span>
          </a>
          <div>
            <h1 class="sw-page-title">{{ 'support.ticketCreate.title' | translate }}</h1>
            <p class="sw-page-description">{{ 'support.ticketCreate.subtitle' | translate }}</p>
          </div>
        </div>
      </div>

      <div class="max-w-2xl">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border">
          <div class="p-6 space-y-6">
            <!-- Category -->
            <div class="sw-form-group">
              <label class="sw-label">{{ 'support.ticketCreate.category' | translate }} *</label>
              <select
                formControlName="categoryCode"
                class="sw-select"
                (change)="onCategoryChange()"
                [attr.aria-label]="'support.ticketCreate.category' | translate"
              >
                <option value="">{{ 'support.ticketCreate.selectCategory' | translate }}</option>
                @for (cat of categories(); track cat.code) {
                  <option [value]="cat.code">{{ cat.name }}</option>
                }
              </select>
              @if (selectedCategory()) {
                <p class="text-xs text-neutral-500 mt-1">
                  {{ 'support.ticketCreate.routesTo' | translate }}: {{ selectedCategory()?.assignedTeam }}
                </p>
              }
            </div>

            <!-- Subcategory -->
            @if (selectedCategory()?.subcategories?.length) {
              <div class="sw-form-group">
                <label class="sw-label">{{ 'support.ticketCreate.subcategory' | translate }}</label>
                <select formControlName="subcategory" class="sw-select" [attr.aria-label]="'support.ticketCreate.subcategory' | translate">
                  <option value="">{{ 'support.ticketCreate.selectSubcategory' | translate }}</option>
                  @for (sub of selectedCategory()?.subcategories; track sub) {
                    <option [value]="sub">{{ sub }}</option>
                  }
                </select>
              </div>
            }

            <!-- Subject -->
            <div class="sw-form-group">
              <label class="sw-label">{{ 'support.ticketCreate.subject' | translate }} *</label>
              <input
                type="text"
                formControlName="subject"
                class="sw-input"
                [placeholder]="'support.ticketCreate.subjectPlaceholder' | translate"
                [attr.aria-label]="'support.ticketCreate.subject' | translate"
              />
              @if (form.get('subject')?.invalid && form.get('subject')?.touched) {
                <p class="text-xs text-red-500 mt-1">{{ 'support.ticketCreate.subjectError' | translate }}</p>
              }
            </div>

            <!-- Description -->
            <div class="sw-form-group">
              <label class="sw-label">{{ 'support.ticketCreate.description' | translate }} *</label>
              <textarea
                formControlName="description"
                class="sw-input min-h-[150px]"
                [placeholder]="'support.ticketCreate.descriptionPlaceholder' | translate"
                [attr.aria-label]="'support.ticketCreate.description' | translate"
              ></textarea>
              @if (form.get('description')?.invalid && form.get('description')?.touched) {
                <p class="text-xs text-red-500 mt-1">{{ 'support.ticketCreate.descriptionError' | translate }}</p>
              }
            </div>

            <!-- Priority -->
            <div class="sw-form-group">
              <label class="sw-label">{{ 'support.ticketCreate.priority' | translate }} *</label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                @for (priority of priorities; track priority.value) {
                  <button
                    type="button"
                    [class]="priorityBtnClasses(priority.value)"
                    (click)="form.patchValue({ priority: priority.value })"
                    [attr.aria-label]="priority.labelKey | translate"
                  >
                    <span class="material-icons text-lg">{{ priority.icon }}</span>
                    <span>{{ priority.labelKey | translate }}</span>
                  </button>
                }
              </div>
            </div>

            <!-- Attachments -->
            <div class="sw-form-group">
              <label class="sw-label">{{ 'support.ticketCreate.attachments' | translate }}</label>
              <div class="border-2 border-dashed border-neutral-200 dark:border-dark-border rounded-lg p-8 text-center">
                <span class="material-icons text-3xl text-neutral-400 mb-2">cloud_upload</span>
                <p class="text-sm text-neutral-500">{{ 'support.ticketCreate.dragDropText' | translate }}</p>
                <p class="text-xs text-neutral-400 mt-1">{{ 'support.ticketCreate.maxFileSize' | translate }}</p>
                <input type="file" class="hidden" multiple [attr.aria-label]="'support.ticketCreate.fileInput' | translate" />
              </div>
            </div>

            <!-- Error Message -->
            @if (errorMessage()) {
              <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div class="flex items-center gap-2 text-red-700 dark:text-red-300">
                  <span class="material-icons text-lg">error_outline</span>
                  <p class="text-sm">{{ errorMessage() | translate }}</p>
                </div>
              </div>
            }
          </div>

          <div class="px-6 py-4 bg-neutral-50 dark:bg-dark-elevated border-t border-neutral-200 dark:border-dark-border rounded-b-xl flex justify-end gap-3">
            <a routerLink="/support" class="sw-btn sw-btn-outline">{{ 'support.ticketCreate.cancel' | translate }}</a>
            <button
              type="submit"
              class="sw-btn sw-btn-primary"
              [disabled]="!form.valid || isSubmitting()"
              [attr.aria-label]="'support.ticketCreate.submitButton' | translate"
            >
              @if (isSubmitting()) {
                <span class="material-icons animate-spin">refresh</span>
              }
              {{ 'support.ticketCreate.submitButton' | translate }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly supportService = inject(SupportService);

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  categories = signal<CategoryResponse[]>([]);
  selectedCategory = signal<CategoryResponse | null>(null);

  priorities: { value: TicketPriority; labelKey: string; icon: string }[] = [
    { value: 'LOW', labelKey: 'support.ticketCreate.priority.low', icon: 'arrow_downward' },
    { value: 'MEDIUM', labelKey: 'support.ticketCreate.priority.medium', icon: 'remove' },
    { value: 'HIGH', labelKey: 'support.ticketCreate.priority.high', icon: 'arrow_upward' },
    { value: 'URGENT', labelKey: 'support.ticketCreate.priority.urgent', icon: 'priority_high' }
  ];

  form = this.fb.group({
    categoryCode: ['', Validators.required],
    subcategory: [''],
    subject: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(20)]],
    priority: ['MEDIUM' as TicketPriority, Validators.required]
  });

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.supportService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.errorMessage.set('support.ticketCreate.categoryLoadError');
      }
    });
  }

  onCategoryChange(): void {
    const categoryCode = this.form.get('categoryCode')?.value;
    const category = this.categories().find(c => c.code === categoryCode);
    this.selectedCategory.set(category || null);
    this.form.patchValue({ subcategory: '' });
  }

  priorityBtnClasses(value: string): string {
    const base = 'flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors';
    const selected = this.form.get('priority')?.value === value;

    if (selected) {
      switch (value) {
        case 'URGENT': return `${base} border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300`;
        case 'HIGH': return `${base} border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300`;
        case 'MEDIUM': return `${base} border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300`;
        default: return `${base} border-neutral-500 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300`;
      }
    }

    return `${base} border-neutral-200 dark:border-dark-border hover:bg-neutral-50 dark:hover:bg-dark-elevated text-neutral-600 dark:text-neutral-400`;
  }

  onSubmit(): void {
    if (!this.form.valid) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const formValue = this.form.value;

    this.supportService.createTicket({
      categoryCode: formValue.categoryCode as TicketCategory,
      subcategory: formValue.subcategory || undefined,
      subject: formValue.subject!,
      description: formValue.description!,
      priority: formValue.priority as TicketPriority
    }).subscribe({
      next: (ticket) => {
        this.isSubmitting.set(false);
        // Navigate to the newly created ticket
        this.router.navigate(['/support', ticket.id]);
      },
      error: (err) => {
        console.error('Error creating ticket:', err);
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'support.ticketCreate.submitError');
      }
    });
  }
}
