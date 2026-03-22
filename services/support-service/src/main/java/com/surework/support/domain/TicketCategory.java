package com.surework.support.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Represents a support ticket category for routing.
 */
@Entity
@Table(name = "ticket_categories")
@Getter
@Setter
@NoArgsConstructor
public class TicketCategory extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true)
    private String code;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "assigned_team", nullable = false)
    private String assignedTeam;

    @Column(name = "display_order")
    private int displayOrder = 0;

    @Column(name = "is_active")
    private boolean active = true;

    /**
     * Subcategories as comma-separated values.
     */
    @Column(name = "subcategories", columnDefinition = "TEXT")
    private String subcategories;

    public static TicketCategory create(String code, String name, String assignedTeam) {
        TicketCategory category = new TicketCategory();
        category.setCode(code);
        category.setName(name);
        category.setAssignedTeam(assignedTeam);
        return category;
    }
}
