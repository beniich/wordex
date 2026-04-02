"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import FloatingAIChat from "@/components/ai/FloatingAIChat";

const USERS = [
  { id: "1", name: "Alex Rivera", email: "alex@wordex.io", plan: "Enterprise", status: "Active", joined: "Jan 12, 2024", storage: "4.1TB" },
  { id: "2", name: "Sarah J.",    email: "sarah@design.co", plan: "Team",     status: "Active", joined: "Feb 05, 2024", storage: "850GB" },
  { id: "3", name: "Mike T.",     email: "mike@studio.dev", plan: "Pro",      status: "Suspended",joined: "Mar 18, 2024", storage: "120GB" },
  { id: "4", name: "Lila M.",     email: "lila@brand.agency", plan: "Team",    status: "Active", joined: "Apr 22, 2024", storage: "95GB" },
  { id: "5", name: "Chen W.",     email: "chen@tech.net",   plan: "Pro",      status: "Active", joined: "May 10, 2024", storage: "2.1TB" },
];

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const displayed = USERS
    .filter((u) => filter === "All" || u.plan === filter || u.status === filter)
    .filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell title="User Management">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-[#131b2e]" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Global Users
            </h1>
            <p className="text-[#454652] text-sm mt-1">Manage platform-wide user accounts and quotas</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#3a388b] text-white font-bold text-sm rounded-xl hover:bg-[#2d2c78] transition-all">
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Add User
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-3 bg-[#f2f3ff] border border-[#c5c5d4]/40 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#3a388b]/20"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-3 bg-[#f2f3ff] border border-[#c5c5d4]/40 rounded-xl text-sm font-bold text-[#3a388b] outline-none"
          >
            <option value="All">All Users</option>
            <option value="Enterprise">Enterprise</option>
            <option value="Team">Team</option>
            <option value="Pro">Pro</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        {/* User Table */}
        <div className="bg-white rounded-2xl border border-indigo-50 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-[#454652] font-bold bg-[#f2f3ff] border-b border-indigo-50">
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Storage Used</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50">
              {displayed.map((user) => (
                <tr key={user.id} className="hover:bg-[#faf8ff] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#3a388b] text-white flex items-center justify-center font-bold text-sm">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#131b2e]">{user.name}</p>
                        <p className="text-xs text-[#454652]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-[#eaedff] text-[#3a388b] rounded-full text-[10px] font-bold uppercase">
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-[#454652]">{user.storage}</td>
                  <td className="px-6 py-4 text-sm font-medium text-[#454652]">{user.joined}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase
                      ${user.status === "Active" ? "bg-[#89f5e7] text-[#003d37]" : "bg-red-50 text-red-600"}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-[#f2f3ff] rounded-lg text-[#3a388b]" title="Edit Details">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button className="p-2 hover:bg-red-50 rounded-lg text-red-500" title={user.status === "Active" ? "Suspend" : "Activate"}>
                        <span className="material-symbols-outlined text-[18px]">{user.status === "Active" ? "block" : "check_circle"}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
      <FloatingAIChat defaultAgent="admin" />
    </AppShell>
  );
}
