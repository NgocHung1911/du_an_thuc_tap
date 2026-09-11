package com.task.management.service;

import com.task.management.dto.request.TaskRequest;
import com.task.management.dto.response.ProjectDTO;
import com.task.management.dto.response.TaskDTO;
import com.task.management.dto.response.UserDTO;
import com.task.management.entity.Project;
import com.task.management.entity.Task;
import com.task.management.entity.User;
import com.task.management.enums.ProjectRole;
import com.task.management.enums.TaskPriority;
import com.task.management.enums.TaskStatus;
import com.task.management.exception.BadRequestException;
import com.task.management.exception.ResourceNotFoundException;
import com.task.management.repository.ProjectRepository;
import com.task.management.repository.TaskRepository;
import com.task.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.task.management.dto.websocket.WebSocketEventType;
import com.task.management.event.TaskDomainEvent;
import org.springframework.context.ApplicationEventPublisher;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectService projectService;
    private final ApplicationEventPublisher eventPublisher;
    private final CloudinaryService cloudinaryService;
    private final CloudflareR2Service cloudflareR2Service;

    private void publishTaskEvent(WebSocketEventType eventType, Task task, TaskDTO taskDto, Long targetUserId) {
        if (eventPublisher == null || task == null) return;
        String actorUsername = resolveUsername(null);
        User actor = actorUsername != null ? userRepository.findByUsername(actorUsername).orElse(null) : null;
        String actorFullName = actor != null ? resolveFullName(actor) : actorUsername;

        Long projId = task.getProject() != null ? task.getProject().getId() : null;
        eventPublisher.publishEvent(new TaskDomainEvent(
                this,
                eventType,
                projId,
                task.getId(),
                actorUsername,
                actorFullName,
                taskDto != null ? taskDto : mapToDTO(task),
                targetUserId
        ));
    }

    private void validateUserBelongsToProject(User user, Project project) {
        if (user == null || project == null) return;
        boolean isMember = project.getMembers() != null &&
                project.getMembers().stream().anyMatch(m -> m.getUser() != null && m.getUser().getId().equals(user.getId()));
        boolean isOwner = project.getUser() != null && project.getUser().getId().equals(user.getId());
        if (!isMember && !isOwner) {
            throw new BadRequestException("User does not belong to this project!");
        }
    }

    private String resolveFullName(User user) {
        if (user == null) return null;
        if (user.getFullName() != null && !user.getFullName().isBlank()) {
            return user.getFullName();
        }
        return user.getUsername();
    }

    private TaskDTO mapToDTO(Task task) {
        ProjectDTO projectDTO = ProjectDTO.builder()
                .id(task.getProject().getId())
                .name(task.getProject().getName())
                .description(task.getProject().getDescription())
                .startDate(task.getProject().getStartDate())
                .endDate(task.getProject().getEndDate())
                .status(task.getProject().getStatus())
                .build();

        UserDTO userDTO = null;
        if (task.getUser() != null) {
            userDTO = UserDTO.builder()
                    .id(task.getUser().getId())
                    .username(task.getUser().getUsername())
                    .email(task.getUser().getEmail())
                    .fullName(resolveFullName(task.getUser()))
                    .avatarUrl(task.getUser().getAvatarUrl())
                    .role(task.getUser().getRole())
                    .build();
        }

        User effectiveReporter = task.getReporter();
        if (effectiveReporter == null) {
            if (task.getProject() != null && task.getProject().getUser() != null) {
                effectiveReporter = task.getProject().getUser();
            } else if (task.getUser() != null) {
                effectiveReporter = task.getUser();
            }
        }

        UserDTO reporterDTO = null;
        if (effectiveReporter != null) {
            reporterDTO = UserDTO.builder()
                    .id(effectiveReporter.getId())
                    .username(effectiveReporter.getUsername())
                    .email(effectiveReporter.getEmail())
                    .fullName(resolveFullName(effectiveReporter))
                    .avatarUrl(effectiveReporter.getAvatarUrl())
                    .role(effectiveReporter.getRole())
                    .build();
        }

        Long projId = task.getProject() != null ? task.getProject().getId() : null;
        String projName = task.getProject() != null ? task.getProject().getName() : null;
        Long uId = task.getUser() != null ? task.getUser().getId() : null;
        String uFullName = task.getUser() != null ? resolveFullName(task.getUser()) : null;
        Long rId = effectiveReporter != null ? effectiveReporter.getId() : null;
        String rFullName = effectiveReporter != null ? resolveFullName(effectiveReporter) : null;

        return TaskDTO.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .deadline(task.getDeadline())
                .priority(task.getPriority())
                .status(task.getStatus())
                .project(projectDTO)
                .assignedUser(userDTO)
                .reporter(reporterDTO)
                .projectId(projId)
                .projectName(projName)
                .userId(uId)
                .userFullName(uFullName)
                .reporterId(rId)
                .reporterFullName(rFullName)
                .attachments(task.getAttachments() != null 
                        ? task.getAttachments().stream().map(att -> com.task.management.dto.response.TaskAttachmentDTO.builder()
                                .id(att.getId())
                                .fileName(att.getFileName())
                                .fileUrl(att.getAttachmentUrl())
                                .fileSize(att.getFileSize())
                                .fileType(att.getFileType())
                                .createdAt(att.getCreatedAt())
                                .build()).collect(Collectors.toList())
                        : new java.util.ArrayList<>())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<TaskDTO> getAllTasks() {
        return taskRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TaskDTO> getTasksByProjectId(Long projectId) {
        return taskRepository.findByProjectId(projectId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TaskDTO getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + id));
        return mapToDTO(task);
    }

    private String resolveUsername(String username) {
        if (username != null && !username.trim().isEmpty()) {
            return username.trim();
        }
        org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return null;
    }

    @Transactional
    public TaskDTO createTask(TaskRequest request) {
        return createTask(request, null);
    }

    @Transactional
    public TaskDTO createTask(TaskRequest request, String username) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + request.getProjectId()));

        String effectiveUsername = resolveUsername(username);
        if (effectiveUsername != null) {
            ProjectRole role = projectService.getUserRoleInProject(request.getProjectId(), effectiveUsername);
            if (role != ProjectRole.OWNER && role != ProjectRole.ADMIN) {
                throw new BadRequestException("Members (MEMBER) do not have permission to create a new task!");
            }
        }

        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setDeadline(request.getDeadline());
        task.setPriority(request.getPriority());
        task.setStatus(request.getStatus());
        task.setProject(project);

        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + request.getUserId()));
            validateUserBelongsToProject(user, project);
            task.setUser(user);
        }

        // Set Reporter (Default to task creator/logged-in user if not provided)
        User reporterUser = null;
        if (request.getReporterId() != null) {
            reporterUser = userRepository.findById(request.getReporterId())
                    .orElseThrow(() -> new ResourceNotFoundException("Reporter not found with ID: " + request.getReporterId()));
            validateUserBelongsToProject(reporterUser, project);
        } else if (effectiveUsername != null) {
            reporterUser = userRepository.findByUsername(effectiveUsername).orElse(null);
            if (reporterUser != null) {
                validateUserBelongsToProject(reporterUser, project);
            }
        }
        if (reporterUser == null && project.getUser() != null) {
            reporterUser = project.getUser();
        }
        task.setReporter(reporterUser);

        if (request.getAttachments() != null) {
            task.setAttachments(request.getAttachments().stream()
                    .map(url -> {
                        String name = url.contains("/") ? url.substring(url.lastIndexOf("/") + 1) : url;
                        return new com.task.management.entity.TaskAttachment(name, url, null, null, task);
                    })
                    .collect(Collectors.toList()));
        }

        Task savedTask = taskRepository.save(task);
        TaskDTO dto = mapToDTO(savedTask);
        publishTaskEvent(WebSocketEventType.TASK_CREATED, savedTask, dto, savedTask.getUser() != null ? savedTask.getUser().getId() : null);
        return dto;
    }

    @Transactional
    public TaskDTO updateTask(Long id, TaskRequest request) {
        return updateTask(id, request, null);
    }

    @Transactional
    public TaskDTO updateTask(Long id, TaskRequest request, String username) {
        Task existingTask = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + id));

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + request.getProjectId()));

        String effectiveUsername = resolveUsername(username);
        if (effectiveUsername != null) {
            ProjectRole role = projectService.getUserRoleInProject(project.getId(), effectiveUsername);
            if (role != ProjectRole.OWNER && role != ProjectRole.ADMIN) {
                throw new BadRequestException("Members (MEMBER) do not have permission to edit task details!");
            }
        }

        existingTask.setTitle(request.getTitle());
        existingTask.setDescription(request.getDescription());
        existingTask.setDeadline(request.getDeadline());
        existingTask.setPriority(request.getPriority());
        existingTask.setStatus(request.getStatus());
        existingTask.setProject(project);

        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + request.getUserId()));
            validateUserBelongsToProject(user, project);
            existingTask.setUser(user);
        } else {
            existingTask.setUser(null);
        }

        // Update Reporter if specified, or auto-assign creator if reporter was missing
        if (request.getReporterId() != null) {
            User reporterUser = userRepository.findById(request.getReporterId())
                    .orElseThrow(() -> new ResourceNotFoundException("Reporter not found with ID: " + request.getReporterId()));
            validateUserBelongsToProject(reporterUser, project);
            existingTask.setReporter(reporterUser);
        } else if (existingTask.getReporter() == null) {
            User creatorUser = null;
            if (effectiveUsername != null) {
                creatorUser = userRepository.findByUsername(effectiveUsername).orElse(null);
            }
            if (creatorUser == null && project.getUser() != null) {
                creatorUser = project.getUser();
            }
            existingTask.setReporter(creatorUser);
        }

        if (request.getAttachments() != null) {
            existingTask.getAttachments().clear();
            existingTask.getAttachments().addAll(request.getAttachments().stream()
                    .map(url -> {
                        String name = url.contains("/") ? url.substring(url.lastIndexOf("/") + 1) : url;
                        return new com.task.management.entity.TaskAttachment(name, url, null, null, existingTask);
                    })
                    .collect(Collectors.toList()));
        }

        Task updatedTask = taskRepository.save(existingTask);
        TaskDTO dto = mapToDTO(updatedTask);
        publishTaskEvent(WebSocketEventType.TASK_UPDATED, updatedTask, dto, null);
        return dto;
    }

    @Transactional
    public TaskDTO updateTaskStatus(Long id, TaskStatus status) {
        return updateTaskStatus(id, status, null);
    }

    @Transactional
    public TaskDTO updateTaskStatus(Long id, TaskStatus status, String username) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + id));

        String effectiveUsername = resolveUsername(username);
        if (effectiveUsername != null) {
            ProjectRole role = projectService.getUserRoleInProject(task.getProject().getId(), effectiveUsername);
            if (role == null) {
                throw new BadRequestException("You are not a member of this project, so you cannot change the task status!");
            }
        }

        task.setStatus(status);
        Task updatedTask = taskRepository.save(task);
        TaskDTO dto = mapToDTO(updatedTask);
        publishTaskEvent(WebSocketEventType.TASK_STATUS_CHANGED, updatedTask, dto, null);
        return dto;
    }

    @Transactional
    public TaskDTO updateTaskPriority(Long id, TaskPriority priority) {
        return updateTaskPriority(id, priority, null);
    }

    @Transactional
    public TaskDTO updateTaskPriority(Long id, TaskPriority priority, String username) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + id));

        String effectiveUsername = resolveUsername(username);
        if (effectiveUsername != null) {
            ProjectRole role = projectService.getUserRoleInProject(task.getProject().getId(), effectiveUsername);
            if (role != ProjectRole.OWNER && role != ProjectRole.ADMIN) {
                throw new BadRequestException("Members (MEMBER) do not have permission to change task priority!");
            }
        }

        task.setPriority(priority);
        Task updatedTask = taskRepository.save(task);
        TaskDTO dto = mapToDTO(updatedTask);
        publishTaskEvent(WebSocketEventType.TASK_UPDATED, updatedTask, dto, null);
        return dto;
    }

    @Transactional
    public TaskDTO assignTaskToUser(Long taskId, Long userId) {
        return assignTaskToUser(taskId, userId, null);
    }

    @Transactional
    public TaskDTO assignTaskToUser(Long taskId, Long userId, String username) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        String effectiveUsername = resolveUsername(username);
        if (effectiveUsername != null) {
            ProjectRole role = projectService.getUserRoleInProject(task.getProject().getId(), effectiveUsername);
            if (role != ProjectRole.OWNER && role != ProjectRole.ADMIN) {
                throw new BadRequestException("Members (MEMBER) do not have permission to assign or unassign team members!");
            }
        }

        if (userId == null) {
            task.setUser(null);
        } else {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

            validateUserBelongsToProject(user, task.getProject());
            task.setUser(user);
        }

        Task updatedTask = taskRepository.save(task);
        TaskDTO dto = mapToDTO(updatedTask);
        publishTaskEvent(WebSocketEventType.TASK_ASSIGNED, updatedTask, dto, updatedTask.getUser() != null ? updatedTask.getUser().getId() : null);
        return dto;
    }

    @Transactional
    public TaskDTO assignTaskToReporter(Long taskId, Long reporterId) {
        return assignTaskToReporter(taskId, reporterId, null);
    }

    @Transactional
    public TaskDTO assignTaskToReporter(Long taskId, Long reporterId, String username) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        String effectiveUsername = resolveUsername(username);
        if (effectiveUsername != null) {
            ProjectRole role = projectService.getUserRoleInProject(task.getProject().getId(), effectiveUsername);
            if (role != ProjectRole.OWNER && role != ProjectRole.ADMIN) {
                throw new BadRequestException("Members (MEMBER) do not have permission to change the reporter!");
            }
        }

        if (reporterId == null) {
            User defaultReporter = null;
            if (effectiveUsername != null) {
                defaultReporter = userRepository.findByUsername(effectiveUsername).orElse(null);
            }
            if (defaultReporter == null && task.getProject().getUser() != null) {
                defaultReporter = task.getProject().getUser();
            }
            task.setReporter(defaultReporter);
        } else {
            User reporterUser = userRepository.findById(reporterId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + reporterId));
            validateUserBelongsToProject(reporterUser, task.getProject());
            task.setReporter(reporterUser);
        }

        Task updatedTask = taskRepository.save(task);
        TaskDTO dto = mapToDTO(updatedTask);
        publishTaskEvent(WebSocketEventType.TASK_UPDATED, updatedTask, dto, null);
        return dto;
    }

    @Transactional
    public void deleteTask(Long id) {
        deleteTask(id, null);
    }

    @Transactional
    public void deleteTask(Long id, String username) {
        Task existingTask = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + id));

        String effectiveUsername = resolveUsername(username);
        if (effectiveUsername != null) {
            ProjectRole role = projectService.getUserRoleInProject(existingTask.getProject().getId(), effectiveUsername);
            if (role != ProjectRole.OWNER && role != ProjectRole.ADMIN) {
                throw new BadRequestException("Members (MEMBER) do not have permission to delete tasks!");
            }
        }

        TaskDTO dto = mapToDTO(existingTask);
        publishTaskEvent(WebSocketEventType.TASK_DELETED, existingTask, dto, null);
        taskRepository.delete(existingTask);
    }

    @Transactional
    public TaskDTO addAttachment(Long taskId, org.springframework.web.multipart.MultipartFile file, String username) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        String effectiveUsername = resolveUsername(username);
        if (effectiveUsername != null) {
            ProjectRole role = projectService.getUserRoleInProject(task.getProject().getId(), effectiveUsername);
            if (role == null) {
                throw new BadRequestException("You are not a member of this project!");
            }
        }

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Attachment file cannot be empty!");
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "attachment";
        Long fileSize = file.getSize();
        String contentType = file.getContentType();

        String fileUrl;
        if (contentType != null && contentType.toLowerCase().startsWith("image/")) {
            fileUrl = cloudinaryService.uploadAvatar(file, task.getId());
        } else {
            fileUrl = cloudflareR2Service.uploadFile(file, "task-attachments");
        }

        if (task.getAttachments() == null) {
            task.setAttachments(new java.util.ArrayList<>());
        }
        task.getAttachments().add(new com.task.management.entity.TaskAttachment(
                originalFilename,
                fileUrl,
                fileSize,
                contentType,
                task
        ));

        Task updatedTask = taskRepository.save(task);
        TaskDTO dto = mapToDTO(updatedTask);
        publishTaskEvent(WebSocketEventType.TASK_UPDATED, updatedTask, dto, null);
        return dto;
    }

    @Transactional
    public TaskDTO removeAttachment(Long taskId, String attachmentUrl, String username) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        String effectiveUsername = resolveUsername(username);
        if (effectiveUsername != null) {
            ProjectRole role = projectService.getUserRoleInProject(task.getProject().getId(), effectiveUsername);
            if (role == null) {
                throw new BadRequestException("You are not a member of this project!");
            }
        }

        if (task.getAttachments() != null && attachmentUrl != null) {
            task.getAttachments().removeIf(att -> att.getAttachmentUrl().equals(attachmentUrl));
        }

        Task updatedTask = taskRepository.save(task);
        TaskDTO dto = mapToDTO(updatedTask);
        publishTaskEvent(WebSocketEventType.TASK_UPDATED, updatedTask, dto, null);
        return dto;
    }
}