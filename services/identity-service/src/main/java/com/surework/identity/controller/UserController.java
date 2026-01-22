package com.surework.identity.controller;

import com.surework.common.web.exception.ResourceNotFoundException;
import com.surework.identity.domain.User;
import com.surework.identity.dto.UserDto;
import com.surework.identity.service.UserService;
import jakarta.validation.Valid;
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
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
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
}
