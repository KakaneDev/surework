import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpParams, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

/** Days before expiry to consider a document as "expiring soon" */
const EXPIRING_SOON_DAYS = 30;

export type DocumentCategory =
  | 'EMPLOYMENT_CONTRACT'
  | 'OFFER_LETTER'
  | 'TERMINATION_LETTER'
  | 'RESIGNATION_LETTER'
  | 'IRP5'
  | 'TAX_NUMBER'
  | 'UIF_DECLARATION'
  | 'PAYSLIP'
  | 'BANK_CONFIRMATION'
  | 'SALARY_REVIEW'
  | 'ID_DOCUMENT'
  | 'PASSPORT'
  | 'WORK_PERMIT'
  | 'PROOF_OF_ADDRESS'
  | 'QUALIFICATION'
  | 'CERTIFICATION'
  | 'TRAINING_CERTIFICATE'
  | 'CV'
  | 'MEDICAL_CERTIFICATE'
  | 'LEAVE_FORM'
  | 'DISCIPLINARY'
  | 'WARNING_LETTER'
  | 'PERFORMANCE_REVIEW'
  | 'SKILLS_ASSESSMENT'
  | 'POLICY_DOCUMENT'
  | 'PROCEDURE'
  | 'TEMPLATE'
  | 'COMPANY_REGISTRATION'
  | 'INVOICE'
  | 'RECEIPT'
  | 'QUOTATION'
  | 'STATEMENT'
  | 'OTHER';

export type DocumentStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';
export type OwnerType = 'EMPLOYEE' | 'COMPANY' | 'DEPARTMENT' | 'CANDIDATE';
export type DocumentVisibility = 'PRIVATE' | 'RESTRICTED' | 'DEPARTMENT' | 'COMPANY' | 'PUBLIC';

export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  category: DocumentCategory;
  fileName: string;
  fileExtension?: string;
  contentType?: string;
  fileSize: number;
  formattedFileSize: string;
  templateType: 'WORD' | 'PDF' | 'EXCEL';
  createdAt: string;
}

export interface DocumentDashboard {
  totalFiles: number;
  activeFiles: number;
  expiringFiles: number;
  confidentialFiles: number;
}

export interface CategoryGroup {
  name: string;
  categories: { value: DocumentCategory; label: string; icon: string }[];
}

export interface EmployeeDocument {
  id: string;
  documentReference: string;
  name: string;
  description?: string;
  category: DocumentCategory;
  categoryName: string;
  ownerType: OwnerType;
  ownerId: string;
  ownerName?: string;
  visibility: DocumentVisibility;
  currentVersion: number;
  fileName: string;
  fileExtension?: string;
  contentType?: string;
  fileSize: number;
  formattedFileSize: string;
  status: DocumentStatus;
  validFrom?: string;
  validUntil?: string;
  expired: boolean;
  confidential: boolean;
  uploadedBy?: string;
  uploadedByName?: string;
  uploadedAt: string;
  createdAt: string;
}

