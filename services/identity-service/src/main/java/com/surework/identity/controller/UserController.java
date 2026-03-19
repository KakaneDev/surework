package com.surework.identity.controller;

import com.surework.common.web.exception.ResourceNotFoundException;
import com.surework.identity.domain.User;
import com.surework.identity.dto.UserDto;
import com.surework.identity.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * REST controller for user management.
 * Implements Constitution Principle I: RESTful API Design.
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Create a new user.
     */
    @PostMapping
    public ResponseEntity<UserDto.Response> createUser(
            @Valid @RequestBody UserDto.CreateRequest request) {
        UserDto.Response response = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Request for signup user creation (includes password).
     * Validates all required fields for tenant admin user creation.
     */
    public record SignupUserRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Invalid email format")
            @Size(max = 255, message = "Email must not exceed 255 characters")
            String email,

            @NotBlank(message = "First name is required")
            @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
            String firstName,

            @NotBlank(message = "Last name is required")
            @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
            String lastName,

            @NotBlank(message = "Phone number is required")
            @Pattern(regexp = "^\\+27[0-9]{9}$", message = "Phone must be a valid SA number (+27XXXXXXXXX)")
            String phone,

            Set<String> roles,

            UUID employeeId,

            @NotBlank(message = "Password is required")
            @Size(min = 12, message = "Password must be at least 12 characters")
            @Pattern(
                    regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$",
                    message = "Password must contain at least one uppercase, one lowercase, one digit, and one special character"
            )
            String password,

            @NotNull(message = "Tenant ID is required")
            UUID tenantId
    ) {}

    /**
     * Create a new user during tenant signup.
     * This endpoint accepts password and tenantId for the initial admin user.
     */
    @PostMapping("/signup")
    public ResponseEntity<UserDto.Response> createSignupUser(
            @Valid @RequestBody SignupUserRequest request) {
        UserDto.Response response = userService.createUserWithPassword(
                request.email(),
                request.firstName(),
                request.lastName(),
                request.phone(),
                request.roles(),
                request.employeeId(),
                request.password(),
                request.tenantId()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get user by ID.
     */
    @GetMapping("/{userId}")
    public ResponseEntity<UserDto.Response> getUser(@PathVariable UUID userId) {
        return userService.getUser(userId)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
    }

    /**
     * Get user by email.
     */
    @GetMapping("/email/{email}")
    public ResponseEntity<UserDto.Response> getUserByEmail(@PathVariable String email) {
        return userService.getUserByEmail(email)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));
    }

    /**
     * Response for email availability check.
     */
    public record EmailAvailabilityResponse(boolean available) {}

    /**
     * Check if email is available (not already registered).
     * Public endpoint for signup validation.
     */
    @GetMapping("/email-available")
    public ResponseEntity<EmailAvailabilityResponse> isEmailAvailable(@RequestParam String email) {
        boolean available = userService.getUserByEmail(email).isEmpty();
        return ResponseEntity.ok(new EmailAvailabilityResponse(available));
    }

    /**
     * List users with optional status filter.
     */
    @GetMapping
    public ResponseEntity<List<UserDto.Response>> listUsers(
            @RequestParam(required = false) User.UserStatus status) {
        List<UserDto.Response> users = userService.listUsers(status);
        return ResponseEntity.ok(users);
    }

    /**
     * Update user details.
     */
    @PatchMapping("/{userId}")
    public ResponseEntity<UserDto.Response> updateUser(
            @PathVariable UUID userId,
            @Valid @RequestBody UserDto.UpdateRequest request) {
        UserDto.Response response = userService.updateUser(userId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Activate a user.
     */
    @PostMapping("/{userId}/activate")
    public ResponseEntity<UserDto.Response> activateUser(@PathVariable UUID userId) {
        UserDto.Response response = userService.activateUser(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Suspend a user.
     */
    @PostMapping("/{userId}/suspend")
    public ResponseEntity<UserDto.Response> suspendUser(
            @PathVariable UUID userId,
            @RequestParam String reason) {
        UserDto.Response response = userService.suspendUser(userId, reason);
        return ResponseEntity.ok(response);
    }

    /**
     * Deactivate a user.
     */
    @PostMapping("/{userId}/deactivate")
    public ResponseEntity<UserDto.Response> deactivateUser(
            @PathVariable UUID userId,
            @RequestParam String reason) {
        UserDto.Response response = userService.deactivateUser(userId, reason);
        return ResponseEntity.ok(response);
    }

    /**
     * Assign roles to a user.
     */
    @PostMapping("/{userId}/roles")
    public ResponseEntity<UserDto.Response> assignRoles(
            @PathVariable UUID userId,
            @RequestBody Set<String> roles) {
        UserDto.Response response = userService.assignRoles(userId, roles);
        return ResponseEntity.ok(response);
    }

    /**
     * Remove roles from a user.
     */
    @DeleteMapping("/{userId}/roles")
    public ResponseEntity<UserDto.Response> removeRoles(
            @PathVariable UUID userId,
            @RequestBody Set<String> roles) {
        UserDto.Response response = userService.removeRoles(userId, roles);
        return ResponseEntity.ok(response);
    }

    /**
     * Request record for email verification code submission.
     */
    public record VerifyCodeRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6, max = 6) String code
    ) {}

    /**
     * Request record for resending an email verification code.
     */
    public record ResendCodeRequest(
            @NotBlank @Email String email
    ) {}

    /**
     * Verify a user's email address using a one-time verification code.
     */
    @PostMapping("/verify-code")
    public ResponseEntity<UserDto.Response> verifyCode(
            @RequestBody @Valid VerifyCodeRequest request) {
        var response = userService.verifyCode(request.email(), request.code());
        return ResponseEntity.ok(response);
    }

    /**
     * Resend the email verification code to a pending user.
     */
    @PostMapping("/resend-code")
    public ResponseEntity<Void> resendCode(
            @RequestBody @Valid ResendCodeRequest request) {
        userService.resendVerificationCode(request.email());
        return ResponseEntity.ok().build();
    }
}
