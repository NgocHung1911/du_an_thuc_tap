import apiClient from './apiClient';
import { UserDTO } from './taskApi';

export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';

export interface ProjectDTO {
  id: number;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: ProjectStatus;
  taskCount?: number;
  members?: UserDTO[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectRequest {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status?: ProjectStatus;
}

export interface InviteMemberRequest {
  email: string;
}

export const projectApi = {
  getAllProjects: async (params?: { search?: string; status?: ProjectStatus | string; all?: boolean }): Promise<ProjectDTO[]> => {
    const queryParams: Record<string, string> = {};
    if (params?.search && params.search.trim()) {
      queryParams.search = params.search.trim();
    }
    if (params?.status && params.status !== 'ALL') {
      queryParams.status = params.status;
    }
    if (params?.all) {
      queryParams.all = 'true';
    }

    const res = await apiClient.get<ProjectDTO[]>('/projects', { params: queryParams });
    return res.data;
  },

  getProjectById: async (id: number): Promise<ProjectDTO> => {
    const res = await apiClient.get<ProjectDTO>(`/projects/${id}`);
    return res.data;
  },

  createProject: async (data: ProjectRequest): Promise<ProjectDTO> => {
    const res = await apiClient.post<ProjectDTO>('/projects', data);
    return res.data;
  },

  updateProject: async (id: number, data: ProjectRequest): Promise<ProjectDTO> => {
    const res = await apiClient.put<ProjectDTO>(`/projects/${id}`, data);
    return res.data;
  },

  deleteProject: async (id: number): Promise<string> => {
    const res = await apiClient.delete<string>(`/projects/${id}`);
    return res.data;
  },

  // Invite member to project
  inviteMemberToProject: async (projectId: number, email: string): Promise<UserDTO> => {
    const res = await apiClient.post<UserDTO>(`/projects/${projectId}/members`, { email: email.trim() });
    return res.data;
  },

  // Get project members
  getProjectMembers: async (projectId: number): Promise<UserDTO[]> => {
    const res = await apiClient.get<UserDTO[]>(`/projects/${projectId}/members`);
    return res.data;
  },

  // Remove member from project
  removeMemberFromProject: async (projectId: number, userId: number): Promise<string> => {
    const res = await apiClient.delete<string>(`/projects/${projectId}/members/${userId}`);
    return res.data;
  },

  // Update member role in project
  updateMemberRole: async (projectId: number, userId: number, role: 'ADMIN' | 'MEMBER'): Promise<UserDTO> => {
    const res = await apiClient.patch<UserDTO>(`/projects/${projectId}/members/${userId}/role`, { role });
    return res.data;
  },
};
