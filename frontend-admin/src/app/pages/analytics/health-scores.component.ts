import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AnalyticsService } from '@core/services/analytics.service';
import { TenantHealthScore } from '@core/models/analytics.model';
import { BadgeComponent, BadgeColor } from '@core/components/ui/badge.component';
import { SelectComponent, SelectOption } from '@core/components/ui/select.component';
import { PaginationComponent } from '@core/components/ui/pagination.component';

@Component({
  selector: 'app-health-scores',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BadgeComponent, SelectComponent, PaginationComponent],
  template: `
    <div class="health-scores-page">
      <!-- Header -->
      <div class="page-header animate-fade-in">
        <div class="header-content">
          <h1 class="page-title">Tenant Health Scores</h1>
          <p class="page-subtitle">Monitor tenant engagement and identify at-risk accounts</p>
        </div>
        <div class="header-actions">
          <app-select
            [options]="riskOptions"
            [(ngModel)]="selectedRisk"
            (ngModelChange)="loadData()"
          />
        </div>
      </div>

      <!-- Risk Summary Cards -->
      <div class="risk-summary animate-slide-up" style="animation-delay: 0.05s">
        <div class="risk-card risk-card-high" (click)="filterByRisk('HIGH')">
          <div class="risk-card-glow"></div>
          <div class="risk-card-content">
            <div class="risk-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <div class="risk-data">
              <span class="risk-count">{{ riskCounts().high }}</span>
              <span class="risk-label">High Risk</span>
            </div>
            <div class="risk-indicator">
              <span class="indicator-dot indicator-high"></span>
              <span class="indicator-text">Needs attention</span>
            </div>
          </div>
        </div>

        <div class="risk-card risk-card-medium" (click)="filterByRisk('MEDIUM')">
          <div class="risk-card-glow"></div>
          <div class="risk-card-content">
            <div class="risk-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4m0 4h.01"/>
              </svg>
            </div>
            <div class="risk-data">
              <span class="risk-count">{{ riskCounts().medium }}</span>
              <span class="risk-label">Medium Risk</span>
            </div>
            <div class="risk-indicator">
              <span class="indicator-dot indicator-medium"></span>
              <span class="indicator-text">Monitor closely</span>
            </div>
          </div>
        </div>

        <div class="risk-card risk-card-low" (click)="filterByRisk('LOW')">
          <div class="risk-card-glow"></div>
          <div class="risk-card-content">
            <div class="risk-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22,4 12,14.01 9,11.01"/>
              </svg>
            </div>
            <div class="risk-data">
              <span class="risk-count">{{ riskCounts().low }}</span>
              <span class="risk-label">Low Risk</span>
            </div>
            <div class="risk-indicator">
              <span class="indicator-dot indicator-low"></span>
              <span class="indicator-text">Healthy</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tenant Health List -->
      <div class="health-list-container animate-slide-up" style="animation-delay: 0.1s">
        <div class="list-header">
          <h2 class="list-title">All Tenants</h2>
          <span class="list-count">{{ totalElements() }} total</span>
        </div>

        <div class="health-list">
          @for (tenant of healthScores(); track tenant.tenantId; let i = $index) {
            <div class="tenant-row" [style.animation-delay]="(0.15 + i * 0.03) + 's'">
              <!-- Score Circle -->
              <div class="score-cell">
                <div class="score-ring" [class]="getScoreRingClass(tenant.score)">
                  <svg class="score-ring-bg" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3"
                      opacity="0.15"
                    />
                    <path
                      class="score-ring-progress"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3"
                      stroke-linecap="round"
                      [attr.stroke-dasharray]="tenant.score + ', 100'"
                    />
                  </svg>
                  <span class="score-value">{{ tenant.score }}</span>
                </div>
              </div>

              <!-- Tenant Info -->
              <div class="tenant-info">
                <a [routerLink]="['/tenants', tenant.tenantId]" class="tenant-name">
                  {{ tenant.tenantName }}
                </a>
                <div class="tenant-meta">
                  <app-badge [color]="getRiskColor(tenant.churnRisk)" size="sm">
                    {{ tenant.churnRisk }} Risk
                  </app-badge>
                  <span class="meta-separator">·</span>
                  <span class="update-time">Updated {{ tenant.calculatedAt }}</span>
                </div>
              </div>

              <!-- Health Factors -->
              <div class="factors-grid">
                @for (factor of tenant.factors; track factor.name) {
                  <div class="factor-item">
                    <div class="factor-header">
                      <span class="factor-name">{{ factor.name }}</span>
                      <span class="factor-score" [class]="getFactorScoreClass(factor.score)">{{ factor.score }}%</span>
                    </div>
                    <div class="factor-bar">
                      <div
                        class="factor-bar-fill"
                        [class]="getFactorBarClass(factor.score)"
                        [style.width.%]="factor.score"
                      ></div>
                    </div>
                  </div>
                }
              </div>

              <!-- Action -->
              <div class="row-action">
                <a [routerLink]="['/tenants', tenant.tenantId]" class="view-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </a>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <div class="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <p class="empty-text">No health scores available</p>
            </div>
          }
        </div>
      </div>

      <div class="pagination-wrapper animate-fade-in" style="animation-delay: 0.25s">
        <app-pagination
          [currentPage]="page"
          [pageSize]="size"
          [totalElements]="totalElements()"
          (pageChange)="onPageChange($event)"
        />
      </div>
    </div>
  `,
  styles: [`
    /* ========================================
       Page Container
       ======================================== */
    .health-scores-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Animations */
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out forwards;
    }

    .animate-slide-up {
      opacity: 0;
      animation: slideUp 0.4s ease-out forwards;
    }

    .tenant-row {
      opacity: 0;
      animation: slideUp 0.4s ease-out forwards;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* ========================================
       Header
       ======================================== */
    .page-header {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    @media (min-width: 640px) {
      .page-header {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }

    .header-content {
      flex: 1;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
      letter-spacing: -0.02em;
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin: 0.375rem 0 0 0;
    }

    .header-actions {
      flex-shrink: 0;
    }

    /* ========================================
       Risk Summary Cards
       ======================================== */
    .risk-summary {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    @media (min-width: 640px) {
      .risk-summary {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .risk-card {
      position: relative;
      background: var(--surface-primary);
      border: 1px solid var(--surface-border);
      border-radius: 16px;
      padding: 1.5rem;
      cursor: pointer;
      overflow: hidden;
      transition: all 0.3s ease;
      box-shadow: var(--card-shadow);
    }

    .risk-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--card-shadow-hover);
    }

    .risk-card-glow {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      border-radius: 16px 16px 0 0;
      opacity: 0;
      transition: opacity 0.3s;
    }

    .risk-card:hover .risk-card-glow {
      opacity: 1;
    }

    .risk-card-high .risk-card-glow {
      background: linear-gradient(90deg, #ef4444, #f87171);
    }

    .risk-card-medium .risk-card-glow {
      background: linear-gradient(90deg, #f59e0b, #fbbf24);
    }

    .risk-card-low .risk-card-glow {
      background: linear-gradient(90deg, #10b981, #34d399);
    }

    .risk-card-content {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .risk-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 3rem;
      height: 3rem;
      border-radius: 12px;
      transition: transform 0.3s;
    }

    .risk-card:hover .risk-icon {
      transform: scale(1.05);
    }

    .risk-card-high .risk-icon {
      background: var(--badge-error-bg);
      color: var(--badge-error-text);
    }

    .risk-card-medium .risk-icon {
      background: var(--badge-warning-bg);
      color: var(--badge-warning-text);
    }

    .risk-card-low .risk-icon {
      background: var(--badge-success-bg);
      color: var(--badge-success-text);
    }

    .risk-data {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .risk-count {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
      letter-spacing: -0.03em;
    }

    .risk-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .risk-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--surface-border);
    }

    .indicator-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .indicator-high {
      background: #ef4444;
      box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
    }

    .indicator-medium {
      background: #f59e0b;
      box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
    }

    .indicator-low {
      background: #10b981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
    }

    .indicator-text {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* ========================================
       Health List Container
       ======================================== */
    .health-list-container {
      background: var(--surface-primary);
      border: 1px solid var(--surface-border);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: var(--card-shadow);
    }

    .list-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--surface-border);
      background: var(--table-header-bg);
    }

    .list-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .list-count {
      font-size: 0.8125rem;
      color: var(--text-muted);
      background: var(--surface-secondary);
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
    }

    .health-list {
      display: flex;
      flex-direction: column;
    }

    /* ========================================
       Tenant Row
       ======================================== */
    .tenant-row {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--surface-border);
      transition: background 0.2s;
    }

    @media (min-width: 1024px) {
      .tenant-row {
        grid-template-columns: auto 200px 1fr auto;
        align-items: center;
        gap: 1.5rem;
      }
    }

    .tenant-row:last-child {
      border-bottom: none;
    }

    .tenant-row:hover {
      background: var(--table-row-hover);
    }

    /* Score Circle */
    .score-cell {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .score-ring {
      position: relative;
      width: 56px;
      height: 56px;
    }

    .score-ring-bg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .score-ring-progress {
      transition: stroke-dasharray 0.6s ease;
    }

    .score-ring.score-high {
      color: #10b981;
    }

    .score-ring.score-medium {
      color: #f59e0b;
    }

    .score-ring.score-low {
      color: #ef4444;
    }

    .score-value {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    /* Tenant Info */
    .tenant-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-width: 0;
    }

    .tenant-name {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--text-primary);
      text-decoration: none;
      transition: color 0.2s;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tenant-name:hover {
      color: var(--accent-color);
    }

    .tenant-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .meta-separator {
      color: var(--text-muted);
      opacity: 0.5;
    }

    .update-time {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* Factors Grid */
    .factors-grid {
      display: none;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    @media (min-width: 1024px) {
      .factors-grid {
        display: grid;
      }
    }

    .factor-item {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .factor-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .factor-name {
      font-size: 0.6875rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .factor-score {
      font-size: 0.8125rem;
      font-weight: 600;
    }

    .factor-score.score-high {
      color: var(--badge-success-text);
    }

    .factor-score.score-medium {
      color: var(--badge-warning-text);
    }

    .factor-score.score-low {
      color: var(--badge-error-text);
    }

    .factor-bar {
      height: 4px;
      background: var(--surface-secondary);
      border-radius: 2px;
      overflow: hidden;
    }

    .factor-bar-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.6s ease;
    }

    .factor-bar-fill.bar-high {
      background: linear-gradient(90deg, #10b981, #34d399);
    }

    .factor-bar-fill.bar-medium {
      background: linear-gradient(90deg, #f59e0b, #fbbf24);
    }

    .factor-bar-fill.bar-low {
      background: linear-gradient(90deg, #ef4444, #f87171);
    }

    /* Row Action */
    .row-action {
      display: none;
    }

    @media (min-width: 1024px) {
      .row-action {
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .view-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 10px;
      background: var(--surface-secondary);
      color: var(--text-muted);
      transition: all 0.2s;
    }

    .view-btn:hover {
      background: var(--accent-bg);
      color: var(--accent-color);
      transform: translateX(2px);
    }

    /* Mobile Factors (shown on smaller screens) */
    @media (max-width: 1023px) {
      .tenant-row {
        grid-template-columns: auto 1fr;
        grid-template-rows: auto auto;
      }

      .factors-grid {
        display: grid;
        grid-column: 1 / -1;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
        padding-top: 1rem;
        margin-top: 0.75rem;
        border-top: 1px solid var(--surface-border);
      }
    }

    /* ========================================
       Empty State
       ======================================== */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      gap: 1rem;
    }

    .empty-icon {
      color: var(--text-muted);
      opacity: 0.3;
    }

    .empty-text {
      font-size: 0.9375rem;
      color: var(--text-muted);
      margin: 0;
    }

    /* ========================================
       Pagination
       ======================================== */
    .pagination-wrapper {
      display: flex;
      justify-content: center;
    }
  `]
})
export class HealthScoresComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  healthScores = signal<TenantHealthScore[]>([]);
  totalElements = signal(0);
  riskCounts = signal({ high: 0, medium: 0, low: 0 });
  hasError = signal(false);
  errorMessage = signal('');

  page = 0;
  size = 10;
  selectedRisk = '';

  riskOptions: SelectOption[] = [
    { label: 'All Risk Levels', value: '' },
    { label: 'High Risk', value: 'HIGH' },
    { label: 'Medium Risk', value: 'MEDIUM' },
    { label: 'Low Risk', value: 'LOW' }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.hasError.set(false);
    this.analyticsService.getHealthScores(this.page, this.size, this.selectedRisk || undefined).subscribe({
      next: (response) => {
        this.healthScores.set(response.content);
        this.totalElements.set(response.totalElements);
        this.calculateRiskCounts();
      },
      error: () => {
        this.hasError.set(true);
        this.errorMessage.set('Failed to load health scores. Please try again.');
      }
    });
  }

  filterByRisk(risk: string): void {
    this.selectedRisk = this.selectedRisk === risk ? '' : risk;
    this.page = 0;
    this.loadData();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadData();
  }

  getScoreRingClass(score: number): string {
    if (score >= 70) return 'score-ring score-high';
    if (score >= 40) return 'score-ring score-medium';
    return 'score-ring score-low';
  }

  getFactorScoreClass(score: number): string {
    if (score >= 70) return 'score-high';
    if (score >= 40) return 'score-medium';
    return 'score-low';
  }

  getFactorBarClass(score: number): string {
    if (score >= 70) return 'factor-bar-fill bar-high';
    if (score >= 40) return 'factor-bar-fill bar-medium';
    return 'factor-bar-fill bar-low';
  }

  getRiskColor(risk: string): BadgeColor {
    const colors: Record<string, BadgeColor> = { HIGH: 'error', MEDIUM: 'warning', LOW: 'success' };
    return colors[risk] || 'gray';
  }

  private calculateRiskCounts(): void {
    const scores = this.healthScores();
    this.riskCounts.set({
      high: scores.filter(s => s.churnRisk === 'HIGH').length,
      medium: scores.filter(s => s.churnRisk === 'MEDIUM').length,
      low: scores.filter(s => s.churnRisk === 'LOW').length
    });
  }

  retryLoad(): void {
    this.loadData();
  }
}