export interface UploadDocumentRequest {
  name: string;
  description?: string;
  category: DocumentCategory;
  ownerType: OwnerType;
  ownerId: string;
  ownerName?: string;
  visibility?: DocumentVisibility;
  validFrom?: string;
  validUntil?: string;
  confidential?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/documents`;

  /**
   * Get all documents for an employee.
   */
  getEmployeeDocuments(employeeId: string): Observable<EmployeeDocument[]> {
    return this.http.get<EmployeeDocument[]>(`${this.apiUrl}/owner/EMPLOYEE/${employeeId}`);
  }

  /**
   * Get all documents for a candidate.
   */
  getCandidateDocuments(candidateId: string): Observable<EmployeeDocument[]> {
    return this.http.get<EmployeeDocument[]>(`${this.apiUrl}/owner/CANDIDATE/${candidateId}`);
  }

  /**
   * Get documents by category for an employee.
   */
  getEmployeeDocumentsByCategory(employeeId: string, category: DocumentCategory): Observable<EmployeeDocument[]> {
    return this.http.get<EmployeeDocument[]>(`${this.apiUrl}/owner/EMPLOYEE/${employeeId}/category/${category}`);
  }

  /**
   * Upload a document.
   */
  uploadDocument(file: File, metadata: UploadDocumentRequest, uploaderId: string): Observable<HttpEvent<EmployeeDocument>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));

    const req = new HttpRequest('POST', `${this.apiUrl}?uploaderId=${uploaderId}`, formData, {
      reportProgress: true
    });

    return this.http.request<EmployeeDocument>(req);
  }

  /**
   * Download a document.
   */
  downloadDocument(documentId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${documentId}/download`, {
      responseType: 'blob'
    });
  }

  /**
   * Delete a document.
   */
  deleteDocument(documentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${documentId}`);
  }

  /**
   * Archive a document.
   */
  archiveDocument(documentId: string): Observable<EmployeeDocument> {
    return this.http.post<EmployeeDocument>(`${this.apiUrl}/${documentId}/archive`, null);
  }

  /**
   * Get company-wide documents.
   */
  getCompanyDocuments(tenantId: string): Observable<EmployeeDocument[]> {
    return this.http.get<EmployeeDocument[]>(`${this.apiUrl}/owner/COMPANY/${tenantId}`);
  }

  /**
   * Get all documents with optional filters.
   * Uses HttpParams for proper URL encoding.
   */
  searchDocuments(params: {
    category?: DocumentCategory;
    status?: DocumentStatus;
    visibility?: DocumentVisibility;
  } = {}): Observable<EmployeeDocument[]> {
    let httpParams = new HttpParams();
    if (params.category) {
      httpParams = httpParams.set('category', params.category);
    }
    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params.visibility) {
      httpParams = httpParams.set('visibility', params.visibility);
    }
    return this.http.get<EmployeeDocument[]>(this.apiUrl, { params: httpParams });
  }

  /**
   * Get document templates.
   */
  getTemplates(): Observable<DocumentTemplate[]> {
    return this.http.get<DocumentTemplate[]>(`${this.apiUrl}/templates`);
  }

  /**
   * Download a template.
   */
  downloadTemplate(templateId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/templates/${templateId}/download`, {
      responseType: 'blob'
    });
  }

  /**
   * Get document dashboard statistics.
   */
  getDashboard(): Observable<DocumentDashboard> {
    return this.http.get<DocumentDashboard>(`${this.apiUrl}/dashboard`);
  }

  /**
   * Get suggested visibility based on category.
   */
  static getSuggestedVisibility(category: DocumentCategory): DocumentVisibility {
    const companyVisibility: DocumentCategory[] = ['POLICY_DOCUMENT', 'PROCEDURE', 'TEMPLATE'];
    const privateVisibility: DocumentCategory[] = [
      'ID_DOCUMENT', 'PASSPORT', 'MEDICAL_CERTIFICATE', 'BANK_CONFIRMATION',
      'TAX_NUMBER', 'IRP5', 'PAYSLIP'
    ];
    const restrictedVisibility: DocumentCategory[] = [
      'DISCIPLINARY', 'WARNING_LETTER', 'PERFORMANCE_REVIEW', 'SALARY_REVIEW'
    ];

    if (companyVisibility.includes(category)) return 'COMPANY';
    if (privateVisibility.includes(category)) return 'PRIVATE';
    if (restrictedVisibility.includes(category)) return 'RESTRICTED';
    return 'PRIVATE';
  }

  /**
   * Get category groups for organized display.
   */
  static getCategoryGroups(): CategoryGroup[] {
    return [
      {
        name: 'Employment',
        categories: [
          { value: 'EMPLOYMENT_CONTRACT', label: 'Employment Contract', icon: 'description' },
          { value: 'OFFER_LETTER', label: 'Offer Letter', icon: 'mail' },
          { value: 'TERMINATION_LETTER', label: 'Termination Letter', icon: 'cancel' },
          { value: 'RESIGNATION_LETTER', label: 'Resignation Letter', icon: 'exit_to_app' }
        ]
      },
      {
        name: 'Tax & Payroll',
        categories: [
          { value: 'IRP5', label: 'IRP5 Tax Certificate', icon: 'receipt_long' },
          { value: 'TAX_NUMBER', label: 'Tax Number', icon: 'tag' },
          { value: 'UIF_DECLARATION', label: 'UIF Declaration', icon: 'assignment' },
          { value: 'PAYSLIP', label: 'Payslip', icon: 'payments' },
          { value: 'BANK_CONFIRMATION', label: 'Bank Confirmation', icon: 'account_balance' },
          { value: 'SALARY_REVIEW', label: 'Salary Review', icon: 'trending_up' }
        ]
      },
      {
        name: 'Personal ID',
        categories: [
          { value: 'ID_DOCUMENT', label: 'ID Document', icon: 'badge' },
          { value: 'PASSPORT', label: 'Passport', icon: 'public' },
          { value: 'WORK_PERMIT', label: 'Work Permit', icon: 'work' },
          { value: 'PROOF_OF_ADDRESS', label: 'Proof of Address', icon: 'home' }
        ]
      },
      {
        name: 'Qualifications',
        categories: [
          { value: 'QUALIFICATION', label: 'Qualification', icon: 'school' },
          { value: 'CERTIFICATION', label: 'Certification', icon: 'verified' },
          { value: 'TRAINING_CERTIFICATE', label: 'Training Certificate', icon: 'military_tech' },
          { value: 'CV', label: 'CV/Resume', icon: 'person' }
        ]
      },
      {
        name: 'HR / Disciplinary',
        categories: [
          { value: 'MEDICAL_CERTIFICATE', label: 'Medical Certificate', icon: 'medical_services' },
          { value: 'LEAVE_FORM', label: 'Leave Form', icon: 'event_available' },
          { value: 'DISCIPLINARY', label: 'Disciplinary Record', icon: 'gavel' },
          { value: 'WARNING_LETTER', label: 'Warning Letter', icon: 'warning' },
          { value: 'PERFORMANCE_REVIEW', label: 'Performance Review', icon: 'assessment' },
          { value: 'SKILLS_ASSESSMENT', label: 'Skills Assessment', icon: 'psychology' }
        ]
      },
      {
        name: 'Company',
        categories: [
          { value: 'POLICY_DOCUMENT', label: 'Policy Document', icon: 'policy' },
          { value: 'PROCEDURE', label: 'Procedure', icon: 'list_alt' },
          { value: 'TEMPLATE', label: 'Template', icon: 'article' },
          { value: 'COMPANY_REGISTRATION', label: 'Company Registration', icon: 'business' }
        ]
      },
      {
        name: 'Financial',
        categories: [
          { value: 'INVOICE', label: 'Invoice', icon: 'receipt' },
          { value: 'RECEIPT', label: 'Receipt', icon: 'receipt_long' },
          { value: 'QUOTATION', label: 'Quotation', icon: 'request_quote' },
          { value: 'STATEMENT', label: 'Statement', icon: 'summarize' }
        ]
      },
      {
        name: 'Other',
        categories: [
          { value: 'OTHER', label: 'Other', icon: 'folder' }
        ]
      }
    ];
  }

  /**
   * Get visibility label.
   */
  static getVisibilityLabel(visibility: DocumentVisibility): string {
    const labels: Record<DocumentVisibility, string> = {
      PRIVATE: 'Private (Only me)',
      RESTRICTED: 'Restricted (HR & Managers)',
      DEPARTMENT: 'Department',
      COMPANY: 'Company-wide',
      PUBLIC: 'Public'
    };
    return labels[visibility] || visibility;
  }

  /**
   * Get human-readable category label.
   */
  static getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      EMPLOYMENT_CONTRACT: 'Employment Contract',
      OFFER_LETTER: 'Offer Letter',
      TERMINATION_LETTER: 'Termination Letter',
      RESIGNATION_LETTER: 'Resignation Letter',
      IRP5: 'IRP5 Tax Certificate',
      TAX_NUMBER: 'Tax Number',
      UIF_DECLARATION: 'UIF Declaration',
      PAYSLIP: 'Payslip',
      BANK_CONFIRMATION: 'Bank Confirmation',
      SALARY_REVIEW: 'Salary Review',
      ID_DOCUMENT: 'ID Document',
      PASSPORT: 'Passport',
      WORK_PERMIT: 'Work Permit',
      PROOF_OF_ADDRESS: 'Proof of Address',
      QUALIFICATION: 'Qualification',
      CERTIFICATION: 'Certification',
      TRAINING_CERTIFICATE: 'Training Certificate',
      CV: 'CV/Resume',
      MEDICAL_CERTIFICATE: 'Medical Certificate',
      LEAVE_FORM: 'Leave Form',
      DISCIPLINARY: 'Disciplinary Record',
      WARNING_LETTER: 'Warning Letter',
      PERFORMANCE_REVIEW: 'Performance Review',
      SKILLS_ASSESSMENT: 'Skills Assessment',
      POLICY_DOCUMENT: 'Policy Document',
      PROCEDURE: 'Procedure',
      TEMPLATE: 'Template',
      COMPANY_REGISTRATION: 'Company Registration',
      INVOICE: 'Invoice',
      RECEIPT: 'Receipt',
      QUOTATION: 'Quotation',
      STATEMENT: 'Statement',
      OTHER: 'Other'
    };
    return labels[category] || category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  /**
   * Get icon for category.
   */
  static getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      EMPLOYMENT_CONTRACT: 'description',
      OFFER_LETTER: 'mail',
      TERMINATION_LETTER: 'cancel',
      RESIGNATION_LETTER: 'exit_to_app',
      IRP5: 'receipt_long',
      TAX_NUMBER: 'tag',
      UIF_DECLARATION: 'assignment',
      PAYSLIP: 'payments',
      BANK_CONFIRMATION: 'account_balance',
      SALARY_REVIEW: 'trending_up',
      ID_DOCUMENT: 'badge',
      PASSPORT: 'public',
      WORK_PERMIT: 'work',
      PROOF_OF_ADDRESS: 'home',
      QUALIFICATION: 'school',
      CERTIFICATION: 'verified',
      TRAINING_CERTIFICATE: 'military_tech',
      CV: 'person',
      MEDICAL_CERTIFICATE: 'medical_services',
      LEAVE_FORM: 'event_available',
      DISCIPLINARY: 'gavel',
      WARNING_LETTER: 'warning',
      PERFORMANCE_REVIEW: 'assessment',
      SKILLS_ASSESSMENT: 'psychology',
      POLICY_DOCUMENT: 'policy',
      PROCEDURE: 'list_alt',
      TEMPLATE: 'article',
      COMPANY_REGISTRATION: 'business',
      INVOICE: 'receipt',
      RECEIPT: 'receipt_long',
      QUOTATION: 'request_quote',
      STATEMENT: 'summarize',
      OTHER: 'folder'
    };
    return icons[category] || 'insert_drive_file';
  }

  /**
   * Check if a document is expiring within the next 30 days.
   * Returns false if the document has no validUntil date or is already expired.
   */
  static isExpiringSoon(doc: EmployeeDocument): boolean {
    if (!doc.validUntil || doc.expired) return false;
    const expiry = new Date(doc.validUntil);
    const now = new Date();
    const thresholdDate = new Date(now.getTime() + EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000);
    return expiry <= thresholdDate && expiry > now;
  }

  /**
   * Get Tailwind color classes for a document category.
   * Returns background and text color classes for both light and dark modes.
   */
  static getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      // Employment
      EMPLOYMENT_CONTRACT: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      OFFER_LETTER: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      TERMINATION_LETTER: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      RESIGNATION_LETTER: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
      // Tax & Payroll
      IRP5: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      TAX_NUMBER: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      UIF_DECLARATION: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      PAYSLIP: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      BANK_CONFIRMATION: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
      SALARY_REVIEW: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      // Personal ID
      ID_DOCUMENT: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
      PASSPORT: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
      WORK_PERMIT: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
      PROOF_OF_ADDRESS: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
      // Qualifications
      QUALIFICATION: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      CERTIFICATION: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      TRAINING_CERTIFICATE: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      CV: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
      // HR / Disciplinary
      MEDICAL_CERTIFICATE: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
      LEAVE_FORM: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400',
      DISCIPLINARY: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      WARNING_LETTER: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
      PERFORMANCE_REVIEW: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
      SKILLS_ASSESSMENT: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
      // Company
      POLICY_DOCUMENT: 'bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400',
      PROCEDURE: 'bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400',
      TEMPLATE: 'bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400',
      COMPANY_REGISTRATION: 'bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400',
      // Financial
      INVOICE: 'bg-lime-100 dark:bg-lime-900/30 text-lime-600 dark:text-lime-400',
      RECEIPT: 'bg-lime-100 dark:bg-lime-900/30 text-lime-600 dark:text-lime-400',
      QUOTATION: 'bg-lime-100 dark:bg-lime-900/30 text-lime-600 dark:text-lime-400',
      STATEMENT: 'bg-lime-100 dark:bg-lime-900/30 text-lime-600 dark:text-lime-400'
    };
    return colors[category] || 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400';
  }

  /**
   * Format file size in human-readable format.
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file extension from filename (uppercase, max 4 chars).
   */
  static getFileExtension(fileName: string): string {
    const ext = fileName.split('.').pop()?.toUpperCase() || '';
    return ext.length > 4 ? ext.substring(0, 4) : ext;
  }
}
