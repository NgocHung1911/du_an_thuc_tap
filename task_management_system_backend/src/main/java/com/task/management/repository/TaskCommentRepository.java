package com.task.management.repository;

import com.task.management.entity.TaskComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskCommentRepository extends JpaRepository<TaskComment, Long> {

    List<TaskComment> findByTaskIdAndParentCommentIsNullOrderByCreatedAtAsc(Long taskId);

    List<TaskComment> findByTaskIdOrderByCreatedAtAsc(Long taskId);
}
