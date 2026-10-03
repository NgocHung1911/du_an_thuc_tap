# AGENTS.md

## 1. Project Overview

This repository is a monorepo named `du_an_thuc_tap` containing two independent applications:

- `task_management_system_backend`
- `task_management_system_frontend`

The system is a project/task management application with authentication, project membership, tasks, comments, notifications, invitations, file uploads, and realtime updates.

---

# 2. IMPORTANT AGENT WORKFLOW

These rules are mandatory for every task.

## 2.1 Analyze Before Coding

Before modifying code:

1. Understand the user's requested behavior.
2. Identify the smallest set of files/modules related to the task.
3. Inspect existing implementation before creating new code.
4. Identify the root cause or current implementation.
5. Determine the required changes.
6. Only then implement.

For non-trivial tasks, briefly report:

- Root cause / current behavior
- Relevant files
- Proposed solution
- Potential side effects

Do not start changing code immediately when analysis is required.

---

## 2.2 Scope Control

Always keep the scope as small as possible.

- Do NOT scan the entire repository unless necessary.
- Do NOT modify unrelated files.
- Do NOT refactor working code without a clear reason.
- Do NOT rewrite existing implementations just for style.
- Do NOT create new files if an existing file can be extended appropriately.
- Do NOT introduce new dependencies unless necessary.
- Do NOT change database schema unless required by the task.
- Do NOT change API contracts unless required.
- Do NOT change authentication/authorization behavior outside the requested scope.
- Do NOT remove existing functionality.
- Do NOT modify generated files or dependency directories.

If the requested feature already exists partially, extend the existing implementation instead of creating a duplicate implementation.

---

## 2.3 Preserve Existing Architecture

Prefer existing:

- classes
- services
- repositories
- DTOs
- utilities
- hooks
- contexts
- API clients
- WebSocket services
- exception handlers
- authorization helpers
- enums
- translation keys

Do not introduce another implementation when an equivalent existing implementation can be reused.

---

# 3. PROJECT ARCHITECTURE

## 3.1 Backend

Backend is a Spring Boot REST API.

Main class:

`com.task.management.TaskManagementSystemApplication`

Default development URL:

`http://localhost:8080`

Main backend layers:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Database