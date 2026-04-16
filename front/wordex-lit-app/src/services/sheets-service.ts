import { apiFetch } from './api-client';

export interface SpreadsheetContent {
  cells: Record<string, any>;
  metadata: Record<string, any>;
}

export const sheetsService = {
  getSheet: async (id: string): Promise<SpreadsheetContent> => {
    const res = await apiFetch(`/sheets/${id}`);
    return res.json();
  },

  updateSheet: async (id: string, content: SpreadsheetContent): Promise<any> => {
    const res = await apiFetch(`/sheets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(content)
    });
    return res.json();
  }
};
