import { apiFetch } from './api-client';

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  description?: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  stripe_customer_id?: string;
  subscription_status?: string;
  member_count: number;
}

export const organisationService = {
  listOrganisations: async (): Promise<Organisation[]> => {
    const res = await apiFetch('/organisations/');
    return res.json();
  },

  getOrganisation: async (id: string): Promise<Organisation> => {
    const res = await apiFetch(`/organisations/${id}`);
    return res.json();
  },

  createOrganisation: async (data: { name: string, slug: string, description?: string }): Promise<Organisation> => {
    const res = await apiFetch('/organisations/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updatePlan: async (id: string, plan: string): Promise<any> => {
    const res = await apiFetch(`/organisations/${id}/plan?plan=${plan}`, {
      method: 'PATCH'
    });
    return res.json();
  }
};
