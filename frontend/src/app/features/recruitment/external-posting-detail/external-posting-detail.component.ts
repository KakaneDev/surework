import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  RecruitmentService,
  ExternalJobPosting,
  ExternalPostingStatus,
  JobPortal,
  ExternalPostingAudit
} from '../../../core/services/recruitment.service';
import {
  SpinnerComponent,
  ButtonComponent,
  ToastService,
  DropdownComponent,
  DropdownItemComponent
} from '@shared/ui';

@Component({
  selector: 'app-external-posting-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    DatePipe,
    TranslateModule,
    SpinnerComponent,
    ButtonComponent,
    DropdownComponent,
    DropdownItemComponent
  ],
  template: `
    <div class="space-y-6">
      @if (loading()) {
        <div class="flex justify-center items-center py-24">
          <sw-spinner size="lg" />
        </div>
      } @else if (error()) {
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-5xl text-error-500 mb-4">error</span>
          <p class="text-neutral-600 dark:text-neutral-400 mb-4">{{ error() }}</p>
          <a routerLink="/recruitment/external-postings" class="px-4 py-2 text-primary-500 hover:text-primary-600 font-medium">
            Back to External Postings
          </a>
        </div>
      } @else if (posting()) {
        <!-- Header -->
        <div class="sw-page-header">
          <div class="flex items-center gap-3">
            <a routerLink="/recruitment/external-postings" class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors" aria-label="Back">
              <span class="material-icons" aria-hidden="true">arrow_back</span>
            </a>
            <div class="flex items-center gap-3">
              <span class="material-icons text-2xl" [ngClass]="getPortalIconClass(posting()!.portal)">{{ getPortalIcon(posting()!.portal) }}</span>
              <div>
                <h1 class="sw-page-title flex items-center gap-3">
                  {{ posting()!.jobTitle }}
                  <span class="inline-block px-3 py-1 rounded-full text-xs font-medium"
                        [style.background]="getStatusColor(posting()!.status).background"
                        [style.color]="getStatusColor(posting()!.status).color">
                    {{ getStatusLabel(posting()!.status) }}
                  </span>
                </h1>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">
                  {{ getPortalLabel(posting()!.portal) }} - {{ posting()!.jobReference }}
                </p>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            @if (posting()!.externalUrl) {
              <sw-button variant="outline" (clicked)="openExternalUrl()">
                <span class="material-icons text-lg">open_in_new</span>
                View on {{ getPortalLabel(posting()!.portal) }}
              </sw-button>
            }
            <sw-dropdown position="bottom-end">
              <button trigger class="inline-flex items-center gap-2 px-3 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-elevated rounded-lg">
                <span class="material-icons">more_vert</span>
                Actions
              </button>
              @if (posting()!.status === 'FAILED' || posting()!.status === 'REQUIRES_MANUAL') {
                <sw-dropdown-item icon="refresh" (click)="retryPosting()">Retry Posting</sw-dropdown-item>
              }
              @if (posting()!.status === 'POSTED') {
                <sw-dropdown-item icon="delete" (click)="removePosting()" class="text-error-600">Remove from Portal</sw-dropdown-item>
              }
            </sw-dropdown>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Main Content -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Job Info Summary -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
              <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
                <span class="material-icons text-primary-500">work</span>
                Job Information
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <span class="text-sm text-neutral-500 dark:text-neutral-400">Job Title</span>
                  <p class="font-medium text-neutral-800 dark:text-neutral-200">{{ posting()!.jobTitle }}</p>
                </div>
                <div>
                  <span class="text-sm text-neutral-500 dark:text-neutral-400">Job Reference</span>
                  <p class="font-mono text-neutral-800 dark:text-neutral-200">{{ posting()!.jobReference }}</p>
                </div>
                <div>
                  <span class="text-sm text-neutral-500 dark:text-neutral-400">Portal</span>
                  <p class="font-medium text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                    <span class="material-icons text-lg" [ngClass]="getPortalIconClass(posting()!.portal)">{{ getPortalIcon(posting()!.portal) }}</span>
                    {{ getPortalLabel(posting()!.portal) }}
                  </p>
                </div>
                <div>
                  <span class="text-sm text-neutral-500 dark:text-neutral-400">Created</span>
                  <p class="text-neutral-800 dark:text-neutral-200">{{ posting()!.createdAt | date:'medium' }}</p>
                </div>
              </div>
              <div class="mt-4 pt-4 border-t border-neutral-200 dark:border-dark-border">
                <a [routerLink]="['/recruitment/jobs', posting()!.jobPostingId]" class="text-primary-500 hover:text-primary-600 font-medium inline-flex items-center gap-1">
                  <span class="material-icons text-lg">visibility</span>
                  View Full Job Posting
                </a>
              </div>
            </div>

            <!-- Portal-Specific Information -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
              <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
                <span class="material-icons text-primary-500">info</span>
                Portal Details
              </h3>
              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <span class="text-sm text-neutral-500 dark:text-neutral-400">External Job ID</span>
                    @if (posting()!.externalJobId) {
                      <p class="font-mono text-neutral-800 dark:text-neutral-200">{{ posting()!.externalJobId }}</p>
                    } @else {
                      <p class="text-neutral-400 italic">Not assigned</p>
                    }
                  </div>
                  <div>
                    <span class="text-sm text-neutral-500 dark:text-neutral-400">Retry Count</span>
                    <p class="text-neutral-800 dark:text-neutral-200">
                      {{ posting()!.retryCount }}
                      @if (posting()!.retryCount >= 3) {
                        <span class="text-error-500 text-sm">(max reached)</span>
                      }
                    </p>
                  </div>
                </div>

                @if (posting()!.externalUrl) {
                  <div>
                    <span class="text-sm text-neutral-500 dark:text-neutral-400">External URL</span>
                    <a [href]="posting()!.externalUrl" target="_blank" rel="noopener noreferrer"
                       class="block text-primary-500 hover:text-primary-600 break-all font-mono text-sm">
                      {{ posting()!.externalUrl }}
                      <span class="material-icons text-sm align-middle ml-1">open_in_new</span>
                    </a>
                  </div>
                }

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <span class="text-sm text-neutral-500 dark:text-neutral-400">Posted At</span>
                    @if (posting()!.postedAt) {
                      <p class="text-neutral-800 dark:text-neutral-200">{{ posting()!.postedAt | date:'medium' }}</p>
                    } @else {
                      <p class="text-neutral-400 italic">Not posted yet</p>
                    }
                  </div>
                  <div>
                    <span class="text-sm text-neutral-500 dark:text-neutral-400">Expires At</span>
                    @if (posting()!.expiresAt) {
                      <p class="text-neutral-800 dark:text-neutral-200" [class.text-error-600]="isExpiringSoon(posting()!.expiresAt!)">
                        {{ posting()!.expiresAt | date:'medium' }}
                        @if (isExpiringSoon(posting()!.expiresAt!)) {
                          <span class="text-error-500 text-sm block">Expiring soon</span>
                        }
                      </p>
                    } @else {
                      <p class="text-neutral-400 italic">No expiry set</p>
                    }
                  </div>
                </div>

                @if (posting()!.lastCheckedAt) {
                  <div>
                    <span class="text-sm text-neutral-500 dark:text-neutral-400">Last Checked</span>
                    <p class="text-neutral-800 dark:text-neutral-200">{{ posting()!.lastCheckedAt | date:'medium' }}</p>
                  </div>
                }
              </div>
            </div>

            <!-- Error Message -->
            @if (posting()!.errorMessage) {
              <div class="bg-error-50 dark:bg-error-900/20 rounded-xl border border-error-200 dark:border-error-800 p-6">
                <h3 class="text-lg font-semibold text-error-800 dark:text-error-300 mb-3 flex items-center gap-2">
                  <span class="material-icons">error</span>
                  Error Details
                </h3>
                <div class="bg-white dark:bg-dark-surface rounded-lg p-4 font-mono text-sm text-error-700 dark:text-error-400 whitespace-pre-wrap">
                  {{ posting()!.errorMessage }}
                </div>
              </div>
            }

            <!-- Manual Intervention UI -->
            @if (posting()!.status === 'REQUIRES_MANUAL') {
              <div class="bg-warning-50 dark:bg-warning-900/20 rounded-xl border border-warning-200 dark:border-warning-800 p-6">
                <h3 class="text-lg font-semibold text-warning-800 dark:text-warning-300 mb-2 flex items-center gap-2">
                  <span class="material-icons">touch_app</span>
                  Manual Intervention Required
                </h3>
                <p class="text-warning-700 dark:text-warning-400 mb-4">
                  This posting requires manual action. If you have posted the job manually on {{ getPortalLabel(posting()!.portal) }}, enter the details below.
                </p>

                <form [formGroup]="manualForm" class="space-y-4">
                  <div>
                    <label class="sw-label">External Job ID</label>
                    <input type="text" formControlName="externalJobId" class="sw-input w-full" placeholder="Enter the job ID from the portal">
                    @if (manualForm.get('externalJobId')?.touched && manualForm.get('externalJobId')?.hasError('required')) {
                      <p class="text-sm text-error-500 mt-1">External Job ID is required</p>
                    }
                  </div>
                  <div>
                    <label class="sw-label">External URL</label>
                    <input type="url" formControlName="externalUrl" class="sw-input w-full" placeholder="https://...">
                    @if (manualForm.get('externalUrl')?.touched && manualForm.get('externalUrl')?.hasError('required')) {
                      <p class="text-sm text-error-500 mt-1">External URL is required</p>
                    }
                  </div>
                  <sw-button
                    variant="primary"
                    [disabled]="manualForm.invalid"
                    [loading]="resolving()"
                    (clicked)="resolveManualIntervention()"
                  >
                    <span class="material-icons text-lg">check_circle</span>
                    Mark as Resolved
                  </sw-button>
                </form>
              </div>
            }

            <!-- Audit Trail / History -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
              <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center gap-2">
                <span class="material-icons text-primary-500">history</span>
                Posting History
              </h3>

              @if (auditLoading()) {
                <div class="flex justify-center py-8">
                  <sw-spinner size="md" />
                </div>
              } @else if (auditTrail().length === 0) {
                <p class="text-neutral-500 dark:text-neutral-400 text-center py-4">No history available</p>
              } @else {
                <div class="relative">
                  <!-- Timeline line -->
                  <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-neutral-200 dark:bg-dark-border"></div>

                  <div class="space-y-6">
                    @for (entry of auditTrail(); track entry.id) {
                      <div class="relative flex gap-4">
                        <!-- Timeline dot -->
                        <div class="relative z-10 w-8 h-8 rounded-full flex items-center justify-center"
                             [ngClass]="getAuditIconBg(entry.action)">
                          <span class="material-icons text-white text-sm">{{ getAuditIcon(entry.action) }}</span>
                        </div>

                        <!-- Content -->
                        <div class="flex-1 pb-4">
                          <div class="flex items-center justify-between">
                            <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ getAuditActionLabel(entry.action) }}</span>
                            <span class="text-sm text-neutral-500 dark:text-neutral-400">{{ entry.createdAt | date:'medium' }}</span>
                          </div>
                          @if (entry.performedBy) {
                            <p class="text-sm text-neutral-500 dark:text-neutral-400">by {{ entry.performedBy }}</p>
                          }
                          @if (entry.details) {
                            <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1 bg-neutral-50 dark:bg-dark-elevated rounded px-3 py-2">
                              {{ entry.details }}
                            </p>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Quick Actions -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
              <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">Quick Actions</h3>
              <div class="space-y-2">
                @if (posting()!.status === 'FAILED' || posting()!.status === 'REQUIRES_MANUAL') {
                  <button (click)="retryPosting()" [disabled]="actionLoading()"
                          class="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-elevated text-left transition-colors">
                    <span class="material-icons text-warning-500">refresh</span>
                    <span class="text-neutral-700 dark:text-neutral-300">Retry Posting</span>
                  </button>
                }
                @if (posting()!.status === 'POSTED') {
                  <button (click)="removePosting()" [disabled]="actionLoading()"
                          class="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-error-50 dark:hover:bg-error-900/20 text-left transition-colors">
                    <span class="material-icons text-error-500">delete</span>
                    <span class="text-error-600 dark:text-error-400">Remove from Portal</span>
                  </button>
                }
                @if (posting()!.externalUrl) {
                  <a [href]="posting()!.externalUrl" target="_blank" rel="noopener noreferrer"
                     class="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-elevated text-left transition-colors">
                    <span class="material-icons text-primary-500">open_in_new</span>
                    <span class="text-neutral-700 dark:text-neutral-300">View on {{ getPortalLabel(posting()!.portal) }}</span>
                  </a>
                }
                <a [routerLink]="['/recruitment/jobs', posting()!.jobPostingId]"
                   class="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-elevated text-left transition-colors">
                  <span class="material-icons text-primary-500">visibility</span>
                  <span class="text-neutral-700 dark:text-neutral-300">View Job Posting</span>
                </a>
              </div>
            </div>

            <!-- Status Info Card -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
              <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">Status Information</h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-neutral-500 dark:text-neutral-400">Current Status</span>
                  <span class="inline-block px-3 py-1 rounded-full text-xs font-medium"
                        [style.background]="getStatusColor(posting()!.status).background"
                        [style.color]="getStatusColor(posting()!.status).color">
                    {{ getStatusLabel(posting()!.status) }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-neutral-500 dark:text-neutral-400">Retry Attempts</span>
                  <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ posting()!.retryCount }} / 3</span>
                </div>
                @if (posting()!.status === 'POSTED' && posting()!.expiresAt) {
                  <div class="flex items-center justify-between">
                    <span class="text-neutral-500 dark:text-neutral-400">Days Until Expiry</span>
                    <span class="font-medium" [class.text-error-600]="getDaysUntilExpiry() <= 7">
                      {{ getDaysUntilExpiry() }} days
                    </span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExternalPostingDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);

  // State
  posting = signal<ExternalJobPosting | null>(null);
  auditTrail = signal<ExternalPostingAudit[]>([]);
  loading = signal(true);
  auditLoading = signal(false);
  actionLoading = signal(false);
  resolving = signal(false);
  error = signal<string | null>(null);

  // Manual intervention form
  manualForm: FormGroup;

  constructor() {
    this.manualForm = this.fb.group({
      externalJobId: ['', Validators.required],
      externalUrl: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPosting(id);
      this.loadAuditTrail(id);
    } else {
      this.error.set('External posting ID not found');
      this.loading.set(false);
    }
  }

  private loadPosting(id: string): void {
    this.loading.set(true);
    this.recruitmentService.getExternalPosting(id).subscribe({
      next: (posting) => {
        this.posting.set(posting);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load external posting', err);
        this.error.set('Failed to load external posting');
        this.loading.set(false);
      }
    });
  }

  private loadAuditTrail(id: string): void {
    this.auditLoading.set(true);
    this.recruitmentService.getExternalPostingAudit(id).subscribe({
      next: (audit) => {
        this.auditTrail.set(audit);
        this.auditLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load audit trail', err);
        this.auditLoading.set(false);
      }
    });
  }

  retryPosting(): void {
    if (!this.posting()) return;

    if (confirm('Are you sure you want to retry posting this job?')) {
      this.actionLoading.set(true);
      this.recruitmentService.retryExternalPosting(this.posting()!.id).subscribe({
        next: (updated) => {
          this.posting.set(updated);
          this.loadAuditTrail(this.posting()!.id);
          this.toast.success('Posting queued for retry');
          this.actionLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to retry posting', err);
          this.toast.error('Failed to retry posting');
          this.actionLoading.set(false);
        }
      });
    }
  }

  removePosting(): void {
    if (!this.posting()) return;

    const confirmMessage = `Are you sure you want to remove this job from ${this.getPortalLabel(this.posting()!.portal)}?`;
    if (confirm(confirmMessage)) {
      this.actionLoading.set(true);
      this.recruitmentService.removeExternalPosting(this.posting()!.id).subscribe({
        next: () => {
          this.toast.success('Posting removed from portal');
          this.router.navigate(['/recruitment/external-postings']);
        },
        error: (err) => {
          console.error('Failed to remove posting', err);
          this.toast.error('Failed to remove posting');
          this.actionLoading.set(false);
        }
      });
    }
  }

  resolveManualIntervention(): void {
    if (this.manualForm.invalid || !this.posting()) return;

    this.resolving.set(true);
    const { externalJobId, externalUrl } = this.manualForm.value;

    this.recruitmentService.resolveManualIntervention(
      this.posting()!.id,
      externalJobId,
      externalUrl
    ).subscribe({
      next: () => {
        this.toast.success('Manual intervention resolved');
        this.loadPosting(this.posting()!.id);
        this.loadAuditTrail(this.posting()!.id);
        this.manualForm.reset();
        this.resolving.set(false);
      },
      error: (err) => {
        console.error('Failed to resolve manual intervention', err);
        this.toast.error('Failed to resolve manual intervention');
        this.resolving.set(false);
      }
    });
  }

  openExternalUrl(): void {
    if (this.posting()?.externalUrl) {
      window.open(this.posting()!.externalUrl, '_blank');
    }
  }

  isExpiringSoon(dateStr: string): boolean {
    const date = new Date(dateStr);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
  }

  getDaysUntilExpiry(): number {
    if (!this.posting()?.expiresAt) return 0;
    const date = new Date(this.posting()!.expiresAt!);
    const now = new Date();
    return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  getPortalLabel(portal: JobPortal): string {
    return RecruitmentService.getJobPortalLabel(portal);
  }

  getPortalIcon(portal: JobPortal): string {
    const icons: Record<JobPortal, string> = {
      LINKEDIN: 'work',
      PNET: 'public',
      CAREERS24: 'language',
      INDEED: 'search'
    };
    return icons[portal] || 'public';
  }

  getPortalIconClass(portal: JobPortal): string {
    const classes: Record<JobPortal, string> = {
      LINKEDIN: 'text-blue-600',
      PNET: 'text-orange-500',
      CAREERS24: 'text-green-600',
      INDEED: 'text-purple-600'
    };
    return classes[portal] || 'text-neutral-500';
  }

  getStatusLabel(status: ExternalPostingStatus): string {
    return RecruitmentService.getExternalPostingStatusLabel(status);
  }

  getStatusColor(status: ExternalPostingStatus): { background: string; color: string } {
    return RecruitmentService.getExternalPostingStatusColor(status);
  }

  getAuditIcon(action: string): string {
    const icons: Record<string, string> = {
      CREATED: 'add_circle',
      QUEUED: 'schedule',
      POSTING_STARTED: 'play_arrow',
      POSTED: 'check_circle',
      FAILED: 'error',
      RETRIED: 'refresh',
      MANUAL_INTERVENTION: 'warning',
      RESOLVED: 'done_all',
      EXPIRED: 'event_busy',
      REMOVED: 'delete'
    };
    return icons[action] || 'info';
  }

  getAuditIconBg(action: string): string {
    const bgs: Record<string, string> = {
      CREATED: 'bg-primary-500',
      QUEUED: 'bg-blue-500',
      POSTING_STARTED: 'bg-indigo-500',
      POSTED: 'bg-success-500',
      FAILED: 'bg-error-500',
      RETRIED: 'bg-warning-500',
      MANUAL_INTERVENTION: 'bg-orange-500',
      RESOLVED: 'bg-success-600',
      EXPIRED: 'bg-neutral-500',
      REMOVED: 'bg-error-600'
    };
    return bgs[action] || 'bg-neutral-500';
  }

  getAuditActionLabel(action: string): string {
    const labels: Record<string, string> = {
      CREATED: 'Posting Created',
      QUEUED: 'Added to Queue',
      POSTING_STARTED: 'Posting Started',
      POSTED: 'Successfully Posted',
      FAILED: 'Posting Failed',
      RETRIED: 'Retry Initiated',
      MANUAL_INTERVENTION: 'Manual Intervention Required',
      RESOLVED: 'Manually Resolved',
      EXPIRED: 'Posting Expired',
      REMOVED: 'Removed from Portal'
    };
    return labels[action] || action;
  }
}
