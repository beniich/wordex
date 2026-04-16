import { apiFetch } from './api-client';

export interface SearchResult {
  id: string;
  title: string;
  doc_type: string;
  excerpt?: string;
  created_by: string;
  updated_at: string;
  rank: number;
  result_type: 'document' | 'file';
}

export interface SearchResponse {
  query: string;
  total: number;
  results: SearchResult[];
}

export const searchService = {
  search: async (workspaceId: string, query: string, docType?: string, authorId?: string): Promise<SearchResponse> => {
    let url = `/search/?workspace_id=${workspaceId}&q=${encodeURIComponent(query)}`;
    if (docType) url += `&doc_type=${docType}`;
    if (authorId) url += `&author_id=${authorId}`;
    
    const res = await apiFetch(url);
    return res.json();
  },

  getRecent: async (workspaceId: string, limit: number = 10): Promise<any[]> => {
    const res = await apiFetch(`/search/recent?workspace_id=${workspaceId}&limit=${limit}`);
    return res.json();
  }
};
