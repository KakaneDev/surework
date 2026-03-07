import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { VatService, VatReportResponse, ReportStatus, VatReportLineResponse } from '../../../core/services/vat.service';
import { SpinnerComponent } from '@shared/ui';

@Component({
  selector: 'app-vat-report-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    SpinnerComponent,
    CurrencyPipe,
    DatePipe,
    TranslateModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="sw-page-header">
        <div class="flex items-center gap-3">
          <a routerLink="/accounting/vat" class="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300">
            <span class="material-icons">arrow_back</span>
          </a>
          <div>
            <h1 class="sw-page-title">{{ 'accounting.vat.detail.pageTitle' | translate }}</h1>
            <p class="sw-page-description">{{ report()?.vatPeriod ? formatPeriod(report()!.periodStart) : ('accounting.vat.detail.loading' | translate) }}</p>
          </div>
        </div>
        @if (report()) {
          <div class="flex gap-3">
            @if (report()!.status === 'DRAFT' || report()!.status === 'PREVIEW') {
              <button (click)="regenerate()" [disabled]="processing()" class="sw-btn sw-btn-outline sw-btn-md">
                <span class="material-icons text-lg">refresh</span>
                {{ 'accounting.vat.detail.regenerate' | translate }}
              </button>
              <button (click)="finalize()" [disabled]="processing()" class="sw-btn sw-btn-primary sw-btn-md">
                <span class="material-icons text-lg">check_circle</span>
                {{ 'accounting.vat.detail.finalizeForSubmission' | translate }}
              </button>
            }
            @if (report()!.status === 'GENERATED') {
              <button (click)="downloadPdf()" [disabled]="processing()" class="sw-btn sw-btn-outline sw-btn-md">
                <span class="material-icons text-lg">download</span>
                {{ 'accounting.vat.detail.downloadPdf' | translate }}
              </button>
              <button (click)="submitToSars()" [disabled]="processing()" class="sw-btn sw-btn-primary sw-btn-md">
                <span class="material-icons text-lg">send</span>
                {{ 'accounting.vat.detail.markAsSubmitted' | translate }}
              </button>
            }
            @if (report()!.status === 'SUBMITTED') {
              <button (click)="recordPayment()" [disabled]="processing()" class="sw-btn sw-btn-primary sw-btn-md">
                <span class="material-icons text-lg">payments</span>
                {{ 'accounting.vat.detail.recordPayment' | translate }}
              </button>
            }
          </div>
        }
      </div>

      @if (loading()) {
        <div class="flex justify-center items-center py-24">
          <sw-spinner size="lg" />
        </div>
      } @else if (report()) {
        <!-- Status Banner -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <span class="inline-flex px-3 py-1 text-sm font-medium rounded-full" [class]="getStatusBadgeColor(report()!.status)">
              {{ getStatusLabel(report()!.status) }}
            </span>
            <div>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">
                {{ 'accounting.vat.detail.period' | translate }}: {{ getPeriodRange(report()!.periodStart, report()!.periodEnd) }}
              </p>
              @if (report()!.paymentDueDate) {
                <p class="text-sm" [class]="isOverdue() ? 'text-red-600 font-medium' : 'text-neutral-500'">
                  {{ 'accounting.vat.detail.due' | translate }}: {{ report()!.paymentDueDate | date:'longDate' }}
                  @if (isOverdue()) {
                    <span class="ml-2 text-red-600">({{ 'accounting.vat.detail.overdue' | translate }})</span>
                  }
                </p>
              }
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm text-neutral-500 dark:text-neutral-400">
              {{ report()!.box16VatPayable > 0 ? ('accounting.vat.detail.vatPayable' | translate) : ('accounting.vat.detail.vatRefundable' | translate) }}
            </p>
            <p class="text-2xl font-bold font-mono" [class]="report()!.box16VatPayable > 0 ? 'text-red-600' : 'text-green-600'">
              {{ (report()!.box16VatPayable > 0 ? report()!.box16VatPayable : report()!.box17VatRefundable) | currency:'ZAR':'symbol':'1.2-2' }}
            </p>
          </div>
        </div>

        <!-- VAT201 Form -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border">
          <div class="p-4 border-b border-neutral-200 dark:border-dark-border">
            <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'accounting.vat.detail.vat201Declaration' | translate }}</h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.vat.detail.vat201Description' | translate }}</p>
          </div>

          <div class="p-6 space-y-8">
            <!-- Section A: Output Tax -->
            <div>
              <h3 class="text-md font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center">
                <span class="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm font-bold mr-3">A</span>
                {{ 'accounting.vat.detail.sectionATitle' | translate }}
              </h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-neutral-200 dark:border-dark-border">
                      <th class="text-left py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">{{ 'accounting.vat.detail.box' | translate }}</th>
                      <th class="text-left py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">{{ 'accounting.vat.detail.description' | translate }}</th>
                      <th class="text-right py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">{{ 'accounting.vat.detail.amount' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b border-neutral-100 dark:border-dark-border">
                      <td class="py-3 px-3 font-medium">1</td>
                      <td class="py-3 px-3">{{ 'accounting.vat.detail.box1Description' | translate }}</td>
                      <td class="py-3 px-3 text-right font-mono">{{ report()!.box1StandardRatedSupplies | currency:'ZAR':'symbol':'1.2-2' }}</td>
                    </tr>
                    <tr class="border-b border-neutral-100 dark:border-dark-border bg-blue-50 dark:bg-blue-900/10">
                      <td class="py-3 px-3 font-medium">1a</td>
                      <td class="py-3 px-3">{{ 'accounting.vat.detail.box1aDescription' | translate }}</td>
                      <td class="py-3 px-3 text-right font-mono font-semibold">{{ report()!.box1aOutputVat | currency:'ZAR':'symbol':'1.2-2' }}</td>
                    </tr>
                    <tr class="border-b border-neutral-100 dark:border-dark-border">
                      <td class="py-3 px-3 font-medium">2</td>
                      <td class="py-3 px-3">{{ 'accounting.vat.detail.box2Description' | translate }}</td>
                      <td class="py-3 px-3 text-right font-mono">{{ report()!.box2ZeroRatedSupplies | currency:'ZAR':'symbol':'1.2-2' }}</td>
                    </tr>
                    <tr class="border-b border-neutral-100 dark:border-dark-border">
                      <td class="py-3 px-3 font-medium">3</td>
                      <td class="py-3 px-3">{{ 'accounting.vat.detail.box3Description' | translate }}</td>
                      <td class="py-3 px-3 text-right font-mono">{{ report()!.box3ExemptSupplies | currency:'ZAR':'symbol':'1.2-2' }}</td>
                    </tr>
                    <tr class="border-b border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-elevated">
                      <td class="py-3 px-3 font-medium">4</td>
                      <td class="py-3 px-3 font-semibold">{{ 'accounting.vat.detail.box4Description' | translate }}</td>
                      <td class="py-3 px-3 text-right font-mono font-bold">{{ report()!.box4TotalSupplies | currency:'ZAR':'symbol':'1.2-2' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Section B: Input Tax -->
            <div>
              <h3 class="text-md font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center">
                <span class="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded text-sm font-bold mr-3">B</span>
                {{ 'accounting.vat.detail.sectionBTitle' | translate }}
              </h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-neutral-200 dark:border-dark-border">
                      <th class="text-left py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">{{ 'accounting.vat.detail.box' | translate }}</th>
                      <th class="text-left py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">{{ 'accounting.vat.detail.description' | translate }}</th>
                      <th class="text-right py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">{{ 'accounting.vat.detail.amount' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b border-neutral-100 dark:border-dark-border">
                      <td class="py-3 px-3 font-medium">5</td>
                      <td class="py-3 px-3">{{ 'accounting.vat.detail.box5Description' | translate }}</td>
                      <td class="py-3 px-3 text-right font-mono">{{ report()!.box5CapitalGoods | currency:'ZAR':'symbol':'1.2-2' }}</td>
                    </tr>
                    <tr class="border-b border-neutral-100 dark:border-dark-border bg-green-50 dark:bg-green-900/10">
                      <td class="py-3 px-3 font-medium">5a</td>
                      <td class="py-3 px-3">{{ 'accounting.vat.detail.box5aDescription' | translate }}</td>
                      <td class="py-3 px-3 text-right font-mono font-semibold">{{ report()!.box5aInputVatCapital | currency:'ZAR':'symbol':'1.2-2' }}</td>
                    </tr>
                    <tr class="border-b border-neutral-100 dark:border-dark-border">
                      <td class="py-3 px-3 font-medium">6</td>
                      <td class="py-3 px-3">{{ 'accounting.vat.detail.box6Description' | translate }}</td>
                      <td class="py-3 px-3 text-right font-mono">{{ report()!.box6OtherGoods | currency:'ZAR':'symbol':'1.2-2' }}</td>
                    </tr>
                    <tr class="border-b border-neutral-100 dark:border-dark-border bg-green-50 dark:bg-green-900/10">
                      <td class="py-3 px-3 font-medium">6a</td>
                      <td class="py-3 px-3">{{ 'accounting.vat.detail.box6aDescription' | translate }}</td>
                      <td class="py-3 px-3 text-right font-mono font-semibold">{{ report()!.box6aInputVatOther | currency:'ZAR':'symbol':'1.2-2' }}</td>
                    </tr>
                    <tr class="border-b border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-elevated">
                      <td class="py-3 px-3 font-medium">7</td>
                      <td class="py-3 px-3 font-semibold">{{ 'accounting.vat.detail.box7Description' | translate }}</td>
                      <td class="py-3 px-3 text-right font-mono font-bold">{{ report()!.box7TotalInputVat | currency:'ZAR':'symbol':'1.2-2' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Section C: Adjustments -->
            <div>
              <h3 class="text-md font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center">
                <span class="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-2 py-1 rounded text-sm font-bold mr-3">C</span>
                {{ 'accounting.vat.detail.sectionCTitle' | translate }}
              </h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-neutral-200 dark:border-dark-border">
                      <th class="text-left py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">{{ 'accounting.vat.detail.box' | translate }}</th>
                      <th class="text-left py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">{{ 'accounting.vat.detail.description' | translate }}</th>
                      <th class="text-right py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">{{ 'accounting.vat.detail.amount' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b border-neutral-100 dark:border-dark-border">
                      <td class="py-3 px-3 font-medium">8</td>
                      <td class="py-3 px-3">{{ 'accounting.vat.detail.box8Description' | translate }}</td>
                      <td class="py-3 px-3 text-right font-mono">{{ report()!.box8ChangeInUseIncrease | currency:'ZAR':'symbol':'1.2-2' }}</td>
                    </tr>
                    <tr class="border-b border-neutral-100 dark:border-dark-border">
                      <td class="py-3 px-3 font-medium">9</td>
                      <td class="py-3 px-3">{{ 'accounting.vat.detail.box9Description' | translate }}</td>
                      <td class="py-3 px-3 text-right font-mono">{{ report()!.box9ChangeInUseDecrease | currency:'ZAR':'symbol':'1.2-2' }}</td>
                    </tr>
                    <tr class="border-b border-neutral-100 dark:border-dark-border">
                      <td class="py-3 px-3 font-medium">10</td>
                      <td class="py-3 px-3">{{ 'accounting.vat.detail.box10Description' | translate }}</td>
                      <td class="py-3 px-3 text-right font-mono">{{ report()!.box10BadDebtsRecovered | currency:'ZAR':'symbol':'1.2-2' }}</td>
                    </tr>
                    <tr class="border-b border-neutral-100 dark:border-dark-border">
                      <td class="py-3 px-3 font-medium">11</td>
                      <td class="py-3 px-3">{{ 'accounting.vat.detail.box11Description' | translate }}</td>
                      <td class="py-3 px-3 text-right font-mono">{{ report()!.box11BadDebtsWrittenOff | currency:'ZAR':'symbol':'1.2-2' }}</td>
                    </tr>
                    <tr class="border-b border-neutral-100 dark:border-dark-border">
                      <td class="py-3 px-3 font-medium">12</td>
                      <td class="py-3 px-3">{{ 'accounting.vat.detail.box12Description' | translate }}</td>
                      <td class="py-3 px-3 text-right font-mono">{{ report()!.box12OtherAdjustments | currency:'ZAR':'symbol':'1.2-2' }}</td>
                    </tr>
                    <tr class="border-b border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-elevated">
                      <td class="py-3 px-3 font-medium">13</td>
                      <td class="py-3 px-3 font-semibold">{{ 'accounting.vat.detail.box13Description' | translate }}</td>
                      <td class="py-3 px-3 text-right font-mono font-bold">{{ report()!.box13TotalAdjustments | currency:'ZAR':'symbol':'1.2-2' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Section D: Calculation -->
            <div>
              <h3 class="text-md font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center">
                <span class="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-1 rounded text-sm font-bold mr-3">D</span>
                {{ 'accounting.vat.detail.sectionDTitle' | translate }}
              </h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-neutral-200 dark:border-dark-border">
                      <th class="text-left py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">{{ 'accounting.vat.detail.box' | translate }}</th>
                      <th class="text-left py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">{{ 'accounting.vat.detail.description' | translate }}</th>
                      <th class="text-right py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">{{ 'accounting.vat.detail.amount' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b border-neutral-100 dark:border-dark-border">
                      <td class="py-3 px-3 font-medium">14</td>
                      <td class="py-3 px-3">{{ 'accounting.vat.detail.box14Description' | translate }}</td>
                      <td class="py-3 px-3 text-right font-mono">{{ report()!.box14OutputVatPayable | currency:'ZAR':'symbol':'1.2-2' }}</td>
                    </tr>
                    <tr class="border-b border-neutral-100 dark:border-dark-border">
                      <td class="py-3 px-3 font-medium">15</td>
                      <td class="py-3 px-3">{{ 'accounting.vat.detail.box15Description' | translate }}</td>
                      <td class="py-3 px-3 text-right font-mono">{{ report()!.box15InputVatDeductible | currency:'ZAR':'symbol':'1.2-2' }}</td>
                    </tr>
                    @if (report()!.box16VatPayable > 0) {
                      <tr class="border-b border-neutral-200 dark:border-dark-border bg-red-50 dark:bg-red-900/10">
                        <td class="py-4 px-3 font-bold">16</td>
                        <td class="py-4 px-3 font-bold text-red-700 dark:text-red-300">{{ 'accounting.vat.detail.box16DescriptionPayable' | translate }}</td>
                        <td class="py-4 px-3 text-right font-mono font-bold text-red-700 dark:text-red-300 text-lg">{{ report()!.box16VatPayable | currency:'ZAR':'symbol':'1.2-2' }}</td>
                      </tr>
                    } @else {
                      <tr class="border-b border-neutral-100 dark:border-dark-border">
                        <td class="py-3 px-3 font-medium text-neutral-400">16</td>
                        <td class="py-3 px-3 text-neutral-400">{{ 'accounting.vat.detail.box16DescriptionPayable' | translate }}</td>
                        <td class="py-3 px-3 text-right font-mono text-neutral-400">{{ report()!.box16VatPayable | currency:'ZAR':'symbol':'1.2-2' }}</td>
                      </tr>
                    }
                    @if (report()!.box17VatRefundable > 0) {
                      <tr class="border-b border-neutral-200 dark:border-dark-border bg-green-50 dark:bg-green-900/10">
                        <td class="py-4 px-3 font-bold">17</td>
                        <td class="py-4 px-3 font-bold text-green-700 dark:text-green-300">{{ 'accounting.vat.detail.box17DescriptionRefundable' | translate }}</td>
                        <td class="py-4 px-3 text-right font-mono font-bold text-green-700 dark:text-green-300 text-lg">{{ report()!.box17VatRefundable | currency:'ZAR':'symbol':'1.2-2' }}</td>
                      </tr>
                    } @else {
                      <tr class="border-b border-neutral-100 dark:border-dark-border">
                        <td class="py-3 px-3 font-medium text-neutral-400">17</td>
                        <td class="py-3 px-3 text-neutral-400">{{ 'accounting.vat.detail.box17DescriptionRefundable' | translate }}</td>
                        <td class="py-3 px-3 text-right font-mono text-neutral-400">{{ report()!.box17VatRefundable | currency:'ZAR':'symbol':'1.2-2' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Section E: Diesel Refund -->
            @if (report()!.box18DieselRefund > 0) {
              <div>
                <h3 class="text-md font-semibold text-neutral-800 dark:text-neutral-200 mb-4 flex items-center">
                  <span class="bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 px-2 py-1 rounded text-sm font-bold mr-3">E</span>
                  {{ 'accounting.vat.detail.sectionETitle' | translate }}
                </h3>
                <div class="overflow-x-auto">
                  <table class="w-full text-sm">
                    <tbody>
                      <tr class="border-b border-neutral-200 dark:border-dark-border">
                        <td class="py-3 px-3 font-medium">18</td>
                        <td class="py-3 px-3">{{ 'accounting.vat.detail.box18Description' | translate }}</td>
                        <td class="py-3 px-3 text-right font-mono">{{ report()!.box18DieselRefund | currency:'ZAR':'symbol':'1.2-2' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Line Items Breakdown -->
        @if (report()!.lines && report()!.lines.length > 0) {
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border">
            <div class="p-4 border-b border-neutral-200 dark:border-dark-border">
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'accounting.vat.detail.accountBreakdown' | translate }}</h2>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ 'accounting.vat.detail.accountBreakdownDescription' | translate }}</p>
            </div>
            <div class="overflow-x-auto">
              <table class="sw-table">
                <thead>
                  <tr>
                    <th>{{ 'accounting.vat.detail.account' | translate }}</th>
                    <th>{{ 'accounting.vat.detail.category' | translate }}</th>
                    <th>{{ 'accounting.vat.detail.box' | translate }}</th>
                    <th class="text-right">{{ 'accounting.vat.detail.taxable' | translate }}</th>
                    <th class="text-right">{{ 'accounting.vat.detail.vat' | translate }}</th>
                    <th class="text-right">{{ 'accounting.vat.detail.gross' | translate }}</th>
                    <th class="text-center">{{ 'accounting.vat.detail.transactions' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (line of report()!.lines; track line.id) {
                    <tr>
                      <td>
                        <div>
                          <p class="font-medium">{{ line.accountCode }}</p>
                          <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ line.accountName }}</p>
                        </div>
                      </td>
                      <td class="text-sm">{{ getVatCategoryLabel(line.vatCategory) }}</td>
                      <td class="font-mono">{{ line.vatBox }}</td>
                      <td class="text-right font-mono">{{ line.taxableAmount | currency:'ZAR':'symbol':'1.2-2' }}</td>
                      <td class="text-right font-mono">{{ line.vatAmount | currency:'ZAR':'symbol':'1.2-2' }}</td>
                      <td class="text-right font-mono font-medium">{{ line.grossAmount | currency:'ZAR':'symbol':'1.2-2' }}</td>
                      <td class="text-center">{{ line.transactionCount }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      } @else {
        <!-- Error State -->
        <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-12 text-center">
          <span class="material-icons text-5xl text-neutral-300 dark:text-neutral-600 mb-4">error_outline</span>
          <p class="text-neutral-500 dark:text-neutral-400 mb-4">{{ 'accounting.vat.detail.reportNotFound' | translate }}</p>
          <a routerLink="/accounting/vat" class="sw-btn sw-btn-primary sw-btn-md">
            <span class="material-icons text-lg">arrow_back</span>
            {{ 'accounting.vat.detail.backToDashboard' | translate }}
          </a>
        </div>
      }
    </div>
  `
})
export class VatReportDetailComponent implements OnInit {
  private readonly vatService = inject(VatService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);

  loading = signal(true);
  processing = signal(false);
  report = signal<VatReportResponse | null>(null);

  ngOnInit(): void {
    const reportId = this.route.snapshot.paramMap.get('id');
    if (reportId) {
      this.loadReport(reportId);
    }
  }

  loadReport(reportId: string): void {
    this.loading.set(true);
    this.vatService.getReport(reportId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.report.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load VAT report', err);
          this.loading.set(false);
        }
      });
  }

  regenerate(): void {
    if (!this.report()) return;
    this.processing.set(true);
    this.vatService.regenerateVatReport(this.report()!.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.report.set(data);
          this.processing.set(false);
        },
        error: (err) => {
          console.error('Failed to regenerate VAT report', err);
          this.processing.set(false);
        }
      });
  }

  finalize(): void {
    if (!this.report()) return;
    this.processing.set(true);
    this.vatService.finalizeReport(this.report()!.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.report.set(data);
          this.processing.set(false);
        },
        error: (err) => {
          console.error('Failed to finalize VAT report', err);
          this.processing.set(false);
        }
      });
  }

  submitToSars(): void {
    if (!this.report()) return;
    // Navigate to submit dialog/page
    this.router.navigate(['/accounting/vat', this.report()!.id, 'submit']);
  }

  recordPayment(): void {
    if (!this.report()) return;
    // Navigate to payment dialog/page
    this.router.navigate(['/accounting/vat', this.report()!.id, 'payment']);
  }

  downloadPdf(): void {
    if (!this.report()) return;
    this.processing.set(true);
    this.vatService.downloadPdf(this.report()!.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `VAT201-${this.report()!.vatPeriod}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
          this.processing.set(false);
        },
        error: (err) => {
          console.error('Failed to download PDF', err);
          this.processing.set(false);
        }
      });
  }

  isOverdue(): boolean {
    if (!this.report()?.paymentDueDate || this.report()?.status === 'PAID') return false;
    return new Date(this.report()!.paymentDueDate!) < new Date();
  }

  getStatusLabel(status: ReportStatus): string {
    return VatService.getStatusLabel(status);
  }

  getStatusBadgeColor(status: ReportStatus): string {
    return VatService.getStatusColor(status);
  }

  formatPeriod(periodStart: string): string {
    return VatService.formatPeriod(periodStart);
  }

  getPeriodRange(periodStart: string, periodEnd: string): string {
    return VatService.getPeriodRange(periodStart, periodEnd);
  }

  getVatCategoryLabel(category: string): string {
    return VatService.getVatCategoryLabel(category as any);
  }
}
