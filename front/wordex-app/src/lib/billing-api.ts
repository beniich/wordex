/**
 * billing-api.ts — Stripe billing & multi-tenant organisations API
 * Uses the same base URL + auth token as api.ts
 */

const rawBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API_BASE = rawBase.endsWith("/api") ? rawBase : `${rawBase}/api`;

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("wordex_access_token");
}

async function billingFetch<T>(path: string, options: RequestInit = {}, requireAuth = true): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (requireAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(String((err as Record<string, unknown>)?.detail ?? "API Error"));
  }
  return res.status === 204 ? (null as T) : res.json();
}

// ── Billing & Stripe ──────────────────────────────────────────────────────────

export interface BillingPlan {
  id: string;
  name: string;
  price_monthly: number;
  currency: string;
  features: string[];
  limits: { users: number; workspaces: number; documents: number };
  highlighted?: boolean;
  stripe_price_id: string | null;
}

export const billing = {
  getPlans: () =>
    billingFetch<{ plans: BillingPlan[] }>("/billing/plans", {}, false),

  createCheckout: (plan: string, org_id: string, org_name: string) =>
    billingFetch<{ url: string; session_id: string; dev_mode?: boolean }>(
      "/billing/create-checkout-session",
      { method: "POST", body: JSON.stringify({ plan, org_id, org_name }) }
    ),

  createPortal: (stripe_customer_id: string) =>
    billingFetch<{ url: string; dev_mode?: boolean }>(
      "/billing/create-portal-session",
      { method: "POST", body: JSON.stringify({ stripe_customer_id }) }
    ),
};

// ── Organisations (Multi-tenant) ──────────────────────────────────────────────

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  description?: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  stripe_customer_id?: string;
  subscription_status?: string;
  member_count: number;
  mrr?: number;
}

export const organisations = {
  list: () => billingFetch<Organisation[]>("/organisations/"),
  get: (id: string) => billingFetch<Organisation>(`/organisations/${id}`),
  create: (name: string, slug: string, description?: string) =>
    billingFetch<Organisation>("/organisations/", {
      method: "POST",
      body: JSON.stringify({ name, slug, description }),
    }),
  updatePlan: (id: string, plan: string) =>
    billingFetch<{ id: string; plan: string; updated: boolean }>(
      `/organisations/${id}/plan?plan=${plan}`,
      { method: "PATCH" }
    ),
};
