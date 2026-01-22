package com.surework.admin.repository;

import com.surework.admin.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoleRepository extends JpaRepository<Role, UUID> {

    Optional<Role> findByCode(String code);

    Optional<Role> findByTenantIdAndCode(UUID tenantId, String code);

    List<Role> findByTenantIdIsNull();  // System roles

    List<Role> findByTenantId(UUID tenantId);

    @Query("SELECT r FROM Role r WHERE r.tenantId = :tenantId OR r.tenantId IS NULL")
    List<Role> findAllForTenant(@Param("tenantId") UUID tenantId);

    List<Role> findByTenantIdAndActiveTrue(UUID tenantId);

    Optional<Role> findByTenantIdAndIsDefaultTrue(UUID tenantId);

    @Query("SELECT r FROM Role r WHERE (r.tenantId = :tenantId OR r.tenantId IS NULL) AND r.isDefault = TRUE")
    Optional<Role> findDefaultRoleForTenant(@Param("tenantId") UUID tenantId);

    List<Role> findByIsSystemRoleTrue();

    boolean existsByTenantIdAndCode(UUID tenantId, String code);
}
