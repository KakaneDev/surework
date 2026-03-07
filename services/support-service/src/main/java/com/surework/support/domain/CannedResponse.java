package com.surework.support.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * Represents a canned/template response for support tickets.
 * Allows agents to quickly insert pre-written responses.
 */
@Entity
@Table(name = "canned_responses", indexes = {
        @Index(name = "idx_canned_responses_category", columnList = "category"),
        @Index(name = "idx_canned_responses_created_by", columnList = "created_by"),
        @Index(name = "idx_canned_responses_deleted", columnList = "deleted")
})
@Getter
@Setter
@NoArgsConstructor
public class CannedResponse extends BaseEntity {

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "category")
    private String category;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_by_name")
    private String createdByName;

    /**
     * Factory method to create a new canned response.
     */
    public static CannedResponse create(String title, String category, String content,
                                         UUID createdBy, String createdByName) {
        CannedResponse response = new CannedResponse();
        response.setTitle(title);
        response.setCategory(category);
        response.setContent(content);
        response.setCreatedBy(createdBy);
        response.setCreatedByName(createdByName);
        return response;
    }

    /**
     * Update the canned response fields.
     */
    public void update(String title, String category, String content) {
        if (title != null) {
            this.title = title;
        }
        if (category != null) {
            this.category = category;
        }
        if (content != null) {
            this.content = content;
        }
    }
}
