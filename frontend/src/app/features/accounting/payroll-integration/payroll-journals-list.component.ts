import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, ArrowLeft, FileText, Calendar, ChevronLeft, ChevronRight, ExternalLink, AlertCircle } from 'lucide-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  AccountingService,
  PayrollJournalEntry,
  PayrollYearSummary
} from '../../../core/services/accounting.service';

@Component({
  selector: 'app-payroll-journals-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, TranslateModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a routerLink="/accounting/payroll-integration"
             class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <lucide-icon [img]="ArrowLeftIcon" class="w-5 h-5"></lucide-icon>
          </a>
          <div>
            <h1 class="text-2xl font-semibold text-gray-900">{{ 'accounting.payrollIntegration.journals.title' | translate }}</h1>
            <p class="mt-1 text-sm text-gray-500">
              {{ 'accounting.payrollIntegration.journals.description' | translate }}
            </p>
          </div>
        </div>
      </div>

      <!-- Year Selector & Summary -->
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <button (click)="previousYear()"
                    class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <lucide-icon [img]="ChevronLeftIcon" class="w-5 h-5"></lucide-icon>
            </button>
            <span class="text-lg font-medium text-gray-900 w-20 text-center">{{ selectedYear() }}</span>
            <button (click)="nextYear()"
                    [disabled]="selectedYear() >= currentYear"
                    class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50">
              <lucide-icon [img]="ChevronRightIcon" class="w-5 h-5"></lucide-icon>
            </button>
          </div>
        </div>

        @if (yearSummary()) {
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p class="text-sm text-gray-500">{{ 'accounting.payrollIntegration.journals.totalGross' | translate }}</p>
              <p class="text-lg font-semibold text-gray-900">{{ formatCurrency(yearSummary()!.totalGross) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">{{ 'accounting.payrollIntegration.journals.totalPaye' | translate }}</p>
              <p class="text-lg font-semibold text-gray-900">{{ formatCurrency(yearSummary()!.totalPaye) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">{{ 'accounting.payrollIntegration.journals.totalNet' | translate }}</p>
              <p class="text-lg font-semibold text-gray-900">{{ formatCurrency(yearSummary()!.totalNet) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">{{ 'accounting.payrollIntegration.journals.payrollRuns' | translate }}</p>
              <p class="text-lg font-semibold text-gray-900">{{ yearSummary()!.runCount }}</p>
            </div>
          </div>
        }
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center h-64">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      } @else if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex items-center gap-2 text-red-800">
            <lucide-icon [img]="AlertCircleIcon" class="w-5 h-5"></lucide-icon>
            <span>{{ 'accounting.payrollIntegration.journals.errorLoading' | translate }}</span>
          </div>
        </div>
      } @else {
        <!-- Journals Table -->
        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ 'accounting.payrollIntegration.journals.period' | translate }}
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ 'accounting.payrollIntegration.journals.payrollRun' | translate }}
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ 'accounting.payrollIntegration.journals.journalEntry' | translate }}
                </th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ 'accounting.payrollIntegration.journals.gross' | translate }}
                </th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ 'accounting.payrollIntegration.journals.paye' | translate }}
                </th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ 'accounting.payrollIntegration.journals.net' | translate }}
                </th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ 'accounting.payrollIntegration.journals.employees' | translate }}
                </th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ 'accounting.payrollIntegration.journals.status' | translate }}
                </th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {{ 'common.actions' | translate }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              @for (journal of journals(); track journal.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 whitespace-nowrap">
                    <div class="flex items-center gap-2">
                      <lucide-icon [img]="CalendarIcon" class="w-4 h-4 text-gray-400"></lucide-icon>
                      <span class="text-sm text-gray-900">{{ formatPeriod(journal.periodYear, journal.periodMonth) }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <span class="text-sm font-medium text-gray-900">{{ journal.payrollRunNumber }}</span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <a [routerLink]="['/accounting/journals', journal.journalEntryId]"
                       class="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                      {{ journal.journalEntryNumber }}
                      <lucide-icon [img]="ExternalLinkIcon" class="w-3 h-3"></lucide-icon>
                    </a>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-right">
                    <span class="text-sm text-gray-900">{{ formatCurrency(journal.totalGross) }}</span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-right">
                    <span class="text-sm text-gray-900">{{ formatCurrency(journal.totalPaye) }}</span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-right">
                    <span class="text-sm text-gray-900">{{ formatCurrency(journal.totalNet) }}</span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-center">
                    <span class="text-sm text-gray-900">{{ journal.employeeCount }}</span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-center">
                    <span [class]="getStatusClass(journal.status)" class="text-xs px-2 py-1 rounded-full">
                      {{ journal.statusDisplay }}
                    </span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-center">
                    <a [routerLink]="['/accounting/journals', journal.journalEntryId]"
                       class="text-sm text-indigo-600 hover:text-indigo-800">
                      {{ 'common.view' | translate }}
                    </a>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9" class="px-4 py-8 text-center text-gray-500">
                    <lucide-icon [img]="FileTextIcon" class="w-8 h-8 mx-auto mb-2 text-gray-400"></lucide-icon>
                    <p>{{ 'accounting.payrollIntegration.journals.noJournals' | translate: { year: selectedYear() } }}</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Totals Summary -->
        @if (journals().length > 0) {
          <div class="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <p class="text-gray-500">{{ 'accounting.payrollIntegration.journals.uifTotal' | translate }}</p>
                <p class="font-semibold text-gray-900">{{ formatCurrency(yearSummary()?.totalUif || 0) }}</p>
              </div>
              <div>
                <p class="text-gray-500">{{ 'accounting.payrollIntegration.journals.sdlTotal' | translate }}</p>
                <p class="font-semibold text-gray-900">{{ formatCurrency(yearSummary()?.totalSdl || 0) }}</p>
              </div>
              <div>
                <p class="text-gray-500">{{ 'accounting.payrollIntegration.journals.employerCost' | translate }}</p>
                <p class="font-semibold text-gray-900">{{ formatCurrency(yearSummary()?.totalEmployerCost || 0) }}</p>
              </div>
              <div>
                <p class="text-gray-500">{{ 'accounting.payrollIntegration.journals.maxEmployees' | translate }}</p>
                <p class="font-semibold text-gray-900">{{ yearSummary()?.employeeCount || 0 }}</p>
              </div>
              <div>
                <p class="text-gray-500">{{ 'accounting.payrollIntegration.journals.totalRuns' | translate }}</p>
                <p class="font-semibold text-gray-900">{{ yearSummary()?.runCount || 0 }}</p>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `
})
export class PayrollJournalsListComponent implements OnInit {
  private readonly accountingService = inject(AccountingService);
  private readonly translate = inject(TranslateService);

  // Icons
  readonly ArrowLeftIcon = ArrowLeft;
  readonly FileTextIcon = FileText;
  readonly CalendarIcon = Calendar;
  readonly ChevronLeftIcon = ChevronLeft;
  readonly ChevronRightIcon = ChevronRight;
  readonly ExternalLinkIcon = ExternalLink;
  readonly AlertCircleIcon = AlertCircle;

  // State
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly journals = signal<PayrollJournalEntry[]>([]);
  readonly yearSummary = signal<PayrollYearSummary | null>(null);
  readonly selectedYear = signal(new Date().getFullYear());

  readonly currentYear = new Date().getFullYear();

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    const year = this.selectedYear();

    this.accountingService.getPayrollJournalsForYear(year).subscribe({
      next: (journals) => {
        this.journals.set(journals);
        this.loading.set(false);
      },
      error: (err) => {
        const errorMessage = this.translate.instant('accounting.payrollIntegration.journals.failedToLoad');
        this.error.set(errorMessage);
        this.loading.set(false);
        console.error('Error loading journals:', err);
      }
    });

    this.accountingService.getPayrollYearSummary(year).subscribe({
      next: (summary) => this.yearSummary.set(summary),
      error: (err) => console.error('Error loading year summary:', err)
    });
  }

  previousYear(): void {
    this.selectedYear.update(y => y - 1);
    this.loadData();
  }

  nextYear(): void {
    if (this.selectedYear() < this.currentYear) {
      this.selectedYear.update(y => y + 1);
      this.loadData();
    }
  }

  formatCurrency(amount: number): string {
    return AccountingService.formatCurrency(amount);
  }

  formatPeriod(year: number, month: number): string {
    return AccountingService.formatPayrollPeriod(year, month);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'POSTED':
        return 'bg-green-100 text-green-800';
      case 'CREATED':
        return 'bg-yellow-100 text-yellow-800';
      case 'REVERSED':
        return 'bg-red-100 text-red-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
