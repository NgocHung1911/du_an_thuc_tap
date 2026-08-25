package com.task.management.repository;

import com.task.management.entity.ProjectInvitation;
import com.task.management.enums.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectInvitationRepository extends JpaRepository<ProjectInvitation, Long> {

    Optional<ProjectInvitation> findByToken(String token);

    List<ProjectInvitation> findAllByEmailAndProjectIdAndStatus(String email, Long projectId, InvitationStatus status);

    Optional<ProjectInvitation> findFirstByEmailAndProjectIdAndStatusOrderByIdDesc(String email, Long projectId, InvitationStatus status);
}

