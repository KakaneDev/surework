import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { map, catchError, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { environment } from '@env/environment';

export interface SearchResult {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
}

export type SearchCategory = 'employees' | 'candidates' | 'jobs' | 'documents' | 'invoices' | 'payrollRuns';

export interface SearchState {
  results: SearchResult[];
  loading: boolean;
  query: string;
  error: string | null;
}

interface EmployeeSearchResult {
  id: string;
  fullName: string;
  email: string;
  departmentName?: string;
  jobTitle?: string;
}

interface CandidateSearchResult {
  id: string;
  fullName: string;
  email: string;
  currentJobTitle?: string;
}

interface JobSearchResult {
  id: string;
  title: string;
  departmentName?: string;
  status: string;
}

interface InvoiceSearchResult {
  id: string;
  invoiceNumber: string;
  customerName: string;
  status: string;
  total: number;
}

interface PayrollRunSearchResult {
  id: string;
  periodYear: number;
  periodMonth: number;
  status: string;
  totalNet: number;
}

interface DocumentSearchResult {
  id: string;
  name: string;
  categoryName: string;
  ownerName?: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
}

const CATEGORY_CONFIG: Record<SearchCategory, { icon: string; routePrefix: string }> = {
  employees: { icon: 'person', routePrefix: '/employees' },
  candidates: { icon: 'person_search', routePrefix: '/recruitment/candidates' },
  jobs: { icon: 'work', routePrefix: '/recruitment/jobs' },
  documents: { icon: 'description', routePrefix: '/documents' },
  invoices: { icon: 'receipt', routePrefix: '/accounting/invoicing' },
  payrollRuns: { icon: 'payments', routePrefix: '/payroll/runs' }
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

@Injectable({
  providedIn: 'root'
})
export class GlobalSearchService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private readonly initialState: SearchState = {
    results: [],
    loading: false,
    query: '',
    error: null
  };

  private stateSubject = new BehaviorSubject<SearchState>(this.initialState);
  state$ = this.stateSubject.asObservable();

  private searchSubject = new BehaviorSubject<string>('');

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(query => {
        if (query.trim().length < 2) {
          this.stateSubject.next({ ...this.initialState, query });
          return;
        }
        this.stateSubject.next({
          ...this.stateSubject.value,
          loading: true,
          query,
          error: null
        });
      }),
      switchMap(query => {
        if (query.trim().length < 2) {
          return of([]);
        }
        return this.executeSearch(query);
      })
    ).subscribe(results => {
      const currentState = this.stateSubject.value;
      if (currentState.query.trim().length >= 2) {
        this.stateSubject.next({
          ...currentState,
          results,
          loading: false
        });
      }
    });
  }

  search(query: string): void {
    this.searchSubject.next(query);
  }

  clearSearch(): void {
    this.searchSubject.next('');
    this.stateSubject.next(this.initialState);
  }

  private executeSearch(query: string): Observable<SearchResult[]> {
    const trimmedQuery = query.trim();

    return forkJoin({
      employees: this.searchEmployees(trimmedQuery),
      candidates: this.searchCandidates(trimmedQuery),
      jobs: this.searchJobs(trimmedQuery),
      documents: this.searchDocuments(trimmedQuery),
      invoices: this.searchInvoices(trimmedQuery),
      payrollRuns: this.searchPayrollRuns(trimmedQuery)
    }).pipe(
      map(results => {
        const allResults: SearchResult[] = [
          ...results.employees,
          ...results.candidates,
          ...results.jobs,
          ...results.documents,
          ...results.invoices,
          ...results.payrollRuns
        ];
        return allResults;
      }),
      catchError(error => {
        console.error('Global search error:', error);
        this.stateSubject.next({
          ...this.stateSubject.value,
          loading: false,
          error: 'Search failed. Please try again.'
        });
        return of([]);
      })
    );
  }

  private searchEmployees(query: string): Observable<SearchResult[]> {
    const params = new HttpParams()
      .set('page', '0')
      .set('size', '5')
      .set('search', query);

    return this.http.get<PageResponse<EmployeeSearchResult>>(
      `${this.apiUrl}/api/v1/employees`,
      { params }
    ).pipe(
      map(response => response.content.map(emp => this.mapEmployee(emp))),
      catchError(() => of([]))
    );
  }

  private searchCandidates(query: string): Observable<SearchResult[]> {
    const params = new HttpParams()
      .set('page', '0')
      .set('size', '5')
      .set('searchTerm', query);

    return this.http.get<PageResponse<CandidateSearchResult>>(
      `${this.apiUrl}/api/recruitment/candidates`,
      { params }
    ).pipe(
      map(response => response.content.map(candidate => this.mapCandidate(candidate))),
      catchError(() => of([]))
    );
  }

  private searchJobs(query: string): Observable<SearchResult[]> {
    const params = new HttpParams()
      .set('page', '0')
      .set('size', '5')
      .set('searchTerm', query);

    return this.http.get<PageResponse<JobSearchResult>>(
      `${this.apiUrl}/api/recruitment/jobs`,
      { params }
    ).pipe(
      map(response => response.content.map(job => this.mapJob(job))),
      catchError(() => of([]))
    );
  }

  private searchDocuments(query: string): Observable<SearchResult[]> {
    return this.http.get<DocumentSearchResult[]>(
      `${this.apiUrl}/api/documents`
    ).pipe(
      map(documents => {
        const lowerQuery = query.toLowerCase();
        return documents
          .filter(doc =>
            doc.name.toLowerCase().includes(lowerQuery) ||
            doc.categoryName?.toLowerCase().includes(lowerQuery) ||
            doc.ownerName?.toLowerCase().includes(lowerQuery)
          )
          .slice(0, 5)
          .map(doc => this.mapDocument(doc));
      }),
      catchError(() => of([]))
    );
  }

  private searchInvoices(query: string): Observable<SearchResult[]> {
    const params = new HttpParams()
      .set('page', '0')
      .set('size', '5')
      .set('searchTerm', query);

    return this.http.get<PageResponse<InvoiceSearchResult>>(
      `/api/v1/accounting/invoices`,
      { params }
    ).pipe(
      map(response => response.content.map(invoice => this.mapInvoice(invoice))),
      catchError(() => of([]))
    );
  }

  private searchPayrollRuns(query: string): Observable<SearchResult[]> {
    return this.http.get<PageResponse<PayrollRunSearchResult>>(
      `${this.apiUrl}/api/v1/payroll/runs`,
      { params: new HttpParams().set('page', '0').set('size', '10') }
    ).pipe(
      map(response => {
        const lowerQuery = query.toLowerCase();
        return response.content
          .filter(run => {
            const monthName = MONTH_NAMES[run.periodMonth - 1]?.toLowerCase() || '';
            const yearStr = run.periodYear.toString();
            const periodLabel = `${monthName} ${yearStr}`;
            return periodLabel.includes(lowerQuery) ||
                   run.status.toLowerCase().includes(lowerQuery);
          })
          .slice(0, 5)
          .map(run => this.mapPayrollRun(run));
      }),
      catchError(() => of([]))
    );
  }

  private mapEmployee(emp: EmployeeSearchResult): SearchResult {
    const config = CATEGORY_CONFIG.employees;
    return {
      id: emp.id,
      category: 'employees',
      title: emp.fullName,
      subtitle: [emp.jobTitle, emp.departmentName].filter(Boolean).join(' · ') || emp.email,
      icon: config.icon,
      route: `${config.routePrefix}/${emp.id}`
    };
  }

  private mapCandidate(candidate: CandidateSearchResult): SearchResult {
    const config = CATEGORY_CONFIG.candidates;
    return {
      id: candidate.id,
      category: 'candidates',
      title: candidate.fullName,
      subtitle: candidate.currentJobTitle || candidate.email,
      icon: config.icon,
      route: `${config.routePrefix}/${candidate.id}`
    };
  }

  private mapJob(job: JobSearchResult): SearchResult {
    const config = CATEGORY_CONFIG.jobs;
    return {
      id: job.id,
      category: 'jobs',
      title: job.title,
      subtitle: [job.departmentName, job.status].filter(Boolean).join(' · '),
      icon: config.icon,
      route: `${config.routePrefix}/${job.id}`
    };
  }

  private mapDocument(doc: DocumentSearchResult): SearchResult {
    const config = CATEGORY_CONFIG.documents;
    return {
      id: doc.id,
      category: 'documents',
      title: doc.name,
      subtitle: [doc.categoryName, doc.ownerName].filter(Boolean).join(' · '),
      icon: config.icon,
      route: `${config.routePrefix}/${doc.id}`
    };
  }

  private mapInvoice(invoice: InvoiceSearchResult): SearchResult {
    const config = CATEGORY_CONFIG.invoices;
    const formattedTotal = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(invoice.total);
    return {
      id: invoice.id,
      category: 'invoices',
      title: invoice.invoiceNumber,
      subtitle: `${invoice.customerName} · ${formattedTotal}`,
      icon: config.icon,
      route: `${config.routePrefix}/${invoice.id}`
    };
  }

  private mapPayrollRun(run: PayrollRunSearchResult): SearchResult {
    const config = CATEGORY_CONFIG.payrollRuns;
    const monthName = MONTH_NAMES[run.periodMonth - 1] || '';
    const formattedNet = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(run.totalNet);
    return {
      id: run.id,
      category: 'payrollRuns',
      title: `${monthName} ${run.periodYear}`,
      subtitle: `${run.status} · ${formattedNet}`,
      icon: config.icon,
      route: `${config.routePrefix}/${run.id}`
    };
  }

  getResultsByCategory(results: SearchResult[]): Map<SearchCategory, SearchResult[]> {
    const grouped = new Map<SearchCategory, SearchResult[]>();
    for (const result of results) {
      const existing = grouped.get(result.category) || [];
      existing.push(result);
      grouped.set(result.category, existing);
    }
    return grouped;
  }

  getCategoryLabel(category: SearchCategory): string {
    const labels: Record<SearchCategory, string> = {
      employees: 'Employees',
      candidates: 'Candidates',
      jobs: 'Jobs',
      documents: 'Documents',
      invoices: 'Invoices',
      payrollRuns: 'Payroll Runs'
    };
    return labels[category];
  }
}
