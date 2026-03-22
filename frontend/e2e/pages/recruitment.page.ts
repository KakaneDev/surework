import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Recruitment Module
 * Provides reusable methods for recruitment E2E tests
 */
export class RecruitmentPage {
  readonly page: Page;

  // Navigation
  readonly backButton: Locator;
  readonly dashboardLink: Locator;

  // Dashboard elements
  readonly openJobsCard: Locator;
  readonly applicationsCard: Locator;
  readonly interviewsCard: Locator;
  readonly offersCard: Locator;
  readonly pipelineSection: Locator;
  readonly upcomingInterviews: Locator;
  readonly recentJobsTable: Locator;

  // Job posting form elements
  readonly jobTitleInput: Locator;
  readonly departmentInput: Locator;
  readonly locationInput: Locator;
  readonly employmentTypeSelect: Locator;
  readonly remoteCheckbox: Locator;
  readonly internalOnlyCheckbox: Locator;
  readonly descriptionTextarea: Locator;
  readonly requirementsTextarea: Locator;
  readonly responsibilitiesTextarea: Locator;
  readonly skillsTextarea: Locator;
  readonly experienceMinInput: Locator;
  readonly experienceMaxInput: Locator;
  readonly salaryMinInput: Locator;
  readonly salaryMaxInput: Locator;

  // External Portal Publishing section
  readonly publishToExternalCheckbox: Locator;
  readonly pnetCheckbox: Locator;
  readonly linkedInCheckbox: Locator;
  readonly indeedCheckbox: Locator;
  readonly careers24Checkbox: Locator;
  readonly cityInput: Locator;
  readonly provinceSelect: Locator;
  readonly postalCodeInput: Locator;
  readonly industrySelect: Locator;
  readonly educationLevelSelect: Locator;
  readonly companyMentionSelect: Locator;
  readonly keywordsInput: Locator;
  readonly contractDurationInput: Locator;

  // Action buttons
  readonly createJobButton: Locator;
  readonly saveAsDraftButton: Locator;
  readonly cancelButton: Locator;
  readonly postNewJobButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Navigation
    this.backButton = page.locator('a[routerlink="/recruitment"] span.material-icons:has-text("arrow_back")').first();
    this.dashboardLink = page.locator('a[routerlink="/recruitment"]').first();

    // Dashboard elements
    this.openJobsCard = page.locator('text=Open Jobs').first();
    this.applicationsCard = page.locator('text=Total Applications').first();
    this.interviewsCard = page.locator('text=Interviews This Week').first();
    this.offersCard = page.locator('text=Pending Offers').first();
    this.pipelineSection = page.locator('h3:has-text("Pipeline Overview")');
    this.upcomingInterviews = page.locator('h3:has-text("Upcoming Interviews")');
    this.recentJobsTable = page.locator('h3:has-text("Recent Job Postings")');

    // Job posting form - Basic fields
    this.jobTitleInput = page.locator('input[formcontrolname="title"]');
    this.departmentInput = page.locator('input[formcontrolname="departmentName"]');
    this.locationInput = page.locator('input[formcontrolname="location"]');
    this.employmentTypeSelect = page.locator('select[formcontrolname="employmentType"]');
    this.remoteCheckbox = page.locator('input[formcontrolname="remote"]');
    this.internalOnlyCheckbox = page.locator('input[formcontrolname="internalOnly"]');
    this.descriptionTextarea = page.locator('textarea[formcontrolname="description"]');
    this.requirementsTextarea = page.locator('textarea[formcontrolname="requirements"]');
    this.responsibilitiesTextarea = page.locator('textarea[formcontrolname="responsibilities"]');
    this.skillsTextarea = page.locator('textarea[formcontrolname="skills"]');
    this.experienceMinInput = page.locator('input[formcontrolname="experienceYearsMin"]');
    this.experienceMaxInput = page.locator('input[formcontrolname="experienceYearsMax"]');
    this.salaryMinInput = page.locator('input[formcontrolname="salaryMin"]');
    this.salaryMaxInput = page.locator('input[formcontrolname="salaryMax"]');

