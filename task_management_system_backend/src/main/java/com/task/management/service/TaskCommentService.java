package com.task.management.service;

import com.task.management.dto.request.TaskCommentRequest;
import com.task.management.dto.response.TaskCommentAttachmentDTO;
import com.task.management.dto.response.TaskCommentDTO;
import com.task.management.dto.response.UserDTO;
import com.task.management.entity.Project;
import com.task.management.entity.Task;
import com.task.management.entity.TaskComment;
import com.task.management.entity.TaskCommentAttachment;
import com.task.management.entity.User;
import com.task.management.enums.ProjectRole;
import com.task.management.enums.Role;
import com.task.management.exception.BadRequestException;
import com.task.management.exception.ResourceNotFoundException;
import com.task.management.repository.ProjectRepository;
import com.task.management.repository.TaskCommentRepository;
import com.task.management.repository.TaskRepository;
import com.task.management.repository.UserRepository;
import com.task.management.dto.websocket.WebSocketEventType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskCommentService {

    private final TaskCommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ProjectService projectService;
    private final CloudinaryService cloudinaryService;
    private final CloudflareR2Service cloudflareR2Service;
    private final SimpMessagingTemplate messagingTemplate;

    private String resolveUsername(String username) {
        if (username != null && !username.trim().isEmpty()) {
            return username.trim();
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return null;
    }

    private String resolveFullName(User user) {
        if (user == null) return null;
        if (user.getFullName() != null && !user.getFullName().isBlank()) {
            return user.getFullName();
        }
        return user.getUsername();
    }

    private UserDTO mapUserToDTO(User user) {
        if (user == null) return null;
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(resolveFullName(user))
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .build();
    }

    private TaskCommentDTO mapToDTO(TaskComment comment) {
        if (comment == null) return null;

        List<TaskCommentDTO> replyDTOs = (comment.getReplies() != null)
                ? comment.getReplies().stream().map(this::mapToDTO).collect(Collectors.toList())
                : new ArrayList<>();

        List<TaskCommentAttachmentDTO> attachmentDTOs = (comment.getAttachments() != null)
                ? comment.getAttachments().stream().map(att -> TaskCommentAttachmentDTO.builder()
                        .id(att.getId())
                        .fileName(att.getFileName())
                        .fileUrl(att.getAttachmentUrl())
                        .fileSize(att.getFileSize())
                        .fileType(att.getFileType())
                        .createdAt(att.getCreatedAt())
                        .build()).collect(Collectors.toList())
                : new ArrayList<>();

        return TaskCommentDTO.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .taskId(comment.getTask() != null ? comment.getTask().getId() : null)
                .user(mapUserToDTO(comment.getUser()))
                .parentId(comment.getParentComment() != null ? comment.getParentComment().getId() : null)
                .replies(replyDTOs)
                .attachments(attachmentDTOs)
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }

    private void validateUserBelongsToProject(User user, Project project) {
        if (user == null || project == null) return;
        if (user.getRole() == Role.ADMIN) return;
        boolean isMember = project.getMembers() != null &&
                project.getMembers().stream().anyMatch(m -> m.getUser() != null && m.getUser().getId().equals(user.getId()));
        boolean isOwner = project.getUser() != null && project.getUser().getId().equals(user.getId());
        if (!isMember && !isOwner) {
            throw new BadRequestException("User does not belong to this project!");
        }
    }

    private void publishCommentEvent(WebSocketEventType eventType, Task task, TaskCommentDTO commentDto) {
        if (messagingTemplate == null || task == null || commentDto == null) return;
        try {
            String actorUsername = resolveUsername(null);
            User actor = actorUsername != null ? userRepository.findByUsername(actorUsername).orElse(null) : null;
            String actorFullName = actor != null ? resolveFullName(actor) : actorUsername;

            Long projId = task.getProject() != null ? task.getProject().getId() : null;
            if (projId != null) {
                com.task.management.dto.websocket.WebSocketEvent<Object> wsEvent = com.task.management.dto.websocket.WebSocketEvent.builder()
                        .eventType(eventType)
                        .timestamp(System.currentTimeMillis())
                        .projectId(projId)
                        .taskId(task.getId())
                        .actorUsername(actorUsername)
                        .actorFullName(actorFullName)
                        .data(commentDto)
                        .build();

                String destination = "/topic/projects/" + projId;
                messagingTemplate.convertAndSend(destination, wsEvent);
                log.info("Broadcasted comment event {} to {}", eventType, destination);
            }
        } catch (Exception e) {
            log.error("Failed to broadcast comment event", e);
        }
    }

    @Transactional(readOnly = true)
    public List<TaskCommentDTO> getCommentsByTaskId(Long taskId) {
        return commentRepository.findByTaskIdAndParentCommentIsNullOrderByCreatedAtAsc(taskId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public TaskCommentDTO createComment(Long taskId, TaskCommentRequest request, List<MultipartFile> files, String username) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        String effectiveUsername = resolveUsername(username);
        if (effectiveUsername == null) {
            throw new BadRequestException("Unauthorized user action.");
        }

        User author = userRepository.findByUsername(effectiveUsername)
                .orElseGet(() -> userRepository.findByEmail(effectiveUsername)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found: " + effectiveUsername)));

        validateUserBelongsToProject(author, task.getProject());

        TaskComment parentComment = null;
        if (request.getParentId() != null) {
            parentComment = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent comment not found with ID: " + request.getParentId()));
            if (!parentComment.getTask().getId().equals(taskId)) {
                throw new BadRequestException("Parent comment does not belong to this task!");
            }
        }

        TaskComment comment = TaskComment.builder()
                .content(request.getContent())
                .task(task)
                .user(author)
                .parentComment(parentComment)
                .attachments(new ArrayList<>())
                .replies(new ArrayList<>())
                .build();

        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;
                String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "attachment";
                Long fileSize = file.getSize();
                String contentType = file.getContentType();

                String fileUrl;
                if (contentType != null && contentType.toLowerCase().startsWith("image/")) {
                    fileUrl = cloudinaryService.uploadAvatar(file, author.getId());
                } else {
                    fileUrl = cloudflareR2Service.uploadFile(file, "comment-attachments");
                }

                comment.getAttachments().add(new TaskCommentAttachment(
                        originalFilename,
                        fileUrl,
                        fileSize,
                        contentType,
                        comment
                ));
            }
        }

        TaskComment savedComment = commentRepository.save(comment);
        TaskCommentDTO commentDTO = mapToDTO(savedComment);
        publishCommentEvent(WebSocketEventType.COMMENT_CREATED, task, commentDTO);
        return commentDTO;
    }

    @Transactional
    public TaskCommentDTO updateComment(Long commentId, TaskCommentRequest request, String username) {
        TaskComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with ID: " + commentId));

        String effectiveUsername = resolveUsername(username);
        User currentUser = userRepository.findByUsername(effectiveUsername)
                .orElseGet(() -> userRepository.findByEmail(effectiveUsername).orElse(null));

        if (currentUser == null) {
            throw new BadRequestException("Unauthorized action.");
        }

        boolean isAuthor = comment.getUser() != null && comment.getUser().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        if (!isAuthor && !isAdmin) {
            throw new BadRequestException("You do not have permission to edit this comment!");
        }

        comment.setContent(request.getContent());
        TaskComment updatedComment = commentRepository.save(comment);
        TaskCommentDTO dto = mapToDTO(updatedComment);
        publishCommentEvent(WebSocketEventType.COMMENT_UPDATED, comment.getTask(), dto);
        return dto;
    }

    @Transactional
    public void deleteComment(Long commentId, String username) {
        TaskComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with ID: " + commentId));

        String effectiveUsername = resolveUsername(username);
        User currentUser = userRepository.findByUsername(effectiveUsername)
                .orElseGet(() -> userRepository.findByEmail(effectiveUsername).orElse(null));

        if (currentUser == null) {
            throw new BadRequestException("Unauthorized action.");
        }

        boolean isAuthor = comment.getUser() != null && comment.getUser().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        ProjectRole projectRole = projectService.getUserRoleInProject(comment.getTask().getProject().getId(), effectiveUsername);
        boolean isOwnerOrAdmin = projectRole == ProjectRole.OWNER || projectRole == ProjectRole.ADMIN;

        if (!isAuthor && !isAdmin && !isOwnerOrAdmin) {
            throw new BadRequestException("You do not have permission to delete this comment!");
        }

        Task task = comment.getTask();
        TaskCommentDTO dto = mapToDTO(comment);
        commentRepository.delete(comment);
        publishCommentEvent(WebSocketEventType.COMMENT_DELETED, task, dto);
    }
}
