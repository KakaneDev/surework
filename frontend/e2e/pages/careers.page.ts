import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Public Careers Page
 * No authentication required - public facing job listings and applications
 */
export class CareersPage {
  readonly page: Page;

  // Hero Section
  readonly heroTitle: Locator;
  readonly heroSubtitle: Locator;
  readonly keywordSearchInput: Locator;
  readonly locationSearchInput: Locator;
  readonly searchButton: Locator;

  // Filters
  readonly employmentTypeFilter: Locator;
  readonly provinceFilter: Locator;
  readonly remoteCheckbox: Locator;
  readonly clearFiltersButton: Locator;

  // Job Listings
  readonly jobCards: Locator;
  readonly resultsCount: Locator;
  readonly sortBySelect: Locator;
  readonly emptyState: Locator;

  // Pagination
  readonly previousButton: Locator;
  readonly nextButton: Locator;
  readonly pageIndicator: Locator;

  // Job Detail
  readonly jobTitle: Locator;
  readonly jobLocation: Locator;
  readonly employmentTypeBadge: Locator;
  readonly remoteBadge: Locator;
  readonly salaryRange: Locator;
  readonly jobDescription: Locator;
  readonly jobRequirements: Locator;
  readonly jobResponsibilities: Locator;
  readonly skillsTags: Locator;
  readonly benefitsList: Locator;
  readonly backToJobsLink: Locator;

  // Application Form
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly linkedInUrlInput: Locator;
  readonly resumeFileInput: Locator;
  readonly coverLetterTextarea: Locator;
  readonly expectedSalaryInput: Locator;
  readonly noticePeriodSelect: Locator;
  readonly submitApplicationButton: Locator;

  // Application Success
  readonly applicationSuccessMessage: Locator;
  readonly applicationReference: Locator;

  // Footer
  readonly footer: Locator;

  constructor(page: Page) {
    this.page = page;

    // Hero Section
    this.heroTitle = page.locator('h1:has-text("Find Your Next Opportunity")');
    this.heroSubtitle = page.locator('text=/\\d+ jobs available/');
    this.keywordSearchInput = page.locator('input[placeholder*="Job title, keywords"]');
    this.locationSearchInput = page.locator('input[placeholder*="City or province"]');
    this.searchButton = page.locator('button:has-text("Search")');

    // Filters
    this.employmentTypeFilter = page.locator('select:has(option:has-text("All Types"))');
    this.provinceFilter = page.locator('select:has(option:has-text("All Provinces"))');
    this.remoteCheckbox = page.locator('label:has-text("Remote Only") input[type="checkbox"]');
    this.clearFiltersButton = page.locator('button:has-text("Clear Filters")');

    // Job Listings
    this.jobCards = page.locator('a[href*="/careers/jobs/"]');
    this.resultsCount = page.locator('text=/Showing \\d+ of \\d+ jobs/');
    this.sortBySelect = page.locator('select:has(option:has-text("Most Recent"))');
    this.emptyState = page.locator('text="No jobs found"');

    // Pagination
    this.previousButton = page.locator('button:has-text("Previous")');
    this.nextButton = page.locator('button:has-text("Next")');
    this.pageIndicator = page.locator('text=/Page \\d+ of \\d+/');

    // Job Detail
    this.jobTitle = page.locator('h1').first();
    this.jobLocation = page.locator('[class*="location"], text=/Johannesburg|Cape Town|Durban/i').first();
    this.employmentTypeBadge = page.locator('span:has-text("Full-time"), span:has-text("Part-time"), span:has-text("Contract")');
    this.remoteBadge = page.locator('span:has-text("Remote")');
    this.salaryRange = page.locator('text=/ZAR \\d+/');
    this.jobDescription = page.locator('h2:has-text("Job Description") + div, [class*="description"]');
    this.jobRequirements = page.locator('h2:has-text("Requirements") + div');
    this.jobResponsibilities = page.locator('h2:has-text("Responsibilities") + div');
    this.skillsTags = page.locator('[class*="skill"], span.rounded-full');
    this.benefitsList = page.locator('h2:has-text("Benefits") + ul li');
    this.backToJobsLink = page.locator('a:has-text("Back to Jobs")');

    // Application Form
    this.firstNameInput = page.locator('input[formcontrolname="firstName"], input[name="firstName"], label:has-text("First Name") + input');
    this.lastNameInput = page.locator('input[formcontrolname="lastName"], input[name="lastName"], label:has-text("Last Name") + input');
    this.emailInput = page.locator('input[formcontrolname="email"], input[name="email"], input[type="email"]');
    this.phoneInput = page.locator('input[formcontrolname="phone"], input[name="phone"], input[type="tel"]');
    this.linkedInUrlInput = page.locator('input[formcontrolname="linkedInUrl"], input[placeholder*="linkedin"]');
    this.resumeFileInput = page.locator('input[type="file"]');
    this.coverLetterTextarea = page.locator('textarea[formcontrolname="coverLetter"], textarea[name="coverLetter"]');
    this.expectedSalaryInput = page.locator('input[formcontrolname="expectedSalary"], input[name="expectedSalary"]');
    this.noticePeriodSelect = page.locator('select[formcontrolname="noticePeriod"], select[name="noticePeriod"]');
    this.submitApplicationButton = page.locator('button:has-text("Submit Application")');

    // Application Success
    this.applicationSuccessMessage = page.locator('text="Application Submitted"');
    this.applicationReference = page.locator('text=/Reference: APP-/');

    // Footer
    this.footer = page.locator('footer');
  }

