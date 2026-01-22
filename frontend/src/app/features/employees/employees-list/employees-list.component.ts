import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { EmployeeService, EmployeeListItem, EmploymentStatus, Department } from '@core/services/employee.service';

@Component({
  selector: 'app-employees-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatMenuModule,
  ],
  template: `
    <div class="employees-container">
      <div class="page-header">
        <h1>Employees</h1>
        <button mat-raised-button color="primary" routerLink="new">
          <mat-icon>add</mat-icon>
          Add Employee
        </button>
      </div>

      <!-- Filters -->
      <div class="filters">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search</mat-label>
          <input matInput [formControl]="searchControl" placeholder="Name, email, or employee number">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [formControl]="statusControl">
            <mat-option [value]="null">All</mat-option>
            <mat-option value="ACTIVE">Active</mat-option>
            <mat-option value="ON_LEAVE">On Leave</mat-option>
            <mat-option value="SUSPENDED">Suspended</mat-option>
            <mat-option value="TERMINATED">Terminated</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Department</mat-label>
          <mat-select [formControl]="departmentControl">
            <mat-option [value]="null">All</mat-option>
            <mat-option *ngFor="let dept of departments" [value]="dept.id">{{ dept.name }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Table -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner></mat-spinner>
      </div>

      <div *ngIf="!loading" class="table-container">
        <table mat-table [dataSource]="employees" class="employees-table">
          <ng-container matColumnDef="employeeNumber">
            <th mat-header-cell *matHeaderCellDef>Employee #</th>
            <td mat-cell *matCellDef="let employee">{{ employee.employeeNumber }}</td>
          </ng-container>

          <ng-container matColumnDef="fullName">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let employee">
              <a [routerLink]="[employee.id]" class="employee-link">{{ employee.fullName }}</a>
            </td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let employee">{{ employee.email }}</td>
          </ng-container>

          <ng-container matColumnDef="departmentName">
            <th mat-header-cell *matHeaderCellDef>Department</th>
            <td mat-cell *matCellDef="let employee">{{ employee.departmentName || '-' }}</td>
          </ng-container>

          <ng-container matColumnDef="jobTitle">
            <th mat-header-cell *matHeaderCellDef>Job Title</th>
            <td mat-cell *matCellDef="let employee">{{ employee.jobTitle || '-' }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let employee">
              <mat-chip [class]="'status-' + employee.status.toLowerCase()">
                {{ employee.status }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="hireDate">
            <th mat-header-cell *matHeaderCellDef>Hire Date</th>
            <td mat-cell *matCellDef="let employee">{{ employee.hireDate | date:'mediumDate' }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let employee">
              <button mat-icon-button [matMenuTriggerFor]="menu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <a mat-menu-item [routerLink]="[employee.id]">
                  <mat-icon>visibility</mat-icon>
                  <span>View</span>
                </a>
                <a mat-menu-item [routerLink]="[employee.id, 'edit']">
                  <mat-icon>edit</mat-icon>
                  <span>Edit</span>
                </a>
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell no-data" [attr.colspan]="displayedColumns.length">
              No employees found
            </td>
          </tr>
        </table>

        <mat-paginator
          [length]="totalElements"
          [pageSize]="pageSize"
          [pageIndex]="pageIndex"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPageChange($event)"
          showFirstLastButtons>
        </mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .employees-container {
      padding: 24px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      h1 {
        margin: 0;
      }
    }

    .filters {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .search-field {
      flex: 1;
      min-width: 250px;
    }

    .table-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .employees-table {
      width: 100%;
    }

    .employee-link {
      color: #1a73e8;
      font-weight: 500;
    }

    .status-active {
      background: #e8f5e9 !important;
      color: #2e7d32 !important;
    }

    .status-on_leave {
      background: #fff3e0 !important;
      color: #f57c00 !important;
    }

    .status-suspended {
      background: #fce4ec !important;
      color: #c62828 !important;
    }

    .status-terminated {
      background: #eceff1 !important;
      color: #546e7a !important;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .no-data {
      text-align: center;
      padding: 24px;
      color: #666;
    }
  `]
})
export class EmployeesListComponent implements OnInit {
  private readonly employeeService = inject(EmployeeService);

  displayedColumns = ['employeeNumber', 'fullName', 'email', 'departmentName', 'jobTitle', 'status', 'hireDate', 'actions'];

  employees: EmployeeListItem[] = [];
  departments: Department[] = [];
  loading = true;
  totalElements = 0;
  pageIndex = 0;
  pageSize = 20;

  searchControl = new FormControl('');
  statusControl = new FormControl<EmploymentStatus | null>(null);
  departmentControl = new FormControl<string | null>(null);

  ngOnInit(): void {
    this.loadDepartments();
    this.loadEmployees();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => this.loadEmployees());

    this.statusControl.valueChanges.subscribe(() => this.loadEmployees());
    this.departmentControl.valueChanges.subscribe(() => this.loadEmployees());
  }

  loadEmployees(): void {
    this.loading = true;
    this.employeeService.searchEmployees(
      this.pageIndex,
      this.pageSize,
      this.statusControl.value ?? undefined,
      this.departmentControl.value ?? undefined,
      this.searchControl.value ?? undefined
    ).subscribe({
      next: (response) => {
        this.employees = response.content;
        this.totalElements = response.totalElements;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadDepartments(): void {
    this.employeeService.getDepartments().subscribe({
      next: (departments) => {
        this.departments = departments;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadEmployees();
  }
}
