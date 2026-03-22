package com.surework.reporting.service;

import com.surework.reporting.client.*;
import com.surework.reporting.client.dto.*;
import com.surework.reporting.domain.Report;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for fetching report data from various microservices.
 * Aggregates data from Employee, Payroll, Leave, Time & Attendance, and Recruitment services.
 */
@Service
public class ReportDataFetcherService {

    private static final Logger log = LoggerFactory.getLogger(ReportDataFetcherService.class);
    private static final BigDecimal WORKING_DAYS_PER_MONTH = new BigDecimal("21.67");

    private final EmployeeServiceClient employeeClient;
    private final PayrollServiceClient payrollClient;
    private final LeaveServiceClient leaveClient;
    private final TimeAttendanceServiceClient timeClient;
    private final RecruitmentServiceClient recruitmentClient;

    public ReportDataFetcherService(
            EmployeeServiceClient employeeClient,
            PayrollServiceClient payrollClient,
            LeaveServiceClient leaveClient,
            TimeAttendanceServiceClient timeClient,
            RecruitmentServiceClient recruitmentClient) {
        this.employeeClient = employeeClient;
        this.payrollClient = payrollClient;
        this.leaveClient = leaveClient;
        this.timeClient = timeClient;
        this.recruitmentClient = recruitmentClient;
    }

    /**
     * Fetch report data based on report type.
     */
    public List<Map<String, Object>> fetchReportData(Report report) {
        return switch (report.getReportType()) {
            case HEADCOUNT -> fetchHeadcountData(report);
            case EMPLOYEE_DIRECTORY -> fetchEmployeeDirectoryData(report);
            case DEMOGRAPHICS -> fetchDemographicsData(report);
            case TURNOVER -> fetchTurnoverData(report);
            case PAYROLL_REGISTER -> fetchPayrollRegisterData(report);
            case PAYROLL_SUMMARY -> fetchPayrollSummaryData(report);
            case EMP201 -> fetchEMP201Data(report);
            case LEAVE_BALANCE -> fetchLeaveBalanceData(report);
            case LEAVE_LIABILITY -> fetchLeaveLiabilityData(report);
            case LEAVE_UTILIZATION -> fetchLeaveUtilizationData(report);
            case ATTENDANCE_SUMMARY -> fetchAttendanceSummaryData(report);
            case OVERTIME_REPORT -> fetchOvertimeData(report);
            case RECRUITMENT_PIPELINE -> fetchRecruitmentPipelineData(report);
            case TIME_TO_HIRE -> fetchTimeToHireData(report);
            case SOURCE_EFFECTIVENESS -> fetchSourceEffectivenessData(report);
            case OFFER_ACCEPTANCE -> fetchOfferAcceptanceData(report);
            case EXTERNAL_PORTAL_PERFORMANCE -> fetchExternalPortalPerformanceData(report);
            case JOB_ADVERT_EFFECTIVENESS -> fetchJobAdvertEffectivenessData(report);
            default -> fetchGenericData(report);
        };
    }

    // ==================== HR Reports ====================

    /**
     * Fetch headcount summary data grouped by department.
     */
    public List<Map<String, Object>> fetchHeadcountData(Report report) {
        try {
            List<EmployeeDto> employees = employeeClient.getAllEmployees();
            List<DepartmentDto> departments = employeeClient.getAllDepartments();

            Map<UUID, String> deptNames = departments.stream()
                    .collect(Collectors.toMap(DepartmentDto::id, DepartmentDto::name));

            // Group by department
            Map<String, List<EmployeeDto>> byDept = employees.stream()
                    .filter(e -> !"TERMINATED".equals(e.status()))
                    .collect(Collectors.groupingBy(e ->
                            e.departmentId() != null ? deptNames.getOrDefault(e.departmentId(), "Unassigned") : "Unassigned"));

            List<Map<String, Object>> result = new ArrayList<>();

            for (Map.Entry<String, List<EmployeeDto>> entry : byDept.entrySet()) {
                List<EmployeeDto> deptEmployees = entry.getValue();
                Map<String, Object> row = new LinkedHashMap<>();

                row.put("department", entry.getKey());
                row.put("totalEmployees", deptEmployees.size());
                row.put("active", deptEmployees.stream().filter(e -> "ACTIVE".equals(e.status())).count());
                row.put("onLeave", deptEmployees.stream().filter(e -> "ON_LEAVE".equals(e.status())).count());
                row.put("suspended", deptEmployees.stream().filter(e -> "SUSPENDED".equals(e.status())).count());
                row.put("fullTime", deptEmployees.stream().filter(e -> "FULL_TIME".equals(e.employmentType())).count());
                row.put("contract", deptEmployees.stream().filter(e -> "CONTRACT".equals(e.employmentType())).count());
                row.put("male", deptEmployees.stream().filter(e -> "MALE".equals(e.gender())).count());
                row.put("female", deptEmployees.stream().filter(e -> "FEMALE".equals(e.gender())).count());

                // Calculate averages
                double avgAge = deptEmployees.stream()
                        .filter(e -> e.dateOfBirth() != null)
                        .mapToInt(e -> Period.between(e.dateOfBirth(), LocalDate.now()).getYears())
                        .average()
                        .orElse(0.0);
                row.put("avgAge", Math.round(avgAge * 10) / 10.0);

                double avgTenure = deptEmployees.stream()
                        .filter(e -> e.hireDate() != null)
                        .mapToDouble(e -> ChronoUnit.DAYS.between(e.hireDate(), LocalDate.now()) / 365.25)
                        .average()
                        .orElse(0.0);
                row.put("avgTenureYears", Math.round(avgTenure * 10) / 10.0);

                BigDecimal totalSalary = deptEmployees.stream()
                        .filter(e -> e.basicSalary() != null)
                        .map(EmployeeDto::basicSalary)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                row.put("totalSalaryCost", totalSalary);

                result.add(row);
            }

            // Sort by total employees descending
            result.sort((a, b) -> Integer.compare(
                    (int) b.get("totalEmployees"),
                    (int) a.get("totalEmployees")));

            return result;

        } catch (Exception e) {
            log.error("Failed to fetch headcount data", e);
            return Collections.emptyList();
        }
    }

