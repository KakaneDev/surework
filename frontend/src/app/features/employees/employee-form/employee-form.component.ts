import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EmployeeService, Department, JobTitle, Employee, EmployeeListItem } from '@core/services/employee.service';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatStepperModule,
  ],
  template: `
    <div class="employee-form-container">
      <div class="header">
        <button mat-icon-button routerLink="/employees">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ isEditMode() ? 'Edit Employee' : 'Add New Employee' }}</h1>
      </div>

      <form [formGroup]="employeeForm" (ngSubmit)="onSubmit()">
        <mat-stepper linear #stepper>
          <!-- Personal Information -->
          <mat-step [stepControl]="employeeForm">
            <ng-template matStepLabel>Personal Information</ng-template>
            <mat-card>
              <mat-card-content>
                <div class="form-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>First Name</mat-label>
                    <input matInput formControlName="firstName">
                    @if (employeeForm.get('firstName')?.hasError('required')) {
                      <mat-error>First name is required</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Middle Name</mat-label>
                    <input matInput formControlName="middleName">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Last Name</mat-label>
                    <input matInput formControlName="lastName">
                    @if (employeeForm.get('lastName')?.hasError('required')) {
                      <mat-error>Last name is required</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Email</mat-label>
                    <input matInput type="email" formControlName="email">
                    @if (employeeForm.get('email')?.hasError('required')) {
                      <mat-error>Email is required</mat-error>
                    }
                    @if (employeeForm.get('email')?.hasError('email')) {
                      <mat-error>Invalid email format</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Phone</mat-label>
                    <input matInput formControlName="phone" placeholder="+27123456789">
                    @if (employeeForm.get('phone')?.hasError('required')) {
                      <mat-error>Phone is required</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>ID Number</mat-label>
                    <input matInput formControlName="idNumber" maxlength="13">
                    @if (employeeForm.get('idNumber')?.hasError('required')) {
                      <mat-error>ID number is required</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Date of Birth</mat-label>
                    <input matInput [matDatepicker]="dobPicker" formControlName="dateOfBirth">
                    <mat-datepicker-toggle matIconSuffix [for]="dobPicker"></mat-datepicker-toggle>
                    <mat-datepicker #dobPicker></mat-datepicker>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Gender</mat-label>
                    <mat-select formControlName="gender">
                      <mat-option value="MALE">Male</mat-option>
                      <mat-option value="FEMALE">Female</mat-option>
                      <mat-option value="OTHER">Other</mat-option>
                      <mat-option value="PREFER_NOT_TO_SAY">Prefer not to say</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Marital Status</mat-label>
                    <mat-select formControlName="maritalStatus">
                      <mat-option value="SINGLE">Single</mat-option>
                      <mat-option value="MARRIED">Married</mat-option>
                      <mat-option value="DIVORCED">Divorced</mat-option>
                      <mat-option value="WIDOWED">Widowed</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
              </mat-card-content>
              <mat-card-actions align="end">
                <button mat-button matStepperNext type="button">Next</button>
              </mat-card-actions>
            </mat-card>
          </mat-step>

          <!-- Employment Details -->
          <mat-step>
            <ng-template matStepLabel>Employment Details</ng-template>
            <mat-card>
              <mat-card-content>
                <div class="form-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>Hire Date</mat-label>
                    <input matInput [matDatepicker]="hirePicker" formControlName="hireDate">
                    <mat-datepicker-toggle matIconSuffix [for]="hirePicker"></mat-datepicker-toggle>
                    <mat-datepicker #hirePicker></mat-datepicker>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Employment Type</mat-label>
                    <mat-select formControlName="employmentType">
                      <mat-option value="PERMANENT">Permanent</mat-option>
                      <mat-option value="CONTRACT">Contract</mat-option>
                      <mat-option value="TEMPORARY">Temporary</mat-option>
                      <mat-option value="PART_TIME">Part Time</mat-option>
                      <mat-option value="INTERN">Intern</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Department</mat-label>
                    <mat-select formControlName="departmentId">
                      @for (dept of departments(); track dept.id) {
                        <mat-option [value]="dept.id">{{ dept.name }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Job Title</mat-label>
                    <mat-select formControlName="jobTitleId">
                      @for (jt of jobTitles(); track jt.id) {
                        <mat-option [value]="jt.id">{{ jt.title }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Manager</mat-label>
                    <mat-select formControlName="managerId">
                      <mat-option [value]="null">None</mat-option>
                      @for (emp of managers(); track emp.id) {
                        <mat-option [value]="emp.id">{{ emp.fullName }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                </div>
              </mat-card-content>
              <mat-card-actions align="end">
                <button mat-button matStepperPrevious type="button">Back</button>
                <button mat-button matStepperNext type="button">Next</button>
              </mat-card-actions>
            </mat-card>
          </mat-step>

          <!-- Compensation -->
          <mat-step>
            <ng-template matStepLabel>Compensation</ng-template>
            <mat-card>
              <mat-card-content>
                <div class="form-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>Basic Salary (ZAR)</mat-label>
                    <input matInput type="number" formControlName="basicSalary">
                    <span matTextPrefix>R&nbsp;</span>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Pay Frequency</mat-label>
                    <mat-select formControlName="payFrequency">
                      <mat-option value="MONTHLY">Monthly</mat-option>
                      <mat-option value="FORTNIGHTLY">Fortnightly</mat-option>
                      <mat-option value="WEEKLY">Weekly</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Tax Number</mat-label>
                    <input matInput formControlName="taxNumber">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Bank Name</mat-label>
                    <input matInput formControlName="bankName">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Account Number</mat-label>
                    <input matInput formControlName="bankAccountNumber">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Branch Code</mat-label>
                    <input matInput formControlName="bankBranchCode">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Account Type</mat-label>
                    <mat-select formControlName="bankAccountType">
                      <mat-option value="SAVINGS">Savings</mat-option>
                      <mat-option value="CHEQUE">Cheque</mat-option>
                      <mat-option value="TRANSMISSION">Transmission</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
              </mat-card-content>
              <mat-card-actions align="end">
                <button mat-button matStepperPrevious type="button">Back</button>
                <button mat-button matStepperNext type="button">Next</button>
              </mat-card-actions>
            </mat-card>
          </mat-step>

          <!-- Emergency Contact -->
          <mat-step>
            <ng-template matStepLabel>Emergency Contact</ng-template>
            <mat-card>
              <mat-card-content>
                <div class="form-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>Contact Name</mat-label>
                    <input matInput formControlName="emergencyContactName">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Contact Phone</mat-label>
                    <input matInput formControlName="emergencyContactPhone">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Relationship</mat-label>
                    <input matInput formControlName="emergencyContactRelationship" placeholder="e.g., Spouse, Parent">
                  </mat-form-field>
                </div>
              </mat-card-content>
              <mat-card-actions align="end">
                <button mat-button matStepperPrevious type="button">Back</button>
                <button mat-raised-button color="primary" type="submit" [disabled]="submitting()">
                  @if (submitting()) {
                    <mat-spinner diameter="20"></mat-spinner>
                  } @else {
                    {{ isEditMode() ? 'Save Changes' : 'Create Employee' }}
                  }
                </button>
              </mat-card-actions>
            </mat-card>
          </mat-step>
        </mat-stepper>
      </form>
    </div>
  `,
  styles: [`
    .employee-form-container {
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;

      h1 {
        margin: 0;
      }
    }

    mat-card {
      margin-top: 16px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 16px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly employeeService = inject(EmployeeService);

  isEditMode = signal(false);
  submitting = signal(false);
  departments = signal<Department[]>([]);
  jobTitles = signal<JobTitle[]>([]);
  managers = signal<EmployeeListItem[]>([]);

  private employeeId: string | null = null;

  employeeForm = this.fb.group({
    firstName: ['', Validators.required],
    middleName: [''],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    idNumber: ['', Validators.required],
    dateOfBirth: [null as Date | null, Validators.required],
    gender: ['', Validators.required],
    maritalStatus: ['SINGLE'],
    hireDate: [null as Date | null, Validators.required],
    employmentType: ['PERMANENT', Validators.required],
    departmentId: [null as string | null],
    jobTitleId: [null as string | null],
    managerId: [null as string | null],
    basicSalary: [0, [Validators.required, Validators.min(0.01)]],
    payFrequency: ['MONTHLY'],
    taxNumber: [''],
    bankName: [''],
    bankAccountNumber: [''],
    bankBranchCode: [''],
    bankAccountType: ['SAVINGS'],
    emergencyContactName: [''],
    emergencyContactPhone: [''],
    emergencyContactRelationship: [''],
  });

  ngOnInit(): void {
    this.loadReferenceData();

    this.employeeId = this.route.snapshot.paramMap.get('id');
    if (this.employeeId) {
      this.isEditMode.set(true);
      this.loadEmployee(this.employeeId);
    }
  }

  loadReferenceData(): void {
    this.employeeService.getDepartments().subscribe(depts => this.departments.set(depts));
    this.employeeService.getJobTitles().subscribe(jts => this.jobTitles.set(jts));
    this.employeeService.getActiveEmployees().subscribe(emps => this.managers.set(emps));
  }

  loadEmployee(id: string): void {
    this.employeeService.getEmployee(id).subscribe(employee => {
      this.employeeForm.patchValue({
        firstName: employee.firstName,
        middleName: employee.middleName || '',
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        idNumber: employee.idNumber,
        dateOfBirth: new Date(employee.dateOfBirth),
        gender: employee.gender,
        maritalStatus: employee.maritalStatus,
        hireDate: new Date(employee.hireDate),
        employmentType: employee.employmentType,
        departmentId: employee.department?.id || null,
        jobTitleId: employee.jobTitle?.id || null,
        managerId: employee.manager?.id || null,
        basicSalary: employee.basicSalary,
        payFrequency: employee.payFrequency,
        taxNumber: employee.taxNumber || '',
        bankName: employee.banking.bankName || '',
        bankAccountNumber: '',
        bankBranchCode: employee.banking.branchCode || '',
        bankAccountType: employee.banking.accountType || 'SAVINGS',
        emergencyContactName: employee.emergencyContact.name || '',
        emergencyContactPhone: employee.emergencyContact.phone || '',
        emergencyContactRelationship: employee.emergencyContact.relationship || '',
      });
    });
  }

  onSubmit(): void {
    if (this.employeeForm.invalid) {
      return;
    }

    this.submitting.set(true);
    const formValue = this.employeeForm.value;

    const request = {
      ...formValue,
      dateOfBirth: formValue.dateOfBirth ? this.formatDate(formValue.dateOfBirth) : '',
      hireDate: formValue.hireDate ? this.formatDate(formValue.hireDate) : '',
    };

    const action$ = this.isEditMode() && this.employeeId
      ? this.employeeService.updateEmployee(this.employeeId, request as any)
      : this.employeeService.createEmployee(request as any);

    action$.subscribe({
      next: (employee) => {
        this.snackBar.open(
          this.isEditMode() ? 'Employee updated successfully' : 'Employee created successfully',
          'Dismiss',
          { duration: 3000 }
        );
        this.router.navigate(['/employees', employee.id]);
      },
      error: () => {
        this.submitting.set(false);
      }
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
