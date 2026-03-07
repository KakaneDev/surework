# SureWork Reports Analysis - Data Engineering Assessment

## Executive Summary

Based on analysis of the 11 microservices and their database schemas, SureWork has a **robust data foundation** capable of generating **70+ distinct reports** across 9 categories. The reporting-service already defines 31 report types, but the actual data available supports significantly more.

---

## Current State: Reports Infrastructure

### What's Already Built
- **Reporting Service**: Full backend with 31 report types defined
- **Frontend**: Placeholder components (HR, Financial, Recruitment marked "Coming Soon")
- **Dashboard System**: 22 widget types, 42 data sources, 5 pre-built templates

### What's Missing
- Frontend implementations for the report viewers
- Some cross-service data aggregation queries
- Real-time data feeds from some services

---

## Reports That Can Be Generated (By Data Availability)

### 1. HR REPORTS (14 Reports)

| Report | Data Source | Complexity | Business Value |
|--------|-------------|------------|----------------|
| **Headcount Summary** | employees, departments | Low | High |
| **Employee Directory** | employees, departments, job_titles | Low | Medium |
| **Demographics Analysis** | employees (gender, age, marital_status) | Medium | High |
| **Turnover Report** | employees (termination_date, hire_date) | Medium | Critical |
| **New Hires Report** | employees (hire_date filter) | Low | Medium |
| **Terminations Report** | employees (termination_date) | Low | Medium |
| **Probation Status** | employees (hire_date + 3 months) | Low | High |
| **Birthday/Anniversary Report** | employees (date_of_birth, hire_date) | Low | Low |
| **Skills Matrix** | employees (requires skills column addition) | High | High |
| **Training Summary** | (requires training module) | N/A | High |
| **Department Breakdown** | employees + departments | Low | Medium |
| **Manager Span of Control** | employees (manager_id relationships) | Medium | Medium |
| **Employee Status Distribution** | employees (status field) | Low | Medium |
| **Employment Type Analysis** | employees (employment_type) | Low | Medium |

**Key Metrics Available:**
- Total employees by status, department, job title
- Gender distribution, age brackets
- Tenure analysis (years of service)
- Reporting hierarchy depth

---

### 2. PAYROLL REPORTS (12 Reports)

| Report | Data Source | Complexity | Business Value |
|--------|-------------|------------|----------------|
| **Payroll Register** | payslips, payslip_lines | Low | Critical |
| **Payroll Summary** | payroll_runs | Low | Critical |
| **Payslip Batch** | payslips (per run) | Low | High |
| **PAYE Summary** | payslips (paye column) | Low | Critical |
| **UIF Summary** | payslips (uif_employee, uif_employer) | Low | Critical |
| **Cost to Company** | payslips (total_employer_cost) | Medium | High |
| **Payroll Variance** | payroll_runs (compare periods) | Medium | High |
| **Year-to-Date Summary** | payslips (ytd_* columns) | Low | High |
| **Department Payroll Cost** | payslips + employees.department | Medium | High |
| **Salary Distribution** | employees (basic_salary) | Low | Medium |
| **Deductions Summary** | payslip_lines (by type) | Low | Medium |
| **Payroll Journal** | payslips -> journal_entries | High | Critical |

**Key Metrics Available:**
- Gross earnings, net pay, total deductions
- PAYE, UIF (employee + employer), SDL
- YTD totals for all categories
- Employer costs breakdown

---

### 3. STATUTORY REPORTS - South Africa (7 Reports)

| Report | Data Source | Complexity | Compliance |
|--------|-------------|------------|------------|
| **EMP201** (Monthly PAYE/UIF/SDL) | payslips, tax_tables | High | SARS Required |
| **EMP501** (Bi-annual Reconciliation) | payslips (6-month aggregation) | High | SARS Required |
| **UI19** (UIF Certificate) | payslips, employees | Medium | DoL Required |
| **IRP5/IT3(a)** (Tax Certificate) | payslips (annual) | High | SARS Required |
| **EEA2** (Employment Equity) | employees (demographics) | Medium | DoL Required |
| **EEA4** (Income Differentials) | employees + salaries | High | DoL Required |
| **WSP/ATR** (Skills Development) | (requires training data) | N/A | SETA Required |

