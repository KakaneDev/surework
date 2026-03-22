import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  ChangeDetectionStrategy,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  PortalAdminService,
  FailedPosting,
  JobPortal,
  ResolvePostingRequest
} from '@shared/services/portal-admin.service';
import { BadgeComponent, BadgeColor } from '@shared/components/ui/badge.component';
import { ButtonComponent } from '@shared/components/ui/button.component';

@Component({
  selector: 'app-manual-intervention-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BadgeComponent,
    ButtonComponent
  ],
  template: `
    <div class="fixed inset-0 z-9999 flex items-center justify-center overflow-y-auto overflow-x-hidden p-4">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" (click)="close.emit()"></div>

      <!-- Modal -->
      <div class="relative z-50 w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-theme-xl dark:border-gray-800 dark:bg-gray-dark animate-slide-up">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white/90">Manual Intervention Required</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Resolve this posting by providing the external job details
            </p>
          </div>
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-white/[0.05] dark:hover:text-gray-300 transition-colors"
            (click)="close.emit()"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-6">
          <!-- Job Details Card -->
          <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <div class="flex items-start justify-between">
              <div>
                <p class="font-semibold text-gray-900 dark:text-white text-lg">{{ posting.jobTitle }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ posting.jobReference }}</p>
              </div>
              <app-badge [color]="getPortalBadgeColor(posting.portal)" size="lg">
                {{ getPortalLabel(posting.portal) }}
              </app-badge>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-4">
              <div>
                <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tenant</span>
                <p class="text-sm text-gray-900 dark:text-white mt-1">{{ posting.tenantName || posting.tenantId }}</p>
              </div>
              <div>
                <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Retry Count</span>
                <p class="text-sm text-gray-900 dark:text-white mt-1">{{ posting.retryCount }} / 3 attempts</p>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          @if (posting.errorMessage) {
            <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <div class="flex items-start gap-3">
                <svg class="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <div>
                  <p class="font-medium text-red-800 dark:text-red-200">Error Encountered</p>
                  <p class="text-sm text-red-700 dark:text-red-300 mt-1">{{ posting.errorMessage }}</p>
                </div>
              </div>
            </div>
          }

          <!-- Screenshot Preview (if available) -->
          @if (posting.screenshotUrl) {
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Screenshot at Time of Error
              </label>
              <div class="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                <img
                  [src]="posting.screenshotUrl"
                  alt="Error screenshot"
                  class="w-full h-auto max-h-64 object-contain"
                  (error)="screenshotError.set(true)"
                />
                @if (screenshotError()) {
                  <div class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <p class="text-sm text-gray-500 dark:text-gray-400">Screenshot unavailable</p>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Instructions -->
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div class="flex items-start gap-3">
              <svg class="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                <p class="font-medium text-blue-800 dark:text-blue-200">Manual Posting Instructions</p>
                <ol class="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-decimal list-inside">
                  <li>Log in to {{ getPortalLabel(posting.portal) }} manually</li>
                  <li>Navigate to the job posting section</li>
                  <li>Create the job post with the same details</li>
                  <li>Copy the External Job ID and URL from the portal</li>
                  <li>Enter the details below to mark as resolved</li>
                </ol>
              </div>
            </div>
          </div>

          <!-- Resolution Form -->
          <form [formGroup]="resolveForm" class="space-y-4">
            <!-- Resolution Type Tabs -->
            <div class="flex border-b border-gray-200 dark:border-gray-700">
              <button
                type="button"
                [class]="resolutionType() === 'success' ? 'tab-active' : 'tab-inactive'"
                (click)="setResolutionType('success')"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                Mark as Posted
              </button>
              <button
                type="button"
                [class]="resolutionType() === 'failed' ? 'tab-active' : 'tab-inactive'"
                (click)="setResolutionType('failed')"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Mark as Permanently Failed
              </button>
            </div>

            @if (resolutionType() === 'success') {
              <!-- Success Fields -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    External Job ID <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    formControlName="externalJobId"
                    class="w-full px-3 py-2.5 border rounded-xl
                      bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                      focus:ring-2 focus:ring-brand-500 focus:border-brand-500
                      transition-colors"
                    [class.border-red-500]="resolveForm.get('externalJobId')?.invalid && resolveForm.get('externalJobId')?.touched"
                    [class.border-gray-300]="!resolveForm.get('externalJobId')?.invalid || !resolveForm.get('externalJobId')?.touched"
                    [class.dark:border-gray-600]="!resolveForm.get('externalJobId')?.invalid || !resolveForm.get('externalJobId')?.touched"
                    placeholder="e.g., 3847592837"
                  />
                  @if (resolveForm.get('externalJobId')?.invalid && resolveForm.get('externalJobId')?.touched) {
                    <p class="mt-1 text-sm text-red-500">External Job ID is required</p>
                  }
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    formControlName="expiresAt"
                    class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl
                      bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                      focus:ring-2 focus:ring-brand-500 focus:border-brand-500
                      transition-colors"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  External Job URL <span class="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  formControlName="externalUrl"
                  class="w-full px-3 py-2.5 border rounded-xl
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                    focus:ring-2 focus:ring-brand-500 focus:border-brand-500
                    transition-colors"
                  [class.border-red-500]="resolveForm.get('externalUrl')?.invalid && resolveForm.get('externalUrl')?.touched"
                  [class.border-gray-300]="!resolveForm.get('externalUrl')?.invalid || !resolveForm.get('externalUrl')?.touched"
                  [class.dark:border-gray-600]="!resolveForm.get('externalUrl')?.invalid || !resolveForm.get('externalUrl')?.touched"
                  [placeholder]="getUrlPlaceholder()"
                />
                @if (resolveForm.get('externalUrl')?.invalid && resolveForm.get('externalUrl')?.touched) {
                  <p class="mt-1 text-sm text-red-500">
                    @if (resolveForm.get('externalUrl')?.errors?.['required']) {
                      External URL is required
                    } @else {
                      Please enter a valid URL
                    }
                  </p>
                }
              </div>
            } @else {
              <!-- Failed Fields -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason for Permanent Failure
                </label>
                <textarea
                  formControlName="errorMessage"
                  rows="3"
                  class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                    focus:ring-2 focus:ring-brand-500 focus:border-brand-500
                    transition-colors"
                  placeholder="Describe why this posting cannot be completed..."
                ></textarea>
              </div>
              <div class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p class="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Warning:</strong> Marking as permanently failed will prevent further automatic retry attempts.
                  This should only be used when manual posting is not possible.
                </p>
              </div>
            }

            <!-- Notes -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes (Optional)
              </label>
              <textarea
                formControlName="notes"
                rows="2"
                class="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-brand-500 focus:border-brand-500
                  transition-colors"
                placeholder="Any additional notes about this resolution..."
              ></textarea>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <app-button variant="ghost" (click)="close.emit()">
            Cancel
          </app-button>
          <div class="flex items-center gap-3">
            @if (resolutionType() === 'success') {
              <app-button
                variant="primary"
                (click)="submitResolve()"
                [loading]="resolving()"
                [disabled]="!canSubmit()"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                Mark as Posted
              </app-button>
            } @else {
              <app-button
                variant="danger"
                (click)="submitResolve()"
                [loading]="resolving()"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Mark as Failed
              </app-button>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tab-active {
      @apply flex items-center gap-2 px-4 py-3 text-sm font-medium text-brand-600 border-b-2 border-brand-600 dark:text-brand-400 dark:border-brand-400;
    }
    .tab-inactive {
      @apply flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors;
    }
  `]
})
export class ManualInterventionDialogComponent implements OnInit {
  private portalService = inject(PortalAdminService);
  private fb = inject(FormBuilder);

