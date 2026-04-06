"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────────────────

interface OrgStat {
  id: string;
  name: string;
  slug: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  subscription_status: string | null;
  member_count: number;
  mrr: number;
}

interface PlatformStats {
  total_orgs: number;
  paying_orgs: number;
  total_users: number;
  mrr: number;
  arr: number;
  churn_rate: number;
  growth_rate: number;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_ORGS: OrgStat[] = [
  { id: "org-1", name: "Clinique Alpha", slug: "clinique-alpha", plan: "PRO", subscription_status: "active", member_count: 12, mrr: 49 },
  { id: "org-2", name: "Centre Médical Omega", slug: "omega", plan: "ENTERPRISE", subscription_status: "active", member_count: 47, mrr: 199 },
  { id: "org-3", name: "Cabinet Bêta", slug: "cabinet-beta", plan: "FREE", subscription_status: null, member_count: 3, mrr: 0 },
  { id: "org-4", name: "Hôpital Sud", slug: "hopital-sud", plan: "PRO", subscription_status: "active", member_count: 19, mrr: 49 },
  { id: "org-5", name: "Labo Génomique Nord", slug: "labo-nord", plan: "PRO", subscription_status: "trialing", member_count: 8, mrr: 49 },
  { id: "org-6", name: "IRM Radiologie Paris", slug: "irm-paris", plan: "ENTERPRISE", subscription_status: "active", member_count: 63, mrr: 199 },
];

const MOCK_STATS: PlatformStats = {
  total_orgs: 6,
  paying_orgs: 5,
  total_users: 152,
  mrr: 545,
  arr: 6540,
  churn_rate: 1.4,
  growth_rate: 23.5,
};

// ── Plan badge ────────────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, string> = {
    FREE: "bg-stone-100 text-stone-600 border-stone-200",
    PRO: "bg-amber-50 text-amber-800 border-amber-200",
    ENTERPRISE: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-transparent",
  };
  return (
    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${styles[plan] ?? styles.FREE}`}>
      {plan}
    </span>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">—</span>;
  const styles: Record<string, string> = {
    active: "text-emerald-600",
    trialing: "text-blue-500",
    past_due: "text-red-500",
    canceled: "text-stone-400",
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider ${styles[status] ?? "text-stone-500"}`}>
      ● {status}
    </span>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function SuperAdminPage() {
  const [orgs, setOrgs] = useState<OrgStat[]>(MOCK_ORGS);
  const [stats] = useState<PlatformStats>(MOCK_STATS);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"orgs" | "metrics">("orgs");

  const filtered = orgs.filter((o) => {
    const matchSearch = o.name.toLowerCase().includes(search.toLowerCase()) || o.slug.includes(search.toLowerCase());
    const matchPlan = planFilter === "ALL" || o.plan === planFilter;
    return matchSearch && matchPlan;
  });

  const KpiCard = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
    <div className="bg-white/70 backdrop-blur-xl border border-[#d8c3b4]/30 rounded-2xl p-6 flex flex-col gap-2 hover:shadow-lg transition-shadow group">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#857467]">{label}</div>
      <div className={`text-3xl font-black tracking-tight ${color ?? "text-[#1c1c1a]"}`}>{value}</div>
      {sub && <div className="text-xs text-[#857467] font-medium">{sub}</div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcf9f5] font-[Manrope,sans-serif] text-[#1c1c1a]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#fcf9f5]/90 backdrop-blur-2xl border-b border-[#d8c3b4]/30 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="h-8 w-8 rounded-xl bg-[#f0ede9] flex items-center justify-center hover:bg-[#e5e2de] transition-colors">
            <span className="material-symbols-outlined text-[#894d0d] text-lg">arrow_back</span>
          </Link>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#857467]">Wordex Platform</div>
            <h1 className="text-lg font-black tracking-tight">Super Admin Console</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-xl">
            👑 SUPER_ADMIN
          </span>
          <Link href="/admin/billing" className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-[#894d0d] text-white rounded-xl hover:bg-[#a76526] transition-colors">
            Billing Portal
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10 space-y-10">
        {/* KPI Strip */}
        <section>
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#894d0d] mb-4">Platform Health</div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <KpiCard label="Organisations" value={String(stats.total_orgs)} color="text-[#894d0d]" />
            <KpiCard label="Paying" value={String(stats.paying_orgs)} sub="orgs actives" color="text-emerald-600" />
            <KpiCard label="Total Users" value={String(stats.total_users)} />
            <KpiCard label="MRR" value={`${stats.mrr}€`} sub="Monthly Recurring" color="text-emerald-600" />
            <KpiCard label="ARR" value={`${stats.arr.toLocaleString()}€`} color="text-[#006576]" />
            <KpiCard label="Churn" value={`${stats.churn_rate}%`} sub="mensuel" color="text-red-500" />
            <KpiCard label="Croissance" value={`+${stats.growth_rate}%`} sub="MoM" color="text-purple-600" />
          </div>
        </section>

        {/* Revenue Breakdown */}
        <section className="bg-white/70 backdrop-blur-xl border border-[#d8c3b4]/30 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#894d0d] mb-1">Revenue Breakdown</div>
              <h2 className="text-xl font-black tracking-tight">MRR par plan</h2>
            </div>
            <div className="text-3xl font-black text-emerald-600">{stats.mrr}€ <span className="text-sm text-stone-400 font-medium">/mois</span></div>
          </div>
          <div className="space-y-3">
            {[
              { plan: "ENTERPRISE", count: 2, mrr: 398, color: "bg-purple-500" },
              { plan: "PRO", count: 3, mrr: 147, color: "bg-[#894d0d]" },
              { plan: "FREE", count: 1, mrr: 0, color: "bg-stone-300" },
            ].map((row) => (
              <div key={row.plan} className="flex items-center gap-4">
                <div className="w-24 shrink-0"><PlanBadge plan={row.plan} /></div>
                <div className="flex-1 bg-[#f0ede9] rounded-full h-3 overflow-hidden">
                  <div className={`h-full ${row.color} rounded-full transition-all`} style={{ width: `${(row.mrr / stats.mrr) * 100}%` }} />
                </div>
                <div className="w-20 text-right text-sm font-black text-[#1c1c1a]">{row.mrr}€</div>
                <div className="w-16 text-right text-xs text-[#857467]">{row.count} org{row.count > 1 ? "s" : ""}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Organisations Table */}
        <section>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#894d0d] mb-1">Tenants</div>
              <h2 className="text-xl font-black tracking-tight">Toutes les organisations</h2>
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#857467] text-sm">search</span>
                <input
                  id="org-search"
                  type="text"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-[#d8c3b4]/50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#894d0d]/20 w-52"
                />
              </div>
              {/* Plan filter */}
              <select
                id="plan-filter"
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-[#d8c3b4]/50 rounded-xl text-sm font-medium outline-none"
              >
                <option value="ALL">Tous les plans</option>
                <option value="FREE">Free</option>
                <option value="PRO">Pro</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl border border-[#d8c3b4]/30 rounded-3xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#d8c3b4]/30">
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#857467]">Organisation</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#857467]">Plan</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#857467]">Statut</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#857467]">Membres</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#857467]">MRR</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#857467]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d8c3b4]/20">
                {filtered.map((org) => (
                  <tr key={org.id} className="hover:bg-[#fcf9f5]/70 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#1c1c1a]">{org.name}</div>
                      <div className="text-[10px] text-[#857467] font-mono mt-0.5">{org.slug}</div>
                    </td>
                    <td className="px-6 py-4"><PlanBadge plan={org.plan} /></td>
                    <td className="px-6 py-4"><StatusBadge status={org.subscription_status} /></td>
                    <td className="px-6 py-4">
                      <span className="font-bold">{org.member_count}</span>
                      <span className="text-[#857467] text-xs ml-1">users</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-black ${org.mrr > 0 ? "text-emerald-600" : "text-stone-400"}`}>
                        {org.mrr > 0 ? `${org.mrr}€` : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          id={`org-action-${org.id}`}
                          className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-[#f0ede9] text-[#894d0d] rounded-lg hover:bg-[#894d0d] hover:text-white transition-colors"
                          onClick={() => window.open(`/admin/billing?org=${org.id}`, "_self")}
                        >
                          Gérer
                        </button>
                        <button
                          className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-[#f0ede9] text-stone-600 rounded-lg hover:bg-stone-600 hover:text-white transition-colors"
                          onClick={() => alert(`Impersonate: ${org.name}`)}
                        >
                          👤
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-[#857467] font-medium">
                      Aucune organisation trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
