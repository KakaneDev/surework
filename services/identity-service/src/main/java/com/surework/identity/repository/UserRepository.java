package com.surework.identity.repository;

import com.surework.identity.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for User entity.
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailAndDeletedFalse(String email);

    boolean existsByEmail(String email);

    Optional<User> findByEmployeeId(UUID employeeId);

    @Query("""
        SELECT u FROM User u
        WHERE u.deleted = false
        AND (:status IS NULL OR u.status = :status)
        ORDER BY u.lastName, u.firstName
        """)
    List<User> findAllByStatus(@Param("status") User.UserStatus status);

    @Query("""
        SELECT u FROM User u
        JOIN u.roles r
        WHERE r.name = :roleName
        AND u.deleted = false
        ORDER BY u.lastName, u.firstName
        """)
    List<User> findByRoleName(@Param("roleName") String roleName);

    @Query("""
        SELECT COUNT(u) FROM User u
        WHERE u.deleted = false
        AND u.status = 'ACTIVE'
        """)
    long countActiveUsers();
}
