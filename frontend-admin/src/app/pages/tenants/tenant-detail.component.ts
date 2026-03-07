import { Component, OnInit, inject, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TenantService } from '@core/services/tenant.service';
import { BillingService } from '@core/services/billing.service';
import { TrialService } from '@core/services/trial.service';
import { Tenant, TenantActivity, TenantStatus } from '@core/models/tenant.model';
import { TenantDiscount, Discount } from '@core/models/billing.model';
import { BadgeComponent, BadgeColor } from '@core/components/ui/badge.component';
import { ButtonComponent } from '@core/components/ui/button.component';
import { ModalComponent } from '@core/components/ui/modal.component';
import { SelectComponent, SelectOption } from '@core/components/ui/select.component';
import { InputComponent } from '@core/components/ui/input.component';
import { ErrorStateComponent } from '@core/components/ui/error-state.component';
import { CurrencyZarPipe } from '@core/pipes/currency-zar.pipe';
import { RelativeTimePipe } from '@core/pipes/relative-time.pipe';

@Component({
  selector: 'app-tenant-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    BadgeComponent,
    ButtonComponent,
    ModalComponent,
    SelectComponent,
    InputComponent,
    ErrorStateComponent,
    CurrencyZarPipe,
    RelativeTimePipe
  ],
  template: `
    <div class="tenant-detail-page">
      <!-- Breadcrumb -->
      <nav class="breadcrumb animate-fade-in">
        <a routerLink="/tenants" class="breadcrumb-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Tenants
        </a>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-current">{{ tenant()?.companyName }}</span>
      </nav>

      @if (tenant(); as t) {
        <div class="tenant-layout">
          <!-- Main Content -->
          <div class="tenant-main">
            <!-- Header Card -->
            <div class="header-card animate-slide-up" style="animation-delay: 0.05s">
              <div class="header-top">
                <div class="title-block">
                  <h1 class="tenant-title">{{ t.companyName }}</h1>
                  <p class="tenant-meta">
                    Created {{ t.createdAt | relativeTime }} · <span class="meta-highlight">{{ t.email }}</span>
                  </p>
                </div>
                <div class="header-badges">
                  <app-badge [color]="getStatusColor(t.status)" size="lg">{{ formatStatus(t.status) }}</app-badge>
                  <app-badge [color]="getPlanColor(t.plan)" size="lg">{{ t.plan }}</app-badge>
                </div>
              </div>
              <div class="header-actions">
                <button class="header-action-btn" (click)="impersonate()">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  Impersonate
                </button>
                <button class="header-action-btn header-action-btn-primary" (click)="showStatusModal = true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Change Status
                </button>
              </div>
            </div>

            <!-- Company Information Card -->
            <div class="content-card animate-slide-up" style="animation-delay: 0.1s">
              <div class="card-header">
                <h2 class="card-title">Company Information</h2>
              </div>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Company Name</span>
                  <span class="detail-value">{{ t.companyName }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Email</span>
                  <span class="detail-value">{{ t.email }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Phone</span>
                  <span class="detail-value">{{ t.phone || 'Not provided' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Created</span>
                  <span class="detail-value">{{ t.createdAt | relativeTime }}</span>
                </div>
              </div>
            </div>

            <!-- Subscription Card -->
            <div class="content-card animate-slide-up" style="animation-delay: 0.15s">
              <div class="card-header">
                <h2 class="card-title">Subscription</h2>
              </div>
              <div class="subscription-grid">
                <div class="subscription-item">
                  <span class="detail-label">Plan</span>
                  <div class="subscription-badge">
                    <app-badge [color]="getPlanColor(t.plan)" size="lg">{{ t.plan }}</app-badge>
                  </div>
                </div>
                <div class="subscription-item">
                  <span class="detail-label">Status</span>
                  <div class="subscription-badge">
                    <app-badge [color]="getStatusColor(t.status)" size="lg">{{ formatStatus(t.status) }}</app-badge>
                  </div>
                </div>
                <div class="subscription-item revenue-item">
                  <span class="detail-label">MRR</span>
                  <span class="revenue-value">{{ t.mrr | currencyZar }}</span>
                </div>
                <div class="subscription-item revenue-item">
                  <span class="detail-label">ARR</span>
                  <span class="revenue-value">{{ (t.mrr * 12) | currencyZar }}</span>
                </div>
              </div>
              @if (t.trialEndsAt) {
                <div class="trial-notice">
                  <div class="trial-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                  </div>
                  <span>Trial ends {{ t.trialEndsAt | relativeTime }}</span>
                </div>
              }
              @if (discounts().length > 0) {
                <div class="discounts-section">
                  <span class="detail-label">Active Discounts</span>
                  <div class="discounts-list">
                    @for (discount of discounts(); track discount.id) {
                      <div class="discount-item">
                        <div class="discount-icon">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                            <line x1="7" y1="7" x2="7.01" y2="7"/>
                          </svg>
                        </div>
                        <span class="discount-code">{{ discount.discountCode }}</span>
                        <span class="discount-expiry">Expires {{ discount.expiresAt | relativeTime }}</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Usage Statistics Card -->
            <div class="content-card animate-slide-up" style="animation-delay: 0.2s">
              <div class="card-header">
                <h2 class="card-title">Usage Statistics</h2>
              </div>
              <div class="stats-row">
                <div class="stat-item">
                  <div class="stat-icon stat-icon-blue">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <span class="stat-value">{{ t.employeeCount }}</span>
                  <span class="stat-label">Employees</span>
                </div>
                <div class="stat-item">
                  <div class="stat-icon stat-icon-purple">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <span class="stat-value">{{ t.userCount }}</span>
                  <span class="stat-label">Users</span>
                </div>
                <div class="stat-item">
                  <div class="stat-icon stat-icon-teal">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                  </div>
                  <span class="stat-value">{{ t.healthScore || '-' }}<span class="stat-percent">%</span></span>
                  <span class="stat-label">Health Score</span>
                </div>
              </div>
            </div>

            <!-- Activity Timeline Card -->
            <div class="content-card animate-slide-up" style="animation-delay: 0.25s">
              <div class="card-header">
                <h2 class="card-title">Activity Timeline</h2>
                <span class="activity-count">{{ activities().length }} {{ activities().length === 1 ? 'event' : 'events' }}</span>
              </div>
              <div class="timeline-section">
                @for (activity of activities(); track activity.id; let isLast = $last) {
                  <div class="timeline-item">
                    <div class="timeline-connector">
                      <div class="timeline-dot" [class.timeline-dot-active]="$first"></div>
                      @if (!isLast) {
                        <div class="timeline-line"></div>
                      }
                    </div>
                    <div class="timeline-content">
                      <div class="timeline-header">
                        <span class="timeline-description">{{ activity.description }}</span>
                        <span class="timeline-time">{{ activity.createdAt | relativeTime }}</span>
                      </div>
                      @if (activity.userName) {
                        <span class="timeline-user">by {{ activity.userName }}</span>
                      }
                    </div>
                  </div>
                } @empty {
                  <div class="empty-timeline">
                    <div class="empty-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                      </svg>
                    </div>
                    <p>No activity recorded</p>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <aside class="tenant-sidebar">
            <!-- Quick Stats Card -->
            <div class="sidebar-card animate-slide-up" style="animation-delay: 0.1s">
              <h3 class="sidebar-card-title">Quick Stats</h3>
              <div class="details-list">
                <div class="sidebar-detail-item">
                  <span class="detail-label">Onboarding Stage</span>
                  <app-badge color="outline">{{ t.onboardingStage }}</app-badge>
                </div>
                <div class="sidebar-detail-item">
                  <span class="detail-label">Churn Risk</span>
                  @if (t.churnRisk) {
                    <app-badge [color]="getRiskColor(t.churnRisk)">{{ t.churnRisk }}</app-badge>
                  } @else {
                    <span class="detail-value-muted">-</span>
                  }
                </div>
                <div class="sidebar-detail-item">
                  <span class="detail-label">Last Updated</span>
                  <span class="detail-value">{{ t.updatedAt | relativeTime }}</span>
                </div>
              </div>
            </div>

            <!-- Quick Actions Card -->
            <div class="sidebar-card animate-slide-up" style="animation-delay: 0.15s">
              <h3 class="sidebar-card-title">Quick Actions</h3>
              <div class="actions-list">
                <button class="action-btn" (click)="sendVerificationReminder()">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Send Verification Email
                </button>
                <a class="action-btn" routerLink="/support" [queryParams]="{tenantId: t.id}">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  View Support Tickets
                </a>
                <button class="action-btn" (click)="showDiscountModal = true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                    <line x1="7" y1="7" x2="7.01" y2="7"/>
                  </svg>
                  Apply Discount
                </button>
                @if (t.status === 'TRIAL') {
                  <button class="action-btn action-btn-accent" (click)="showConvertModal = true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    Convert to Paid
                  </button>
                }
              </div>
            </div>
          </aside>
        </div>
      } @else {
        <div class="loading-state">
          <div class="spinner"></div>
        </div>
      }
    </div>

    <!-- Status Change Modal -->
    <app-modal
      [isOpen]="showStatusModal"
      title="Change Tenant Status"
      (close)="showStatusModal = false"
    >
      <div class="modal-content">
        <app-select
          label="New Status"
          [options]="statusOptions"
          [(ngModel)]="newStatus"
        />
        <p class="modal-hint">
          This will change the tenant's status and may affect their access to the platform.
        </p>
      </div>
      <div modal-footer class="modal-footer">
        <app-button variant="outline" (onClick)="showStatusModal = false">Cancel</app-button>
        <app-button (onClick)="updateStatus()">Update Status</app-button>
      </div>
    </app-modal>

    <!-- Convert to Paid Modal -->
    <app-modal
      [isOpen]="showConvertModal"
      title="Convert to Paid Plan"
      (close)="showConvertModal = false"
    >
      <div class="modal-content">
        <p class="modal-hint" style="margin-bottom: 1rem;">
          Convert <strong>{{ tenant()?.companyName }}</strong> from trial to a paid subscription.
        </p>
        <app-select
          label="Select Plan"
          [options]="planOptions"
          [(ngModel)]="selectedPlan"
        />
      </div>
      <div modal-footer class="modal-footer">
        <app-button variant="outline" (onClick)="showConvertModal = false">Cancel</app-button>
        <app-button variant="success" [loading]="converting()" (onClick)="convertToPaid()">Convert to Paid</app-button>
      </div>
    </app-modal>

    <!-- Apply Discount Modal -->
    <app-modal
      [isOpen]="showDiscountModal"
      title="Apply Discount"
      (close)="showDiscountModal = false"
    >
      <div class="modal-content">
        <p class="modal-hint" style="margin-bottom: 1rem;">
          Apply a discount to <strong>{{ tenant()?.companyName }}</strong>'s subscription.
        </p>
        @if (availableDiscounts().length > 0) {
          <app-select
            label="Select Discount"
            [options]="discountOptions()"
            [(ngModel)]="selectedDiscountId"
          />
        } @else {
          <p class="modal-hint">No active discounts available. Create a discount first.</p>
        }
      </div>
      <div modal-footer class="modal-footer">
        <app-button variant="outline" (onClick)="showDiscountModal = false">Cancel</app-button>
        <app-button
          [loading]="applyingDiscount()"
          [disabled]="!selectedDiscountId || availableDiscounts().length === 0"
          (onClick)="applyDiscount()"
        >
          Apply Discount
        </app-button>
      </div>
    </app-modal>
  `,
  styles: [`
    /* ========================================
       Page Container
       ======================================== */
    .tenant-detail-page {
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
       Breadcrumb
       ======================================== */
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .breadcrumb-link {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      color: var(--text-muted);
      text-decoration: none;
      transition: color 0.2s;
    }

    .breadcrumb-link:hover {
      color: var(--accent-color);
    }

    .breadcrumb-separator {
      color: var(--text-muted);
      opacity: 0.5;
    }

    .breadcrumb-current {
      color: var(--text-primary);
      font-weight: 500;
    }

    /* ========================================
       Layout
       ======================================== */
    .tenant-layout {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: 1fr;
    }

    @media (min-width: 1024px) {
      .tenant-layout {
        grid-template-columns: 1fr 340px;
        gap: 2rem;
      }
    }

    .tenant-main {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      min-width: 0;
    }

    /* ========================================
       Header Card
       ======================================== */
    .header-card {
      background: var(--surface-primary);
      border: 1px solid var(--surface-border);
      border-radius: 16px;
      padding: 1.75rem 2rem;
      box-shadow: var(--card-shadow);
      backdrop-filter: blur(12px);
    }

    .header-top {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    @media (min-width: 640px) {
      .header-top {
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-start;
      }
    }

    .title-block {
      flex: 1;
      min-width: 0;
    }

    .tenant-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
      line-height: 1.3;
      letter-spacing: -0.02em;
    }

    .tenant-meta {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin: 0;
    }

    .meta-highlight {
      color: var(--text-secondary);
      font-weight: 500;
    }

    .header-badges {
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .header-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      padding-top: 1rem;
      border-top: 1px solid var(--surface-border);
    }

    .header-action-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.125rem;
      border: 1px solid var(--surface-border);
      border-radius: 10px;
      background: var(--surface-secondary);
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .header-action-btn:hover {
      background: var(--surface-elevated);
      color: var(--text-primary);
      border-color: var(--surface-border-hover);
      transform: translateY(-1px);
    }

    .header-action-btn svg {
      flex-shrink: 0;
      opacity: 0.7;
    }

    .header-action-btn-primary {
      background: linear-gradient(135deg, var(--accent-color), var(--accent-light));
      border-color: transparent;
      color: white;
      box-shadow: 0 2px 8px var(--accent-glow);
    }

    .header-action-btn-primary:hover {
      box-shadow: 0 4px 16px var(--accent-glow);
      transform: translateY(-1px);
    }

    .header-action-btn-primary svg {
      opacity: 1;
    }

    /* ========================================
       Content Cards
       ======================================== */
    .content-card {
      background: var(--surface-primary);
      border: 1px solid var(--surface-border);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: var(--card-shadow);
      backdrop-filter: blur(12px);
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.75rem;
      border-bottom: 1px solid var(--surface-border);
      background: var(--table-header-bg);
    }

    .card-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .activity-count {
      font-size: 0.8125rem;
      color: var(--text-muted);
      background: var(--surface-secondary);
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
    }

    /* ========================================
       Detail Grid
       ======================================== */
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
      padding: 1.5rem 1.75rem;
    }

    @media (min-width: 640px) {
      .detail-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .detail-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .detail-value {
      font-size: 0.9375rem;
      color: var(--text-primary);
      font-weight: 500;
    }

    .detail-value-muted {
      font-size: 0.9375rem;
      color: var(--text-muted);
    }

    /* ========================================
       Subscription Grid
       ======================================== */
    .subscription-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      padding: 1.5rem 1.75rem;
    }

    .subscription-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .subscription-badge {
      margin-top: 0.25rem;
    }

    .revenue-item {
      padding: 1rem;
      background: var(--surface-secondary);
      border-radius: 12px;
    }

    .revenue-value {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }

    .trial-notice {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      margin: 0 1.75rem 1.5rem;
      padding: 1rem 1.25rem;
      background: var(--badge-warning-bg);
      border-radius: 12px;
      color: var(--badge-warning-text);
      font-size: 0.875rem;
      font-weight: 500;
    }

    .trial-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      background: rgba(245, 158, 11, 0.2);
      border-radius: 8px;
      flex-shrink: 0;
    }

    .discounts-section {
      padding: 1.25rem 1.75rem 1.5rem;
      border-top: 1px solid var(--surface-border);
    }

    .discounts-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }

    .discount-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: var(--badge-success-bg);
      border-radius: 10px;
    }

    .discount-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.75rem;
      height: 1.75rem;
      background: rgba(16, 185, 129, 0.2);
      border-radius: 6px;
      color: var(--badge-success-text);
      flex-shrink: 0;
    }

    .discount-code {
      flex: 1;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--badge-success-text);
    }

    .discount-expiry {
      font-size: 0.75rem;
      color: var(--badge-success-text);
      opacity: 0.8;
    }

    /* ========================================
       Stats Row
       ======================================== */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      padding: 1.5rem 1.75rem;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem 1rem;
      background: var(--surface-secondary);
      border-radius: 14px;
      text-align: center;
      transition: all 0.2s;
    }

    .stat-item:hover {
      background: var(--surface-elevated);
      transform: translateY(-2px);
    }

    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 12px;
      margin-bottom: 0.875rem;
    }

    .stat-icon-blue {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    .dark .stat-icon-blue {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
    }

    .stat-icon-purple {
      background: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
    }

    .dark .stat-icon-purple {
      background: rgba(139, 92, 246, 0.15);
      color: #a78bfa;
    }

    .stat-icon-teal {
      background: var(--accent-bg);
      color: var(--accent-color);
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
      letter-spacing: -0.02em;
    }

    .stat-percent {
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-secondary);
    }

    .stat-label {
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin-top: 0.375rem;
    }

    /* ========================================
       Timeline Section
       ======================================== */
    .timeline-section {
      padding: 1.5rem 1.75rem;
      max-height: 24rem;
      overflow-y: auto;
    }

    .timeline-item {
      display: flex;
      gap: 1rem;
      position: relative;
    }

    .timeline-connector {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 1rem;
      flex-shrink: 0;
    }

    .timeline-dot {
      width: 0.625rem;
      height: 0.625rem;
      border-radius: 50%;
      background: var(--surface-border);
      flex-shrink: 0;
      margin-top: 0.375rem;
    }

    .timeline-dot-active {
      background: var(--accent-color);
      box-shadow: 0 0 0 4px var(--accent-bg);
    }

    .timeline-line {
      flex: 1;
      width: 2px;
      background: var(--surface-border);
      margin: 0.5rem 0;
      min-height: 1.5rem;
    }

    .timeline-content {
      flex: 1;
      min-width: 0;
      padding-bottom: 1.25rem;
    }

    .timeline-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 0.25rem;
    }

    .timeline-description {
      font-size: 0.9375rem;
      color: var(--text-primary);
      font-weight: 500;
    }

    .timeline-time {
      font-size: 0.75rem;
      color: var(--text-muted);
      flex-shrink: 0;
      background: var(--surface-secondary);
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
    }

    .timeline-user {
      font-size: 0.8125rem;
      color: var(--text-secondary);
    }

    .empty-timeline {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      color: var(--text-muted);
      gap: 0.875rem;
    }

    .empty-icon {
      opacity: 0.3;
    }

    .empty-timeline p {
      margin: 0;
      font-size: 0.9375rem;
    }

    /* ========================================
       Sidebar
       ======================================== */
    .tenant-sidebar {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .sidebar-card {
      background: var(--surface-primary);
      border: 1px solid var(--surface-border);
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: var(--card-shadow);
      backdrop-filter: blur(12px);
    }

    .sidebar-card-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 1.25rem 0;
    }

    /* ========================================
       Details List
       ======================================== */
    .details-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .sidebar-detail-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--surface-border);
    }

    .sidebar-detail-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    /* ========================================
       Actions
       ======================================== */
    .actions-list {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid var(--surface-border);
      border-radius: 10px;
      background: var(--surface-secondary);
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: var(--surface-elevated);
      color: var(--text-primary);
      border-color: var(--surface-border-hover);
      transform: translateX(4px);
    }

    .action-btn svg {
      flex-shrink: 0;
      opacity: 0.6;
    }

    .action-btn:hover svg {
      opacity: 1;
    }

    .action-btn-accent {
      background: var(--accent-bg);
      border-color: transparent;
      color: var(--accent-color);
    }

    .action-btn-accent:hover {
      background: var(--accent-bg-hover);
      color: var(--accent-color);
    }

    .action-btn-accent svg {
      opacity: 1;
    }

    /* ========================================
       Loading State
       ======================================== */
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 20rem;
    }

    .spinner {
      width: 2.5rem;
      height: 2.5rem;
      border: 3px solid var(--surface-border);
      border-top-color: var(--accent-color);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    /* ========================================
       Modal
       ======================================== */
    .modal-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .modal-hint {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin: 0;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.25rem 1.5rem;
      border-top: 1px solid var(--surface-border);
    }
  `]
})
export class TenantDetailComponent implements OnInit {
  private tenantService = inject(TenantService);
  private billingService = inject(BillingService);
  private trialService = inject(TrialService);

