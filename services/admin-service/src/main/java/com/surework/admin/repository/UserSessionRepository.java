package com.surework.admin.repository;

import com.surework.admin.domain.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for user session management.
 */
@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, UUID> {

    /**
     * Find all active (non-revoked, non-expired) sessions for a user.
     */
    @Query("""
            SELECT s FROM UserSession s
            WHERE s.userId = :userId
            AND s.revoked = false
            AND s.expiresAt > :now
            ORDER BY s.lastActivityAt DESC NULLS LAST
            """)
    List<UserSession> findActiveSessionsByUserId(
            @Param("userId") UUID userId,
            @Param("now") LocalDateTime now);

    /**
     * Find session by token hash.
     */
    Optional<UserSession> findByTokenHash(String tokenHash);

    /**
     * Find session by refresh token hash.
     */
    Optional<UserSession> findByRefreshTokenHash(String refreshTokenHash);

    /**
     * Revoke all sessions for a user except the current one.
     */
    @Modifying
    @Query("""
            UPDATE UserSession s
            SET s.revoked = true, s.revokedAt = :now, s.revokedReason = :reason
            WHERE s.userId = :userId
            AND s.id != :currentSessionId
            AND s.revoked = false
            """)
    int revokeAllOtherSessions(
            @Param("userId") UUID userId,
            @Param("currentSessionId") UUID currentSessionId,
            @Param("now") LocalDateTime now,
            @Param("reason") String reason);

    /**
     * Revoke all sessions for a user.
     */
    @Modifying
    @Query("""
            UPDATE UserSession s
            SET s.revoked = true, s.revokedAt = :now, s.revokedReason = :reason
            WHERE s.userId = :userId
            AND s.revoked = false
            """)
    int revokeAllSessions(
            @Param("userId") UUID userId,
            @Param("now") LocalDateTime now,
            @Param("reason") String reason);

    /**
     * Revoke a specific session.
     */
    @Modifying
    @Query("""
            UPDATE UserSession s
            SET s.revoked = true, s.revokedAt = :now, s.revokedReason = :reason
            WHERE s.id = :sessionId
            AND s.userId = :userId
            AND s.revoked = false
            """)
    int revokeSession(
            @Param("sessionId") UUID sessionId,
            @Param("userId") UUID userId,
            @Param("now") LocalDateTime now,
            @Param("reason") String reason);

    /**
     * Update last activity time for a session.
     */
    @Modifying
    @Query("UPDATE UserSession s SET s.lastActivityAt = :now WHERE s.id = :sessionId")
    int updateLastActivity(@Param("sessionId") UUID sessionId, @Param("now") LocalDateTime now);

    /**
     * Delete expired and revoked sessions (for cleanup job).
     */
    @Modifying
    @Query("""
            DELETE FROM UserSession s
            WHERE s.expiresAt < :cutoff
            OR (s.revoked = true AND s.revokedAt < :revokedCutoff)
            """)
    int deleteExpiredSessions(
            @Param("cutoff") LocalDateTime cutoff,
            @Param("revokedCutoff") LocalDateTime revokedCutoff);

    /**
     * Count active sessions for a user.
     */
    @Query("""
            SELECT COUNT(s) FROM UserSession s
            WHERE s.userId = :userId
            AND s.revoked = false
            AND s.expiresAt > :now
            """)
    long countActiveSessions(@Param("userId") UUID userId, @Param("now") LocalDateTime now);

    /**
     * Find all active (non-revoked, non-expired) sessions for a user.
     * Uses current time for expiration check.
     */
    @Query("""
            SELECT s FROM UserSession s
            WHERE s.userId = :userId
            AND s.revoked = false
            AND s.expiresAt > CURRENT_TIMESTAMP
            ORDER BY s.lastActivityAt DESC NULLS LAST
            """)
    List<UserSession> findActiveByUserId(@Param("userId") UUID userId);
}
