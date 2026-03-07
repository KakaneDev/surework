import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  InvoiceService,
  InvoiceDashboardSummary,
  InvoiceSummary,
  InvoiceStatus
} from '../../../core/services/invoice.service';
import { SpinnerComponent } from '@shared/ui';

@Component({
  selector: 'app-invoice-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    SpinnerComponent,
    CurrencyPipe,
    DatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-3">
          <a routerLink="/accounting" class="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300">
            <span class="material-icons">arrow_back</span>
          </a>
          <div>
            <h1 class="sw-page-title">{{ 'accounting.invoicing.dashboard.title' | translate }}</h1>
            <p class="sw-page-description">{{ 'accounting.invoicing.dashboard.subtitle' | translate }}</p>
          </div>
        </div>
        <div class="flex gap-3">
          <a routerLink="customers" class="sw-btn sw-btn-outline sw-btn-md">
            <span class="material-icons text-lg">people</span>
            {{ 'accounting.invoicing.dashboard.customersBtn' | translate }}
          </a>
          <button (click)="createNewInvoice()" class="sw-btn sw-btn-primary sw-btn-md">
            <span class="material-icons text-lg">add</span>
            {{ 'accounting.invoicing.dashboard.newInvoiceBtn' | translate }}
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center items-center py-24">
          <sw-spinner size="lg" />
        </div>
      } @else if (dashboard()) {
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Total Outstanding -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 border-l-blue-500 p-5">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.invoicing.dashboard.totalOutstanding' | translate }}</p>
            <p class="text-2xl font-bold font-mono text-neutral-800 dark:text-neutral-200">
              {{ dashboard()!.totalOutstanding | currency:'ZAR':'symbol':'1.2-2' }}
            </p>
            <p class="text-xs text-neutral-500 mt-1">{{ dashboard()!.sentCount }} {{ 'accounting.invoicing.dashboard.unpaidInvoices' | translate }}</p>
          </div>

          <!-- Overdue Amount -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 border-l-red-500 p-5">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.invoicing.dashboard.overdue' | translate }}</p>
            <p class="text-2xl font-bold font-mono text-red-600">
              {{ dashboard()!.totalOverdue | currency:'ZAR':'symbol':'1.2-2' }}
            </p>
            <p class="text-xs text-neutral-500 mt-1">{{ dashboard()!.overdueCount }} {{ 'accounting.invoicing.dashboard.overdueInvoices' | translate }}</p>
          </div>

          <!-- Draft Invoices -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 border-l-amber-500 p-5">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.invoicing.dashboard.drafts' | translate }}</p>
            <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ dashboard()!.draftCount }}</p>
            <p class="text-xs text-neutral-500 mt-1">{{ 'accounting.invoicing.dashboard.awaitingReview' | translate }}</p>
          </div>

          <!-- Total Invoices -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border border-l-4 border-l-green-500 p-5">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.invoicing.dashboard.totalInvoices' | translate }}</p>
            <p class="text-2xl font-bold text-neutral-800 dark:text-neutral-200">{{ dashboard()!.totalInvoices }}</p>
            <p class="text-xs text-neutral-500 mt-1">{{ 'accounting.invoicing.dashboard.allTime' | translate }}</p>
          </div>
        </div>

        <!-- Aging Summary -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border">
          <div class="p-4 border-b border-neutral-200 dark:border-dark-border flex items-center justify-between">
            <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'accounting.invoicing.dashboard.arAging' | translate }}</h2>
            <a routerLink="reports/aging" class="text-primary-500 hover:text-primary-600 text-sm font-medium">
              {{ 'accounting.invoicing.dashboard.viewDetailedReport' | translate }}
            </a>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-6 gap-4">
              <div class="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.invoicing.dashboard.current' | translate }}</p>
                <p class="text-lg font-bold font-mono text-green-600">
                  {{ dashboard()!.aging.current | currency:'ZAR':'symbol':'1.0-0' }}
                </p>
              </div>
              <div class="text-center p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.invoicing.dashboard.days1to30' | translate }}</p>
                <p class="text-lg font-bold font-mono text-amber-600">
                  {{ dashboard()!.aging.days1To30 | currency:'ZAR':'symbol':'1.0-0' }}
                </p>
              </div>
              <div class="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.invoicing.dashboard.days31to60' | translate }}</p>
                <p class="text-lg font-bold font-mono text-orange-600">
                  {{ dashboard()!.aging.days31To60 | currency:'ZAR':'symbol':'1.0-0' }}
                </p>
              </div>
              <div class="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.invoicing.dashboard.days61to90' | translate }}</p>
                <p class="text-lg font-bold font-mono text-red-600">
                  {{ dashboard()!.aging.days61To90 | currency:'ZAR':'symbol':'1.0-0' }}
                </p>
              </div>
              <div class="text-center p-4 rounded-lg bg-red-100 dark:bg-red-900/30">
                <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.invoicing.dashboard.days90plus' | translate }}</p>
                <p class="text-lg font-bold font-mono text-red-700">
                  {{ dashboard()!.aging.days90Plus | currency:'ZAR':'symbol':'1.0-0' }}
                </p>
              </div>
              <div class="text-center p-4 rounded-lg bg-neutral-100 dark:bg-dark-elevated">
                <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.invoicing.dashboard.total' | translate }}</p>
                <p class="text-lg font-bold font-mono text-neutral-800 dark:text-neutral-200">
                  {{ dashboard()!.aging.total | currency:'ZAR':'symbol':'1.0-0' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions and Lists -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Overdue Invoices -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border">
            <div class="p-4 border-b border-neutral-200 dark:border-dark-border flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-icons text-red-500">warning</span>
                <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'accounting.invoicing.dashboard.overdueInvoicesTitle' | translate }}</h2>
              </div>
              <a routerLink="list" [queryParams]="{status: 'OVERDUE'}" class="text-primary-500 hover:text-primary-600 text-sm font-medium">
                {{ 'accounting.invoicing.dashboard.viewAll' | translate }}
              </a>
            </div>

            @if (dashboard()!.overdueInvoices.length > 0) {
              <div class="divide-y divide-neutral-200 dark:divide-dark-border">
                @for (invoice of dashboard()!.overdueInvoices.slice(0, 5); track invoice.id) {
                  <div class="p-4 hover:bg-neutral-50 dark:hover:bg-dark-elevated cursor-pointer flex items-center justify-between"
                       (click)="viewInvoice(invoice.id)">
                    <div>
                      <p class="font-medium text-neutral-800 dark:text-neutral-200">{{ invoice.invoiceNumber }}</p>
                      <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ invoice.customerName }}</p>
                    </div>
                    <div class="text-right">
                      <p class="font-mono font-medium text-red-600">{{ invoice.amountDue | currency:'ZAR':'symbol':'1.2-2' }}</p>
                      <p class="text-xs text-red-500">{{ getDaysOverdue(invoice) }} {{ 'accounting.invoicing.dashboard.daysOverdue' | translate }}</p>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="p-8 text-center">
                <span class="material-icons text-4xl text-green-400 mb-2">check_circle</span>
                <p class="text-neutral-500 dark:text-neutral-400">{{ 'accounting.invoicing.dashboard.noOverdueInvoices' | translate }}</p>
              </div>
            }
          </div>

          <!-- Recent Invoices -->
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border">
            <div class="p-4 border-b border-neutral-200 dark:border-dark-border flex items-center justify-between">
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'accounting.invoicing.dashboard.recentInvoices' | translate }}</h2>
              <a routerLink="list" class="text-primary-500 hover:text-primary-600 text-sm font-medium">
                {{ 'accounting.invoicing.dashboard.viewAll' | translate }}
              </a>
            </div>

            @if (dashboard()!.recentInvoices.length > 0) {
              <div class="divide-y divide-neutral-200 dark:divide-dark-border">
                @for (invoice of dashboard()!.recentInvoices.slice(0, 5); track invoice.id) {
                  <div class="p-4 hover:bg-neutral-50 dark:hover:bg-dark-elevated cursor-pointer flex items-center justify-between"
                       (click)="viewInvoice(invoice.id)">
                    <div class="flex items-center gap-3">
                      <div>
                        <p class="font-medium text-neutral-800 dark:text-neutral-200">{{ invoice.invoiceNumber }}</p>
                        <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ invoice.customerName }}</p>
                      </div>
                    </div>
                    <div class="text-right">
                      <p class="font-mono font-medium text-neutral-800 dark:text-neutral-200">{{ invoice.total | currency:'ZAR':'symbol':'1.2-2' }}</p>
                      <span class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full" [class]="getStatusColor(invoice.status)">
                        {{ getStatusLabel(invoice.status) }}
                      </span>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="p-8 text-center">
                <span class="material-icons text-4xl text-neutral-300 dark:text-neutral-600 mb-2">receipt_long</span>
                <p class="text-neutral-500 dark:text-neutral-400 mb-4">{{ 'accounting.invoicing.dashboard.noInvoicesYet' | translate }}</p>
                <button (click)="createNewInvoice()" class="sw-btn sw-btn-primary sw-btn-sm">
                  {{ 'accounting.invoicing.dashboard.createFirstInvoice' | translate }}
                </button>
              </div>
            }
          </div>
        </div>

        <!-- Quick Links -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a routerLink="list" [queryParams]="{status: 'DRAFT'}"
             class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4 hover:border-primary-300 transition-colors flex items-center gap-3">
            <span class="material-icons text-neutral-400">edit_note</span>
            <span class="font-medium text-neutral-700 dark:text-neutral-300">{{ 'accounting.invoicing.dashboard.draftInvoices' | translate }}</span>
          </a>
          <a routerLink="list" [queryParams]="{status: 'SENT'}"
             class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4 hover:border-primary-300 transition-colors flex items-center gap-3">
            <span class="material-icons text-blue-400">send</span>
            <span class="font-medium text-neutral-700 dark:text-neutral-300">{{ 'accounting.invoicing.dashboard.sentInvoices' | translate }}</span>
          </a>
          <a routerLink="customers"
             class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4 hover:border-primary-300 transition-colors flex items-center gap-3">
            <span class="material-icons text-green-400">people</span>
            <span class="font-medium text-neutral-700 dark:text-neutral-300">{{ 'accounting.invoicing.dashboard.manageCustomers' | translate }}</span>
          </a>
          <a routerLink="reports/aging"
             class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4 hover:border-primary-300 transition-colors flex items-center gap-3">
            <span class="material-icons text-purple-400">analytics</span>
            <span class="font-medium text-neutral-700 dark:text-neutral-300">{{ 'accounting.invoicing.dashboard.agingReport' | translate }}</span>
          </a>
        </div>
      } @else {
        <!-- Error State -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">error_outline</span>
          <p class="text-neutral-500 dark:text-neutral-400 mb-4">{{ 'accounting.invoicing.dashboard.loadError' | translate }}</p>
          <button (click)="loadDashboard()" class="sw-btn sw-btn-primary sw-btn-md">
            <span class="material-icons text-lg">refresh</span>
            {{ 'accounting.invoicing.dashboard.retry' | translate }}
          </button>
        </div>
      }
    </div>
  `
})
export class InvoiceDashboardComponent implements OnInit {
  private readonly invoiceService = inject(InvoiceService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);

  loading = signal(true);
  dashboard = signal<InvoiceDashboardSummary | null>(null);

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.invoiceService.getDashboardSummary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.dashboard.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load invoice dashboard', err);
          this.loading.set(false);
        }
      });
  }

  createNewInvoice(): void {
    this.router.navigate(['/accounting/invoicing/new']);
  }

  viewInvoice(invoiceId: string): void {
    this.router.navigate(['/accounting/invoicing', invoiceId]);
  }

  getDaysOverdue(invoice: InvoiceSummary): number {
    const daysUntilDue = InvoiceService.getDaysUntilDue(invoice.dueDate);
    return Math.abs(daysUntilDue);
  }

  getStatusLabel(status: InvoiceStatus): string {
    const statusKeys: Record<InvoiceStatus, string> = {
      DRAFT: 'accounting.invoicing.status.draft',
      SENT: 'accounting.invoicing.status.sent',
      VIEWED: 'accounting.invoicing.status.viewed',
      PARTIALLY_PAID: 'accounting.invoicing.status.partial',
      PAID: 'accounting.invoicing.status.paid',
      OVERDUE: 'accounting.invoicing.status.overdue',
      VOID: 'accounting.invoicing.status.void',
      WRITTEN_OFF: 'accounting.invoicing.status.writtenOff'
    };
    return this.translate.instant(statusKeys[status] || 'accounting.invoicing.status.unknown');
  }

  getStatusColor(status: InvoiceStatus): string {
    return InvoiceService.getStatusColor(status);
  }
}
