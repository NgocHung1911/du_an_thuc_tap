package com.task.management.event;

import com.task.management.dto.response.UserDTO;
import com.task.management.dto.websocket.WebSocketEventType;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class ProjectDomainEvent extends ApplicationEvent {
    private final WebSocketEventType eventType;
    private final Long projectId;
    private final String actorUsername;
    private final String actorFullName;
    private final UserDTO memberDTO;
    private final Long targetUserId;

    public ProjectDomainEvent(Object source,
                             WebSocketEventType eventType,
                             Long projectId,
                             String actorUsername,
                             String actorFullName,
                             UserDTO memberDTO,
                             Long targetUserId) {
        super(source);
        this.eventType = eventType;
        this.projectId = projectId;
        this.actorUsername = actorUsername;
        this.actorFullName = actorFullName;
        this.memberDTO = memberDTO;
        this.targetUserId = targetUserId;
    }
}
