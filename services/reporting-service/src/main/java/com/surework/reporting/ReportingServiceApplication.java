package com.surework.reporting;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Reporting and Analytics Service Application.
 *
 * Provides comprehensive business intelligence for South African SMEs:
 * - HR Analytics (headcount, turnover, demographics)
 * - Payroll Reports (statutory submissions, cost analysis)
 * - Leave Analytics (utilization, trends)
 * - Time & Attendance Reports
 * - Financial Summaries
 * - Compliance Reporting (BCEA, EEA, SARS)
 * - Custom Report Builder
 */
@SpringBootApplication(scanBasePackages = {
        "com.surework.reporting",
        "com.surework.common"
})
@EnableCaching
@EnableAsync
@EnableScheduling
@EnableFeignClients
public class ReportingServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ReportingServiceApplication.class, args);
    }
}