    /**
     * Fetch employee directory data.
     */
    public List<Map<String, Object>> fetchEmployeeDirectoryData(Report report) {
        try {
            List<EmployeeDto> employees = employeeClient.getAllEmployees();

            return employees.stream()
                    .filter(e -> !"TERMINATED".equals(e.status()))
                    .map(e -> {
                        Map<String, Object> row = new LinkedHashMap<>();
                        row.put("employeeNumber", e.employeeNumber());
                        row.put("firstName", e.firstName());
                        row.put("lastName", e.lastName());
                        row.put("email", e.email());
                        row.put("phone", e.phone());
                        row.put("department", e.departmentName());
                        row.put("jobTitle", e.jobTitle());
                        row.put("manager", e.managerName());
                        row.put("hireDate", e.hireDate());
                        row.put("status", e.status());
                        row.put("employmentType", e.employmentType());
                        return row;
                    })
                    .sorted(Comparator.comparing(m -> (String) m.get("lastName")))
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Failed to fetch employee directory data", e);
            return Collections.emptyList();
        }
    }

    /**
     * Fetch demographics analysis data.
     */
    public List<Map<String, Object>> fetchDemographicsData(Report report) {
        try {
            List<EmployeeDto> employees = employeeClient.getAllEmployees();

            List<EmployeeDto> active = employees.stream()
                    .filter(e -> !"TERMINATED".equals(e.status()))
                    .toList();

            List<Map<String, Object>> result = new ArrayList<>();

            // Gender breakdown
            Map<String, Long> byGender = active.stream()
                    .collect(Collectors.groupingBy(
                            e -> e.gender() != null ? e.gender() : "Not Specified",
                            Collectors.counting()));
            for (Map.Entry<String, Long> entry : byGender.entrySet()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("category", "Gender");
                row.put("value", entry.getKey());
                row.put("count", entry.getValue());
                row.put("percentage", Math.round((entry.getValue() * 100.0 / active.size()) * 10) / 10.0);
                result.add(row);
            }

            // Age group breakdown
            Map<String, Long> byAge = active.stream()
                    .filter(e -> e.dateOfBirth() != null)
                    .collect(Collectors.groupingBy(e -> {
                        int age = Period.between(e.dateOfBirth(), LocalDate.now()).getYears();
                        if (age < 25) return "Under 25";
                        if (age < 35) return "25-34";
                        if (age < 45) return "35-44";
                        if (age < 55) return "45-54";
                        return "55+";
                    }, Collectors.counting()));
            for (Map.Entry<String, Long> entry : byAge.entrySet()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("category", "Age Group");
                row.put("value", entry.getKey());
                row.put("count", entry.getValue());
                row.put("percentage", Math.round((entry.getValue() * 100.0 / active.size()) * 10) / 10.0);
                result.add(row);
            }

            // Employment type breakdown
            Map<String, Long> byType = active.stream()
                    .collect(Collectors.groupingBy(
                            e -> e.employmentType() != null ? e.employmentType() : "Not Specified",
                            Collectors.counting()));
            for (Map.Entry<String, Long> entry : byType.entrySet()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("category", "Employment Type");
                row.put("value", entry.getKey());
                row.put("count", entry.getValue());
                row.put("percentage", Math.round((entry.getValue() * 100.0 / active.size()) * 10) / 10.0);
                result.add(row);
            }

            return result;

        } catch (Exception e) {
            log.error("Failed to fetch demographics data", e);
            return Collections.emptyList();
        }
    }

