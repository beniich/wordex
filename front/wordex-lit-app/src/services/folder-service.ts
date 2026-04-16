import { apiFetch } from './api-client';

export interface Folder {
  id: string;
  workspace_id: string;
  name: string;
  parent_id?: string;
  created_by: string;
  created_at: string;
}

export interface TreeData {
  folders: any[];
  documents: any[];
}

export const folderService = {
  getTree: async (workspaceId: string): Promise<TreeData> => {
    const res = await apiFetch(`/folders/tree?workspace_id=${workspaceId}`);
    return res.json();
  },

  createFolder: async (data: { workspace_id: string, name: string, parent_id?: string }): Promise<Folder> => {
    const res = await apiFetch('/folders/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.json();
  },

  renameFolder: async (folderId: string, name: string): Promise<any> => {
    const res = await apiFetch(`/folders/${folderId}/rename`, {
      method: 'PATCH',
      body: JSON.stringify({ name })
    });
    return res.json();
  },

  moveFolder: async (folderId: string, targetParentId?: string): Promise<void> => {
    await apiFetch(`/folders/${folderId}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ target_parent_id: targetParentId })
    });
  },

  moveDocument: async (docId: string, targetParentId?: string): Promise<void> => {
    await apiFetch(`/folders/documents/${docId}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ target_parent_id: targetParentId })
    });
  },

  deleteFolder: async (folderId: string): Promise<void> => {
    await apiFetch(`/folders/${folderId}`, {
      method: 'DELETE'
    });
  },

  getBreadcrumb: async (folderId: string): Promise<any[]> => {
    const res = await apiFetch(`/folders/${folderId}/breadcrumb`);
    return res.json();
  }
};
