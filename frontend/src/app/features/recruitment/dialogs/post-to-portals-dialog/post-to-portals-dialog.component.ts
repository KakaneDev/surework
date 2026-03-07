import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  RecruitmentService,
  JobPosting,
  JobPortal,
  CompanyMentionPreference,
  PortalStatus
} from '../../../../core/services/recruitment.service';
import { SpinnerComponent, ButtonComponent, DialogRef, ToastService } from '@shared/ui';

interface DialogData {
  job: JobPosting;
}

interface PortalOption {
  portal: JobPortal;
  label: string;
  icon: string;
  iconClass: string;
  available: boolean;
  statusLabel: string;
  statusClass: string;
  selected: boolean;
}

interface MissingField {
  field: string;
  portal: JobPortal;
}

@Component({
  selector: 'app-post-to-portals-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SpinnerComponent,
    ButtonComponent
  ],
  template: `
    <div class="flex flex-col max-h-[85vh]">
      <!-- Fixed Header -->
      <div class="px-5 pt-5 pb-4 border-b border-neutral-200 dark:border-dark-border shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0">
            <span class="material-icons text-white text-lg">share</span>
          </div>
          <div class="min-w-0">
            <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
              Post to External Portals
            </h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 truncate">
              {{ data.job.title }}
            </p>
          </div>
          <button (click)="cancel()" class="ml-auto shrink-0 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors">
            <span class="material-icons text-neutral-400 text-xl">close</span>
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center items-center py-16">
          <sw-spinner size="lg" />
        </div>
      } @else if (loadError()) {
        <div class="px-5 py-12 text-center">
          <span class="material-icons text-4xl text-danger-400 mb-3 block">error_outline</span>
          <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-4">Failed to load portal statuses. Please try again.</p>
          <sw-button variant="outline" size="sm" (clicked)="loadPortalStatuses()">
            <span class="material-icons text-base">refresh</span>
            Retry
          </sw-button>
        </div>
      } @else {
        <!-- Scrollable Body -->
        <div class="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <!-- Portal Selection -->
          <div>
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">Select Portals</label>
            @if (availablePortalCount() === 0) {
              <div class="p-4 bg-neutral-50 dark:bg-dark-elevated rounded-lg border border-neutral-200 dark:border-dark-border text-center">
                <span class="material-icons text-2xl text-neutral-400 mb-2 block">cloud_off</span>
                <p class="text-sm text-neutral-600 dark:text-neutral-400">No active portals available.</p>
                <p class="text-xs text-neutral-500 dark:text-neutral-500 mt-1">Contact your administrator to activate portals in Portal Management.</p>
              </div>
            } @else {
              <div class="grid grid-cols-2 gap-2.5">
                @for (portal of portalOptions(); track portal.portal) {
                  <button
                    type="button"
                    (click)="togglePortal(portal.portal)"
                    [disabled]="!portal.available"
                    class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all text-left"
                    [ngClass]="{
                      'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500/30': portal.selected && portal.available,
                      'border-neutral-200 dark:border-dark-border hover:border-neutral-300 dark:hover:border-neutral-600': !portal.selected && portal.available,
                      'border-neutral-100 dark:border-dark-border/50 opacity-50 cursor-not-allowed': !portal.available
                    }"
                  >
                    <span class="material-icons text-xl shrink-0" [ngClass]="portal.available ? portal.iconClass : 'text-neutral-300 dark:text-neutral-600'">{{ portal.icon }}</span>
                    <div class="flex-1 min-w-0">
                      <span class="text-sm font-medium text-neutral-800 dark:text-neutral-200 block">{{ portal.label }}</span>
                      <span class="text-[11px] flex items-center gap-0.5" [ngClass]="portal.statusClass">
                        <span class="material-icons" style="font-size: 11px">{{ portal.available ? 'check_circle' : 'link_off' }}</span>
                        {{ portal.statusLabel }}
                      </span>
                    </div>
                    @if (portal.selected && portal.available) {
                      <span class="material-icons text-primary-500 text-lg shrink-0">check_circle</span>
                    }
                  </button>
                }
              </div>
            }
          </div>

          <!-- Missing Fields Warning -->
          @if (missingFields().length > 0) {
            <div class="p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-800">
              <div class="flex items-start gap-2">
                <span class="material-icons text-warning-600 dark:text-warning-400 text-lg shrink-0 mt-0.5">warning</span>
                <div>
                  <h4 class="text-sm font-medium text-warning-800 dark:text-warning-300 mb-1">Missing Required Fields</h4>
                  <ul class="text-xs text-warning-700 dark:text-warning-400 list-disc list-inside space-y-0.5">
                    @for (field of missingFields(); track field.field + field.portal) {
                      <li>{{ field.field }} ({{ getPortalLabel(field.portal) }})</li>
                    }
                  </ul>
                </div>
              </div>
            </div>
          }

          <!-- Company Mention Preference -->
          <div>
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Company Mention</label>
            <select [formControl]="companyMentionControl" class="sw-input w-full text-sm">
              @for (pref of companyMentionOptions; track pref.value) {
                <option [value]="pref.value">{{ pref.label }}</option>
              }
            </select>
            <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
              {{ getCompanyMentionDescription(companyMentionControl.value ?? 'ANONYMOUS') }}
            </p>
          </div>

          <!-- Compact Job Preview -->
          <div class="border border-neutral-200 dark:border-dark-border rounded-lg overflow-hidden">
            <div class="px-3 py-2 bg-neutral-50 dark:bg-dark-elevated border-b border-neutral-200 dark:border-dark-border">
              <h4 class="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <span class="material-icons text-base">visibility</span>
                Preview
              </h4>
            </div>
            <div class="px-3 py-2.5 space-y-2 text-sm">
              <div class="flex items-baseline gap-2">
                <span class="text-[11px] text-neutral-400 uppercase tracking-wider w-16 shrink-0">Title</span>
                <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ data.job.title }}</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-[11px] text-neutral-400 uppercase tracking-wider w-16 shrink-0">Location</span>
                <span class="text-neutral-700 dark:text-neutral-300">{{ getFullLocation() || 'Not specified' }}</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-[11px] text-neutral-400 uppercase tracking-wider w-16 shrink-0">Type</span>
                <span class="text-neutral-700 dark:text-neutral-300">{{ getEmploymentTypeLabel(data.job.employmentType) }}</span>
              </div>
              @if (data.job.salaryRange && data.job.showSalary) {
                <div class="flex items-baseline gap-2">
                  <span class="text-[11px] text-neutral-400 uppercase tracking-wider w-16 shrink-0">Salary</span>
                  <span class="text-neutral-700 dark:text-neutral-300">{{ data.job.salaryRange }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Application URL -->
          <div class="flex items-start gap-2 px-3 py-2.5 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <span class="material-icons text-primary-500 dark:text-primary-400 text-base shrink-0 mt-0.5">info</span>
            <p class="text-xs text-primary-700 dark:text-primary-400">
              Candidates apply at: <span class="font-mono font-medium">careers.surework.co.za/apply/{{ data.job.jobReference }}</span>
            </p>
          </div>
        </div>

        <!-- Fixed Footer -->
        <div class="px-5 py-3 border-t border-neutral-200 dark:border-dark-border shrink-0 flex items-center justify-between">
          <span class="text-xs text-neutral-500 dark:text-neutral-400">
            @if (selectedPortalCount() > 0) {
              {{ selectedPortalCount() }} portal{{ selectedPortalCount() > 1 ? 's' : '' }} selected
            }
          </span>
          <div class="flex gap-2">
            <sw-button variant="ghost" size="sm" [disabled]="submitting()" (clicked)="cancel()">
              Cancel
            </sw-button>
            <sw-button
              variant="primary"
              size="sm"
              [disabled]="selectedPortalCount() === 0 || missingFields().length > 0"
              [loading]="submitting()"
              (clicked)="onSubmit()"
            >
              <span class="material-icons text-base">send</span>
              Queue for Posting
            </sw-button>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostToPortalsDialogComponent implements OnInit {
  private readonly dialogRef: DialogRef = inject('DIALOG_REF' as any);
  readonly data: DialogData = inject('DIALOG_DATA' as any);
  private readonly fb = inject(FormBuilder);
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly toast = inject(ToastService);

  // State
  loading = signal(true);
  loadError = signal(false);
  submitting = signal(false);
  portalStatuses = signal<PortalStatus[]>([]);
  selectedPortals = signal<Set<JobPortal>>(new Set());

  // Form control for company mention preference
  companyMentionControl = this.fb.control<CompanyMentionPreference>(
    this.data.job.companyMentionPreference || 'ANONYMOUS'
  );

  companyMentionOptions = [
    { value: 'ANONYMOUS' as CompanyMentionPreference, label: 'Anonymous' },
    { value: 'NAMED_BY_SUREWORK' as CompanyMentionPreference, label: 'Named by SureWork' },
    { value: 'DIRECT_MENTION' as CompanyMentionPreference, label: 'Direct company mention' }
  ];

  // Computed portal options — a portal is only available if CONNECTED and active
  portalOptions = computed<PortalOption[]>(() => {
    const statuses = this.portalStatuses();
    const selected = this.selectedPortals();

    const portals: { portal: JobPortal; label: string; icon: string; iconClass: string }[] = [
      { portal: 'LINKEDIN', label: 'LinkedIn', icon: 'work', iconClass: 'text-blue-600' },
      { portal: 'PNET', label: 'Pnet', icon: 'public', iconClass: 'text-orange-500' },
      { portal: 'CAREERS24', label: 'Careers24', icon: 'language', iconClass: 'text-green-600' },
      { portal: 'INDEED', label: 'Indeed', icon: 'search', iconClass: 'text-purple-600' }
    ];

    return portals.map(p => {
      const status = statuses.find(s => s.portal === p.portal);
      const isConnected = status?.connectionStatus === 'CONNECTED';
      const isActive = status?.isActive === true;
      const available = isConnected && isActive;

      let statusLabel: string;
      let statusClass: string;

      if (!status || status.connectionStatus === 'NOT_CONFIGURED') {
        statusLabel = 'Not configured';
        statusClass = 'text-neutral-400';
      } else if (!isActive) {
        statusLabel = 'Inactive';
        statusClass = 'text-neutral-400';
      } else if (isConnected) {
        statusLabel = 'Active';
        statusClass = 'text-success-600 dark:text-success-400';
      } else {
        statusLabel = status.connectionStatus.replace(/_/g, ' ').toLowerCase();
        statusClass = 'text-warning-600 dark:text-warning-400';
      }

      return {
        ...p,
        available,
        statusLabel,
        statusClass,
        selected: selected.has(p.portal)
      };
    });
  });

  // Computed counts
  selectedPortalCount = computed(() => this.selectedPortals().size);
  availablePortalCount = computed(() => this.portalOptions().filter(p => p.available).length);

  // Computed missing fields
  missingFields = computed<MissingField[]>(() => {
    const selected = this.selectedPortals();
    const job = this.data.job;
    const missing: MissingField[] = [];

    selected.forEach(portal => {
      if (!job.description) {
        missing.push({ field: 'Description', portal });
      }
      if (portal === 'PNET' || portal === 'CAREERS24') {
        if (!job.city) {
          missing.push({ field: 'City', portal });
        }
        if (!job.province) {
          missing.push({ field: 'Province', portal });
        }
      }
      if (portal === 'LINKEDIN') {
        if (!job.location && !job.city) {
          missing.push({ field: 'Location', portal });
        }
      }
    });

    const seen = new Set<string>();
    return missing.filter(m => {
      const key = m.field;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });

  ngOnInit(): void {
    this.loadPortalStatuses();
  }

  loadPortalStatuses(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.recruitmentService.getPortalStatuses().subscribe({
      next: (statuses) => {
        this.portalStatuses.set(statuses);
        // Pre-select portals that were previously selected, but only if still available
        if (this.data.job.externalPortals) {
          const availablePortals = statuses
            .filter(s => s.connectionStatus === 'CONNECTED' && s.isActive)
            .map(s => s.portal);
          const preSelected = this.data.job.externalPortals.filter(p => availablePortals.includes(p));
          this.selectedPortals.set(new Set(preSelected));
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load portal statuses', err);
        this.loading.set(false);
        this.loadError.set(true);
      }
    });
  }

  togglePortal(portal: JobPortal): void {
    const current = this.selectedPortals();
    const newSet = new Set(current);

    if (newSet.has(portal)) {
      newSet.delete(portal);
    } else {
      newSet.add(portal);
    }

    this.selectedPortals.set(newSet);
  }

  getPortalLabel(portal: JobPortal): string {
    return RecruitmentService.getJobPortalLabel(portal);
  }

  getEmploymentTypeLabel(type: string): string {
    return RecruitmentService.getEmploymentTypeLabel(type as any);
  }

  getCompanyMentionDescription(value: CompanyMentionPreference): string {
    const descriptions: Record<CompanyMentionPreference, string> = {
      ANONYMOUS: 'Posted as "A leading company in the industry..."',
      NAMED_BY_SUREWORK: 'Posted as "SureWork on behalf of [Company]..."',
      DIRECT_MENTION: 'Your company name appears directly in the posting'
    };
    return descriptions[value] || '';
  }

  getFullLocation(): string {
    const parts: string[] = [];
    if (this.data.job.city) parts.push(this.data.job.city);
    if (this.data.job.province) parts.push(RecruitmentService.getProvinceLabel(this.data.job.province));
    if (parts.length === 0 && this.data.job.location) return this.data.job.location;
    return parts.join(', ');
  }

  cancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.selectedPortalCount() === 0 || this.missingFields().length > 0) return;

    this.submitting.set(true);

    const portals = Array.from(this.selectedPortals());
    const options = {
      companyMentionPreference: this.companyMentionControl.value || undefined
    };

    this.recruitmentService.postToPortals(this.data.job.id, portals, options).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toast.success(`Job queued for posting to ${portals.length} portal(s)`);
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Failed to queue job for posting', err);
        this.toast.error('Failed to queue job for posting. Please try again.');
        this.submitting.set(false);
      }
    });
  }
}
