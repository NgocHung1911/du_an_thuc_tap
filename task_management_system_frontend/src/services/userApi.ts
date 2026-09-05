import apiClient from './apiClient';
import { UserDTO } from './taskApi';

export interface UserRequest {
  username: string;
  password?: string;
  email: string;
  fullName?: string;
  role: 'ADMIN' | 'MEMBER';
}

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

  getAllUsers: async (): Promise<UserDTO[]> => {
    const res = await apiClient.get<UserDTO[]>('/users');
    return res.data;
  },

  createUser: async (data: UserRequest): Promise<UserDTO> => {
    const res = await apiClient.post<UserDTO>('/users', data);
    return res.data;
  },

  updateUser: async (id: number, data: UserRequest): Promise<UserDTO> => {
    const res = await apiClient.put<UserDTO>(`/users/${id}`, data);
    return res.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
