-- ============================================================================
-- Seed Platform Portal Credentials for Development
-- ============================================================================
-- Upserts 4 portal credential records so the Health Dashboard shows
-- realistic portal status data.
--
-- Uses ON CONFLICT DO UPDATE to overwrite any empty records created by
-- initializePortals() at startup.
-- ============================================================================

INSERT INTO platform_portal_credentials (
    id, portal, username_encrypted, password_encrypted,
    additional_config_encrypted, is_active, daily_rate_limit,
    posts_today, rate_limit_reset_at, last_verified_at,
    last_error, connection_status, metadata,
    last_successful_post_at, total_posts_count, failed_posts_count,
    created_at, updated_at
) VALUES
    -- LinkedIn: active, CONNECTED
    (
        gen_random_uuid(), 'LINKEDIN',
        'ZGV2LWxpbmtlZGluQHN1cmV3b3JrLmNvLnph',
        'ZGV2LXBhc3N3b3JkLWxpbmtlZGlu',
        NULL, TRUE, 25, 12,
        (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMP,
        CURRENT_TIMESTAMP - INTERVAL '2 hours',
        NULL, 'CONNECTED',
        '{"companyPage": "surework-pty-ltd", "profileUrl": "https://www.linkedin.com/company/surework"}',
        CURRENT_TIMESTAMP - INTERVAL '30 minutes',
        58, 2,
        CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP
    ),
    -- Pnet: active, CONNECTED
    (
        gen_random_uuid(), 'PNET',
        'ZGV2LXBuZXRAc3VyZXdvcmsuY28uemE=',
        'ZGV2LXBhc3N3b3JkLXBuZXQ=',
        NULL, TRUE, 50, 18,
        (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMP,
        CURRENT_TIMESTAMP - INTERVAL '1 hour',
        NULL, 'CONNECTED',
        '{"recruiterAccount": true}',
        CURRENT_TIMESTAMP - INTERVAL '15 minutes',
        75, 3,
        CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP
    ),
    -- Indeed: active, CONNECTED
    (
        gen_random_uuid(), 'INDEED',
        'ZGV2LWluZGVlZEBzdXJld29yay5jby56YQ==',
        'ZGV2LXBhc3N3b3JkLWluZGVlZA==',
        NULL, TRUE, 40, 15,
        (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMP,
        CURRENT_TIMESTAMP - INTERVAL '3 hours',
        NULL, 'CONNECTED',
        '{"employerAccount": "surework-za"}',
        CURRENT_TIMESTAMP - INTERVAL '45 minutes',
        68, 4,
        CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP
    ),
    -- Careers24: inactive, NOT_CONFIGURED
    (
        gen_random_uuid(), 'CAREERS24',
        NULL, NULL,
        NULL, FALSE, 50, 0,
        NULL, NULL,
        NULL, 'NOT_CONFIGURED',
        NULL,
        NULL, 0, 0,
        CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP
    )
ON CONFLICT (portal) DO UPDATE SET
    username_encrypted = EXCLUDED.username_encrypted,
    password_encrypted = EXCLUDED.password_encrypted,
    additional_config_encrypted = EXCLUDED.additional_config_encrypted,
    is_active = EXCLUDED.is_active,
    daily_rate_limit = EXCLUDED.daily_rate_limit,
    posts_today = EXCLUDED.posts_today,
    rate_limit_reset_at = EXCLUDED.rate_limit_reset_at,
    last_verified_at = EXCLUDED.last_verified_at,
    last_error = EXCLUDED.last_error,
    connection_status = EXCLUDED.connection_status,
    metadata = EXCLUDED.metadata,
    last_successful_post_at = EXCLUDED.last_successful_post_at,
    total_posts_count = EXCLUDED.total_posts_count,
    failed_posts_count = EXCLUDED.failed_posts_count,
    updated_at = EXCLUDED.updated_at;
