import apiClient from './apiClient';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  email: string;
  role?: 'ADMIN' | 'MEMBER';
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  username: string;
  email: string;
  roles: string[];
}

export const authApi = {
  login: async (data: LoginPayload): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', data);
    return res.data;
  },

  register: async (data: RegisterPayload): Promise<{ message: string; username?: string }> => {
    const res = await apiClient.post<{ message: string; username?: string }>('/auth/register', data);
    return res.data;
  },

  googleLogin: async (idToken: string): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/google', { idToken });
    return res.data;
  },
};