**Data Readiness:**
- EMP201, EMP501, IRP5: **Ready** - all payroll data available
- UI19: **Ready** - employee + UIF contribution data exists
- EEA2, EEA4: **Partial** - need race/disability fields in employees table

---

### 4. LEAVE REPORTS (8 Reports)

| Report | Data Source | Complexity | Business Value |
|--------|-------------|------------|----------------|
| **Leave Balance Summary** | leave_balances | Low | High |
| **Leave Utilization** | leave_requests (approved) | Medium | High |
| **Leave Liability** | leave_balances (available * daily_rate) | Medium | Critical |
| **Sick Leave Analysis** | leave_requests (type=SICK) | Medium | High |
| **Absence Trends** | leave_requests (by month/quarter) | Medium | Medium |
| **Pending Approvals** | leave_requests (status=PENDING) | Low | Medium |
| **Leave Calendar** | leave_requests (date ranges) | Low | Medium |
| **BCEA Compliance** | leave_balances vs statutory minimums | High | Critical |

**Key Metrics Available:**
- Entitlement, used, pending, carried over
- Leave by type (Annual, Sick, Family, Maternity, etc.)
- 36-month sick leave cycle tracking
- Monetary value of leave liability

---

### 5. TIME & ATTENDANCE REPORTS (10 Reports)

| Report | Data Source | Complexity | Business Value |
|--------|-------------|------------|----------------|
| **Attendance Summary** | time_entries | Low | High |
| **Timesheet Report** | timesheets | Low | High |
| **Overtime Analysis** | time_entries (overtime_hours) | Medium | Critical |
| **Late Arrivals** | time_entries (is_late, late_minutes) | Low | Medium |
| **Early Departures** | time_entries (is_early_departure) | Low | Medium |
| **Night Shift Hours** | time_entries (night_hours) | Low | Medium |
| **Sunday/Public Holiday Work** | time_entries (sunday_hours, public_holiday_hours) | Low | High |
| **Clock Method Analysis** | time_entries (clock_method) | Low | Low |
| **Location Compliance** | time_entries (clock_in/out coordinates) | Medium | Medium |
| **BCEA Hours Compliance** | timesheets vs 45hr/week limit | High | Critical |

**Key Metrics Available:**
- Regular, overtime, night, Sunday, public holiday hours
- Late/early patterns
- Geolocation data for remote work tracking
- BCEA Section 9-18 compliance data

---

### 6. RECRUITMENT REPORTS (10 Reports)

| Report | Data Source | Complexity | Business Value |
|--------|-------------|------------|----------------|
| **Recruitment Pipeline** | applications (by stage) | Low | High |
| **Time to Hire** | applications (date calculations) | Medium | Critical |
| **Source Effectiveness** | applications (source field) | Medium | High |
| **Offer Acceptance Rate** | applications (offer status) | Medium | High |
| **Job Posting Performance** | job_postings (application_count, view_count) | Low | Medium |
| **Candidate Pool Analysis** | candidates (by status, skills) | Medium | Medium |
| **Interview Schedule** | interviews (scheduled_at) | Low | Medium |
| **Interviewer Feedback Summary** | interviews (ratings) | Medium | High |
| **Talent Pool Report** | talent_pool | Low | Medium |
| **Recruitment Event ROI** | recruitment_events (candidates_sourced vs budget) | High | High |

**Key Metrics Available:**
- Applications per stage (NEW -> HIRED funnel)
- Days in each stage
- Conversion rates
- Interview ratings (technical, communication, cultural fit)
- Cost per hire (from events)

---

### 7. FINANCIAL REPORTS (8 Reports)

| Report | Data Source | Complexity | Business Value |
|--------|-------------|------------|----------------|
| **Labor Cost Analysis** | payslips (total_employer_cost) | Medium | Critical |
| **Department Budget vs Actual** | payslips + departments | High | High |
| **Headcount Forecast** | employees (trend analysis) | High | High |
| **Trial Balance** | accounts (current_balance) | Low | Critical |
| **Income Statement** | accounts (REVENUE - EXPENSE) | Medium | Critical |
| **Balance Sheet** | accounts (ASSET, LIABILITY, EQUITY) | Medium | Critical |
| **VAT Report** | journal_entry_lines (vat_amount) | Medium | Critical |
| **Journal Entry Report** | journal_entries | Low | Medium |

