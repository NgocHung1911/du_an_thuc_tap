package com.task.management.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketEvent<T> {
    private WebSocketEventType eventType;
    private Long timestamp;
    private Long projectId;
    private Long taskId;
    private String actorUsername;
    private String actorFullName;
    private T data;
}
