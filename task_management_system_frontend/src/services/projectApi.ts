import apiClient from './apiClient';

export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';

export interface ProjectDTO {
  id: number;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: ProjectStatus;
  taskCount?: number;
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

export const projectApi = {
  getAllProjects: async (params?: { search?: string; status?: ProjectStatus | string }): Promise<ProjectDTO[]> => {
    const queryParams: Record<string, string> = {};
    if (params?.search && params.search.trim()) {
      queryParams.search = params.search.trim();
    }
    if (params?.status && params.status !== 'ALL') {
      queryParams.status = params.status;
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
};
