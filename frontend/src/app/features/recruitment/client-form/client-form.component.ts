import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  RecruitmentService,
  Client,
  CreateClientRequest,
  UpdateClientRequest
} from '../../../core/services/recruitment.service';
import { SpinnerComponent, ToastService } from '@shared/ui';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    TranslateModule,
    SpinnerComponent
  ],
  template: `
    <div class="space-y-6 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-3">
          <a routerLink="/recruitment/clients"
             class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors"
             aria-label="Back">
            <span class="material-icons" aria-hidden="true">arrow_back</span>
          </a>
          <span class="material-icons text-3xl text-primary-500">business</span>
          <div>
            <h1 class="sw-page-title">{{ isEditMode() ? 'Edit Client' : 'Add Client' }}</h1>
            <p class="sw-page-description">{{ isEditMode() ? 'Update client information' : 'Add a new client company' }}</p>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center items-center py-24">
          <sw-spinner size="lg" />
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border overflow-hidden">
            <!-- Company Information -->
            <section class="p-6 border-b border-neutral-200 dark:border-dark-border">
              <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
                <span class="material-icons text-primary-500">business</span>
                Company Information
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                  <label class="sw-label">Company Name *</label>
                  <input type="text" formControlName="name" class="sw-input w-full"
                         [class.border-error-500]="form.get('name')?.touched && form.get('name')?.hasError('required')">
                  @if (form.get('name')?.touched && form.get('name')?.hasError('required')) {
                    <p class="text-sm text-error-500 mt-1">Company name is required</p>
                  }
                </div>

                <div>
                  <label class="sw-label">Industry</label>
                  <select formControlName="industry" class="sw-input w-full">
                    <option value="">Select industry</option>
                    @for (ind of industries; track ind.value) {
                      <option [value]="ind.value">{{ ind.label }}</option>
                    }
                  </select>
                </div>

                <div>
                  <label class="sw-label">Website</label>
                  <input type="url" formControlName="website" class="sw-input w-full"
                         placeholder="https://example.com">
                </div>
              </div>
            </section>

            <!-- Contact Information -->
            <section class="p-6 border-b border-neutral-200 dark:border-dark-border">
              <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
                <span class="material-icons text-primary-500">contact_mail</span>
                Contact Information
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="sw-label">Contact Person</label>
                  <input type="text" formControlName="contactPerson" class="sw-input w-full"
                         placeholder="Primary contact name">
                </div>

                <div>
                  <label class="sw-label">Contact Email</label>
                  <input type="email" formControlName="contactEmail" class="sw-input w-full"
                         placeholder="contact@example.com">
                  @if (form.get('contactEmail')?.touched && form.get('contactEmail')?.hasError('email')) {
                    <p class="text-sm text-error-500 mt-1">Please enter a valid email</p>
                  }
                </div>

                <div>
                  <label class="sw-label">Contact Phone</label>
                  <input type="tel" formControlName="contactPhone" class="sw-input w-full"
                         placeholder="+27 XX XXX XXXX">
                </div>
              </div>
            </section>

            <!-- Notes -->
            <section class="p-6 border-b border-neutral-200 dark:border-dark-border">
              <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
                <span class="material-icons text-primary-500">notes</span>
                Additional Notes
              </h3>

              <div>
                <textarea formControlName="notes" class="sw-input w-full" rows="4"
                          placeholder="Any additional notes about this client..."></textarea>
              </div>
            </section>

            @if (isEditMode()) {
              <!-- Status (edit only) -->
              <section class="p-6 border-b border-neutral-200 dark:border-dark-border">
                <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
                  <span class="material-icons text-primary-500">toggle_on</span>
                  Status
                </h3>

                <label class="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" formControlName="active" class="w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500">
                  <span class="text-neutral-700 dark:text-neutral-300">Active</span>
                </label>
                <p class="text-sm text-neutral-500 mt-1">Inactive clients won't appear in client dropdowns when creating job postings</p>
              </section>
            }

            <!-- Actions -->
            <div class="px-6 py-4 bg-neutral-50 dark:bg-dark-elevated flex items-center justify-end gap-3">
              <a routerLink="/recruitment/clients"
                 class="sw-btn sw-btn-ghost sw-btn-md">
                Cancel
              </a>
              <button type="submit" class="sw-btn sw-btn-primary sw-btn-md" [disabled]="form.invalid || saving()">
                @if (saving()) {
                  <sw-spinner size="sm" />
                } @else {
                  <span class="material-icons text-lg">save</span>
                }
                {{ isEditMode() ? 'Update Client' : 'Create Client' }}
              </button>
            </div>
          </div>
        </form>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly toast = inject(ToastService);

  isEditMode = signal(false);
  clientId = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);

  industries = [
    { value: 'IT_SOFTWARE', label: 'IT & Software' },
    { value: 'FINANCE_BANKING', label: 'Finance & Banking' },
    { value: 'HEALTHCARE', label: 'Healthcare' },
    { value: 'RETAIL', label: 'Retail' },
    { value: 'MANUFACTURING', label: 'Manufacturing' },
    { value: 'CONSTRUCTION', label: 'Construction' },
    { value: 'EDUCATION', label: 'Education' },
    { value: 'HOSPITALITY_TOURISM', label: 'Hospitality & Tourism' },
    { value: 'LOGISTICS_TRANSPORT', label: 'Logistics & Transport' },
    { value: 'LEGAL', label: 'Legal' },
    { value: 'MARKETING_ADVERTISING', label: 'Marketing & Advertising' },
    { value: 'HUMAN_RESOURCES', label: 'Human Resources' },
    { value: 'ENGINEERING', label: 'Engineering' },
    { value: 'MINING', label: 'Mining' },
    { value: 'AGRICULTURE', label: 'Agriculture' },
    { value: 'TELECOMMUNICATIONS', label: 'Telecommunications' },
    { value: 'REAL_ESTATE', label: 'Real Estate' },
    { value: 'MEDIA_ENTERTAINMENT', label: 'Media & Entertainment' },
    { value: 'GOVERNMENT_PUBLIC_SECTOR', label: 'Government & Public Sector' },
    { value: 'NON_PROFIT', label: 'Non-Profit' },
    { value: 'OTHER', label: 'Other' }
  ];

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    industry: [''],
    contactPerson: [''],
    contactEmail: ['', [Validators.email]],
    contactPhone: [''],
    website: [''],
    notes: [''],
    active: [true]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.clientId.set(id);
      this.loadClient(id);
    }
  }

  private loadClient(id: string): void {
    this.loading.set(true);
    this.recruitmentService.getClient(id).subscribe({
      next: (client) => {
        this.form.patchValue({
          name: client.name,
          industry: client.industry || '',
          contactPerson: client.contactPerson || '',
          contactEmail: client.contactEmail || '',
          contactPhone: client.contactPhone || '',
          website: client.website || '',
          notes: client.notes || '',
          active: client.active
        });
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load client', err);
        this.toast.error('Failed to load client');
        this.router.navigate(['/recruitment/clients']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    const formValue = this.form.getRawValue();

    if (this.isEditMode()) {
      const request: UpdateClientRequest = {
        name: formValue.name,
        industry: formValue.industry || undefined,
        contactPerson: formValue.contactPerson || undefined,
        contactEmail: formValue.contactEmail || undefined,
        contactPhone: formValue.contactPhone || undefined,
        website: formValue.website || undefined,
        notes: formValue.notes || undefined,
        active: formValue.active
      };

      this.recruitmentService.updateClient(this.clientId()!, request).subscribe({
        next: (client) => {
          this.toast.success('Client updated successfully');
          this.router.navigate(['/recruitment/clients', client.id]);
        },
        error: (err) => {
          console.error('Failed to update client', err);
          this.toast.error('Failed to update client');
          this.saving.set(false);
        }
      });
    } else {
      const request: CreateClientRequest = {
        name: formValue.name,
        industry: formValue.industry || undefined,
        contactPerson: formValue.contactPerson || undefined,
        contactEmail: formValue.contactEmail || undefined,
        contactPhone: formValue.contactPhone || undefined,
        website: formValue.website || undefined,
        notes: formValue.notes || undefined
      };

      this.recruitmentService.createClient(request).subscribe({
        next: (client) => {
          this.toast.success('Client created successfully');
          this.router.navigate(['/recruitment/clients', client.id]);
        },
        error: (err) => {
          console.error('Failed to create client', err);
          this.toast.error('Failed to create client');
          this.saving.set(false);
        }
      });
    }
  }
}