    /**
     * Fetch turnover analysis data.
     */
    public List<Map<String, Object>> fetchTurnoverData(Report report) {
        try {
            List<EmployeeDto> employees = employeeClient.getAllEmployees();

            LocalDate fromDate = report.getDateFrom() != null
                    ? report.getDateFrom().toLocalDate()
                    : LocalDate.now().minusMonths(6);
            LocalDate toDate = report.getDateTo() != null
                    ? report.getDateTo().toLocalDate()
                    : LocalDate.now();

            List<EmployeeDto> terminated = employees.stream()
                    .filter(e -> "TERMINATED".equals(e.status()))
                    .filter(e -> e.terminationDate() != null)
                    .filter(e -> !e.terminationDate().isBefore(fromDate) && !e.terminationDate().isAfter(toDate))
                    .toList();

            int totalActive = (int) employees.stream()
                    .filter(e -> !"TERMINATED".equals(e.status()))
                    .count();

            List<Map<String, Object>> result = new ArrayList<>();

            // Terminations by department
            Map<String, Long> byDept = terminated.stream()
                    .collect(Collectors.groupingBy(
                            e -> e.departmentName() != null ? e.departmentName() : "Unknown",
                            Collectors.counting()));

            for (Map.Entry<String, Long> entry : byDept.entrySet()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("department", entry.getKey());
                row.put("terminations", entry.getValue());
                row.put("turnoverRate", totalActive > 0
                        ? Math.round((entry.getValue() * 100.0 / totalActive) * 10) / 10.0
                        : 0.0);
                result.add(row);
            }

            // Add total
            Map<String, Object> totalRow = new LinkedHashMap<>();
            totalRow.put("department", "TOTAL");
            totalRow.put("terminations", terminated.size());
            totalRow.put("turnoverRate", totalActive > 0
                    ? Math.round((terminated.size() * 100.0 / totalActive) * 10) / 10.0
                    : 0.0);
            result.add(totalRow);

            return result;

        } catch (Exception e) {
            log.error("Failed to fetch turnover data", e);
            return Collections.emptyList();
        }
    }

    // ==================== Payroll Reports ====================

    /**
     * Fetch payroll register data for a specific period.
     */
    public List<Map<String, Object>> fetchPayrollRegisterData(Report report) {
        try {
            int year = report.getDateTo() != null
                    ? report.getDateTo().getYear()
                    : LocalDateTime.now().getYear();
            int month = report.getDateTo() != null
                    ? report.getDateTo().getMonthValue()
                    : LocalDateTime.now().getMonthValue();

            List<PayslipDto> payslips = payrollClient.getPayslipsByPeriod(year, month);

            return payslips.stream()
                    .map(p -> {
                        Map<String, Object> row = new LinkedHashMap<>();
                        row.put("payslipNumber", p.payslipNumber());
                        row.put("employeeNumber", p.employeeNumber());
                        row.put("employeeName", p.employeeName());
                        row.put("department", p.department());
                        row.put("jobTitle", p.jobTitle());
                        row.put("idNumber", p.idNumber());
                        row.put("taxNumber", p.taxNumber());
                        row.put("basicSalary", p.basicSalary());
                        row.put("grossEarnings", p.grossEarnings());
                        row.put("paye", p.paye());
                        row.put("uifEmployee", p.uifEmployee());
                        row.put("pensionFund", p.pensionFund());
                        row.put("medicalAid", p.medicalAid());
                        row.put("otherDeductions", p.otherDeductions());
                        row.put("totalDeductions", p.totalDeductions());
                        row.put("netPay", p.netPay());
                        row.put("uifEmployer", p.uifEmployer());
                        row.put("sdl", p.sdl());
                        row.put("employerPension", p.employerPension());
                        row.put("totalEmployerCost", p.totalEmployerCost());
                        row.put("ytdGross", p.ytdGross());
                        row.put("ytdPaye", p.ytdPaye());
                        row.put("ytdUif", p.ytdUif());
                        row.put("ytdNet", p.ytdNet());
                        return row;
                    })
                    .sorted(Comparator.comparing(m -> (String) m.get("department")))
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Failed to fetch payroll register data", e);
            return Collections.emptyList();
        }
    }

