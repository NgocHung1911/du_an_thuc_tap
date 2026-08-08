package com.task.management.service;

import com.task.management.dto.request.TaskRequest;
import com.task.management.dto.response.ProjectDTO;
import com.task.management.dto.response.TaskDTO;
import com.task.management.dto.response.UserDTO;
import com.task.management.entity.Project;
import com.task.management.entity.Task;
import com.task.management.entity.User;
import com.task.management.repository.ProjectRepository;
import com.task.management.repository.TaskRepository;
import com.task.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

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

    public List<TaskDTO> getAllTasks() {
        return taskRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<TaskDTO> getTasksByProjectId(Long projectId) {
        return taskRepository.findByProjectId(projectId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public TaskDTO getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Task với ID: " + id));
        return mapToDTO(task);
    }

    public TaskDTO createTask(TaskRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Project với ID: " + request.getProjectId()));

        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setDeadline(request.getDeadline());
        task.setPriority(request.getPriority());
        task.setStatus(request.getStatus());
        task.setProject(project);

        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy User với ID: " + request.getUserId()));
            task.setUser(user);
        }

        Task savedTask = taskRepository.save(task);
        return mapToDTO(savedTask);
    }

    public TaskDTO updateTask(Long id, TaskRequest request) {
        Task existingTask = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Task với ID: " + id));

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Project với ID: " + request.getProjectId()));

        existingTask.setTitle(request.getTitle());
        existingTask.setDescription(request.getDescription());
        existingTask.setDeadline(request.getDeadline());
        existingTask.setPriority(request.getPriority());
        existingTask.setStatus(request.getStatus());
        existingTask.setProject(project);

        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy User với ID: " + request.getUserId()));
            existingTask.setUser(user);
        } else {
            existingTask.setUser(null);
        }

        Task updatedTask = taskRepository.save(existingTask);
        return mapToDTO(updatedTask);
    }

    @org.springframework.transaction.annotation.Transactional
    public TaskDTO updateTaskStatus(Long id, com.task.management.enums.TaskStatus status) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Task với ID: " + id));
        task.setStatus(status);
        Task updatedTask = taskRepository.save(task);
        return mapToDTO(updatedTask);
    }

    @org.springframework.transaction.annotation.Transactional
    public TaskDTO updateTaskPriority(Long id, com.task.management.enums.TaskPriority priority) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Task với ID: " + id));
        task.setPriority(priority);
        Task updatedTask = taskRepository.save(task);
        return mapToDTO(updatedTask);
    }

    public TaskDTO assignTaskToUser(Long taskId, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Task với ID: " + taskId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy User với ID: " + userId));

        task.setUser(user);
        Task updatedTask = taskRepository.save(task);
        return mapToDTO(updatedTask);
    }

    public void deleteTask(Long id) {
        Task existingTask = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Task với ID: " + id));
        taskRepository.delete(existingTask);
    }
}