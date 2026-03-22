package com.surework.recruitment.domain;

import com.surework.common.dto.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * Represents a client company that a consulting/staffing tenant posts jobs on behalf of.
 */
@Entity
@Table(name = "clients", indexes = {
        @Index(name = "idx_clients_tenant_id", columnList = "tenant_id"),
        @Index(name = "idx_clients_tenant_name", columnList = "tenant_id, name")
})
@Getter
@Setter
@NoArgsConstructor
public class Client extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "industry", length = 100)
    private String industry;

    @Column(name = "contact_person", length = 150)
    private String contactPerson;

    @Column(name = "contact_email", length = 255)
    private String contactEmail;

    @Column(name = "contact_phone", length = 30)
    private String contactPhone;

    @Column(name = "website", length = 500)
    private String website;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "active", nullable = false)
    private boolean active = true;
}
