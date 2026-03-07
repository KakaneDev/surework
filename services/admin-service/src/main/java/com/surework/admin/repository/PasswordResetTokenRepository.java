package com.surework.admin.repository;

import com.surework.admin.domain.PasswordResetToken;
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
 * Repository for password reset token operations.
 */
@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    /**
     * Find a valid (unused and not expired) token by its hash.
     */
    @Query("""
            SELECT t FROM PasswordResetToken t
            WHERE t.tokenHash = :tokenHash
            AND t.used = false
            AND t.expiresAt > :now
            """)
    Optional<PasswordResetToken> findValidToken(
            @Param("tokenHash") String tokenHash,
            @Param("now") LocalDateTime now);

    /**
     * Find by token hash regardless of validity.
     */
    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    /**
     * Invalidate all unused tokens for a user.
     * Called when a new reset is requested or password is changed.
     */
    @Modifying
    @Query("""
            UPDATE PasswordResetToken t
            SET t.used = true, t.usedAt = :now
            WHERE t.userId = :userId AND t.used = false
            """)
    int invalidateAllForUser(@Param("userId") UUID userId, @Param("now") LocalDateTime now);

    /**
     * Delete expired tokens (for cleanup job).
     */
    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.expiresAt < :cutoff")
    int deleteExpiredTokens(@Param("cutoff") LocalDateTime cutoff);

    /**
     * Check if user has a recent valid token (to prevent abuse).
     */
    @Query("""
            SELECT COUNT(t) > 0 FROM PasswordResetToken t
            WHERE t.userId = :userId
            AND t.used = false
            AND t.expiresAt > :now
            AND t.createdAt > :since
            """)
    boolean hasRecentToken(
            @Param("userId") UUID userId,
            @Param("now") LocalDateTime now,
            @Param("since") LocalDateTime since);

    /**
     * Find all valid (unused, not expired) tokens.
     * Used for token validation - more efficient than findAll().
     */
    @Query("""
            SELECT t FROM PasswordResetToken t
            WHERE t.used = false
            AND t.expiresAt > :now
            """)
    List<PasswordResetToken> findAllValidTokens(@Param("now") LocalDateTime now);
}
