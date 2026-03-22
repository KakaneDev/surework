// =============================================================================
// Centralized Status and Color Configuration
// Single source of truth for status colors, gradients, and badge variants
// =============================================================================
//
// USAGE PATTERNS:
// ---------------
// Services provide two methods for accessing status colors:
//
// 1. Tailwind Classes (Recommended for dark mode support):
//    static getStatusClasses(status): string
//    Usage: [class]="Service.getStatusClasses(status)"
//
// 2. HexColorPair (For inline styles):
//    static getStatusHexColors(status): HexColorPair
//    Usage: [style.background]="Service.getStatusHexColors(status).background"
//           [style.color]="Service.getStatusHexColors(status).color"
//
// When creating new components, prefer Tailwind classes for automatic dark mode.
// =============================================================================

/**
 * Badge variant type used across all status badges in the application.
 * Maps to Tailwind CSS color classes defined in the design system.
 */
export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info';

// =============================================================================
// Leave Type Configuration
// =============================================================================

export type LeaveType =
  | 'ANNUAL'
  | 'SICK'
  | 'FAMILY_RESPONSIBILITY'
  | 'MATERNITY'
  | 'PARENTAL'
  | 'UNPAID'
  | 'STUDY';

export interface LeaveTypeConfig {
  icon: string;
  gradient: string;
  variant: BadgeVariant;
  translationKey: string;
}

export const LEAVE_TYPE_CONFIG: Record<LeaveType, LeaveTypeConfig> = {
  ANNUAL: {
    icon: 'beach_access',
    // Gradient: Green with darker end for white text contrast (4.5:1+)
    gradient: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
    variant: 'success',
    translationKey: 'leave.types.annual'
  },
  SICK: {
    icon: 'medical_services',
    // Gradient: Red with darker end for white text contrast
    gradient: 'linear-gradient(135deg, #C62828 0%, #E53935 100%)',
    variant: 'error',
    translationKey: 'leave.types.sick'
  },
  FAMILY_RESPONSIBILITY: {
    icon: 'family_restroom',
    // Gradient: Purple with darker end for white text contrast
    gradient: 'linear-gradient(135deg, #6A1B9A 0%, #9C27B0 100%)',
    variant: 'primary',
    translationKey: 'leave.types.familyResponsibility'
  },
  MATERNITY: {
    icon: 'pregnant_woman',
    // Gradient: Pink with darker end for white text contrast
    gradient: 'linear-gradient(135deg, #AD1457 0%, #E91E63 100%)',
    variant: 'warning',
    translationKey: 'leave.types.maternity'
  },
  PARENTAL: {
    icon: 'child_care',
    // Gradient: Teal/Cyan with darker colors for white text contrast
    gradient: 'linear-gradient(135deg, #00838F 0%, #0097A7 100%)',
    variant: 'primary',
    translationKey: 'leave.types.parental'
  },
  UNPAID: {
    icon: 'money_off',
    // Gradient: Blue-gray with darker end for white text contrast
    gradient: 'linear-gradient(135deg, #455A64 0%, #607D8B 100%)',
    variant: 'neutral',
    translationKey: 'leave.types.unpaid'
  },
  STUDY: {
    icon: 'school',
    // Gradient: Orange with darker end for white text contrast
    gradient: 'linear-gradient(135deg, #E65100 0%, #F57C00 100%)',
    variant: 'warning',
    translationKey: 'leave.types.study'
  }
};

// =============================================================================
// Leave Status Configuration
// =============================================================================

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface StatusConfig {
  variant: BadgeVariant;
  translationKey: string;
}

export const LEAVE_STATUS_CONFIG: Record<LeaveStatus, StatusConfig> = {
  PENDING: { variant: 'warning', translationKey: 'leave.pending' },
  APPROVED: { variant: 'success', translationKey: 'leave.approved' },
  REJECTED: { variant: 'error', translationKey: 'leave.rejected' },
  CANCELLED: { variant: 'neutral', translationKey: 'leave.cancelled' }
};

// =============================================================================
// Employee Status Configuration
// =============================================================================

export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED' | 'INACTIVE';

export const EMPLOYEE_STATUS_CONFIG: Record<EmployeeStatus, StatusConfig> = {
  ACTIVE: { variant: 'success', translationKey: 'employees.status.active' },
  ON_LEAVE: { variant: 'warning', translationKey: 'employees.status.onLeave' },
  SUSPENDED: { variant: 'error', translationKey: 'employees.status.suspended' },
  TERMINATED: { variant: 'error', translationKey: 'employees.status.terminated' },
  INACTIVE: { variant: 'neutral', translationKey: 'employees.status.inactive' }
};

