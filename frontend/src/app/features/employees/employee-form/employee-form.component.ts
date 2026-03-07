import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EmployeeService, Department, JobTitle, Employee, EmployeeListItem } from '@core/services/employee.service';
import { SpinnerComponent } from '@shared/ui';
import { ToastService } from '@shared/ui';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    TranslateModule,
    SpinnerComponent,
  ],
  template: `
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- Header -->
      <div class="flex items-center gap-4">
        <a routerLink="/employees" class="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-elevated transition-colors" [attr.aria-label]="'common.back' | translate">
          <span class="material-icons text-neutral-500" aria-hidden="true">arrow_back</span>
        </a>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">{{ isEditMode() ? ('employees.form.editTitle' | translate) : ('employees.form.addTitle' | translate) }}</h1>
      </div>

      <!-- Step Indicator -->
      <div class="flex items-center justify-between bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-4">
        @for (step of steps; track step.id; let i = $index) {
          <div class="flex items-center" [class.flex-1]="i < steps.length - 1">
            <button type="button" (click)="currentStep.set(i)" class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors"
                   [class.bg-primary-500]="i <= currentStep()"
                   [class.text-white]="i <= currentStep()"
                   [class.bg-neutral-200]="i > currentStep()"
                   [class.dark:bg-dark-border]="i > currentStep()"
                   [class.text-neutral-500]="i > currentStep()">
                {{ i + 1 }}
              </div>
              <span class="hidden sm:inline text-sm font-medium"
                    [class.text-primary-500]="i <= currentStep()"
                    [class.text-neutral-500]="i > currentStep()">
                {{ step.label }}
              </span>
            </button>
            @if (i < steps.length - 1) {
              <div class="flex-1 h-0.5 mx-4" [class.bg-primary-500]="i < currentStep()" [class.bg-neutral-200]="i >= currentStep()" [class.dark:bg-dark-border]="i >= currentStep()"></div>
            }
          </div>
        }
      </div>

      <form [formGroup]="employeeForm" (ngSubmit)="onSubmit()">
        <!-- Step 1: Personal Information -->
        @if (currentStep() === 0) {
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
            <h2 class="text-lg font-semibold text-neutral-900 dark:text-white mb-6">{{ 'employees.form.sections.personalInfo' | translate }}</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label class="sw-label">{{ 'employees.form.labels.firstName' | translate }} *</label>
                <input type="text" formControlName="firstName" class="sw-input" [class.sw-input-error]="employeeForm.get('firstName')?.invalid && employeeForm.get('firstName')?.touched" />
                @if (employeeForm.get('firstName')?.hasError('required') && employeeForm.get('firstName')?.touched) {
                  <p class="sw-error-text">{{ 'employees.form.validation.firstNameRequired' | translate }}</p>
                }
              </div>
              <div>
                <label class="sw-label">{{ 'employees.form.labels.middleName' | translate }}</label>
                <input type="text" formControlName="middleName" class="sw-input" />
              </div>
              <div>
                <label class="sw-label">{{ 'employees.form.labels.lastName' | translate }} *</label>
                <input type="text" formControlName="lastName" class="sw-input" [class.sw-input-error]="employeeForm.get('lastName')?.invalid && employeeForm.get('lastName')?.touched" />
                @if (employeeForm.get('lastName')?.hasError('required') && employeeForm.get('lastName')?.touched) {
                  <p class="sw-error-text">{{ 'employees.form.validation.lastNameRequired' | translate }}</p>
                }
              </div>
              <div>
                <label class="sw-label">{{ 'employees.form.labels.email' | translate }} *</label>
                <input type="email" formControlName="email" class="sw-input" [class.sw-input-error]="employeeForm.get('email')?.invalid && employeeForm.get('email')?.touched" />
                @if (employeeForm.get('email')?.hasError('required') && employeeForm.get('email')?.touched) {
                  <p class="sw-error-text">{{ 'employees.form.validation.emailRequired' | translate }}</p>
                }
                @if (employeeForm.get('email')?.hasError('email') && employeeForm.get('email')?.touched) {
                  <p class="sw-error-text">{{ 'employees.form.validation.invalidEmail' | translate }}</p>
                }
              </div>
              <div>
                <label class="sw-label">{{ 'employees.form.labels.phone' | translate }} *</label>
                <input type="tel" formControlName="phone" placeholder="+27123456789" class="sw-input" [class.sw-input-error]="employeeForm.get('phone')?.invalid && employeeForm.get('phone')?.touched" />
                @if (employeeForm.get('phone')?.hasError('required') && employeeForm.get('phone')?.touched) {
                  <p class="sw-error-text">{{ 'employees.form.validation.phoneRequired' | translate }}</p>
                }
              </div>
              <div>
                <label class="sw-label">{{ 'employees.form.labels.idNumber' | translate }} *</label>
                <input type="text" formControlName="idNumber" maxlength="13" class="sw-input font-mono" [class.sw-input-error]="employeeForm.get('idNumber')?.invalid && employeeForm.get('idNumber')?.touched" />
                @if (employeeForm.get('idNumber')?.hasError('required') && employeeForm.get('idNumber')?.touched) {
                  <p class="sw-error-text">{{ 'employees.form.validation.idNumberRequired' | translate }}</p>
                }
              </div>
              <div>
                <label class="sw-label">{{ 'employees.form.labels.dateOfBirth' | translate }} *</label>
                <input type="date" formControlName="dateOfBirth" class="sw-input" />
              </div>
              <div>
                <label class="sw-label">{{ 'employees.form.labels.gender' | translate }} *</label>
                <select formControlName="gender" class="sw-input">
                  <option value="">{{ 'employees.form.placeholders.selectGender' | translate }}</option>
                  <option value="MALE">{{ 'employees.form.options.gender.male' | translate }}</option>
                  <option value="FEMALE">{{ 'employees.form.options.gender.female' | translate }}</option>
                  <option value="OTHER">{{ 'employees.form.options.gender.other' | translate }}</option>
                  <option value="PREFER_NOT_TO_SAY">{{ 'employees.form.options.gender.preferNotToSay' | translate }}</option>
                </select>
              </div>
              <div>
                <label class="sw-label">{{ 'employees.form.labels.maritalStatus' | translate }}</label>
                <select formControlName="maritalStatus" class="sw-input">
                  <option value="SINGLE">{{ 'employees.form.options.maritalStatus.single' | translate }}</option>
                  <option value="MARRIED">{{ 'employees.form.options.maritalStatus.married' | translate }}</option>
                  <option value="DIVORCED">{{ 'employees.form.options.maritalStatus.divorced' | translate }}</option>
                  <option value="WIDOWED">{{ 'employees.form.options.maritalStatus.widowed' | translate }}</option>
                </select>
              </div>
            </div>
            <div class="flex justify-end mt-6">
              <button type="button" (click)="nextStep()" class="sw-btn sw-btn-primary sw-btn-md">
                {{ 'employees.form.buttons.next' | translate }}
              </button>
            </div>
          </div>
        }

        <!-- Step 2: Employment Details -->
        @if (currentStep() === 1) {
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
            <h2 class="text-lg font-semibold text-neutral-900 dark:text-white mb-6">{{ 'employees.form.sections.employmentDetails' | translate }}</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label class="sw-label">{{ 'employees.form.labels.hireDate' | translate }} *</label>
                <input type="date" formControlName="hireDate" class="sw-input" />
              </div>
              <div>
                <label class="sw-label">{{ 'employees.form.labels.employmentType' | translate }} *</label>
                <select formControlName="employmentType" class="sw-input">
                  <option value="PERMANENT">{{ 'employees.form.options.employmentType.permanent' | translate }}</option>
                  <option value="CONTRACT">{{ 'employees.form.options.employmentType.contract' | translate }}</option>
                  <option value="TEMPORARY">{{ 'employees.form.options.employmentType.temporary' | translate }}</option>
                  <option value="PART_TIME">{{ 'employees.form.options.employmentType.partTime' | translate }}</option>
                  <option value="INTERN">{{ 'employees.form.options.employmentType.intern' | translate }}</option>
                </select>
              </div>
              <div>
                <label class="sw-label">{{ 'employees.form.labels.department' | translate }}</label>
                <select formControlName="departmentId" class="sw-input">
                  <option [ngValue]="null">{{ 'employees.form.placeholders.selectDepartment' | translate }}</option>
                  @for (dept of departments(); track dept.id) {
                    <option [ngValue]="dept.id">{{ dept.name }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="sw-label">{{ 'employees.form.labels.jobTitle' | translate }}</label>
                <select formControlName="jobTitleId" class="sw-input">
                  <option [ngValue]="null">{{ 'employees.form.placeholders.selectJobTitle' | translate }}</option>
                  @for (jt of jobTitles(); track jt.id) {
                    <option [ngValue]="jt.id">{{ jt.title }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="sw-label">{{ 'employees.form.labels.manager' | translate }}</label>
                <select formControlName="managerId" class="sw-input">
                  <option [ngValue]="null">{{ 'employees.form.placeholders.selectManager' | translate }}</option>
                  @for (emp of managers(); track emp.id) {
                    <option [ngValue]="emp.id">{{ emp.fullName }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="flex justify-between mt-6">
              <button type="button" (click)="prevStep()" class="sw-btn sw-btn-outline sw-btn-md">
                {{ 'employees.form.buttons.back' | translate }}
              </button>
              <button type="button" (click)="nextStep()" class="sw-btn sw-btn-primary sw-btn-md">
                {{ 'employees.form.buttons.next' | translate }}
              </button>
            </div>
          </div>
        }

        <!-- Step 3: Compensation -->
        @if (currentStep() === 2) {
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
            <h2 class="text-lg font-semibold text-neutral-900 dark:text-white mb-6">{{ 'employees.form.sections.compensation' | translate }}</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label class="sw-label">{{ 'employees.form.labels.basicSalary' | translate }} *</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">R</span>
                  <input type="number" formControlName="basicSalary" class="sw-input pl-8" />
                </div>
              </div>
              <div>
                <label class="sw-label">{{ 'employees.form.labels.payFrequency' | translate }}</label>
                <select formControlName="payFrequency" class="sw-input">
                  <option value="MONTHLY">{{ 'employees.form.options.payFrequency.monthly' | translate }}</option>
                  <option value="FORTNIGHTLY">{{ 'employees.form.options.payFrequency.fortnightly' | translate }}</option>
                  <option value="WEEKLY">{{ 'employees.form.options.payFrequency.weekly' | translate }}</option>
                </select>
              </div>
              <div>
                <label class="sw-label">{{ 'employees.form.labels.taxNumber' | translate }}</label>
                <input type="text" formControlName="taxNumber" class="sw-input font-mono" />
              </div>
              <div>
                <label class="sw-label">{{ 'employees.form.labels.bankName' | translate }}</label>
                <input type="text" formControlName="bankName" class="sw-input" />
              </div>
              <div>
                <label class="sw-label">{{ 'employees.form.labels.accountNumber' | translate }}</label>
                <input type="text" formControlName="bankAccountNumber" class="sw-input font-mono" />
              </div>
              <div>
                <label class="sw-label">{{ 'employees.form.labels.branchCode' | translate }}</label>
                <input type="text" formControlName="bankBranchCode" class="sw-input font-mono" />
              </div>
              <div>
                <label class="sw-label">{{ 'employees.form.labels.accountType' | translate }}</label>
                <select formControlName="bankAccountType" class="sw-input">
                  <option value="SAVINGS">{{ 'employees.form.options.accountType.savings' | translate }}</option>
                  <option value="CHEQUE">{{ 'employees.form.options.accountType.cheque' | translate }}</option>
                  <option value="TRANSMISSION">{{ 'employees.form.options.accountType.transmission' | translate }}</option>
                </select>
              </div>
            </div>
            <div class="flex justify-between mt-6">
              <button type="button" (click)="prevStep()" class="sw-btn sw-btn-outline sw-btn-md">
                {{ 'employees.form.buttons.back' | translate }}
              </button>
              <button type="button" (click)="nextStep()" class="sw-btn sw-btn-primary sw-btn-md">
                {{ 'employees.form.buttons.next' | translate }}
              </button>
            </div>
          </div>
        }

        <!-- Step 4: Emergency Contact -->
        @if (currentStep() === 3) {
          <div class="bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-200 dark:border-dark-border p-6">
            <h2 class="text-lg font-semibold text-neutral-900 dark:text-white mb-6">{{ 'employees.form.sections.emergencyContact' | translate }}</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label class="sw-label">{{ 'employees.form.labels.contactName' | translate }}</label>
                <input type="text" formControlName="emergencyContactName" class="sw-input" />
              </div>
              <div>
                <label class="sw-label">{{ 'employees.form.labels.contactPhone' | translate }}</label>
                <input type="tel" formControlName="emergencyContactPhone" class="sw-input" />
              </div>
              <div>
                <label class="sw-label">{{ 'employees.form.labels.relationship' | translate }}</label>
                <input type="text" formControlName="emergencyContactRelationship" [placeholder]="'employees.form.placeholders.relationshipExample' | translate" class="sw-input" />
              </div>
            </div>
            <div class="flex justify-between mt-6">
              <button type="button" (click)="prevStep()" class="sw-btn sw-btn-outline sw-btn-md">
                {{ 'employees.form.buttons.back' | translate }}
              </button>
              <button type="submit" [disabled]="submitting()" class="sw-btn sw-btn-primary sw-btn-md">
                @if (submitting()) {
                  <sw-spinner size="sm" color="white" />
                }
                {{ isEditMode() ? ('employees.form.buttons.saveChanges' | translate) : ('employees.form.buttons.createEmployee' | translate) }}
              </button>
            </div>
          </div>
        }
      </form>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly employeeService = inject(EmployeeService);

  isEditMode = signal(false);
  submitting = signal(false);
  currentStep = signal(0);
  departments = signal<Department[]>([]);
  jobTitles = signal<JobTitle[]>([]);
  managers = signal<EmployeeListItem[]>([]);

  steps = [
    { id: 0, label: 'Personal' },
    { id: 1, label: 'Employment' },
    { id: 2, label: 'Compensation' },
    { id: 3, label: 'Emergency' }
  ];

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
        dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth) : null,
        gender: employee.gender,
        maritalStatus: employee.maritalStatus,
        hireDate: employee.hireDate ? new Date(employee.hireDate) : null,
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

  nextStep(): void {
    if (this.currentStep() < this.steps.length - 1) {
      this.currentStep.update(v => v + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update(v => v - 1);
    }
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
        this.toast.success(this.isEditMode() ? 'Employee updated successfully' : 'Employee created successfully');
        this.router.navigate(['/employees', employee.id]);
      },
      error: () => {
        this.submitting.set(false);
        this.toast.error('Failed to save employee');
      }
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
