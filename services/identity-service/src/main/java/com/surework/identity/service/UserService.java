package com.surework.identity.service;

import com.surework.identity.domain.User;
import com.surework.identity.dto.UserDto;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service interface for user management operations.
 */
public interface UserService {

    /**
     * Create a new user.
     */
    UserDto.Response createUser(UserDto.CreateRequest request);

    /**
     * Create a new user with password (for signup flow).
     */
    UserDto.Response createUserWithPassword(
            String email,
            String firstName,
            String lastName,
            String phone,
            java.util.Set<String> roles,
            UUID employeeId,
            String password,
            UUID tenantId
    );

    /**
     * Update user details.
     */
    UserDto.Response updateUser(UUID userId, UserDto.UpdateRequest request);

    /**
     * Get user by ID.
     */
    Optional<UserDto.Response> getUser(UUID userId);

    /**
     * Get user by email.
     */
    Optional<UserDto.Response> getUserByEmail(String email);

    /**
     * List all users with optional status filter.
     */
    List<UserDto.Response> listUsers(User.UserStatus status);

    /**
     * Activate a user.
     */
    UserDto.Response activateUser(UUID userId);

    /**
     * Suspend a user.
     */
    UserDto.Response suspendUser(UUID userId, String reason);

    /**
     * Deactivate a user.
     */
    UserDto.Response deactivateUser(UUID userId, String reason);

    /**
     * Assign roles to a user.
     */
    UserDto.Response assignRoles(UUID userId, java.util.Set<String> roleNames);

    /**
     * Remove roles from a user.
     */
    UserDto.Response removeRoles(UUID userId, java.util.Set<String> roleNames);

    /**
     * Verify a user's email using a verification code.
     */
    UserDto.Response verifyCode(String email, String code);

    /**
     * Resend the email verification code to a pending user.
     */
    void resendVerificationCode(String email);
}
