"use client";
import { useState } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  limits: { users: number; workspaces: number; documents: number };
  highlighted: boolean;
  badge?: string;
}

// ── Static plan data (mirrored from backend /api/billing/plans) ───────────────

const PLANS: Plan[] = [
  {
    id: "FREE",
    name: "Starter",
    price: 0,
    currency: "€",
    features: ["3 utilisateurs max", "1 workspace", "5 documents", "Support communauté"],
    limits: { users: 3, workspaces: 1, documents: 5 },
    highlighted: false,
  },
  {
    id: "PRO",
    name: "Pro Clinique",
    price: 49,
    currency: "€",
    features: [
      "25 utilisateurs",
      "Workspaces illimités",
      "Documents illimités",
      "AI Agents (Ollama + GPT-4)",
      "Export PDF / PPTX / DOCX",
      "Support prioritaire 48h",
      "Historique versions illimité",
    ],
    limits: { users: 25, workspaces: -1, documents: -1 },
    highlighted: true,
    badge: "Recommandé",
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: 199,
    currency: "€",
    features: [
      "Utilisateurs illimités",
      "Multi-sites / Multi-organes",
      "SSO / SAML",
      "Audit logs & conformité RGPD",
      "SLA garanti 99.9%",
      "Support dédié 24/7",
      "Onboarding & formation inclus",
      "API privée + webhooks",
    ],
    limits: { users: -1, workspaces: -1, documents: -1 },
    highlighted: false,
  },
];

// ── Checkout handler ──────────────────────────────────────────────────────────

async function startCheckout(planId: string) {
  if (planId === "FREE") return;
  try {
    const res = await fetch("/api/billing-proxy/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planId, org_id: "current-org", org_name: "Ma Clinique" }),
    });
    if (!res.ok) throw new Error("Checkout failed");
    const { url } = await res.json();
    if (url) window.location.href = url;
  } catch {
    // Dev fallback — show alert
    alert(`[DEV] Stripe non configuré. Plan sélectionné: ${planId}\nAjoutez STRIPE_SECRET_KEY dans .env pour activer.`);
  }
}

// ── Plan card ─────────────────────────────────────────────────────────────────

function PlanCard({ plan, current }: { plan: Plan; current: string }) {
  const isCurrent = plan.id === current;
  const isHighlighted = plan.highlighted;

  return (
    <div
      className={`relative flex flex-col rounded-3xl p-8 transition-all duration-500
        ${isHighlighted
          ? "bg-[#1c1c1a] text-white shadow-2xl shadow-[#894d0d]/30 scale-[1.03]"
          : "bg-white/70 backdrop-blur-xl border border-[#d8c3b4]/30 text-[#1c1c1a] hover:shadow-xl"
        }`}
    >
      {/* Badge */}
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#894d0d] to-[#a76526] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
          ✦ {plan.badge}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${isHighlighted ? "text-[#a76526]" : "text-[#894d0d]"}`}>
          {plan.id}
        </div>
        <h3 className={`text-2xl font-black tracking-tight mb-1 ${isHighlighted ? "text-white" : "text-[#1c1c1a]"}`}>
          {plan.name}
        </h3>
        <div className="flex items-end gap-1 mt-4">
          <span className={`text-5xl font-black ${isHighlighted ? "text-white" : "text-[#894d0d]"}`}>
            {plan.price === 0 ? "Gratuit" : `${plan.price}${plan.currency}`}
          </span>
          {plan.price > 0 && (
            <span className={`text-sm font-medium pb-2 ${isHighlighted ? "text-stone-400" : "text-[#857467]"}`}>/mois</span>
          )}
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-3 flex-1 mb-8">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm font-medium">
            <span className={`mt-0.5 text-lg leading-none ${isHighlighted ? "text-[#894d0d]" : "text-emerald-500"}`}>✓</span>
            <span className={isHighlighted ? "text-stone-300" : "text-[#524439]"}>{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {isCurrent ? (
        <div className={`text-center py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest ${isHighlighted ? "bg-white/10 text-stone-400" : "bg-[#f0ede9] text-[#857467]"}`}>
          Plan actuel
        </div>
      ) : (
        <button
          id={`plan-cta-${plan.id}`}
          onClick={() => startCheckout(plan.id)}
          className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98]
            ${plan.price === 0
              ? "bg-[#f0ede9] text-[#524439] hover:bg-[#e5e2de]"
              : isHighlighted
              ? "bg-gradient-to-r from-[#894d0d] to-[#a76526] text-white shadow-lg shadow-[#894d0d]/40 hover:shadow-xl"
              : "bg-[#1c1c1a] text-white hover:bg-[#31302e]"
            }`}
        >
          {plan.price === 0 ? "Rester sur Free" : `Passer au ${plan.name}`}
        </button>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const [currentPlan] = useState("FREE"); // In production: fetch from org context

  return (
    <div className="min-h-screen bg-[#fcf9f5] font-[Manrope,sans-serif] text-[#1c1c1a]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#fcf9f5]/90 backdrop-blur-2xl border-b border-[#d8c3b4]/30 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings" className="h-8 w-8 rounded-xl bg-[#f0ede9] flex items-center justify-center hover:bg-[#e5e2de] transition-colors">
            <span className="material-symbols-outlined text-[#894d0d] text-lg">arrow_back</span>
          </Link>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#857467]">Abonnement</div>
            <h1 className="text-lg font-black tracking-tight">Plans & Facturation</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-stone-100 text-stone-600 border border-stone-200 rounded-xl">
            Plan actuel: {currentPlan}
          </span>
          <button
            id="billing-portal-btn"
            className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-white border border-[#d8c3b4]/50 text-[#524439] rounded-xl hover:bg-[#f0ede9] transition-colors"
            onClick={() => alert("[DEV] Portail Stripe: configurez STRIPE_SECRET_KEY")}
          >
            Gérer la facturation →
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-16">
        {/* Title */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#ffdcc2] text-[#6d3a00] rounded-full text-[10px] font-black tracking-[0.2em] uppercase">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#894d0d] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#894d0d]"></span>
            </span>
            Sans engagement — Annulez à tout moment
          </div>
          <h2 className="text-5xl font-black tracking-tighter">Choisissez votre plan</h2>
          <p className="text-[#524439] text-lg font-medium max-w-xl mx-auto leading-relaxed">
            Conçu pour les cliniques et les équipes médicales. Commencez gratuitement, évoluez sans friction.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mb-20">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} current={currentPlan} />
          ))}
        </div>

        {/* FAQ / Guarantees strip */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: "lock", title: "Paiement 100% sécurisé", desc: "via Stripe. Aucune donnée bancaire stockée sur nos serveurs." },
            { icon: "cancel", title: "Annulation simple", desc: "Résiliez en 1 clic depuis le portail client Stripe, sans justification." },
            { icon: "support_agent", title: "Support dédié Pro+", desc: "Un expert Wordex disponible sous 48h pour les cliniques Pro." },
          ].map((g) => (
            <div key={g.title} className="flex items-start gap-4 bg-white/60 backdrop-blur-lg border border-[#d8c3b4]/20 rounded-2xl p-6">
              <div className="h-10 w-10 bg-[#f0ede9] rounded-xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#894d0d]">{g.icon}</span>
              </div>
              <div>
                <div className="font-black text-sm mb-1">{g.title}</div>
                <div className="text-xs text-[#524439] font-medium leading-relaxed">{g.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
