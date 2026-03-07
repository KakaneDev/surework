package com.surework.support.dto;

import com.surework.support.domain.*;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTOs for Support operations.
 */
public sealed interface SupportDto {

    // === Ticket Category DTOs ===

    record CategoryResponse(
            UUID id,
            String code,
            String name,
            String description,
            String assignedTeam,
            List<String> subcategories,
            int displayOrder
    ) implements SupportDto {

        public static CategoryResponse fromEntity(TicketCategory category) {
            List<String> subcats = category.getSubcategories() != null && !category.getSubcategories().isBlank()
                    ? List.of(category.getSubcategories().split(","))
                    : List.of();

            return new CategoryResponse(
                    category.getId(),
                    category.getCode(),
                    category.getName(),
                    category.getDescription(),
                    category.getAssignedTeam(),
                    subcats,
                    category.getDisplayOrder()
            );
        }
    }

    // === Ticket DTOs ===

    record CreateTicketRequest(
            @NotBlank(message = "Category is required")
            String categoryCode,

            String subcategory,

            @NotBlank(message = "Subject is required")
            @Size(min = 5, max = 200, message = "Subject must be between 5 and 200 characters")
            String subject,

            @NotBlank(message = "Description is required")
            @Size(min = 20, max = 5000, message = "Description must be between 20 and 5000 characters")
            String description,

            @NotNull(message = "Priority is required")
            TicketPriority priority
    ) implements SupportDto {}

    record UpdateTicketRequest(
            String subject,
            String description,
            TicketPriority priority,
            TicketStatus status,
            String assignedTeam
    ) implements SupportDto {}

    record AssignTicketRequest(
            UUID assignToUserId,
            String assignToUserName,
            String assignedTeam
    ) implements SupportDto {}

    record ResolveTicketRequest(
            @NotBlank(message = "Resolution notes are required")
            String resolutionNotes
    ) implements SupportDto {}

    record TicketResponse(
            UUID id,
            String ticketReference,
            CategoryResponse category,
            String subcategory,
            String subject,
            String description,
            TicketStatus status,
            TicketPriority priority,
            UUID requesterUserId,
            String requesterName,
            String requesterEmail,
            String assignedTeam,
            UUID assignedUserId,
            String assignedUserName,
            Instant createdAt,
            Instant updatedAt,
            Instant resolvedAt,
            Instant closedAt,
            String resolutionNotes,
            Instant slaDeadline,
            List<CommentResponse> comments
    ) implements SupportDto {

        public static TicketResponse fromEntity(Ticket ticket) {
            return new TicketResponse(
                    ticket.getId(),
                    ticket.getTicketReference(),
                    CategoryResponse.fromEntity(ticket.getCategory()),
                    ticket.getSubcategory(),
                    ticket.getSubject(),
                    ticket.getDescription(),
                    ticket.getStatus(),
                    ticket.getPriority(),
                    ticket.getRequesterUserId(),
                    ticket.getRequesterName(),
                    ticket.getRequesterEmail(),
                    ticket.getAssignedTeam(),
                    ticket.getAssignedUserId(),
                    ticket.getAssignedUserName(),
                    ticket.getCreatedAt(),
                    ticket.getUpdatedAt(),
                    ticket.getResolvedAt(),
                    ticket.getClosedAt(),
                    ticket.getResolutionNotes(),
                    ticket.getSlaDeadline(),
                    ticket.getComments().stream()
                            .map(CommentResponse::fromEntity)
                            .toList()
            );
        }

        public static TicketResponse fromEntityWithoutComments(Ticket ticket) {
            return new TicketResponse(
                    ticket.getId(),
                    ticket.getTicketReference(),
                    CategoryResponse.fromEntity(ticket.getCategory()),
                    ticket.getSubcategory(),
                    ticket.getSubject(),
                    ticket.getDescription(),
                    ticket.getStatus(),
                    ticket.getPriority(),
                    ticket.getRequesterUserId(),
                    ticket.getRequesterName(),
                    ticket.getRequesterEmail(),
                    ticket.getAssignedTeam(),
                    ticket.getAssignedUserId(),
                    ticket.getAssignedUserName(),
                    ticket.getCreatedAt(),
                    ticket.getUpdatedAt(),
                    ticket.getResolvedAt(),
                    ticket.getClosedAt(),
                    ticket.getResolutionNotes(),
                    ticket.getSlaDeadline(),
                    List.of()
            );
        }
    }

