package com.task.management.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskCommentRequest {

    @NotBlank(message = "Comment content cannot be empty")
    private String content;

    private Long parentId;

    private List<Long> mentionedUserIds;
}
