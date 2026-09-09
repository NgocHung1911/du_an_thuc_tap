package com.task.management.service;

import com.task.management.dto.websocket.WebSocketEvent;
import com.task.management.dto.websocket.WebSocketEventType;
import com.task.management.event.ProjectDomainEvent;
import com.task.management.event.TaskDomainEvent;
import com.task.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Service
@RequiredArgsConstructor
public class RealtimeEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleTaskDomainEvent(TaskDomainEvent event) {
        try {
            WebSocketEvent<Object> wsEvent = WebSocketEvent.builder()
                    .eventType(event.getEventType())
                    .timestamp(System.currentTimeMillis())
                    .projectId(event.getProjectId())
                    .taskId(event.getTaskId())
                    .actorUsername(event.getActorUsername())
                    .actorFullName(event.getActorFullName())
                    .data(event.getTaskDTO())
                    .build();

            if (event.getProjectId() != null) {
                String destination = "/topic/projects/" + event.getProjectId();
                messagingTemplate.convertAndSend(destination, wsEvent);
                log.info("Broadcasted {} to {}", event.getEventType(), destination);
            }

            if (event.getTargetUserId() != null) {
                userRepository.findById(event.getTargetUserId()).ifPresent(targetUser -> {
                    WebSocketEvent<Object> notifEvent = WebSocketEvent.builder()
                            .eventType(WebSocketEventType.NOTIFICATION_CREATED)
                            .timestamp(System.currentTimeMillis())
                            .projectId(event.getProjectId())
                            .taskId(event.getTaskId())
                            .actorUsername(event.getActorUsername())
                            .actorFullName(event.getActorFullName())
                            .data(event.getTaskDTO())
                            .build();

                    messagingTemplate.convertAndSendToUser(
                            targetUser.getUsername(),
                            "/queue/notifications",
                            notifEvent
                    );
                    log.info("Sent NOTIFICATION_CREATED to user {}", targetUser.getUsername());
                });
            }
        } catch (Exception e) {
            log.error("Failed to broadcast TaskDomainEvent: {}", e.getMessage(), e);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleProjectDomainEvent(ProjectDomainEvent event) {
        try {
            WebSocketEvent<Object> wsEvent = WebSocketEvent.builder()
                    .eventType(event.getEventType())
                    .timestamp(System.currentTimeMillis())
                    .projectId(event.getProjectId())
                    .actorUsername(event.getActorUsername())
                    .actorFullName(event.getActorFullName())
                    .data(event.getMemberDTO())
                    .build();

            if (event.getProjectId() != null) {
                String destination = "/topic/projects/" + event.getProjectId();
                messagingTemplate.convertAndSend(destination, wsEvent);
                log.info("Broadcasted {} to {}", event.getEventType(), destination);
            }

            if (event.getTargetUserId() != null) {
                userRepository.findById(event.getTargetUserId()).ifPresent(targetUser -> {
                    WebSocketEvent<Object> notifEvent = WebSocketEvent.builder()
                            .eventType(WebSocketEventType.NOTIFICATION_CREATED)
                            .timestamp(System.currentTimeMillis())
                            .projectId(event.getProjectId())
                            .actorUsername(event.getActorUsername())
                            .actorFullName(event.getActorFullName())
                            .data(event.getMemberDTO())
                            .build();

                    messagingTemplate.convertAndSendToUser(
                            targetUser.getUsername(),
                            "/queue/notifications",
                            notifEvent
                    );
                    log.info("Sent NOTIFICATION_CREATED to user {}", targetUser.getUsername());
                });
            }
        } catch (Exception e) {
            log.error("Failed to broadcast ProjectDomainEvent: {}", e.getMessage(), e);
        }
    }
}
