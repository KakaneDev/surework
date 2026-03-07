import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CareersService, PublicJobPosting, JobSearchFilters, EmploymentType } from '../careers.service';

@Component({
  selector: 'app-careers-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="careers-page">
      <!-- ─── Hero ─── -->
      <section class="hero">
        <div class="hero-dots"></div>
        <div class="hero-glow"></div>
        <div class="hero-glow-2"></div>

        <div class="hero-inner">
          <span class="hero-eyebrow">SureWork Careers</span>
          <h1 class="hero-title">
            Find work that<br/><em>moves you forward</em>
          </h1>
          <p class="hero-sub">
            {{ totalJobs() | number }} open positions across South Africa
          </p>
        </div>

        <!-- Floating Search -->
        <div class="search-float">
          <div class="search-bar">
            <div class="search-field">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                [(ngModel)]="filters.keyword"
                (keyup.enter)="search()"
                placeholder="Job title, skill, or keyword"
              />
            </div>
            <div class="search-divider"></div>
            <div class="search-field">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <input
                type="text"
                [(ngModel)]="filters.location"
                (keyup.enter)="search()"
                placeholder="City or province"
              />
            </div>
            <button class="search-btn" (click)="search()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <span>Search</span>
            </button>
          </div>
        </div>
      </section>

      <!-- ─── Filter Bar ─── -->
      <section class="filters-section">
        <div class="filters-inner">
          <div class="type-pills">
            <button
              class="pill"
              [class.active]="!filters.employmentType"
              (click)="setType(undefined)"
            >
              All Jobs
              <span class="pill-count">{{ totalJobs() }}</span>
            </button>
            @for (type of employmentTypes; track type.value) {
              <button
                class="pill"
                [class.active]="filters.employmentType === type.value"
                (click)="setType(type.value)"
              >
                {{ type.label }}
              </button>
            }
          </div>
          <div class="filter-controls">
            <label class="remote-toggle">
              <input type="checkbox" [(ngModel)]="filters.remote" (change)="search()"/>
              <span class="toggle-track">
                <span class="toggle-thumb"></span>
              </span>
              <span class="toggle-label">Remote</span>
            </label>
            <select [(ngModel)]="filters.province" (change)="search()" class="filter-select">
              <option [ngValue]="undefined">All Provinces</option>
              @for (p of provinces; track p.value) {
                <option [value]="p.value">{{ p.label }}</option>
              }
            </select>
            <select [(ngModel)]="filters.sortBy" (change)="search()" class="filter-select">
              <option value="postingDate">Most Recent</option>
              <option value="title">Title A-Z</option>
              <option value="salaryMax">Highest Salary</option>
            </select>
          </div>
        </div>
      </section>

      <!-- ─── Results ─── -->
      <section class="results-section">
        <div class="results-inner">

          <p class="results-count">
            Showing <strong>{{ jobs().length }}</strong> of <strong>{{ totalJobs() }}</strong> positions
          </p>

          <!-- Loading -->
          @if (loading()) {
            <div class="skeleton-grid">
              @for (i of [1,2,3,4,5]; track i) {
                <div class="skeleton-card" [style.animation-delay]="(i * 100) + 'ms'">
                  <div class="sk-line sk-w60"></div>
                  <div class="sk-line sk-w40"></div>
                  <div class="sk-line sk-w80"></div>
                  <div class="sk-line sk-w30"></div>
                  <div class="sk-tags">
                    <div class="sk-tag"></div><div class="sk-tag"></div><div class="sk-tag"></div>
                  </div>
                </div>
              }
            </div>
          } @else {

            <!-- Job Cards -->
            @if (jobs().length > 0) {
              <div class="jobs-list">
                @for (job of jobs(); track job.id; let i = $index) {
                  <a
                    [routerLink]="['/careers/jobs', job.jobReference]"
                    class="job-card"
                    [style.--i]="i"
                  >
                    <!-- Card accent -->
                    <div class="card-accent" [attr.data-type]="job.employmentType"></div>

                    <div class="card-body">
                      <div class="card-top">
                        <div class="card-badges">
                          <span class="type-badge" [attr.data-type]="job.employmentType">
                            {{ careersService.getEmploymentTypeLabel(job.employmentType) }}
                          </span>
                          @if (job.remote) {
                            <span class="remote-badge">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="badge-icon"><path d="M2 20h20M4 20V10l8-6 8 6v10M9 20v-6h6v6"/></svg>
                              Remote
                            </span>
                          }
                        </div>
                        <span class="posted-date">{{ careersService.getRelativeTime(job.publishedAt) }}</span>
                      </div>

                      <h3 class="job-title">{{ job.title }}</h3>

                      <div class="job-meta">
                        <span class="meta-item">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          {{ job.city || job.location }}{{ job.province ? ', ' + careersService.getProvinceLabel(job.province) : '' }}
                        </span>
                        @if (job.clientName) {
                          <span class="meta-chip client-badge">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 7v14M21 7v14M6 11h.01M6 15h.01M10 11h.01M10 15h.01M14 11h.01M14 15h.01M18 11h.01M18 15h.01M6 7V3h12v4"/></svg>
                            {{ job.clientName }}
                          </span>
                        }
                        @if (!job.hideSalary && (job.salaryMin || job.salaryMax)) {
                          <span class="meta-item salary">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                            {{ careersService.formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryFrequency) }}
                          </span>
                        }
                      </div>

                      <p class="job-excerpt">
                        {{ job.description | slice:0:180 }}{{ job.description.length > 180 ? '...' : '' }}
                      </p>

                      @if (job.skills.length) {
                        <div class="skill-tags">
                          @for (skill of job.skills.slice(0, 5); track skill) {
                            <span class="skill-tag">{{ skill }}</span>
                          }
                          @if (job.skills.length > 5) {
                            <span class="skill-more">+{{ job.skills.length - 5 }}</span>
                          }
                        </div>
                      }
                    </div>

                    <div class="card-arrow">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                  </a>
                }
              </div>
            } @else {

              <!-- Empty State -->
              <div class="empty-state">
                <div class="empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                    <path d="M8 11h6M11 8v6" stroke-width="1.5"/>
                  </svg>
                </div>
                <h3>No positions found</h3>
                <p>Try broadening your search or adjusting your filters.</p>
                <button class="empty-btn" (click)="clearFilters()">Clear all filters</button>
              </div>
            }

            <!-- Pagination -->
            @if (totalPages() > 1) {
              <nav class="pagination">
                <button
                  class="page-btn"
                  [disabled]="filters.page === 0"
                  (click)="goToPage(filters.page - 1)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
                  Previous
                </button>

                <div class="page-nums">
                  @for (p of getPageRange(); track p) {
                    <button
                      class="page-num"
                      [class.active]="filters.page === p"
                      (click)="goToPage(p)"
                    >
                      {{ p + 1 }}
                    </button>
                  }
                </div>

                <button
                  class="page-btn"
                  [disabled]="filters.page >= totalPages() - 1"
                  (click)="goToPage(filters.page + 1)"
                >
                  Next
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </nav>
            }
          }
        </div>
      </section>

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

    .careers-page {
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
      padding: 6rem 1.5rem 8rem;
      overflow: hidden;
      text-align: center;
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
      height: 140%;
      transform: translateX(-50%);
      background: radial-gradient(ellipse, var(--brand-glow) 0%, transparent 70%);
      pointer-events: none;
    }
    .hero-glow-2 {
      position: absolute;
      bottom: -20%;
      right: -10%;
      width: 40%;
      height: 80%;
      background: radial-gradient(ellipse, rgba(6,182,212,0.08) 0%, transparent 70%);
      pointer-events: none;
    }

    .hero-inner {
      position: relative;
      max-width: 48rem;
      margin: 0 auto;
    }

    .hero-eyebrow {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--brand-light);
      margin-bottom: 1.5rem;
      padding: 0.35rem 1rem;
      border: 1px solid rgba(20,184,166,0.25);
      border-radius: 100px;
      animation: fadeDown 0.6s ease both;
    }

    .hero-title {
      font-family: 'DM Serif Display', Georgia, serif;
      font-size: clamp(2.5rem, 6vw, 4rem);
      line-height: 1.15;
      color: #f1f5f9;
      font-weight: 400;
      margin: 0 0 1.25rem;
      animation: fadeDown 0.6s ease 0.1s both;
    }
    .hero-title em {
      font-style: italic;
      color: var(--brand-light);
    }

    .hero-sub {
      font-size: 1.125rem;
      color: #94a3b8;
      margin: 0;
      animation: fadeDown 0.6s ease 0.2s both;
    }

    /* ─── Floating Search ─── */
    .search-float {
      position: relative;
      max-width: 52rem;
      margin: 2.5rem auto -2.5rem;
      padding: 0 1rem;
      z-index: 10;
      animation: fadeUp 0.6s ease 0.3s both;
    }

    .search-bar {
      display: flex;
      align-items: center;
      background: var(--card);
      border-radius: 16px;
      box-shadow:
        0 4px 6px -1px rgba(0,0,0,0.07),
        0 20px 50px -12px rgba(0,0,0,0.15),
        0 0 0 1px rgba(0,0,0,0.03);
      padding: 6px;
      gap: 0;
    }

    .search-field {
      flex: 1;
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      gap: 0.75rem;
    }

    .search-icon {
      width: 20px;
      height: 20px;
      color: var(--text-faint);
      flex-shrink: 0;
    }

    .search-field input {
      width: 100%;
      border: none;
      outline: none;
      background: transparent;
      font-family: inherit;
      font-size: 0.9375rem;
      color: var(--text);
    }
    .search-field input::placeholder { color: var(--text-faint); }

    .search-divider {
      width: 1px;
      height: 28px;
      background: var(--border);
      flex-shrink: 0;
    }

    .search-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.75rem;
      background: var(--brand);
      color: white;
      font-family: inherit;
      font-size: 0.9375rem;
      font-weight: 600;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: background 0.2s, transform 0.15s;
      flex-shrink: 0;
    }
    .search-btn svg { width: 18px; height: 18px; }
    .search-btn:hover { background: #0f766e; transform: translateY(-1px); }
    .search-btn:active { transform: translateY(0); }

    @media (max-width: 640px) {
      .search-bar { flex-direction: column; gap: 0; }
      .search-divider { width: 90%; height: 1px; margin: 0 auto; }
      .search-btn { width: 100%; justify-content: center; margin: 2px; }
      .search-btn span { display: inline; }
    }

    /* ─── Filter Bar ─── */
    .filters-section {
      background: var(--card);
      border-bottom: 1px solid var(--border);
      padding-top: 3.5rem;
      position: sticky;
      top: 0;
      z-index: 5;
    }

    .filters-inner {
      max-width: 64rem;
      margin: 0 auto;
      padding: 0 1.5rem 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .type-pills {
      display: flex;
      gap: 0.25rem;
      overflow-x: auto;
      padding-bottom: 0;
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .type-pills::-webkit-scrollbar { display: none; }

    .pill {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.625rem 1rem;
      font-family: inherit;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-muted);
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      white-space: nowrap;
      transition: color 0.2s, border-color 0.2s;
    }
    .pill:hover { color: var(--text); }
    .pill.active {
      color: var(--brand);
      border-bottom-color: var(--brand);
      font-weight: 600;
    }
    .pill-count {
      font-size: 0.7rem;
      background: var(--brand);
      color: white;
      padding: 1px 6px;
      border-radius: 100px;
      font-weight: 600;
    }

    .filter-controls {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding-bottom: 0.5rem;
    }

    .remote-toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      user-select: none;
    }
    .remote-toggle input { display: none; }
    .toggle-track {
      width: 36px;
      height: 20px;
      background: #cbd5e1;
      border-radius: 100px;
      position: relative;
      transition: background 0.2s;
    }
    .toggle-thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 16px;
      height: 16px;
      background: white;
      border-radius: 50%;
      transition: transform 0.2s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    }
    .remote-toggle input:checked ~ .toggle-track { background: var(--brand); }
    .remote-toggle input:checked ~ .toggle-track .toggle-thumb { transform: translateX(16px); }
    .toggle-label { font-size: 0.8125rem; color: var(--text-muted); font-weight: 500; }

    .filter-select {
      font-family: inherit;
      font-size: 0.8125rem;
      padding: 0.4rem 2rem 0.4rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text-muted);
      background: var(--card);
      cursor: pointer;
      outline: none;
      -webkit-appearance: none;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.5rem center;
      transition: border-color 0.15s;
    }
    .filter-select:focus { border-color: var(--brand); }

    @media (max-width: 768px) {
      .filters-inner { flex-direction: column; align-items: stretch; }
      .filter-controls { justify-content: flex-start; flex-wrap: wrap; }
    }

    /* ─── Results ─── */
    .results-section {
      padding: 2rem 1.5rem 4rem;
    }

    .results-inner {
      max-width: 64rem;
      margin: 0 auto;
    }

    .results-count {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-bottom: 1.25rem;
    }
    .results-count strong { color: var(--text); font-weight: 600; }

    /* ─── Skeleton ─── */
    .skeleton-grid { display: flex; flex-direction: column; gap: 1rem; }
    .skeleton-card {
      background: var(--card);
      border-radius: var(--radius);
      padding: 1.75rem;
      animation: shimmer 1.5s ease infinite;
    }
    .sk-line {
      height: 14px;
      background: #e2e8f0;
      border-radius: 6px;
      margin-bottom: 0.75rem;
    }
    .sk-w80 { width: 80%; }
    .sk-w60 { width: 60%; }
    .sk-w40 { width: 40%; }
    .sk-w30 { width: 30%; }
    .sk-tags { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
    .sk-tag { width: 60px; height: 24px; background: #e2e8f0; border-radius: 6px; }

    /* ─── Job Cards ─── */
    .jobs-list { display: flex; flex-direction: column; gap: 0.75rem; }

    .job-card {
      display: flex;
      align-items: stretch;
      background: var(--card);
      border-radius: var(--radius);
      border: 1px solid var(--border);
      overflow: hidden;
      text-decoration: none;
      color: inherit;
      transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
      opacity: 0;
      animation: cardIn 0.45s ease forwards;
      animation-delay: calc(var(--i, 0) * 60ms);
    }
    .job-card:hover {
      border-color: #cbd5e1;
      box-shadow: 0 8px 30px -8px rgba(0,0,0,0.08);
      transform: translateY(-2px);
    }

    .card-accent {
      width: 4px;
      flex-shrink: 0;
      background: var(--brand);
      border-radius: 0 4px 4px 0;
      opacity: 0;
      transition: opacity 0.25s;
    }
    .job-card:hover .card-accent { opacity: 1; }
    .card-accent[data-type="FULL_TIME"] { background: #0d9488; }
    .card-accent[data-type="PART_TIME"] { background: #3b82f6; }
    .card-accent[data-type="CONTRACT"] { background: #f59e0b; }
    .card-accent[data-type="TEMPORARY"] { background: #f97316; }
    .card-accent[data-type="INTERNSHIP"] { background: #8b5cf6; }

    .card-body {
      flex: 1;
      padding: 1.5rem 1.75rem;
      min-width: 0;
    }

    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      gap: 0.75rem;
    }

    .card-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; }

    .type-badge {
      display: inline-flex;
      align-items: center;
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      padding: 0.25rem 0.625rem;
      border-radius: 6px;
      text-transform: uppercase;
    }
    .type-badge[data-type="FULL_TIME"] { background: #f0fdfa; color: #0d9488; }
    .type-badge[data-type="PART_TIME"] { background: #eff6ff; color: #3b82f6; }
    .type-badge[data-type="CONTRACT"] { background: #fffbeb; color: #d97706; }
    .type-badge[data-type="TEMPORARY"] { background: #fff7ed; color: #ea580c; }
    .type-badge[data-type="INTERNSHIP"] { background: #f5f3ff; color: #7c3aed; }

    .remote-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 0.25rem 0.625rem;
      border-radius: 6px;
      background: #ecfdf5;
      color: #059669;
    }
    .badge-icon { width: 12px; height: 12px; }

    .posted-date {
      font-size: 0.75rem;
      color: var(--text-faint);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .job-title {
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text);
      margin: 0 0 0.5rem;
      line-height: 1.4;
      transition: color 0.2s;
    }
    .job-card:hover .job-title { color: var(--brand); }

    .job-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      color: var(--text-muted);
    }
    .meta-item svg { width: 15px; height: 15px; flex-shrink: 0; }
    .meta-item.salary { color: var(--text); font-weight: 600; }
    .salary-freq { font-weight: 400; color: var(--text-faint); }

    .job-excerpt {
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.6;
      margin: 0 0 0.75rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .skill-tags { display: flex; flex-wrap: wrap; gap: 0.375rem; }
    .skill-tag {
      font-size: 0.6875rem;
      font-weight: 500;
      padding: 0.2rem 0.5rem;
      border-radius: 5px;
      background: #f1f5f9;
      color: #475569;
      transition: background 0.15s, color 0.15s;
    }
    .job-card:hover .skill-tag { background: #e0f2fe; color: #0369a1; }

    .skill-more {
      font-size: 0.6875rem;
      color: var(--text-faint);
      padding: 0.2rem 0.375rem;
    }

    .card-arrow {
      display: flex;
      align-items: center;
      padding: 0 1.25rem;
      color: var(--border);
      flex-shrink: 0;
      transition: color 0.25s, transform 0.25s;
    }
    .card-arrow svg { width: 20px; height: 20px; }
    .job-card:hover .card-arrow { color: var(--brand); transform: translateX(4px); }

    @media (max-width: 640px) {
      .card-arrow { display: none; }
      .card-body { padding: 1.25rem; }
    }

    /* ─── Empty State ─── */
    .empty-state {
      text-align: center;
      padding: 5rem 2rem;
      background: var(--card);
      border-radius: var(--radius);
      border: 1px solid var(--border);
    }
    .empty-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 1.5rem;
      background: #f1f5f9;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .empty-icon svg { width: 28px; height: 28px; color: var(--text-faint); }
    .empty-state h3 { font-size: 1.125rem; font-weight: 600; margin: 0 0 0.5rem; }
    .empty-state p { color: var(--text-muted); font-size: 0.875rem; margin: 0 0 1.5rem; }
    .empty-btn {
      font-family: inherit;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--brand);
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      transition: background 0.15s;
    }
    .empty-btn:hover { background: #f0fdfa; }

    /* ─── Pagination ─── */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 2.5rem;
    }
    .page-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 1rem;
      font-family: inherit;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-muted);
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      transition: border-color 0.15s, color 0.15s;
    }
    .page-btn svg { width: 16px; height: 16px; }
    .page-btn:not(:disabled):hover { border-color: var(--brand); color: var(--brand); }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    .page-nums { display: flex; gap: 0.25rem; }
    .page-num {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: inherit;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-muted);
      background: transparent;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .page-num:hover { background: #f1f5f9; }
    .page-num.active {
      background: var(--brand);
      color: white;
      font-weight: 600;
    }

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
    }

    /* ─── Animations ─── */
    @keyframes fadeDown {
      from { opacity: 0; transform: translateY(-12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
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
export class CareersListComponent implements OnInit {
  careersService = inject(CareersService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(true);
  jobs = signal<PublicJobPosting[]>([]);
  totalJobs = signal(0);
  totalPages = signal(0);

  currentYear = new Date().getFullYear();

  filters: JobSearchFilters = {
    page: 0,
    size: 20,
    sortBy: 'postingDate',
    sortDirection: 'desc'
  };

  employmentTypes = [
    { value: 'FULL_TIME' as EmploymentType, label: 'Full-time' },
    { value: 'PART_TIME' as EmploymentType, label: 'Part-time' },
    { value: 'CONTRACT' as EmploymentType, label: 'Contract' },
    { value: 'TEMPORARY' as EmploymentType, label: 'Temporary' },
    { value: 'INTERNSHIP' as EmploymentType, label: 'Internship' },
  ];

  provinces = [
    { value: 'GAUTENG', label: 'Gauteng' },
    { value: 'WESTERN_CAPE', label: 'Western Cape' },
    { value: 'KWAZULU_NATAL', label: 'KwaZulu-Natal' },
    { value: 'EASTERN_CAPE', label: 'Eastern Cape' },
    { value: 'FREE_STATE', label: 'Free State' },
    { value: 'LIMPOPO', label: 'Limpopo' },
    { value: 'MPUMALANGA', label: 'Mpumalanga' },
    { value: 'NORTH_WEST', label: 'North West' },
    { value: 'NORTHERN_CAPE', label: 'Northern Cape' },
  ];

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['keyword']) this.filters.keyword = params['keyword'];
      if (params['location']) this.filters.location = params['location'];
      if (params['province']) this.filters.province = params['province'];
      if (params['type']) this.filters.employmentType = params['type'] as EmploymentType;
      if (params['remote']) this.filters.remote = params['remote'] === 'true';
      if (params['page']) this.filters.page = parseInt(params['page'], 10);
      this.loadJobs();
    });
  }

  loadJobs(): void {
    this.loading.set(true);
    this.careersService.searchJobs(this.filters).subscribe({
      next: (response) => {
        this.jobs.set(response.content);
        this.totalJobs.set(response.totalElements);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  search(): void {
    this.filters.page = 0;
    this.updateQueryParams();
    this.loadJobs();
  }

  setType(type: EmploymentType | undefined): void {
    this.filters.employmentType = type;
    this.search();
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.filters.page = page;
    this.updateQueryParams();
    this.loadJobs();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  clearFilters(): void {
    this.filters = {
      page: 0,
      size: 20,
      sortBy: 'postingDate',
      sortDirection: 'desc'
    };
    this.updateQueryParams();
    this.loadJobs();
  }

  getPageRange(): number[] {
    const total = this.totalPages();
    const current = this.filters.page;
    const range: number[] = [];
    const start = Math.max(0, current - 2);
    const end = Math.min(total - 1, current + 2);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  }

  private updateQueryParams(): void {
    const queryParams: any = {};
    if (this.filters.keyword) queryParams.keyword = this.filters.keyword;
    if (this.filters.location) queryParams.location = this.filters.location;
    if (this.filters.province) queryParams.province = this.filters.province;
    if (this.filters.employmentType) queryParams.type = this.filters.employmentType;
    if (this.filters.remote) queryParams.remote = 'true';
    if (this.filters.page > 0) queryParams.page = this.filters.page;
    this.router.navigate([], { queryParams, queryParamsHandling: 'merge' });
  }

}