**Key Metrics Available:**
- Full double-entry accounting
- VAT categories (Standard, Zero-rated, Exempt)
- Fiscal period controls
- YTD debit/credit tracking

---

### 8. SUPPORT/HELPDESK REPORTS (6 Reports)

| Report | Data Source | Complexity | Business Value |
|--------|-------------|------------|----------------|
| **Ticket Volume** | tickets (by period) | Low | Medium |
| **Resolution Time** | tickets (created_at -> resolved_at) | Medium | High |
| **SLA Compliance** | tickets (sla_deadline vs resolved_at) | Medium | High |
| **Category Distribution** | tickets + ticket_categories | Low | Medium |
| **Agent Performance** | tickets (assigned_user_id + resolution) | Medium | Medium |
| **Requester Analysis** | tickets (requester_user_id) | Low | Low |

---

### 9. COMPLIANCE & AUDIT REPORTS (5 Reports)

| Report | Data Source | Complexity | Business Value |
|--------|-------------|------------|----------------|
| **User Activity Audit** | audit_logs | Low | Critical |
| **Document Retention Compliance** | documents (retention_until) | Medium | High |
| **Access Log Report** | document_access_logs, report_access_logs | Low | Medium |
| **Session History** | user_sessions | Low | Medium |
| **Permission Matrix** | users + roles + permissions | Medium | High |

---

## Recommended Priority for Implementation

### Phase 1: Critical (Statutory Compliance)
1. **EMP201** - Monthly PAYE submission
2. **IRP5/IT3(a)** - Annual tax certificates
3. **Payroll Register** - Audit requirement
4. **Leave Liability** - Financial reporting

### Phase 2: High Value (Operations)
1. **Headcount Summary** - Executive dashboards
2. **Attendance Summary** - Operational management
3. **Recruitment Pipeline** - Hiring visibility
4. **Overtime Analysis** - Cost control

### Phase 3: Analytics (Insights)
1. **Turnover Report** - Retention strategy
2. **Time to Hire** - Process optimization
3. **Demographic Analysis** - EE planning
4. **Labor Cost Analysis** - Budget planning

---

## Data Gaps Identified

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| Race/Disability in employees | EEA2/EEA4 reports | Add columns to employees table |
| Training records | WSP/ATR reports | New training module needed |
| Skills inventory | Skills matrix report | Add skills table linked to employees |
| Cost center mapping | Departmental costing | Add cost_center to employees |
| Performance ratings | Performance reports | New performance module needed |

---

## Technical Recommendations

1. **Cross-Service Aggregation**: Create materialized views in reporting-service that pull from multiple service databases

2. **Real-time Dashboards**: Implement CDC (Change Data Capture) for critical metrics

3. **Export Formats**: All reports should support PDF, Excel, CSV (already in place)

4. **Scheduled Reports**: Leverage existing report_schedules infrastructure

5. **Data Warehouse**: Consider ETL pipeline for historical analytics

---

## Summary

**Total Reportable Metrics: 70+ distinct reports**
- 14 HR Reports
- 12 Payroll Reports
- 7 Statutory Reports
- 8 Leave Reports
- 10 Time & Attendance Reports
- 10 Recruitment Reports
- 8 Financial Reports
- 6 Support Reports
- 5 Compliance Reports

**Data Readiness: 85%** - Most critical data is already captured in your schemas. The main gaps are around employment equity demographics and training/skills management.

---

# PART 2: DETAILED TECHNICAL ANALYSIS

## Cross-Service Data Model

### Service-to-Database Mapping

