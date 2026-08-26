import { apiClient } from './client';
import { AuthResponse, User } from '../types';

export const authApi = {
  register: async (data: { email: string; password: string; full_name?: string; currency_code?: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', data);
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },

  updateProfile: async (data: { full_name?: string; currency_code?: string }): Promise<User> => {
    const res = await apiClient.put<User>('/auth/me', data);
    return res.data;
  },

  changePassword: async (data: { current_password: string; new_password: string }): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>('/auth/change-password', data);
    return res.data;
  },
};