    /**
     * Fetch payroll summary data.
     */
    public List<Map<String, Object>> fetchPayrollSummaryData(Report report) {
        try {
            int year = report.getDateTo() != null
                    ? report.getDateTo().getYear()
                    : LocalDateTime.now().getYear();
            int month = report.getDateTo() != null
                    ? report.getDateTo().getMonthValue()
                    : LocalDateTime.now().getMonthValue();

            List<PayrollRunDto> runs = payrollClient.getPayrollRunsByPeriod(year, month);

            return runs.stream()
                    .map(r -> {
                        Map<String, Object> row = new LinkedHashMap<>();
                        row.put("runNumber", r.runNumber());
                        row.put("periodYear", r.periodYear());
                        row.put("periodMonth", r.periodMonth());
                        row.put("paymentDate", r.paymentDate());
                        row.put("status", r.status());
                        row.put("employeeCount", r.employeeCount());
                        row.put("totalGross", r.totalGross());
                        row.put("totalPaye", r.totalPaye());
                        row.put("totalUifEmployee", r.totalUifEmployee());
                        row.put("totalUifEmployer", r.totalUifEmployer());
                        row.put("totalNet", r.totalNet());
                        row.put("totalEmployerCost", r.totalEmployerCost());
                        return row;
                    })
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Failed to fetch payroll summary data", e);
            return Collections.emptyList();
        }
    }

    /**
     * Fetch EMP201 statutory data.
     */
    public List<Map<String, Object>> fetchEMP201Data(Report report) {
        try {
            int year = report.getDateTo() != null
                    ? report.getDateTo().getYear()
                    : LocalDateTime.now().getYear();
            int month = report.getDateTo() != null
                    ? report.getDateTo().getMonthValue()
                    : LocalDateTime.now().getMonthValue();

            List<PayslipDto> payslips = payrollClient.getPayslipsByPeriod(year, month);

            BigDecimal totalGross = payslips.stream()
                    .map(PayslipDto::grossEarnings)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalPaye = payslips.stream()
                    .map(PayslipDto::paye)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalUifEmployee = payslips.stream()
                    .map(PayslipDto::uifEmployee)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalUifEmployer = payslips.stream()
                    .map(PayslipDto::uifEmployer)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalSdl = payslips.stream()
                    .map(PayslipDto::sdl)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("taxPeriod", String.format("%d/%02d", year, month));
            row.put("numberOfEmployees", payslips.size());
            row.put("grossRemuneration", totalGross);
            row.put("paye", totalPaye);
            row.put("uifEmployee", totalUifEmployee);
            row.put("uifEmployer", totalUifEmployer);
            row.put("totalUif", totalUifEmployee.add(totalUifEmployer));
            row.put("sdl", totalSdl);
            row.put("totalLiability", totalPaye.add(totalUifEmployee).add(totalUifEmployer).add(totalSdl));

            // Due date is 7th of following month
            LocalDate dueDate = LocalDate.of(year, month, 1).plusMonths(1).withDayOfMonth(7);
            row.put("dueDate", dueDate);

            return List.of(row);

        } catch (Exception e) {
            log.error("Failed to fetch EMP201 data", e);
            return Collections.emptyList();
        }
    }

    // ==================== Leave Reports ====================

    /**
     * Fetch leave balance data.
     */
    public List<Map<String, Object>> fetchLeaveBalanceData(Report report) {
        try {
            int year = report.getDateTo() != null
                    ? report.getDateTo().getYear()
                    : LocalDateTime.now().getYear();

            List<LeaveBalanceDto> balances = leaveClient.getAllBalances(year);
            List<EmployeeDto> employees = employeeClient.getAllEmployees();

            Map<UUID, EmployeeDto> employeeMap = employees.stream()
                    .collect(Collectors.toMap(EmployeeDto::id, e -> e, (a, b) -> a));

            return balances.stream()
                    .map(b -> {
                        Map<String, Object> row = new LinkedHashMap<>();
                        EmployeeDto emp = employeeMap.get(b.employeeId());

                        row.put("employeeNumber", emp != null ? emp.employeeNumber() : "Unknown");
                        row.put("employeeName", emp != null ? emp.fullName() : "Unknown");
                        row.put("department", emp != null ? emp.departmentName() : "Unknown");
                        row.put("leaveType", b.leaveType());
                        row.put("year", b.year());
                        row.put("entitlement", b.entitlement());
                        row.put("carriedOver", b.carriedOver());
                        row.put("used", b.used());
                        row.put("pending", b.pending());
                        row.put("available", b.available());
                        return row;
                    })
                    .sorted(Comparator.comparing(m -> (String) m.get("employeeName")))
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Failed to fetch leave balance data", e);
            return Collections.emptyList();
        }
    }