    record TicketSummary(
            UUID id,
            String ticketReference,
            String categoryName,
            String subject,
            TicketStatus status,
            TicketPriority priority,
            String requesterName,
            String assignedTeam,
            String assignedUserName,
            Instant createdAt,
            Instant updatedAt
    ) implements SupportDto {

        public static TicketSummary fromEntity(Ticket ticket) {
            return new TicketSummary(
                    ticket.getId(),
                    ticket.getTicketReference(),
                    ticket.getCategory().getName(),
                    ticket.getSubject(),
                    ticket.getStatus(),
                    ticket.getPriority(),
                    ticket.getRequesterName(),
                    ticket.getAssignedTeam(),
                    ticket.getAssignedUserName(),
                    ticket.getCreatedAt(),
                    ticket.getUpdatedAt()
            );
        }
    }

    // === Comment DTOs ===

    record AddCommentRequest(
            @NotBlank(message = "Comment content is required")
            @Size(min = 1, max = 5000, message = "Comment must be between 1 and 5000 characters")
            String content,

            boolean internal
    ) implements SupportDto {}

    record CommentResponse(
            UUID id,
            UUID ticketId,
            String content,
            UUID authorUserId,
            String authorName,
            String authorRole,
            boolean internal,
            Instant createdAt
    ) implements SupportDto {

        public static CommentResponse fromEntity(TicketComment comment) {
            return new CommentResponse(
                    comment.getId(),
                    comment.getTicket().getId(),
                    comment.getContent(),
                    comment.getAuthorUserId(),
                    comment.getAuthorName(),
                    comment.getAuthorRole(),
                    comment.isInternal(),
                    comment.getCreatedAt()
            );
        }
    }

    // === Stats DTOs ===

    record TicketStats(
            long open,
            long pending,
            long resolved,
            long total,
            double avgResolutionTimeHours
    ) implements SupportDto {}

    record AdminTicketStats(
            long newTickets,
            long inProgress,
            long pending,
            long resolvedToday,
            long totalOpen,
            long totalClosed,
            double avgResolutionTimeHours,
            long overdueTickets
    ) implements SupportDto {}

    // === Canned Response DTOs ===

    record CreateCannedResponseRequest(
            @NotBlank(message = "Title is required")
            @Size(min = 1, max = 200, message = "Title must be between 1 and 200 characters")
            String title,

            String category,

            @NotBlank(message = "Content is required")
            @Size(min = 1, max = 10000, message = "Content must be between 1 and 10000 characters")
            String content
    ) implements SupportDto {}

    record UpdateCannedResponseRequest(
            @Size(min = 1, max = 200, message = "Title must be between 1 and 200 characters")
            String title,

            String category,

            @Size(min = 1, max = 10000, message = "Content must be between 1 and 10000 characters")
            String content
    ) implements SupportDto {}

    record CannedResponseResponse(
            UUID id,
            String title,
            String category,
            String content,
            UUID createdBy,
            String createdByName,
            Instant createdAt,
            Instant updatedAt
    ) implements SupportDto {

        public static CannedResponseResponse fromEntity(com.surework.support.domain.CannedResponse response) {
            return new CannedResponseResponse(
                    response.getId(),
                    response.getTitle(),
                    response.getCategory(),
                    response.getContent(),
                    response.getCreatedBy(),
                    response.getCreatedByName(),
                    response.getCreatedAt(),
                    response.getUpdatedAt()
            );
        }
    }

    // === Ticket Merge DTOs ===

    record MergeTicketRequest(
            @NotNull(message = "Source ticket ID is required")
            UUID sourceTicketId
    ) implements SupportDto {}

    record MergeTicketResponse(
            UUID targetTicketId,
            UUID sourceTicketId,
            String targetTicketReference,
            String sourceTicketReference,
            String message
    ) implements SupportDto {}
}