  @Input() id!: string;

  tenant = signal<Tenant | null>(null);
  activities = signal<TenantActivity[]>([]);
  discounts = signal<TenantDiscount[]>([]);
  availableDiscounts = signal<Discount[]>([]);
  hasError = signal(false);
  errorMessage = signal('');

  showStatusModal = false;
  showDiscountModal = false;
  showConvertModal = false;
  newStatus: TenantStatus = 'ACTIVE';
  selectedPlan = 'PROFESSIONAL';
  selectedDiscountId = '';
  converting = signal(false);
  applyingDiscount = signal(false);

  statusOptions: SelectOption[] = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Suspended', value: 'SUSPENDED' },
    { label: 'Cancelled', value: 'CANCELLED' }
  ];

  planOptions: SelectOption[] = [
    { label: 'Starter - R500/mo', value: 'STARTER' },
    { label: 'Professional - R1,500/mo', value: 'PROFESSIONAL' },
    { label: 'Enterprise - R5,000/mo', value: 'ENTERPRISE' }
  ];

  discountOptions = () => [
    { label: 'Select a discount...', value: '' },
    ...this.availableDiscounts().map(d => ({
      label: `${d.code} - ${d.type === 'PERCENTAGE' ? d.value + '% off' : 'R' + d.value + ' off'}`,
      value: d.id
    }))
  ];

  ngOnInit(): void {
    this.loadTenant();
    this.loadActivities();
    this.loadDiscounts();
    this.loadAvailableDiscounts();
  }

  loadTenant(): void {
    this.hasError.set(false);
    this.tenantService.getTenantById(this.id).subscribe({
      next: (tenant) => {
        this.tenant.set(tenant);
        this.newStatus = tenant.status;
      },
      error: (err) => {
        this.hasError.set(true);
        this.errorMessage.set('Failed to load tenant details. Please try again.');
      }
    });
  }

  loadActivities(): void {
    this.tenantService.getTenantActivity(this.id).subscribe({
      next: (response) => this.activities.set(response.content),
      error: () => this.activities.set([])
    });
  }

  loadDiscounts(): void {
    this.billingService.getTenantDiscounts(this.id).subscribe({
      next: (discounts) => this.discounts.set(discounts),
      error: () => this.discounts.set([])
    });
  }

  loadAvailableDiscounts(): void {
    this.billingService.getDiscounts(0, 50).subscribe({
      next: (response) => this.availableDiscounts.set(response.content.filter(d => d.status === 'ACTIVE')),
      error: () => this.availableDiscounts.set([])
    });
  }

  convertToPaid(): void {
    if (!this.selectedPlan) return;
    this.converting.set(true);
    this.trialService.convertToPaid(this.id, this.selectedPlan).subscribe({
      next: (updatedTenant) => {
        this.tenant.set(updatedTenant);
        this.showConvertModal = false;
        this.converting.set(false);
      },
      error: () => this.converting.set(false)
    });
  }

  applyDiscount(): void {
    if (!this.selectedDiscountId) return;
    this.applyingDiscount.set(true);
    this.billingService.applyDiscountToTenant(this.selectedDiscountId, this.id).subscribe({
      next: (tenantDiscount) => {
        this.discounts.update(list => [...list, tenantDiscount]);
        this.showDiscountModal = false;
        this.selectedDiscountId = '';
        this.applyingDiscount.set(false);
      },
      error: () => this.applyingDiscount.set(false)
    });
  }

  retryLoad(): void {
    this.loadTenant();
    this.loadActivities();
    this.loadDiscounts();
    this.loadAvailableDiscounts();
  }

  updateStatus(): void {
    this.tenantService.updateTenantStatus(this.id, this.newStatus).subscribe({
      next: (updated) => {
        this.tenant.set(updated);
        this.showStatusModal = false;
      }
    });
  }

  impersonate(): void {
    this.tenantService.impersonateTenant(this.id).subscribe({
      next: (result) => {
        window.open(result.url, '_blank');
      }
    });
  }

  sendVerificationReminder(): void {
    this.tenantService.sendVerificationReminder(this.id).subscribe();
  }

  getStatusColor(status: TenantStatus): BadgeColor {
    const colors: Record<TenantStatus, BadgeColor> = {
      ACTIVE: 'success',
      TRIAL: 'warning',
      SUSPENDED: 'error',
      CANCELLED: 'gray',
      PENDING_VERIFICATION: 'outline'
    };
    return colors[status] || 'gray';
  }

  getPlanColor(plan: string): BadgeColor {
    const colors: Record<string, BadgeColor> = {
      STARTER: 'outline',
      PROFESSIONAL: 'gray',
      ENTERPRISE: 'gray',
      TRIAL: 'warning'
    };
    return colors[plan] || 'gray';
  }

  getRiskColor(risk: string): BadgeColor {
    const colors: Record<string, BadgeColor> = {
      LOW: 'success',
      MEDIUM: 'warning',
      HIGH: 'error'
    };
    return colors[risk] || 'gray';
  }

  formatStatus(status: TenantStatus): string {
    const labels: Record<TenantStatus, string> = {
      ACTIVE: 'Active',
      TRIAL: 'Trial',
      SUSPENDED: 'Suspended',
      CANCELLED: 'Cancelled',
      PENDING_VERIFICATION: 'Pending'
    };
    return labels[status] || status;
  }
}
