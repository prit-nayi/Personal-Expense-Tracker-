import { apiClient } from './client';
import { Budget } from '../types';

export const budgetsApi = {
  getAll: async (month?: string): Promise<Budget[]> => {
    const res = await apiClient.get<Budget[]>('/budgets', {
      params: { month },
    });
    return res.data;
  },

  create: async (data: {
    category_id: string;
    amount: number;
    currency?: string;
    month: string;
  }): Promise<Budget> => {
    const res = await apiClient.post<Budget>('/budgets', data);
    return res.data;
  },

  update: async (
    id: string,
    data: {
      amount?: number;
    }
  ): Promise<Budget> => {
    const res = await apiClient.put<Budget>(`/budgets/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/budgets/${id}`);
    return res.data;
  },
};
