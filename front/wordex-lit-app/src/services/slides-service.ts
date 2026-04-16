import { apiFetch } from './api-client';

export const slidesService = {
  getSlides: async () => {
    const res = await apiFetch('/slides');
    return res.json();
  }
};
