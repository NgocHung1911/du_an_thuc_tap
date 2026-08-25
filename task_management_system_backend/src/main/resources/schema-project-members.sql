-- SQL Script to manually create project_members join table if Hibernate ddl-auto does not create it automatically.
-- Run this query in VS Code MySQL Extension, DBeaver, MySQL Workbench, or Aiven MySQL Console.

CREATE TABLE IF NOT EXISTS project_members (
    project_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    PRIMARY KEY (project_id, user_id),
    CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
