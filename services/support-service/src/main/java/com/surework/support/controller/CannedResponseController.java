package com.surework.support.controller;

import com.surework.support.config.JwtHeaderAuthenticationFilter.UserPrincipal;
import com.surework.support.dto.SupportDto;
import com.surework.support.service.SupportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for canned response operations.
 */
@RestController
@RequestMapping("/api/support/canned-responses")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'SUPPORT_ADMIN', 'SUPPORT_AGENT', 'Super Administrator', 'Tenant Administrator', 'Support Administrator', 'Support Agent')")
public class CannedResponseController {

    private final SupportService supportService;

    public CannedResponseController(SupportService supportService) {
        this.supportService = supportService;
    }

    /**
     * Get all canned responses.
     */
    @GetMapping
    public ResponseEntity<List<SupportDto.CannedResponseResponse>> getAllCannedResponses(
            @RequestParam(required = false) String category) {
        List<SupportDto.CannedResponseResponse> responses = supportService.getCannedResponses(category);
        return ResponseEntity.ok(responses);
    }

    /**
     * Get a specific canned response by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<SupportDto.CannedResponseResponse> getCannedResponse(@PathVariable UUID id) {
        return supportService.getCannedResponse(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get all distinct categories.
     */
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        List<String> categories = supportService.getCannedResponseCategories();
        return ResponseEntity.ok(categories);
    }

    /**
     * Create a new canned response.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'SUPPORT_ADMIN', 'Super Administrator', 'Tenant Administrator', 'Support Administrator')")
    public ResponseEntity<SupportDto.CannedResponseResponse> createCannedResponse(
            @Valid @RequestBody SupportDto.CreateCannedResponseRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        SupportDto.CannedResponseResponse response = supportService.createCannedResponse(
                request, principal.userId(), principal.username());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Update an existing canned response.
     */
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'SUPPORT_ADMIN', 'Super Administrator', 'Tenant Administrator', 'Support Administrator')")
    public ResponseEntity<SupportDto.CannedResponseResponse> updateCannedResponse(
            @PathVariable UUID id,
            @Valid @RequestBody SupportDto.UpdateCannedResponseRequest request) {
        SupportDto.CannedResponseResponse response = supportService.updateCannedResponse(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a canned response (soft delete).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'SUPPORT_ADMIN', 'Super Administrator', 'Tenant Administrator', 'Support Administrator')")
    public ResponseEntity<Void> deleteCannedResponse(@PathVariable UUID id) {
        supportService.deleteCannedResponse(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Search canned responses.
     */
    @GetMapping("/search")
    public ResponseEntity<List<SupportDto.CannedResponseResponse>> searchCannedResponses(
            @RequestParam String q) {
        List<SupportDto.CannedResponseResponse> responses = supportService.searchCannedResponses(q);
        return ResponseEntity.ok(responses);
    }
}
