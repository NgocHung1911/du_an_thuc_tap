package com.task.management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskCommentDTO {
    private Long id;
    private String content;
    private Long taskId;
    private UserDTO user;
    private Long parentId;
    @Builder.Default
    private List<TaskCommentDTO> replies = new ArrayList<>();
    @Builder.Default
    private List<TaskCommentAttachmentDTO> attachments = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
