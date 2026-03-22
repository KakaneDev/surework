package com.surework.hr.security;

import com.surework.common.security.TenantContext;
import com.surework.common.security.TenantNotSetException;
import com.surework.hr.domain.Employee;
import com.surework.hr.repository.EmployeeRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Integration tests for tenant isolation security.
 *
 * These tests verify that:
 * 1. Tenant context is properly enforced
 * 2. Cross-tenant data access is prevented
 * 3. Tenant-filtered queries work correctly
 *
 * CRITICAL: These tests must pass before production deployment.
 * Tenant isolation failures can lead to serious data breaches.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class TenantIsolationTest {

    private static final UUID TENANT_A = UUID.randomUUID();
    private static final UUID TENANT_B = UUID.randomUUID();

    @Autowired
    private EmployeeRepository employeeRepository;

    @BeforeEach
    void setUp() {
        // Clear tenant context before each test
        TenantContext.clear();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Nested
    @DisplayName("Tenant Context Enforcement Tests")
    class TenantContextEnforcementTests {

        @Test
        @DisplayName("requireTenantId should throw TenantNotSetException when context is empty")
        void requireTenantId_WhenContextEmpty_ThrowsException() {
            assertThatThrownBy(TenantContext::requireTenantId)
                    .isInstanceOf(TenantNotSetException.class)
                    .hasMessageContaining("Tenant context not set");
        }

        @Test
        @DisplayName("requireTenantId should return tenant ID when context is set")
        void requireTenantId_WhenContextSet_ReturnsTenantId() {
            TenantContext.setTenantId(TENANT_A);

            UUID result = TenantContext.requireTenantId();

            assertThat(result).isEqualTo(TENANT_A);
        }

        @Test
        @DisplayName("getTenantId should return empty Optional when context is empty")
        void getTenantId_WhenContextEmpty_ReturnsEmpty() {
            Optional<UUID> result = TenantContext.getTenantId();

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("clear should remove tenant context")
        void clear_RemovesTenantContext() {
            TenantContext.setTenantId(TENANT_A);

            TenantContext.clear();

            assertThat(TenantContext.getTenantId()).isEmpty();
        }
    }

    @Nested
    @DisplayName("Cross-Tenant Data Access Prevention Tests")
    class CrossTenantAccessTests {

        @Test
        @DisplayName("Tenant-filtered query should only return data for current tenant")
        void tenantFilteredQuery_ReturnsOnlyCurrentTenantData() {
            // Create employee for Tenant A
            TenantContext.setTenantId(TENANT_A);
            Employee employeeA = createEmployee("EMP-A-001", "John", "Doe", TENANT_A);
            employeeRepository.save(employeeA);

            // Create employee for Tenant B
            TenantContext.setTenantId(TENANT_B);
            Employee employeeB = createEmployee("EMP-B-001", "Jane", "Smith", TENANT_B);
            employeeRepository.save(employeeB);

            // Query with Tenant A context
            TenantContext.setTenantId(TENANT_A);
            List<Employee> tenantAEmployees = employeeRepository.findAllByTenantId(TENANT_A);

            // Should only see Tenant A's employee
            assertThat(tenantAEmployees)
                    .hasSize(1)
                    .extracting(Employee::getEmployeeNumber)
                    .containsExactly("EMP-A-001");
        }

        @Test
        @DisplayName("findByIdAndTenantId should not return other tenant's data")
        void findByIdAndTenantId_ShouldNotReturnOtherTenantData() {
            // Create employee for Tenant A
            TenantContext.setTenantId(TENANT_A);
            Employee employeeA = createEmployee("EMP-A-002", "John", "Doe", TENANT_A);
            employeeA = employeeRepository.save(employeeA);
            UUID employeeAId = employeeA.getId();

            // Try to access with Tenant B context
            TenantContext.setTenantId(TENANT_B);
            Optional<Employee> result = employeeRepository.findByIdAndTenantId(employeeAId, TENANT_B);

            // Should not find the employee
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("countActiveEmployeesByTenantId should only count current tenant's employees")
        void countActiveEmployees_ShouldOnlyCountCurrentTenant() {
            // Create employees for both tenants
            TenantContext.setTenantId(TENANT_A);
            employeeRepository.save(createEmployee("EMP-A-003", "Alice", "A", TENANT_A));
            employeeRepository.save(createEmployee("EMP-A-004", "Bob", "A", TENANT_A));

            TenantContext.setTenantId(TENANT_B);
            employeeRepository.save(createEmployee("EMP-B-002", "Charlie", "B", TENANT_B));

            // Count for Tenant A
            TenantContext.setTenantId(TENANT_A);
            long countA = employeeRepository.countActiveEmployeesByTenantId(TENANT_A);

            // Count for Tenant B
            TenantContext.setTenantId(TENANT_B);
            long countB = employeeRepository.countActiveEmployeesByTenantId(TENANT_B);

            assertThat(countA).isEqualTo(2);
            assertThat(countB).isEqualTo(1);
        }
    }

    @Nested
    @DisplayName("Tenant ID Field Population Tests")
    class TenantIdFieldTests {

        @Test
        @DisplayName("Saved entity should have tenantId populated")
        void savedEntity_ShouldHaveTenantIdPopulated() {
            TenantContext.setTenantId(TENANT_A);

            Employee employee = createEmployee("EMP-TID-001", "Test", "User", TENANT_A);
            Employee saved = employeeRepository.save(employee);

            assertThat(saved.getTenantId()).isEqualTo(TENANT_A);
        }
    }

    /**
     * Helper method to create an employee entity.
     */
    private Employee createEmployee(String employeeNumber, String firstName, String lastName, UUID tenantId) {
        Employee employee = new Employee();
        employee.setEmployeeNumber(employeeNumber);
        employee.setFirstName(firstName);
        employee.setLastName(lastName);
        employee.setEmail(employeeNumber.toLowerCase() + "@test.com");
        employee.setTenantId(tenantId);
        employee.setStatus(Employee.EmploymentStatus.ACTIVE);
        return employee;
    }
}