| Service | Database | Port | Key Tables |
|---------|----------|------|------------|
| employee-service | surework_employees | 8086 | employees, departments |
| payroll-service | surework_payroll | 8082 | payroll_runs, payslips, payslip_lines, tax_tables, tax_brackets |
| leave-service | surework_leave | 8083 | leave_requests, leave_balances |
| time-attendance-service | surework_time | 8084 | time_entries, timesheets, work_schedules, public_holidays |
| recruitment-service | surework_recruitment | 8085 | job_postings, candidates, applications, interviews |
| accounting-service | surework_accounting | 8081 | accounts, journal_entries, journal_entry_lines, fiscal_periods |
| support-service | surework_support | 8089 | tickets, ticket_comments, ticket_categories |

### Entity Relationship Overview

```
+-----------------------------------------------------------------------------+
|                          EMPLOYEE SERVICE (Core)                             |
|  +------------+       +------------+                                        |
|  | departments|<------| employees  | (department_id, manager_id)            |
|  | - id       |       | - id (UUID)|                                        |
|  | - code     |       | - employee_number                                   |
|  | - name     |       | - basic_salary                                      |
|  +------------+       | - hire_date, termination_date                       |
|                       | - gender, date_of_birth                             |
|                       +------+-----+                                        |
+-------------------------|----+---------------------------------------------+
                          | employee_id (UUID reference)
        +-----------------+------------------+-------------------------+
        v                 v                  v                         v
+---------------+  +----------------+  +----------------+  +----------------+
| PAYROLL SVC   |  | LEAVE SERVICE  |  | TIME & ATTEND  |  | RECRUITMENT    |
|               |  |                |  |                |  |                |
| payroll_runs  |  | leave_balances |  | time_entries   |  | applications   |
| - period_year |  | - employee_id  |  | - employee_id  |  | - candidate_id |
| - period_month|  | - leave_type   |  | - work_date    |  | - job_posting  |
|               |  | - entitlement  |  | - regular_hours|  | - stage        |
| payslips      |  | - used, pending|  | - overtime_hrs |  | - offer_salary |
| - employee_id |  |                |  | - night_hours  |  |                |
| - gross       |  | leave_requests |  |                |  | interviews     |
| - paye        |  | - start_date   |  | timesheets     |  | - ratings      |
| - uif         |  | - end_date     |  | - total_hours  |  | - feedback     |
| - net_pay     |  | - status       |  | - status       |  |                |
|               |  | - approver_id  |  |                |  | candidates     |
| payslip_lines |  |                |  |                |  | - skills       |
| - line_type   |  |                |  |                |  | - status       |
| - amount      |  |                |  |                |  |                |
+-------+-------+  +----------------+  +----------------+  +----------------+
        |
        v
+----------------+
| ACCOUNTING SVC |
|                |
| accounts       |
| - account_code |
| - account_type |
| - balance      |
|                |
| journal_entries|
| - entry_type   |
| - source_id ---+-> Links to payroll_runs for PAYROLL type
|                |
| fiscal_periods |
| - period_year  |
| - status       |
+----------------+
```

---

## SQL Query Specifications for Key Reports

### 1. HEADCOUNT SUMMARY REPORT

**Purpose:** Executive overview of workforce composition

```sql
-- employee-service database (surework_employees)

SELECT
    d.name AS department,
    COUNT(*) AS total_employees,
    COUNT(*) FILTER (WHERE e.status = 'ACTIVE') AS active,
    COUNT(*) FILTER (WHERE e.status = 'ON_LEAVE') AS on_leave,
    COUNT(*) FILTER (WHERE e.status = 'SUSPENDED') AS suspended,
    COUNT(*) FILTER (WHERE e.employment_type = 'FULL_TIME') AS full_time,
    COUNT(*) FILTER (WHERE e.employment_type = 'CONTRACT') AS contract,
    COUNT(*) FILTER (WHERE e.gender = 'MALE') AS male,
    COUNT(*) FILTER (WHERE e.gender = 'FEMALE') AS female,
    ROUND(AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.date_of_birth))), 1) AS avg_age,
    ROUND(AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.hire_date))), 1) AS avg_tenure_years,
    SUM(e.basic_salary) AS total_salary_cost
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
WHERE e.status != 'TERMINATED'
GROUP BY d.name
ORDER BY total_employees DESC;
```

