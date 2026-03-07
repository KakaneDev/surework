package com.surework.identity.repository;

import com.surework.identity.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Role entity.
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, UUID> {

    Optional<Role> findByName(String name);

    Optional<Role> findByCode(String code);

    boolean existsByName(String name);

    List<Role> findByIsSystemRoleTrue();

    List<Role> findByIsSystemRoleFalse();
}
