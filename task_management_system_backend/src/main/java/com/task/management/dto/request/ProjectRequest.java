package com.task.management.dto.request;

import com.task.management.enums.ProjectStatus;
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
public class ProjectRequest {

    @NotBlank(message = "Project name cannot be blank")
    @Size(max = 100, message = "Project name cannot exceed 100 characters")
    private String name;

    private String description;

    @NotNull(message = "Start date cannot be blank")
    private LocalDate startDate;

    @NotNull(message = "End date cannot be blank")
    private LocalDate endDate;

    @NotNull(message = "Status cannot be blank")
    private ProjectStatus status;
}