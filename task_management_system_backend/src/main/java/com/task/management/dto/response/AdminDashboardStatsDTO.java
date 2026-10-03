package com.task.management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStatsDTO {

    // Tasks metrics
    private long totalTasks;
    private long doneTasks;
    private long doingTasks;
    private long reviewTasks;
    private long todoTasks;
    private long inProgressTasks;
    private int taskCompletionRate;

    // Projects metrics
    private long totalProjects;
    private long activeProjects;
    private long completedProjects;
    private long planningProjects;
    private long onHoldProjects;

    // Users metrics
    private long totalUsers;
    private long adminUsers;
    private long memberUsers;

    // Recent items
    private List<TaskDTO> recentTasks;
    private List<ProjectDTO> recentProjects;
}
