"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import FloatingAIChat from "@/components/ai/FloatingAIChat";
import Link from "next/link";

const ADMIN_STATS = [
  { label: "Total MRR",          value: "$248.5K", trend: "+12.4%", icon: "payments",             color: "#3a388b", up: true },
  { label: "Active Workspaces",  value: "1,248",   trend: "+8.2%",  icon: "workspaces",           color: "#004c45", up: true },
  { label: "AI Tokens Used",     value: "1.2B",    trend: "+45.1%", icon: "smart_toy",            color: "#5250a4", up: true },
  { label: "Failed Deployments", value: "2",       trend: "-50%",   icon: "error",                color: "#9c0000", up: false }, // Down is good here, but visually let's keep it red for errors or green if improved.
];

const RECENT_ALERTS = [
  { id: 1, title: "High CPU usage on Redis", time: "10 mins ago", type: "warning" },
  { id: 2, title: "Failed login spike detected", time: "1 hour ago", type: "critical" },
  { id: 3, title: "New Enterprise customer onboarded", time: "2 hours ago", type: "info" },
];

export default function AdminDashboardPage() {
  return (
    <AppShell title="Admin Command Center">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-black text-[#131b2e]" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Platform Overview
            </h1>
            <p className="text-[#454652] mt-1 text-sm">
              Wordex Global Infrastructure and Revenue
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/deployment" className="px-5 py-2.5 bg-white border border-[#c5c5d4]/40 text-[#454652] text-sm font-bold rounded-xl hover:bg-[#f2f3ff] transition-all">
              View Deployments
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {ADMIN_STATS.map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-indigo-50 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl" style={{ background: stat.color + "18" }}>
                  <span className="material-symbols-outlined" style={{ color: stat.color }}>{stat.icon}</span>
                </div>
                <span className={`px-2 py-1 text-[10px] font-bold rounded-full flex items-center gap-1
                  ${stat.up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                  <span className="material-symbols-outlined text-[12px]">{stat.up ? "arrow_upward" : "arrow_downward"}</span>
                  {stat.trend}
                </span>
              </div>
              <p className="text-3xl font-black text-[#131b2e]">{stat.value}</p>
              <p className="text-xs text-[#454652] font-medium mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-indigo-50 shadow-sm p-6 flex flex-col">
             <h2 className="font-bold text-[#131b2e] mb-5" style={{ fontFamily: "'Manrope', sans-serif" }}>Quick Actions</h2>
             <div className="space-y-3 flex-1">
                <Link href="/admin/users" className="flex items-center gap-4 p-4 rounded-xl border border-[#c5c5d4]/30 hover:bg-[#f2f3ff] hover:border-[#3a388b]/30 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-[#eaedff] text-[#3a388b] flex items-center justify-center group-hover:bg-[#3a388b] group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined">group</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#131b2e]">Manage Users</p>
                    <p className="text-xs text-[#454652]">View and edit user roles</p>
                  </div>
                </Link>
                <Link href="/admin/audit" className="flex items-center gap-4 p-4 rounded-xl border border-[#c5c5d4]/30 hover:bg-[#f2f3ff] hover:border-[#3a388b]/30 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-[#eaedff] text-[#3a388b] flex items-center justify-center group-hover:bg-[#3a388b] group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined">policy</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#131b2e]">Security Logs</p>
                    <p className="text-xs text-[#454652]">Audit system events</p>
                  </div>
                </Link>
                <Link href="/admin/treasury" className="flex items-center gap-4 p-4 rounded-xl border border-[#c5c5d4]/30 hover:bg-[#f2f3ff] hover:border-[#3a388b]/30 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-[#eaedff] text-[#3a388b] flex items-center justify-center group-hover:bg-[#3a388b] group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined">account_balance</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#131b2e]">Treasury</p>
                    <p className="text-xs text-[#454652]">Manage platform revenue</p>
                  </div>
                </Link>
             </div>
          </div>

          {/* System Alerts */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-indigo-50 shadow-sm p-6">
            <h2 className="font-bold text-[#131b2e] mb-5" style={{ fontFamily: "'Manrope', sans-serif" }}>System Alerts</h2>
            <div className="space-y-4">
              {RECENT_ALERTS.map((alert) => (
                 <div key={alert.id} className="flex items-start gap-4 p-4 rounded-xl bg-[#f2f3ff] border border-indigo-50">
                    <div className={`p-2 rounded-lg flex-shrink-0
                      ${alert.type === "critical" ? "bg-red-100 text-red-600" : 
                        alert.type === "warning" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"}`}>
                        <span className="material-symbols-outlined text-[20px]">
                          {alert.type === "critical" ? "error" : alert.type === "warning" ? "warning" : "info"}
                        </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#131b2e]">{alert.title}</p>
                      <p className="text-xs text-[#454652] mt-0.5">{alert.time}</p>
                    </div>
                    <div className="flex gap-2">
                       {alert.type !== "info" && (
                         <button className="text-xs font-bold text-[#3a388b] hover:underline">Investigate</button>
                       )}
                       <button className="text-xs text-[#454652] hover:text-[#131b2e]">Dismiss</button>
                    </div>
                 </div>
              ))}
              <div className="pt-2">
                 <button className="text-sm font-bold text-[#3a388b] hover:underline flex items-center gap-1">
                   View All Alerts <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <FloatingAIChat defaultAgent="admin" />
    </AppShell>
  );
}