  @Input({ required: true }) posting!: FailedPosting;
  @Output() close = new EventEmitter<void>();
  @Output() resolved = new EventEmitter<boolean>();

  resolving = signal(false);
  resolutionType = signal<'success' | 'failed'>('success');
  screenshotError = signal(false);

  resolveForm!: FormGroup;

  ngOnInit(): void {
    this.resolveForm = this.fb.group({
      externalJobId: ['', Validators.required],
      externalUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      expiresAt: [''],
      errorMessage: [''],
      notes: ['']
    });
  }

  setResolutionType(type: 'success' | 'failed'): void {
    this.resolutionType.set(type);

    // Update validators based on resolution type
    if (type === 'success') {
      this.resolveForm.get('externalJobId')?.setValidators([Validators.required]);
      this.resolveForm.get('externalUrl')?.setValidators([Validators.required, Validators.pattern(/^https?:\/\/.+/)]);
    } else {
      this.resolveForm.get('externalJobId')?.clearValidators();
      this.resolveForm.get('externalUrl')?.clearValidators();
    }
    this.resolveForm.get('externalJobId')?.updateValueAndValidity();
    this.resolveForm.get('externalUrl')?.updateValueAndValidity();
  }

  canSubmit(): boolean {
    if (this.resolutionType() === 'success') {
      return (this.resolveForm.get('externalJobId')?.valid ?? false) && (this.resolveForm.get('externalUrl')?.valid ?? false);
    }
    return true;
  }

  submitResolve(): void {
    if (this.resolutionType() === 'success') {
      this.resolveForm.get('externalJobId')?.markAsTouched();
      this.resolveForm.get('externalUrl')?.markAsTouched();

      if (!this.canSubmit()) {
        return;
      }
    }

    this.resolving.set(true);

    const formValue = this.resolveForm.value;
    const request: ResolvePostingRequest = {
      success: this.resolutionType() === 'success',
      externalJobId: this.resolutionType() === 'success' ? formValue.externalJobId : undefined,
      externalUrl: this.resolutionType() === 'success' ? formValue.externalUrl : undefined,
      expiresAt: formValue.expiresAt ? new Date(formValue.expiresAt).toISOString() : undefined,
      errorMessage: this.resolutionType() === 'failed' ? formValue.errorMessage : undefined
    };

    this.portalService.resolveFailedPosting(this.posting.id, request).subscribe({
      next: () => {
        this.resolving.set(false);
        this.resolved.emit(true);
      },
      error: (err) => {
        this.resolving.set(false);
        alert(`Failed to resolve posting: ${err.message}`);
      }
    });
  }

  getPortalLabel(portal: JobPortal): string {
    return this.portalService.getPortalLabel(portal);
  }

  getPortalBadgeColor(portal: JobPortal): BadgeColor {
    const colors: Record<JobPortal, BadgeColor> = {
      PNET: 'info',
      LINKEDIN: 'brand',
      INDEED: 'info',
      CAREERS24: 'info'
    };
    return colors[portal] || 'gray';
  }

  getUrlPlaceholder(): string {
    const placeholders: Record<JobPortal, string> = {
      LINKEDIN: 'https://www.linkedin.com/jobs/view/123456789',
      PNET: 'https://www.pnet.co.za/jobs/view/123456',
      INDEED: 'https://www.indeed.com/viewjob?jk=abc123',
      CAREERS24: 'https://www.careers24.com/jobs/view/123456'
    };
    return placeholders[this.posting.portal] || 'https://...';
  }
}
