import { apiFetch } from './api-client';

export const ganttService = {
  getTasks: async (documentId: string) => {
    const res = await apiFetch(`/gantt/${documentId}`);
    return res.json();
  }
};