**Output Fields:**
| Field | Type | Description |
|-------|------|-------------|
| department | VARCHAR | Department name |
| total_employees | INT | Total headcount |
| active/on_leave/suspended | INT | Status breakdown |
| full_time/contract | INT | Employment type |
| male/female | INT | Gender distribution |
| avg_age | DECIMAL | Average employee age |
| avg_tenure_years | DECIMAL | Average years of service |
| total_salary_cost | DECIMAL | Total basic salary |

---

### 2. PAYROLL REGISTER REPORT

**Purpose:** Monthly payroll detail for audit/compliance

```sql
-- payroll-service database (surework_payroll)

SELECT
    p.payslip_number,
    p.employee_number,
    p.employee_name,
    p.department,
    p.job_title,
    p.id_number,
    p.tax_number,
    p.basic_salary,
    p.gross_earnings,
    p.paye,
    p.uif_employee,
    p.pension_fund,
    p.medical_aid,
    p.other_deductions,
    p.total_deductions,
    p.net_pay,
    p.uif_employer,
    p.sdl,
    p.employer_pension,
    p.total_employer_cost,
    p.ytd_gross,
    p.ytd_paye,
    p.ytd_uif,
    p.ytd_net
FROM payslips p
JOIN payroll_runs pr ON p.payroll_run_id = pr.id
WHERE pr.period_year = :year
  AND pr.period_month = :month
  AND pr.status IN ('APPROVED', 'PAID')
  AND p.deleted = FALSE
ORDER BY p.department, p.employee_name;
```

---

### 3. EMP201 MONTHLY RETURN (SARS)

**Purpose:** Monthly employer declaration to SARS

```sql
-- payroll-service database (surework_payroll)

SELECT
    pr.period_year AS tax_year,
    pr.period_month AS tax_period,
    COUNT(DISTINCT p.employee_id) AS number_of_employees,
    SUM(p.gross_earnings) AS gross_remuneration,
    SUM(p.paye) AS total_paye,
    SUM(p.uif_employee) AS uif_employee_contributions,
    SUM(p.uif_employer) AS uif_employer_contributions,
    SUM(p.uif_employee + p.uif_employer) AS total_uif,
    SUM(p.sdl) AS skills_development_levy,
    SUM(p.paye + p.uif_employee + p.uif_employer + p.sdl) AS total_liability
FROM payroll_runs pr
JOIN payslips p ON p.payroll_run_id = pr.id
WHERE pr.period_year = :year
  AND pr.period_month = :month
  AND pr.status IN ('APPROVED', 'PAID')
  AND p.status NOT IN ('EXCLUDED', 'VOID')
  AND p.deleted = FALSE
GROUP BY pr.period_year, pr.period_month;
```

**EMP201 Fields Mapping:**
| SARS Field | Database Column |
|------------|-----------------|
| Period | period_year, period_month |
| Gross Remuneration | SUM(gross_earnings) |
| PAYE | SUM(paye) |
| UIF | SUM(uif_employee + uif_employer) |
| SDL | SUM(sdl) |

---

### 4. LEAVE LIABILITY REPORT

**Purpose:** Financial provision for outstanding leave

```sql
-- Cross-service query (requires leave + employee data)

-- Step 1: Get leave balances from leave-service
SELECT
    lb.employee_id,
    lb.leave_type,
    lb.entitlement,
    lb.used,
    lb.pending,
    (lb.entitlement + lb.carried_over - lb.used - lb.pending) AS available_days
FROM leave_balances lb
WHERE lb.year = :year
  AND lb.leave_type = 'ANNUAL'
  AND lb.deleted = FALSE;

-- Step 2: Join with employee salary data from employee-service
-- (In reporting service, combine via REST API calls)

-- Calculation Formula:
-- Leave Liability = available_days * (basic_salary / 21.67)
-- Where 21.67 = average working days per month
```

**Leave Liability Calculation:**
```
Daily Rate = basic_salary / 21.67
Leave Liability = available_days * Daily Rate

Example:
  Employee: R45,000/month salary, 12 days available
  Daily Rate = 45000 / 21.67 = R2,077.16
  Liability = 12 * 2,077.16 = R24,925.92
```

---

### 5. TIME & ATTENDANCE OVERTIME ANALYSIS

