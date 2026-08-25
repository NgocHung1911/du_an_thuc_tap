package com.task.management.controller;

import com.task.management.dto.request.InviteMemberRequestDTO;
import com.task.management.dto.request.ProjectRequest;
import com.task.management.dto.request.UpdateMemberRoleRequestDTO;
import com.task.management.dto.response.ProjectDTO;
import com.task.management.dto.response.UserDTO;
import com.task.management.enums.ProjectStatus;
import com.task.management.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<List<ProjectDTO>> getAllProjects(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ProjectStatus status,
            @RequestParam(required = false, defaultValue = "false") boolean all,
            Principal principal) {
        String username = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(projectService.getAllProjects(username, search, status, all));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectDTO> getProjectById(@PathVariable Long id, Principal principal) {
        String username = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(projectService.getProjectById(id, username));
    }

    @PostMapping
    public ResponseEntity<ProjectDTO> createProject(
            @Valid @RequestBody ProjectRequest request,
            Principal principal) {
        String username = principal != null ? principal.getName() : null;
        ProjectDTO createdProject = projectService.createProject(request, username);
        return new ResponseEntity<>(createdProject, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectDTO> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody ProjectRequest request,
            Principal principal) {
        String username = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(projectService.updateProject(id, request, username));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteProject(@PathVariable Long id, Principal principal) {
        String username = principal != null ? principal.getName() : null;
        projectService.deleteProject(id, username);
        return ResponseEntity.ok("Xóa dự án thành công với ID: " + id);
    }

    // --- PROJECT MEMBERS API ---

    @PostMapping("/{projectId}/members")
    public ResponseEntity<UserDTO> addMemberToProject(
            @PathVariable Long projectId,
            @Valid @RequestBody InviteMemberRequestDTO request,
            Principal principal) {
        String username = principal != null ? principal.getName() : null;
        UserDTO addedUser = projectService.addMemberToProject(projectId, request, username);
        return new ResponseEntity<>(addedUser, HttpStatus.CREATED);
    }

    @GetMapping("/{projectId}/members")
    public ResponseEntity<List<UserDTO>> getProjectMembers(
            @PathVariable Long projectId,
            Principal principal) {
        String username = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(projectService.getProjectMembers(projectId, username));
    }

    @PatchMapping("/{projectId}/members/{userId}/role")
    public ResponseEntity<UserDTO> updateMemberRole(
            @PathVariable Long projectId,
            @PathVariable Long userId,
            @Valid @RequestBody UpdateMemberRoleRequestDTO request,
            Principal principal) {
        String username = principal != null ? principal.getName() : null;
        UserDTO updatedUser = projectService.updateMemberRole(projectId, userId, request.getRole(), username);
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/{projectId}/members/{userId}")
    public ResponseEntity<String> removeMemberFromProject(
            @PathVariable Long projectId,
            @PathVariable Long userId,
            Principal principal) {
        String username = principal != null ? principal.getName() : null;
        projectService.removeMemberFromProject(projectId, userId, username);
        return ResponseEntity.ok("Đã xóa thành viên khỏi dự án thành công.");
    }
}