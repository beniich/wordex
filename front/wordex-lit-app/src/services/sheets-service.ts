import { apiFetch } from './api-client';

export const sheetsService = {
  getSheets: async () => {
    const res = await apiFetch('/sheets');
    return res.json();
  }
};
