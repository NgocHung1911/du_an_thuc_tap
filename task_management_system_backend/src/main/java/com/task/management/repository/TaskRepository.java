package com.task.management.repository;

import com.task.management.entity.Task;
import com.task.management.enums.TaskPriority;
import com.task.management.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByStatus(TaskStatus status);

    List<Task> findByPriority(TaskPriority priority);

    List<Task> findByProjectId(Long projectId);

    long countByStatus(TaskStatus status);
}