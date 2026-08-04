package com.task.management.dto.response;

import com.task.management.enums.TaskPriority;
import com.task.management.enums.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskDTO {

    private Long id;
    private String title;
    private String description;
    private LocalDate deadline;
    private TaskPriority priority;
    private TaskStatus status;

    // Trả về thông tin ngắn gọn của Project và User để tránh tuần hoàn dữ liệu (circular reference)
    private ProjectDTO project;
    private UserDTO assignedUser;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}