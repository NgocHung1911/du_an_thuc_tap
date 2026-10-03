-- Indexes for tasks table
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);

-- Indexes for projects table
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at);

-- Indexes for notifications table
CREATE INDEX idx_notifications_recipient_read ON notifications(recipient_id, is_read, created_at);

-- Indexes for task comments table
CREATE INDEX idx_task_comments_task_created ON task_comments(task_id, created_at);