// =============================================================================
// Interview Type Configuration
// =============================================================================

export type InterviewType =
  | 'PHONE_SCREEN'
  | 'VIDEO_CALL'
  | 'IN_PERSON'
  | 'TECHNICAL'
  | 'BEHAVIORAL'
  | 'PANEL'
  | 'CASE_STUDY'
  | 'FINAL';

export interface InterviewTypeConfig {
  variant: BadgeVariant;
  translationKey: string;
  icon: string;
}

export const INTERVIEW_TYPE_CONFIG: Record<InterviewType, InterviewTypeConfig> = {
  PHONE_SCREEN: {
    variant: 'primary',
    translationKey: 'dashboard.interviewType.phoneScreen',
    icon: 'phone'
  },
  VIDEO_CALL: {
    variant: 'success',
    translationKey: 'dashboard.interviewType.videoCall',
    icon: 'videocam'
  },
  IN_PERSON: {
    variant: 'warning',
    translationKey: 'dashboard.interviewType.inPerson',
    icon: 'person'
  },
  TECHNICAL: {
    variant: 'primary',
    translationKey: 'dashboard.interviewType.technical',
    icon: 'code'
  },
  BEHAVIORAL: {
    variant: 'neutral',
    translationKey: 'dashboard.interviewType.behavioral',
    icon: 'psychology'
  },
  PANEL: {
    variant: 'primary',
    translationKey: 'dashboard.interviewType.panel',
    icon: 'groups'
  },
  CASE_STUDY: {
    variant: 'warning',
    translationKey: 'dashboard.interviewType.caseStudy',
    icon: 'assignment'
  },
  FINAL: {
    variant: 'success',
    translationKey: 'dashboard.interviewType.final',
    icon: 'verified'
  }
};

// =============================================================================
// Application Stage Configuration (Recruitment Pipeline)
// =============================================================================

export type ApplicationStage =
  | 'NEW'
  | 'SCREENING'
  | 'PHONE_SCREEN'
  | 'ASSESSMENT'
  | 'FIRST_INTERVIEW'
  | 'SECOND_INTERVIEW'
  | 'FINAL_INTERVIEW'
  | 'REFERENCE_CHECK'
  | 'BACKGROUND_CHECK'
  | 'OFFER'
  | 'ONBOARDING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface ApplicationStageConfig {
  color: string;
  variant: BadgeVariant;
  translationKey: string;
}

export const APPLICATION_STAGE_CONFIG: Record<ApplicationStage, ApplicationStageConfig> = {
  NEW: {
    color: '#1a73e8',
    variant: 'primary',
    translationKey: 'recruitment.stages.new'
  },
  SCREENING: {
    color: '#f57c00',
    variant: 'warning',
    translationKey: 'recruitment.stages.screening'
  },
  PHONE_SCREEN: {
    color: '#c2185b',
    variant: 'primary',
    translationKey: 'recruitment.stages.phoneScreen'
  },
  ASSESSMENT: {
    color: '#6a1b9a',
    variant: 'primary',
    translationKey: 'recruitment.stages.assessment'
  },
  FIRST_INTERVIEW: {
    color: '#4a148c',
    variant: 'primary',
    translationKey: 'recruitment.stages.firstInterview'
  },
  SECOND_INTERVIEW: {
    color: '#311b92',
    variant: 'primary',
    translationKey: 'recruitment.stages.secondInterview'
  },
  FINAL_INTERVIEW: {
    color: '#1a237e',
    variant: 'primary',
    translationKey: 'recruitment.stages.finalInterview'
  },
  REFERENCE_CHECK: {
    color: '#0d47a1',
    variant: 'info',
    translationKey: 'recruitment.stages.referenceCheck'
  },
  BACKGROUND_CHECK: {
    color: '#01579b',
    variant: 'info',
    translationKey: 'recruitment.stages.backgroundCheck'
  },
  OFFER: {
    color: '#283593',
    variant: 'success',
    translationKey: 'recruitment.stages.offer'
  },
  ONBOARDING: {
    color: '#33691e',
    variant: 'success',
    translationKey: 'recruitment.stages.onboarding'
  },
  COMPLETED: {
    color: '#1b5e20',
    variant: 'success',
    translationKey: 'recruitment.stages.completed'
  },
  REJECTED: {
    color: '#b71c1c',
    variant: 'error',
    translationKey: 'recruitment.stages.rejected'
  },
  WITHDRAWN: {
    color: '#546e7a',
    variant: 'neutral',
    translationKey: 'recruitment.stages.withdrawn'
  }
};

// =============================================================================
// Accounting Status Configuration
// =============================================================================

