package com.surework.support.controller;

import com.surework.support.config.JwtHeaderAuthenticationFilter.UserPrincipal;
import com.surework.support.domain.TicketPriority;
import com.surework.support.domain.TicketStatus;
import com.surework.support.dto.SupportDto;
import com.surework.support.service.SupportService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for support operations.
 */
@RestController
@RequestMapping("/api/support")
public class SupportController {

    private final SupportService supportService;

    public SupportController(SupportService supportService) {
        this.supportService = supportService;
    }

    // === Category Endpoints ===

    @GetMapping("/categories")
    public ResponseEntity<List<SupportDto.CategoryResponse>> getCategories() {
        return ResponseEntity.ok(supportService.getActiveCategories());
    }

    // === Self-Service Endpoints ===

    @PostMapping("/tickets")
    public ResponseEntity<SupportDto.TicketResponse> createTicket(
            @Valid @RequestBody SupportDto.CreateTicketRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        SupportDto.TicketResponse response = supportService.createTicket(
                request,
                principal.userId(),
                principal.username(),
                null // email can be fetched from identity service if needed
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my-tickets")
    public ResponseEntity<Page<SupportDto.TicketSummary>> getMyTickets(
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal UserPrincipal principal,
            Pageable pageable) {
        Page<SupportDto.TicketSummary> tickets = supportService.getMyTickets(
                principal.userId(), status, pageable);
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/my-tickets/stats")
    public ResponseEntity<SupportDto.TicketStats> getMyTicketStats(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(supportService.getMyTicketStats(principal.userId()));
    }

    @GetMapping("/tickets/{ticketId}")
    public ResponseEntity<SupportDto.TicketResponse> getTicket(
            @PathVariable UUID ticketId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return supportService.getTicket(ticketId, principal.userId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/tickets/{ticketId}/comments")
    public ResponseEntity<SupportDto.CommentResponse> addComment(
            @PathVariable UUID ticketId,
            @Valid @RequestBody SupportDto.AddCommentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        SupportDto.CommentResponse comment = supportService.addComment(
                ticketId, request, principal.userId(), principal.username(), false);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @PostMapping("/tickets/{ticketId}/close")
    public ResponseEntity<SupportDto.TicketResponse> closeTicket(
            @PathVariable UUID ticketId,
            @AuthenticationPrincipal UserPrincipal principal) {
        SupportDto.TicketResponse ticket = supportService.closeTicket(ticketId, principal.userId());
        return ResponseEntity.ok(ticket);
    }

    @PostMapping("/tickets/{ticketId}/reopen")
    public ResponseEntity<SupportDto.TicketResponse> reopenTicket(
            @PathVariable UUID ticketId,
            @AuthenticationPrincipal UserPrincipal principal) {
        SupportDto.TicketResponse ticket = supportService.reopenTicket(ticketId, principal.userId());
        return ResponseEntity.ok(ticket);
    }

    // === Admin Endpoints ===

    @GetMapping("/admin/tickets")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'SUPPORT_ADMIN', 'Super Administrator', 'Tenant Administrator', 'Support Administrator')")
    public ResponseEntity<Page<SupportDto.TicketSummary>> searchTickets(
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) TicketPriority priority,
            @RequestParam(required = false) String team,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        Page<SupportDto.TicketSummary> tickets = supportService.searchTickets(
                status, priority, team, category, search, pageable);
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/admin/tickets/stats")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'SUPPORT_ADMIN', 'Super Administrator', 'Tenant Administrator', 'Support Administrator')")
    public ResponseEntity<SupportDto.AdminTicketStats> getAdminStats() {
        return ResponseEntity.ok(supportService.getAdminStats());
    }

    @GetMapping("/admin/tickets/{ticketId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'SUPPORT_ADMIN', 'Super Administrator', 'Tenant Administrator', 'Support Administrator')")
    public ResponseEntity<SupportDto.TicketResponse> getTicketAdmin(@PathVariable UUID ticketId) {
        return supportService.getTicketAdmin(ticketId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/admin/tickets/{ticketId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'SUPPORT_ADMIN', 'Super Administrator', 'Tenant Administrator', 'Support Administrator')")
    public ResponseEntity<SupportDto.TicketResponse> updateTicket(
            @PathVariable UUID ticketId,
            @RequestBody SupportDto.UpdateTicketRequest request) {
        SupportDto.TicketResponse ticket = supportService.updateTicket(ticketId, request);
        return ResponseEntity.ok(ticket);
    }

    @PostMapping("/admin/tickets/{ticketId}/assign")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'SUPPORT_ADMIN', 'Super Administrator', 'Tenant Administrator', 'Support Administrator')")
    public ResponseEntity<SupportDto.TicketResponse> assignTicket(
            @PathVariable UUID ticketId,
            @RequestBody SupportDto.AssignTicketRequest request) {
        SupportDto.TicketResponse ticket = supportService.assignTicket(ticketId, request);
        return ResponseEntity.ok(ticket);
    }

    @PostMapping("/admin/tickets/{ticketId}/resolve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'SUPPORT_ADMIN', 'Super Administrator', 'Tenant Administrator', 'Support Administrator')")
    public ResponseEntity<SupportDto.TicketResponse> resolveTicket(
            @PathVariable UUID ticketId,
            @Valid @RequestBody SupportDto.ResolveTicketRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        SupportDto.TicketResponse ticket = supportService.resolveTicket(
                ticketId, request, principal.userId(), principal.username());
        return ResponseEntity.ok(ticket);
    }

    @PostMapping("/admin/tickets/{ticketId}/comments")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'SUPPORT_ADMIN', 'Super Administrator', 'Tenant Administrator', 'Support Administrator')")
    public ResponseEntity<SupportDto.CommentResponse> addAgentComment(
            @PathVariable UUID ticketId,
            @Valid @RequestBody SupportDto.AddCommentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        SupportDto.CommentResponse comment = supportService.addComment(
                ticketId, request, principal.userId(), principal.username(), true);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @PostMapping("/admin/tickets/{targetId}/merge")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'SUPPORT_ADMIN', 'Super Administrator', 'Tenant Administrator', 'Support Administrator')")
    public ResponseEntity<SupportDto.MergeTicketResponse> mergeTickets(
            @PathVariable UUID targetId,
            @Valid @RequestBody SupportDto.MergeTicketRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        SupportDto.MergeTicketResponse response = supportService.mergeTickets(
                targetId, request.sourceTicketId(), principal.userId(), principal.username());
        return ResponseEntity.ok(response);
    }

    // === Agent's Own Assigned Tickets ===

    @GetMapping("/agent/my-assignments")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'SUPPORT_ADMIN', 'SUPPORT_AGENT', 'Super Administrator', 'Tenant Administrator', 'Support Administrator', 'Support Agent')")
    public ResponseEntity<Page<SupportDto.TicketSummary>> getMyAssignedTickets(
            @AuthenticationPrincipal UserPrincipal principal,
            Pageable pageable) {
        Page<SupportDto.TicketSummary> tickets = supportService.getAssignedTickets(
                principal.userId(), pageable);
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/agent/team/{team}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'TENANT_ADMIN', 'SUPPORT_ADMIN', 'SUPPORT_AGENT', 'Super Administrator', 'Tenant Administrator', 'Support Administrator', 'Support Agent')")
    public ResponseEntity<Page<SupportDto.TicketSummary>> getTeamTickets(
            @PathVariable String team,
            Pageable pageable) {
        Page<SupportDto.TicketSummary> tickets = supportService.getTeamTickets(team, pageable);
        return ResponseEntity.ok(tickets);
    }
}
