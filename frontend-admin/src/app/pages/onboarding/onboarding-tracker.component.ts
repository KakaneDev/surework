import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AnalyticsService } from '@core/services/analytics.service';
import { TenantService } from '@core/services/tenant.service';
import { OnboardingFunnel } from '@core/models/analytics.model';
import { Tenant } from '@core/models/tenant.model';
import { BadgeComponent, BadgeColor } from '@core/components/ui/badge.component';
import { ButtonComponent } from '@core/components/ui/button.component';
import { CardComponent } from '@core/components/ui/card.component';
import { ModalComponent } from '@core/components/ui/modal.component';
import { TableComponent, TableColumn } from '@core/components/ui/table.component';
import { ErrorStateComponent } from '@core/components/ui/error-state.component';
import { RelativeTimePipe } from '@core/pipes/relative-time.pipe';
import { NgApexchartsModule, ApexChart, ApexPlotOptions, ApexDataLabels } from 'ng-apexcharts';

@Component({
  selector: 'app-onboarding-tracker',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    ModalComponent,
    TableComponent,
    ErrorStateComponent,
    RelativeTimePipe,
    NgApexchartsModule
  ],
  template: `
    <div class="flex flex-col gap-6">
      <!-- Page Header -->
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Onboarding Tracking</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Monitor signup funnel and help stuck users</p>
      </div>

      <!-- Funnel Chart -->
      <app-card title="Onboarding Funnel">
        <div class="grid gap-6 lg:grid-cols-2">
          <div>
            <apx-chart
              [series]="chartSeries"
              [chart]="chartOptions"
              [plotOptions]="plotOptions"
              [dataLabels]="dataLabels"
              [colors]="colors"
            ></apx-chart>
          </div>
          <div class="space-y-3">
            @for (stage of funnel(); track stage.stage) {
              <div class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 rounded-full" [style.backgroundColor]="colors[$index % colors.length]"></div>
                  <span class="text-gray-900 dark:text-white">{{ stage.stage }}</span>
                </div>
                <div class="text-right">
                  <span class="text-lg font-semibold text-gray-900 dark:text-white">{{ stage.count }}</span>
                  <span class="text-sm text-gray-500 dark:text-gray-400 ml-2">({{ stage.percentage }}%)</span>
                </div>
              </div>
            }
          </div>
        </div>
      </app-card>

      <!-- Pending Verifications -->
      <app-card title="Pending Email Verifications">
        <app-table [columns]="pendingColumns" [data]="pendingVerifications()" [loading]="loading()">
          @for (tenant of pendingVerifications(); track tenant.id) {
            <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
              <td class="px-4 py-3">
                <a
                  [routerLink]="['/tenants', tenant.id]"
                  class="font-medium text-gray-900 hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
                >
                  {{ tenant.companyName }}
                </a>
              </td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
                {{ tenant.email }}
              </td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400">
                {{ tenant.createdAt | relativeTime }}
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                  <app-button size="sm" variant="outline" (onClick)="sendReminder(tenant.id)">
                    Send Reminder
                  </app-button>
                  <app-button size="sm" (onClick)="manualVerify(tenant.id)">
                    Verify Manually
                  </app-button>
                </div>
              </td>
            </tr>
          }
        </app-table>
      </app-card>

      <!-- Stuck/Abandoned Signups -->
      <app-card title="Stuck in Onboarding (> 3 days)">
        <app-table [columns]="stuckColumns" [data]="stuckSignups()" [loading]="loading()">
          @for (tenant of stuckSignups(); track tenant.id) {
            <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
              <td class="px-4 py-3">
                <a
                  [routerLink]="['/tenants', tenant.id]"
                  class="font-medium text-gray-900 hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
                >
                  {{ tenant.companyName }}
                </a>
              </td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
                {{ tenant.email }}
              </td>
              <td class="px-4 py-3">
                <app-badge [color]="getStageColor(tenant.onboardingStage)">
                  {{ tenant.onboardingStage }}
                </app-badge>
              </td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400">
                {{ tenant.createdAt | relativeTime }}
              </td>
              <td class="px-4 py-3">
                <app-button size="sm" variant="outline" (onClick)="openContactModal(tenant)">
                  Contact
                </app-button>
              </td>
            </tr>
          }
        </app-table>
      </app-card>
    </div>

    <!-- Contact Modal -->
    <app-modal
      [isOpen]="showContactModal"
      title="Send Onboarding Help"
      (close)="closeContactModal()"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Send a help message to <strong>{{ selectedContactTenant?.companyName }}</strong> to assist them with onboarding.
        </p>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
          <textarea
            [(ngModel)]="contactMessage"
            rows="5"
            class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-700 focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            placeholder="Hi there! We noticed you might need some help getting started..."
          ></textarea>
        </div>
      </div>
      <div modal-footer class="flex justify-end gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
        <app-button variant="outline" (onClick)="closeContactModal()">Cancel</app-button>
        <app-button
          [loading]="sendingContact()"
          [disabled]="!contactMessage.trim()"
          (onClick)="sendContactEmail()"
        >
          Send Message
        </app-button>
      </div>
    </app-modal>
  `
})
export class OnboardingTrackerComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);
  private tenantService = inject(TenantService);

  loading = signal(true);
  funnel = signal<OnboardingFunnel[]>([]);
  pendingVerifications = signal<Tenant[]>([]);
  stuckSignups = signal<Tenant[]>([]);
  hasError = signal(false);
  errorMessage = signal('');

  // Contact modal state
  showContactModal = false;
  selectedContactTenant: Tenant | null = null;
  contactMessage = '';
  sendingContact = signal(false);

  chartSeries: any[] = [];
  chartOptions: ApexChart = { type: 'bar', height: 280, toolbar: { show: false } };
  plotOptions: ApexPlotOptions = { bar: { horizontal: true, borderRadius: 4, distributed: true } };
  dataLabels: ApexDataLabels = { enabled: true, formatter: (val: number) => `${val}` };
  colors = ['#465FFF', '#8098F9', '#A4BCFD', '#C7D7FE', '#E0EAFF'];

  pendingColumns: TableColumn[] = [
    { key: 'company', label: 'Company' },
    { key: 'email', label: 'Email' },
    { key: 'signedUp', label: 'Signed Up' },
    { key: 'actions', label: 'Actions' }
  ];

  stuckColumns: TableColumn[] = [
    { key: 'company', label: 'Company' },
    { key: 'email', label: 'Email' },
    { key: 'stage', label: 'Current Stage' },
    { key: 'signedUp', label: 'Signed Up' },
    { key: 'actions', label: 'Actions' }
  ];

  ngOnInit(): void {
    this.loadFunnel();
    this.loadPendingVerifications();
    this.loadStuckSignups();
  }

  loadFunnel(): void {
    this.hasError.set(false);
    this.analyticsService.getOnboardingFunnel().subscribe({
      next: (data) => {
        this.funnel.set(data);
        this.chartSeries = [{ data: data.map(d => d.count) }];
      },
      error: () => {
        this.hasError.set(true);
        this.errorMessage.set('Failed to load onboarding funnel. Please try again.');
      }
    });
  }

  loadPendingVerifications(): void {
    this.tenantService.getTenants({ page: 0, size: 10, status: 'PENDING_VERIFICATION' }).subscribe({
      next: (response) => {
        this.pendingVerifications.set(response.content);
        this.loading.set(false);
      },
      error: () => {
        this.pendingVerifications.set([]);
        this.loading.set(false);
      }
    });
  }

  loadStuckSignups(): void {
    this.tenantService.getStuckOnboarding(0, 10, 3).subscribe({
      next: (response) => this.stuckSignups.set(response.content),
      error: () => this.stuckSignups.set([])
    });
  }

  sendReminder(tenantId: string): void {
    this.tenantService.sendVerificationReminder(tenantId).subscribe();
  }

  manualVerify(tenantId: string): void {
    this.tenantService.manualVerify(tenantId).subscribe({
      next: () => this.loadPendingVerifications()
    });
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

  openContactModal(tenant: Tenant): void {
    this.selectedContactTenant = tenant;
    this.contactMessage = '';
    this.showContactModal = true;
  }

  closeContactModal(): void {
    this.showContactModal = false;
    this.selectedContactTenant = null;
    this.contactMessage = '';
  }

  sendContactEmail(): void {
    if (!this.selectedContactTenant || !this.contactMessage.trim()) return;

    this.sendingContact.set(true);
    this.tenantService.sendOnboardingHelp(this.selectedContactTenant.id, this.contactMessage).subscribe({
      next: () => {
        this.closeContactModal();
        this.sendingContact.set(false);
      },
      error: () => this.sendingContact.set(false)
    });
  }

  retryLoad(): void {
    this.loadFunnel();
    this.loadPendingVerifications();
    this.loadStuckSignups();
  }
}
