package com.task.management.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.task.management.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private Long id;
    private UserDTO actor;
    private NotificationType type;
    private String title;
    private String message;
    private Long projectId;
    private Long taskId;

    @JsonProperty("isRead")
    private boolean isRead;

    private LocalDateTime createdAt;
}
