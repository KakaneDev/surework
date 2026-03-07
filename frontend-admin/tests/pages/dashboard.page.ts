import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Dashboard Page Object
 *
 * Test Case Coverage:
 * - TC-DASH-001: Dashboard loads with KPI cards
 * - TC-DASH-002: Revenue chart displays correctly
 * - TC-DASH-003: Onboarding funnel chart displays
 * - TC-DASH-004: Activity feed shows recent activities
 * - TC-DASH-005: Quick actions navigation works
 * - TC-DASH-006: Export functionality
 * - TC-DASH-007: Refresh functionality
 */
export class DashboardPage extends BasePage {
  // Locators - Header
  readonly pageHeader: Locator;
  readonly welcomeMessage: Locator;
  readonly exportButton: Locator;
  readonly refreshButton: Locator;

  // Locators - KPI Stats
  readonly kpiCards: Locator;
  readonly totalTenantsCard: Locator;
  readonly activeTrialsCard: Locator;
  readonly mrrCard: Locator;
  readonly churnRateCard: Locator;

  // Locators - Charts
  readonly revenueChart: Locator;
  readonly onboardingFunnelChart: Locator;

  // Locators - Activity Feed
  readonly activityFeed: Locator;
  readonly activityItems: Locator;

  // Locators - Quick Actions
  readonly quickActionsCard: Locator;
  readonly viewTenantsLink: Locator;
  readonly supportTicketsLink: Locator;
  readonly trialManagementLink: Locator;
  readonly healthScoresLink: Locator;

  constructor(page: Page) {
    super(page);

    // Header
    this.pageHeader = page.locator('h1:has-text("Dashboard")');
    this.welcomeMessage = page.locator('text=Welcome back');
    this.exportButton = page.getByRole('button', { name: /export/i });
    this.refreshButton = page.getByRole('button', { name: /refresh/i });

    // KPI Stats
    this.kpiCards = page.locator('app-kpi-stats');
    this.totalTenantsCard = page.locator('app-kpi-stats:has-text("Total Tenants")');
    this.activeTrialsCard = page.locator('app-kpi-stats:has-text("Active Trials")');
    this.mrrCard = page.locator('app-kpi-stats:has-text("MRR")');
    this.churnRateCard = page.locator('app-kpi-stats:has-text("Churn Rate")');

    // Charts
    this.revenueChart = page.locator('app-revenue-chart');
    this.onboardingFunnelChart = page.locator('app-onboarding-funnel-chart');

    // Activity Feed
    this.activityFeed = page.locator('app-activity-feed');
    this.activityItems = page.locator('app-activity-feed >> .activity-item, app-activity-feed >> li');

    // Quick Actions
    this.quickActionsCard = page.locator('app-card:has-text("Quick Actions")');
    this.viewTenantsLink = page.getByRole('link', { name: /view tenants/i });
    this.supportTicketsLink = page.getByRole('link', { name: /support tickets/i });
    this.trialManagementLink = page.getByRole('link', { name: /trial management/i });
    this.healthScoresLink = page.getByRole('link', { name: /health scores/i });
  }

  /**
   * Navigate to the dashboard
   */
  async navigate(): Promise<void> {
    await this.page.goto('/dashboard');
    await this.waitForPageLoad();
  }

  /**
   * Verify the dashboard page is displayed correctly
   */
  async assertPageDisplayed(): Promise<void> {
    await this.assertVisible(this.pageHeader, 'Dashboard header should be visible');
    await this.assertVisible(this.welcomeMessage, 'Welcome message should be visible');
  }

  /**
   * Verify all KPI cards are displayed
   */
  async assertKpiCardsDisplayed(): Promise<void> {
    await expect(this.kpiCards).toHaveCount(4);
    await this.assertVisible(this.totalTenantsCard, 'Total Tenants card should be visible');
    await this.assertVisible(this.activeTrialsCard, 'Active Trials card should be visible');
    await this.assertVisible(this.mrrCard, 'MRR card should be visible');
    await this.assertVisible(this.churnRateCard, 'Churn Rate card should be visible');
  }

  /**
   * Get the value from a specific KPI card
   */
  async getKpiValue(kpiName: string): Promise<string> {
    const card = this.page.locator(`app-kpi-stats:has-text("${kpiName}")`);
    const valueElement = card.locator('.text-2xl, .font-bold').first();
    return this.getText(valueElement);
  }

  /**
   * Verify charts are displayed
   */
  async assertChartsDisplayed(): Promise<void> {
    await this.assertVisible(this.revenueChart, 'Revenue chart should be visible');
    await this.assertVisible(this.onboardingFunnelChart, 'Onboarding funnel chart should be visible');
  }

  /**
   * Verify activity feed is displayed with items
   */
  async assertActivityFeedDisplayed(): Promise<void> {
    await this.assertVisible(this.activityFeed, 'Activity feed should be visible');
  }

  /**
   * Get the number of activity items
   */
  async getActivityItemCount(): Promise<number> {
    return this.activityItems.count();
  }

  /**
   * Verify quick actions card is displayed
   */
  async assertQuickActionsDisplayed(): Promise<void> {
    await this.assertVisible(this.quickActionsCard, 'Quick actions card should be visible');
    await this.assertVisible(this.viewTenantsLink, 'View Tenants link should be visible');
    await this.assertVisible(this.supportTicketsLink, 'Support Tickets link should be visible');
  }

  /**
   * Click on View Tenants quick action
   */
  async clickViewTenants(): Promise<void> {
    await this.safeClick(this.viewTenantsLink);
    await this.page.waitForURL('**/tenants');
  }

  /**
   * Click on Support Tickets quick action
   */
  async clickSupportTickets(): Promise<void> {
    await this.safeClick(this.supportTicketsLink);
    await this.page.waitForURL('**/support');
  }

  /**
   * Click on Trial Management quick action
   */
  async clickTrialManagement(): Promise<void> {
    await this.safeClick(this.trialManagementLink);
    await this.page.waitForURL('**/trials');
  }

  /**
   * Click on Health Scores quick action
   */
  async clickHealthScores(): Promise<void> {
    await this.safeClick(this.healthScoresLink);
    await this.page.waitForURL('**/analytics/health');
  }

  /**
   * Click the export button
   */
  async clickExport(): Promise<void> {
    await this.safeClick(this.exportButton);
  }

  /**
   * Click the refresh button
   */
  async clickRefresh(): Promise<void> {
    await this.safeClick(this.refreshButton);
  }
}
