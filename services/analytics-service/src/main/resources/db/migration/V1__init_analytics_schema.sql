-- Analytics Service Schema

-- Feature Usage Events
CREATE TABLE feature_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    feature_code VARCHAR(100) NOT NULL,
    user_id UUID,
    event_type VARCHAR(50),
    event_data JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feature_usage_tenant ON feature_usage(tenant_id);
CREATE INDEX idx_feature_usage_feature ON feature_usage(feature_code);
CREATE INDEX idx_feature_usage_recorded ON feature_usage(recorded_at);
CREATE INDEX idx_feature_usage_tenant_recorded ON feature_usage(tenant_id, recorded_at);

-- Tenant Health Scores
CREATE TABLE tenant_health_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    score DECIMAL(5,2),
    factors JSONB,
    churn_risk VARCHAR(20),
    calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_health_scores_tenant ON tenant_health_scores(tenant_id);
CREATE INDEX idx_health_scores_risk ON tenant_health_scores(churn_risk);
CREATE INDEX idx_health_scores_calculated ON tenant_health_scores(calculated_at);

-- Revenue Snapshots (daily aggregation)
CREATE TABLE revenue_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL UNIQUE,
    total_mrr DECIMAL(12,2),
    total_arr DECIMAL(12,2),
    active_tenants INT,
    trial_tenants INT,
    churned_tenants INT,
    new_tenants INT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_revenue_snapshots_date ON revenue_snapshots(snapshot_date);

-- Onboarding Events
CREATE TABLE onboarding_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    stage VARCHAR(50) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_onboarding_tenant ON onboarding_events(tenant_id);
CREATE INDEX idx_onboarding_stage ON onboarding_events(stage);

-- Churn Events
CREATE TABLE churn_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    tenant_name VARCHAR(255),
    churned_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reason VARCHAR(500),
    mrr_lost DECIMAL(12,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_churn_events_tenant ON churn_events(tenant_id);
CREATE INDEX idx_churn_events_churned ON churn_events(churned_at);
