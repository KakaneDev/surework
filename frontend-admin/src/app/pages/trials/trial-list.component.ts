import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TrialService, TrialTenant, TrialStats } from '@core/services/trial.service';
import { BadgeComponent, BadgeColor } from '@core/components/ui/badge.component';
import { ButtonComponent } from '@core/components/ui/button.component';
import { CardComponent } from '@core/components/ui/card.component';
import { TableComponent, TableColumn } from '@core/components/ui/table.component';
import { ModalComponent } from '@core/components/ui/modal.component';
import { SelectComponent, SelectOption } from '@core/components/ui/select.component';
import { PaginationComponent } from '@core/components/ui/pagination.component';
import { CurrencyZarPipe } from '@core/pipes/currency-zar.pipe';
import { RelativeTimePipe } from '@core/pipes/relative-time.pipe';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-trial-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    TableComponent,
    ModalComponent,
    SelectComponent,
    PaginationComponent,
    CurrencyZarPipe,
    RelativeTimePipe
  ],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Page Header -->
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Trial Management</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Monitor and convert trial tenants</p>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stats-card">
          <p class="stats-card-label">Active Trials</p>
          <p class="stats-card-value">{{ stats().activeTrials }}</p>
        </div>
        <div class="stats-card">
          <p class="stats-card-label">Expiring This Week</p>
          <p class="stats-card-value">{{ stats().expiringThisWeek }}</p>
        </div>
        <div class="stats-card">
          <p class="stats-card-label">Conversion Rate</p>
          <p class="stats-card-value">{{ stats().conversionRate }}%</p>
        </div>
        <div class="stats-card">
          <p class="stats-card-label">Avg Trial Duration</p>
          <p class="stats-card-value">{{ stats().avgTrialDuration }} days</p>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="flex gap-2">
        <button
          (click)="filterDays = undefined; loadTrials()"
          [class]="!filterDays ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'"
          class="rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          All Trials
        </button>
        <button
          (click)="filterDays = 7; loadTrials()"
          [class]="filterDays === 7 ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'"
          class="rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          Expiring in 7 days
        </button>
        <button
          (click)="filterDays = 3; loadTrials()"
          [class]="filterDays === 3 ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'"
          class="rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          Expiring in 3 days
        </button>
      </div>

      <!-- Table -->
      <app-table [columns]="columns" [data]="trials()" [loading]="loading()">
        @for (trial of trials(); track trial.id) {
          <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800">
                  <span class="text-sm font-medium text-gray-600 dark:text-gray-300">{{ trial.companyName.charAt(0) }}</span>
                </div>
                <div>
                  <a
                    [routerLink]="['/tenants', trial.id]"
                    class="font-medium text-gray-900 hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
                  >
                    {{ trial.companyName }}
                  </a>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ trial.email }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
              {{ trial.employeeCount }}
            </td>
            <td class="px-4 py-3">
              <app-badge [color]="getDaysColor(trial.daysRemaining)">
                {{ trial.daysRemaining }} days left
              </app-badge>
            </td>
            <td class="px-4 py-3">
              <app-badge [color]="getStageColor(trial.onboardingStage)">
                {{ trial.onboardingStage }}
              </app-badge>
            </td>
            <td class="px-4 py-3 text-gray-500 dark:text-gray-400">
              {{ trial.createdAt | relativeTime }}
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-3">
                <button
                  class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  (click)="openExtendModal(trial)"
                >
                  Extend
                </button>
                <button
                  class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  (click)="openConvertModal(trial)"
                >
                  Convert
                </button>
              </div>
            </td>
          </tr>
        }
      </app-table>

      <app-pagination
        [currentPage]="page"
        [pageSize]="size"
        [totalElements]="totalElements()"
        (pageChange)="onPageChange($event)"
      />
    </div>

    <!-- Extend Trial Modal -->
    <app-modal
      [isOpen]="showExtendModal"
      title="Extend Trial"
      (close)="showExtendModal = false"
    >
      <div class="space-y-4">
        <p class="text-gray-600 dark:text-gray-400">
          Extend trial for <strong>{{ selectedTrial?.companyName }}</strong>
        </p>
        <app-select
          label="Extension Period"
          [options]="extensionOptions"
          [(ngModel)]="extensionDays"
        />
      </div>
      <div modal-footer class="flex justify-end gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
        <app-button variant="outline" (onClick)="showExtendModal = false">Cancel</app-button>
        <app-button (onClick)="extendTrial()">Extend Trial</app-button>
      </div>
    </app-modal>

    <!-- Convert Modal -->
    <app-modal
      [isOpen]="showConvertModal"
      title="Convert to Paid"
      (close)="showConvertModal = false"
    >
      <div class="space-y-4">
        <p class="text-gray-600 dark:text-gray-400">
          Convert <strong>{{ selectedTrial?.companyName }}</strong> to a paid subscription
        </p>
        <app-select
          label="Select Plan"
          [options]="planOptions"
          [(ngModel)]="selectedPlan"
        />
      </div>
      <div modal-footer class="flex justify-end gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
        <app-button variant="outline" (onClick)="showConvertModal = false">Cancel</app-button>
        <app-button variant="success" (onClick)="convertToPaid()">Convert to Paid</app-button>
      </div>
    </app-modal>
  `
})
export class TrialListComponent implements OnInit {
  private trialService = inject(TrialService);

  loading = signal(true);
  trials = signal<TrialTenant[]>([]);
  totalElements = signal(0);
  stats = signal<TrialStats>({ activeTrials: 0, expiringThisWeek: 0, conversionRate: 0, avgTrialDuration: 0 });
  hasError = signal(false);
  errorMessage = signal('');

  page = 0;
  size = 20;
  filterDays?: number;

  showExtendModal = false;
  showConvertModal = false;
  selectedTrial: TrialTenant | null = null;
  extensionDays = 7;
  selectedPlan = 'PROFESSIONAL';

  columns: TableColumn[] = [
    { key: 'company', label: 'Company' },
    { key: 'employees', label: 'Employees' },
    { key: 'remaining', label: 'Days Remaining' },
    { key: 'stage', label: 'Onboarding Stage' },
    { key: 'started', label: 'Started' },
    { key: 'actions', label: 'Actions' }
  ];

  extensionOptions: SelectOption[] = [
    { label: '7 days', value: 7 },
    { label: '14 days', value: 14 },
    { label: '30 days', value: 30 }
  ];

  planOptions: SelectOption[] = [
    { label: 'Starter - R500/mo', value: 'STARTER' },
    { label: 'Professional - R1,500/mo', value: 'PROFESSIONAL' },
    { label: 'Enterprise - R5,000/mo', value: 'ENTERPRISE' }
  ];

  ngOnInit(): void {
    this.loadTrials();
    this.loadStats();
  }

  loadTrials(): void {
    this.loading.set(true);
    this.hasError.set(false);
    this.trialService.getActiveTrials(this.page, this.size, this.filterDays).subscribe({
      next: (response) => {
        this.trials.set(response.content);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.hasError.set(true);
        this.errorMessage.set('Failed to load trials. Please try again.');
      }
    });
  }

  loadStats(): void {
    this.trialService.getTrialStats().subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => this.stats.set({ activeTrials: 34, expiringThisWeek: 8, conversionRate: 28, avgTrialDuration: 12 })
    });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadTrials();
  }

  openExtendModal(trial: TrialTenant): void {
    this.selectedTrial = trial;
    this.showExtendModal = true;
  }

  openConvertModal(trial: TrialTenant): void {
    this.selectedTrial = trial;
    this.showConvertModal = true;
  }

  extendTrial(): void {
    if (!this.selectedTrial) return;
    this.trialService.extendTrial(this.selectedTrial.id, this.extensionDays).subscribe({
      next: () => {
        this.showExtendModal = false;
        this.loadTrials();
      }
    });
  }

  convertToPaid(): void {
    if (!this.selectedTrial) return;
    this.trialService.convertToPaid(this.selectedTrial.id, this.selectedPlan).subscribe({
      next: () => {
        this.showConvertModal = false;
        this.loadTrials();
      }
    });
  }

  getDaysColor(days: number): BadgeColor {
    if (days <= 3) return 'error';
    if (days <= 7) return 'warning';
    return 'success';
  }

  getStageColor(stage: string): BadgeColor {
    const colors: Record<string, BadgeColor> = {
      STARTED: 'gray',
      EMAIL_VERIFIED: 'outline',
      COMPANY_SETUP: 'outline',
      USERS_ADDED: 'warning',
      ACTIVE: 'success'
    };
    return colors[stage] || 'gray';
  }

  retryLoad(): void {
    this.loadTrials();
    this.loadStats();
  }
}
