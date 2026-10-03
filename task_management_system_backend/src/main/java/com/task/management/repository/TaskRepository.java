package com.task.management.repository;

import com.task.management.entity.Task;
import com.task.management.enums.TaskPriority;
import com.task.management.enums.TaskStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {

    @Override
    @EntityGraph(attributePaths = {"project", "user", "reporter"})
    List<Task> findAll();

    @Override
    @EntityGraph(attributePaths = {"project", "user", "reporter"})
    Optional<Task> findById(Long id);

    @EntityGraph(attributePaths = {"project", "user", "reporter"})
    List<Task> findByProjectId(Long projectId);

    @EntityGraph(attributePaths = {"project", "user", "reporter"})
    List<Task> findByStatus(TaskStatus status);

    @EntityGraph(attributePaths = {"project", "user", "reporter"})
    List<Task> findByPriority(TaskPriority priority);
    @Query("SELECT t FROM Task t WHERE t.project.id IN (SELECT pm.project.id FROM ProjectMember pm WHERE pm.user.id = :userId)")
    List<Task> findVisibleTasksForUser(@Param("userId") Long userId);

    long countByStatus(TaskStatus status);

    @Query("SELECT t.status, COUNT(t) FROM Task t GROUP BY t.status")
    List<Object[]> countTasksGroupedByStatus();

    @EntityGraph(attributePaths = {"project", "user", "reporter"})
    List<Task> findTop5ByOrderByIdDesc();
}