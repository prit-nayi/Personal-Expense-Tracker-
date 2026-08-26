import { apiClient } from './client';
import { PaginatedTransactions, Transaction, TransactionType } from '../types';

export interface TransactionFilterParams {
  start_date?: string;
  end_date?: string;
  account_id?: string;
  category_id?: string;
  type?: TransactionType;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: string;
}

export const transactionsApi = {
  getAll: async (params: TransactionFilterParams = {}): Promise<PaginatedTransactions> => {
    const res = await apiClient.get<PaginatedTransactions>('/transactions', { params });
    return res.data;
  },

  getById: async (id: string): Promise<Transaction> => {
    const res = await apiClient.get<Transaction>(`/transactions/${id}`);
    return res.data;
  },

  create: async (data: {
    account_id: string;
    destination_account_id?: string | null;
    category_id?: string | null;
    type: TransactionType;
    amount: number;
    currency?: string;
    occurred_at: string;
    description: string;
    notes?: string | null;
    tags?: string | null;
  }): Promise<Transaction> => {
    const res = await apiClient.post<Transaction>('/transactions', data);
    return res.data;
  },

  update: async (
    id: string,
    data: {
      account_id?: string;
      destination_account_id?: string | null;
      category_id?: string | null;
      type?: TransactionType;
      amount?: number;
      currency?: string;
      occurred_at?: string;
      description?: string;
      notes?: string | null;
      tags?: string | null;
    }
  ): Promise<Transaction> => {
    const res = await apiClient.put<Transaction>(`/transactions/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/transactions/${id}`);
    return res.data;
  },

  exportCsvUrl: (params: TransactionFilterParams = {}): string => {
    const query = new URLSearchParams();
    if (params.start_date) query.append('start_date', params.start_date);
    if (params.end_date) query.append('end_date', params.end_date);
    if (params.account_id) query.append('account_id', params.account_id);
    if (params.category_id) query.append('category_id', params.category_id);
    if (params.type) query.append('type', params.type);
    return `${apiClient.defaults.baseURL}/exports/transactions/csv?${query.toString()}`;
  },
};
