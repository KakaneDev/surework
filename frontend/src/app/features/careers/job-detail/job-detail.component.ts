import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CareersService, PublicJobPosting, ApplicationSubmission } from '../careers.service';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="detail-page">

      <!-- ─── Hero Header ─── -->
      <section class="hero">
        <div class="hero-dots"></div>
        <div class="hero-glow"></div>

        <div class="hero-inner">
          <a routerLink="/careers" class="back-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Jobs
          </a>

          @if (loading()) {
            <div class="hero-skeleton">
              <div class="sk-line sk-w60"></div>
              <div class="sk-line sk-w40"></div>
              <div class="sk-badges-row">
                <div class="sk-badge"></div>
                <div class="sk-badge"></div>
              </div>
            </div>
          } @else if (job()) {
            <div class="hero-content">
              <h1 class="hero-title">{{ job()?.title }}</h1>

              <div class="hero-meta">
                <span class="meta-chip location">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {{ job()?.city || job()?.location }}{{ job()?.province ? ', ' + careersService.getProvinceLabel(job()!.province) : '' }}
                </span>

                <span class="meta-chip type" [attr.data-type]="job()!.employmentType">
                  {{ careersService.getEmploymentTypeLabel(job()!.employmentType) }}
                </span>

                @if (job()?.remote) {
                  <span class="meta-chip remote">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h20M4 20V10l8-6 8 6v10M9 20v-6h6v6"/></svg>
                    Remote Available
                  </span>
                }

                @if (job()?.clientName) {
                  <span class="meta-chip client">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 7v14M21 7v14M6 11h.01M6 15h.01M10 11h.01M10 15h.01M14 11h.01M14 15h.01M18 11h.01M18 15h.01M6 7V3h12v4"/></svg>
                    {{ job()!.clientName }}
                  </span>
                }

                <span class="meta-chip posted">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Posted {{ careersService.getRelativeTime(job()!.publishedAt) }}
                </span>
              </div>

              @if (!job()?.hideSalary && (job()?.salaryMin || job()?.salaryMax)) {
                <div class="salary-display">
                  <span class="salary-amount">
                    {{ careersService.formatSalary(job()?.salaryMin, job()?.salaryMax, job()?.salaryCurrency, job()?.salaryFrequency) }}
                  </span>
                </div>
              }
            </div>
          }
        </div>
      </section>

      @if (loading()) {
        <!-- Loading Skeleton -->
        <div class="content-wrap">
          <div class="main-col">
            <div class="skeleton-section">
              <div class="sk-line sk-w40"></div>
              <div class="sk-line sk-full"></div>
              <div class="sk-line sk-full"></div>
              <div class="sk-line sk-w80"></div>
              <div class="sk-line sk-full"></div>
              <div class="sk-line sk-w60"></div>
            </div>
          </div>
          <div class="sidebar-col">
            <div class="skeleton-section sidebar-skeleton">
              <div class="sk-line sk-w60"></div>
              <div class="sk-line sk-full"></div>
              <div class="sk-line sk-full"></div>
              <div class="sk-line sk-w80"></div>
            </div>
          </div>
        </div>
      } @else if (job()) {
        <!-- ─── Content ─── -->
        <div class="content-wrap">
          <div class="main-col">

            <!-- Job Description -->
            <section class="content-card" style="--delay: 0">
              <h2 class="section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                Job Description
              </h2>
              <div class="prose-content" [innerHTML]="job()?.description"></div>
            </section>

            <!-- Requirements -->
            @if (job()?.requirements) {
              <section class="content-card" style="--delay: 1">
                <h2 class="section-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Requirements
                </h2>
                <div class="prose-content" [innerHTML]="job()?.requirements"></div>
              </section>
            }

            <!-- Responsibilities -->
            @if (job()?.responsibilities) {
              <section class="content-card" style="--delay: 2">
                <h2 class="section-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                  Responsibilities
                </h2>
                <div class="prose-content" [innerHTML]="job()?.responsibilities"></div>
              </section>
            }

            <!-- Skills -->
            @if (job()?.skills?.length) {
              <section class="content-card" style="--delay: 3">
                <h2 class="section-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  Required Skills
                </h2>
                <div class="skill-grid">
                  @for (skill of job()?.skills; track skill) {
                    <span class="skill-chip">{{ skill }}</span>
                  }
                </div>
              </section>
            }

            <!-- Benefits -->
            @if (job()?.benefits?.length) {
              <section class="content-card" style="--delay: 4">
                <h2 class="section-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                  Benefits
                </h2>
                <div class="benefits-list">
                  @for (benefit of job()?.benefits; track benefit) {
                    <div class="benefit-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      <span>{{ benefit }}</span>
                    </div>
                  }
                </div>
              </section>
            }
          </div>

          <!-- ─── Sidebar ─── -->
          <div class="sidebar-col">
            <div class="sidebar-card" [class.submitted]="applicationSubmitted()">

              @if (applicationSubmitted()) {
                <!-- Success -->
                <div class="success-state">
                  <div class="success-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <h3>Application Submitted!</h3>
                  <p>Thank you for applying. We'll review your application and get back to you soon.</p>
                  <div class="ref-badge">
                    <span class="ref-label">Reference</span>
                    <span class="ref-value">{{ applicationRef() }}</span>
                  </div>
                  <a routerLink="/careers" class="browse-btn">Browse More Jobs</a>
                </div>
              } @else {
                <!-- Application Form -->
                <div class="form-header">
                  <h3>Apply for this Position</h3>
                  <p>Fill out the form below to submit your application.</p>
                </div>

                <form [formGroup]="applicationForm" (ngSubmit)="submitApplication()">
                  <div class="form-grid">

                    <div class="form-row two-col">
                      <div class="form-group">
                        <label>First Name <span class="req">*</span></label>
                        <input type="text" formControlName="firstName" placeholder="John" />
                      </div>
                      <div class="form-group">
                        <label>Last Name <span class="req">*</span></label>
                        <input type="text" formControlName="lastName" placeholder="Doe" />
                      </div>
                    </div>

                    <div class="form-group">
                      <label>Email <span class="req">*</span></label>
                      <input type="email" formControlName="email" placeholder="you&#64;example.com" />
                    </div>

                    <div class="form-group">
                      <label>Phone <span class="req">*</span></label>
                      <input type="tel" formControlName="phone" placeholder="+27 XX XXX XXXX" />
                    </div>

                    <div class="form-group">
                      <label>LinkedIn Profile</label>
                      <input type="url" formControlName="linkedInUrl" placeholder="https://linkedin.com/in/..." />
                    </div>

                    <div class="form-group">
                      <label>Resume / CV <span class="req">*</span></label>
                      <div class="file-upload" [class.has-file]="selectedFile">
                        <input type="file" (change)="onFileSelected($event)" accept=".pdf,.doc,.docx" id="resume-input" />
                        <label for="resume-input" class="file-label">
                          @if (selectedFile) {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            <span class="file-name">{{ selectedFile.name }}</span>
                          } @else {
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            <span>Upload PDF, DOC, DOCX</span>
                            <span class="file-hint">(max 5MB)</span>
                          }
                        </label>
                      </div>
                    </div>

                    <div class="form-group">
                      <label>Cover Letter</label>
                      <textarea formControlName="coverLetter" rows="4" placeholder="Tell us why you're a great fit for this role..."></textarea>
                    </div>

                    <div class="form-row two-col">
                      <div class="form-group">
                        <label>Expected Salary (ZAR)</label>
                        <div class="salary-input-wrap">
                          <span class="salary-prefix">R</span>
                          <input type="text"
                            [value]="formattedSalary"
                            (input)="onSalaryInput($event)"
                            (blur)="onSalaryBlur()"
                            placeholder="e.g. 50,000"
                            inputmode="numeric" />
                          <span class="salary-suffix">/ month</span>
                        </div>
                      </div>
                      <div class="form-group">
                        <label>Notice Period</label>
                        <select formControlName="noticePeriod">
                          <option value="">Select...</option>
                          <option value="immediately">Immediately</option>
                          <option value="1_week">1 Week</option>
                          <option value="2_weeks">2 Weeks</option>
                          <option value="1_month">1 Month</option>
                          <option value="2_months">2 Months</option>
                          <option value="3_months">3 Months</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button type="submit" class="submit-btn" [disabled]="applicationForm.invalid || submitting()">
                    @if (submitting()) {
                      <svg class="spinner" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
                      Submitting...
                    } @else {
                      Submit Application
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    }
                  </button>

                  @if (submitError()) {
                    <p class="submit-error">{{ submitError() }}</p>
                  }
                  <p class="form-disclaimer">By submitting, you agree to our Privacy Policy</p>
                </form>
              }

              <!-- Job Quick Info -->
              <div class="quick-info">
                <dl>
                  <div class="info-row">
                    <dt>Job Reference</dt>
                    <dd>{{ job()?.jobReference }}</dd>
                  </div>
                  <div class="info-row">
                    <dt>Posted</dt>
                    <dd>{{ careersService.getRelativeTime(job()!.publishedAt) }}</dd>
                  </div>
                  @if (job()?.closingDate) {
                    <div class="info-row">
                      <dt>Closing Date</dt>
                      <dd>{{ job()?.closingDate | date:'mediumDate' }}</dd>
                    </div>
                  }
                  @if (job()?.experienceYearsMin) {
                    <div class="info-row">
                      <dt>Experience</dt>
                      <dd>{{ job()?.experienceYearsMin }}+ years</dd>
                    </div>
                  }
                </dl>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <!-- Not Found -->
        <div class="not-found">
          <div class="not-found-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M8 11h6"/></svg>
          </div>
          <h2>Job Not Found</h2>
          <p>This job posting may have been removed or is no longer available.</p>
          <a routerLink="/careers" class="not-found-btn">Browse All Jobs</a>
        </div>
      }

      <!-- ─── Footer ─── -->
      <footer class="site-footer">
        <div class="footer-inner">
          <div class="footer-brand">
            <h4 class="footer-logo">SureWork</h4>
            <p class="footer-tagline">Connecting exceptional talent with leading employers across South Africa.</p>
          </div>
          <div class="footer-links">
            <div class="footer-col">
              <h5>Job Seekers</h5>
              <ul>
                <li><a routerLink="/careers">Browse Jobs</a></li>
                <li><a href="#">Career Advice</a></li>
                <li><a href="#">Salary Guide</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <h5>Company</h5>
              <ul>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Contact</a></li>
                <li><a href="#">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; {{ currentYear }} SureWork Recruitment Services. All rights reserved.</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&display=swap');

    :host { display: block; }

    .detail-page {
      --brand: #0d9488;
      --brand-light: #14b8a6;
      --brand-glow: rgba(20, 184, 166, 0.15);
      --hero-bg: #0c1222;
      --surface: #f8fafb;
      --card: #ffffff;
      --text: #1e293b;
      --text-muted: #64748b;
      --text-faint: #94a3b8;
      --border: #e2e8f0;
      --radius: 12px;

      font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
      color: var(--text);
      background: var(--surface);
      min-height: 100vh;
    }

    /* ─── Hero ─── */
    .hero {
      position: relative;
      background: var(--hero-bg);
      padding: 2rem 1.5rem 3rem;
      overflow: hidden;
    }

    .hero-dots {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0);
      background-size: 28px 28px;
      pointer-events: none;
    }

    .hero-glow {
      position: absolute;
      top: -40%;
      left: 50%;
      width: 60%;
      height: 160%;
      transform: translateX(-50%);
      background: radial-gradient(ellipse, var(--brand-glow) 0%, transparent 70%);
      pointer-events: none;
    }

    .hero-inner {
      position: relative;
      max-width: 64rem;
      margin: 0 auto;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-faint);
      text-decoration: none;
      margin-bottom: 1.75rem;
      transition: color 0.2s;
      animation: fadeDown 0.5s ease both;
    }
    .back-link svg { width: 18px; height: 18px; }
    .back-link:hover { color: var(--brand-light); }

    .hero-content { animation: fadeDown 0.6s ease 0.1s both; }

    .hero-title {
      font-family: 'DM Serif Display', Georgia, serif;
      font-size: clamp(1.75rem, 4vw, 2.5rem);
      line-height: 1.2;
      color: #f1f5f9;
      font-weight: 400;
      margin: 0 0 1.25rem;
    }

    .hero-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
    }

    .meta-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.375rem 0.75rem;
      border-radius: 100px;
      background: rgba(255,255,255,0.08);
      color: #cbd5e1;
    }
    .meta-chip svg { width: 14px; height: 14px; }
    .meta-chip.type[data-type="FULL_TIME"] { background: rgba(13,148,136,0.2); color: #5eead4; }
    .meta-chip.type[data-type="PART_TIME"] { background: rgba(59,130,246,0.2); color: #93c5fd; }
    .meta-chip.type[data-type="CONTRACT"] { background: rgba(245,158,11,0.2); color: #fcd34d; }
    .meta-chip.type[data-type="TEMPORARY"] { background: rgba(249,115,22,0.2); color: #fdba74; }
    .meta-chip.type[data-type="INTERNSHIP"] { background: rgba(139,92,246,0.2); color: #c4b5fd; }
    .meta-chip.remote { background: rgba(5,150,105,0.2); color: #6ee7b7; }

    .salary-display {
      display: inline-flex;
      align-items: baseline;
      gap: 0.375rem;
      padding: 0.625rem 1.25rem;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
    }
    .salary-amount {
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 1.375rem;
      font-weight: 700;
      color: #f1f5f9;
    }
    .salary-freq {
      font-size: 0.8125rem;
      color: var(--text-faint);
    }

    /* Hero Skeleton */
    .hero-skeleton { animation: shimmer 1.5s ease infinite; }
    .hero-skeleton .sk-line { background: rgba(255,255,255,0.08); margin-bottom: 0.75rem; height: 20px; border-radius: 6px; }
    .hero-skeleton .sk-w60 { width: 60%; height: 32px; }
    .hero-skeleton .sk-w40 { width: 40%; }
    .sk-badges-row { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
    .sk-badge { width: 100px; height: 28px; background: rgba(255,255,255,0.08); border-radius: 100px; }

    /* ─── Content Layout ─── */
    .content-wrap {
      max-width: 64rem;
      margin: 0 auto;
      padding: 2rem 1.5rem 4rem;
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 2rem;
      align-items: start;
    }

    .main-col { min-width: 0; }
    .sidebar-col { position: sticky; top: 1.5rem; }

    @media (max-width: 1024px) {
      .content-wrap { grid-template-columns: 1fr; }
      .sidebar-col { position: static; }
    }

    /* ─── Content Cards ─── */
    .content-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 2rem;
      margin-bottom: 1rem;
      opacity: 0;
      animation: cardIn 0.5s ease forwards;
      animation-delay: calc(var(--delay, 0) * 80ms + 200ms);
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 1.0625rem;
      font-weight: 600;
      color: var(--text);
      margin: 0 0 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border);
    }
    .section-title svg {
      width: 20px;
      height: 20px;
      color: var(--brand);
      flex-shrink: 0;
    }

    .prose-content {
      font-size: 0.9375rem;
      line-height: 1.75;
      color: #374151;
    }
    .prose-content :deep(p) { margin: 0 0 1rem; }
    .prose-content :deep(ul), .prose-content :deep(ol) { padding-left: 1.5rem; margin: 0 0 1rem; }
    .prose-content :deep(li) { margin-bottom: 0.5rem; }
    .prose-content :deep(strong) { font-weight: 600; color: var(--text); }

    /* Skills */
    .skill-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .skill-chip {
      display: inline-flex;
      align-items: center;
      font-size: 0.8125rem;
      font-weight: 500;
      padding: 0.375rem 0.875rem;
      border-radius: 8px;
      background: #f0fdfa;
      color: var(--brand);
      border: 1px solid rgba(13,148,136,0.15);
      transition: background 0.15s, border-color 0.15s;
    }
    .skill-chip:hover { background: #ccfbf1; border-color: rgba(13,148,136,0.3); }

    /* Benefits */
    .benefits-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.75rem;
    }
    .benefit-item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      font-size: 0.875rem;
      color: #374151;
      padding: 0.625rem 0.75rem;
      background: #f8fafb;
      border-radius: 8px;
      transition: background 0.15s;
    }
    .benefit-item:hover { background: #f0fdfa; }
    .benefit-item svg { width: 16px; height: 16px; color: var(--brand); flex-shrink: 0; }

    /* ─── Sidebar Card ─── */
    .sidebar-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      opacity: 0;
      animation: cardIn 0.5s ease 0.3s forwards;
    }

    .sidebar-card.submitted {
      border-color: rgba(5,150,105,0.3);
    }

    .form-header {
      padding: 1.5rem 1.5rem 0;
    }
    .form-header h3 {
      font-size: 1.0625rem;
      font-weight: 600;
      color: var(--text);
      margin: 0 0 0.375rem;
    }
    .form-header p {
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin: 0;
    }

    form {
      padding: 1.25rem 1.5rem;
    }

    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-row.two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .form-group label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text);
      margin-bottom: 0.375rem;
    }
    .req { color: var(--brand); }

    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.625rem 0.875rem;
      font-family: inherit;
      font-size: 0.875rem;
      color: var(--text);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      box-sizing: border-box;
    }
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      border-color: var(--brand);
      box-shadow: 0 0 0 3px rgba(13,148,136,0.1);
    }
    .form-group input::placeholder,
    .form-group textarea::placeholder { color: var(--text-faint); }

    .form-group select {
      -webkit-appearance: none;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      padding-right: 2rem;
    }

    .form-group textarea {
      resize: vertical;
      min-height: 90px;
    }

    /* Salary Input */
    .salary-input-wrap {
      display: flex;
      align-items: center;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .salary-input-wrap:focus-within {
      border-color: var(--brand);
      box-shadow: 0 0 0 3px rgba(13,148,136,0.1);
    }
    .salary-prefix {
      padding: 0.625rem 0 0.625rem 0.875rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-muted);
      user-select: none;
    }
    .salary-input-wrap input {
      flex: 1;
      padding: 0.625rem 0.5rem;
      font-family: inherit;
      font-size: 0.875rem;
      color: var(--text);
      background: transparent;
      border: none;
      outline: none;
      min-width: 0;
    }
    .salary-input-wrap input::placeholder { color: var(--text-faint); }
    .salary-suffix {
      padding: 0.625rem 0.875rem 0.625rem 0;
      font-size: 0.75rem;
      color: var(--text-faint);
      white-space: nowrap;
      user-select: none;
    }

    /* File Upload */
    .file-upload { position: relative; }
    .file-upload input[type="file"] {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
      z-index: 1;
    }
    .file-label {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
      padding: 1.25rem;
      border: 2px dashed var(--border);
      border-radius: 8px;
      text-align: center;
      font-size: 0.8125rem;
      color: var(--text-muted);
      transition: border-color 0.2s, background 0.2s;
      cursor: pointer;
    }
    .file-label svg { width: 24px; height: 24px; color: var(--text-faint); }
    .file-label:hover { border-color: var(--brand); background: #f0fdfa; }
    .file-upload.has-file .file-label {
      border-color: var(--brand);
      border-style: solid;
      background: #f0fdfa;
      flex-direction: row;
      padding: 0.75rem 1rem;
    }
    .file-upload.has-file .file-label svg { color: var(--brand); width: 18px; height: 18px; }
    .file-name { color: var(--brand); font-weight: 500; }
    .file-hint { font-size: 0.6875rem; color: var(--text-faint); }

    /* Submit Button */
    .submit-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.875rem;
      margin-top: 1.25rem;
      font-family: inherit;
      font-size: 0.9375rem;
      font-weight: 600;
      color: white;
      background: var(--brand);
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.2s, transform 0.15s, opacity 0.2s;
    }
    .submit-btn svg { width: 18px; height: 18px; }
    .submit-btn:hover:not(:disabled) { background: #0f766e; transform: translateY(-1px); }
    .submit-btn:active:not(:disabled) { transform: translateY(0); }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .spinner { animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .submit-error {
      text-align: center;
      font-size: 0.8125rem;
      color: #dc2626;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 0.625rem 1rem;
      margin: 0.75rem 0 0;
    }

    .form-disclaimer {
      text-align: center;
      font-size: 0.6875rem;
      color: var(--text-faint);
      margin: 0.75rem 0 0;
    }

    /* Success State */
    .success-state {
      padding: 2.5rem 1.5rem;
      text-align: center;
    }
    .success-icon {
      width: 56px;
      height: 56px;
      margin: 0 auto 1.25rem;
      background: #ecfdf5;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: successPop 0.4s ease;
    }
    .success-icon svg { width: 28px; height: 28px; color: #059669; }
    @keyframes successPop {
      0% { transform: scale(0); }
      60% { transform: scale(1.15); }
      100% { transform: scale(1); }
    }
    .success-state h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text);
      margin: 0 0 0.5rem;
    }
    .success-state p {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin: 0 0 1.25rem;
      line-height: 1.6;
    }
    .ref-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #f0fdfa;
      border: 1px solid rgba(13,148,136,0.2);
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }
    .ref-label { font-size: 0.75rem; color: var(--text-muted); }
    .ref-value { font-size: 0.8125rem; font-weight: 600; color: var(--brand); font-family: monospace; }

    .browse-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.625rem 1.25rem;
      font-family: inherit;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--brand);
      background: transparent;
      border: 1px solid rgba(13,148,136,0.3);
      border-radius: 8px;
      text-decoration: none;
      transition: background 0.15s;
    }
    .browse-btn:hover { background: #f0fdfa; }

    /* Quick Info */
    .quick-info {
      padding: 1.25rem 1.5rem;
      border-top: 1px solid var(--border);
      background: #fafbfc;
    }
    .quick-info dl { margin: 0; }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.375rem 0;
    }
    .info-row:not(:last-child) { border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; margin-bottom: 0.5rem; }
    .info-row dt { font-size: 0.75rem; color: var(--text-muted); }
    .info-row dd { font-size: 0.8125rem; font-weight: 600; color: var(--text); margin: 0; }

    /* ─── Not Found ─── */
    .not-found {
      max-width: 32rem;
      margin: 4rem auto;
      padding: 4rem 2rem;
      text-align: center;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }
    .not-found-icon {
      width: 72px;
      height: 72px;
      margin: 0 auto 1.5rem;
      background: #f1f5f9;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .not-found-icon svg { width: 32px; height: 32px; color: var(--text-faint); }
    .not-found h2 { font-size: 1.375rem; font-weight: 600; margin: 0 0 0.5rem; }
    .not-found p { color: var(--text-muted); font-size: 0.9375rem; margin: 0 0 1.5rem; line-height: 1.6; }
    .not-found-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      font-family: inherit;
      font-size: 0.875rem;
      font-weight: 600;
      color: white;
      background: var(--brand);
      border-radius: 10px;
      text-decoration: none;
      transition: background 0.2s, transform 0.15s;
    }
    .not-found-btn:hover { background: #0f766e; transform: translateY(-1px); }

    /* ─── Loading Skeleton ─── */
    .skeleton-section {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 2rem;
      margin-bottom: 1rem;
      animation: shimmer 1.5s ease infinite;
    }
    .sidebar-skeleton { min-height: 400px; }
    .sk-line { height: 14px; background: #e2e8f0; border-radius: 6px; margin-bottom: 0.75rem; }
    .sk-full { width: 100%; }
    .sk-w80 { width: 80%; }
    .sk-w60 { width: 60%; }
    .sk-w40 { width: 40%; }

    /* ─── Footer ─── */
    .site-footer {
      background: #0f172a;
      color: #94a3b8;
      margin-top: 4rem;
    }
    .footer-inner {
      max-width: 64rem;
      margin: 0 auto;
      padding: 3.5rem 1.5rem 2rem;
      display: flex;
      justify-content: space-between;
      gap: 3rem;
      flex-wrap: wrap;
    }
    .footer-brand { max-width: 320px; }
    .footer-logo {
      font-family: 'DM Serif Display', Georgia, serif;
      font-size: 1.5rem;
      color: #f1f5f9;
      margin: 0 0 0.75rem;
    }
    .footer-tagline { font-size: 0.875rem; line-height: 1.6; margin: 0; }

    .footer-links { display: flex; gap: 4rem; }
    .footer-col h5 {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #cbd5e1;
      margin: 0 0 1rem;
    }
    .footer-col ul { list-style: none; padding: 0; margin: 0; }
    .footer-col li { margin-bottom: 0.5rem; }
    .footer-col a {
      font-size: 0.875rem;
      color: #94a3b8;
      text-decoration: none;
      transition: color 0.15s;
    }
    .footer-col a:hover { color: var(--brand-light); }

    .footer-bottom {
      border-top: 1px solid #1e293b;
      padding: 1.5rem;
      text-align: center;
    }
    .footer-bottom p { font-size: 0.75rem; margin: 0; color: #64748b; }

    @media (max-width: 640px) {
      .footer-inner { flex-direction: column; gap: 2rem; }
      .footer-links { gap: 2rem; }
      .form-row.two-col { grid-template-columns: 1fr; }
    }

    /* ─── Animations ─── */
    @keyframes fadeDown {
      from { opacity: 0; transform: translateY(-12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes cardIn {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmer {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `]
})
export class JobDetailComponent implements OnInit {
  careersService = inject(CareersService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  loading = signal(true);
  job = signal<PublicJobPosting | null>(null);
  submitting = signal(false);
  applicationSubmitted = signal(false);
  applicationRef = signal('');
  submitError = signal('');

  currentYear = new Date().getFullYear();

  applicationForm: FormGroup;
  selectedFile: File | null = null;
  formattedSalary = '';

  constructor() {
    this.applicationForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      linkedInUrl: [''],
      coverLetter: [''],
      expectedSalary: [null],
      noticePeriod: ['']
    });
  }

  ngOnInit(): void {
    const jobRef = this.route.snapshot.paramMap.get('jobRef');
    if (jobRef) {
      this.loadJob(jobRef);
    }
  }

  loadJob(jobRef: string): void {
    this.loading.set(true);
    this.careersService.getJobByReference(jobRef).subscribe({
      next: (job) => {
        this.job.set(job);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onSalaryInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/[^\d]/g, '');
    const num = raw ? parseInt(raw, 10) : null;
    this.applicationForm.patchValue({ expectedSalary: num });
    this.formattedSalary = num ? num.toLocaleString('en-ZA') : '';
    input.value = this.formattedSalary;
  }

  onSalaryBlur(): void {
    const val = this.applicationForm.get('expectedSalary')?.value;
    this.formattedSalary = val ? Number(val).toLocaleString('en-ZA') : '';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
    }
  }

  submitApplication(): void {
    if (this.applicationForm.invalid || !this.job()) return;

    this.submitting.set(true);

    const formValue = this.applicationForm.value;
    const application: ApplicationSubmission = {
      jobPostingId: this.job()!.id,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      phone: formValue.phone,
      linkedInUrl: formValue.linkedInUrl || undefined,
      coverLetter: formValue.coverLetter || undefined,
      expectedSalary: formValue.expectedSalary || undefined,
      noticePeriod: formValue.noticePeriod || undefined,
      source: 'careers_page'
    };

    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        application.resumeBase64 = base64;
        application.resumeFileName = this.selectedFile!.name;
        this.submitToServer(application);
      };
      reader.readAsDataURL(this.selectedFile);
    } else {
      this.submitToServer(application);
    }
  }

  private submitToServer(application: ApplicationSubmission): void {
    this.careersService.submitApplication(application).subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.applicationSubmitted.set(true);
        this.applicationRef.set(response.applicationReference);
      },
      error: () => {
        this.submitting.set(false);
        this.submitError.set('Failed to submit application. Please try again.');
      }
    });
  }

}
