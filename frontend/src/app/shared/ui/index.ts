// =============================================================================
// SureWork Shared UI Components
// Barrel export file
// =============================================================================

// Icons
export { IconComponent } from './icons/icon.component';

// Buttons
export { ButtonComponent } from './button/button.component';
export { IconButtonComponent } from './button/icon-button.component';

// Inputs
export { InputComponent } from './input/input.component';
export { TextareaComponent } from './input/textarea.component';
export { SelectComponent, type SelectOption } from './input/select.component';
export { FormFieldComponent } from './input/form-field.component';

// Card
export { CardComponent } from './card/card.component';

// Table
export { DataTableComponent, type TableColumn, type SortEvent } from './table/data-table.component';
export { PaginationComponent } from './table/pagination.component';

// Password
export { PasswordStrengthComponent, DEFAULT_PASSWORD_REQUIREMENTS, type PasswordRequirement } from './password-strength/password-strength.component';

// Feedback
export { SpinnerComponent } from './feedback/spinner.component';
export {
  SkeletonComponent,
  TableSkeletonComponent,
  CardSkeletonComponent,
  ListSkeletonComponent,
  StatsSkeletonComponent
} from './feedback/skeleton.component';
export { EmptyStateComponent } from './feedback/empty-state.component';
export { ToastService, type Toast, type ToastType } from './feedback/toast.service';
export { ToastContainerComponent } from './feedback/toast.component';

// Overlay
export { DialogService, type DialogConfig, type DialogRef } from './overlay/dialog.service';
export { DialogComponent, ConfirmDialogComponent } from './overlay/dialog.component';
export { ConfirmActionDialogComponent, type ConfirmActionDialogData } from './overlay/confirm-action-dialog.component';
export { AccountingConfirmDialogComponent } from './overlay/accounting-confirm-dialog.component';
export { DropdownComponent, DropdownItemComponent, DropdownDividerComponent } from './overlay/dropdown.component';

// Navigation
export { BadgeComponent, StatusBadgeComponent } from './navigation/badge.component';
export {
  JournalStatusBadgeComponent,
  PeriodStatusBadgeComponent,
  VatStatusBadgeComponent,
  InvoiceStatusBadgeComponent,
  AccountTypeDotComponent
} from './navigation/accounting-status-badge.component';
export { TabsComponent, TabPanelComponent, type Tab } from './navigation/tabs.component';

// Charts (ApexCharts wrappers)
export { ApexDonutChartComponent, type DonutSegment } from './charts/apex-donut-chart.component';

// Status Configuration (centralized color/variant mappings)
export {
  type BadgeVariant,
  type LeaveType,
  type LeaveTypeConfig,
  type LeaveStatus,
  type StatusConfig,
  type EmployeeStatus,
  type InterviewType,
  type InterviewTypeConfig,
  type ApplicationStage,
  type ApplicationStageConfig,
  type JournalEntryStatus,
  type JournalEntryType,
  type FiscalPeriodStatus,
  type AccountType,
  type AccountTypeConfig,
  LEAVE_TYPE_CONFIG,
  LEAVE_STATUS_CONFIG,
  EMPLOYEE_STATUS_CONFIG,
  INTERVIEW_TYPE_CONFIG,
  APPLICATION_STAGE_CONFIG,
  JOURNAL_STATUS_CONFIG,
  JOURNAL_TYPE_CONFIG,
  PERIOD_STATUS_CONFIG,
  ACCOUNT_TYPE_CONFIG,
  getLeaveTypeConfig,
  getLeaveStatusConfig,
  getEmployeeStatusConfig,
  getInterviewTypeConfig,
  getApplicationStageConfig,
  getJournalStatusConfig,
  getJournalTypeConfig,
  getPeriodStatusConfig,
  getAccountTypeConfig
} from './status-config';
