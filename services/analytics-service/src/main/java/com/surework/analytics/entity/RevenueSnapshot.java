package com.surework.analytics.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "revenue_snapshots")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RevenueSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "snapshot_date", nullable = false, unique = true)
    private LocalDate snapshotDate;

    @Column(name = "total_mrr", precision = 12, scale = 2)
    private BigDecimal totalMrr;

    @Column(name = "total_arr", precision = 12, scale = 2)
    private BigDecimal totalArr;

    @Column(name = "active_tenants")
    private Integer activeTenants;

    @Column(name = "trial_tenants")
    private Integer trialTenants;

    @Column(name = "churned_tenants")
    private Integer churnedTenants;

    @Column(name = "new_tenants")
    private Integer newTenants;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
