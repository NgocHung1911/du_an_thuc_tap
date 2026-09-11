-- SQL Script to manually create task_attachments table with primary key.
-- Compatible with Aiven MySQL sql_require_primary_key = ON setting.

CREATE TABLE IF NOT EXISTS task_attachments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_id BIGINT NOT NULL,
    attachment_url VARCHAR(1000) NOT NULL,
    CONSTRAINT fk_task_attachments_task FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
);