**Purpose:** Identify overtime patterns and costs

```sql
-- time-attendance-service database (surework_time)

SELECT
    ts.employee_number,
    ts.employee_name,
    ts.department_name,
    ts.period_year,
    ts.period_month,
    ts.regular_hours,
    ts.overtime_hours,
    ts.night_hours,
    ts.sunday_hours,
    ts.public_holiday_hours,
    ts.total_hours,
    -- BCEA Overtime Calculations (1.5x regular, 2x Sunday/PH)
    (ts.overtime_hours * 1.5) AS overtime_factor,
    (ts.sunday_hours * 2.0) AS sunday_factor,
    (ts.public_holiday_hours * 2.0) AS holiday_factor,
    -- Compliance check
    CASE
        WHEN ts.total_hours > 195 THEN 'EXCEEDS_BCEA' -- 45hrs * 4.33 weeks
        ELSE 'COMPLIANT'
    END AS compliance_status
FROM timesheets ts
WHERE ts.period_year = :year
  AND ts.period_month = :month
  AND ts.status IN ('APPROVED', 'PROCESSED')
  AND ts.deleted = FALSE
ORDER BY ts.overtime_hours DESC;
```

---

### 6. RECRUITMENT TIME-TO-HIRE REPORT

**Purpose:** Measure recruitment efficiency

```sql
-- recruitment-service database (surework_recruitment)

SELECT
    jp.job_reference,
    jp.title AS job_title,
    jp.department_name,
    a.application_reference,
    c.first_name || ' ' || c.last_name AS candidate_name,
    a.application_date,
    a.screened_at,
    a.offer_date,
    a.offer_response_date,
    a.expected_start_date,
    a.status AS final_status,

    -- Time metrics (in days)
    (a.screened_at::date - a.application_date) AS days_to_screen,
    (a.offer_date - a.application_date) AS days_to_offer,
    (a.offer_response_date - a.offer_date) AS days_to_response,
    (a.expected_start_date - a.application_date) AS total_days_to_hire,

    -- Interview count
    (SELECT COUNT(*) FROM interviews i WHERE i.application_id = a.id) AS interview_count,

    -- Average interview rating
    (SELECT AVG(overall_rating) FROM interviews i
     WHERE i.application_id = a.id AND i.overall_rating IS NOT NULL) AS avg_interview_rating

FROM applications a
JOIN job_postings jp ON a.job_posting_id = jp.id
JOIN candidates c ON a.candidate_id = c.id
WHERE a.status IN ('HIRED', 'OFFER_ACCEPTED')
  AND a.application_date >= :start_date
  AND a.application_date <= :end_date
ORDER BY a.application_date DESC;
```

**Key Metrics:**
| Metric | Formula | Target |
|--------|---------|--------|
| Time to Screen | screened_at - application_date | < 3 days |
| Time to Offer | offer_date - application_date | < 30 days |
| Time to Hire | expected_start_date - application_date | < 45 days |
| Offer Acceptance Rate | HIRED / OFFER_MADE * 100 | > 80% |

---

### 7. TRIAL BALANCE REPORT

**Purpose:** Verify accounting integrity (debits = credits)

```sql
-- accounting-service database (surework_accounting)

SELECT
    a.account_code,
    a.account_name,
    a.account_type,
    a.normal_balance,
    a.opening_balance,
    a.ytd_debit,
    a.ytd_credit,
    a.current_balance,
    -- Validation
    CASE
        WHEN a.normal_balance = 'DEBIT'
            AND a.current_balance >= 0 THEN 'OK'
        WHEN a.normal_balance = 'CREDIT'
            AND a.current_balance <= 0 THEN 'OK'
        ELSE 'REVIEW'
    END AS balance_check
FROM accounts a
WHERE a.is_header = FALSE
  AND a.deleted = FALSE
ORDER BY a.account_code;

-- Verification totals
SELECT
    SUM(ytd_debit) AS total_debits,
    SUM(ytd_credit) AS total_credits,
    SUM(ytd_debit) - SUM(ytd_credit) AS difference
FROM accounts
WHERE is_header = FALSE AND deleted = FALSE;
-- difference MUST equal 0 for valid trial balance
```

