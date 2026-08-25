import apiClient from './apiClient';
import { ProjectDTO } from './projectApi';

export type TaskStatus = 'TODO' | 'DOING' | 'REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface UserDTO {
  id: number;
  username: string;
  email: string;
  role?: string;
  projectRole?: 'OWNER' | 'ADMIN' | 'MEMBER';
  initials?: string;
  avatarBg?: string;
}

export interface TaskDTO {
  id: number;
  title: string;
  description?: string;
  deadline?: string;
  priority: TaskPriority;
  status: TaskStatus;
  project?: ProjectDTO;
  assignedUser?: UserDTO;
  projectId?: number;
  projectName?: string;
  userId?: number;
  userFullName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskRequest {
  title: string;
  description?: string;
  deadline?: string;
  priority: TaskPriority;
  status: TaskStatus;
  projectId?: number;
  userId?: number | null;
  assignedUserId?: number | null;
}

export const taskApi = {
  getAllTasks: async (): Promise<TaskDTO[]> => {
    const res = await apiClient.get<TaskDTO[]>('/tasks');
    return res.data;
  },

  getTasksByProjectId: async (projectId: number): Promise<TaskDTO[]> => {
    try {
      const res = await apiClient.get<TaskDTO[]>(`/tasks/project/${projectId}`);
      return res.data;
    } catch {
      // Fallback: fetch all tasks and filter client side
      const res = await apiClient.get<TaskDTO[]>('/tasks');
      return res.data.filter((task) => task.project?.id === projectId);
    }
  },

  getTaskById: async (id: number): Promise<TaskDTO> => {
    const res = await apiClient.get<TaskDTO>(`/tasks/${id}`);
    return res.data;
  },

  createTask: async (data: TaskRequest): Promise<TaskDTO> => {
    const res = await apiClient.post<TaskDTO>('/tasks', data);
    return res.data;
  },

  updateTask: async (id: number, data: TaskRequest): Promise<TaskDTO> => {
    const res = await apiClient.put<TaskDTO>(`/tasks/${id}`, data);
    return res.data;
  },

  updateTaskStatus: async (id: number, status: TaskStatus): Promise<TaskDTO> => {
    const res = await apiClient.patch<TaskDTO>(`/tasks/${id}/status`, { status });
    return res.data;
  },

  updateTaskPriority: async (id: number, priority: TaskPriority): Promise<TaskDTO> => {
    try {
      const res = await apiClient.patch<TaskDTO>(`/tasks/${id}/priority`, { priority });
      return res.data;
    } catch {
      return { id, priority } as TaskDTO;
    }
  },

  assignTaskToUser: async (taskId: number, userId: number | null): Promise<TaskDTO> => {
    if (userId !== null && userId !== undefined) {
      const res = await apiClient.put<TaskDTO>(`/tasks/${taskId}/assign/${userId}`);
      return res.data;
    } else {
      const res = await apiClient.put<TaskDTO>(`/tasks/${taskId}/assign`);
      return res.data;
    }
  },

  deleteTask: async (id: number): Promise<string> => {
    const res = await apiClient.delete<string>(`/tasks/${id}`);
    return res.data;
  },
};
