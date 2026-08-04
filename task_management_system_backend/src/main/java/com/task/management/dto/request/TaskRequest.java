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

    @NotBlank(message = "Tiêu đề Task không được để trống")
    @Size(max = 150, message = "Tiêu đề không vượt quá 150 ký tự")
    private String title;

    private String description;

    @NotNull(message = "Deadline không được để trống")
    @FutureOrPresent(message = "Deadline phải là ngày hôm nay hoặc trong tương lai")
    private LocalDate deadline;

    @NotNull(message = "Mức độ ưu tiên không được để trống")
    private TaskPriority priority;

    @NotNull(message = "Trạng thái không được để trống")
    private TaskStatus status;

    @NotNull(message = "Project ID không được để trống")
    private Long projectId;

    private Long userId; // ID của User được phân công (Có thể null)
}