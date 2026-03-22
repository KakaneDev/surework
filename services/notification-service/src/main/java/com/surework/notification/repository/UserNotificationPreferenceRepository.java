package com.surework.notification.repository;

import com.surework.notification.domain.Notification;
import com.surework.notification.domain.UserNotificationPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for UserNotificationPreference entity.
 */
@Repository
public interface UserNotificationPreferenceRepository extends JpaRepository<UserNotificationPreference, UUID> {

    /**
     * Find all preferences for a user.
     */
    List<UserNotificationPreference> findByUserId(UUID userId);

    /**
     * Find preference for a specific user and notification type.
     */
    Optional<UserNotificationPreference> findByUserIdAndNotificationType(
            UUID userId,
            Notification.NotificationType notificationType
    );

    /**
     * Check if a user has any preferences configured.
     */
    boolean existsByUserId(UUID userId);

    /**
     * Delete all preferences for a user.
     */
    void deleteByUserId(UUID userId);
}
