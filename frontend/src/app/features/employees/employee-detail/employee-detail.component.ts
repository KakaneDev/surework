import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EmployeeService, Employee } from '@core/services/employee.service';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  template: `
    @if (loading()) {
      <div class="loading-container">
        <mat-spinner></mat-spinner>
      </div>
    } @else if (employee(); as emp) {
      <div class="employee-detail">
        <div class="header">
          <div class="header-content">
            <button mat-icon-button routerLink="/employees">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <div class="employee-info">
              <h1>{{ emp.fullName }}</h1>
              <p class="subtitle">{{ emp.employeeNumber }} · {{ emp.jobTitle?.title || 'No Job Title' }}</p>
            </div>
            <mat-chip [class]="'status-' + emp.status.toLowerCase()">{{ emp.status }}</mat-chip>
          </div>
          <div class="header-actions">
            <button mat-stroked-button [routerLink]="['edit']">
              <mat-icon>edit</mat-icon>
              Edit
            </button>
          </div>
        </div>

        <mat-tab-group>
          <mat-tab label="Overview">
            <div class="tab-content">
              <div class="cards-grid">
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Personal Information</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <dl class="info-list">
                      <div>
                        <dt>Full Name</dt>
                        <dd>{{ emp.fullName }}</dd>
                      </div>
                      <div>
                        <dt>Email</dt>
                        <dd>{{ emp.email }}</dd>
                      </div>
                      <div>
                        <dt>Phone</dt>
                        <dd>{{ emp.phone }}</dd>
                      </div>
                      <div>
                        <dt>ID Number</dt>
                        <dd>{{ emp.idNumber }}</dd>
                      </div>
                      <div>
                        <dt>Date of Birth</dt>
                        <dd>{{ emp.dateOfBirth | date:'mediumDate' }}</dd>
                      </div>
                      <div>
                        <dt>Gender</dt>
                        <dd>{{ emp.gender }}</dd>
                      </div>
                      <div>
                        <dt>Marital Status</dt>
                        <dd>{{ emp.maritalStatus }}</dd>
                      </div>
                    </dl>
                  </mat-card-content>
                </mat-card>

                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Employment Details</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <dl class="info-list">
                      <div>
                        <dt>Employee Number</dt>
                        <dd>{{ emp.employeeNumber }}</dd>
                      </div>
                      <div>
                        <dt>Department</dt>
                        <dd>{{ emp.department?.name || '-' }}</dd>
                      </div>
                      <div>
                        <dt>Job Title</dt>
                        <dd>{{ emp.jobTitle?.title || '-' }}</dd>
                      </div>
                      <div>
                        <dt>Manager</dt>
                        <dd>{{ emp.manager?.fullName || '-' }}</dd>
                      </div>
                      <div>
                        <dt>Employment Type</dt>
                        <dd>{{ emp.employmentType }}</dd>
                      </div>
                      <div>
                        <dt>Hire Date</dt>
                        <dd>{{ emp.hireDate | date:'mediumDate' }}</dd>
                      </div>
                      @if (emp.terminationDate) {
                        <div>
                          <dt>Termination Date</dt>
                          <dd>{{ emp.terminationDate | date:'mediumDate' }}</dd>
                        </div>
                      }
                    </dl>
                  </mat-card-content>
                </mat-card>

                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Address</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <dl class="info-list">
                      <div>
                        <dt>Street Address</dt>
                        <dd>{{ emp.address.streetAddress || '-' }}</dd>
                      </div>
                      <div>
                        <dt>Suburb</dt>
                        <dd>{{ emp.address.suburb || '-' }}</dd>
                      </div>
                      <div>
                        <dt>City</dt>
                        <dd>{{ emp.address.city || '-' }}</dd>
                      </div>
                      <div>
                        <dt>Province</dt>
                        <dd>{{ emp.address.province || '-' }}</dd>
                      </div>
                      <div>
                        <dt>Postal Code</dt>
                        <dd>{{ emp.address.postalCode || '-' }}</dd>
                      </div>
                    </dl>
                  </mat-card-content>
                </mat-card>

                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Emergency Contact</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <dl class="info-list">
                      <div>
                        <dt>Name</dt>
                        <dd>{{ emp.emergencyContact.name || '-' }}</dd>
                      </div>
                      <div>
                        <dt>Phone</dt>
                        <dd>{{ emp.emergencyContact.phone || '-' }}</dd>
                      </div>
                      <div>
                        <dt>Relationship</dt>
                        <dd>{{ emp.emergencyContact.relationship || '-' }}</dd>
                      </div>
                    </dl>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Compensation">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Salary Information</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <dl class="info-list">
                    <div>
                      <dt>Basic Salary</dt>
                      <dd class="salary">R {{ emp.basicSalary | number:'1.2-2' }}</dd>
                    </div>
                    <div>
                      <dt>Pay Frequency</dt>
                      <dd>{{ emp.payFrequency }}</dd>
                    </div>
                    <div>
                      <dt>Tax Number</dt>
                      <dd>{{ emp.taxNumber || '-' }}</dd>
                    </div>
                    <div>
                      <dt>Tax Status</dt>
                      <dd>{{ emp.taxStatus }}</dd>
                    </div>
                  </dl>
                </mat-card-content>
              </mat-card>

              <mat-card class="mt-3">
                <mat-card-header>
                  <mat-card-title>Banking Details</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <dl class="info-list">
                    <div>
                      <dt>Bank Name</dt>
                      <dd>{{ emp.banking.bankName || '-' }}</dd>
                    </div>
                    <div>
                      <dt>Account Number</dt>
                      <dd>{{ emp.banking.accountNumber || '-' }}</dd>
                    </div>
                    <div>
                      <dt>Branch Code</dt>
                      <dd>{{ emp.banking.branchCode || '-' }}</dd>
                    </div>
                    <div>
                      <dt>Account Type</dt>
                      <dd>{{ emp.banking.accountType || '-' }}</dd>
                    </div>
                  </dl>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <mat-tab label="Leave">
            <div class="tab-content">
              <p class="text-muted">Leave balance and history - Coming soon</p>
            </div>
          </mat-tab>

          <mat-tab label="Documents">
            <div class="tab-content">
              <p class="text-muted">Employee documents - Coming soon</p>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    }
  `,
  styles: [`
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .employee-detail {
      padding: 24px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .employee-info {
      h1 {
        margin: 0;
        font-size: 24px;
      }

      .subtitle {
        margin: 4px 0 0;
        color: #666;
      }
    }

    .tab-content {
      padding: 24px 0;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 24px;
    }

    .info-list {
      margin: 0;

      > div {
        display: flex;
        padding: 8px 0;
        border-bottom: 1px solid #eee;

        &:last-child {
          border-bottom: none;
        }
      }

      dt {
        width: 140px;
        color: #666;
        font-weight: 500;
      }

      dd {
        flex: 1;
        margin: 0;
      }
    }

    .salary {
      font-size: 20px;
      font-weight: 500;
      color: #1a73e8;
    }

    .status-active {
      background: #e8f5e9 !important;
      color: #2e7d32 !important;
    }

    .status-terminated {
      background: #eceff1 !important;
      color: #546e7a !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly employeeService = inject(EmployeeService);

  employee = signal<Employee | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEmployee(id);
    }
  }

  loadEmployee(id: string): void {
    this.loading.set(true);
    this.employeeService.getEmployee(id).subscribe({
      next: (employee) => {
        this.employee.set(employee);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
