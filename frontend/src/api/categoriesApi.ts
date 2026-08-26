import { apiClient } from './client';
import { Category, CategoryType } from '../types';

export const categoriesApi = {
  getAll: async (type?: CategoryType, includeArchived: boolean = false): Promise<Category[]> => {
    const res = await apiClient.get<Category[]>('/categories', {
      params: { type, include_archived: includeArchived },
    });
    return res.data;
  },

  create: async (data: {
    name: string;
    type: CategoryType;
    icon?: string;
    color?: string;
  }): Promise<Category> => {
    const res = await apiClient.post<Category>('/categories', data);
    return res.data;
  },

  update: async (
    id: string,
    data: {
      name?: string;
      icon?: string;
      color?: string;
      is_archived?: boolean;
    }
  ): Promise<Category> => {
    const res = await apiClient.put<Category>(`/categories/${id}`, data);
    return res.data;
  },

  deleteOrArchive: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/categories/${id}`);
    return res.data;
  },
};
