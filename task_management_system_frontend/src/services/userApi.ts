import apiClient from './apiClient';
import { UserDTO } from './taskApi';

export const userApi = {
  getCurrentUser: async (): Promise<UserDTO> => {
    try {
      const res = await apiClient.get<UserDTO>('/users/me');
      return res.data;
    } catch {
      const savedUserStr = localStorage.getItem('user');
      const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
      return {
        id: 1,
        username: savedUser?.username || 'Member',
        email: savedUser?.email || '',
        fullName: savedUser?.fullName || savedUser?.username || 'Member',
      };
    }
  },
};
