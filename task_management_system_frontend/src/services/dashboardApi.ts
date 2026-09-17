import apiClient from './apiClient';
import { TaskDTO } from './taskApi';
import { ProjectDTO } from './projectApi';

export interface AdminDashboardStatsDTO {
  totalTasks: number;
  doneTasks: number;
  doingTasks: number;
  reviewTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  taskCompletionRate: number;

  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  planningProjects: number;
  onHoldProjects: number;

  totalUsers: number;
  adminUsers: number;
  memberUsers: number;

  recentTasks: TaskDTO[];
  recentProjects: ProjectDTO[];
}

export const dashboardApi = {
  getAdminStats: async (): Promise<AdminDashboardStatsDTO> => {
    const res = await apiClient.get<AdminDashboardStatsDTO>('/dashboard/admin-stats');
    return res.data;
  },
};

export default dashboardApi;
