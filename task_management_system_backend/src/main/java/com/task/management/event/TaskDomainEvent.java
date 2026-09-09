package com.task.management.event;

import com.task.management.dto.response.TaskDTO;
import com.task.management.dto.websocket.WebSocketEventType;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class TaskDomainEvent extends ApplicationEvent {
    private final WebSocketEventType eventType;
    private final Long projectId;
    private final Long taskId;
    private final String actorUsername;
    private final String actorFullName;
    private final TaskDTO taskDTO;
    private final Long targetUserId;

    public TaskDomainEvent(Object source,
                           WebSocketEventType eventType,
                           Long projectId,
                           Long taskId,
                           String actorUsername,
                           String actorFullName,
                           TaskDTO taskDTO,
                           Long targetUserId) {
        super(source);
        this.eventType = eventType;
        this.projectId = projectId;
        this.taskId = taskId;
        this.actorUsername = actorUsername;
        this.actorFullName = actorFullName;
        this.taskDTO = taskDTO;
        this.targetUserId = targetUserId;
    }
}
