package com.surework.identity.service;

import com.surework.common.messaging.DomainEventPublisher;
import com.surework.common.messaging.event.IdentityEvent;
import com.surework.common.security.TenantContext;
import com.surework.common.web.exception.ConflictException;
import com.surework.common.web.exception.ResourceNotFoundException;
import com.surework.identity.domain.Role;
import com.surework.identity.domain.User;
import com.surework.identity.dto.UserDto;
import com.surework.identity.repository.RoleRepository;
import com.surework.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of UserService.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final DomainEventPublisher eventPublisher;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    @Transactional
    public UserDto.Response createUser(UserDto.CreateRequest request) {
        // Check for duplicate email
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("User", "email", request.email());
        }

        // Create user
        User user = new User();
        user.setEmail(request.email());
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setPhone(request.phone());
        user.setEmployeeId(request.employeeId());
        user.setStatus(User.UserStatus.PENDING);

        // Generate temporary password
        String tempPassword = generateTemporaryPassword();
        user.setPasswordHash(passwordEncoder.encode(tempPassword));

        // Assign roles
        if (request.roles() != null && !request.roles().isEmpty()) {
            Set<Role> roles = request.roles().stream()
                    .map(roleName -> roleRepository.findByName(roleName)
                            .orElseThrow(() -> new ResourceNotFoundException("Role", "name", roleName)))
                    .collect(Collectors.toSet());
            user.setRoles(roles);
        } else {
            // Default to EMPLOYEE role
            roleRepository.findByName("EMPLOYEE").ifPresent(role ->
                    user.setRoles(Set.of(role)));
        }

        user = userRepository.save(user);

        // Publish event
        UUID tenantId = TenantContext.getTenantId().orElse(null);
        if (tenantId != null) {
            Set<String> roleNames = user.getRoles().stream()
                    .map(Role::getName)
                    .collect(Collectors.toSet());

            eventPublisher.publish(new IdentityEvent.UserCreated(
                    UUID.randomUUID(),
                    tenantId,
                    Instant.now(),
                    user.getId(),
                    user.getEmail(),
                    roleNames
            ));
        }

        log.info("Created user {} with email {}", user.getId(), user.getEmail());

        // TODO: Send welcome email with temporary password via notification service

        return UserDto.Response.fromEntity(user);
    }

    @Override
    @Transactional
    public UserDto.Response updateUser(UUID userId, UserDto.UpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (request.firstName() != null) {
            user.setFirstName(request.firstName());
        }
        if (request.lastName() != null) {
            user.setLastName(request.lastName());
        }
        if (request.phone() != null) {
            user.setPhone(request.phone());
        }
        if (request.roles() != null) {
            Set<Role> roles = request.roles().stream()
                    .map(roleName -> roleRepository.findByName(roleName)
                            .orElseThrow(() -> new ResourceNotFoundException("Role", "name", roleName)))
                    .collect(Collectors.toSet());
            user.setRoles(roles);
        }

        user = userRepository.save(user);
        log.info("Updated user {}", userId);

        return UserDto.Response.fromEntity(user);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserDto.Response> getUser(UUID userId) {
        return userRepository.findById(userId)
                .filter(u -> !u.isDeleted())
                .map(UserDto.Response::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<UserDto.Response> getUserByEmail(String email) {
        return userRepository.findByEmailAndDeletedFalse(email)
                .map(UserDto.Response::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDto.Response> listUsers(User.UserStatus status) {
        return userRepository.findAllByStatus(status).stream()
                .map(UserDto.Response::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public UserDto.Response activateUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        user.setStatus(User.UserStatus.ACTIVE);
        user = userRepository.save(user);

        UUID tenantId = TenantContext.getTenantId().orElse(null);
        if (tenantId != null) {
            eventPublisher.publish(new IdentityEvent.UserActivated(
                    UUID.randomUUID(),
                    tenantId,
                    Instant.now(),
                    userId,
                    user.getEmail()
            ));
        }

        log.info("Activated user {}", userId);
        return UserDto.Response.fromEntity(user);
    }

    @Override
    @Transactional
    public UserDto.Response suspendUser(UUID userId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        user.setStatus(User.UserStatus.SUSPENDED);
        user = userRepository.save(user);

        UUID tenantId = TenantContext.getTenantId().orElse(null);
        if (tenantId != null) {
            eventPublisher.publish(new IdentityEvent.UserDeactivated(
                    UUID.randomUUID(),
                    tenantId,
                    Instant.now(),
                    userId,
                    user.getEmail(),
                    reason
            ));
        }

        log.info("Suspended user {} - reason: {}", userId, reason);
        return UserDto.Response.fromEntity(user);
    }

    @Override
    @Transactional
    public UserDto.Response deactivateUser(UUID userId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        user.setStatus(User.UserStatus.DEACTIVATED);
        user.softDelete();
        user = userRepository.save(user);

        UUID tenantId = TenantContext.getTenantId().orElse(null);
        if (tenantId != null) {
            eventPublisher.publish(new IdentityEvent.UserDeactivated(
                    UUID.randomUUID(),
                    tenantId,
                    Instant.now(),
                    userId,
                    user.getEmail(),
                    reason
            ));
        }

        log.info("Deactivated user {} - reason: {}", userId, reason);
        return UserDto.Response.fromEntity(user);
    }

    @Override
    @Transactional
    public UserDto.Response assignRoles(UUID userId, Set<String> roleNames) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Set<String> previousRoles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        Set<Role> newRoles = roleNames.stream()
                .map(roleName -> roleRepository.findByName(roleName)
                        .orElseThrow(() -> new ResourceNotFoundException("Role", "name", roleName)))
                .collect(Collectors.toSet());

        user.getRoles().addAll(newRoles);
        user = userRepository.save(user);

        Set<String> currentRoles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        UUID tenantId = TenantContext.getTenantId().orElse(null);
        if (tenantId != null) {
            eventPublisher.publish(new IdentityEvent.UserRolesChanged(
                    UUID.randomUUID(),
                    tenantId,
                    Instant.now(),
                    userId,
                    previousRoles,
                    currentRoles,
                    TenantContext.getUserId().orElse(null)
            ));
        }

        log.info("Assigned roles {} to user {}", roleNames, userId);
        return UserDto.Response.fromEntity(user);
    }

    @Override
    @Transactional
    public UserDto.Response removeRoles(UUID userId, Set<String> roleNames) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Set<String> previousRoles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        user.getRoles().removeIf(role -> roleNames.contains(role.getName()));
        user = userRepository.save(user);

        Set<String> currentRoles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        UUID tenantId = TenantContext.getTenantId().orElse(null);
        if (tenantId != null) {
            eventPublisher.publish(new IdentityEvent.UserRolesChanged(
                    UUID.randomUUID(),
                    tenantId,
                    Instant.now(),
                    userId,
                    previousRoles,
                    currentRoles,
                    TenantContext.getUserId().orElse(null)
            ));
        }

        log.info("Removed roles {} from user {}", roleNames, userId);
        return UserDto.Response.fromEntity(user);
    }

    private String generateTemporaryPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        StringBuilder sb = new StringBuilder(16);
        for (int i = 0; i < 16; i++) {
            sb.append(chars.charAt(RANDOM.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
