package com.task.management.service;

import com.task.management.dto.response.AdminDashboardStatsDTO;
import com.task.management.dto.response.ProjectDTO;
import com.task.management.dto.response.TaskDTO;
import com.task.management.enums.ProjectStatus;
import com.task.management.enums.TaskStatus;
import com.task.management.repository.ProjectRepository;
import com.task.management.repository.TaskRepository;
import com.task.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TaskService taskService;
    private final ProjectService projectService;

    @Transactional(readOnly = true)
    public AdminDashboardStatsDTO getAdminDashboardStats() {
        // 1. Task counts by status
        List<Object[]> taskStatusCounts = taskRepository.countTasksGroupedByStatus();
        Map<TaskStatus, Long> taskMap = new HashMap<>();
        long totalTasks = 0;
        if (taskStatusCounts != null) {
            for (Object[] row : taskStatusCounts) {
                if (row != null && row.length >= 2 && row[0] != null) {
                    TaskStatus st = (TaskStatus) row[0];
                    Long cnt = ((Number) row[1]).longValue();
                    taskMap.put(st, cnt);
                    totalTasks += cnt;
                }
            }
        }

        long doneTasks = taskMap.getOrDefault(TaskStatus.DONE, 0L);
        long doingTasks = taskMap.getOrDefault(TaskStatus.DOING, 0L);
        long reviewTasks = taskMap.getOrDefault(TaskStatus.REVIEW, 0L);
        long todoTasks = taskMap.getOrDefault(TaskStatus.TODO, 0L);
        long inProgressTasks = doingTasks + reviewTasks;
        int taskCompletionRate = totalTasks > 0 ? (int) Math.round(((double) doneTasks / totalTasks) * 100) : 0;

        // 2. Project counts by status
        List<Object[]> projectStatusCounts = projectRepository.countProjectsGroupedByStatus();
        Map<ProjectStatus, Long> projectMap = new HashMap<>();
        long totalProjects = 0;
        if (projectStatusCounts != null) {
            for (Object[] row : projectStatusCounts) {
                if (row != null && row.length >= 2 && row[0] != null) {
                    ProjectStatus st = (ProjectStatus) row[0];
                    Long cnt = ((Number) row[1]).longValue();
                    projectMap.put(st, cnt);
                    totalProjects += cnt;
                }
            }
        }

        long activeProjects = projectMap.getOrDefault(ProjectStatus.IN_PROGRESS, 0L);
        long completedProjects = projectMap.getOrDefault(ProjectStatus.COMPLETED, 0L);
        long planningProjects = projectMap.getOrDefault(ProjectStatus.PLANNING, 0L);
        long onHoldProjects = projectMap.getOrDefault(ProjectStatus.ON_HOLD, 0L);

        // 3. User counts
        long totalUsers = userRepository.count();
        long adminUsers = userRepository.countByRole(com.task.management.enums.Role.ADMIN);
        long memberUsers = userRepository.countByRole(com.task.management.enums.Role.MEMBER);

        // 4. Recent items (top 3 tasks, top 2 projects)
        List<TaskDTO> recentTasks = taskRepository.findTop5ByOrderByIdDesc().stream()
                .limit(3)
                .map(taskService::mapToDTO)
                .collect(Collectors.toList());

        List<ProjectDTO> recentProjects = projectRepository.findTop5ByOrderByIdDesc().stream()
                .limit(2)
                .map(projectService::mapToDTO)
                .collect(Collectors.toList());

        return AdminDashboardStatsDTO.builder()
                .totalTasks(totalTasks)
                .doneTasks(doneTasks)
                .doingTasks(doingTasks)
                .reviewTasks(reviewTasks)
                .todoTasks(todoTasks)
                .inProgressTasks(inProgressTasks)
                .taskCompletionRate(taskCompletionRate)
                .totalProjects(totalProjects)
                .activeProjects(activeProjects)
                .completedProjects(completedProjects)
                .planningProjects(planningProjects)
                .onHoldProjects(onHoldProjects)
                .totalUsers(totalUsers)
                .adminUsers(adminUsers)
                .memberUsers(memberUsers)
                .recentTasks(recentTasks)
                .recentProjects(recentProjects)
                .build();
    }
}
