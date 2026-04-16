import { apiFetch } from './api-client';

export interface Document {
  id: string;
  workspace_id: string;
  parent_id?: string;
  title: string;
  doc_type: 'note' | 'spreadsheet' | 'presentation' | 'file';
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  content?: any;
  content_text?: string;
}

export const documentService = {
  getDocuments: async (workspaceId: string): Promise<Document[]> => {
    const res = await apiFetch(`/documents/?workspace_id=${workspaceId}`);
    return res.json();
  },

  getRecent: async (limit: number = 10): Promise<Document[]> => {
    const res = await apiFetch(`/documents/recent?limit=${limit}`);
    return res.json();
  },

  getDocument: async (docId: string): Promise<Document> => {
    const res = await apiFetch(`/documents/${docId}`);
    return res.json();
  },

  createDocument: async (data: { workspace_id: string, title: string, doc_type: string, parent_id?: string }): Promise<Document> => {
    const res = await apiFetch('/documents/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateDocument: async (docId: string, data: Partial<Document>): Promise<Document> => {
    const res = await apiFetch(`/documents/${docId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteDocument: async (docId: string): Promise<void> => {
    await apiFetch(`/documents/${docId}`, {
      method: 'DELETE'
    });
  },

  getVersions: async (docId: string): Promise<any[]> => {
    const res = await apiFetch(`/documents/${docId}/versions`);
    return res.json();
  },

  restoreVersion: async (docId: string, versionId: string): Promise<Document> => {
    const res = await apiFetch(`/documents/${docId}/versions/${versionId}/restore`, {
      method: 'POST'
    });
    return res.json();
  }
};