  /**
   * Navigate to careers listing page
   */
  async navigateToCareersList(): Promise<void> {
    await this.page.goto('/careers');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to specific job detail page
   */
  async navigateToJobDetail(jobReference: string): Promise<void> {
    await this.page.goto(`/careers/jobs/${jobReference}`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Search for jobs by keyword
   */
  async searchByKeyword(keyword: string): Promise<void> {
    await this.keywordSearchInput.fill(keyword);
    await this.searchButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Search for jobs by location
   */
  async searchByLocation(location: string): Promise<void> {
    await this.locationSearchInput.fill(location);
    await this.searchButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Filter by employment type
   */
  async filterByEmploymentType(type: string): Promise<void> {
    await this.employmentTypeFilter.selectOption(type);
    await this.page.waitForTimeout(500);
  }

  /**
   * Filter by province
   */
  async filterByProvince(province: string): Promise<void> {
    await this.provinceFilter.selectOption(province);
    await this.page.waitForTimeout(500);
  }

  /**
   * Toggle remote only filter
   */
  async toggleRemoteOnly(): Promise<void> {
    await this.remoteCheckbox.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Clear all filters
   */
  async clearFilters(): Promise<void> {
    await this.clearFiltersButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Click on a job card by index
   */
  async clickJobCard(index: number = 0): Promise<void> {
    await this.jobCards.nth(index).click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get the number of job cards displayed
   */
  async getJobCardCount(): Promise<number> {
    return await this.jobCards.count();
  }

  /**
   * Fill in the application form
   */
  async fillApplicationForm(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    linkedInUrl?: string;
    coverLetter?: string;
    expectedSalary?: string;
    noticePeriod?: string;
  }): Promise<void> {
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.emailInput.fill(data.email);
    await this.phoneInput.fill(data.phone);

    if (data.linkedInUrl) {
      await this.linkedInUrlInput.fill(data.linkedInUrl);
    }
    if (data.coverLetter) {
      await this.coverLetterTextarea.fill(data.coverLetter);
    }
    if (data.expectedSalary) {
      await this.expectedSalaryInput.fill(data.expectedSalary);
    }
    if (data.noticePeriod) {
      await this.noticePeriodSelect.selectOption(data.noticePeriod);
    }
  }

  /**
   * Submit the application form
   */
  async submitApplication(): Promise<void> {
    await this.submitApplicationButton.click();
    await this.page.waitForTimeout(2000);
  }

  /**
   * Check if application was submitted successfully
   */
  async isApplicationSubmitted(): Promise<boolean> {
    return await this.applicationSuccessMessage.isVisible();
  }

  /**
   * Get the application reference number
   */
  async getApplicationReference(): Promise<string | null> {
    const referenceText = await this.applicationReference.textContent();
    if (referenceText) {
      const match = referenceText.match(/APP-[\w-]+/);
      return match ? match[0] : null;
    }
    return null;
  }

  /**
   * Go to next page of results
   */
  async goToNextPage(): Promise<void> {
    await this.nextButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Go to previous page of results
   */
  async goToPreviousPage(): Promise<void> {
    await this.previousButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Sort results by specified option
   */
  async sortBy(option: 'publishedAt' | 'title' | 'salaryMax'): Promise<void> {
    await this.sortBySelect.selectOption(option);
    await this.page.waitForTimeout(500);
  }

  /**
   * Check if the careers page has loaded successfully
   */
  async isPageLoaded(): Promise<boolean> {
    return await this.heroTitle.isVisible();
  }

  /**
   * Check if no jobs found message is displayed
   */
  async isEmptyStateDisplayed(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  /**
   * Get job card details by index
   */
  async getJobCardDetails(index: number): Promise<{
    title: string;
    location: string;
    type: string;
  }> {
    const card = this.jobCards.nth(index);
    const title = await card.locator('h3').first().textContent() || '';
    const location = await card.locator('[class*="location"]').first().textContent() || '';
    const type = await card.locator('span.rounded-full').first().textContent() || '';

    return { title, location, type };
  }
}
