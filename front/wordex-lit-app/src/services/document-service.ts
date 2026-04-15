import { apiFetch } from './api-client';

export const documentService = {
  getDocuments: async () => {
    const res = await apiFetch('/documents');
    return res.json();
  }
};