---

### 8. INCOME STATEMENT (P&L)

**Purpose:** Profit and loss for period

```sql
-- accounting-service database (surework_accounting)

WITH revenue AS (
    SELECT
        a.account_code,
        a.account_name,
        ABS(a.current_balance) AS amount
    FROM accounts a
    WHERE a.account_type = 'REVENUE'
      AND a.is_header = FALSE
      AND a.deleted = FALSE
),
expenses AS (
    SELECT
        a.account_code,
        a.account_name,
        a.current_balance AS amount
    FROM accounts a
    WHERE a.account_type = 'EXPENSE'
      AND a.is_header = FALSE
      AND a.deleted = FALSE
)
SELECT
    'REVENUE' AS section,
    account_code,
    account_name,
    amount
FROM revenue
UNION ALL
SELECT
    'EXPENSE' AS section,
    account_code,
    account_name,
    amount
FROM expenses
UNION ALL
SELECT
    'NET PROFIT' AS section,
    '' AS account_code,
    'Net Profit/(Loss)' AS account_name,
    (SELECT COALESCE(SUM(amount), 0) FROM revenue) -
    (SELECT COALESCE(SUM(amount), 0) FROM expenses) AS amount
ORDER BY section, account_code;
```

---

## Cross-Service Report Architecture

### Challenge: Microservice Data Isolation

Each service has its own database. Reports requiring data from multiple services need aggregation.

### Solution: Reporting Service as Data Aggregator

```
+----------------------------------------------------------------+
|                    REPORTING SERVICE                            |
|                                                                 |
|  +--------------+   +--------------+   +--------------+        |
|  | Report       |   | Data         |   | Export       |        |
|  | Definitions  |   | Aggregator   |   | Generator    |        |
|  | (31 types)   |   |              |   | PDF/Excel/CSV|        |
|  +--------------+   +--------------+   +--------------+        |
|                           |                                    |
|                           v                                    |
|              +------------------------+                        |
|              |   REST API Clients     |                        |
|              |   - EmployeeClient     |                        |
|              |   - PayrollClient      |                        |
|              |   - LeaveClient        |                        |
|              |   - TimeClient         |                        |
|              |   - RecruitmentClient  |                        |
|              |   - AccountingClient   |                        |
|              +------------------------+                        |
+----------------------------------------------------------------+
                           |
         +-----------------+-----------------+
         v                 v                 v
   +-----------+    +-----------+    +-----------+
   | Employee  |    | Payroll   |    | Leave     |
   | Service   |    | Service   |    | Service   |
   | :8086     |    | :8082     |    | :8083     |
   +-----------+    +-----------+    +-----------+
```

### Cross-Service Join Pattern

For reports like **Leave Liability** that need data from multiple services:

```java
// ReportingService - LeaveReportGenerator.java

public LeaveLiabilityReport generateLeaveLiabilityReport(int year) {
    // 1. Fetch leave balances from Leave Service
    List<LeaveBalanceDTO> balances = leaveClient.getBalances(year, "ANNUAL");

    // 2. Fetch employee salary data from Employee Service
    Map<UUID, EmployeeDTO> employees = employeeClient.getActiveEmployees()
        .stream()
        .collect(Collectors.toMap(EmployeeDTO::getId, e -> e));

    // 3. Calculate liability
    return balances.stream()
        .map(balance -> {
            EmployeeDTO emp = employees.get(balance.getEmployeeId());
            BigDecimal dailyRate = emp.getBasicSalary()
                .divide(BigDecimal.valueOf(21.67), 2, RoundingMode.HALF_UP);
            BigDecimal liability = dailyRate
                .multiply(BigDecimal.valueOf(balance.getAvailable()));

            return new LeaveLiabilityLine(
                emp.getEmployeeNumber(),
                emp.getFullName(),
                emp.getDepartment(),
                balance.getAvailable(),
                dailyRate,
                liability
            );
        })
        .collect(Collectors.toList());
}
```

---

## Data Quality Considerations

### 1. Employee ID Consistency

All services reference employees by `employee_id` (UUID). Ensure:
- Employee IDs are immutable
- Deleted employees are soft-deleted (not hard deleted)
- Cross-reference validation on service startup