export type JournalEntryStatus = 'DRAFT' | 'POSTED' | 'REVERSED' | 'VOID';

export const JOURNAL_STATUS_CONFIG: Record<JournalEntryStatus, StatusConfig> = {
  DRAFT: { variant: 'neutral', translationKey: 'accounting.status.draft' },
  POSTED: { variant: 'success', translationKey: 'accounting.status.posted' },
  REVERSED: { variant: 'warning', translationKey: 'accounting.status.reversed' },
  VOID: { variant: 'error', translationKey: 'accounting.status.void' }
};

export type JournalEntryType =
  | 'MANUAL'
  | 'SYSTEM'
  | 'PAYROLL'
  | 'INVOICE'
  | 'BILL'
  | 'PAYMENT'
  | 'RECEIPT'
  | 'TRANSFER'
  | 'ADJUSTMENT'
  | 'CLOSING'
  | 'OPENING'
  | 'REVERSAL';

export const JOURNAL_TYPE_CONFIG: Record<JournalEntryType, StatusConfig> = {
  MANUAL: { variant: 'primary', translationKey: 'accounting.journalType.manual' },
  SYSTEM: { variant: 'neutral', translationKey: 'accounting.journalType.system' },
  PAYROLL: { variant: 'success', translationKey: 'accounting.journalType.payroll' },
  INVOICE: { variant: 'primary', translationKey: 'accounting.journalType.invoice' },
  BILL: { variant: 'warning', translationKey: 'accounting.journalType.bill' },
  PAYMENT: { variant: 'success', translationKey: 'accounting.journalType.payment' },
  RECEIPT: { variant: 'success', translationKey: 'accounting.journalType.receipt' },
  TRANSFER: { variant: 'info', translationKey: 'accounting.journalType.transfer' },
  ADJUSTMENT: { variant: 'warning', translationKey: 'accounting.journalType.adjustment' },
  CLOSING: { variant: 'neutral', translationKey: 'accounting.journalType.closing' },
  OPENING: { variant: 'primary', translationKey: 'accounting.journalType.opening' },
  REVERSAL: { variant: 'error', translationKey: 'accounting.journalType.reversal' }
};

export type FiscalPeriodStatus = 'FUTURE' | 'OPEN' | 'CLOSED' | 'LOCKED';

export const PERIOD_STATUS_CONFIG: Record<FiscalPeriodStatus, StatusConfig> = {
  FUTURE: { variant: 'neutral', translationKey: 'accounting.periodStatus.future' },
  OPEN: { variant: 'success', translationKey: 'accounting.periodStatus.open' },
  CLOSED: { variant: 'warning', translationKey: 'accounting.periodStatus.closed' },
  LOCKED: { variant: 'error', translationKey: 'accounting.periodStatus.locked' }
};

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface AccountTypeConfig {
  variant: BadgeVariant;
  translationKey: string;
  dotColor: string;
}

