package com.surework.analytics.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "tenant_health_scores")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TenantHealthScore {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "score", precision = 5, scale = 2)
    private BigDecimal score;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "factors", columnDefinition = "jsonb")
    private Map<String, Object> factors;

    @Enumerated(EnumType.STRING)
    @Column(name = "churn_risk", length = 20)
    private ChurnRisk churnRisk;

    @Column(name = "calculated_at", nullable = false)
    private Instant calculatedAt;

    public enum ChurnRisk {
        LOW, MEDIUM, HIGH
    }

    @PrePersist
    public void prePersist() {
        if (calculatedAt == null) {
            calculatedAt = Instant.now();
        }
    }
}