### 2. Denormalized Data Sync

Payslips and timesheets store denormalized employee data:
- `employee_name`, `department`, `job_title`

**Risk:** Data becomes stale if employee record changes.

**Mitigation:**
- Event-driven updates (publish employee update events)
- Periodic reconciliation jobs
- Store snapshot date with denormalized data

### 3. Date/Period Alignment

Different services use different period references:
- Payroll: `period_year`, `period_month` (1-12)
- Leave: `year` (calendar year)
- Accounting: `fiscal_period_id` (UUID to fiscal_periods)
- Time: `period_year`, `period_month`, `period_week`

**Report Solution:** Normalize all to date ranges when aggregating.

### 4. Currency Precision

All monetary fields use `DECIMAL(15,2)` or `DECIMAL(12,2)`.
- Always use `BigDecimal` in Java
- Apply rounding only at final output
- Store full precision, display formatted

---

## Recommended ETL Architecture

For complex analytics and historical reporting:

```
+----------------------------------------------------------------+
|                    DATA WAREHOUSE LAYER                         |
|                                                                 |
|  +----------------------------------------------------------+  |
|  |                   PostgreSQL / TimescaleDB               |  |
|  |                                                          |  |
|  |  +------------+  +------------+  +------------+         |  |
|  |  | fact_      |  | fact_      |  | fact_      |         |  |
|  |  | payslips   |  | attendance |  | recruitment|         |  |
|  |  +------------+  +------------+  +------------+         |  |
|  |                                                          |  |
|  |  +------------+  +------------+  +------------+         |  |
|  |  | dim_       |  | dim_       |  | dim_       |         |  |
|  |  | employee   |  | department |  | time       |         |  |
|  |  +------------+  +------------+  +------------+         |  |
|  +----------------------------------------------------------+  |
+----------------------------------------------------------------+
                              ^
                              | ETL Jobs (Daily/Weekly)
         +--------------------+--------------------+
         |                    |                    |
   +-----+-----+       +------+----+       +------+----+
   | Employee  |       | Payroll   |       | Time      |
   | Service   |       | Service   |       | Service   |
   | Database  |       | Database  |       | Database  |
   +-----------+       +-----------+       +-----------+
```

### Fact Tables (Star Schema)

**fact_payslips:**
- payslip_id (PK)
- employee_key (FK -> dim_employee)
- date_key (FK -> dim_time)
- department_key (FK -> dim_department)
- gross_earnings, paye, uif, net_pay, etc.

**fact_attendance:**
- entry_id (PK)
- employee_key (FK -> dim_employee)
- date_key (FK -> dim_time)
- regular_hours, overtime_hours, etc.

**fact_recruitment:**
- application_id (PK)
- candidate_key
- job_key
- date_key
- days_to_hire, interview_count, etc.

### Dimension Tables

**dim_employee:** Slowly changing dimension (Type 2)
- employee_key (surrogate key)
- employee_id (natural key)
- employee_number, name, department
- valid_from, valid_to, is_current

**dim_time:** Date dimension
- date_key (YYYYMMDD)
- date, month, quarter, year
- fiscal_year, fiscal_period
- is_public_holiday, holiday_name

---

## Summary: Implementation Roadmap

### Immediate (Week 1-2)
1. Implement Payroll Register report (data ready)
2. Implement EMP201 report (SARS compliance)
3. Implement Headcount Summary (executive dashboard)

### Short-term (Week 3-4)
4. Implement Leave Liability report (cross-service)
5. Implement Time & Attendance Overtime report
6. Implement Trial Balance (accounting)

### Medium-term (Month 2)
7. Implement IRP5 generation (annual tax certificates)
8. Implement Recruitment Pipeline analytics
9. Add EEA fields to employees table
10. Implement EEA2/EEA4 reports

### Long-term (Month 3+)
11. Build data warehouse for historical analytics
12. Implement real-time dashboard feeds
13. Add training module for WSP/ATR reports
14. Build predictive analytics (turnover, hiring needs)

---

*Document generated: 2026-01-25*
*Analysis based on SureWork codebase schema review*
