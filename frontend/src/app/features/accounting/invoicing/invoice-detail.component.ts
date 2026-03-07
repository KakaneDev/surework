import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  InvoiceService,
  InvoiceResponse,
  InvoiceStatus,
  PaymentMethod,
  RecordPaymentRequest,
  SendInvoiceRequest
} from '../../../core/services/invoice.service';
import { SpinnerComponent } from '@shared/ui';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TranslateModule,
    SpinnerComponent,
    CurrencyPipe,
    DatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      @if (loading()) {
        <div class="flex justify-center items-center py-24">
          <sw-spinner size="lg" />
        </div>
      } @else if (invoice()) {
        <!-- Header -->
        <div class="sw-page-header">
          <div class="flex items-center gap-3">
            <a routerLink="/accounting/invoicing/list" class="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300">
              <span class="material-icons">arrow_back</span>
            </a>
            <div>
              <div class="flex items-center gap-3">
                <h1 class="sw-page-title">{{ invoice()!.invoiceNumber }}</h1>
                <span class="inline-flex px-3 py-1 text-sm font-medium rounded-full" [class]="getStatusColor(invoice()!.status)">
                  {{ getStatusLabel(invoice()!.status) }}
                </span>
              </div>
              <p class="sw-page-description">{{ invoice()!.customerName }}</p>
            </div>
          </div>
          <div class="flex gap-3">
            @if (invoice()!.status === 'DRAFT') {
              <a [routerLink]="['/accounting/invoicing', invoice()!.id, 'edit']" class="sw-btn sw-btn-outline sw-btn-md">
                <span class="material-icons text-lg">edit</span>
                {{ 'accounting.invoicing.detail.edit' | translate }}
              </a>
              <button (click)="showSendDialog = true" class="sw-btn sw-btn-primary sw-btn-md">
                <span class="material-icons text-lg">send</span>
                {{ 'accounting.invoicing.detail.sendInvoice' | translate }}
              </button>
            }
            @if (canRecordPayment()) {
              <button (click)="showPaymentDialog = true" class="sw-btn sw-btn-primary sw-btn-md">
                <span class="material-icons text-lg">payments</span>
                {{ 'accounting.invoicing.detail.recordPayment' | translate }}
              </button>
            }
            <button (click)="downloadPdf()" class="sw-btn sw-btn-outline sw-btn-md">
              <span class="material-icons text-lg">download</span>
              {{ 'accounting.invoicing.detail.downloadPdf' | translate }}
            </button>
            <div class="relative">
              <button (click)="showActionsMenu = !showActionsMenu" class="sw-btn sw-btn-outline sw-btn-md">
                <span class="material-icons">more_vert</span>
              </button>
              @if (showActionsMenu) {
                <div class="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-surface rounded-lg shadow-lg border border-neutral-200 dark:border-dark-border py-1 z-10">
                  @if (invoice()!.status !== 'VOID' && invoice()!.status !== 'PAID') {
                    <button (click)="sendReminder(); showActionsMenu = false" class="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-dark-elevated flex items-center gap-2">
                      <span class="material-icons text-lg">notifications</span>
                      {{ 'accounting.invoicing.detail.sendReminder' | translate }}
                    </button>
                  }
                  @if (invoice()!.status === 'DRAFT') {
                    <button (click)="deleteInvoice(); showActionsMenu = false" class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                      <span class="material-icons text-lg">delete</span>
                      {{ 'accounting.invoicing.detail.deleteInvoice' | translate }}
                    </button>
                  }
                  @if (invoice()!.status !== 'VOID' && invoice()!.status !== 'WRITTEN_OFF' && invoice()!.status !== 'PAID') {
                    <button (click)="showVoidDialog = true; showActionsMenu = false" class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                      <span class="material-icons text-lg">block</span>
                      {{ 'accounting.invoicing.detail.voidInvoice' | translate }}
                    </button>
                  }
                  @if (invoice()!.status === 'OVERDUE') {
                    <button (click)="showWriteOffDialog = true; showActionsMenu = false" class="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 flex items-center gap-2">
                      <span class="material-icons text-lg">money_off</span>
                      {{ 'accounting.invoicing.detail.writeOff' | translate }}
                    </button>
                  }
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-5">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.invoicing.detail.invoiceTotal' | translate }}</p>
            <p class="text-2xl font-bold font-mono text-neutral-800 dark:text-neutral-200">{{ invoice()!.total | currency:'ZAR':'symbol':'1.2-2' }}</p>
          </div>
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-5">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.invoicing.detail.amountPaid' | translate }}</p>
            <p class="text-2xl font-bold font-mono text-green-600">{{ invoice()!.amountPaid | currency:'ZAR':'symbol':'1.2-2' }}</p>
          </div>
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-5">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.invoicing.detail.amountDue' | translate }}</p>
            <p class="text-2xl font-bold font-mono" [class]="invoice()!.amountDue > 0 ? 'text-red-600' : 'text-green-600'">
              {{ invoice()!.amountDue | currency:'ZAR':'symbol':'1.2-2' }}
            </p>
          </div>
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-5">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{{ 'accounting.invoicing.detail.dueDate' | translate }}</p>
            <p class="text-lg font-bold" [class]="invoice()!.overdue ? 'text-red-600' : 'text-neutral-800 dark:text-neutral-200'">
              {{ invoice()!.dueDate | date:'mediumDate' }}
            </p>
            @if (invoice()!.overdue) {
              <p class="text-xs text-red-500">{{ 'accounting.invoicing.detail.daysOverdue' | translate:{ days: invoice()!.daysOverdue } }}</p>
            }
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Invoice Details -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Customer & Details -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
              <div class="grid grid-cols-2 gap-6">
                <div>
                  <h3 class="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-2">{{ 'accounting.invoicing.detail.billTo' | translate }}</h3>
                  <p class="font-medium text-neutral-800 dark:text-neutral-200">{{ invoice()!.customerName }}</p>
                  @if (invoice()!.customerAddress) {
                    <p class="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-line">{{ invoice()!.customerAddress }}</p>
                  }
                  @if (invoice()!.customerEmail) {
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">{{ invoice()!.customerEmail }}</p>
                  }
                  @if (invoice()!.customerVatNumber) {
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">{{ 'accounting.invoicing.detail.vat' | translate }}: {{ invoice()!.customerVatNumber }}</p>
                  }
                </div>
                <div class="space-y-2">
                  <div>
                    <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ 'accounting.invoicing.detail.invoiceDate' | translate }}</p>
                    <p class="font-medium text-neutral-800 dark:text-neutral-200">{{ invoice()!.invoiceDate | date:'longDate' }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ 'accounting.invoicing.detail.dueDate' | translate }}</p>
                    <p class="font-medium text-neutral-800 dark:text-neutral-200">{{ invoice()!.dueDate | date:'longDate' }}</p>
                  </div>
                  @if (invoice()!.reference) {
                    <div>
                      <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ 'accounting.invoicing.detail.reference' | translate }}</p>
                      <p class="font-medium text-neutral-800 dark:text-neutral-200">{{ invoice()!.reference }}</p>
                    </div>
                  }
                  @if (invoice()!.purchaseOrder) {
                    <div>
                      <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ 'accounting.invoicing.detail.purchaseOrder' | translate }}</p>
                      <p class="font-medium text-neutral-800 dark:text-neutral-200">{{ invoice()!.purchaseOrder }}</p>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Line Items -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border">
              <div class="p-4 border-b border-neutral-200 dark:border-dark-border">
                <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'accounting.invoicing.detail.lineItems' | translate }}</h2>
              </div>
              <div class="overflow-x-auto">
                <table class="sw-table">
                  <thead>
                    <tr>
                      <th class="w-1/2">{{ 'accounting.invoicing.detail.description' | translate }}</th>
                      <th class="text-right">{{ 'accounting.invoicing.detail.quantity' | translate }}</th>
                      <th class="text-right">{{ 'accounting.invoicing.detail.unitPrice' | translate }}</th>
                      <th class="text-right">{{ 'accounting.invoicing.detail.vat' | translate }}</th>
                      <th class="text-right">{{ 'accounting.invoicing.detail.total' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (line of invoice()!.lines; track line.id) {
                      <tr>
                        <td>
                          <p class="font-medium text-neutral-800 dark:text-neutral-200">{{ line.description }}</p>
                          @if (line.productCode) {
                            <p class="text-xs text-neutral-500">{{ line.productCode }}</p>
                          }
                        </td>
                        <td class="text-right text-neutral-600 dark:text-neutral-400">{{ line.quantity }}</td>
                        <td class="text-right font-mono text-neutral-600 dark:text-neutral-400">{{ line.unitPrice | currency:'ZAR':'symbol':'1.2-2' }}</td>
                        <td class="text-right text-neutral-600 dark:text-neutral-400">{{ line.vatRate * 100 }}%</td>
                        <td class="text-right font-mono font-medium text-neutral-800 dark:text-neutral-200">{{ line.lineTotal | currency:'ZAR':'symbol':'1.2-2' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Totals -->
              <div class="p-4 border-t border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-elevated">
                <div class="max-w-xs ml-auto space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-neutral-600 dark:text-neutral-400">{{ 'accounting.invoicing.detail.subtotal' | translate }}</span>
                    <span class="font-mono">{{ invoice()!.subtotal | currency:'ZAR':'symbol':'1.2-2' }}</span>
                  </div>
                  @if (invoice()!.discountAmount > 0) {
                    <div class="flex justify-between text-sm">
                      <span class="text-neutral-600 dark:text-neutral-400">{{ 'accounting.invoicing.detail.discount' | translate }}</span>
                      <span class="font-mono text-red-600">-{{ invoice()!.discountAmount | currency:'ZAR':'symbol':'1.2-2' }}</span>
                    </div>
                  }
                  <div class="flex justify-between text-sm">
                    <span class="text-neutral-600 dark:text-neutral-400">{{ 'accounting.invoicing.detail.vat' | translate }}</span>
                    <span class="font-mono">{{ invoice()!.vatAmount | currency:'ZAR':'symbol':'1.2-2' }}</span>
                  </div>
                  <div class="flex justify-between text-lg font-bold border-t border-neutral-200 dark:border-dark-border pt-2">
                    <span>{{ 'accounting.invoicing.detail.total' | translate }}</span>
                    <span class="font-mono">{{ invoice()!.total | currency:'ZAR':'symbol':'1.2-2' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Notes -->
            @if (invoice()!.notes || invoice()!.termsAndConditions) {
              <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
                @if (invoice()!.notes) {
                  <div class="mb-4">
                    <h3 class="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-2">{{ 'accounting.invoicing.detail.notes' | translate }}</h3>
                    <p class="text-neutral-700 dark:text-neutral-300 whitespace-pre-line">{{ invoice()!.notes }}</p>
                  </div>
                }
                @if (invoice()!.termsAndConditions) {
                  <div>
                    <h3 class="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-2">{{ 'accounting.invoicing.detail.termsAndConditions' | translate }}</h3>
                    <p class="text-neutral-700 dark:text-neutral-300 whitespace-pre-line">{{ invoice()!.termsAndConditions }}</p>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Payment History -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border">
              <div class="p-4 border-b border-neutral-200 dark:border-dark-border">
                <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'accounting.invoicing.detail.payments' | translate }}</h2>
              </div>
              @if (invoice()!.payments.length > 0) {
                <div class="divide-y divide-neutral-200 dark:divide-dark-border">
                  @for (payment of invoice()!.payments; track payment.id) {
                    <div class="p-4">
                      <div class="flex justify-between items-start">
                        <div>
                          <p class="font-medium text-neutral-800 dark:text-neutral-200">{{ payment.paymentDate | date:'mediumDate' }}</p>
                          <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ payment.paymentMethodDisplay }}</p>
                          @if (payment.reference) {
                            <p class="text-xs text-neutral-500">{{ 'accounting.invoicing.detail.reference' | translate }}: {{ payment.reference }}</p>
                          }
                        </div>
                        <p class="font-mono font-medium text-green-600">{{ payment.amount | currency:'ZAR':'symbol':'1.2-2' }}</p>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="p-8 text-center">
                  <span class="material-icons text-4xl text-neutral-300 dark:text-neutral-600 mb-2">payments</span>
                  <p class="text-neutral-500 dark:text-neutral-400">{{ 'accounting.invoicing.detail.noPaymentsRecorded' | translate }}</p>
                </div>
              }
            </div>

            <!-- Activity Timeline -->
            <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border">
              <div class="p-4 border-b border-neutral-200 dark:border-dark-border">
                <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ 'accounting.invoicing.detail.activity' | translate }}</h2>
              </div>
              <div class="p-4 space-y-4">
                @if (invoice()!.sentAt) {
                  <div class="flex gap-3">
                    <span class="material-icons text-blue-500">send</span>
                    <div>
                      <p class="text-sm font-medium text-neutral-800 dark:text-neutral-200">{{ 'accounting.invoicing.detail.sentToCustomer' | translate }}</p>
                      <p class="text-xs text-neutral-500">{{ invoice()!.sentAt | date:'medium' }}</p>
                      @if (invoice()!.sentToEmail) {
                        <p class="text-xs text-neutral-500">{{ invoice()!.sentToEmail }}</p>
                      }
                    </div>
                  </div>
                }
                @if (invoice()!.postedAt) {
                  <div class="flex gap-3">
                    <span class="material-icons text-green-500">check_circle</span>
                    <div>
                      <p class="text-sm font-medium text-neutral-800 dark:text-neutral-200">{{ 'accounting.invoicing.detail.postedToAccounting' | translate }}</p>
                      <p class="text-xs text-neutral-500">{{ invoice()!.postedAt | date:'medium' }}</p>
                    </div>
                  </div>
                }
                <div class="flex gap-3">
                  <span class="material-icons text-neutral-400">add_circle</span>
                  <div>
                    <p class="text-sm font-medium text-neutral-800 dark:text-neutral-200">{{ 'accounting.invoicing.detail.invoiceCreated' | translate }}</p>
                    <p class="text-xs text-neutral-500">{{ invoice()!.createdAt | date:'medium' }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Send Invoice Dialog -->
      @if (showSendDialog) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" (click)="showSendDialog = false">
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-xl max-w-md w-full mx-4" (click)="$event.stopPropagation()">
            <div class="p-6 border-b border-neutral-200 dark:border-dark-border">
              <h2 class="text-xl font-semibold text-neutral-900 dark:text-white">{{ 'accounting.invoicing.detail.sendInvoice' | translate }}</h2>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.detail.toEmailRequired' | translate }}</label>
                <input type="email" [(ngModel)]="sendForm.toEmail" class="sw-input w-full" [placeholder]="invoice()?.customerEmail || 'customer@email.com'">
              </div>
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.detail.ccEmail' | translate }}</label>
                <input type="email" [(ngModel)]="sendForm.ccEmail" class="sw-input w-full" placeholder="cc@email.com">
              </div>
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.detail.subject' | translate }}</label>
                <input type="text" [(ngModel)]="sendForm.subject" class="sw-input w-full" [placeholder]="'Invoice ' + invoice()?.invoiceNumber">
              </div>
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.detail.message' | translate }}</label>
                <textarea [(ngModel)]="sendForm.message" rows="3" class="sw-input w-full" placeholder="Please find attached your invoice..."></textarea>
              </div>
              <div class="flex items-center gap-2">
                <input type="checkbox" [(ngModel)]="sendForm.attachPdf" id="attachPdf" class="rounded border-neutral-300">
                <label for="attachPdf" class="text-sm text-neutral-700 dark:text-neutral-300">{{ 'accounting.invoicing.detail.attachPdf' | translate }}</label>
              </div>
            </div>
            <div class="p-6 border-t border-neutral-200 dark:border-dark-border flex justify-end gap-3">
              <button (click)="showSendDialog = false" class="sw-btn sw-btn-outline sw-btn-md">{{ 'common.cancel' | translate }}</button>
              <button (click)="sendInvoice()" [disabled]="!sendForm.toEmail || sending()" class="sw-btn sw-btn-primary sw-btn-md">
                @if (sending()) {
                  <sw-spinner size="sm" />
                }
                {{ 'accounting.invoicing.detail.sendInvoice' | translate }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Record Payment Dialog -->
      @if (showPaymentDialog) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" (click)="showPaymentDialog = false">
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-xl max-w-md w-full mx-4" (click)="$event.stopPropagation()">
            <div class="p-6 border-b border-neutral-200 dark:border-dark-border">
              <h2 class="text-xl font-semibold text-neutral-900 dark:text-white">{{ 'accounting.invoicing.detail.recordPayment' | translate }}</h2>
              <p class="text-sm text-neutral-500">{{ 'accounting.invoicing.detail.amountDueLabel' | translate:{ amount: (invoice()?.amountDue | currency:'ZAR':'symbol':'1.2-2') } }}</p>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.detail.paymentDateRequired' | translate }}</label>
                <input type="date" [(ngModel)]="paymentForm.paymentDate" class="sw-input w-full">
              </div>
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.detail.amountRequired' | translate }}</label>
                <input type="number" [(ngModel)]="paymentForm.amount" step="0.01" min="0.01" [max]="invoice()?.amountDue ?? null" class="sw-input w-full">
              </div>
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.detail.paymentMethod' | translate }}</label>
                <select [(ngModel)]="paymentForm.paymentMethod" class="sw-select w-full">
                  <option value="EFT">{{ 'accounting.invoicing.detail.paymentMethodEft' | translate }}</option>
                  <option value="CASH">{{ 'accounting.invoicing.detail.paymentMethodCash' | translate }}</option>
                  <option value="CARD">{{ 'accounting.invoicing.detail.paymentMethodCard' | translate }}</option>
                  <option value="CHEQUE">{{ 'accounting.invoicing.detail.paymentMethodCheque' | translate }}</option>
                  <option value="OTHER">{{ 'accounting.invoicing.detail.paymentMethodOther' | translate }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.detail.reference' | translate }}</label>
                <input type="text" [(ngModel)]="paymentForm.reference" class="sw-input w-full" placeholder="Payment reference">
              </div>
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.detail.notes' | translate }}</label>
                <textarea [(ngModel)]="paymentForm.notes" rows="2" class="sw-input w-full"></textarea>
              </div>
            </div>
            <div class="p-6 border-t border-neutral-200 dark:border-dark-border flex justify-end gap-3">
              <button (click)="showPaymentDialog = false" class="sw-btn sw-btn-outline sw-btn-md">{{ 'common.cancel' | translate }}</button>
              <button (click)="recordPayment()" [disabled]="!paymentForm.paymentDate || !paymentForm.amount || saving()" class="sw-btn sw-btn-primary sw-btn-md">
                @if (saving()) {
                  <sw-spinner size="sm" />
                }
                {{ 'accounting.invoicing.detail.recordPayment' | translate }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Void Dialog -->
      @if (showVoidDialog) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" (click)="showVoidDialog = false">
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-xl max-w-md w-full mx-4" (click)="$event.stopPropagation()">
            <div class="p-6 border-b border-neutral-200 dark:border-dark-border">
              <h2 class="text-xl font-semibold text-red-600">{{ 'accounting.invoicing.detail.voidInvoice' | translate }}</h2>
              <p class="text-sm text-neutral-500">{{ 'accounting.invoicing.detail.actionCannotBeUndone' | translate }}</p>
            </div>
            <div class="p-6">
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.detail.reasonRequired' | translate }}</label>
              <textarea [(ngModel)]="voidReason" rows="3" class="sw-input w-full" placeholder="Reason for voiding this invoice"></textarea>
            </div>
            <div class="p-6 border-t border-neutral-200 dark:border-dark-border flex justify-end gap-3">
              <button (click)="showVoidDialog = false" class="sw-btn sw-btn-outline sw-btn-md">{{ 'common.cancel' | translate }}</button>
              <button (click)="voidInvoice()" [disabled]="!voidReason || saving()" class="sw-btn bg-red-600 text-white hover:bg-red-700 sw-btn-md">
                @if (saving()) {
                  <sw-spinner size="sm" />
                }
                {{ 'accounting.invoicing.detail.voidInvoice' | translate }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Write-off Dialog -->
      @if (showWriteOffDialog) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" (click)="showWriteOffDialog = false">
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-xl max-w-md w-full mx-4" (click)="$event.stopPropagation()">
            <div class="p-6 border-b border-neutral-200 dark:border-dark-border">
              <h2 class="text-xl font-semibold text-orange-600">{{ 'accounting.invoicing.detail.writeOffBadDebt' | translate }}</h2>
              <p class="text-sm text-neutral-500">{{ 'accounting.invoicing.detail.amountLabel' | translate:{ amount: (invoice()?.amountDue | currency:'ZAR':'symbol':'1.2-2') } }}</p>
            </div>
            <div class="p-6">
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{{ 'accounting.invoicing.detail.reasonRequired' | translate }}</label>
              <textarea [(ngModel)]="writeOffReason" rows="3" class="sw-input w-full" placeholder="Reason for writing off this invoice"></textarea>
            </div>
            <div class="p-6 border-t border-neutral-200 dark:border-dark-border flex justify-end gap-3">
              <button (click)="showWriteOffDialog = false" class="sw-btn sw-btn-outline sw-btn-md">{{ 'common.cancel' | translate }}</button>
              <button (click)="writeOffInvoice()" [disabled]="!writeOffReason || saving()" class="sw-btn bg-orange-600 text-white hover:bg-orange-700 sw-btn-md">
                @if (saving()) {
                  <sw-spinner size="sm" />
                }
                {{ 'accounting.invoicing.detail.writeOff' | translate }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class InvoiceDetailComponent implements OnInit {
  private readonly invoiceService = inject(InvoiceService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);

  loading = signal(true);
  saving = signal(false);
  sending = signal(false);
  invoice = signal<InvoiceResponse | null>(null);

  showActionsMenu = false;
  showSendDialog = false;
  showPaymentDialog = false;
  showVoidDialog = false;
  showWriteOffDialog = false;

  voidReason = '';
  writeOffReason = '';

  sendForm = {
    toEmail: '',
    ccEmail: '',
    subject: '',
    message: '',
    attachPdf: true
  };

  paymentForm = {
    paymentDate: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMethod: 'EFT' as PaymentMethod,
    reference: '',
    notes: ''
  };

  ngOnInit(): void {
    const invoiceId = this.route.snapshot.paramMap.get('id');
    if (invoiceId) {
      this.loadInvoice(invoiceId);
    }

    // Check for action query param
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'send') {
        this.showSendDialog = true;
      }
    });
  }

  loadInvoice(invoiceId: string): void {
    this.loading.set(true);
    this.invoiceService.getInvoice(invoiceId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (invoice) => {
          this.invoice.set(invoice);
          this.sendForm.toEmail = invoice.customerEmail || '';
          this.sendForm.subject = `Invoice ${invoice.invoiceNumber}`;
          this.paymentForm.amount = invoice.amountDue;
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load invoice', err);
          this.loading.set(false);
        }
      });
  }

  canRecordPayment(): boolean {
    const inv = this.invoice();
    return !!inv && inv.amountDue > 0 && !['VOID', 'WRITTEN_OFF', 'DRAFT'].includes(inv.status);
  }

  downloadPdf(): void {
    const inv = this.invoice();
    if (!inv) return;

    this.invoiceService.downloadPdf(inv.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${inv.invoiceNumber}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Failed to download PDF', err)
    });
  }

  sendInvoice(): void {
    const inv = this.invoice();
    if (!inv || !this.sendForm.toEmail) return;

    this.sending.set(true);
    const request: SendInvoiceRequest = {
      toEmail: this.sendForm.toEmail,
      ccEmail: this.sendForm.ccEmail || undefined,
      subject: this.sendForm.subject || undefined,
      message: this.sendForm.message || undefined,
      attachPdf: this.sendForm.attachPdf
    };

    this.invoiceService.sendInvoice(inv.id, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.invoice.set(updated);
          this.showSendDialog = false;
          this.sending.set(false);
        },
        error: (err) => {
          console.error('Failed to send invoice', err);
          this.sending.set(false);
        }
      });
  }

  recordPayment(): void {
    const inv = this.invoice();
    if (!inv) return;

    this.saving.set(true);
    const request: RecordPaymentRequest = {
      paymentDate: this.paymentForm.paymentDate,
      amount: this.paymentForm.amount,
      paymentMethod: this.paymentForm.paymentMethod,
      reference: this.paymentForm.reference || undefined,
      notes: this.paymentForm.notes || undefined
    };

    this.invoiceService.recordPayment(inv.id, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.invoice.set(updated);
          this.showPaymentDialog = false;
          this.paymentForm.amount = updated.amountDue;
          this.saving.set(false);
        },
        error: (err) => {
          console.error('Failed to record payment', err);
          this.saving.set(false);
        }
      });
  }

  sendReminder(): void {
    const inv = this.invoice();
    if (!inv) return;

    this.invoiceService.sendPaymentReminder(inv.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loadInvoice(inv.id),
        error: (err) => console.error('Failed to send reminder', err)
      });
  }

  voidInvoice(): void {
    const inv = this.invoice();
    if (!inv || !this.voidReason) return;

    this.saving.set(true);
    this.invoiceService.voidInvoice(inv.id, { reason: this.voidReason })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.invoice.set(updated);
          this.showVoidDialog = false;
          this.voidReason = '';
          this.saving.set(false);
        },
        error: (err) => {
          console.error('Failed to void invoice', err);
          this.saving.set(false);
        }
      });
  }

  writeOffInvoice(): void {
    const inv = this.invoice();
    if (!inv || !this.writeOffReason) return;

    this.saving.set(true);
    this.invoiceService.writeOffInvoice(inv.id, { reason: this.writeOffReason })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.invoice.set(updated);
          this.showWriteOffDialog = false;
          this.writeOffReason = '';
          this.saving.set(false);
        },
        error: (err) => {
          console.error('Failed to write off invoice', err);
          this.saving.set(false);
        }
      });
  }

  deleteInvoice(): void {
    const inv = this.invoice();
    if (!inv || inv.status !== 'DRAFT') return;

    const message = this.translate.instant('accounting.invoicing.detail.confirmDeleteInvoice');
    if (confirm(message)) {
      this.invoiceService.deleteInvoice(inv.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.router.navigate(['/accounting/invoicing']),
          error: (err) => console.error('Failed to delete invoice', err)
        });
    }
  }

  getStatusLabel(status: InvoiceStatus): string {
    return InvoiceService.getStatusLabel(status);
  }

  getStatusColor(status: InvoiceStatus): string {
    return InvoiceService.getStatusColor(status);
  }
}
