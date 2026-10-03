package com.task.management.repository;

import com.task.management.entity.Project;
import com.task.management.enums.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    boolean existsByName(String name);

    @Query("SELECT p FROM Project p WHERE " +
           "(:name IS NULL OR :name = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
           "(:status IS NULL OR p.status = :status) " +
           "ORDER BY p.id DESC")
    List<Project> searchProjects(@Param("name") String name, @Param("status") ProjectStatus status);

    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN p.members pm WHERE " +
           "(p.user.id = :userId OR pm.user.id = :userId) AND " +
           "(:name IS NULL OR :name = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
           "(:status IS NULL OR p.status = :status) " +
           "ORDER BY p.id DESC")
    List<Project> searchProjectsByUser(@Param("userId") Long userId, @Param("name") String name, @Param("status") ProjectStatus status);

    @Query("SELECT COALESCE((SELECT SUM(a.fileSize) FROM TaskAttachment a WHERE a.task.project.user.id = :ownerId), 0) + " +
           "COALESCE((SELECT SUM(ca.fileSize) FROM TaskCommentAttachment ca WHERE ca.comment.task.project.user.id = :ownerId), 0)")
    Long sumAttachmentSizeByOwnerId(@Param("ownerId") Long ownerId);
    List<Project> findTop5ByOrderByIdDesc();
    @Query("SELECT p.status AS status, COUNT(p) AS count FROM Project p GROUP BY p.status")
    List<Object[]> countProjectsGroupedByStatus();
}