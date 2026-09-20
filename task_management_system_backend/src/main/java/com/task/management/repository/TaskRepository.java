package com.task.management.repository;

import com.task.management.entity.Task;
import com.task.management.enums.TaskPriority;
import com.task.management.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByStatus(TaskStatus status);

    List<Task> findByPriority(TaskPriority priority);

    List<Task> findByProjectId(Long projectId);

    @Query("SELECT t FROM Task t WHERE t.project.id IN (SELECT pm.project.id FROM ProjectMember pm WHERE pm.user.id = :userId)")
    List<Task> findVisibleTasksForUser(@Param("userId") Long userId);

    long countByStatus(TaskStatus status);
}