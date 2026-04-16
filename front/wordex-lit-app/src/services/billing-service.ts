import { apiFetch } from './api-client';

export const billingService = {
  getPlans: async () => {
    const res = await apiFetch('/billing/plans');
    return res.json();
  },
  
  createCheckoutSession: async (planId: string, orgId: string, orgName: string) => {
    const res = await apiFetch('/billing/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({
        plan: planId,
        org_id: orgId,
        org_name: orgName
      })
    });
    return res.json();
  },

  createPortalSession: async (stripeCustomerId: string) => {
    const res = await apiFetch('/billing/create-portal-session', {
      method: 'POST',
      body: JSON.stringify({
        stripe_customer_id: stripeCustomerId
      })
    });
    return res.json();
  }
};