    // External Portal Publishing section
    this.publishToExternalCheckbox = page.locator('input[formcontrolname="publishToExternal"]');
    this.pnetCheckbox = page.locator('[data-portal="PNET"] input[type="checkbox"], input#portal-pnet');
    this.linkedInCheckbox = page.locator('[data-portal="LINKEDIN"] input[type="checkbox"], input#portal-linkedin');
    this.indeedCheckbox = page.locator('[data-portal="INDEED"] input[type="checkbox"], input#portal-indeed');
    this.careers24Checkbox = page.locator('[data-portal="CAREERS24"] input[type="checkbox"], input#portal-careers24');
    this.cityInput = page.locator('input[formcontrolname="city"]');
    this.provinceSelect = page.locator('select[formcontrolname="province"]');
    this.postalCodeInput = page.locator('input[formcontrolname="postalCode"]');
    this.industrySelect = page.locator('select[formcontrolname="industry"]');
    this.educationLevelSelect = page.locator('select[formcontrolname="educationLevel"]');
    this.companyMentionSelect = page.locator('select[formcontrolname="companyMentionPreference"]');
    this.keywordsInput = page.locator('input[formcontrolname="keywords"]');
    this.contractDurationInput = page.locator('input[formcontrolname="contractDuration"]');

    // Action buttons
    this.createJobButton = page.locator('button[type="submit"]:has-text("Create Job")');
    this.saveAsDraftButton = page.locator('button:has-text("Save as Draft")');
    this.cancelButton = page.locator('button:has-text("Cancel")');
    this.postNewJobButton = page.locator('a[routerlink="/recruitment/jobs/new"]:has-text("Post New Job")');
  }

  /**
   * Navigate to recruitment dashboard
   */
  async navigateToDashboard(): Promise<void> {
    await this.page.goto('/recruitment');
    await this.page.waitForTimeout(1500);
  }

  /**
   * Navigate to job postings list
   */
  async navigateToJobs(): Promise<void> {
    await this.page.goto('/recruitment/jobs');
    await this.waitForContentLoad();
  }

  /**
   * Navigate to create new job form
   */
  async navigateToNewJob(): Promise<void> {
    await this.page.goto('/recruitment/jobs/new');
    await this.waitForContentLoad();
  }

  /**
   * Wait for page content to load
   */
  async waitForContentLoad(): Promise<void> {
    await this.page.waitForSelector('sw-spinner', { state: 'hidden', timeout: 30000 }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  /**
   * Fill basic job information
   */
  async fillBasicInfo(data: {
    title: string;
    department?: string;
    location?: string;
    employmentType?: string;
    remote?: boolean;
    internalOnly?: boolean;
  }): Promise<void> {
    await this.jobTitleInput.fill(data.title);

    if (data.department) {
      await this.departmentInput.fill(data.department);
    }
    if (data.location) {
      await this.locationInput.fill(data.location);
    }
    if (data.employmentType) {
      await this.employmentTypeSelect.selectOption(data.employmentType);
    }
    if (data.remote) {
      await this.remoteCheckbox.check();
    }
    if (data.internalOnly) {
      await this.internalOnlyCheckbox.check();
    }
  }

  /**
   * Fill job description section
   */
  async fillJobDescription(data: {
    description: string;
    requirements?: string;
    responsibilities?: string;
    skills?: string;
  }): Promise<void> {
    await this.descriptionTextarea.fill(data.description);

    if (data.requirements) {
      await this.requirementsTextarea.fill(data.requirements);
    }
    if (data.responsibilities) {
      await this.responsibilitiesTextarea.fill(data.responsibilities);
    }
    if (data.skills) {
      await this.skillsTextarea.fill(data.skills);
    }
  }

  /**
   * Fill experience and compensation section
   */
  async fillExperienceCompensation(data: {
    experienceMin?: string;
    experienceMax?: string;
    salaryMin?: string;
    salaryMax?: string;
  }): Promise<void> {
    if (data.experienceMin) {
      await this.experienceMinInput.fill(data.experienceMin);
    }
    if (data.experienceMax) {
      await this.experienceMaxInput.fill(data.experienceMax);
    }
    if (data.salaryMin) {
      await this.salaryMinInput.fill(data.salaryMin);
    }
    if (data.salaryMax) {
      await this.salaryMaxInput.fill(data.salaryMax);
    }
  }

  /**
   * Enable external portal publishing
   */
  async enableExternalPublishing(): Promise<void> {
    if (!await this.publishToExternalCheckbox.isChecked()) {
      await this.publishToExternalCheckbox.check();
    }
    // Wait for external portal section to be visible
    await this.page.waitForTimeout(500);
  }

  /**
   * Select external portals to publish to
   */
  async selectExternalPortals(portals: ('PNET' | 'LINKEDIN' | 'INDEED' | 'CAREERS24')[]): Promise<void> {
    for (const portal of portals) {
      const checkbox = this.page.locator(`[data-portal="${portal}"] input[type="checkbox"], label:has-text("${portal.charAt(0) + portal.slice(1).toLowerCase()}") input[type="checkbox"]`).first();
      if (await checkbox.isVisible()) {
        await checkbox.check();
      }
    }
  }

  /**
   * Fill external portal location details
   */
  async fillExternalLocationDetails(data: {
    city: string;
    province: string;
    postalCode?: string;
  }): Promise<void> {
    await this.cityInput.fill(data.city);
    await this.provinceSelect.selectOption(data.province);

    if (data.postalCode) {
      await this.postalCodeInput.fill(data.postalCode);
    }
  }

  /**
   * Fill external portal additional fields
   */
  async fillExternalAdditionalFields(data: {
    industry?: string;
    educationLevel?: string;
    companyMention?: string;
    keywords?: string;
    contractDuration?: string;
  }): Promise<void> {
    if (data.industry) {
      await this.industrySelect.selectOption(data.industry);
    }
    if (data.educationLevel) {
      await this.educationLevelSelect.selectOption(data.educationLevel);
    }
    if (data.companyMention) {
      await this.companyMentionSelect.selectOption(data.companyMention);
    }
    if (data.keywords) {
      await this.keywordsInput.fill(data.keywords);
    }
    if (data.contractDuration) {
      await this.contractDurationInput.fill(data.contractDuration);
    }
  }

  /**
   * Create a complete job posting with external portal publishing
   */
  async createJobWithExternalPublishing(data: {
    title: string;
    department: string;
    location: string;
    employmentType: string;
    description: string;
    city: string;
    province: string;
    industry: string;
    portals: ('PNET' | 'LINKEDIN' | 'INDEED' | 'CAREERS24')[];
  }): Promise<void> {
    await this.fillBasicInfo({
      title: data.title,
      department: data.department,
      location: data.location,
      employmentType: data.employmentType
    });

    await this.fillJobDescription({
      description: data.description
    });

    await this.enableExternalPublishing();
    await this.selectExternalPortals(data.portals);
    await this.fillExternalLocationDetails({
      city: data.city,
      province: data.province
    });
    await this.fillExternalAdditionalFields({
      industry: data.industry
    });
  }

  /**
   * Submit the job posting form
   */
  async submitJob(): Promise<void> {
    await this.createJobButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Save job as draft
   */
  async saveAsDraft(): Promise<void> {
    await this.saveAsDraftButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Check if external portal section is visible
   */
  async isExternalPortalSectionVisible(): Promise<boolean> {
    const section = this.page.locator('text=External Portal Publishing').first();
    return section.isVisible();
  }

  /**
   * Get selected portals
   */
  async getSelectedPortals(): Promise<string[]> {
    const portals: string[] = [];
    const portalNames = ['PNET', 'LINKEDIN', 'INDEED', 'CAREERS24'];

    for (const portal of portalNames) {
      const checkbox = this.page.locator(`[data-portal="${portal}"] input[type="checkbox"]`).first();
      if (await checkbox.isVisible() && await checkbox.isChecked()) {
        portals.push(portal);
      }
    }

    return portals;
  }
}
