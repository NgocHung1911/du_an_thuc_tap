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

export interface VerifyOtpPayload {
  email: string;
  otpCode: string;
}

export const authApi = {
  login: async (data: LoginPayload): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', data);
    return res.data;
  },

  register: async (data: RegisterPayload): Promise<{ message: string; username?: string; email?: string; isVerified?: boolean }> => {
    const res = await apiClient.post<{ message: string; username?: string; email?: string; isVerified?: boolean }>('/auth/register', data);
    return res.data;
  },

  googleLogin: async (idToken: string): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/google', { idToken });
    return res.data;
  },

  verifyOtp: async (data: VerifyOtpPayload): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>('/auth/verify-otp', data);
    return res.data;
  },

  resendOtp: async (email: string): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>('/auth/resend-otp', { email });
    return res.data;
  },
};
