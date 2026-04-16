import { apiFetch } from './api-client';

export const analyticsService = {
  getOverview: async () => {
    const res = await apiFetch('/analytics/overview');
    return res.json();
  }
};
