package com.task.management.controller;

import com.task.management.dto.request.TaskRequest;
import com.task.management.dto.response.TaskDTO;
import com.task.management.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<List<TaskDTO>> getAllTasks() {
        return ResponseEntity.ok(taskService.getAllTasks());
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<TaskDTO>> getTasksByProjectId(@PathVariable Long projectId) {
        return ResponseEntity.ok(taskService.getTasksByProjectId(projectId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskDTO> getTaskById(@PathVariable Long id) {
        return ResponseEntity.ok(taskService.getTaskById(id));
    }

    @PostMapping
    public ResponseEntity<TaskDTO> createTask(
            @Valid @RequestBody TaskRequest request,
            Principal principal) {
        String username = principal != null ? principal.getName() : null;
        TaskDTO createdTask = taskService.createTask(request, username);
        return new ResponseEntity<>(createdTask, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskDTO> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody TaskRequest request,
            Principal principal) {
        String username = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(taskService.updateTask(id, request, username));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskDTO> updateTaskStatus(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body,
            Principal principal) {
        String statusStr = body.get("status");
        if (statusStr == null || statusStr.trim().isEmpty()) {
            throw new IllegalArgumentException("Trạng thái (status) không được để trống");
        }
        String username = principal != null ? principal.getName() : null;
        com.task.management.enums.TaskStatus status = com.task.management.enums.TaskStatus.valueOf(statusStr.trim().toUpperCase());
        return ResponseEntity.ok(taskService.updateTaskStatus(id, status, username));
    }

    @PatchMapping("/{id}/priority")
    public ResponseEntity<TaskDTO> updateTaskPriority(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body,
            Principal principal) {
        String priorityStr = body.get("priority");
        if (priorityStr == null || priorityStr.trim().isEmpty()) {
            throw new IllegalArgumentException("Mức độ ưu tiên (priority) không được để trống");
        }
        String username = principal != null ? principal.getName() : null;
        com.task.management.enums.TaskPriority priority = com.task.management.enums.TaskPriority.valueOf(priorityStr.trim().toUpperCase());
        return ResponseEntity.ok(taskService.updateTaskPriority(id, priority, username));
    }

    @PutMapping({"/{taskId}/assign/{userId}", "/{taskId}/assign"})
    public ResponseEntity<TaskDTO> assignTaskToUser(
            @PathVariable Long taskId,
            @PathVariable(required = false) Long userId,
            @RequestParam(required = false) Long userIdParam,
            Principal principal) {
        Long targetUserId = userId != null ? userId : userIdParam;
        String username = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(taskService.assignTaskToUser(taskId, targetUserId, username));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteTask(@PathVariable Long id, Principal principal) {
        String username = principal != null ? principal.getName() : null;
        taskService.deleteTask(id, username);
        return ResponseEntity.ok("Xóa Task thành công với ID: " + id);
    }
}