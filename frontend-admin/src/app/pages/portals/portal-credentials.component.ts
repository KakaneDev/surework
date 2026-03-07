import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  PortalAdminService,
  PortalCredentials,
  JobPortal,
  ConnectionStatus,
  PortalHealthSummary
} from '@core/services/portal-admin.service';
import { BadgeComponent, BadgeColor } from '@core/components/ui/badge.component';
import { ButtonComponent } from '@core/components/ui/button.component';
import { CardComponent } from '@core/components/ui/card.component';
import { ModalComponent } from '@core/components/ui/modal.component';

@Component({
  selector: 'app-portal-credentials',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    ModalComponent
  ],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Portal Credentials</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage SureWork's job portal integrations
          </p>
        </div>
        <app-button (click)="refreshAll()" [loading]="refreshing()">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Refresh Status
        </app-button>
      </div>

      <!-- Health Summary Cards -->
      @if (healthSummary()) {
        <div class="stats-grid">
          <div class="stats-card">
            <p class="stats-card-label">Total Portals</p>
            <p class="stats-card-value">{{ healthSummary()?.totalPortals }}</p>
          </div>
          <div class="stats-card">
            <p class="stats-card-label">Active Portals</p>
            <p class="stats-card-value text-green-600 dark:text-green-400">{{ healthSummary()?.activePortals }}</p>
          </div>
          <div class="stats-card">
            <p class="stats-card-label">Needing Attention</p>
            <p class="stats-card-value" [class.text-amber-600]="(healthSummary()?.portalsNeedingAttention ?? 0) > 0">
              {{ healthSummary()?.portalsNeedingAttention }}
            </p>
          </div>
          <div class="stats-card">
            <p class="stats-card-label">Posts Today</p>
            <p class="stats-card-value">{{ healthSummary()?.totalPostsToday }}</p>
          </div>
        </div>
      }

      <!-- Portal Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (creds of credentials(); track creds.id) {
          <app-card>
            <div class="p-5">
              <!-- Portal Header -->
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <img [src]="getPortalIcon(creds.portal)" [alt]="creds.portal" class="w-6 h-6"
                      onerror="this.style.display='none'" />
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-900 dark:text-white">{{ getPortalLabel(creds.portal) }}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ creds.username || 'Not configured' }}</p>
                  </div>
                </div>
                <app-badge [color]="getStatusBadgeColor(creds.connectionStatus)">
                  {{ formatStatus(creds.connectionStatus) }}
                </app-badge>
              </div>

              <!-- Stats -->
              <div class="grid grid-cols-3 gap-4 mb-4 text-center">
                <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ creds.postsToday }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Posts Today</p>
                </div>
                <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ creds.dailyRateLimit }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Daily Limit</p>
                </div>
                <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                  <p class="text-2xl font-semibold" [class]="creds.remainingPosts > 10 ? 'text-green-600' : 'text-amber-600'">
                    {{ creds.remainingPosts }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
                </div>
              </div>

              <!-- Error Message -->
              @if (creds.lastError) {
                <div class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p class="text-sm text-red-700 dark:text-red-400">{{ creds.lastError }}</p>
                </div>
              }

              <!-- Last Verified -->
              @if (creds.lastVerifiedAt) {
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Last verified: {{ creds.lastVerifiedAt | date:'medium' }}
                </p>
              }

              <!-- Actions -->
              <div class="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <app-button variant="outline" size="sm" (click)="openEditModal(creds)">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  Edit
                </app-button>
                <app-button variant="outline" size="sm" (click)="testConnection(creds.portal)" [loading]="testingPortal() === creds.portal">
                  Test Connection
                </app-button>
                @if (creds.active) {
                  <app-button variant="outline" size="sm" (click)="toggleActive(creds.portal, false)">
                    Deactivate
                  </app-button>
                } @else {
                  <app-button size="sm" (click)="toggleActive(creds.portal, true)" [disabled]="!creds.hasPassword">
                    Activate
                  </app-button>
                }
              </div>
            </div>
          </app-card>
        }
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    </div>

    <!-- Edit Modal -->
    @if (showEditModal()) {
      <app-modal [isOpen]="true" [title]="'Edit ' + getPortalLabel(editingPortal()!)" (close)="closeEditModal()">
        <form [formGroup]="editForm" (ngSubmit)="saveCredentials()">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username / Email
              </label>
              <input
                type="text"
                formControlName="username"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter portal username or email"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                formControlName="password"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter portal password"
              />
              <p class="mt-1 text-xs text-gray-500">Leave blank to keep existing password</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional Config (JSON)
              </label>
              <textarea
                formControlName="additionalConfig"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder='{"companyPageId": "..."}'
              ></textarea>
            </div>
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                formControlName="active"
                id="active"
                class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label for="active" class="text-sm text-gray-700 dark:text-gray-300">
                Activate portal for posting
              </label>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <app-button type="button" variant="outline" (click)="closeEditModal()">
              Cancel
            </app-button>
            <app-button type="submit" [loading]="saving()" [disabled]="editForm.invalid">
              Save Credentials
            </app-button>
          </div>
        </form>
      </app-modal>
    }
  `
})
export class PortalCredentialsComponent implements OnInit {
  private portalService = inject(PortalAdminService);
  private fb = inject(FormBuilder);

  loading = signal(true);
  refreshing = signal(false);
  credentials = signal<PortalCredentials[]>([]);
  healthSummary = signal<PortalHealthSummary | null>(null);
  testingPortal = signal<JobPortal | null>(null);

  // Edit modal state
  showEditModal = signal(false);
  editingPortal = signal<JobPortal | null>(null);
  saving = signal(false);
  editForm: FormGroup;

  constructor() {
    this.editForm = this.fb.group({
      username: ['', Validators.required],
      password: [''],
      additionalConfig: [''],
      active: [false]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.portalService.getCredentials().subscribe({
      next: (creds) => {
        this.credentials.set(creds);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.setMockData();
      }
    });

    this.portalService.getHealthSummary().subscribe({
      next: (summary) => this.healthSummary.set(summary),
      error: () => this.setMockHealthSummary()
    });
  }

  refreshAll(): void {
    this.refreshing.set(true);
    this.portalService.getCredentials().subscribe({
      next: (creds) => {
        this.credentials.set(creds);
        this.refreshing.set(false);
      },
      error: () => this.refreshing.set(false)
    });

    this.portalService.getHealthSummary().subscribe({
      next: (summary) => this.healthSummary.set(summary)
    });
  }

  testConnection(portal: JobPortal): void {
    this.testingPortal.set(portal);
    this.portalService.testConnection(portal).subscribe({
      next: (result) => {
        this.testingPortal.set(null);
        if (result.success) {
          alert(`Connection successful: ${result.message}`);
        } else {
          alert(`Connection failed: ${result.message}`);
        }
        this.loadData();
      },
      error: (err) => {
        this.testingPortal.set(null);
        alert(`Test failed: ${err.message}`);
      }
    });
  }

  toggleActive(portal: JobPortal, active: boolean): void {
    const action = active
      ? this.portalService.activatePortal(portal)
      : this.portalService.deactivatePortal(portal);

    action.subscribe({
      next: () => this.loadData(),
      error: (err) => alert(`Failed to ${active ? 'activate' : 'deactivate'} portal: ${err.message}`)
    });
  }

  openEditModal(creds: PortalCredentials): void {
    this.editingPortal.set(creds.portal);
    this.editForm.patchValue({
      username: creds.username || '',
      password: '',
      additionalConfig: '',
      active: creds.active
    });
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingPortal.set(null);
    this.editForm.reset();
  }

  saveCredentials(): void {
    if (this.editForm.invalid || !this.editingPortal()) return;

    this.saving.set(true);
    const portal = this.editingPortal()!;
    const formValue = this.editForm.value;

    this.portalService.updateCredentials(portal, {
      username: formValue.username,
      password: formValue.password,
      additionalConfig: formValue.additionalConfig || undefined,
      active: formValue.active
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeEditModal();
        this.loadData();
      },
      error: (err) => {
        this.saving.set(false);
        alert(`Failed to save credentials: ${err.message}`);
      }
    });
  }

  getPortalLabel(portal: JobPortal): string {
    return this.portalService.getPortalLabel(portal);
  }

  getPortalIcon(portal: JobPortal): string {
    return `/assets/icons/portals/${portal.toLowerCase()}.svg`;
  }

  getStatusBadgeColor(status: ConnectionStatus): BadgeColor {
    const colorMap: Record<ConnectionStatus, BadgeColor> = {
      NOT_CONFIGURED: 'gray',
      CONNECTED: 'success',
      SESSION_EXPIRED: 'warning',
      INVALID_CREDENTIALS: 'error',
      RATE_LIMITED: 'warning',
      CAPTCHA_REQUIRED: 'warning',
      ERROR: 'error'
    };
    return colorMap[status] || 'gray';
  }

  formatStatus(status: ConnectionStatus): string {
    const labels: Record<ConnectionStatus, string> = {
      NOT_CONFIGURED: 'Not Configured',
      CONNECTED: 'Connected',
      SESSION_EXPIRED: 'Session Expired',
      INVALID_CREDENTIALS: 'Invalid Credentials',
      RATE_LIMITED: 'Rate Limited',
      CAPTCHA_REQUIRED: 'CAPTCHA Required',
      ERROR: 'Error'
    };
    return labels[status] || status;
  }

  private setMockData(): void {
    this.credentials.set([
      { id: '1', portal: 'PNET', username: 'sur****@surework.co.za', hasPassword: true, active: true, connectionStatus: 'CONNECTED', dailyRateLimit: 50, postsToday: 12, remainingPosts: 38, lastVerifiedAt: '2024-01-20T10:30:00Z', lastError: null, rateLimitResetAt: null },
      { id: '2', portal: 'LINKEDIN', username: 'job****@surework.co.za', hasPassword: true, active: true, connectionStatus: 'SESSION_EXPIRED', dailyRateLimit: 25, postsToday: 8, remainingPosts: 17, lastVerifiedAt: '2024-01-19T14:00:00Z', lastError: 'Session expired - need to re-authenticate', rateLimitResetAt: null },
      { id: '3', portal: 'INDEED', username: 'car****@surework.co.za', hasPassword: true, active: true, connectionStatus: 'CONNECTED', dailyRateLimit: 40, postsToday: 5, remainingPosts: 35, lastVerifiedAt: '2024-01-20T09:00:00Z', lastError: null, rateLimitResetAt: null },
      { id: '4', portal: 'CAREERS24', username: null, hasPassword: false, active: false, connectionStatus: 'NOT_CONFIGURED', dailyRateLimit: 50, postsToday: 0, remainingPosts: 0, lastVerifiedAt: null, lastError: null, rateLimitResetAt: null }
    ]);
  }

  private setMockHealthSummary(): void {
    this.healthSummary.set({
      totalPortals: 4,
      activePortals: 3,
      portalsNeedingAttention: 1,
      totalPostsToday: 25,
      portals: []
    });
  }
}
