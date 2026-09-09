package com.task.management.service;

import com.task.management.dto.request.InviteMemberRequestDTO;
import com.task.management.dto.request.ProjectRequest;
import com.task.management.dto.response.ProjectDTO;
import com.task.management.dto.response.UserDTO;
import com.task.management.entity.Project;
import com.task.management.entity.ProjectMember;
import com.task.management.entity.User;
import com.task.management.enums.ProjectRole;
import com.task.management.enums.ProjectStatus;
import com.task.management.enums.Role;
import com.task.management.exception.BadRequestException;
import com.task.management.exception.ResourceNotFoundException;
import com.task.management.repository.ProjectMemberRepository;
import com.task.management.repository.ProjectRepository;
import com.task.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;

    private String resolveFullName(User user) {
        if (user == null) return null;
        if (user.getFullName() != null && !user.getFullName().isBlank()) {
            return user.getFullName();
        }
        return user.getUsername();
    }

    private UserDTO mapProjectMemberToDTO(ProjectMember member) {
        if (member == null || member.getUser() == null) return null;
        return UserDTO.builder()
                .id(member.getUser().getId())
                .username(member.getUser().getUsername())
                .email(member.getUser().getEmail())
                .fullName(resolveFullName(member.getUser()))
                .role(member.getUser().getRole())
                .projectRole(member.getRole())
                .build();
    }


    private ProjectDTO mapToDTO(Project project) {
        int taskCount = (project.getTasks() != null) ? project.getTasks().size() : 0;
        List<UserDTO> memberDTOs = (project.getMembers() != null)
                ? project.getMembers().stream().map(this::mapProjectMemberToDTO).collect(Collectors.toList())
                : Collections.emptyList();

        return ProjectDTO.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .status(project.getStatus())
                .taskCount(taskCount)
                .members(memberDTOs)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }

    private Project mapToEntity(ProjectRequest request) {
        Project project = new Project();
        project.setName(request.getName().trim());
        project.setDescription(request.getDescription());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        project.setStatus(request.getStatus() != null ? request.getStatus() : ProjectStatus.PLANNING);
        return project;
    }

    @Transactional(readOnly = true)
    public ProjectRole getUserRoleInProject(Long projectId, String username) {
        if (username == null || username.trim().isEmpty()) return null;
        User user = userRepository.findByUsername(username)
                .orElseGet(() -> userRepository.findByEmail(username).orElse(null));
        if (user == null) return null;

        return projectMemberRepository.findByProjectIdAndUserId(projectId, user.getId())
                .map(pm -> pm.getRole())
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<ProjectDTO> getAllProjects() {
        return getAllProjects(null, null, null, false);
    }

    @Transactional(readOnly = true)
    public List<ProjectDTO> getAllProjects(String username, String search, ProjectStatus status, boolean all) {
        if (username == null || username.trim().isEmpty()) {
            return projectRepository.searchProjects(search, status)
                    .stream().map(this::mapToDTO).collect(Collectors.toList());
        }

        User currentUser = userRepository.findByUsername(username)
                .orElseGet(() -> userRepository.findByEmail(username).orElse(null));

        if (all) {
            return projectRepository.searchProjects(search, status)
                    .stream().map(this::mapToDTO).collect(Collectors.toList());
        }

        if (currentUser == null) {
            return projectRepository.searchProjects(search, status)
                    .stream().map(this::mapToDTO).collect(Collectors.toList());
        }

        return projectRepository.searchProjectsByUser(currentUser.getId(), search, status)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectDTO getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + id));
        return mapToDTO(project);
    }

    @Transactional(readOnly = true)
    public ProjectDTO getProjectById(Long id, String username) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + id));

        if (username != null && !username.trim().isEmpty()) {
            User currentUser = userRepository.findByUsername(username)
                    .orElseGet(() -> userRepository.findByEmail(username).orElse(null));

            if (currentUser == null || currentUser.getRole() != Role.ADMIN) {
                ProjectRole callerRole = getUserRoleInProject(id, username);
                if (callerRole == null) {
                    throw new BadRequestException("You are not a member of this project!");
                }
            }
        }
        return mapToDTO(project);
    }

    @Transactional
    public ProjectDTO createProject(ProjectRequest request) {
        return createProject(request, null);
    }

    @Transactional
    public ProjectDTO createProject(ProjectRequest request, String username) {
        if (projectRepository.existsByName(request.getName().trim())) {
            throw new BadRequestException("Project name already exists!");
        }
        Project project = mapToEntity(request);

        if (username != null && !username.trim().isEmpty()) {
            User currentUser = userRepository.findByUsername(username)
                    .orElseGet(() -> userRepository.findByEmail(username).orElse(null));
            if (currentUser != null) {
                project.setUser(currentUser);

                ProjectMember ownerMember = ProjectMember.builder()
                        .project(project)
                        .user(currentUser)
                        .role(ProjectRole.OWNER)
                        .build();

                project.getMembers().add(ownerMember);
            }
        }

        Project savedProject = projectRepository.save(project);
        return mapToDTO(savedProject);
    }

    @Transactional
    public ProjectDTO updateProject(Long id, ProjectRequest request) {
        return updateProject(id, request, null);
    }

    @Transactional
    public ProjectDTO updateProject(Long id, ProjectRequest request, String username) {
        Project existingProject = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + id));

        if (username != null && !username.trim().isEmpty()) {
            User currentUser = userRepository.findByUsername(username)
                    .orElseGet(() -> userRepository.findByEmail(username).orElse(null));

            if (currentUser == null || currentUser.getRole() != Role.ADMIN) {
                ProjectRole callerRole = getUserRoleInProject(id, username);
                if (callerRole != ProjectRole.OWNER && callerRole != ProjectRole.ADMIN) {
                    throw new BadRequestException("You do not have permission to update this project!");
                }
            }
        }

        String newName = request.getName().trim();
        if (!existingProject.getName().equalsIgnoreCase(newName) && projectRepository.existsByName(newName)) {
            throw new BadRequestException("New project name conflicts with another project!");
        }

        existingProject.setName(newName);
        existingProject.setDescription(request.getDescription());
        existingProject.setStartDate(request.getStartDate());
        existingProject.setEndDate(request.getEndDate());
        if (request.getStatus() != null) {
            existingProject.setStatus(request.getStatus());
        }

        Project updatedProject = projectRepository.save(existingProject);
        return mapToDTO(updatedProject);
    }

    @Transactional
    public void deleteProject(Long id) {
        deleteProject(id, null);
    }

    @Transactional
    public void deleteProject(Long id, String username) {
        Project existingProject = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + id));

        if (username != null && !username.trim().isEmpty()) {
            User currentUser = userRepository.findByUsername(username)
                    .orElseGet(() -> userRepository.findByEmail(username).orElse(null));

            if (currentUser == null || currentUser.getRole() != Role.ADMIN) {
                ProjectRole callerRole = getUserRoleInProject(id, username);
                if (callerRole != ProjectRole.OWNER) {
                    throw new BadRequestException("Only the Project Owner can delete the project!");
                }
            }
        }

        projectRepository.delete(existingProject);
    }

    @Transactional
    public UserDTO addMemberToProject(Long projectId, InviteMemberRequestDTO request) {
        return addMemberToProject(projectId, request, null);
    }

    @Transactional
    public UserDTO addMemberToProject(Long projectId, InviteMemberRequestDTO request, String currentUsername) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new BadRequestException("Email or Username cannot be blank!");
        }

        if (currentUsername != null && !currentUsername.trim().isEmpty()) {
            ProjectRole callerRole = getUserRoleInProject(projectId, currentUsername);
            if (callerRole != ProjectRole.OWNER && callerRole != ProjectRole.ADMIN) {
                throw new BadRequestException("You do not have permission to invite/add members to this project!");
            }
        }

        String identifier = request.getEmail().trim();

        User user = userRepository.findByEmail(identifier)
                .orElseGet(() -> userRepository.findByUsername(identifier).orElse(null));

        if (user == null) {
            throw new ResourceNotFoundException("User account does not exist in the system.");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + projectId));

        boolean isAlreadyMember = projectMemberRepository.existsByProjectIdAndUserId(projectId, user.getId());

        if (isAlreadyMember) {
            throw new BadRequestException("Member is already in the project");
        }

        ProjectMember newMember = ProjectMember.builder()
                .project(project)
                .user(user)
                .role(ProjectRole.MEMBER)
                .build();

        project.getMembers().add(newMember);
        projectRepository.save(project);

        return mapProjectMemberToDTO(newMember);
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getProjectMembers(Long projectId) {
        return getProjectMembers(projectId, null);
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getProjectMembers(Long projectId, String username) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + projectId));

        if (username != null && !username.trim().isEmpty()) {
            ProjectRole callerRole = getUserRoleInProject(projectId, username);
            if (callerRole == null) {
                throw new BadRequestException("You do not have permission to view members of this project!");
            }
        }

        if (project.getMembers() == null) {
            return Collections.emptyList();
        }

        return project.getMembers().stream()
                .map(this::mapProjectMemberToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDTO updateMemberRole(Long projectId, Long userId, ProjectRole newRole, String currentUsername) {
        if (newRole == null) {
            throw new BadRequestException("Role cannot be blank!");
        }
        if (newRole == ProjectRole.OWNER) {
            throw new BadRequestException("Can only grant ADMIN or MEMBER role to project members!");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + projectId));

        if (currentUsername != null && !currentUsername.trim().isEmpty()) {
            ProjectRole callerRole = getUserRoleInProject(projectId, currentUsername);
            if (callerRole != ProjectRole.OWNER) {
                throw new BadRequestException("Only the Owner can grant or revoke ADMIN rights for members!");
            }
        }

        ProjectMember targetMember = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member does not belong to this project"));

        if (project.getUser() != null && project.getUser().getId().equals(userId)) {
            throw new BadRequestException("Owner rights cannot be revoked or role changed!");
        }

        if (targetMember.getRole() == ProjectRole.OWNER) {
            throw new BadRequestException("Owner rights cannot be revoked or role changed!");
        }

        targetMember.setRole(newRole);
        ProjectMember savedMember = projectMemberRepository.save(targetMember);
        return mapProjectMemberToDTO(savedMember);
    }

    @Transactional
    public void removeMemberFromProject(Long projectId, Long userId) {
        removeMemberFromProject(projectId, userId, null);
    }

    @Transactional
    public void removeMemberFromProject(Long projectId, Long userId, String currentUsername) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + projectId));

        ProjectRole callerRole = null;
        if (currentUsername != null && !currentUsername.trim().isEmpty()) {
            callerRole = getUserRoleInProject(projectId, currentUsername);
            if (callerRole != ProjectRole.OWNER && callerRole != ProjectRole.ADMIN) {
                throw new BadRequestException("You do not have permission to remove members from this project!");
            }
        }

        if (project.getUser() != null && project.getUser().getId().equals(userId)) {
            throw new BadRequestException("Owner cannot be removed from the project!");
        }

        ProjectMember targetMember = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member does not belong to this project"));

        if (targetMember.getRole() == ProjectRole.OWNER) {
            throw new BadRequestException("Owner cannot be removed from the project!");
        }

        if (callerRole == ProjectRole.ADMIN && targetMember.getRole() == ProjectRole.ADMIN) {
            throw new BadRequestException("Admins do not have permission to remove another Admin!");
        }

        project.getMembers().remove(targetMember);
        projectMemberRepository.delete(targetMember);
        projectRepository.save(project);
    }
}