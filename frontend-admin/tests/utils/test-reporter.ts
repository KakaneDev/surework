import { Reporter, FullConfig, Suite, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Custom Test Reporter for SureWork Admin Dashboard
 *
 * Generates comprehensive test reports for developers and auditors.
 */
class SureWorkTestReporter implements Reporter {
  private results: TestResultEntry[] = [];
  private startTime: Date = new Date();
  private config?: FullConfig;

  onBegin(config: FullConfig, suite: Suite) {
    this.config = config;
    this.startTime = new Date();
    console.log(`\n🚀 SureWork Admin Dashboard E2E Tests Starting`);
    console.log(`   Projects: ${config.projects.map(p => p.name).join(', ')}`);
    console.log(`   Total Tests: ${suite.allTests().length}\n`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const entry: TestResultEntry = {
      testId: test.title.match(/TC-[\w-]+/)?.[0] || 'N/A',
      title: test.title,
      status: result.status,
      duration: result.duration,
      file: test.location.file,
      line: test.location.line,
      tags: test.tags,
      error: result.error?.message,
      retries: result.retry,
    };

    this.results.push(entry);

    // Console output
    const statusIcon = this.getStatusIcon(result.status);
    const duration = `(${result.duration}ms)`;
    console.log(`  ${statusIcon} ${entry.testId} - ${test.title} ${duration}`);

    if (result.error) {
      console.log(`     ❌ Error: ${result.error.message?.substring(0, 100)}...`);
    }
  }

  async onEnd(result: FullResult) {
    const endTime = new Date();
    const totalDuration = endTime.getTime() - this.startTime.getTime();

    // Calculate statistics
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const flaky = this.results.filter(r => r.retries > 0 && r.status === 'passed').length;

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST EXECUTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`   ✅ Passed:  ${passed}`);
    console.log(`   ❌ Failed:  ${failed}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   🔄 Flaky:   ${flaky}`);
    console.log(`   ⏱️  Duration: ${this.formatDuration(totalDuration)}`);
    console.log(`   📅 Completed: ${endTime.toISOString()}`);
    console.log('='.repeat(60) + '\n');

    // Generate reports
    await this.generateDeveloperReport(result, totalDuration);
    await this.generateAuditReport(result, totalDuration);
  }

  private async generateDeveloperReport(result: FullResult, duration: number) {
    const report: DeveloperReport = {
      summary: {
        status: result.status,
        duration,
        totalTests: this.results.length,
        passed: this.results.filter(r => r.status === 'passed').length,
        failed: this.results.filter(r => r.status === 'failed').length,
        skipped: this.results.filter(r => r.status === 'skipped').length,
        executionDate: new Date().toISOString(),
      },
      failedTests: this.results
        .filter(r => r.status === 'failed')
        .map(r => ({
          testId: r.testId,
          title: r.title,
          file: r.file,
          line: r.line,
          error: r.error || 'Unknown error',
          duration: r.duration,
        })),
      slowTests: this.results
        .filter(r => r.duration > 5000)
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10)
        .map(r => ({
          testId: r.testId,
          title: r.title,
          duration: r.duration,
        })),
      flakyTests: this.results
        .filter(r => r.retries > 0)
        .map(r => ({
          testId: r.testId,
          title: r.title,
          retries: r.retries,
        })),
      testsByTag: this.groupByTag(),
    };

    const reportDir = 'tests/reports/developer';
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(reportDir, `report-${Date.now()}.json`),
      JSON.stringify(report, null, 2)
    );

    console.log(`📝 Developer report generated: ${reportDir}/`);
  }

  private async generateAuditReport(result: FullResult, duration: number) {
    const report: AuditReport = {
      metadata: {
        reportId: `AUDIT-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        application: 'SureWork Admin Dashboard',
        version: '1.0.0',
        environment: process.env.CI ? 'CI/CD' : 'Local',
      },
      executionSummary: {
        status: result.status,
        totalDuration: duration,
        startTime: this.startTime.toISOString(),
        endTime: new Date().toISOString(),
      },
      testCoverage: {
        total: this.results.length,
        passed: this.results.filter(r => r.status === 'passed').length,
        failed: this.results.filter(r => r.status === 'failed').length,
        skipped: this.results.filter(r => r.status === 'skipped').length,
        passRate: (this.results.filter(r => r.status === 'passed').length / this.results.length * 100).toFixed(2) + '%',
      },
      testCases: this.results.map(r => ({
        testCaseId: r.testId,
        title: r.title,
        status: r.status,
        duration: r.duration,
        file: r.file,
        executedAt: new Date().toISOString(),
        tags: r.tags,
      })),
      defectsIdentified: this.results
        .filter(r => r.status === 'failed')
        .map(r => ({
          testCaseId: r.testId,
          description: r.error || 'Test failed',
          severity: this.determineSeverity(r.tags),
        })),
    };

    const reportDir = 'tests/reports/audit';
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(reportDir, `audit-report-${Date.now()}.json`),
      JSON.stringify(report, null, 2)
    );

    console.log(`📋 Audit report generated: ${reportDir}/`);
  }

  private getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      passed: '✅',
      failed: '❌',
      skipped: '⏭️',
      timedOut: '⏰',
      interrupted: '🛑',
    };
    return icons[status] || '❓';
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${seconds}s`;
  }

  private groupByTag(): Record<string, { passed: number; failed: number }> {
    const groups: Record<string, { passed: number; failed: number }> = {};

    this.results.forEach(r => {
      r.tags.forEach(tag => {
        if (!groups[tag]) {
          groups[tag] = { passed: 0, failed: 0 };
        }
        if (r.status === 'passed') {
          groups[tag].passed++;
        } else if (r.status === 'failed') {
          groups[tag].failed++;
        }
      });
    });

    return groups;
  }

  private determineSeverity(tags: string[]): string {
    if (tags.includes('@critical')) return 'Critical';
    if (tags.includes('@smoke')) return 'High';
    if (tags.includes('@regression')) return 'Medium';
    return 'Low';
  }
}

interface TestResultEntry {
  testId: string;
  title: string;
  status: string;
  duration: number;
  file: string;
  line: number;
  tags: string[];
  error?: string;
  retries: number;
}

interface DeveloperReport {
  summary: {
    status: string;
    duration: number;
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
    executionDate: string;
  };
  failedTests: Array<{
    testId: string;
    title: string;
    file: string;
    line: number;
    error: string;
    duration: number;
  }>;
  slowTests: Array<{
    testId: string;
    title: string;
    duration: number;
  }>;
  flakyTests: Array<{
    testId: string;
    title: string;
    retries: number;
  }>;
  testsByTag: Record<string, { passed: number; failed: number }>;
}

interface AuditReport {
  metadata: {
    reportId: string;
    generatedAt: string;
    application: string;
    version: string;
    environment: string;
  };
  executionSummary: {
    status: string;
    totalDuration: number;
    startTime: string;
    endTime: string;
  };
  testCoverage: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    passRate: string;
  };
  testCases: Array<{
    testCaseId: string;
    title: string;
    status: string;
    duration: number;
    file: string;
    executedAt: string;
    tags: string[];
  }>;
  defectsIdentified: Array<{
    testCaseId: string;
    description: string;
    severity: string;
  }>;
}

export default SureWorkTestReporter;
