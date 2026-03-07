import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { environment } from '@env/environment';

export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  fullName: string;
  email: string;
  phone: string;
  idNumber: string;
  passportNumber?: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  address: {
    streetAddress?: string;
    suburb?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  hireDate: string;
  terminationDate?: string;
  status: EmploymentStatus;
  employmentType: string;
  department?: { id: string; code: string; name: string };
  jobTitle?: { id: string; code: string; title: string };
  manager?: { id: string; employeeNumber: string; fullName: string };
  basicSalary: number;
  payFrequency: string;
  taxNumber?: string;
  taxStatus: string;
  banking: {
    bankName?: string;
    accountNumber?: string;
    branchCode?: string;
    accountType?: string;
  };
  emergencyContact: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeListItem {
  id: string;
  employeeNumber: string;
  fullName: string;
  email: string;
  phone: string;
  departmentName?: string;
  jobTitle?: string;
  status: EmploymentStatus;
  hireDate: string;
}

export type EmploymentStatus = 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED' | 'RETIRED';

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone: string;
  idNumber: string;
  passportNumber?: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus?: string;
  streetAddress?: string;
  suburb?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  hireDate: string;
  employmentType: string;
  departmentId?: string;
  jobTitleId?: string;
  managerId?: string;
  basicSalary: number;
  payFrequency?: string;
  taxNumber?: string;
  taxStatus?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankBranchCode?: string;
  bankAccountType?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface JobTitle {
  id: string;
  code: string;
  title: string;
  level: string;
}

/**
 * Service for employee API operations.
 */
@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/v1/employees`;
  private readonly departmentsUrl = `${environment.apiUrl}/api/v1/departments`;

  // Cached observables for frequently accessed static data
  private departmentsCache$?: Observable<Department[]>;
  private jobTitlesCache$?: Observable<JobTitle[]>;

  /**
   * Search employees with pagination.
   */
  searchEmployees(
    page: number = 0,
    size: number = 20,
    status?: EmploymentStatus,
    departmentId?: string,
    search?: string
  ): Observable<PageResponse<EmployeeListItem>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) {
      params = params.set('status', status);
    }
    if (departmentId) {
      params = params.set('departmentId', departmentId);
    }
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PageResponse<EmployeeListItem>>(this.apiUrl, { params });
  }

  /**
   * Get active employees.
   */
  getActiveEmployees(): Observable<EmployeeListItem[]> {
    return this.http.get<EmployeeListItem[]>(`${this.apiUrl}/active`);
  }

  /**
   * Get employee by ID.
   */
  getEmployee(id: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get employee by employee number.
   */
  getEmployeeByNumber(employeeNumber: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/number/${employeeNumber}`);
  }

  /**
   * Create new employee.
   */
  createEmployee(request: CreateEmployeeRequest): Observable<Employee> {
    return this.http.post<Employee>(this.apiUrl, request);
  }

  /**
   * Update employee.
   */
  updateEmployee(id: string, request: Partial<CreateEmployeeRequest>): Observable<Employee> {
    return this.http.patch<Employee>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Terminate employee.
   */
  terminateEmployee(id: string, terminationDate: string, reason: string): Observable<Employee> {
    return this.http.post<Employee>(
      `${this.apiUrl}/${id}/terminate`,
      null,
      { params: { terminationDate, reason } }
    );
  }

  /**
   * Reactivate employee.
   */
  reactivateEmployee(id: string): Observable<Employee> {
    return this.http.post<Employee>(`${this.apiUrl}/${id}/reactivate`, null);
  }

  /**
   * Get employee count.
   */
  getEmployeeCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/count`);
  }

  /**
   * Get all departments (cached).
   */
  getDepartments(): Observable<Department[]> {
    if (!this.departmentsCache$) {
      this.departmentsCache$ = this.http.get<Department[]>(this.departmentsUrl).pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.departmentsCache$;
  }

  /**
   * Get job titles (cached).
   */
  getJobTitles(): Observable<JobTitle[]> {
    if (!this.jobTitlesCache$) {
      this.jobTitlesCache$ = this.http.get<JobTitle[]>(`${environment.apiUrl}/api/v1/job-titles`).pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.jobTitlesCache$;
  }

  /**
   * Clear cached data (use when departments/job titles are modified).
   */
  clearCache(): void {
    this.departmentsCache$ = undefined;
    this.jobTitlesCache$ = undefined;
  }
}
