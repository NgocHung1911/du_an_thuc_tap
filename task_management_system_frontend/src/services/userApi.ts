import apiClient from './apiClient';
import { UserDTO } from './taskApi';

export const userApi = {
  getCurrentUser: async (): Promise<UserDTO> => {
    const res = await apiClient.get<UserDTO>('/users/me');
    return res.data;
  },
};
