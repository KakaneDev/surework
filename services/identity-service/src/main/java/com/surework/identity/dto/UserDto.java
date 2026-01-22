package com.surework.identity.dto;

import com.surework.identity.domain.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * DTOs for user management operations.
 */
public sealed interface UserDto {

    /**
     * Request to create a new user.
     */
    record CreateRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Invalid email format")
            String email,

            @NotBlank(message = "First name is required")
            @Size(min = 1, max = 100, message = "First name must be between 1 and 100 characters")
            String firstName,

            @NotBlank(message = "Last name is required")
            @Size(min = 1, max = 100, message = "Last name must be between 1 and 100 characters")
            String lastName,

            String phone,

            Set<String> roles,

            UUID employeeId
    ) implements UserDto {}

    /**
     * Request to update user details.
     */
    record UpdateRequest(
            @Size(min = 1, max = 100, message = "First name must be between 1 and 100 characters")
            String firstName,

            @Size(min = 1, max = 100, message = "Last name must be between 1 and 100 characters")
            String lastName,

            String phone,

            Set<String> roles
    ) implements UserDto {}

    /**
     * User response DTO.
     */
    record Response(
            UUID id,
            String email,
            String firstName,
            String lastName,
            String fullName,
            String phone,
            User.UserStatus status,
            boolean mfaEnabled,
            Instant lastLogin,
            UUID employeeId,
            Set<String> roles,
            Instant createdAt,
            Instant updatedAt
    ) implements UserDto {

        public static Response fromEntity(User user) {
            Set<String> roleNames = user.getRoles().stream()
                    .map(role -> role.getName())
                    .collect(Collectors.toSet());

            return new Response(
                    user.getId(),
                    user.getEmail(),
                    user.getFirstName(),
                    user.getLastName(),
                    user.getFullName(),
                    user.getPhone(),
                    user.getStatus(),
                    user.isMfaEnabled(),
                    user.getLastLogin(),
                    user.getEmployeeId(),
                    roleNames,
                    user.getCreatedAt(),
                    user.getUpdatedAt()
            );
        }
    }
}
