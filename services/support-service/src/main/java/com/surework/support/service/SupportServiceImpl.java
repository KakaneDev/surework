package com.surework.support.service;

import com.surework.common.messaging.DomainEventPublisher;
import com.surework.common.messaging.event.SupportEvent;
import com.surework.common.security.TenantContext;
import com.surework.support.client.NotificationClient;
import com.surework.support.domain.*;
import com.surework.support.dto.SupportDto;
import com.surework.support.repository.CannedResponseRepository;
import com.surework.support.repository.TicketCategoryRepository;
import com.surework.support.repository.TicketCommentRepository;
import com.surework.support.repository.TicketRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementation of the support service.
 */
@Service
@Transactional
@Slf4j
public class SupportServiceImpl implements SupportService {

    private final TicketRepository ticketRepository;
    private final TicketCategoryRepository categoryRepository;
    private final TicketCommentRepository commentRepository;
    private final CannedResponseRepository cannedResponseRepository;
    private final NotificationClient notificationClient;

    @Nullable
    private final DomainEventPublisher eventPublisher;

    @Autowired
    public SupportServiceImpl(
            TicketRepository ticketRepository,
            TicketCategoryRepository categoryRepository,
            TicketCommentRepository commentRepository,
            CannedResponseRepository cannedResponseRepository,
            NotificationClient notificationClient,
            @Autowired(required = false) @Nullable DomainEventPublisher eventPublisher) {
        this.ticketRepository = ticketRepository;
        this.categoryRepository = categoryRepository;
        this.commentRepository = commentRepository;
        this.cannedResponseRepository = cannedResponseRepository;
        this.notificationClient = notificationClient;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Get the current tenant ID from context.
     * @throws com.surework.common.security.TenantNotSetException if tenant context is not available
     */
    private UUID getTenantId() {
        return TenantContext.requireTenantId();
    }

    /**
     * Publishes event to Kafka with synchronous notification fallback.
     * If Kafka is unavailable or publish fails, sends notification directly via REST.
     */
    private void publishEventWithFallback(SupportEvent event, Runnable fallbackNotification) {
        if (eventPublisher == null) {
            log.debug("Kafka not available, using direct notification");
            try {
                fallbackNotification.run();
            } catch (Exception e) {
                log.error("Direct notification failed: {}", e.getMessage());
            }
            return;
        }

        try {
            eventPublisher.publish(event);
            log.debug("Published event: {}", event.eventType());
        } catch (Exception e) {
            log.warn("Kafka event publish failed, using direct notification fallback: {}", e.getMessage());
            try {
                fallbackNotification.run();
            } catch (Exception fallbackEx) {
                log.error("Fallback notification also failed: {}", fallbackEx.getMessage());
            }
        }
    }

    // === Category Operations ===

    @Override
    @Transactional(readOnly = true)
    public List<SupportDto.CategoryResponse> getActiveCategories() {
        return categoryRepository.findByActiveTrueOrderByDisplayOrderAsc()
                .stream()
                .map(SupportDto.CategoryResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<SupportDto.CategoryResponse> getCategoryByCode(String code) {
        return categoryRepository.findByCode(code)
                .map(SupportDto.CategoryResponse::fromEntity);
    }

    // === Self-Service Ticket Operations ===

    @Override
    public SupportDto.TicketResponse createTicket(SupportDto.CreateTicketRequest request,
                                                   UUID requesterUserId, String requesterName, String requesterEmail) {
        TicketCategory category = categoryRepository.findByCode(request.categoryCode())
                .orElseThrow(() -> new IllegalArgumentException("Invalid category: " + request.categoryCode()));

        Ticket ticket = Ticket.create(
                category,
                request.subject(),
                request.description(),
                request.priority(),
                requesterUserId,
                requesterName
        );
        ticket.setSubcategory(request.subcategory());
        ticket.setRequesterEmail(requesterEmail);

        ticket = ticketRepository.save(ticket);
        log.info("Created ticket {} for user {}", ticket.getTicketReference(), requesterUserId);

        // Publish TicketCreated event with fallback notification
        final Ticket savedTicket = ticket;
        publishEventWithFallback(
                new SupportEvent.TicketCreated(
                        UUID.randomUUID(),
                        getTenantId(),
                        Instant.now(),
                        savedTicket.getId(),
                        savedTicket.getTicketReference(),
                        requesterUserId,
                        savedTicket.getSubject(),
                        savedTicket.getAssignedTeam()
                ),
                () -> notificationClient.notifyTicketCreated(
                        requesterUserId,
                        savedTicket.getTicketReference(),
                        savedTicket.getSubject(),
                        savedTicket.getAssignedTeam()
                )
        );

        return SupportDto.TicketResponse.fromEntity(ticket);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<SupportDto.TicketResponse> getTicket(UUID ticketId, UUID requesterUserId) {
        return ticketRepository.findById(ticketId)
                .filter(t -> t.getRequesterUserId().equals(requesterUserId))
                .map(SupportDto.TicketResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SupportDto.TicketSummary> getMyTickets(UUID requesterUserId, String statusFilter, Pageable pageable) {
        Page<Ticket> tickets;

        if (statusFilter == null || statusFilter.isBlank() || "all".equalsIgnoreCase(statusFilter)) {
            tickets = ticketRepository.findByRequesterUserIdOrderByCreatedAtDesc(requesterUserId, pageable);
        } else if ("open".equalsIgnoreCase(statusFilter)) {
            List<TicketStatus> openStatuses = List.of(TicketStatus.NEW, TicketStatus.IN_PROGRESS, TicketStatus.PENDING);
            tickets = ticketRepository.findByRequesterUserIdAndStatusInOrderByCreatedAtDesc(
                    requesterUserId, openStatuses, pageable);
        } else if ("resolved".equalsIgnoreCase(statusFilter)) {
            List<TicketStatus> closedStatuses = List.of(TicketStatus.RESOLVED, TicketStatus.CLOSED);
            tickets = ticketRepository.findByRequesterUserIdAndStatusInOrderByCreatedAtDesc(
                    requesterUserId, closedStatuses, pageable);
        } else {
            TicketStatus status = TicketStatus.valueOf(statusFilter.toUpperCase());
            tickets = ticketRepository.findByRequesterUserIdAndStatusOrderByCreatedAtDesc(
                    requesterUserId, status, pageable);
        }

        return tickets.map(SupportDto.TicketSummary::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public SupportDto.TicketStats getMyTicketStats(UUID requesterUserId) {
        List<TicketStatus> openStatuses = List.of(TicketStatus.NEW, TicketStatus.IN_PROGRESS);
        List<TicketStatus> closedStatuses = List.of(TicketStatus.RESOLVED, TicketStatus.CLOSED);

        long open = ticketRepository.countByRequesterUserIdAndStatusIn(requesterUserId, openStatuses);
        long pending = ticketRepository.countByRequesterUserIdAndStatus(requesterUserId, TicketStatus.PENDING);
        long resolved = ticketRepository.countByRequesterUserIdAndStatusIn(requesterUserId, closedStatuses);
        long total = open + pending + resolved;

        // Calculate avg resolution time from last 30 days
        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        Double avgTime = ticketRepository.calculateAvgResolutionTimeHours(thirtyDaysAgo);

        return new SupportDto.TicketStats(open, pending, resolved, total, avgTime != null ? avgTime : 0.0);
    }

    @Override
    public SupportDto.CommentResponse addComment(UUID ticketId, SupportDto.AddCommentRequest request,
                                                  UUID authorId, String authorName, boolean isAgent) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketId));

        TicketComment comment = ticket.addComment(request.content(), authorId, authorName, isAgent);
        comment.setInternal(request.internal());

        ticketRepository.save(ticket);
        log.info("Added comment to ticket {} by user {}", ticket.getTicketReference(), authorId);

        // Publish TicketCommentAdded event with fallback notification
        final Ticket savedTicket = ticket;
        final UUID recipientId = isAgent ? savedTicket.getRequesterUserId() : savedTicket.getAssignedUserId();
        publishEventWithFallback(
                new SupportEvent.TicketCommentAdded(
                        UUID.randomUUID(),
                        getTenantId(),
                        Instant.now(),
                        savedTicket.getId(),
                        savedTicket.getTicketReference(),
                        authorId,
                        isAgent,
                        savedTicket.getRequesterUserId(),
                        savedTicket.getAssignedUserId()
                ),
                () -> notificationClient.notifyTicketComment(
                        recipientId,
                        savedTicket.getTicketReference(),
                        savedTicket.getId(),
                        isAgent
                )
        );

        return SupportDto.CommentResponse.fromEntity(comment);
    }

    @Override
    public SupportDto.TicketResponse closeTicket(UUID ticketId, UUID requesterUserId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .filter(t -> t.getRequesterUserId().equals(requesterUserId))
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found or not owned by user"));

        ticket.close();
        ticket = ticketRepository.save(ticket);
        log.info("Ticket {} closed by requester {}", ticket.getTicketReference(), requesterUserId);

        // Publish TicketClosed event (no notification needed - requester closed their own ticket)
        final Ticket savedTicket = ticket;
        publishEventWithFallback(
                new SupportEvent.TicketClosed(
                        UUID.randomUUID(),
                        getTenantId(),
                        Instant.now(),
                        savedTicket.getId(),
                        savedTicket.getTicketReference(),
                        requesterUserId
                ),
                () -> log.debug("Ticket closed by requester - no notification needed")
        );

        return SupportDto.TicketResponse.fromEntity(ticket);
    }

    @Override
    public SupportDto.TicketResponse reopenTicket(UUID ticketId, UUID requesterUserId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .filter(t -> t.getRequesterUserId().equals(requesterUserId))
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found or not owned by user"));

        ticket.reopen();
        ticket = ticketRepository.save(ticket);
        log.info("Ticket {} reopened by requester {}", ticket.getTicketReference(), requesterUserId);

        // Publish TicketReopened event with fallback notification
        final Ticket savedTicket = ticket;
        publishEventWithFallback(
                new SupportEvent.TicketReopened(
                        UUID.randomUUID(),
                        getTenantId(),
                        Instant.now(),
                        savedTicket.getId(),
                        savedTicket.getTicketReference(),
                        requesterUserId,
                        savedTicket.getAssignedUserId()
                ),
                () -> notificationClient.notifyTicketReopened(
                        savedTicket.getAssignedUserId(),
                        savedTicket.getTicketReference(),
                        savedTicket.getId()
                )
        );

        return SupportDto.TicketResponse.fromEntity(ticket);
    }

    // === Admin Ticket Operations ===

    @Override
    @Transactional(readOnly = true)
    public Page<SupportDto.TicketSummary> searchTickets(TicketStatus status, TicketPriority priority,
                                                         String assignedTeam, String categoryCode,
                                                         String searchTerm, Pageable pageable) {
        return ticketRepository.searchTickets(status, priority, assignedTeam, categoryCode, searchTerm, pageable)
                .map(SupportDto.TicketSummary::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<SupportDto.TicketResponse> getTicketAdmin(UUID ticketId) {
        return ticketRepository.findById(ticketId)
                .map(SupportDto.TicketResponse::fromEntity);
    }

    @Override
    public SupportDto.TicketResponse updateTicket(UUID ticketId, SupportDto.UpdateTicketRequest request) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketId));

        if (request.subject() != null) {
            ticket.setSubject(request.subject());
        }
        if (request.description() != null) {
            ticket.setDescription(request.description());
        }
        if (request.priority() != null) {
            ticket.setPriority(request.priority());
        }
        if (request.status() != null) {
            ticket.setStatus(request.status());
        }
        if (request.assignedTeam() != null) {
            ticket.setAssignedTeam(request.assignedTeam());
        }

        ticket = ticketRepository.save(ticket);
        log.info("Updated ticket {}", ticket.getTicketReference());

        return SupportDto.TicketResponse.fromEntity(ticket);
    }

    @Override
    public SupportDto.TicketResponse assignTicket(UUID ticketId, SupportDto.AssignTicketRequest request) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketId));

        if (request.assignToUserId() != null) {
            ticket.assignTo(request.assignToUserId(), request.assignToUserName());
        }
        if (request.assignedTeam() != null) {
            ticket.setAssignedTeam(request.assignedTeam());
        }

        ticket = ticketRepository.save(ticket);
        log.info("Assigned ticket {} to user {} / team {}",
                ticket.getTicketReference(), request.assignToUserId(), request.assignedTeam());

        // Publish TicketAssigned event with fallback notification if assigned to a user
        if (request.assignToUserId() != null) {
            final Ticket savedTicket = ticket;
            publishEventWithFallback(
                    new SupportEvent.TicketAssigned(
                            UUID.randomUUID(),
                            getTenantId(),
                            Instant.now(),
                            savedTicket.getId(),
                            savedTicket.getTicketReference(),
                            request.assignToUserId(),
                            request.assignToUserName(),
                            savedTicket.getRequesterUserId()
                    ),
                    () -> notificationClient.notifyTicketAssigned(
                            request.assignToUserId(),
                            savedTicket.getTicketReference(),
                            savedTicket.getId()
                    )
            );
        }

        return SupportDto.TicketResponse.fromEntity(ticket);
    }

    @Override
    public SupportDto.TicketResponse resolveTicket(UUID ticketId, SupportDto.ResolveTicketRequest request,
                                                    UUID agentId, String agentName) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketId));

        ticket.resolve(request.resolutionNotes());

        // Add resolution comment
        ticket.addComment("Ticket resolved: " + request.resolutionNotes(), agentId, agentName, true);

        ticket = ticketRepository.save(ticket);
        log.info("Resolved ticket {} by agent {}", ticket.getTicketReference(), agentId);

        // Publish TicketResolved event with fallback notification
        final Ticket savedTicket = ticket;
        publishEventWithFallback(
                new SupportEvent.TicketResolved(
                        UUID.randomUUID(),
                        getTenantId(),
                        Instant.now(),
                        savedTicket.getId(),
                        savedTicket.getTicketReference(),
                        savedTicket.getRequesterUserId()
                ),
                () -> notificationClient.notifyTicketResolved(
                        savedTicket.getRequesterUserId(),
                        savedTicket.getTicketReference(),
                        savedTicket.getId()
                )
        );

        return SupportDto.TicketResponse.fromEntity(ticket);
    }

    @Override
    @Transactional(readOnly = true)
    public SupportDto.AdminTicketStats getAdminStats() {
        List<TicketStatus> openStatuses = List.of(TicketStatus.NEW, TicketStatus.IN_PROGRESS, TicketStatus.PENDING);
        List<TicketStatus> closedStatuses = List.of(TicketStatus.RESOLVED, TicketStatus.CLOSED);

        long newTickets = ticketRepository.countByStatus(TicketStatus.NEW);
        long inProgress = ticketRepository.countByStatus(TicketStatus.IN_PROGRESS);
        long pending = ticketRepository.countByStatus(TicketStatus.PENDING);
        long totalOpen = ticketRepository.countByStatusIn(openStatuses);
        long totalClosed = ticketRepository.countByStatusIn(closedStatuses);

        Instant todayStart = Instant.now().truncatedTo(ChronoUnit.DAYS);
        long resolvedToday = ticketRepository.countResolvedSince(TicketStatus.RESOLVED, todayStart);

        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        Double avgTime = ticketRepository.calculateAvgResolutionTimeHours(thirtyDaysAgo);

        long overdueTickets = ticketRepository.countOverdueTickets(Instant.now(), openStatuses);

        return new SupportDto.AdminTicketStats(
                newTickets, inProgress, pending, resolvedToday,
                totalOpen, totalClosed,
                avgTime != null ? avgTime : 0.0,
                overdueTickets
        );
    }

    // === Assigned Ticket Operations ===

    @Override
    @Transactional(readOnly = true)
    public Page<SupportDto.TicketSummary> getAssignedTickets(UUID agentUserId, Pageable pageable) {
        return ticketRepository.findByAssignedUserIdOrderByCreatedAtDesc(agentUserId, pageable)
                .map(SupportDto.TicketSummary::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SupportDto.TicketSummary> getTeamTickets(String team, Pageable pageable) {
        return ticketRepository.findByAssignedTeamOrderByCreatedAtDesc(team, pageable)
                .map(SupportDto.TicketSummary::fromEntity);
    }

    // === Canned Response Operations ===

    @Override
    @Transactional(readOnly = true)
    public List<SupportDto.CannedResponseResponse> getCannedResponses(String category) {
        List<CannedResponse> responses;
        if (category != null && !category.isBlank()) {
            responses = cannedResponseRepository.findByCategory(category);
        } else {
            responses = cannedResponseRepository.findAllActive();
        }
        return responses.stream()
                .map(SupportDto.CannedResponseResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<SupportDto.CannedResponseResponse> getCannedResponse(UUID id) {
        return cannedResponseRepository.findActiveById(id)
                .map(SupportDto.CannedResponseResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getCannedResponseCategories() {
        return cannedResponseRepository.findDistinctCategories();
    }

    @Override
    public SupportDto.CannedResponseResponse createCannedResponse(SupportDto.CreateCannedResponseRequest request,
                                                                   UUID createdBy, String createdByName) {
        CannedResponse response = CannedResponse.create(
                request.title(),
                request.category(),
                request.content(),
                createdBy,
                createdByName
        );

        response = cannedResponseRepository.save(response);
        log.info("Created canned response '{}' by user {}", response.getTitle(), createdBy);

        return SupportDto.CannedResponseResponse.fromEntity(response);
    }

    @Override
    public SupportDto.CannedResponseResponse updateCannedResponse(UUID id, SupportDto.UpdateCannedResponseRequest request) {
        CannedResponse response = cannedResponseRepository.findActiveById(id)
                .orElseThrow(() -> new IllegalArgumentException("Canned response not found: " + id));

        response.update(request.title(), request.category(), request.content());
        response = cannedResponseRepository.save(response);
        log.info("Updated canned response '{}'", response.getTitle());

        return SupportDto.CannedResponseResponse.fromEntity(response);
    }

    @Override
    public void deleteCannedResponse(UUID id) {
        CannedResponse response = cannedResponseRepository.findActiveById(id)
                .orElseThrow(() -> new IllegalArgumentException("Canned response not found: " + id));

        response.softDelete();
        cannedResponseRepository.save(response);
        log.info("Deleted canned response '{}'", response.getTitle());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupportDto.CannedResponseResponse> searchCannedResponses(String searchTerm) {
        if (searchTerm == null || searchTerm.isBlank()) {
            return getCannedResponses(null);
        }
        return cannedResponseRepository.search(searchTerm).stream()
                .map(SupportDto.CannedResponseResponse::fromEntity)
                .toList();
    }

    // === Ticket Merge Operations ===

    @Override
    public SupportDto.MergeTicketResponse mergeTickets(UUID targetTicketId, UUID sourceTicketId,
                                                        UUID agentId, String agentName) {
        if (targetTicketId.equals(sourceTicketId)) {
            throw new IllegalArgumentException("Cannot merge a ticket with itself");
        }

        Ticket targetTicket = ticketRepository.findById(targetTicketId)
                .orElseThrow(() -> new IllegalArgumentException("Target ticket not found: " + targetTicketId));

        Ticket sourceTicket = ticketRepository.findById(sourceTicketId)
                .orElseThrow(() -> new IllegalArgumentException("Source ticket not found: " + sourceTicketId));

        // Copy comments from source to target
        for (TicketComment comment : sourceTicket.getComments()) {
            TicketComment copiedComment = targetTicket.addComment(
                    "[Merged from " + sourceTicket.getTicketReference() + "] " + comment.getContent(),
                    comment.getAuthorUserId(),
                    comment.getAuthorName(),
                    comment.getAuthorRole() != null && comment.getAuthorRole().contains("Agent")
            );
            copiedComment.setInternal(comment.isInternal());
        }

        // Add merge notification comment to target
        targetTicket.addComment(
                "Ticket " + sourceTicket.getTicketReference() + " was merged into this ticket. " +
                "Original subject: " + sourceTicket.getSubject(),
                agentId,
                agentName,
                true
        );

        // Close the source ticket
        sourceTicket.close();
        sourceTicket.setResolutionNotes("Merged into ticket " + targetTicket.getTicketReference());

        // Add merge tracking
        sourceTicket.setMergedIntoTicketId(targetTicketId);

        // Save both tickets
        ticketRepository.save(targetTicket);
        ticketRepository.save(sourceTicket);

        log.info("Merged ticket {} into {} by agent {}",
                sourceTicket.getTicketReference(), targetTicket.getTicketReference(), agentId);

        return new SupportDto.MergeTicketResponse(
                targetTicketId,
                sourceTicketId,
                targetTicket.getTicketReference(),
                sourceTicket.getTicketReference(),
                "Successfully merged " + sourceTicket.getTicketReference() + " into " + targetTicket.getTicketReference()
        );
    }
}
