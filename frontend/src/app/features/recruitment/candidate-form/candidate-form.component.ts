import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import {
  RecruitmentService,
  Candidate,
  CreateCandidateRequest,
  UpdateCandidateRequest,
  Gender
} from '../../../core/services/recruitment.service';

@Component({
  selector: 'app-candidate-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  template: `
    <div class="candidate-form-container">
      <header class="form-header">
        <div class="header-left">
          <a [routerLink]="isEditMode() ? ['/recruitment/candidates', candidateId()] : '/recruitment/candidates'" class="back-link">
            <mat-icon>arrow_back</mat-icon>
          </a>
          <h1>{{ isEditMode() ? 'Edit Candidate' : 'Add Candidate' }}</h1>
        </div>
      </header>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <mat-card>
            <mat-card-content>
              <!-- Personal Information -->
              <section class="form-section">
                <h3>Personal Information</h3>
                <div class="form-row two-cols">
                  <mat-form-field appearance="outline">
                    <mat-label>First Name</mat-label>
                    <input matInput formControlName="firstName">
                    @if (form.get('firstName')?.hasError('required')) {
                      <mat-error>First name is required</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Last Name</mat-label>
                    <input matInput formControlName="lastName">
                    @if (form.get('lastName')?.hasError('required')) {
                      <mat-error>Last name is required</mat-error>
                    }
                  </mat-form-field>
                </div>

                <div class="form-row two-cols">
                  <mat-form-field appearance="outline">
                    <mat-label>Email</mat-label>
                    <input matInput type="email" formControlName="email">
                    @if (form.get('email')?.hasError('required')) {
                      <mat-error>Email is required</mat-error>
                    }
                    @if (form.get('email')?.hasError('email')) {
                      <mat-error>Invalid email format</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Phone</mat-label>
                    <input matInput formControlName="phone" placeholder="+27 XX XXX XXXX">
                  </mat-form-field>
                </div>

                <div class="form-row two-cols">
                  <mat-form-field appearance="outline">
                    <mat-label>ID Number</mat-label>
                    <input matInput formControlName="idNumber">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Date of Birth</mat-label>
                    <input matInput [matDatepicker]="dobPicker" formControlName="dateOfBirth">
                    <mat-datepicker-toggle matIconSuffix [for]="dobPicker"></mat-datepicker-toggle>
                    <mat-datepicker #dobPicker></mat-datepicker>
                  </mat-form-field>
                </div>

                <div class="form-row two-cols">
                  <mat-form-field appearance="outline">
                    <mat-label>Gender</mat-label>
                    <mat-select formControlName="gender">
                      <mat-option value="">Prefer not to say</mat-option>
                      <mat-option value="MALE">Male</mat-option>
                      <mat-option value="FEMALE">Female</mat-option>
                      <mat-option value="OTHER">Other</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Nationality</mat-label>
                    <input matInput formControlName="nationality" placeholder="e.g. South African">
                  </mat-form-field>
                </div>
              </section>

              <mat-divider></mat-divider>

              <!-- Address -->
              <section class="form-section">
                <h3>Address</h3>
                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Address Line 1</mat-label>
                    <input matInput formControlName="addressLine1">
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Address Line 2</mat-label>
                    <input matInput formControlName="addressLine2">
                  </mat-form-field>
                </div>

                <div class="form-row three-cols">
                  <mat-form-field appearance="outline">
                    <mat-label>City</mat-label>
                    <input matInput formControlName="city">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Province</mat-label>
                    <input matInput formControlName="province">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Postal Code</mat-label>
                    <input matInput formControlName="postalCode">
                  </mat-form-field>
                </div>
              </section>

              <mat-divider></mat-divider>

              <!-- Professional Information -->
              <section class="form-section">
                <h3>Professional Information</h3>
                <div class="form-row two-cols">
                  <mat-form-field appearance="outline">
                    <mat-label>Current Job Title</mat-label>
                    <input matInput formControlName="currentJobTitle">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Current Employer</mat-label>
                    <input matInput formControlName="currentEmployer">
                  </mat-form-field>
                </div>

                <div class="form-row two-cols">
                  <mat-form-field appearance="outline">
                    <mat-label>Years of Experience</mat-label>
                    <input matInput type="number" formControlName="yearsExperience" min="0">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Highest Qualification</mat-label>
                    <input matInput formControlName="highestQualification" placeholder="e.g. Bachelor's Degree">
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Field of Study</mat-label>
                    <input matInput formControlName="fieldOfStudy" placeholder="e.g. Computer Science">
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Skills</mat-label>
                    <textarea matInput formControlName="skills" rows="3"
                              placeholder="List relevant skills (e.g. Java, Python, Project Management)"></textarea>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Languages</mat-label>
                    <input matInput formControlName="languages" placeholder="e.g. English (Fluent), Afrikaans (Conversational)">
                  </mat-form-field>
                </div>
              </section>

              <mat-divider></mat-divider>

              <!-- Preferences -->
              <section class="form-section">
                <h3>Preferences</h3>
                <div class="form-row two-cols">
                  <mat-form-field appearance="outline">
                    <mat-label>Expected Salary (ZAR)</mat-label>
                    <input matInput type="number" formControlName="expectedSalary" min="0">
                    <span matTextPrefix>R&nbsp;</span>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Notice Period (Days)</mat-label>
                    <input matInput type="number" formControlName="noticePeriodDays" min="0">
                  </mat-form-field>
                </div>

                <div class="form-row two-cols">
                  <mat-form-field appearance="outline">
                    <mat-label>Available From</mat-label>
                    <input matInput [matDatepicker]="availablePicker" formControlName="availableFrom">
                    <mat-datepicker-toggle matIconSuffix [for]="availablePicker"></mat-datepicker-toggle>
                    <mat-datepicker #availablePicker></mat-datepicker>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Preferred Locations</mat-label>
                    <input matInput formControlName="preferredLocations" placeholder="e.g. Johannesburg, Cape Town">
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-checkbox formControlName="willingToRelocate">Willing to relocate</mat-checkbox>
                </div>
              </section>

              <mat-divider></mat-divider>

              <!-- Links & Source -->
              <section class="form-section">
                <h3>Links & Source</h3>
                <div class="form-row two-cols">
                  <mat-form-field appearance="outline">
                    <mat-label>LinkedIn URL</mat-label>
                    <input matInput formControlName="linkedinUrl" placeholder="https://linkedin.com/in/...">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Portfolio URL</mat-label>
                    <input matInput formControlName="portfolioUrl" placeholder="https://...">
                  </mat-form-field>
                </div>

                @if (!isEditMode()) {
                  <div class="form-row two-cols">
                    <mat-form-field appearance="outline">
                      <mat-label>Source</mat-label>
                      <mat-select formControlName="source">
                        <mat-option value="">Select source</mat-option>
                        <mat-option value="CAREER_SITE">Career Site</mat-option>
                        <mat-option value="LINKEDIN">LinkedIn</mat-option>
                        <mat-option value="REFERRAL">Employee Referral</mat-option>
                        <mat-option value="JOB_BOARD">Job Board</mat-option>
                        <mat-option value="RECRUITMENT_AGENCY">Recruitment Agency</mat-option>
                        <mat-option value="DIRECT">Direct Application</mat-option>
                        <mat-option value="OTHER">Other</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Referred By</mat-label>
                      <input matInput formControlName="referredBy" placeholder="Name of referrer (if applicable)">
                    </mat-form-field>
                  </div>
                }
              </section>
            </mat-card-content>
          </mat-card>

          <!-- Actions -->
          <div class="form-actions">
            <button mat-button type="button" (click)="cancel()">Cancel</button>
            <button mat-raised-button color="primary" type="submit"
                    [disabled]="form.invalid || saving()">
              @if (saving()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                {{ isEditMode() ? 'Update Candidate' : 'Add Candidate' }}
              }
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .candidate-form-container {
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
    }

    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .back-link {
      color: rgba(0, 0, 0, 0.6);
      display: flex;
    }

    .form-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 300px;
    }

    .form-section {
      padding: 24px 0;
    }

    .form-section:first-child {
      padding-top: 0;
    }

    .form-section h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
    }

    .form-row {
      margin-bottom: 16px;
    }

    .form-row:last-child {
      margin-bottom: 0;
    }

    .form-row.two-cols {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-row.three-cols {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
    }

    @media (max-width: 600px) {
      .form-row.two-cols,
      .form-row.three-cols {
        grid-template-columns: 1fr;
      }
    }

    .full-width {
      width: 100%;
    }

    mat-divider {
      margin: 0;
    }

    .form-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 24px;
      padding: 16px 0;
    }

    .form-actions button mat-spinner {
      display: inline-block;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CandidateFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly snackBar = inject(MatSnackBar);

  form: FormGroup;
  loading = signal(false);
  saving = signal(false);
  candidateId = signal<string | null>(null);
  isEditMode = signal(false);

  constructor() {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      idNumber: [''],
      dateOfBirth: [null],
      gender: [''],
      nationality: [''],
      addressLine1: [''],
      addressLine2: [''],
      city: [''],
      province: [''],
      postalCode: [''],
      currentJobTitle: [''],
      currentEmployer: [''],
      yearsExperience: [null],
      highestQualification: [''],
      fieldOfStudy: [''],
      skills: [''],
      languages: [''],
      expectedSalary: [null],
      noticePeriodDays: [null],
      availableFrom: [null],
      willingToRelocate: [false],
      preferredLocations: [''],
      linkedinUrl: [''],
      portfolioUrl: [''],
      source: [''],
      referredBy: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.candidateId.set(id);
      this.isEditMode.set(true);
      this.loadCandidate(id);
    }
  }

  loadCandidate(id: string): void {
    this.loading.set(true);
    this.recruitmentService.getCandidate(id).subscribe({
      next: (candidate) => {
        this.form.patchValue({
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
          phone: candidate.phone,
          idNumber: candidate.idNumber,
          dateOfBirth: candidate.dateOfBirth ? new Date(candidate.dateOfBirth) : null,
          gender: candidate.gender || '',
          nationality: candidate.nationality,
          city: candidate.city,
          province: candidate.province,
          currentJobTitle: candidate.currentJobTitle,
          currentEmployer: candidate.currentEmployer,
          yearsExperience: candidate.yearsExperience,
          highestQualification: candidate.highestQualification,
          fieldOfStudy: candidate.fieldOfStudy,
          skills: candidate.skills,
          languages: candidate.languages,
          expectedSalary: candidate.expectedSalary,
          noticePeriodDays: candidate.noticePeriodDays,
          availableFrom: candidate.availableFrom ? new Date(candidate.availableFrom) : null,
          willingToRelocate: candidate.willingToRelocate,
          preferredLocations: candidate.preferredLocations,
          linkedinUrl: candidate.linkedinUrl,
          portfolioUrl: candidate.portfolioUrl
        });
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load candidate', err);
        this.snackBar.open('Failed to load candidate details', 'Dismiss', { duration: 5000 });
        this.loading.set(false);
        this.router.navigate(['/recruitment/candidates']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    const formValue = this.form.value;

    if (this.isEditMode()) {
      const request: UpdateCandidateRequest = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        phone: formValue.phone,
        currentJobTitle: formValue.currentJobTitle,
        currentEmployer: formValue.currentEmployer,
        yearsExperience: formValue.yearsExperience,
        skills: formValue.skills,
        expectedSalary: formValue.expectedSalary,
        noticePeriodDays: formValue.noticePeriodDays,
        willingToRelocate: formValue.willingToRelocate
      };

      this.recruitmentService.updateCandidate(this.candidateId()!, request).subscribe({
        next: (candidate) => {
          this.saving.set(false);
          this.snackBar.open('Candidate updated successfully', 'Dismiss', { duration: 3000 });
          this.router.navigate(['/recruitment/candidates', candidate.id]);
        },
        error: (err) => {
          console.error('Failed to update candidate', err);
          this.saving.set(false);
          this.snackBar.open('Failed to update candidate', 'Dismiss', { duration: 5000 });
        }
      });
    } else {
      const request: CreateCandidateRequest = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        phone: formValue.phone,
        idNumber: formValue.idNumber,
        dateOfBirth: formValue.dateOfBirth ? this.formatDate(formValue.dateOfBirth) : undefined,
        gender: formValue.gender || undefined,
        nationality: formValue.nationality,
        addressLine1: formValue.addressLine1,
        addressLine2: formValue.addressLine2,
        city: formValue.city,
        province: formValue.province,
        postalCode: formValue.postalCode,
        currentJobTitle: formValue.currentJobTitle,
        currentEmployer: formValue.currentEmployer,
        yearsExperience: formValue.yearsExperience,
        highestQualification: formValue.highestQualification,
        fieldOfStudy: formValue.fieldOfStudy,
        skills: formValue.skills,
        languages: formValue.languages,
        expectedSalary: formValue.expectedSalary,
        noticePeriodDays: formValue.noticePeriodDays,
        availableFrom: formValue.availableFrom ? this.formatDate(formValue.availableFrom) : undefined,
        willingToRelocate: formValue.willingToRelocate,
        preferredLocations: formValue.preferredLocations,
        linkedinUrl: formValue.linkedinUrl,
        portfolioUrl: formValue.portfolioUrl,
        source: formValue.source,
        referredBy: formValue.referredBy
      };

      this.recruitmentService.createCandidate(request).subscribe({
        next: (candidate) => {
          this.saving.set(false);
          this.snackBar.open('Candidate added successfully', 'Dismiss', { duration: 3000 });
          this.router.navigate(['/recruitment/candidates', candidate.id]);
        },
        error: (err) => {
          console.error('Failed to create candidate', err);
          this.saving.set(false);
          this.snackBar.open('Failed to add candidate', 'Dismiss', { duration: 5000 });
        }
      });
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  cancel(): void {
    if (this.isEditMode()) {
      this.router.navigate(['/recruitment/candidates', this.candidateId()]);
    } else {
      this.router.navigate(['/recruitment/candidates']);
    }
  }
}
