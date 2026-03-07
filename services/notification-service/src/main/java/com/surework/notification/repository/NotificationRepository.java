package com.surework.notification.repository;

import com.surework.notification.domain.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Notification entity.
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    /**
     * Find all notifications for a user ordered by creation date.
     */
    @Query("""
            SELECT n FROM Notification n
            WHERE n.userId = :userId
            AND n.deleted = false
            ORDER BY n.createdAt DESC
            """)
    Page<Notification> findByUserId(@Param("userId") UUID userId, Pageable pageable);

    /**
     * Find unread notifications for a user.
     */
    @Query("""
            SELECT n FROM Notification n
            WHERE n.userId = :userId
            AND n.read = false
            AND n.deleted = false
            ORDER BY n.createdAt DESC
            """)
    List<Notification> findUnreadByUserId(@Param("userId") UUID userId);

    /**
     * Find a notification by ID and user ID (for authorization).
     */
    @Query("""
            SELECT n FROM Notification n
            WHERE n.id = :id
            AND n.userId = :userId
            AND n.deleted = false
            """)
    Optional<Notification> findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    /**
     * Count unread notifications for a user.
     */
    @Query("""
            SELECT COUNT(n) FROM Notification n
            WHERE n.userId = :userId
            AND n.read = false
            AND n.deleted = false
            """)
    long countUnreadByUserId(@Param("userId") UUID userId);

    /**
     * Mark all notifications as read for a user.
     */
    @Modifying
    @Query("""
            UPDATE Notification n
            SET n.read = true, n.readAt = CURRENT_TIMESTAMP
            WHERE n.userId = :userId
            AND n.read = false
            AND n.deleted = false
            """)
    int markAllAsReadByUserId(@Param("userId") UUID userId);

    /**
     * Find recent notifications for a user (limited count).
     */
    @Query("""
            SELECT n FROM Notification n
            WHERE n.userId = :userId
            AND n.deleted = false
            ORDER BY n.createdAt DESC
            LIMIT :limit
            """)
    List<Notification> findRecentByUserId(@Param("userId") UUID userId, @Param("limit") int limit);
}
