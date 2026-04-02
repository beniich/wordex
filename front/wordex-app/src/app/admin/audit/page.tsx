"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import FloatingAIChat from "@/components/ai/FloatingAIChat";

const AUDIT_LOGS = [
  { id: "1", user: "Alex R.",   action: "LOGIN",           resource: "Auth",           ip: "192.168.1.10", time: "Today 14:32", risk: "low"    },
  { id: "2", user: "Sarah J.",  action: "DOC_PUBLISH",     resource: "Terraform v3",   ip: "10.0.0.45",    time: "Today 13:15", risk: "low"    },
  { id: "3", user: "Unknown",   action: "LOGIN_FAILED",    resource: "Auth",           ip: "185.220.101.8",time: "Today 11:02", risk: "high"   },
  { id: "4", user: "Mike T.",   action: "KEY_REVOKE",      resource: "API Keys",       ip: "192.168.1.22", time: "Today 10:48", risk: "medium" },
  { id: "5", user: "Admin",     action: "USER_PROMOTE",    resource: "User: Chen W.",  ip: "10.0.0.1",     time: "Yesterday",   risk: "medium" },
  { id: "6", user: "Lila M.",   action: "EXPORT",          resource: "Budget_V3.xlsx", ip: "192.168.2.5",  time: "Yesterday",   risk: "low"    },
  { id: "7", user: "Unknown",   action: "BRUTE_FORCE",     resource: "Auth",           ip: "45.142.212.38",time: "2 days ago",  risk: "critical"},
  { id: "8", user: "Alex R.",   action: "SETTINGS_CHANGE", resource: "Workspace",      ip: "192.168.1.10", time: "2 days ago",  risk: "low"    },
];

const RISK_CONFIG = {
  low:      { color: "#16a34a", bg: "#f0fdf4", label: "Low"      },
  medium:   { color: "#d97706", bg: "#fffbeb", label: "Medium"   },
  high:     { color: "#dc2626", bg: "#fef2f2", label: "High"     },
  critical: { color: "#7c3aed", bg: "#faf5ff", label: "Critical" },
};

export default function AuditLogsPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const displayed = AUDIT_LOGS
    .filter((l) => filter === "all" || l.risk === filter)
    .filter((l) => l.user.toLowerCase().includes(search.toLowerCase()) || l.action.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell title="Audit Logs & Security">
      <div className="p-8 max-w-6xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-[#131b2e]" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Audit Logs
            </h1>
            <p className="text-[#454652] text-sm mt-1">Complete activity trail for compliance and security</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 border border-[#3a388b] text-[#3a388b] font-bold text-sm rounded-xl hover:bg-[#eaedff] transition-all">
            <span className="material-symbols-outlined text-[18px]">file_download</span>
            Export CSV
          </button>
        </div>

        {/* Risk summary */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {Object.entries(RISK_CONFIG).map(([risk, cfg]) => {
            const count = AUDIT_LOGS.filter((l) => l.risk === risk).length;
            return (
              <button
                key={risk}
                onClick={() => setFilter(filter === risk ? "all" : risk)}
                className={`p-5 rounded-2xl border text-left transition-all hover:shadow-md ${filter === risk ? "ring-2 ring-offset-1" : ""}`}
                style={{ background: cfg.bg, borderColor: cfg.color + "40", outlineColor: cfg.color }}
              >
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: cfg.color }}>{cfg.label}</p>
                <p className="text-3xl font-black mt-1" style={{ color: cfg.color }}>{count}</p>
                <p className="text-xs font-medium mt-1" style={{ color: cfg.color + "aa" }}>events</p>
              </button>
            );
          })}
        </div>

        {/* Search + Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user or action…"
              className="w-full pl-10 pr-4 py-3 bg-[#f2f3ff] border border-[#c5c5d4]/30 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3a388b]/20" />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-3 bg-[#f2f3ff] border border-[#c5c5d4]/30 rounded-xl text-sm font-bold text-[#3a388b] outline-none"
          >
            <option value="all">All Events</option>
            {Object.entries(RISK_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label} Risk</option>)}
          </select>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-2xl border border-indigo-50 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-[#454652] font-bold bg-[#f2f3ff] border-b border-indigo-50">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Resource</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50">
              {displayed.map((log) => {
                const risk = RISK_CONFIG[log.risk as keyof typeof RISK_CONFIG];
                return (
                  <tr key={log.id} className="hover:bg-[#faf8ff] transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-[#131b2e]">{log.user}</td>
                    <td className="px-6 py-4">
                      <code className="text-xs font-mono bg-[#f2f3ff] px-2 py-1 rounded text-[#3a388b] font-bold">{log.action}</code>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#454652]">{log.resource}</td>
                    <td className="px-6 py-4">
                      <code className="text-xs font-mono text-[#454652]">{log.ip}</code>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#454652]">{log.time}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-[10px] font-black rounded-full" style={{ background: risk.bg, color: risk.color }}>
                        {risk.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <FloatingAIChat defaultAgent="admin" />
    </AppShell>
  );
}
