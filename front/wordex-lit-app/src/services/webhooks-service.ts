import { apiFetch } from './api-client';

export const webhooksService = {
  getWebhooks: async () => {
    const res = await apiFetch('/webhooks');
    return res.json();
  }
};
