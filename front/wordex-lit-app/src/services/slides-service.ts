import { apiFetch } from './api-client';

export interface Slide {
  id: string;
  title: string;
  content: string;
  speakerNotes?: string;
  layout?: string;
  visualType?: string;
}

export interface Presentation {
  title: string;
  theme: string;
  slides: Slide[];
  estimated_duration?: number;
}

export const slidesService = {
  getPresentation: async (id: string): Promise<Presentation> => {
    const res = await apiFetch(`/slides/${id}`);
    return res.json();
  },

  updatePresentation: async (id: string, data: Partial<Presentation>): Promise<any> => {
    const res = await apiFetch(`/slides/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return res.json();
  },

  generateFromAI: async (id: string, topic: string, n_slides: number = 8): Promise<any> => {
    const res = await apiFetch(`/slides/${id}/generate-from-ai`, {
      method: 'POST',
      body: JSON.stringify({ topic, n_slides })
    });
    return res.json();
  },

  generateFromDoc: async (id: string, sourceDocId: string, n_slides: number = 10): Promise<any> => {
    const res = await apiFetch(`/slides/${id}/generate-from-doc`, {
      method: 'POST',
      body: JSON.stringify({ source_doc_id: sourceDocId, n_slides })
    });
    return res.json();
  },

  exportPPTX: async (id: string, title: string): Promise<void> => {
    const res = await apiFetch(`/slides/${id}/export-pptx`);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.pptx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};
