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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import {
  RecruitmentService,
  JobPosting,
  CreateJobRequest,
  UpdateJobRequest,
  EmploymentType
} from '../../../core/services/recruitment.service';

@Component({
  selector: 'app-job-posting-form',
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
    MatSnackBarModule,
    MatDividerModule
  ],
  template: `
    <div class="job-form-container">
      <header class="form-header">
        <div class="header-left">
          <a [routerLink]="isEditMode() ? ['/recruitment/jobs', jobId()] : '/recruitment/jobs'" class="back-link">
            <mat-icon>arrow_back</mat-icon>
          </a>
          <h1>{{ isEditMode() ? 'Edit Job Posting' : 'Create Job Posting' }}</h1>
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
              <!-- Basic Information -->
              <section class="form-section">
                <h3>Basic Information</h3>
                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Job Title</mat-label>
                    <input matInput formControlName="title" placeholder="e.g. Senior Software Engineer">
                    @if (form.get('title')?.hasError('required')) {
                      <mat-error>Title is required</mat-error>
                    }
                  </mat-form-field>
                </div>

                <div class="form-row two-cols">
                  <mat-form-field appearance="outline">
                    <mat-label>Department</mat-label>
                    <input matInput formControlName="departmentName" placeholder="e.g. Engineering">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Location</mat-label>
                    <input matInput formControlName="location" placeholder="e.g. Johannesburg, South Africa">
                  </mat-form-field>
                </div>

                <div class="form-row two-cols">
                  <mat-form-field appearance="outline">
                    <mat-label>Employment Type</mat-label>
                    <mat-select formControlName="employmentType">
                      @for (type of employmentTypes; track type.value) {
                        <mat-option [value]="type.value">{{ type.label }}</mat-option>
                      }
                    </mat-select>
                    @if (form.get('employmentType')?.hasError('required')) {
                      <mat-error>Employment type is required</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Positions Available</mat-label>
                    <input matInput type="number" formControlName="positionsAvailable" min="1">
                    @if (form.get('positionsAvailable')?.hasError('min')) {
                      <mat-error>At least 1 position required</mat-error>
                    }
                  </mat-form-field>
                </div>

                <div class="form-row checkboxes">
                  <mat-checkbox formControlName="remote">Remote position</mat-checkbox>
                  <mat-checkbox formControlName="internalOnly">Internal candidates only</mat-checkbox>
                </div>
              </section>

              <mat-divider></mat-divider>

              <!-- Job Description -->
              <section class="form-section">
                <h3>Job Description</h3>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Description</mat-label>
                  <textarea matInput formControlName="description" rows="5"
                            placeholder="Describe the role and its key responsibilities..."></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Requirements</mat-label>
                  <textarea matInput formControlName="requirements" rows="4"
                            placeholder="List the required qualifications and experience..."></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Responsibilities</mat-label>
                  <textarea matInput formControlName="responsibilities" rows="4"
                            placeholder="Detail the day-to-day responsibilities..."></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Qualifications</mat-label>
                  <textarea matInput formControlName="qualifications" rows="3"
                            placeholder="Required educational qualifications..."></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Skills</mat-label>
                  <textarea matInput formControlName="skills" rows="2"
                            placeholder="Required skills (e.g. Java, Python, AWS)..."></textarea>
                </mat-form-field>
              </section>

              <mat-divider></mat-divider>

              <!-- Experience & Compensation -->
              <section class="form-section">
                <h3>Experience & Compensation</h3>
                <div class="form-row two-cols">
                  <mat-form-field appearance="outline">
                    <mat-label>Min. Experience (Years)</mat-label>
                    <input matInput type="number" formControlName="experienceYearsMin" min="0">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Max. Experience (Years)</mat-label>
                    <input matInput type="number" formControlName="experienceYearsMax" min="0">
                  </mat-form-field>
                </div>

                <div class="form-row two-cols">
                  <mat-form-field appearance="outline">
                    <mat-label>Minimum Salary (ZAR)</mat-label>
                    <input matInput type="number" formControlName="salaryMin" min="0">
                    <span matTextPrefix>R&nbsp;</span>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Maximum Salary (ZAR)</mat-label>
                    <input matInput type="number" formControlName="salaryMax" min="0">
                    <span matTextPrefix>R&nbsp;</span>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-checkbox formControlName="showSalary">Show salary in job posting</mat-checkbox>
                </div>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Benefits</mat-label>
                  <textarea matInput formControlName="benefits" rows="3"
                            placeholder="List the benefits offered (e.g. Medical aid, Retirement fund, Flexible hours)..."></textarea>
                </mat-form-field>
              </section>

              <mat-divider></mat-divider>

              <!-- Team -->
              <section class="form-section">
                <h3>Hiring Team</h3>
                <div class="form-row two-cols">
                  <mat-form-field appearance="outline">
                    <mat-label>Hiring Manager</mat-label>
                    <input matInput formControlName="hiringManagerName" placeholder="Name of hiring manager">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Recruiter</mat-label>
                    <input matInput formControlName="recruiterName" placeholder="Name of recruiter">
                  </mat-form-field>
                </div>
              </section>
            </mat-card-content>
          </mat-card>

          <!-- Actions -->
          <div class="form-actions">
            <button mat-button type="button" (click)="cancel()">Cancel</button>
            <div class="right-actions">
              @if (!isEditMode()) {
                <button mat-stroked-button type="button" [disabled]="saving()"
                        (click)="saveAsDraft()">
                  Save as Draft
                </button>
              }
              <button mat-raised-button color="primary" type="submit"
                      [disabled]="form.invalid || saving()">
                @if (saving()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  {{ isEditMode() ? 'Update Job' : 'Create Job' }}
                }
              </button>
            </div>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .job-form-container {
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

    @media (max-width: 600px) {
      .form-row.two-cols {
        grid-template-columns: 1fr;
      }
    }

    .form-row.checkboxes {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
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

    .right-actions {
      display: flex;
      gap: 12px;
    }

    .right-actions button mat-spinner {
      display: inline-block;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobPostingFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly snackBar = inject(MatSnackBar);

  form: FormGroup;
  loading = signal(false);
  saving = signal(false);
  jobId = signal<string | null>(null);
  isEditMode = signal(false);

  employmentTypes = [
    { value: 'FULL_TIME', label: 'Full Time' },
    { value: 'PART_TIME', label: 'Part Time' },
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'TEMPORARY', label: 'Temporary' },
    { value: 'INTERNSHIP', label: 'Internship' },
    { value: 'FREELANCE', label: 'Freelance' }
  ];

  constructor() {
    this.form = this.fb.group({
      title: ['', Validators.required],
      departmentName: [''],
      location: [''],
      employmentType: ['FULL_TIME', Validators.required],
      positionsAvailable: [1, [Validators.required, Validators.min(1)]],
      remote: [false],
      internalOnly: [false],
      description: [''],
      requirements: [''],
      responsibilities: [''],
      qualifications: [''],
      skills: [''],
      experienceYearsMin: [null],
      experienceYearsMax: [null],
      salaryMin: [null],
      salaryMax: [null],
      showSalary: [false],
      benefits: [''],
      hiringManagerName: [''],
      recruiterName: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.jobId.set(id);
      this.isEditMode.set(true);
      this.loadJob(id);
    }
  }

  loadJob(id: string): void {
    this.loading.set(true);
    this.recruitmentService.getJob(id).subscribe({
      next: (job) => {
        this.form.patchValue({
          title: job.title,
          departmentName: job.departmentName,
          location: job.location,
          employmentType: job.employmentType,
          positionsAvailable: job.positionsAvailable,
          remote: job.remote,
          internalOnly: job.internalOnly,
          description: job.description,
          requirements: job.requirements,
          responsibilities: job.responsibilities,
          qualifications: job.qualifications,
          skills: job.skills,
          experienceYearsMin: job.experienceYearsMin,
          experienceYearsMax: job.experienceYearsMax,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          showSalary: job.showSalary,
          benefits: job.benefits,
          hiringManagerName: job.hiringManagerName,
          recruiterName: job.recruiterName
        });
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load job', err);
        this.snackBar.open('Failed to load job details', 'Dismiss', { duration: 5000 });
        this.loading.set(false);
        this.router.navigate(['/recruitment/jobs']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    const formValue = this.form.value;

    if (this.isEditMode()) {
      const request: UpdateJobRequest = {
        title: formValue.title,
        location: formValue.location,
        description: formValue.description,
        requirements: formValue.requirements,
        responsibilities: formValue.responsibilities,
        qualifications: formValue.qualifications,
        skills: formValue.skills,
        experienceYearsMin: formValue.experienceYearsMin,
        experienceYearsMax: formValue.experienceYearsMax,
        salaryMin: formValue.salaryMin,
        salaryMax: formValue.salaryMax,
        showSalary: formValue.showSalary,
        benefits: formValue.benefits,
        positionsAvailable: formValue.positionsAvailable,
        internalOnly: formValue.internalOnly,
        remote: formValue.remote
      };

      this.recruitmentService.updateJob(this.jobId()!, request).subscribe({
        next: (job) => {
          this.saving.set(false);
          this.snackBar.open('Job updated successfully', 'Dismiss', { duration: 3000 });
          this.router.navigate(['/recruitment/jobs', job.id]);
        },
        error: (err) => {
          console.error('Failed to update job', err);
          this.saving.set(false);
          this.snackBar.open('Failed to update job', 'Dismiss', { duration: 5000 });
        }
      });
    } else {
      const request: CreateJobRequest = {
        title: formValue.title,
        departmentName: formValue.departmentName,
        location: formValue.location,
        employmentType: formValue.employmentType,
        description: formValue.description,
        requirements: formValue.requirements,
        responsibilities: formValue.responsibilities,
        qualifications: formValue.qualifications,
        skills: formValue.skills,
        experienceYearsMin: formValue.experienceYearsMin,
        experienceYearsMax: formValue.experienceYearsMax,
        salaryMin: formValue.salaryMin,
        salaryMax: formValue.salaryMax,
        showSalary: formValue.showSalary,
        benefits: formValue.benefits,
        positionsAvailable: formValue.positionsAvailable,
        hiringManagerName: formValue.hiringManagerName,
        recruiterName: formValue.recruiterName,
        internalOnly: formValue.internalOnly,
        remote: formValue.remote
      };

      this.recruitmentService.createJob(request).subscribe({
        next: (job) => {
          this.saving.set(false);
          this.snackBar.open('Job created successfully', 'Dismiss', { duration: 3000 });
          this.router.navigate(['/recruitment/jobs', job.id]);
        },
        error: (err) => {
          console.error('Failed to create job', err);
          this.saving.set(false);
          this.snackBar.open('Failed to create job', 'Dismiss', { duration: 5000 });
        }
      });
    }
  }

  saveAsDraft(): void {
    if (!this.form.get('title')?.value) {
      this.snackBar.open('Please enter a job title', 'Dismiss', { duration: 3000 });
      return;
    }

    this.saving.set(true);
    const formValue = this.form.value;

    const request: CreateJobRequest = {
      title: formValue.title,
      departmentName: formValue.departmentName,
      location: formValue.location,
      employmentType: formValue.employmentType || 'FULL_TIME',
      description: formValue.description,
      requirements: formValue.requirements,
      responsibilities: formValue.responsibilities,
      qualifications: formValue.qualifications,
      skills: formValue.skills,
      experienceYearsMin: formValue.experienceYearsMin,
      experienceYearsMax: formValue.experienceYearsMax,
      salaryMin: formValue.salaryMin,
      salaryMax: formValue.salaryMax,
      showSalary: formValue.showSalary || false,
      benefits: formValue.benefits,
      positionsAvailable: formValue.positionsAvailable || 1,
      hiringManagerName: formValue.hiringManagerName,
      recruiterName: formValue.recruiterName,
      internalOnly: formValue.internalOnly || false,
      remote: formValue.remote || false
    };

    this.recruitmentService.createJob(request).subscribe({
      next: (job) => {
        this.saving.set(false);
        this.snackBar.open('Draft saved', 'Dismiss', { duration: 3000 });
        this.router.navigate(['/recruitment/jobs', job.id]);
      },
      error: (err) => {
        console.error('Failed to save draft', err);
        this.saving.set(false);
        this.snackBar.open('Failed to save draft', 'Dismiss', { duration: 5000 });
      }
    });
  }

  cancel(): void {
    if (this.isEditMode()) {
      this.router.navigate(['/recruitment/jobs', this.jobId()]);
    } else {
      this.router.navigate(['/recruitment/jobs']);
    }
  }
}
