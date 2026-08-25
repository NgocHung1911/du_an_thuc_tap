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

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectService projectService;

    private void validateUserBelongsToProject(User user, Project project) {
        if (user == null || project == null) return;
        boolean isMember = project.getMembers() != null &&
                project.getMembers().stream().anyMatch(m -> m.getUser() != null && m.getUser().getId().equals(user.getId()));
        boolean isOwner = project.getUser() != null && project.getUser().getId().equals(user.getId());
        if (!isMember && !isOwner) {
            throw new BadRequestException("Người dùng không thuộc dự án này!");
        }
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
                    .role(task.getUser().getRole())
                    .build();
        }

        Long projId = task.getProject() != null ? task.getProject().getId() : null;
        String projName = task.getProject() != null ? task.getProject().getName() : null;
        Long uId = task.getUser() != null ? task.getUser().getId() : null;
        String uFullName = task.getUser() != null ? task.getUser().getUsername() : null;

        return TaskDTO.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .deadline(task.getDeadline())
                .priority(task.getPriority())
                .status(task.getStatus())
                .project(projectDTO)
                .assignedUser(userDTO)
                .projectId(projId)
                .projectName(projName)
                .userId(uId)
                .userFullName(uFullName)
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
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Task với ID: " + id));
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
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Project với ID: " + request.getProjectId()));

        String effectiveUsername = resolveUsername(username);
        if (effectiveUsername != null) {
            ProjectRole role = projectService.getUserRoleInProject(request.getProjectId(), effectiveUsername);
            if (role != ProjectRole.OWNER && role != ProjectRole.ADMIN) {
                throw new BadRequestException("Thành viên (MEMBER) không có quyền tạo task mới!");
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
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy User với ID: " + request.getUserId()));
            validateUserBelongsToProject(user, project);
            task.setUser(user);
        }

        Task savedTask = taskRepository.save(task);
        return mapToDTO(savedTask);
    }

    @Transactional
    public TaskDTO updateTask(Long id, TaskRequest request) {
        return updateTask(id, request, null);
    }

    @Transactional
    public TaskDTO updateTask(Long id, TaskRequest request, String username) {
        Task existingTask = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Task với ID: " + id));

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Project với ID: " + request.getProjectId()));

        String effectiveUsername = resolveUsername(username);
        if (effectiveUsername != null) {
            ProjectRole role = projectService.getUserRoleInProject(project.getId(), effectiveUsername);
            if (role != ProjectRole.OWNER && role != ProjectRole.ADMIN) {
                throw new BadRequestException("Thành viên (MEMBER) không có quyền sửa nội dung task!");
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
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy User với ID: " + request.getUserId()));
            validateUserBelongsToProject(user, project);
            existingTask.setUser(user);
        } else {
            existingTask.setUser(null);
        }

        Task updatedTask = taskRepository.save(existingTask);
        return mapToDTO(updatedTask);
    }

    @Transactional
    public TaskDTO updateTaskStatus(Long id, TaskStatus status) {
        return updateTaskStatus(id, status, null);
    }

    @Transactional
    public TaskDTO updateTaskStatus(Long id, TaskStatus status, String username) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Task với ID: " + id));

        String effectiveUsername = resolveUsername(username);
        if (effectiveUsername != null) {
            ProjectRole role = projectService.getUserRoleInProject(task.getProject().getId(), effectiveUsername);
            if (role == null) {
                throw new BadRequestException("Bạn không thuộc dự án này nên không thể chuyển trạng thái task!");
            }
        }

        task.setStatus(status);
        Task updatedTask = taskRepository.save(task);
        return mapToDTO(updatedTask);
    }

    @Transactional
    public TaskDTO updateTaskPriority(Long id, TaskPriority priority) {
        return updateTaskPriority(id, priority, null);
    }

    @Transactional
    public TaskDTO updateTaskPriority(Long id, TaskPriority priority, String username) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Task với ID: " + id));

        String effectiveUsername = resolveUsername(username);
        if (effectiveUsername != null) {
            ProjectRole role = projectService.getUserRoleInProject(task.getProject().getId(), effectiveUsername);
            if (role != ProjectRole.OWNER && role != ProjectRole.ADMIN) {
                throw new BadRequestException("Thành viên (MEMBER) không có quyền thay đổi độ ưu tiên của task!");
            }
        }

        task.setPriority(priority);
        Task updatedTask = taskRepository.save(task);
        return mapToDTO(updatedTask);
    }

    @Transactional
    public TaskDTO assignTaskToUser(Long taskId, Long userId) {
        return assignTaskToUser(taskId, userId, null);
    }

    @Transactional
    public TaskDTO assignTaskToUser(Long taskId, Long userId, String username) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Task với ID: " + taskId));

        String effectiveUsername = resolveUsername(username);
        if (effectiveUsername != null) {
            ProjectRole role = projectService.getUserRoleInProject(task.getProject().getId(), effectiveUsername);
            if (role != ProjectRole.OWNER && role != ProjectRole.ADMIN) {
                throw new BadRequestException("Thành viên (MEMBER) không có quyền gán hoặc bỏ gán người thực hiện!");
            }
        }

        if (userId == null) {
            task.setUser(null);
        } else {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy User với ID: " + userId));

            validateUserBelongsToProject(user, task.getProject());
            task.setUser(user);
        }

        Task updatedTask = taskRepository.save(task);
        return mapToDTO(updatedTask);
    }

    @Transactional
    public void deleteTask(Long id) {
        deleteTask(id, null);
    }

    @Transactional
    public void deleteTask(Long id, String username) {
        Task existingTask = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Task với ID: " + id));

        String effectiveUsername = resolveUsername(username);
        if (effectiveUsername != null) {
            ProjectRole role = projectService.getUserRoleInProject(existingTask.getProject().getId(), effectiveUsername);
            if (role != ProjectRole.OWNER && role != ProjectRole.ADMIN) {
                throw new BadRequestException("Thành viên (MEMBER) không có quyền xóa task!");
            }
        }

        taskRepository.delete(existingTask);
    }
}