import { apiFetch } from './api-client';

export const analyticsService = {
  getAnalytics: async (workspaceId: string) => {
    const res = await apiFetch(`/analytics/${workspaceId}`);
    return res.json();
  },
  getVariables: async (workspaceId: string) => {
    const res = await apiFetch(`/analytics/${workspaceId}/variables`);
    return res.json();
  }
};
