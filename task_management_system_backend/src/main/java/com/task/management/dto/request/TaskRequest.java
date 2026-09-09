package com.task.management.dto.request;

import com.task.management.enums.TaskPriority;
import com.task.management.enums.TaskStatus;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskRequest {

    @NotBlank(message = "Task title cannot be blank")
    @Size(max = 150, message = "Task title cannot exceed 150 characters")
    private String title;

    private String description;

    @NotNull(message = "Deadline cannot be blank")
    @FutureOrPresent(message = "Deadline must be today or in the future")
    private LocalDate deadline;

    @NotNull(message = "Priority cannot be blank")
    private TaskPriority priority;

    @NotNull(message = "Status cannot be blank")
    private TaskStatus status;

    @NotNull(message = "Project ID cannot be blank")
    private Long projectId;

    private Long userId; // Assignee user ID (Can be null)

    private Long reporterId; // Reporter user ID (Can be null)
}