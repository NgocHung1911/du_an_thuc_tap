import apiClient from './apiClient';

export interface NotificationDTO {
  id: number;
  actor: {
    id: number;
    username: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    role?: string;
  } | null;
  type:
    | 'PROJECT_INVITE'
    | 'TASK_ASSIGNED'
    | 'REPORTER_ASSIGNED'
    | 'USER_MENTIONED'
    | 'COMMENT_ADDED'
    | 'TASK_STATUS_CHANGED'
    | 'TASK_PRIORITY_CHANGED'
    | 'TASK_UPDATED';
  title: string;
  message: string;
  projectId: number | null;
  taskId: number | null;
  isRead: boolean;
  createdAt: string;
}

export const notificationApi = {
  getNotifications: async (): Promise<NotificationDTO[]> => {
    const res = await apiClient.get('/notifications');
    return Array.isArray(res.data) ? res.data : [];
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient.get('/notifications/unread-count');
    if (typeof res.data === 'number') {
      return res.data;
    }
    if (res.data && typeof res.data.unreadCount === 'number') {
      return res.data.unreadCount;
    }
    return 0;
  },

  markAsRead: async (id: number): Promise<void> => {
    await apiClient.put(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.put('/notifications/read-all');
  },
};

export default notificationApi;