    /**
     * Fetch leave liability data (financial provision for outstanding leave).
     */
    public List<Map<String, Object>> fetchLeaveLiabilityData(Report report) {
        try {
            int year = report.getDateTo() != null
                    ? report.getDateTo().getYear()
                    : LocalDateTime.now().getYear();

            List<LeaveBalanceDto> balances = leaveClient.getBalancesByType(year, "ANNUAL");
            List<EmployeeDto> employees = employeeClient.getAllEmployees();

            Map<UUID, EmployeeDto> employeeMap = employees.stream()
                    .filter(e -> !"TERMINATED".equals(e.status()))
                    .collect(Collectors.toMap(EmployeeDto::id, e -> e, (a, b) -> a));

            List<Map<String, Object>> result = new ArrayList<>();
            BigDecimal totalLiability = BigDecimal.ZERO;

            for (LeaveBalanceDto balance : balances) {
                EmployeeDto emp = employeeMap.get(balance.employeeId());
                if (emp == null || emp.basicSalary() == null) continue;

                BigDecimal available = balance.available();
                if (available.compareTo(BigDecimal.ZERO) <= 0) continue;

                BigDecimal dailyRate = emp.basicSalary()
                        .divide(WORKING_DAYS_PER_MONTH, 2, RoundingMode.HALF_UP);
                BigDecimal liability = dailyRate.multiply(available);
                totalLiability = totalLiability.add(liability);

                Map<String, Object> row = new LinkedHashMap<>();
                row.put("employeeNumber", emp.employeeNumber());
                row.put("employeeName", emp.fullName());
                row.put("department", emp.departmentName());
                row.put("basicSalary", emp.basicSalary());
                row.put("dailyRate", dailyRate);
                row.put("availableDays", available);
                row.put("leaveLiability", liability);
                result.add(row);
            }

            // Sort by liability descending
            result.sort((a, b) -> ((BigDecimal) b.get("leaveLiability"))
                    .compareTo((BigDecimal) a.get("leaveLiability")));

            // Add total row
            Map<String, Object> totalRow = new LinkedHashMap<>();
            totalRow.put("employeeNumber", "");
            totalRow.put("employeeName", "TOTAL");
            totalRow.put("department", "");
            totalRow.put("basicSalary", "");
            totalRow.put("dailyRate", "");
            totalRow.put("availableDays", "");
            totalRow.put("leaveLiability", totalLiability);
            result.add(totalRow);

            return result;

        } catch (Exception e) {
            log.error("Failed to fetch leave liability data", e);
            return Collections.emptyList();
        }
    }

