CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL AUTO_INCREMENT, username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL, email VARCHAR(100) NOT NULL,
    full_name VARCHAR(255), google_id VARCHAR(255), is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    avatar_url VARCHAR(255), role VARCHAR(255) NOT NULL, PRIMARY KEY (id),
    UNIQUE KEY uk_users_username (username), UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS projects (
    id BIGINT NOT NULL AUTO_INCREMENT, name VARCHAR(100) NOT NULL, description TEXT,
    start_date DATE NOT NULL, end_date DATE NOT NULL, status VARCHAR(50) NOT NULL,
    user_id BIGINT, created_at DATETIME(6), updated_at DATETIME(6), PRIMARY KEY (id),
    CONSTRAINT fk_projects_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tasks (
    id BIGINT NOT NULL AUTO_INCREMENT, title VARCHAR(150) NOT NULL, description TEXT,
    deadline DATE NOT NULL, priority VARCHAR(20) NOT NULL, status VARCHAR(20) NOT NULL,
    project_id BIGINT NOT NULL, user_id BIGINT, reporter_id BIGINT,
    created_at DATETIME(6), updated_at DATETIME(6), PRIMARY KEY (id),
    CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_tasks_reporter FOREIGN KEY (reporter_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS project_members (
    id BIGINT NOT NULL AUTO_INCREMENT, project_id BIGINT NOT NULL, user_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL, created_at DATETIME(6), updated_at DATETIME(6), PRIMARY KEY (id),
    UNIQUE KEY uk_project_members_project_user (project_id, user_id),
    CONSTRAINT fk_project_members_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_project_members_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS task_attachments (
    id BIGINT NOT NULL AUTO_INCREMENT, file_name VARCHAR(255) NOT NULL,
    attachment_url VARCHAR(1000) NOT NULL, file_size BIGINT, file_type VARCHAR(100),
    created_at DATETIME(6), task_id BIGINT NOT NULL, PRIMARY KEY (id),
    CONSTRAINT fk_task_attachments_task FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS task_comments (
    id BIGINT NOT NULL AUTO_INCREMENT, content TEXT NOT NULL, task_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL, parent_id BIGINT, created_at DATETIME(6), updated_at DATETIME(6), PRIMARY KEY (id),
    CONSTRAINT fk_task_comments_task FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
    CONSTRAINT fk_task_comments_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_task_comments_parent FOREIGN KEY (parent_id) REFERENCES task_comments (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS task_comment_attachments (
    id BIGINT NOT NULL AUTO_INCREMENT, file_name VARCHAR(255) NOT NULL,
    attachment_url VARCHAR(1000) NOT NULL, file_size BIGINT, file_type VARCHAR(100),
    created_at DATETIME(6), comment_id BIGINT NOT NULL, PRIMARY KEY (id),
    CONSTRAINT fk_comment_attachments_comment FOREIGN KEY (comment_id) REFERENCES task_comments (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS project_invitations (
    id BIGINT NOT NULL AUTO_INCREMENT, email VARCHAR(100) NOT NULL, token VARCHAR(100) NOT NULL,
    project_id BIGINT NOT NULL, status VARCHAR(20) NOT NULL, created_at DATETIME(6), expires_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id), UNIQUE KEY uk_project_invitations_token (token),
    CONSTRAINT fk_project_invitations_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT NOT NULL AUTO_INCREMENT, recipient_id BIGINT NOT NULL, actor_id BIGINT,
    type VARCHAR(50) NOT NULL, title VARCHAR(255) NOT NULL, message TEXT, project_id BIGINT, task_id BIGINT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE, created_at DATETIME(6), PRIMARY KEY (id),
    CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_actor FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS otp_tokens (
    id BIGINT NOT NULL AUTO_INCREMENT, email VARCHAR(100) NOT NULL, otp_code VARCHAR(6) NOT NULL,
    expiry_time DATETIME(6) NOT NULL, is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL, PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
