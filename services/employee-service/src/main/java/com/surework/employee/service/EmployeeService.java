package com.surework.employee.service;

import com.surework.employee.domain.Department;
import com.surework.employee.domain.Employee;
import com.surework.employee.domain.Employee.EmploymentStatus;
import com.surework.employee.dto.EmployeeDto.*;
import com.surework.employee.repository.DepartmentRepository;
import com.surework.employee.repository.EmployeeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;

    public EmployeeService(EmployeeRepository employeeRepository, DepartmentRepository departmentRepository) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
    }

    public PageResponse<EmployeeListItem> searchEmployees(int page, int size, EmploymentStatus status,
                                                           UUID departmentId, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("lastName", "firstName"));
        Page<Employee> employeePage = employeeRepository.searchEmployees(status, departmentId, pageable);

        List<EmployeeListItem> items = employeePage.getContent().stream()
                .map(this::toListItem)
                .toList();

        return new PageResponse<>(
                items,
                employeePage.getNumber(),
                employeePage.getSize(),
                employeePage.getTotalElements(),
                employeePage.getTotalPages(),
                employeePage.isFirst(),
                employeePage.isLast()
        );
    }

    public List<EmployeeListItem> getActiveEmployees() {
        return employeeRepository.findAllActive().stream()
                .map(this::toListItem)
                .toList();
    }

    public Optional<EmployeeResponse> getEmployee(UUID id) {
        return employeeRepository.findById(id).map(this::toResponse);
    }

    public Optional<EmployeeResponse> getEmployeeByNumber(String employeeNumber) {
        return employeeRepository.findByEmployeeNumber(employeeNumber).map(this::toResponse);
    }

    public long countActiveEmployees() {
        return employeeRepository.countActive();
    }

    public List<DepartmentResponse> getDepartments() {
        return departmentRepository.findByActiveTrue().stream()
                .map(d -> new DepartmentResponse(d.getId(), d.getCode(), d.getName(), d.getDescription(), d.isActive()))
                .toList();
    }

    public List<EmployeeHierarchyItem> getHierarchyData() {
        return employeeRepository.findAllActive().stream()
                .map(this::toHierarchyItem)
                .toList();
    }

    private EmployeeHierarchyItem toHierarchyItem(Employee e) {
        return new EmployeeHierarchyItem(
                e.getId(),
                e.getEmployeeNumber(),
                e.getFullName(),
                e.getJobTitle(),
                e.getDepartment() != null ? e.getDepartment().getName() : null,
                e.getStatus(),
                e.getManager() != null ? e.getManager().getId() : null
        );
    }

    private EmployeeListItem toListItem(Employee e) {
        return new EmployeeListItem(
                e.getId(),
                e.getEmployeeNumber(),
                e.getFullName(),
                e.getEmail(),
                e.getPhone(),
                e.getDepartment() != null ? e.getDepartment().getName() : null,
                e.getJobTitle(),
                e.getStatus(),
                e.getHireDate()
        );
    }

    private EmployeeResponse toResponse(Employee e) {
        return new EmployeeResponse(
                e.getId(),
                e.getEmployeeNumber(),
                e.getFirstName(),
                e.getLastName(),
                e.getMiddleName(),
                e.getFullName(),
                e.getEmail(),
                e.getPhone(),
                e.getIdNumber(),
                e.getDateOfBirth(),
                e.getGender(),
                e.getMaritalStatus(),
                new AddressDto(e.getStreetAddress(), e.getSuburb(), e.getCity(), e.getProvince(), e.getPostalCode()),
                e.getHireDate(),
                e.getTerminationDate(),
                e.getStatus(),
                e.getEmploymentType(),
                e.getDepartment() != null ? new DepartmentInfo(e.getDepartment().getId(), e.getDepartment().getCode(), e.getDepartment().getName()) : null,
                e.getJobTitle() != null ? new JobTitleInfo(null, null, e.getJobTitle()) : null,
                e.getManager() != null ? new ManagerInfo(e.getManager().getId(), e.getManager().getEmployeeNumber(), e.getManager().getFullName()) : null,
                e.getBasicSalary(),
                e.getPayFrequency(),
                e.getTaxNumber(),
                e.getTaxStatus(),
                new BankingDto(e.getBankName(), e.getBankAccountNumber(), e.getBankBranchCode(), e.getBankAccountType()),
                new EmergencyContactDto(e.getEmergencyContactName(), e.getEmergencyContactPhone(), e.getEmergencyContactRelationship()),
                e.getCreatedAt() != null ? e.getCreatedAt().toString() : null,
                e.getUpdatedAt() != null ? e.getUpdatedAt().toString() : null
        );
    }
}
