import { apiClient } from './client';
import { Account, AccountType } from '../types';

export const accountsApi = {
  getAll: async (includeArchived: boolean = false): Promise<Account[]> => {
    const res = await apiClient.get<Account[]>('/accounts', {
      params: { include_archived: includeArchived },
    });
    return res.data;
  },

  getById: async (id: string): Promise<Account> => {
    const res = await apiClient.get<Account>(`/accounts/${id}`);
    return res.data;
  },

  create: async (data: {
    name: string;
    type: AccountType;
    opening_balance: number;
    currency: string;
    description?: string;
  }): Promise<Account> => {
    const res = await apiClient.post<Account>('/accounts', data);
    return res.data;
  },

  update: async (
    id: string,
    data: {
      name?: string;
      type?: AccountType;
      currency?: string;
      description?: string;
      is_archived?: boolean;
    }
  ): Promise<Account> => {
    const res = await apiClient.put<Account>(`/accounts/${id}`, data);
    return res.data;
  },

  deleteOrArchive: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/accounts/${id}`);
    return res.data;
  },
};
