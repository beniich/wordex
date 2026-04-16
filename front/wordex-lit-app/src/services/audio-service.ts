import { apiFetch } from './api-client';

export const audioService = {
  getTranscripts: async () => {
    const res = await apiFetch('/audio/transcripts');
    return res.json();
  }
};
