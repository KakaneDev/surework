import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Sidebar Page Object
 *
 * Test Case Coverage:
 * - TC-NAV-001: Sidebar displays correctly
 * - TC-NAV-002: Navigation links work
 * - TC-NAV-003: Active link highlighting
 * - TC-NAV-004: Collapsible sections work
 * - TC-NAV-005: Role-based menu items
 */
export class SidebarPage extends BasePage {
  // Locators
  readonly sidebar: Locator;
  readonly logo: Locator;
  readonly adminPortalBadge: Locator;

  // Navigation Links
  readonly dashboardLink: Locator;
  readonly tenantsLink: Locator;
  readonly onboardingLink: Locator;
  readonly trialsLink: Locator;
  readonly supportLink: Locator;
  readonly analyticsSection: Locator;
  readonly featureUsageLink: Locator;
  readonly churnAnalysisLink: Locator;
  readonly healthScoresLink: Locator;
  readonly billingSection: Locator;
  readonly revenueLink: Locator;
  readonly projectionsLink: Locator;
  readonly paymentsLink: Locator;
  readonly discountsLink: Locator;

  constructor(page: Page) {
    super(page);

    this.sidebar = page.locator('aside, nav[role="navigation"]');
    this.logo = page.locator('text=SureWork').first();
    this.adminPortalBadge = page.locator('text=Admin Portal').first();

    // Main Navigation
    this.dashboardLink = page.locator('a[href="/dashboard"], a:has-text("Dashboard")').first();
    this.tenantsLink = page.locator('a[href="/tenants"], a:has-text("Tenants")').first();
    this.onboardingLink = page.locator('a[href="/onboarding"], a:has-text("Onboarding")').first();
    this.trialsLink = page.locator('a[href="/trials"], a:has-text("Trials")').first();
    this.supportLink = page.locator('a[href="/support"], a:has-text("Support")').first();

    // Analytics Section
    this.analyticsSection = page.locator('text=Analytics').first();
    this.featureUsageLink = page.locator('a[href="/analytics/usage"], a:has-text("Feature Usage")').first();
    this.churnAnalysisLink = page.locator('a[href="/analytics/churn"], a:has-text("Churn Analysis")').first();
    this.healthScoresLink = page.locator('a[href="/analytics/health"], a:has-text("Health Scores")').first();

    // Billing Section
    this.billingSection = page.locator('text=Billing').first();
    this.revenueLink = page.locator('a[href="/billing/revenue"], a:has-text("Revenue")').first();
    this.projectionsLink = page.locator('a[href="/billing/projections"], a:has-text("Projections")').first();
    this.paymentsLink = page.locator('a[href="/billing/payments"], a:has-text("Payments")').first();
    this.discountsLink = page.locator('a[href="/discounts"], a:has-text("Discounts")').first();
  }

  /**
   * Verify sidebar is displayed
   */
  async assertSidebarDisplayed(): Promise<void> {
    await this.assertVisible(this.sidebar, 'Sidebar should be visible');
    await this.assertVisible(this.logo, 'Logo should be visible');
  }

  /**
   * Navigate to Dashboard
   */
  async goToDashboard(): Promise<void> {
    await this.safeClick(this.dashboardLink);
    await this.page.waitForURL('**/dashboard');
  }

  /**
   * Navigate to Tenants
   */
  async goToTenants(): Promise<void> {
    await this.safeClick(this.tenantsLink);
    await this.page.waitForURL('**/tenants');
  }

  /**
   * Navigate to Onboarding
   */
  async goToOnboarding(): Promise<void> {
    await this.safeClick(this.onboardingLink);
    await this.page.waitForURL('**/onboarding');
  }

  /**
   * Navigate to Trials
   */
  async goToTrials(): Promise<void> {
    await this.safeClick(this.trialsLink);
    await this.page.waitForURL('**/trials');
  }

  /**
   * Navigate to Support
   */
  async goToSupport(): Promise<void> {
    await this.safeClick(this.supportLink);
    await this.page.waitForURL('**/support');
  }

  /**
   * Expand Analytics section and navigate to Feature Usage
   */
  async goToFeatureUsage(): Promise<void> {
    if (await this.featureUsageLink.isHidden()) {
      await this.safeClick(this.analyticsSection);
    }
    await this.safeClick(this.featureUsageLink);
    await this.page.waitForURL('**/analytics/usage');
  }

  /**
   * Navigate to Churn Analysis
   */
  async goToChurnAnalysis(): Promise<void> {
    if (await this.churnAnalysisLink.isHidden()) {
      await this.safeClick(this.analyticsSection);
    }
    await this.safeClick(this.churnAnalysisLink);
    await this.page.waitForURL('**/analytics/churn');
  }

  /**
   * Navigate to Health Scores
   */
  async goToHealthScores(): Promise<void> {
    if (await this.healthScoresLink.isHidden()) {
      await this.safeClick(this.analyticsSection);
    }
    await this.safeClick(this.healthScoresLink);
    await this.page.waitForURL('**/analytics/health');
  }

  /**
   * Navigate to Revenue Dashboard
   */
  async goToRevenue(): Promise<void> {
    if (await this.revenueLink.isHidden()) {
      await this.safeClick(this.billingSection);
    }
    await this.safeClick(this.revenueLink);
    await this.page.waitForURL('**/billing/revenue');
  }

  /**
   * Navigate to Discounts
   */
  async goToDiscounts(): Promise<void> {
    await this.safeClick(this.discountsLink);
    await this.page.waitForURL('**/discounts');
  }

  /**
   * Check if a nav link is active
   */
  async isLinkActive(link: Locator): Promise<boolean> {
    const classes = (await link.getAttribute('class')) ?? '';
    return classes.includes('active') || classes.includes('bg-primary');
  }
}
