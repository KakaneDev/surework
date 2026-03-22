import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { forkJoin } from 'rxjs';
import {
  ReportsService,
  PayrollSummary,
  EMP201Summary,
  EMP501Summary,
  ReportListItem,
  ScheduleResponse,
  GenerateReportRequest,
  CreateScheduleRequest
} from '../../../core/services/reports.service';
import {
  AnalyticsCardComponent,
  ReportGeneratorComponent,
  ReportTypeOption,
  ReportListComponent,
  ScheduleFormComponent,
  ScheduleListComponent
} from '../components';

@Component({
  selector: 'app-financial-reports',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    CurrencyPipe,
    DatePipe,
    FormsModule,
    TranslateModule,
    MatTabsModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    AnalyticsCardComponent,
    ReportGeneratorComponent,
    ReportListComponent,
    ScheduleFormComponent,
    ScheduleListComponent
  ],
  template: `
    <div class="space-y-6">
      <div class="sw-page-header">
        <div>
          <h1 class="sw-page-title">{{ 'reports.financial.title' | translate }}</h1>
          <p class="sw-page-description">{{ 'reports.financial.subtitle' | translate }}</p>
        </div>
      </div>

      <mat-tab-group animationDuration="200ms" class="sw-tabs">
        <!-- Overview Tab -->
        <mat-tab><ng-template mat-tab-label><span class="flex items-center gap-2"><span class="material-icons text-lg">insights</span>{{ 'reports.financial.tabs.overview' | translate }}</span></ng-template>
          <div class="pt-6 space-y-6">
            <!-- KPI Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <app-analytics-card
                [title]="'reports.financial.kpis.grossPay' | translate"
                [value]="formatCurrency(payroll()?.totalGrossPay ?? 0)"
                [subtitle]="'reports.financial.kpis.thisPeriod' | translate"
                icon="payments"
                iconColor="info"
                [loading]="loadingAnalytics()"
              />
              <app-analytics-card
                [title]="'reports.financial.kpis.netPay' | translate"
                [value]="formatCurrency(payroll()?.totalNetPay ?? 0)"
                [subtitle]="'reports.financial.kpis.takeHome' | translate"
                icon="account_balance_wallet"
                iconColor="success"
                [loading]="loadingAnalytics()"
              />
              <app-analytics-card
                [title]="'reports.financial.kpis.deductions' | translate"
                [value]="formatCurrency(payroll()?.totalDeductions ?? 0)"
                [subtitle]="'reports.financial.kpis.allDeductions' | translate"
                icon="remove_circle"
                iconColor="orange"
                [loading]="loadingAnalytics()"
              />
              <app-analytics-card
                [title]="'reports.financial.kpis.ctc' | translate"
                [value]="formatCurrency(payroll()?.totalCostToCompany ?? 0)"
                [subtitle]="'reports.financial.kpis.employerCost' | translate"
                icon="business"
                iconColor="purple"
                [loading]="loadingAnalytics()"
              />
            </div>

            <!-- Statutory Deductions -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <app-analytics-card
                [title]="'reports.financial.statutory.paye' | translate"
                [value]="formatCurrency(payroll()?.totalPAYE ?? 0)"
                [subtitle]="'reports.financial.statutory.payeDesc' | translate"
                icon="receipt_long"
                iconColor="error"
                [loading]="loadingAnalytics()"
              />
              <app-analytics-card
                [title]="'reports.financial.statutory.uif' | translate"
                [value]="formatCurrency(payroll()?.totalUIF ?? 0)"
                [subtitle]="'reports.financial.statutory.uifDesc' | translate"
                icon="security"
                iconColor="info"
                [loading]="loadingAnalytics()"
              />
              <app-analytics-card
                [title]="'reports.financial.statutory.sdl' | translate"
                [value]="formatCurrency(payroll()?.totalSDL ?? 0)"
                [subtitle]="'reports.financial.statutory.sdlDesc' | translate"
                icon="school"
                iconColor="cyan"
                [loading]="loadingAnalytics()"
              />
            </div>

            <!-- Employees & Trend -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Department Cost -->
              <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{{ 'reports.financial.analytics.byDepartment' | translate }}</h3>
                @if (loadingAnalytics()) {
                  <div class="space-y-3">
                    @for (i of [1, 2, 3, 4]; track i) {
                      <div class="animate-pulse h-8 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                    }
                  </div>
                } @else if (departmentCostData().length > 0) {
                  <div class="space-y-3">
                    @for (dept of departmentCostData(); track dept.name) {
                      <div>
                        <div class="flex justify-between text-sm mb-1">
                          <span class="text-neutral-700 dark:text-neutral-300">{{ dept.name }}</span>
                          <span class="font-medium text-neutral-900 dark:text-neutral-100">
                            {{ dept.cost | currency:'ZAR':'symbol':'1.0-0' }}
                          </span>
                        </div>
                        <div class="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                          <div
                            class="bg-green-600 h-2 rounded-full transition-all duration-300"
                            [style.width.%]="dept.percent"
                          ></div>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="text-neutral-500 text-center py-4">{{ 'reports.financial.analytics.noDepartmentData' | translate }}</p>
                }
              </div>

              <!-- Monthly Trend -->
              <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{{ 'reports.financial.analytics.monthlyTrend' | translate }}</h3>
                @if (loadingAnalytics()) {
                  <div class="animate-pulse h-40 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                } @else if (payrollTrendData().length > 0) {
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                      <thead>
                        <tr class="border-b border-neutral-200 dark:border-dark-border">
                          <th class="text-left py-2 text-neutral-600 dark:text-neutral-400">{{ 'reports.financial.table.month' | translate }}</th>
                          <th class="text-right py-2 text-neutral-600 dark:text-neutral-400">{{ 'reports.financial.table.gross' | translate }}</th>
                          <th class="text-right py-2 text-neutral-600 dark:text-neutral-400">{{ 'reports.financial.table.net' | translate }}</th>
                          <th class="text-right py-2 text-neutral-600 dark:text-neutral-400">{{ 'reports.financial.table.ctc' | translate }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (row of payrollTrendData(); track row.month) {
                          <tr class="border-b border-neutral-100 dark:border-dark-border">
                            <td class="py-2 text-neutral-900 dark:text-neutral-100">{{ row.month }}</td>
                            <td class="py-2 text-right text-neutral-600 dark:text-neutral-400">
                              {{ row.grossPay | currency:'ZAR':'symbol':'1.0-0' }}
                            </td>
                            <td class="py-2 text-right text-green-600">
                              {{ row.netPay | currency:'ZAR':'symbol':'1.0-0' }}
                            </td>
                            <td class="py-2 text-right text-neutral-600 dark:text-neutral-400">
                              {{ row.costToCompany | currency:'ZAR':'symbol':'1.0-0' }}
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                } @else {
                  <p class="text-neutral-500 text-center py-4">{{ 'reports.financial.analytics.noTrendData' | translate }}</p>
                }
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- Generate Reports Tab -->
        <mat-tab><ng-template mat-tab-label><span class="flex items-center gap-2"><span class="material-icons text-lg">add_chart</span>{{ 'reports.financial.tabs.generate' | translate }}</span></ng-template>
          <div class="pt-6">
            <app-report-generator
              [reportTypes]="payrollReportTypes"
              [generating]="generatingReport()"
              (generate)="onGenerateReport($event)"
              (cancel)="onCancelGenerate()"
            />
          </div>
        </mat-tab>

        <!-- Statutory Reports Tab -->
        <mat-tab><ng-template mat-tab-label><span class="flex items-center gap-2"><span class="material-icons text-lg">account_balance</span>{{ 'reports.financial.tabs.statutory' | translate }}</span></ng-template>
          <div class="pt-6 space-y-6">
            <!-- EMP201 Section -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{ 'reports.financial.emp201.title' | translate }}</h3>
                  <p class="text-sm text-neutral-500">{{ 'reports.financial.emp201.description' | translate }}</p>
                </div>
                <div class="flex items-center gap-3">
                  <mat-form-field appearance="outline" class="!mb-0 w-28">
                    <mat-label>{{ 'reports.financial.filters.year' | translate }}</mat-label>
                    <mat-select [(ngModel)]="emp201Year" (ngModelChange)="loadEMP201()">
                      @for (year of years; track year) {
                        <mat-option [value]="year">{{ year }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="!mb-0 w-36">
                    <mat-label>{{ 'reports.financial.filters.month' | translate }}</mat-label>
                    <mat-select [(ngModel)]="emp201Month" (ngModelChange)="loadEMP201()">
                      @for (month of months; track month.value) {
                        <mat-option [value]="month.value">{{ month.label | translate }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>
              </div>

              @if (loadingEmp201()) {
                <div class="flex justify-center py-8">
                  <mat-spinner diameter="40"></mat-spinner>
                </div>
              } @else if (emp201()) {
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div class="p-4 bg-neutral-50 dark:bg-dark-border rounded-lg">
                    <p class="text-sm text-neutral-500">{{ 'reports.financial.emp201.employees' | translate }}</p>
                    <p class="text-xl font-bold text-neutral-900 dark:text-neutral-100">{{ emp201()!.employeeCount }}</p>
                  </div>
                  <div class="p-4 bg-neutral-50 dark:bg-dark-border rounded-lg">
                    <p class="text-sm text-neutral-500">{{ 'reports.financial.emp201.totalRemuneration' | translate }}</p>
                    <p class="text-xl font-bold text-neutral-900 dark:text-neutral-100">{{ emp201()!.totalRemuneration | currency:'ZAR':'symbol':'1.0-0' }}</p>
                  </div>
                  <div class="p-4 bg-neutral-50 dark:bg-dark-border rounded-lg">
                    <p class="text-sm text-neutral-500">{{ 'reports.financial.emp201.paye' | translate }}</p>
                    <p class="text-xl font-bold text-neutral-900 dark:text-neutral-100">{{ emp201()!.paye | currency:'ZAR':'symbol':'1.0-0' }}</p>
                  </div>
                  <div class="p-4 bg-neutral-50 dark:bg-dark-border rounded-lg">
                    <p class="text-sm text-neutral-500">{{ 'reports.financial.emp201.totalPayable' | translate }}</p>
                    <p class="text-xl font-bold text-green-600">{{ emp201()!.totalPayable | currency:'ZAR':'symbol':'1.0-0' }}</p>
                  </div>
                </div>

                <div class="flex flex-wrap gap-4 text-sm mb-4">
                  <div class="flex items-center gap-2">
                    <span class="text-neutral-500">{{ 'reports.financial.emp201.uifEmployee' | translate }}:</span>
                    <span class="font-medium">{{ emp201()!.uif | currency:'ZAR':'symbol':'1.2-2' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-neutral-500">{{ 'reports.financial.emp201.uifEmployer' | translate }}:</span>
                    <span class="font-medium">{{ emp201()!.uifEmployer | currency:'ZAR':'symbol':'1.2-2' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-neutral-500">{{ 'reports.financial.emp201.sdl' | translate }}:</span>
                    <span class="font-medium">{{ emp201()!.sdl | currency:'ZAR':'symbol':'1.2-2' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-neutral-500">{{ 'reports.financial.emp201.dueDate' | translate }}:</span>
                    <span class="font-medium">{{ emp201()!.dueDate | date:'mediumDate' }}</span>
                  </div>
                </div>

                <div class="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-dark-border">
                  <div class="flex items-center gap-2">
                    @if (emp201()!.submitted) {
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <span class="material-icons text-sm mr-1">check_circle</span>
                        {{ 'reports.financial.emp201.submitted' | translate }} {{ emp201()!.submittedAt | date:'short' }}
                      </span>
                    } @else {
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <span class="material-icons text-sm mr-1">schedule</span>
                        {{ 'reports.financial.emp201.notSubmitted' | translate }}
                      </span>
                    }
                  </div>
                  <div class="flex gap-2">
                    <button mat-button (click)="onGenerateEMP201()">
                      <span class="material-icons text-sm mr-1">picture_as_pdf</span>
                      {{ 'reports.financial.buttons.generatePdf' | translate }}
                    </button>
                    <button mat-flat-button color="primary" (click)="onDownloadEMP201()">
                      <span class="material-icons text-sm mr-1">download</span>
                      {{ 'reports.financial.buttons.downloadSubmission' | translate }}
                    </button>
                  </div>
                </div>
              } @else {
                <p class="text-neutral-500 text-center py-8">{{ 'reports.financial.emp201.noData' | translate }}</p>
              }
            </div>

            <!-- EMP501 Section -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{ 'reports.financial.emp501.title' | translate }}</h3>
                  <p class="text-sm text-neutral-500">{{ 'reports.financial.emp501.description' | translate }}</p>
                </div>
                <div class="flex items-center gap-3">
                  <mat-form-field appearance="outline" class="!mb-0 w-28">
                    <mat-label>{{ 'reports.financial.filters.taxYear' | translate }}</mat-label>
                    <mat-select [(ngModel)]="emp501TaxYear" (ngModelChange)="loadEMP501()">
                      @for (year of taxYears; track year) {
                        <mat-option [value]="year">{{ year }}/{{ year + 1 }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="!mb-0 w-36">
                    <mat-label>{{ 'reports.financial.filters.period' | translate }}</mat-label>
                    <mat-select [(ngModel)]="emp501IsInterim" (ngModelChange)="loadEMP501()">
                      <mat-option [value]="true">{{ 'reports.financial.periods.interim' | translate }}</mat-option>
                      <mat-option [value]="false">{{ 'reports.financial.periods.annual' | translate }}</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
              </div>

              @if (loadingEmp501()) {
                <div class="flex justify-center py-8">
                  <mat-spinner diameter="40"></mat-spinner>
                </div>
              } @else if (emp501()) {
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div class="p-4 bg-neutral-50 dark:bg-dark-border rounded-lg">
                    <p class="text-sm text-neutral-500">{{ 'reports.financial.emp501.employees' | translate }}</p>
                    <p class="text-xl font-bold text-neutral-900 dark:text-neutral-100">{{ emp501()!.employeeCount }}</p>
                  </div>
                  <div class="p-4 bg-neutral-50 dark:bg-dark-border rounded-lg">
                    <p class="text-sm text-neutral-500">{{ 'reports.financial.emp501.totalRemuneration' | translate }}</p>
                    <p class="text-xl font-bold text-neutral-900 dark:text-neutral-100">{{ emp501()!.totalRemuneration | currency:'ZAR':'symbol':'1.0-0' }}</p>
                  </div>
                  <div class="p-4 bg-neutral-50 dark:bg-dark-border rounded-lg">
                    <p class="text-sm text-neutral-500">{{ 'reports.financial.emp501.totalPaye' | translate }}</p>
                    <p class="text-xl font-bold text-neutral-900 dark:text-neutral-100">{{ emp501()!.totalPAYE | currency:'ZAR':'symbol':'1.0-0' }}</p>
                  </div>
                  <div class="p-4 bg-neutral-50 dark:bg-dark-border rounded-lg">
                    <p class="text-sm text-neutral-500">{{ 'reports.financial.emp501.irp5Generated' | translate }}</p>
                    <p class="text-xl font-bold text-neutral-900 dark:text-neutral-100">{{ emp501()!.irp5sGenerated }}</p>
                  </div>
                </div>

                <div class="flex flex-wrap gap-4 text-sm mb-4">
                  <div class="flex items-center gap-2">
                    <span class="text-neutral-500">{{ 'reports.financial.emp501.taxYear' | translate }}:</span>
                    <span class="font-medium">{{ emp501()!.taxYear }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-neutral-500">{{ 'reports.financial.emp501.period' | translate }}:</span>
                    <span class="font-medium">{{ emp501()!.period }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-neutral-500">{{ 'reports.financial.emp501.totalUif' | translate }}:</span>
                    <span class="font-medium">{{ emp501()!.totalUIF | currency:'ZAR':'symbol':'1.2-2' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-neutral-500">{{ 'reports.financial.emp501.totalSdl' | translate }}:</span>
                    <span class="font-medium">{{ emp501()!.totalSDL | currency:'ZAR':'symbol':'1.2-2' }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-neutral-500">{{ 'reports.financial.emp501.dueDate' | translate }}:</span>
                    <span class="font-medium">{{ emp501()!.dueDate | date:'mediumDate' }}</span>
                  </div>
                </div>

                <div class="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-dark-border">
                  <div class="flex items-center gap-2">
                    @if (emp501()!.submitted) {
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <span class="material-icons text-sm mr-1">check_circle</span>
                        {{ 'reports.financial.emp501.submitted' | translate }}
                      </span>
                    } @else {
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <span class="material-icons text-sm mr-1">schedule</span>
                        {{ 'reports.financial.emp501.notSubmitted' | translate }}
                      </span>
                    }
                  </div>
                  <div class="flex gap-2">
                    <button mat-button (click)="onGenerateEMP501()">
                      <span class="material-icons text-sm mr-1">picture_as_pdf</span>
                      {{ 'reports.financial.buttons.generatePdf' | translate }}
                    </button>
                    <button mat-flat-button color="primary" (click)="onDownloadEMP501()">
                      <span class="material-icons text-sm mr-1">download</span>
                      {{ 'reports.financial.buttons.downloadSubmission' | translate }}
                    </button>
                  </div>
                </div>
              } @else {
                <p class="text-neutral-500 text-center py-8">{{ 'reports.financial.emp501.noData' | translate }}</p>
              }
            </div>
          </div>
        </mat-tab>

        <!-- Report History Tab -->
        <mat-tab><ng-template mat-tab-label><span class="flex items-center gap-2"><span class="material-icons text-lg">history</span>{{ 'reports.financial.tabs.history' | translate }}</span></ng-template>
          <div class="pt-6">
            <app-report-list
              [title]="'reports.financial.history.title' | translate"
              [subtitle]="'reports.financial.history.subtitle' | translate"
              [reports]="reports()"
              [loading]="loadingReports()"
              [totalElements]="totalReports()"
              [pageSize]="reportsPageSize()"
              [pageIndex]="reportsPageIndex()"
              (download)="onDownloadReport($event)"
              (view)="onViewReport($event)"
              (retry)="onRetryReport($event)"
              (cancelReport)="onCancelReport($event)"
              (delete)="onDeleteReport($event)"
              (pageChange)="onReportsPageChange($event)"
            />
          </div>
        </mat-tab>

        <!-- Scheduled Reports Tab -->
        <mat-tab><ng-template mat-tab-label><span class="flex items-center gap-2"><span class="material-icons text-lg">schedule</span>{{ 'reports.financial.tabs.scheduled' | translate }}</span></ng-template>
          <div class="pt-6 space-y-6">
            @if (showScheduleForm()) {
              <app-schedule-form
                [reportTypes]="payrollReportTypes"
                [isEdit]="!!editingSchedule()"
                [schedule]="editingSchedule() ?? undefined"
                [saving]="savingSchedule()"
                (save)="onSaveSchedule($event)"
                (cancel)="onCancelScheduleForm()"
              />
            } @else {
              <app-schedule-list
                [schedules]="schedules()"
                [loading]="loadingSchedules()"
                [totalElements]="totalSchedules()"
                [pageSize]="schedulesPageSize()"
                [pageIndex]="schedulesPageIndex()"
                (create)="onCreateSchedule()"
                (edit)="onEditSchedule($event)"
                (toggleActive)="onToggleScheduleActive($event)"
                (runNow)="onRunScheduleNow($event)"
                (viewHistory)="onViewScheduleHistory($event)"
                (delete)="onDeleteSchedule($event)"
                (pageChange)="onSchedulesPageChange($event)"
              />
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    :host ::ng-deep .sw-tabs.mat-mdc-tab-group {
      --mat-tab-header-divider-color: transparent !important;
      --mat-tab-header-divider-height: 0 !important;
    }
    :host ::ng-deep .sw-tabs .mat-mdc-tab-header {
      border-bottom: none !important;
    }
    :host ::ng-deep .sw-tabs .mdc-tab-indicator {
      display: none !important;
    }
    :host ::ng-deep .sw-tabs .mat-mdc-tab-labels {
      gap: 8px;
    }
    :host ::ng-deep .sw-tabs .mat-mdc-tab {
      border-radius: 8px !important;
      min-width: auto !important;
      padding: 0 24px !important;
      height: 44px !important;
      border: 2px solid #0d9488 !important;
      background-color: transparent !important;
      transition: all 0.2s ease !important;
      opacity: 1 !important;
    }
    :host ::ng-deep .sw-tabs .mdc-tab__text-label {
      color: #0d9488 !important;
      transition: color 0.2s ease !important;
    }
    :host ::ng-deep .sw-tabs .mat-mdc-tab:not(.mdc-tab--active):hover {
      background-color: rgba(13, 148, 136, 0.1) !important;
    }
    :host ::ng-deep .sw-tabs .mat-mdc-tab.mdc-tab--active {
      background-color: #14b8a6 !important;
      border-color: #14b8a6 !important;
    }
    :host ::ng-deep .sw-tabs .mdc-tab--active .mdc-tab__text-label {
      color: white !important;
    }
    :host ::ng-deep .sw-tabs .mat-mdc-tab .mat-ripple,
    :host ::ng-deep .sw-tabs .mat-mdc-tab-ripple {
      display: none !important;
    }
    :host-context(.dark) ::ng-deep .sw-tabs .mat-mdc-tab {
      border-color: #2dd4bf !important;
      background-color: transparent !important;
    }
    :host-context(.dark) ::ng-deep .sw-tabs .mdc-tab__text-label {
      color: #2dd4bf !important;
    }
    :host-context(.dark) ::ng-deep .sw-tabs .mat-mdc-tab:not(.mdc-tab--active):hover {
      background-color: rgba(45, 212, 191, 0.1) !important;
    }
    :host-context(.dark) ::ng-deep .sw-tabs .mat-mdc-tab.mdc-tab--active {
      background-color: #14b8a6 !important;
      border-color: #14b8a6 !important;
    }
    :host-context(.dark) ::ng-deep .sw-tabs .mdc-tab--active .mdc-tab__text-label {
      color: white !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinancialReportsComponent implements OnInit {
  private readonly reportsService = inject(ReportsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly userId = '00000000-0000-0000-0000-000000000100'; // Dev user

  // Analytics state
  loadingAnalytics = signal(true);
  payroll = signal<PayrollSummary | null>(null);

  // EMP201 state
  loadingEmp201 = signal(false);
  emp201 = signal<EMP201Summary | null>(null);
  emp201Year = new Date().getFullYear();
  emp201Month = new Date().getMonth() + 1;

  // EMP501 state
  loadingEmp501 = signal(false);
  emp501 = signal<EMP501Summary | null>(null);
  emp501TaxYear = new Date().getFullYear();
  emp501IsInterim = true;

  // Reports state
  loadingReports = signal(false);
  generatingReport = signal(false);
  reports = signal<ReportListItem[]>([]);
  totalReports = signal(0);
  reportsPageSize = signal(10);
  reportsPageIndex = signal(0);

  // Schedules state
  loadingSchedules = signal(false);
  savingSchedule = signal(false);
  showScheduleForm = signal(false);
  editingSchedule = signal<ScheduleResponse | null>(null);
  schedules = signal<ScheduleResponse[]>([]);
  totalSchedules = signal(0);
  schedulesPageSize = signal(10);
  schedulesPageIndex = signal(0);

  // Date selectors
  years = [2024, 2025, 2026];
  taxYears = [2024, 2025, 2026];
  months = [
    { value: 1, label: 'reports.months.january' },
    { value: 2, label: 'reports.months.february' },
    { value: 3, label: 'reports.months.march' },
    { value: 4, label: 'reports.months.april' },
    { value: 5, label: 'reports.months.may' },
    { value: 6, label: 'reports.months.june' },
    { value: 7, label: 'reports.months.july' },
    { value: 8, label: 'reports.months.august' },
    { value: 9, label: 'reports.months.september' },
    { value: 10, label: 'reports.months.october' },
    { value: 11, label: 'reports.months.november' },
    { value: 12, label: 'reports.months.december' }
  ];

  // Computed data
  departmentCostData = computed(() => {
    const data = this.payroll()?.byDepartment ?? {};
    const total = Object.values(data).reduce((sum, cost) => sum + cost, 0);
    return Object.entries(data)
      .map(([name, cost]) => ({
        name,
        cost,
        percent: total > 0 ? (cost / total) * 100 : 0
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 6);
  });

  payrollTrendData = computed(() => {
    return this.payroll()?.monthlyTrend ?? [];
  });

  // Payroll Report Types
  payrollReportTypes: ReportTypeOption[] = [
    { value: 'PAYROLL_REGISTER', label: 'reports.financial.reportTypes.register.label', description: 'reports.financial.reportTypes.register.description' },
    { value: 'PAYROLL_SUMMARY', label: 'reports.financial.reportTypes.summary.label', description: 'reports.financial.reportTypes.summary.description' },
    { value: 'STATUTORY_DEDUCTIONS', label: 'reports.financial.reportTypes.statutory.label', description: 'reports.financial.reportTypes.statutory.description' },
    { value: 'COST_TO_COMPANY', label: 'reports.financial.reportTypes.ctc.label', description: 'reports.financial.reportTypes.ctc.description' },
    { value: 'PAYROLL_VARIANCE', label: 'reports.financial.reportTypes.variance.label', description: 'reports.financial.reportTypes.variance.description' },
    { value: 'YEAR_TO_DATE', label: 'reports.financial.reportTypes.ytd.label', description: 'reports.financial.reportTypes.ytd.description' },
    { value: 'PAYROLL_JOURNAL', label: 'reports.financial.reportTypes.journal.label', description: 'reports.financial.reportTypes.journal.description' }
  ];

  ngOnInit(): void {
    this.loadAnalytics();
    this.loadEMP201();
    this.loadEMP501();
    this.loadReports();
    this.loadSchedules();
  }

  // === Data Loading ===

  private loadAnalytics(): void {
    this.loadingAnalytics.set(true);

    this.reportsService.getPayrollSummary().subscribe({
      next: (data) => {
        this.payroll.set(data);
        this.loadingAnalytics.set(false);
      },
      error: (err) => {
        console.error('Failed to load payroll analytics:', err);
        this.loadingAnalytics.set(false);
        this.showError('reports.financial.errors.loadAnalytics');
      }
    });
  }

  loadEMP201(): void {
    this.loadingEmp201.set(true);

    this.reportsService.getEMP201Summary(this.emp201Year, this.emp201Month).subscribe({
      next: (data) => {
        this.emp201.set(data);
        this.loadingEmp201.set(false);
      },
      error: (err) => {
        console.error('Failed to load EMP201:', err);
        this.loadingEmp201.set(false);
        this.emp201.set(null);
      }
    });
  }

  loadEMP501(): void {
    this.loadingEmp501.set(true);

    this.reportsService.getEMP501Summary(this.emp501TaxYear, this.emp501IsInterim).subscribe({
      next: (data) => {
        this.emp501.set(data);
        this.loadingEmp501.set(false);
      },
      error: (err) => {
        console.error('Failed to load EMP501:', err);
        this.loadingEmp501.set(false);
        this.emp501.set(null);
      }
    });
  }

  private loadReports(): void {
    this.loadingReports.set(true);

    this.reportsService.searchReports(
      this.reportsPageIndex(),
      this.reportsPageSize(),
      'PAYROLL'
    ).subscribe({
      next: (response) => {
        this.reports.set(response.content);
        this.totalReports.set(response.totalElements);
        this.loadingReports.set(false);
      },
      error: (err) => {
        console.error('Failed to load reports:', err);
        this.loadingReports.set(false);
        this.showError('reports.financial.errors.loadReports');
      }
    });
  }

  private loadSchedules(): void {
    this.loadingSchedules.set(true);

    this.reportsService.listSchedules(
      this.schedulesPageIndex(),
      this.schedulesPageSize()
    ).subscribe({
      next: (response) => {
        const payrollSchedules = response.content.filter(s =>
          this.payrollReportTypes.some(rt => rt.value === s.reportType)
        );
        this.schedules.set(payrollSchedules);
        this.totalSchedules.set(payrollSchedules.length);
        this.loadingSchedules.set(false);
      },
      error: (err) => {
        console.error('Failed to load schedules:', err);
        this.loadingSchedules.set(false);
        this.showError('reports.financial.errors.loadSchedules');
      }
    });
  }

  // === Utility Methods ===

  formatCurrency(amount: number): string {
    return ReportsService.formatCurrency(amount);
  }

  private showError(messageKey: string): void {
    const message = this.translate.instant(messageKey);
    this.snackBar.open(message, this.translate.instant('common.close'), {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showSuccess(messageKey: string): void {
    const message = this.translate.instant(messageKey);
    this.snackBar.open(message, this.translate.instant('common.close'), {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  // === Statutory Report Handlers ===

  onGenerateEMP201(): void {
    const request: GenerateReportRequest = {
      reportType: 'EMP201',
      outputFormat: 'PDF',
      parameters: {
        year: this.emp201Year,
        month: this.emp201Month
      }
    };
    this.onGenerateReport(request);
  }

  onDownloadEMP201(): void {
    // Generate CSV for SARS submission
    const request: GenerateReportRequest = {
      reportType: 'EMP201',
      outputFormat: 'CSV',
      parameters: {
        year: this.emp201Year,
        month: this.emp201Month
      }
    };
    this.onGenerateReport(request);
  }

  onGenerateEMP501(): void {
    const request: GenerateReportRequest = {
      reportType: 'EMP501',
      outputFormat: 'PDF',
      parameters: {
        taxYear: this.emp501TaxYear,
        isInterim: this.emp501IsInterim
      }
    };
    this.onGenerateReport(request);
  }

  onDownloadEMP501(): void {
    const request: GenerateReportRequest = {
      reportType: 'EMP501',
      outputFormat: 'CSV',
      parameters: {
        taxYear: this.emp501TaxYear,
        isInterim: this.emp501IsInterim
      }
    };
    this.onGenerateReport(request);
  }

  // === Report Generation Handlers ===

  onGenerateReport(request: GenerateReportRequest): void {
    this.generatingReport.set(true);

    this.reportsService.generateReport(request, this.userId).subscribe({
      next: (response) => {
        this.generatingReport.set(false);
        this.showSuccess('reports.financial.success.generateReport');
        this.loadReports();

        if (response.status === 'COMPLETED') {
          this.downloadReport(response.id);
        }
      },
      error: (err) => {
        console.error('Failed to generate report:', err);
        this.generatingReport.set(false);
        this.showError('reports.financial.errors.generateReport');
      }
    });
  }

  onCancelGenerate(): void {
    // Reset form - handled by component
  }

  // === Report List Handlers ===

  onDownloadReport(report: ReportListItem): void {
    this.downloadReport(report.id);
  }

  private downloadReport(reportId: string): void {
    this.reportsService.getDownloadUrl(reportId).subscribe({
      next: (response) => {
        window.open(response.downloadUrl, '_blank');
      },
      error: (err) => {
        console.error('Failed to get download URL:', err);
        this.showError('reports.financial.errors.downloadReport');
      }
    });
  }

  onViewReport(report: ReportListItem): void {
    console.log('View report:', report);
  }

  onRetryReport(report: ReportListItem): void {
    this.reportsService.retryReport(report.id).subscribe({
      next: () => {
        this.showSuccess('reports.financial.success.retryReport');
        this.loadReports();
      },
      error: (err) => {
        console.error('Failed to retry report:', err);
        this.showError('reports.financial.errors.retryReport');
      }
    });
  }

  onCancelReport(report: ReportListItem): void {
    this.reportsService.cancelReport(report.id).subscribe({
      next: () => {
        this.showSuccess('reports.financial.success.cancelReport');
        this.loadReports();
      },
      error: (err) => {
        console.error('Failed to cancel report:', err);
        this.showError('reports.financial.errors.cancelReport');
      }
    });
  }

  onDeleteReport(report: ReportListItem): void {
    const confirmMsg = this.translate.instant('reports.financial.confirmation.deleteReport');
    if (!confirm(confirmMsg)) return;

    this.reportsService.deleteReport(report.id).subscribe({
      next: () => {
        this.showSuccess('reports.financial.success.deleteReport');
        this.loadReports();
      },
      error: (err) => {
        console.error('Failed to delete report:', err);
        this.showError('reports.financial.errors.deleteReport');
      }
    });
  }

  onReportsPageChange(event: PageEvent): void {
    this.reportsPageIndex.set(event.pageIndex);
    this.reportsPageSize.set(event.pageSize);
    this.loadReports();
  }

  // === Schedule Handlers ===

  onCreateSchedule(): void {
    this.editingSchedule.set(null);
    this.showScheduleForm.set(true);
  }

  onEditSchedule(schedule: ScheduleResponse): void {
    this.editingSchedule.set(schedule);
    this.showScheduleForm.set(true);
  }

  onCancelScheduleForm(): void {
    this.showScheduleForm.set(false);
    this.editingSchedule.set(null);
  }

  onSaveSchedule(request: CreateScheduleRequest): void {
    this.savingSchedule.set(true);

    const editing = this.editingSchedule();

    if (editing) {
      this.reportsService.updateSchedule(editing.id, request).subscribe({
        next: () => {
          this.savingSchedule.set(false);
          this.showScheduleForm.set(false);
          this.editingSchedule.set(null);
          this.showSuccess('reports.financial.success.updateSchedule');
          this.loadSchedules();
        },
        error: (err) => {
          console.error('Failed to update schedule:', err);
          this.savingSchedule.set(false);
          this.showError('reports.financial.errors.updateSchedule');
        }
      });
    } else {
      this.reportsService.createSchedule(request, this.userId).subscribe({
        next: () => {
          this.savingSchedule.set(false);
          this.showScheduleForm.set(false);
          this.showSuccess('reports.financial.success.createSchedule');
          this.loadSchedules();
        },
        error: (err) => {
          console.error('Failed to create schedule:', err);
          this.savingSchedule.set(false);
          this.showError('reports.financial.errors.createSchedule');
        }
      });
    }
  }

  onToggleScheduleActive(schedule: ScheduleResponse): void {
    const action = schedule.active
      ? this.reportsService.deactivateSchedule(schedule.id)
      : this.reportsService.activateSchedule(schedule.id);

    action.subscribe({
      next: () => {
        this.showSuccess(schedule.active ? 'reports.financial.success.deactivateSchedule' : 'reports.financial.success.activateSchedule');
        this.loadSchedules();
      },
      error: (err) => {
        console.error('Failed to toggle schedule:', err);
        this.showError('reports.financial.errors.toggleSchedule');
      }
    });
  }

  onRunScheduleNow(schedule: ScheduleResponse): void {
    this.reportsService.runScheduleNow(schedule.id, this.userId).subscribe({
      next: () => {
        this.showSuccess('reports.financial.success.runSchedule');
        this.loadReports();
      },
      error: (err) => {
        console.error('Failed to run schedule:', err);
        this.showError('reports.financial.errors.runSchedule');
      }
    });
  }

  onViewScheduleHistory(schedule: ScheduleResponse): void {
    console.log('View schedule history:', schedule);
  }

  onDeleteSchedule(schedule: ScheduleResponse): void {
    const confirmMsg = this.translate.instant('reports.financial.confirmation.deleteSchedule');
    if (!confirm(confirmMsg)) return;

    this.reportsService.deleteSchedule(schedule.id).subscribe({
      next: () => {
        this.showSuccess('reports.financial.success.deleteSchedule');
        this.loadSchedules();
      },
      error: (err) => {
        console.error('Failed to delete schedule:', err);
        this.showError('reports.financial.errors.deleteSchedule');
      }
    });
  }

  onSchedulesPageChange(event: PageEvent): void {
    this.schedulesPageIndex.set(event.pageIndex);
    this.schedulesPageSize.set(event.pageSize);
    this.loadSchedules();
  }
}
