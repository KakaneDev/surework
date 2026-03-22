import { Component, ChangeDetectionStrategy, input, computed, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  getJournalStatusConfig,
  getPeriodStatusConfig,
  getVatReportStatusConfig,
  getInvoiceStatusConfig,
  getAccountTypeConfig,
  getVariantClasses,
  JournalEntryStatus,
  FiscalPeriodStatus,
  VatReportStatus,
  InvoiceStatus,
  AccountType
} from '../status-config';

/**
 * Accessible status badge components for accounting module.
 * Uses centralized status config and proper ARIA attributes for WCAG 2.1 Level AA compliance.
 *
 * Features:
 * - Semantic role="status" for screen reader announcements
 * - aria-live="polite" for dynamic status updates
 * - Internationalized labels via ngx-translate
 * - Centralized color variants for theme consistency
 *
 * @example
 * <sw-journal-status-badge status="POSTED" />
 * <sw-period-status-badge status="OPEN" />
 * <sw-vat-status-badge status="SUBMITTED" />
 * <sw-invoice-status-badge status="PAID" />
 */

// Journal Entry Status Badge
@Component({
  selector: 'sw-journal-status-badge',
  standalone: true,
  imports: [NgClass, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span role="status"
          aria-live="polite"
          [attr.aria-label]="ariaLabel()"
          [ngClass]="badgeClasses()"
          class="status-badge">
      {{ statusLabel() }}
    </span>
  `
})
export class JournalStatusBadgeComponent {
  private readonly translate = inject(TranslateService);
  status = input.required<JournalEntryStatus>();

  private readonly labelMap: Record<JournalEntryStatus, string> = {
    DRAFT: 'Draft',
    POSTED: 'Posted',
    REVERSED: 'Reversed',
    VOID: 'Void'
  };

  statusLabel = computed(() => this.labelMap[this.status()] || this.status());

  ariaLabel = computed(() =>
    this.translate.instant('accounting.ariaLabels.journalStatus', { status: this.statusLabel() })
  );

  badgeClasses = computed(() => {
    const config = getJournalStatusConfig(this.status());
    return getVariantClasses(config.variant);
  });
}

// Fiscal Period Status Badge
@Component({
  selector: 'sw-period-status-badge',
  standalone: true,
  imports: [NgClass, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span role="status"
          aria-live="polite"
          [attr.aria-label]="ariaLabel()"
          [ngClass]="badgeClasses()"
          class="status-badge">
      {{ statusLabel() }}
    </span>
  `
})
export class PeriodStatusBadgeComponent {
  private readonly translate = inject(TranslateService);
  status = input.required<FiscalPeriodStatus>();

  private readonly labelMap: Record<FiscalPeriodStatus, string> = {
    FUTURE: 'Future',
    OPEN: 'Open',
    CLOSED: 'Closed',
    LOCKED: 'Locked'
  };

  statusLabel = computed(() => this.labelMap[this.status()] || this.status());

  ariaLabel = computed(() =>
    this.translate.instant('accounting.ariaLabels.periodStatus', { status: this.statusLabel() })
  );

  badgeClasses = computed(() => {
    const config = getPeriodStatusConfig(this.status());
    return getVariantClasses(config.variant);
  });
}

// VAT Report Status Badge
@Component({
  selector: 'sw-vat-status-badge',
  standalone: true,
  imports: [NgClass, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span role="status"
          aria-live="polite"
          [attr.aria-label]="ariaLabel()"
          [ngClass]="badgeClasses()"
          class="status-badge">
      {{ statusLabel() }}
    </span>
  `
})
export class VatStatusBadgeComponent {
  private readonly translate = inject(TranslateService);
  status = input.required<VatReportStatus>();

  private readonly labelMap: Record<VatReportStatus, string> = {
    DRAFT: 'Draft',
    PREVIEW: 'Preview',
    GENERATED: 'Generated',
    SUBMITTED: 'Submitted',
    PAID: 'Paid',
    AMENDED: 'Amended'
  };

  statusLabel = computed(() => this.labelMap[this.status()] || this.status());

  ariaLabel = computed(() =>
    this.translate.instant('accounting.ariaLabels.vatStatus', { status: this.statusLabel() })
  );

  badgeClasses = computed(() => {
    const config = getVatReportStatusConfig(this.status());
    return getVariantClasses(config.variant);
  });
}

// Invoice Status Badge
@Component({
  selector: 'sw-invoice-status-badge',
  standalone: true,
  imports: [NgClass, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span role="status"
          aria-live="polite"
          [attr.aria-label]="ariaLabel()"
          [ngClass]="badgeClasses()"
          class="status-badge">
      {{ statusLabel() }}
    </span>
  `
})
export class InvoiceStatusBadgeComponent {
  private readonly translate = inject(TranslateService);
  status = input.required<InvoiceStatus>();

  private readonly labelMap: Record<InvoiceStatus, string> = {
    DRAFT: 'Draft',
    SENT: 'Sent',
    VIEWED: 'Viewed',
    PARTIALLY_PAID: 'Partially Paid',
    PAID: 'Paid',
    OVERDUE: 'Overdue',
    VOID: 'Void',
    WRITTEN_OFF: 'Written Off'
  };

  statusLabel = computed(() => this.labelMap[this.status()] || this.status());

  ariaLabel = computed(() =>
    this.translate.instant('accounting.ariaLabels.invoiceStatus', { status: this.statusLabel() })
  );

  badgeClasses = computed(() => {
    const config = getInvoiceStatusConfig(this.status());
    return getVariantClasses(config.variant);
  });
}

// Account Type Indicator (colored dot)
@Component({
  selector: 'sw-account-type-dot',
  standalone: true,
  imports: [NgClass, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center gap-2"
          role="img"
          [attr.aria-label]="ariaLabel()">
      <span [ngClass]="dotClasses()"
            class="w-3 h-3 rounded-full"
            aria-hidden="true"></span>
      @if (showLabel()) {
        <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
              aria-hidden="true">{{ typeLabel() }}</span>
      }
    </span>
  `
})
export class AccountTypeDotComponent {
  private readonly translate = inject(TranslateService);
  type = input.required<AccountType>();
  showLabel = input<boolean>(false);

  private readonly labelMap: Record<AccountType, string> = {
    ASSET: 'Assets',
    LIABILITY: 'Liabilities',
    EQUITY: 'Equity',
    REVENUE: 'Revenue',
    EXPENSE: 'Expenses'
  };

  typeLabel = computed(() => this.labelMap[this.type()] || this.type());

  ariaLabel = computed(() =>
    this.translate.instant('accounting.ariaLabels.accountType', { type: this.typeLabel() })
  );

  dotClasses = computed(() => {
    const config = getAccountTypeConfig(this.type());
    return config.dotColor;
  });
}
