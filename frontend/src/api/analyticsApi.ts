import { apiClient } from './client';
import { AnalyticsData } from '../types';

export const analyticsApi = {
  getDashboardData: async (month?: string): Promise<AnalyticsData> => {
    const res = await apiClient.get<AnalyticsData>('/analytics/dashboard', {
      params: { month },
    });
    return res.data;
  },
};
