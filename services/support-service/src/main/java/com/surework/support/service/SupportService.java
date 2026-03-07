package com.surework.support.service;

import com.surework.support.domain.TicketPriority;
import com.surework.support.domain.TicketStatus;
import com.surework.support.dto.SupportDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service interface for support operations.
 */
public interface SupportService {

    // === Category Operations ===

    List<SupportDto.CategoryResponse> getActiveCategories();

    Optional<SupportDto.CategoryResponse> getCategoryByCode(String code);

    // === Self-Service Ticket Operations ===

    SupportDto.TicketResponse createTicket(SupportDto.CreateTicketRequest request,
                                           UUID requesterUserId, String requesterName, String requesterEmail);

    Optional<SupportDto.TicketResponse> getTicket(UUID ticketId, UUID requesterUserId);

    Page<SupportDto.TicketSummary> getMyTickets(UUID requesterUserId, String statusFilter, Pageable pageable);

    SupportDto.TicketStats getMyTicketStats(UUID requesterUserId);

    SupportDto.CommentResponse addComment(UUID ticketId, SupportDto.AddCommentRequest request,
                                          UUID authorId, String authorName, boolean isAgent);

    SupportDto.TicketResponse closeTicket(UUID ticketId, UUID requesterUserId);

    SupportDto.TicketResponse reopenTicket(UUID ticketId, UUID requesterUserId);

    // === Admin Ticket Operations ===

    Page<SupportDto.TicketSummary> searchTickets(TicketStatus status, TicketPriority priority,
                                                  String assignedTeam, String categoryCode,
                                                  String searchTerm, Pageable pageable);

    Optional<SupportDto.TicketResponse> getTicketAdmin(UUID ticketId);

    SupportDto.TicketResponse updateTicket(UUID ticketId, SupportDto.UpdateTicketRequest request);

    SupportDto.TicketResponse assignTicket(UUID ticketId, SupportDto.AssignTicketRequest request);

    SupportDto.TicketResponse resolveTicket(UUID ticketId, SupportDto.ResolveTicketRequest request,
                                            UUID agentId, String agentName);

    SupportDto.AdminTicketStats getAdminStats();

    // === Assigned Ticket Operations (for support agents) ===

    Page<SupportDto.TicketSummary> getAssignedTickets(UUID agentUserId, Pageable pageable);

    Page<SupportDto.TicketSummary> getTeamTickets(String team, Pageable pageable);

    // === Canned Response Operations ===

    List<SupportDto.CannedResponseResponse> getCannedResponses(String category);

    Optional<SupportDto.CannedResponseResponse> getCannedResponse(UUID id);

    List<String> getCannedResponseCategories();

    SupportDto.CannedResponseResponse createCannedResponse(SupportDto.CreateCannedResponseRequest request,
                                                           UUID createdBy, String createdByName);

    SupportDto.CannedResponseResponse updateCannedResponse(UUID id, SupportDto.UpdateCannedResponseRequest request);

    void deleteCannedResponse(UUID id);

    List<SupportDto.CannedResponseResponse> searchCannedResponses(String searchTerm);

    // === Ticket Merge Operations ===

    SupportDto.MergeTicketResponse mergeTickets(UUID targetTicketId, UUID sourceTicketId, UUID agentId, String agentName);
}
