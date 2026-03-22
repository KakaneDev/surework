package com.surework.reporting.repository;

import com.surework.reporting.domain.Dashboard;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DashboardRepository extends JpaRepository<Dashboard, UUID> {

    List<Dashboard> findByTenantId(UUID tenantId);

    Page<Dashboard> findByTenantId(UUID tenantId, Pageable pageable);

    Optional<Dashboard> findByTenantIdAndIsDefaultTrue(UUID tenantId);

    List<Dashboard> findByTenantIdAndDashboardType(UUID tenantId, Dashboard.DashboardType dashboardType);

    List<Dashboard> findByTenantIdAndCreatedBy(UUID tenantId, UUID createdBy);

    // Find shared dashboards accessible to user roles
    @Query("SELECT d FROM Dashboard d WHERE d.tenantId = :tenantId " +
           "AND (d.createdBy = :userId OR d.shared = true)")
    List<Dashboard> findAccessibleDashboards(@Param("tenantId") UUID tenantId,
                                             @Param("userId") UUID userId);

    // Check if dashboard with name exists
    boolean existsByTenantIdAndName(UUID tenantId, String name);

    // Count dashboards by type
    @Query("SELECT d.dashboardType, COUNT(d) FROM Dashboard d " +
           "WHERE d.tenantId = :tenantId GROUP BY d.dashboardType")
    List<Object[]> countByTypeForTenant(@Param("tenantId") UUID tenantId);
}