    /**
     * Fetch leave utilization data.
     */
    public List<Map<String, Object>> fetchLeaveUtilizationData(Report report) {
        try {
            String fromDate = report.getDateFrom() != null
                    ? report.getDateFrom().format(DateTimeFormatter.ISO_LOCAL_DATE)
                    : LocalDateTime.now().minusMonths(12).format(DateTimeFormatter.ISO_LOCAL_DATE);
            String toDate = report.getDateTo() != null
                    ? report.getDateTo().format(DateTimeFormatter.ISO_LOCAL_DATE)
                    : LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE);

            List<LeaveRequestDto> requests = leaveClient.getRequestsByPeriod(fromDate, toDate);

            // Group by leave type
            Map<String, List<LeaveRequestDto>> byType = requests.stream()
                    .filter(r -> "APPROVED".equals(r.status()))
                    .collect(Collectors.groupingBy(LeaveRequestDto::leaveType));

            List<Map<String, Object>> result = new ArrayList<>();

            for (Map.Entry<String, List<LeaveRequestDto>> entry : byType.entrySet()) {
                List<LeaveRequestDto> typeRequests = entry.getValue();
                int totalDays = typeRequests.stream().mapToInt(LeaveRequestDto::days).sum();

                Map<String, Object> row = new LinkedHashMap<>();
                row.put("leaveType", entry.getKey());
                row.put("requestCount", typeRequests.size());
                row.put("totalDays", totalDays);
                row.put("avgDaysPerRequest", typeRequests.isEmpty() ? 0 :
                        Math.round((totalDays * 10.0) / typeRequests.size()) / 10.0);
                result.add(row);
            }

            return result;

        } catch (Exception e) {
            log.error("Failed to fetch leave utilization data", e);
            return Collections.emptyList();
        }
    }

    // ==================== Time & Attendance Reports ====================

    /**
     * Fetch attendance summary data.
     */
    public List<Map<String, Object>> fetchAttendanceSummaryData(Report report) {
        try {
            int year = report.getDateTo() != null
                    ? report.getDateTo().getYear()
                    : LocalDateTime.now().getYear();
            int month = report.getDateTo() != null
                    ? report.getDateTo().getMonthValue()
                    : LocalDateTime.now().getMonthValue();

            List<TimesheetDto> timesheets = timeClient.getTimesheetsByPeriod(year, month);

            return timesheets.stream()
                    .map(t -> {
                        Map<String, Object> row = new LinkedHashMap<>();
                        row.put("employeeNumber", t.employeeNumber());
                        row.put("employeeName", t.employeeName());
                        row.put("department", t.departmentName());
                        row.put("periodYear", t.periodYear());
                        row.put("periodMonth", t.periodMonth());
                        row.put("daysWorked", t.daysWorked());
                        row.put("daysAbsent", t.daysAbsent());
                        row.put("daysLate", t.daysLate());
                        row.put("totalHours", t.totalHours());
                        row.put("regularHours", t.regularHours());
                        row.put("overtimeHours", t.overtimeHours());
                        row.put("nightHours", t.nightHours());
                        row.put("sundayHours", t.sundayHours());
                        row.put("publicHolidayHours", t.publicHolidayHours());
                        row.put("status", t.status());

                        // Attendance rate calculation
                        int workingDays = t.workingDaysInPeriod();
                        double attendanceRate = workingDays > 0
                                ? (t.daysWorked() * 100.0 / workingDays)
                                : 0;
                        row.put("attendanceRate", Math.round(attendanceRate * 10) / 10.0);

                        return row;
                    })
                    .sorted(Comparator.comparing(m -> (String) m.get("department")))
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Failed to fetch attendance summary data", e);
            return Collections.emptyList();
        }
    }

    /**
     * Fetch overtime analysis data.
     */
    public List<Map<String, Object>> fetchOvertimeData(Report report) {
        try {
            int year = report.getDateTo() != null
                    ? report.getDateTo().getYear()
                    : LocalDateTime.now().getYear();
            int month = report.getDateTo() != null
                    ? report.getDateTo().getMonthValue()
                    : LocalDateTime.now().getMonthValue();

            List<TimesheetDto> timesheets = timeClient.getTimesheetsByPeriod(year, month);

            return timesheets.stream()
                    .filter(t -> t.overtimeHours() != null && t.overtimeHours().compareTo(BigDecimal.ZERO) > 0)
                    .map(t -> {
                        Map<String, Object> row = new LinkedHashMap<>();
                        row.put("employeeNumber", t.employeeNumber());
                        row.put("employeeName", t.employeeName());
                        row.put("department", t.departmentName());
                        row.put("regularHours", t.regularHours());
                        row.put("overtimeHours", t.overtimeHours());
                        row.put("nightHours", t.nightHours());
                        row.put("sundayHours", t.sundayHours());
                        row.put("publicHolidayHours", t.publicHolidayHours());
                        row.put("totalHours", t.totalHours());

                        // BCEA compliance check (45 hours regular + overtime should be managed)
                        BigDecimal totalOT = BigDecimal.ZERO;
                        if (t.overtimeHours() != null) totalOT = totalOT.add(t.overtimeHours());
                        if (t.sundayHours() != null) totalOT = totalOT.add(t.sundayHours());
                        if (t.publicHolidayHours() != null) totalOT = totalOT.add(t.publicHolidayHours());

                        row.put("totalOvertimeHours", totalOT);
                        row.put("complianceStatus", t.totalHours().compareTo(new BigDecimal("195")) > 0
                                ? "REVIEW_REQUIRED" : "COMPLIANT");

                        return row;
                    })
                    .sorted((a, b) -> ((BigDecimal) b.get("overtimeHours"))
                            .compareTo((BigDecimal) a.get("overtimeHours")))
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Failed to fetch overtime data", e);
            return Collections.emptyList();
        }
    }

    // ==================== Recruitment Reports ====================

    /**
     * Fetch recruitment pipeline data.
     */
    public List<Map<String, Object>> fetchRecruitmentPipelineData(Report report) {
        try {
            List<ApplicationDto> applications = recruitmentClient.getAllApplications();
            List<JobPostingDto> jobs = recruitmentClient.getAllJobPostings();

            Map<UUID, String> jobTitles = jobs.stream()
                    .collect(Collectors.toMap(JobPostingDto::id, JobPostingDto::title));

            // Group by stage
            Map<String, Long> byStage = applications.stream()
                    .collect(Collectors.groupingBy(
                            a -> a.stage() != null ? a.stage() : "UNKNOWN",
                            Collectors.counting()));

            List<Map<String, Object>> result = new ArrayList<>();

            // Define stage order
            List<String> stageOrder = List.of(
                    "NEW", "SCREENING", "PHONE_SCREEN", "ASSESSMENT",
                    "FIRST_INTERVIEW", "SECOND_INTERVIEW", "FINAL_INTERVIEW",
                    "REFERENCE_CHECK", "BACKGROUND_CHECK", "OFFER", "ONBOARDING", "COMPLETED"
            );

            long totalApplications = applications.size();

            for (String stage : stageOrder) {
                long count = byStage.getOrDefault(stage, 0L);
                if (count > 0) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("stage", stage);
                    row.put("count", count);
                    row.put("percentage", totalApplications > 0
                            ? Math.round((count * 100.0 / totalApplications) * 10) / 10.0
                            : 0);
                    result.add(row);
                }
            }

            return result;

        } catch (Exception e) {
            log.error("Failed to fetch recruitment pipeline data", e);
            return Collections.emptyList();
        }
    }

    /**
     * Fetch time-to-hire metrics data.
     */
    public List<Map<String, Object>> fetchTimeToHireData(Report report) {
        try {
            List<ApplicationDto> applications = recruitmentClient.getAllApplications();
            List<JobPostingDto> jobs = recruitmentClient.getAllJobPostings();

            Map<UUID, JobPostingDto> jobMap = jobs.stream()
                    .collect(Collectors.toMap(JobPostingDto::id, j -> j));

            // Filter to hired applications
            List<ApplicationDto> hiredApps = applications.stream()
                    .filter(a -> "HIRED".equals(a.status()) || "OFFER_ACCEPTED".equals(a.status()))
                    .filter(a -> a.applicationDate() != null)
                    .toList();

            return hiredApps.stream()
                    .map(a -> {
                        Map<String, Object> row = new LinkedHashMap<>();
                        JobPostingDto job = jobMap.get(a.jobPostingId());

                        row.put("applicationReference", a.applicationReference());
                        row.put("candidateName", a.candidateName());
                        row.put("jobTitle", job != null ? job.title() : a.jobTitle());
                        row.put("department", job != null ? job.departmentName() : "Unknown");
                        row.put("applicationDate", a.applicationDate());
                        row.put("offerDate", a.offerDate());
                        row.put("expectedStartDate", a.expectedStartDate());
                        row.put("status", a.status());

                        // Calculate time metrics
                        if (a.screenedAt() != null) {
                            long daysToScreen = ChronoUnit.DAYS.between(
                                    a.applicationDate(),
                                    a.screenedAt().toLocalDate());
                            row.put("daysToScreen", daysToScreen);
                        }

                        if (a.offerDate() != null) {
                            long daysToOffer = ChronoUnit.DAYS.between(
                                    a.applicationDate(),
                                    a.offerDate());
                            row.put("daysToOffer", daysToOffer);
                        }

                        if (a.expectedStartDate() != null) {
                            long totalDays = ChronoUnit.DAYS.between(
                                    a.applicationDate(),
                                    a.expectedStartDate());
                            row.put("totalDaysToHire", totalDays);
                        }

                        row.put("interviewCount", a.interviewCount());
                        row.put("overallRating", a.overallRating());
                        row.put("source", a.source());

                        return row;
                    })
                    .sorted(Comparator.comparing(m -> (LocalDate) m.get("applicationDate"),
                            Comparator.nullsLast(Comparator.reverseOrder())))
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Failed to fetch time-to-hire data", e);
            return Collections.emptyList();
        }
    }

    /**
     * Fetch source effectiveness data: applications and hires by source.
     */
    public List<Map<String, Object>> fetchSourceEffectivenessData(Report report) {
        try {
            Map<String, Object> stats = recruitmentClient.getSourceEffectivenessStats();
            @SuppressWarnings("unchecked")
            Map<String, Number> appsBySource = (Map<String, Number>) stats.getOrDefault("applicationsBySource", Map.of());
            @SuppressWarnings("unchecked")
            Map<String, Number> hiredBySource = (Map<String, Number>) stats.getOrDefault("hiredBySource", Map.of());
            @SuppressWarnings("unchecked")
            Map<String, Number> conversionBySource = (Map<String, Number>) stats.getOrDefault("conversionRateBySource", Map.of());
            @SuppressWarnings("unchecked")
            Map<String, Number> avgDaysBySource = (Map<String, Number>) stats.getOrDefault("avgDaysToHireBySource", Map.of());

            List<Map<String, Object>> result = new ArrayList<>();
            for (Map.Entry<String, Number> entry : appsBySource.entrySet()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("source", entry.getKey());
                row.put("applications", entry.getValue());
                row.put("hired", hiredBySource.getOrDefault(entry.getKey(), 0));
                row.put("conversionRate", conversionBySource.getOrDefault(entry.getKey(), 0));
                row.put("avgDaysToHire", avgDaysBySource.getOrDefault(entry.getKey(), 0));
                result.add(row);
            }
            return result;
        } catch (Exception e) {
            log.error("Failed to fetch source effectiveness data", e);
            return Collections.emptyList();
        }
    }

    /**
     * Fetch offer acceptance data: summary and monthly trend.
     */
    public List<Map<String, Object>> fetchOfferAcceptanceData(Report report) {
        try {
            Map<String, Object> stats = recruitmentClient.getOfferAcceptanceStats();
            List<Map<String, Object>> result = new ArrayList<>();

            // Summary row
            Map<String, Object> summary = new LinkedHashMap<>();
            summary.put("metric", "Summary");
            summary.put("totalOffersMade", stats.getOrDefault("totalOffersMade", 0));
            summary.put("totalAccepted", stats.getOrDefault("totalAccepted", 0));
            summary.put("totalDeclined", stats.getOrDefault("totalDeclined", 0));
            summary.put("acceptanceRate", stats.getOrDefault("acceptanceRatePercent", 0));
            summary.put("avgDaysToAccept", stats.getOrDefault("avgDaysToAccept", 0));
            result.add(summary);

            // Monthly trend rows
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> trend = (List<Map<String, Object>>) stats.getOrDefault("monthlyTrend", List.of());
            for (Map<String, Object> month : trend) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("month", month.getOrDefault("month", ""));
                row.put("offers", month.getOrDefault("offers", 0));
                row.put("accepted", month.getOrDefault("accepted", 0));
                row.put("declined", month.getOrDefault("declined", 0));
                row.put("acceptanceRate", month.getOrDefault("acceptanceRate", 0));
                result.add(row);
            }
            return result;
        } catch (Exception e) {
            log.error("Failed to fetch offer acceptance data", e);
            return Collections.emptyList();
        }
    }

    /**
     * Fetch external portal performance data: aggregated per portal.
     */
    public List<Map<String, Object>> fetchExternalPortalPerformanceData(Report report) {
        try {
            Map<String, Object> stats = recruitmentClient.getPortalPerformanceStats();
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> portals = (List<Map<String, Object>>) stats.getOrDefault("portals", List.of());

            List<Map<String, Object>> result = new ArrayList<>();
            for (Map<String, Object> portal : portals) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("portal", portal.getOrDefault("portal", ""));
                row.put("totalPostings", portal.getOrDefault("totalPostings", 0));
                row.put("activePostings", portal.getOrDefault("activePostings", 0));
                row.put("failedPostings", portal.getOrDefault("failedPostings", 0));
                row.put("expiredPostings", portal.getOrDefault("expiredPostings", 0));
                row.put("avgDaysLive", portal.getOrDefault("avgDaysLive", 0));
                row.put("postsToday", portal.getOrDefault("postsToday", 0));
                result.add(row);
            }
            return result;
        } catch (Exception e) {
            log.error("Failed to fetch external portal performance data", e);
            return Collections.emptyList();
        }
    }

    /**
     * Fetch job advert effectiveness data: per-job metrics.
     */
    public List<Map<String, Object>> fetchJobAdvertEffectivenessData(Report report) {
        try {
            Map<String, Object> stats = recruitmentClient.getAdvertPerformanceStats();
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> adverts = (List<Map<String, Object>>) stats.getOrDefault("adverts", List.of());

            List<Map<String, Object>> result = new ArrayList<>();
            for (Map<String, Object> advert : adverts) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("title", advert.getOrDefault("title", ""));
                row.put("department", advert.getOrDefault("departmentName", ""));
                row.put("views", advert.getOrDefault("views", 0));
                row.put("applications", advert.getOrDefault("applications", 0));
                row.put("conversionRate", advert.getOrDefault("conversionRate", 0));
                row.put("daysLive", advert.getOrDefault("daysLive", 0));
                row.put("status", advert.getOrDefault("status", ""));
                result.add(row);
            }
            return result;
        } catch (Exception e) {
            log.error("Failed to fetch job advert effectiveness data", e);
            return Collections.emptyList();
        }
    }

    // ==================== Generic/Fallback ====================

    /**
     * Generic fallback for unsupported report types.
     */
    private List<Map<String, Object>> fetchGenericData(Report report) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("reportType", report.getReportType().name());
        row.put("message", "Data fetching not implemented for this report type");
        row.put("generatedAt", LocalDateTime.now());
        return List.of(row);
    }
}
