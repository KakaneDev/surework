package com.surework.common.web;

import java.util.List;

/**
 * Generic paginated response wrapper.
 * Implements Constitution Principle IV: API Design.
 *
 * @param content The list of items for the current page
 * @param page Current page number (0-indexed)
 * @param size Page size (max 100)
 * @param totalElements Total number of elements across all pages
 * @param totalPages Total number of pages
 * @param first Whether this is the first page
 * @param last Whether this is the last page
 * @param <T> Type of content items
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {
    /**
     * Maximum allowed page size per Constitution standard.
     */
    public static final int MAX_PAGE_SIZE = 100;

    /**
     * Default page size.
     */
    public static final int DEFAULT_PAGE_SIZE = 20;

    /**
     * Create a PageResponse from Spring Data Page.
     */
    public static <T> PageResponse<T> from(org.springframework.data.domain.Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast()
        );
    }

    /**
     * Create a PageResponse from a list with pagination info.
     */
    public static <T> PageResponse<T> of(
            List<T> content,
            int page,
            int size,
            long totalElements
    ) {
        int totalPages = size > 0 ? (int) Math.ceil((double) totalElements / size) : 0;
        return new PageResponse<>(
                content,
                page,
                size,
                totalElements,
                totalPages,
                page == 0,
                page >= totalPages - 1
        );
    }

    /**
     * Create an empty PageResponse.
     */
    public static <T> PageResponse<T> empty() {
        return new PageResponse<>(
                List.of(),
                0,
                DEFAULT_PAGE_SIZE,
                0L,
                0,
                true,
                true
        );
    }

    /**
     * Check if the response has content.
     */
    public boolean hasContent() {
        return content != null && !content.isEmpty();
    }

    /**
     * Check if there is a next page.
     */
    public boolean hasNext() {
        return !last;
    }

    /**
     * Check if there is a previous page.
     */
    public boolean hasPrevious() {
        return !first;
    }
}
