package com.task.management.controller;

import com.task.management.dto.request.TaskCommentRequest;
import com.task.management.dto.response.TaskCommentDTO;
import com.task.management.service.TaskCommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskCommentController {

    private final TaskCommentService commentService;

    // GET /api/tasks/{taskId}/comments
    @GetMapping("/{taskId}/comments")
    public ResponseEntity<List<TaskCommentDTO>> getCommentsByTaskId(@PathVariable Long taskId) {
        return ResponseEntity.ok(commentService.getCommentsByTaskId(taskId));
    }

    // POST /api/tasks/{taskId}/comments
    @PostMapping("/{taskId}/comments")
    public ResponseEntity<TaskCommentDTO> createComment(
            @PathVariable Long taskId,
            @RequestParam("content") String content,
            @RequestParam(value = "parentId", required = false) Long parentId,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            Principal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        TaskCommentRequest request = TaskCommentRequest.builder()
                .content(content)
                .parentId(parentId)
                .build();
        TaskCommentDTO createdComment = commentService.createComment(taskId, request, files, principal.getName());
        return new ResponseEntity<>(createdComment, HttpStatus.CREATED);
    }

    // PUT /api/tasks/comments/{commentId}
    @PutMapping("/comments/{commentId}")
    public ResponseEntity<TaskCommentDTO> updateComment(
            @PathVariable Long commentId,
            @Valid @RequestBody TaskCommentRequest request,
            Principal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        TaskCommentDTO updatedComment = commentService.updateComment(commentId, request, principal.getName());
        return ResponseEntity.ok(updatedComment);
    }

    // DELETE /api/tasks/comments/{commentId}
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<String> deleteComment(
            @PathVariable Long commentId,
            Principal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        commentService.deleteComment(commentId, principal.getName());
        return ResponseEntity.ok("Comment deleted successfully.");
    }
}
