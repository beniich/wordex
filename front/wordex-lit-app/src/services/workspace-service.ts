import { apiFetch } from './api-client';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  owner_id: string;
}

class WorkspaceService {
  async getWorkspaces(): Promise<Workspace[]> {
    const res = await apiFetch('/workspaces');
    if (!res.ok) throw new Error('Erreur récupération workspaces');
    return res.json();
  }

  async getWorkspace(id: string): Promise<Workspace> {
    const res = await apiFetch(`/workspaces/${id}`);
    if (!res.ok) throw new Error('Erreur récupération du workspace');
    return res.json();
  }
}

export const workspaceService = new WorkspaceService();
