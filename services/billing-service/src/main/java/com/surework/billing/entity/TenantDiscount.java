package com.surework.billing.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tenant_discounts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TenantDiscount {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "discount_id", nullable = false)
    private Discount discount;

    @Column(name = "applied_at", nullable = false)
    private Instant appliedAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private Status status = Status.ACTIVE;

    public enum Status {
        ACTIVE, EXPIRED, CANCELLED
    }

    @PrePersist
    public void prePersist() {
        if (appliedAt == null) {
            appliedAt = Instant.now();
        }
    }
}
