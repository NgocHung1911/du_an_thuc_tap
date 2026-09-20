package com.task.management.service;

import com.task.management.dto.response.NotificationDTO;
import com.task.management.dto.response.UserDTO;
import com.task.management.dto.websocket.WebSocketEvent;
import com.task.management.dto.websocket.WebSocketEventType;
import com.task.management.entity.Notification;
import com.task.management.entity.User;
import com.task.management.enums.NotificationType;
import com.task.management.exception.ResourceNotFoundException;
import com.task.management.repository.NotificationRepository;
import com.task.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private String resolveFullName(User user) {
        if (user == null) return null;
        if (user.getFullName() != null && !user.getFullName().isBlank()) {
            return user.getFullName();
        }
        return user.getUsername();
    }

    private UserDTO mapUserToDTO(User user) {
        if (user == null) return null;
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(resolveFullName(user))
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .build();
    }

    private NotificationDTO mapToDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .actor(mapUserToDTO(notification.getActor()))
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .projectId(notification.getProjectId())
                .taskId(notification.getTaskId())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }

    @Transactional
    public NotificationDTO createAndSendNotification(User recipient, User actor, NotificationType type, String title, String message, Long projectId, Long taskId) {
        if (recipient == null) return null;
        // Don't send notification to yourself
        if (actor != null && actor.getId().equals(recipient.getId())) {
            return null;
        }

        Notification notification = Notification.builder()
                .recipient(recipient)
                .actor(actor)
                .type(type)
                .title(title)
                .message(message)
                .projectId(projectId)
                .taskId(taskId)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        NotificationDTO dto = mapToDTO(saved);

        try {
            WebSocketEvent<NotificationDTO> wsEvent = WebSocketEvent.<NotificationDTO>builder()
                    .eventType(WebSocketEventType.NOTIFICATION_CREATED)
                    .timestamp(System.currentTimeMillis())
                    .projectId(projectId)
                    .taskId(taskId)
                    .actorUsername(actor != null ? actor.getUsername() : "System")
                    .actorFullName(actor != null ? resolveFullName(actor) : "System")
                    .data(dto)
                    .build();

            messagingTemplate.convertAndSendToUser(
                    recipient.getUsername(),
                    "/queue/notifications",
                    wsEvent
            );
            log.info("Sent real-time notification to user {}: {}", recipient.getUsername(), title);
        } catch (Exception e) {
            log.error("Failed to send WebSocket notification to {}", recipient.getUsername(), e);
        }

        return dto;
    }

    private boolean isValidNotification(Notification n) {
        if (n == null) return false;
        if (n.getType() == NotificationType.TASK_UPDATED ||
            n.getType() == NotificationType.TASK_STATUS_CHANGED ||
            n.getType() == NotificationType.TASK_PRIORITY_CHANGED) {
            return false;
        }
        return n.getMessage() != null && !n.getMessage().isBlank();
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getNotificationsForUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseGet(() -> userRepository.findByEmail(username)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username)));

        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .filter(this::isValidNotification)
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String username) {
        User user = userRepository.findByUsername(username)
                .orElseGet(() -> userRepository.findByEmail(username).orElse(null));
        if (user == null) return 0;
        return notificationRepository.findByRecipientIdAndIsReadFalse(user.getId())
                .stream()
                .filter(this::isValidNotification)
                .count();
    }

    @Transactional
    public void markAsRead(Long notificationId, String username) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));

        if (!notification.getRecipient().getUsername().equalsIgnoreCase(username) &&
            !notification.getRecipient().getEmail().equalsIgnoreCase(username)) {
            throw new RuntimeException("Unauthorized action.");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(String username) {
        User user = userRepository.findByUsername(username)
                .orElseGet(() -> userRepository.findByEmail(username).orElse(null));
        if (user == null) return;

        List<Notification> unread = notificationRepository.findByRecipientIdAndIsReadFalse(user.getId());
        for (Notification n : unread) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unread);
    }
}
