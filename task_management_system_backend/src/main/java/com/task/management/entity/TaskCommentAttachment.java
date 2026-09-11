package com.task.management.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "task_comment_attachments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskCommentAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "attachment_url", nullable = false, length = 1000)
    private String attachmentUrl;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "file_type", length = 100)
    private String fileType;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id", nullable = false)
    @JsonIgnore
    private TaskComment comment;

    public TaskCommentAttachment(String fileName, String attachmentUrl, Long fileSize, String fileType, TaskComment comment) {
        this.fileName = fileName;
        this.attachmentUrl = attachmentUrl;
        this.fileSize = fileSize;
        this.fileType = fileType;
        this.comment = comment;
    }
}