export const ACCOUNT_TYPE_CONFIG: Record<AccountType, AccountTypeConfig> = {
  ASSET: {
    variant: 'primary',
    translationKey: 'accounting.accountType.assets',
    dotColor: 'bg-blue-500'
  },
  LIABILITY: {
    variant: 'error',
    translationKey: 'accounting.accountType.liabilities',
    dotColor: 'bg-red-500'
  },
  EQUITY: {
    variant: 'success',
    translationKey: 'accounting.accountType.equity',
    dotColor: 'bg-green-500'
  },
  REVENUE: {
    variant: 'success',
    translationKey: 'accounting.accountType.revenue',
    dotColor: 'bg-emerald-500'
  },
  EXPENSE: {
    variant: 'warning',
    translationKey: 'accounting.accountType.expenses',
    dotColor: 'bg-orange-500'
  }
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get leave type configuration with fallback defaults
 */
export function getLeaveTypeConfig(type: string): LeaveTypeConfig {
  return LEAVE_TYPE_CONFIG[type as LeaveType] || {
    icon: 'event',
    // Fallback gradient with sufficient contrast for white text
    gradient: 'linear-gradient(135deg, #455A64 0%, #607D8B 100%)',
    variant: 'neutral',
    translationKey: type
  };
}

/**
 * Mapping of leave types to their icon colors (hex).
 * Used for inline styles on leave type icons.
 * @deprecated Prefer using LEAVE_TYPE_TAILWIND_CLASSES for dark mode support
 */
export const LEAVE_TYPE_COLORS: Record<LeaveType, string> = {
  ANNUAL: '#4CAF50',
  SICK: '#f44336',
  FAMILY_RESPONSIBILITY: '#9C27B0',
  MATERNITY: '#E91E63',
  PARENTAL: '#00BCD4',
  UNPAID: '#607D8B',
  STUDY: '#FF9800'
};

/**
 * Mapping of leave types to Tailwind CSS classes for text color.
 * Recommended for proper dark mode support.
 */
export const LEAVE_TYPE_TAILWIND_CLASSES: Record<LeaveType, string> = {
  ANNUAL: 'text-success-500 dark:text-success-400',
  SICK: 'text-error-500 dark:text-error-400',
  FAMILY_RESPONSIBILITY: 'text-purple-500 dark:text-purple-400',
  MATERNITY: 'text-pink-500 dark:text-pink-400',
  PARENTAL: 'text-cyan-500 dark:text-cyan-400',
  UNPAID: 'text-neutral-500 dark:text-neutral-400',
  STUDY: 'text-warning-500 dark:text-warning-400'
};

/**
 * Get the icon color for a leave type.
 * @deprecated Prefer using getLeaveTypeClasses for dark mode support
 */
export function getLeaveTypeColor(type: string): string {
  return LEAVE_TYPE_COLORS[type as LeaveType] || '#607D8B';
}

/**
 * Get Tailwind CSS classes for leave type icon color.
 * Recommended for proper dark mode support.
 */
export function getLeaveTypeClasses(type: string): string {
  return LEAVE_TYPE_TAILWIND_CLASSES[type as LeaveType] || 'text-neutral-500 dark:text-neutral-400';
}

/**
 * Get leave status configuration with fallback
 */
export function getLeaveStatusConfig(status: string): StatusConfig {
  return LEAVE_STATUS_CONFIG[status as LeaveStatus] || {
    variant: 'neutral',
    translationKey: status
  };
}

/**
 * Get employee status configuration with fallback
 */
export function getEmployeeStatusConfig(status: string): StatusConfig {
  return EMPLOYEE_STATUS_CONFIG[status as EmployeeStatus] || {
    variant: 'neutral',
    translationKey: status
  };
}

/**
 * Get interview type configuration with fallback
 */
export function getInterviewTypeConfig(type: string): InterviewTypeConfig {
  return INTERVIEW_TYPE_CONFIG[type as InterviewType] || {
    variant: 'neutral',
    translationKey: type,
    icon: 'event'
  };
}

/**
 * Get application stage configuration with fallback
 */
export function getApplicationStageConfig(stage: string): ApplicationStageConfig {
  return APPLICATION_STAGE_CONFIG[stage as ApplicationStage] || {
    color: '#546e7a',
    variant: 'neutral',
    translationKey: stage
  };
}

/**
 * Tailwind CSS classes for application stage badges.
 */
export const APPLICATION_STAGE_TAILWIND_CLASSES: Record<ApplicationStage, string> = {
  NEW: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
  SCREENING: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
  PHONE_SCREEN: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  ASSESSMENT: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  FIRST_INTERVIEW: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  SECOND_INTERVIEW: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  FINAL_INTERVIEW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  REFERENCE_CHECK: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  BACKGROUND_CHECK: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  OFFER: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  ONBOARDING: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  COMPLETED: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
  REJECTED: 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400',
  WITHDRAWN: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
};

/**
 * Tailwind CSS classes for application stage border colors (for pipeline visuals).
 */
export const APPLICATION_STAGE_BORDER_CLASSES: Record<ApplicationStage, string> = {
  NEW: 'border-l-primary-500',
  SCREENING: 'border-l-warning-500',
  PHONE_SCREEN: 'border-l-pink-500',
  ASSESSMENT: 'border-l-purple-500',
  FIRST_INTERVIEW: 'border-l-violet-500',
  SECOND_INTERVIEW: 'border-l-indigo-500',
  FINAL_INTERVIEW: 'border-l-blue-500',
  REFERENCE_CHECK: 'border-l-cyan-500',
  BACKGROUND_CHECK: 'border-l-sky-500',
  OFFER: 'border-l-teal-500',
  ONBOARDING: 'border-l-emerald-500',
  COMPLETED: 'border-l-success-500',
  REJECTED: 'border-l-error-500',
  WITHDRAWN: 'border-l-neutral-500'
};

/**
 * Get Tailwind CSS classes for application stage badge.
 */
export function getApplicationStageClasses(stage: string): string {
  return APPLICATION_STAGE_TAILWIND_CLASSES[stage as ApplicationStage] ||
    'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
}

/**
 * Get Tailwind CSS border class for application stage (used in pipelines).
 */
export function getApplicationStageBorderClass(stage: string): string {
  return APPLICATION_STAGE_BORDER_CLASSES[stage as ApplicationStage] || 'border-l-neutral-500';
}

/**
 * Get journal entry status configuration with fallback
 */
export function getJournalStatusConfig(status: string): StatusConfig {
  return JOURNAL_STATUS_CONFIG[status as JournalEntryStatus] || {
    variant: 'neutral',
    translationKey: status
  };
}

/**
 * Get journal entry type configuration with fallback
 */
export function getJournalTypeConfig(type: string): StatusConfig {
  return JOURNAL_TYPE_CONFIG[type as JournalEntryType] || {
    variant: 'neutral',
    translationKey: type
  };
}

/**
 * Get fiscal period status configuration with fallback
 */
export function getPeriodStatusConfig(status: string): StatusConfig {
  return PERIOD_STATUS_CONFIG[status as FiscalPeriodStatus] || {
    variant: 'neutral',
    translationKey: status
  };
}

/**
 * Get account type configuration with fallback
 */
export function getAccountTypeConfig(type: string): AccountTypeConfig {
  return ACCOUNT_TYPE_CONFIG[type as AccountType] || {
    variant: 'neutral',
    translationKey: type,
    dotColor: 'bg-neutral-500'
  };
}

// =============================================================================
// Payroll Run Status Configuration
// =============================================================================

export type PayrollRunStatus = 'DRAFT' | 'PROCESSING' | 'PENDING_APPROVAL' | 'APPROVED' | 'PAID' | 'CANCELLED';

export const PAYROLL_RUN_STATUS_CONFIG: Record<PayrollRunStatus, StatusConfig> = {
  DRAFT: { variant: 'neutral', translationKey: 'payroll.status.draft' },
  PROCESSING: { variant: 'warning', translationKey: 'payroll.status.processing' },
  PENDING_APPROVAL: { variant: 'info', translationKey: 'payroll.status.pendingApproval' },
  APPROVED: { variant: 'success', translationKey: 'payroll.status.approved' },
  PAID: { variant: 'success', translationKey: 'payroll.status.paid' },
  CANCELLED: { variant: 'error', translationKey: 'payroll.status.cancelled' }
};

export function getPayrollRunStatusConfig(status: string): StatusConfig {
  return PAYROLL_RUN_STATUS_CONFIG[status as PayrollRunStatus] || {
    variant: 'neutral',
    translationKey: status
  };
}

// =============================================================================
// Payslip Status Configuration
// =============================================================================

export type PayslipStatus = 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'PAID' | 'EXCLUDED' | 'VOID';

export const PAYSLIP_STATUS_CONFIG: Record<PayslipStatus, StatusConfig> = {
  DRAFT: { variant: 'neutral', translationKey: 'payroll.payslipStatus.draft' },
  CALCULATED: { variant: 'warning', translationKey: 'payroll.payslipStatus.calculated' },
  APPROVED: { variant: 'success', translationKey: 'payroll.payslipStatus.approved' },
  PAID: { variant: 'success', translationKey: 'payroll.payslipStatus.paid' },
  EXCLUDED: { variant: 'neutral', translationKey: 'payroll.payslipStatus.excluded' },
  VOID: { variant: 'error', translationKey: 'payroll.payslipStatus.void' }
};

export function getPayslipStatusConfig(status: string): StatusConfig {
  return PAYSLIP_STATUS_CONFIG[status as PayslipStatus] || {
    variant: 'neutral',
    translationKey: status
  };
}

// =============================================================================
// Job Status Configuration (Recruitment)
// =============================================================================

export type JobStatus = 'DRAFT' | 'OPEN' | 'ON_HOLD' | 'CLOSED' | 'FILLED' | 'CANCELLED';

export const JOB_STATUS_CONFIG: Record<JobStatus, StatusConfig> = {
  DRAFT: { variant: 'warning', translationKey: 'recruitment.jobStatus.draft' },
  OPEN: { variant: 'success', translationKey: 'recruitment.jobStatus.open' },
  ON_HOLD: { variant: 'info', translationKey: 'recruitment.jobStatus.onHold' },
  CLOSED: { variant: 'neutral', translationKey: 'recruitment.jobStatus.closed' },
  FILLED: { variant: 'success', translationKey: 'recruitment.jobStatus.filled' },
  CANCELLED: { variant: 'error', translationKey: 'recruitment.jobStatus.cancelled' }
};

export function getJobStatusConfig(status: string): StatusConfig {
  return JOB_STATUS_CONFIG[status as JobStatus] || {
    variant: 'neutral',
    translationKey: status
  };
}

// =============================================================================
// Candidate Status Configuration (Recruitment)
// =============================================================================

export type CandidateStatus = 'ACTIVE' | 'INACTIVE' | 'HIRED' | 'BLACKLISTED' | 'ARCHIVED';

export const CANDIDATE_STATUS_CONFIG: Record<CandidateStatus, StatusConfig> = {
  ACTIVE: { variant: 'success', translationKey: 'recruitment.candidateStatus.active' },
  INACTIVE: { variant: 'neutral', translationKey: 'recruitment.candidateStatus.inactive' },
  HIRED: { variant: 'success', translationKey: 'recruitment.candidateStatus.hired' },
  BLACKLISTED: { variant: 'error', translationKey: 'recruitment.candidateStatus.blacklisted' },
  ARCHIVED: { variant: 'neutral', translationKey: 'recruitment.candidateStatus.archived' }
};

export function getCandidateStatusConfig(status: string): StatusConfig {
  return CANDIDATE_STATUS_CONFIG[status as CandidateStatus] || {
    variant: 'neutral',
    translationKey: status
  };
}

/**
 * Tailwind CSS classes for candidate status badges.
 */
export const CANDIDATE_STATUS_TAILWIND_CLASSES: Record<CandidateStatus, string> = {
  ACTIVE: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
  INACTIVE: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
  HIRED: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
  BLACKLISTED: 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400',
  ARCHIVED: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
};

/**
 * Get Tailwind CSS classes for candidate status badge.
 */
export function getCandidateStatusClasses(status: string): string {
  return CANDIDATE_STATUS_TAILWIND_CLASSES[status as CandidateStatus] ||
    'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
}

// =============================================================================
// Interview Status Configuration (Recruitment)
// =============================================================================

export type InterviewStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FEEDBACK_PENDING'
  | 'FEEDBACK_SUBMITTED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'RESCHEDULED';

export const INTERVIEW_STATUS_CONFIG: Record<InterviewStatus, StatusConfig> = {
  SCHEDULED: { variant: 'info', translationKey: 'recruitment.interviewStatus.scheduled' },
  CONFIRMED: { variant: 'success', translationKey: 'recruitment.interviewStatus.confirmed' },
  IN_PROGRESS: { variant: 'warning', translationKey: 'recruitment.interviewStatus.inProgress' },
  COMPLETED: { variant: 'success', translationKey: 'recruitment.interviewStatus.completed' },
  FEEDBACK_PENDING: { variant: 'warning', translationKey: 'recruitment.interviewStatus.feedbackPending' },
  FEEDBACK_SUBMITTED: { variant: 'info', translationKey: 'recruitment.interviewStatus.feedbackSubmitted' },
  CANCELLED: { variant: 'error', translationKey: 'recruitment.interviewStatus.cancelled' },
  NO_SHOW: { variant: 'error', translationKey: 'recruitment.interviewStatus.noShow' },
  RESCHEDULED: { variant: 'primary', translationKey: 'recruitment.interviewStatus.rescheduled' }
};

export function getInterviewStatusConfig(status: string): StatusConfig {
  return INTERVIEW_STATUS_CONFIG[status as InterviewStatus] || {
    variant: 'neutral',
    translationKey: status
  };
}

// =============================================================================
// Recommendation Configuration (Recruitment)
// =============================================================================

export type Recommendation =
  | 'STRONG_HIRE'
  | 'HIRE'
  | 'LEAN_HIRE'
  | 'NEUTRAL'
  | 'LEAN_NO_HIRE'
  | 'NO_HIRE'
  | 'STRONG_NO_HIRE';

export const RECOMMENDATION_CONFIG: Record<Recommendation, StatusConfig> = {
  STRONG_HIRE: { variant: 'success', translationKey: 'recruitment.recommendation.strongHire' },
  HIRE: { variant: 'success', translationKey: 'recruitment.recommendation.hire' },
  LEAN_HIRE: { variant: 'success', translationKey: 'recruitment.recommendation.leanHire' },
  NEUTRAL: { variant: 'warning', translationKey: 'recruitment.recommendation.neutral' },
  LEAN_NO_HIRE: { variant: 'warning', translationKey: 'recruitment.recommendation.leanNoHire' },
  NO_HIRE: { variant: 'error', translationKey: 'recruitment.recommendation.noHire' },
  STRONG_NO_HIRE: { variant: 'error', translationKey: 'recruitment.recommendation.strongNoHire' }
};

export function getRecommendationConfig(rec: string): StatusConfig {
  return RECOMMENDATION_CONFIG[rec as Recommendation] || {
    variant: 'neutral',
    translationKey: rec
  };
}

// =============================================================================
// Report Status Configuration
// =============================================================================

export type ReportStatus = 'PENDING' | 'QUEUED' | 'GENERATING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';

export const REPORT_STATUS_CONFIG: Record<ReportStatus, StatusConfig> = {
  PENDING: { variant: 'neutral', translationKey: 'reports.status.pending' },
  QUEUED: { variant: 'warning', translationKey: 'reports.status.queued' },
  GENERATING: { variant: 'info', translationKey: 'reports.status.generating' },
  COMPLETED: { variant: 'success', translationKey: 'reports.status.completed' },
  FAILED: { variant: 'error', translationKey: 'reports.status.failed' },
  CANCELLED: { variant: 'neutral', translationKey: 'reports.status.cancelled' },
  EXPIRED: { variant: 'neutral', translationKey: 'reports.status.expired' }
};

export function getReportStatusConfig(status: string): StatusConfig {
  return REPORT_STATUS_CONFIG[status as ReportStatus] || {
    variant: 'neutral',
    translationKey: status
  };
}

// =============================================================================
// Payroll Journal Status Configuration (Accounting)
// =============================================================================

export type PayrollJournalStatus = 'CREATED' | 'POSTED' | 'REVERSED' | 'FAILED';

export const PAYROLL_JOURNAL_STATUS_CONFIG: Record<PayrollJournalStatus, StatusConfig> = {
  CREATED: { variant: 'warning', translationKey: 'accounting.payrollJournalStatus.created' },
  POSTED: { variant: 'success', translationKey: 'accounting.payrollJournalStatus.posted' },
  REVERSED: { variant: 'error', translationKey: 'accounting.payrollJournalStatus.reversed' },
  FAILED: { variant: 'error', translationKey: 'accounting.payrollJournalStatus.failed' }
};

export function getPayrollJournalStatusConfig(status: string): StatusConfig {
  return PAYROLL_JOURNAL_STATUS_CONFIG[status as PayrollJournalStatus] || {
    variant: 'neutral',
    translationKey: status
  };
}

// =============================================================================
// Invoice Status Configuration
// =============================================================================

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'VOID' | 'WRITTEN_OFF';

export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, StatusConfig> = {
  DRAFT: { variant: 'neutral', translationKey: 'accounting.invoiceStatus.draft' },
  SENT: { variant: 'info', translationKey: 'accounting.invoiceStatus.sent' },
  VIEWED: { variant: 'primary', translationKey: 'accounting.invoiceStatus.viewed' },
  PARTIALLY_PAID: { variant: 'warning', translationKey: 'accounting.invoiceStatus.partiallyPaid' },
  PAID: { variant: 'success', translationKey: 'accounting.invoiceStatus.paid' },
  OVERDUE: { variant: 'error', translationKey: 'accounting.invoiceStatus.overdue' },
  VOID: { variant: 'neutral', translationKey: 'accounting.invoiceStatus.void' },
  WRITTEN_OFF: { variant: 'warning', translationKey: 'accounting.invoiceStatus.writtenOff' }
};

export function getInvoiceStatusConfig(status: string): StatusConfig {
  return INVOICE_STATUS_CONFIG[status as InvoiceStatus] || {
    variant: 'neutral',
    translationKey: status
  };
}

// =============================================================================
// VAT Report Status Configuration
// =============================================================================

export type VatReportStatus = 'DRAFT' | 'PREVIEW' | 'GENERATED' | 'SUBMITTED' | 'PAID' | 'AMENDED';

export const VAT_REPORT_STATUS_CONFIG: Record<VatReportStatus, StatusConfig> = {
  DRAFT: { variant: 'neutral', translationKey: 'accounting.vatStatus.draft' },
  PREVIEW: { variant: 'warning', translationKey: 'accounting.vatStatus.preview' },
  GENERATED: { variant: 'info', translationKey: 'accounting.vatStatus.generated' },
  SUBMITTED: { variant: 'primary', translationKey: 'accounting.vatStatus.submitted' },
  PAID: { variant: 'success', translationKey: 'accounting.vatStatus.paid' },
  AMENDED: { variant: 'warning', translationKey: 'accounting.vatStatus.amended' }
};

export function getVatReportStatusConfig(status: string): StatusConfig {
  return VAT_REPORT_STATUS_CONFIG[status as VatReportStatus] || {
    variant: 'neutral',
    translationKey: status
  };
}

// =============================================================================
// Bank Connection Status Configuration
// =============================================================================

export type BankConnectionStatus = 'PENDING' | 'ACTIVE' | 'DISCONNECTED' | 'ERROR' | 'REAUTH_REQUIRED';

export const BANK_CONNECTION_STATUS_CONFIG: Record<BankConnectionStatus, StatusConfig> = {
  PENDING: { variant: 'warning', translationKey: 'banking.connectionStatus.pending' },
  ACTIVE: { variant: 'success', translationKey: 'banking.connectionStatus.active' },
  DISCONNECTED: { variant: 'neutral', translationKey: 'banking.connectionStatus.disconnected' },
  ERROR: { variant: 'error', translationKey: 'banking.connectionStatus.error' },
  REAUTH_REQUIRED: { variant: 'warning', translationKey: 'banking.connectionStatus.reauthRequired' }
};

export function getBankConnectionStatusConfig(status: string): StatusConfig {
  return BANK_CONNECTION_STATUS_CONFIG[status as BankConnectionStatus] || {
    variant: 'neutral',
    translationKey: status
  };
}

// =============================================================================
// Reconciliation Status Configuration
// =============================================================================

export type ReconciliationStatus = 'UNRECONCILED' | 'SUGGESTED' | 'MATCHED' | 'RECONCILED' | 'EXCLUDED';

export const RECONCILIATION_STATUS_CONFIG: Record<ReconciliationStatus, StatusConfig> = {
  UNRECONCILED: { variant: 'warning', translationKey: 'banking.reconciliationStatus.unreconciled' },
  SUGGESTED: { variant: 'info', translationKey: 'banking.reconciliationStatus.suggested' },
  MATCHED: { variant: 'primary', translationKey: 'banking.reconciliationStatus.matched' },
  RECONCILED: { variant: 'success', translationKey: 'banking.reconciliationStatus.reconciled' },
  EXCLUDED: { variant: 'neutral', translationKey: 'banking.reconciliationStatus.excluded' }
};

export function getReconciliationStatusConfig(status: string): StatusConfig {
  return RECONCILIATION_STATUS_CONFIG[status as ReconciliationStatus] || {
    variant: 'neutral',
    translationKey: status
  };
}

// =============================================================================
// Variant to Hex Color Mapping
// Provides backward compatibility for components using inline styles
// =============================================================================

export interface HexColorPair {
  background: string;
  color: string;
}

/**
 * Maps badge variants to hex color pairs for inline style usage.
 * These colors are designed to work in both light and dark modes.
 */
export const VARIANT_HEX_COLORS: Record<BadgeVariant, HexColorPair> = {
  primary: { background: '#e3f2fd', color: '#1565c0' },
  success: { background: '#e8f5e9', color: '#2e7d32' },
  warning: { background: '#fff3e0', color: '#f57c00' },
  error: { background: '#ffcdd2', color: '#b71c1c' },
  neutral: { background: '#eceff1', color: '#546e7a' },
  info: { background: '#e0f7fa', color: '#00838f' }
};

/**
 * Alternative darker success variant for "completed" states
 */
export const VARIANT_HEX_COLORS_DARK: Record<BadgeVariant, HexColorPair> = {
  primary: { background: '#bbdefb', color: '#0d47a1' },
  success: { background: '#c8e6c9', color: '#1b5e20' },
  warning: { background: '#ffe0b2', color: '#e65100' },
  error: { background: '#ef9a9a', color: '#c62828' },
  neutral: { background: '#cfd8dc', color: '#37474f' },
  info: { background: '#b2ebf2', color: '#006064' }
};

/**
 * Maps variant to Tailwind CSS classes for styling.
 */
export const VARIANT_TAILWIND_CLASSES: Record<BadgeVariant, string> = {
  primary: 'text-primary-700 bg-primary-100 dark:text-primary-300 dark:bg-primary-900/30',
  success: 'text-success-700 bg-success-100 dark:text-success-300 dark:bg-success-900/30',
  warning: 'text-warning-700 bg-warning-100 dark:text-warning-300 dark:bg-warning-900/30',
  error: 'text-error-700 bg-error-100 dark:text-error-300 dark:bg-error-900/30',
  neutral: 'text-neutral-600 bg-neutral-100 dark:text-neutral-400 dark:bg-neutral-800',
  info: 'text-info-700 bg-info-100 dark:text-info-300 dark:bg-info-900/30'
};

/**
 * Get hex color pair from variant for inline styles.
 * Prefer using Tailwind classes via getVariantClasses() for dark mode support.
 */
export function getVariantHexColors(variant: BadgeVariant, dark: boolean = false): HexColorPair {
  return dark ? VARIANT_HEX_COLORS_DARK[variant] : VARIANT_HEX_COLORS[variant];
}

/**
 * Get Tailwind CSS classes for a variant.
 * Recommended for proper dark mode support.
 */
export function getVariantClasses(variant: BadgeVariant): string {
  return VARIANT_TAILWIND_CLASSES[variant];
}

/**
 * Get hex colors for a status config.
 * Useful for backward compatibility with components using inline styles.
 */
export function getStatusHexColors(config: StatusConfig, dark: boolean = false): HexColorPair {
  return getVariantHexColors(config.variant, dark);
}
