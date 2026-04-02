"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import FloatingAIChat from "@/components/ai/FloatingAIChat";

const INVOICES = [
  { id: "INV-2025-1042", client: "Acme Corp",   date: "Mar 28, 2025", amount: "$14,500.00", status: "Paid",   env: "production" },
  { id: "INV-2025-1043", client: "Stark Ind.",  date: "Mar 29, 2025", amount: "$3,200.00",  status: "Paid",   env: "production" },
  { id: "INV-2025-1044", client: "Wayne Ent.",  date: "Mar 29, 2025", amount: "$28,000.00", status: "Pending",env: "production" },
  { id: "INV-2025-1045", client: "Ollivanders", date: "Mar 30, 2025", amount: "$8,400.00",  status: "Overdue",env: "production" },
  { id: "INV-2025-1046", client: "Cyberdyne",   date: "Apr 01, 2025", amount: "$1,200.00",  status: "Draft",  env: "staging" },
];

export default function TreasuryPage() {
  const [filter, setFilter] = useState("All");

  const displayed = INVOICES.filter(inv => filter === "All" || inv.status === filter);

  return (
    <AppShell title="Treasury Management">
      <div className="p-6 md:p-10 max-w-[1200px] mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#d8c3b4]/30">
          <div>
            <h1 className="text-4xl font-black text-[#1c1c1a] tracking-tight" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Treasury Overview
            </h1>
            <p className="text-[#524439] text-xs mt-2 font-medium">Manage global billing and revenue operations</p>
          </div>
          <div className="flex gap-3">
             <button className="flex items-center gap-2 px-5 py-2.5 border border-[#d8c3b4]/40 bg-white/40 backdrop-blur-sm text-[#1c1c1a] font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-white/80 transition-all shadow-sm">
               <span className="material-symbols-outlined text-[18px]">file_download</span>
               Export Ledger
             </button>
             <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-tr from-[#894d0d] to-[#a76526] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-[0_8px_20px_rgba(137,77,13,0.3)]">
               <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
               New Invoice
             </button>
          </div>
        </div>

        {/* Global Financials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* Total Collected */}
           <div className="bg-white/70 backdrop-blur-2xl rounded-[1.5rem] border border-[#d8c3b4]/30 shadow-[0_12px_25px_rgba(137,77,13,0.04)] p-8 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 bg-[#006576]/10 blur-2xl transition-colors duration-700"></div>
              <div className="relative z-10">
                 <p className="text-[10px] font-black text-[#006576] uppercase tracking-widest mb-2">Total Collected</p>
                 <p className="text-3xl font-black text-[#1c1c1a]">$1,245,600</p>
                 <p className="text-xs text-[#524439] font-medium mt-1">Year to Date (2025)</p>
              </div>
              <div className="absolute right-[-10px] bottom-[-10px] opacity-5 group-hover:scale-110 transition-transform duration-500">
                 <span className="material-symbols-outlined text-[100px] text-[#006576]">account_balance</span>
              </div>
           </div>
           
           {/* Pending */}
           <div className="bg-white/70 backdrop-blur-2xl rounded-[1.5rem] border border-[#d8c3b4]/30 shadow-[0_12px_25px_rgba(137,77,13,0.04)] p-8 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 bg-[#894d0d]/10 blur-2xl transition-colors duration-700"></div>
              <div className="relative z-10">
                 <p className="text-[10px] font-black text-[#894d0d] uppercase tracking-widest mb-2">Pending Invoices</p>
                 <p className="text-3xl font-black text-[#1c1c1a]">$36,400</p>
                 <p className="text-xs text-[#524439] font-medium mt-1">Awaiting Payment</p>
              </div>
              <div className="absolute right-[-10px] bottom-[-10px] opacity-5 group-hover:scale-110 transition-transform duration-500">
                 <span className="material-symbols-outlined text-[100px] text-[#894d0d]">pending_actions</span>
              </div>
           </div>

           {/* Overdue */}
           <div className="bg-white/70 backdrop-blur-2xl rounded-[1.5rem] border border-[#d8c3b4]/30 shadow-[0_12px_25px_rgba(137,77,13,0.04)] p-8 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 bg-red-500/10 blur-2xl transition-colors duration-700"></div>
              <div className="relative z-10">
                 <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2">Overdue Amount</p>
                 <p className="text-3xl font-black text-[#1c1c1a]">$8,400</p>
                 <p className="text-xs text-[#524439] font-medium mt-1">Requires follow-up</p>
              </div>
              <div className="absolute right-[-10px] bottom-[-10px] opacity-5 group-hover:scale-110 transition-transform duration-500">
                 <span className="material-symbols-outlined text-[100px] text-red-500">warning</span>
              </div>
           </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {["All", "Paid", "Pending", "Overdue", "Draft"].map((status) => (
             <button
               key={status}
               onClick={() => setFilter(status)}
               className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all
                  ${filter === status 
                    ? "bg-[#894d0d] text-white shadow-md shadow-[#894d0d]/20" 
                    : "bg-white/40 text-[#524439] border border-[#d8c3b4]/40 hover:bg-white/80"}`}
             >
                {status}
             </button>
          ))}
        </div>

        {/* Invoice Table */}
        <div className="bg-white/70 backdrop-blur-2xl rounded-[2rem] border border-[#d8c3b4]/30 shadow-[0_12px_25px_rgba(137,77,13,0.03)] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-[#524439] font-black bg-[#f0ede9]/50 border-b border-[#d8c3b4]/30">
                <th className="px-6 py-5">Invoice ID</th>
                <th className="px-6 py-5">Client</th>
                <th className="px-6 py-5">Total Amount</th>
                <th className="px-6 py-5">Date Issued</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d8c3b4]/20">
              {displayed.map((inv) => (
                 <tr key={inv.id} className="hover:bg-orange-50/40 transition-colors group">
                    <td className="px-6 py-5">
                       <code className="text-xs font-bold text-[#894d0d] bg-white/50 px-2 py-1 rounded-md border border-[#d8c3b4]/20">{inv.id}</code>
                    </td>
                    <td className="px-6 py-5">
                       <p className="text-sm font-black text-[#1c1c1a]">{inv.client}</p>
                       <p className="text-[10px] text-[#524439] uppercase tracking-wider mt-0.5">{inv.env}</p>
                    </td>
                    <td className="px-6 py-5">
                       <p className="text-sm font-black text-[#1c1c1a]">{inv.amount}</p>
                    </td>
                    <td className="px-6 py-5 text-xs font-medium text-[#524439]">{inv.date}</td>
                    <td className="px-6 py-5">
                       <span className={`px-2.5 py-1 text-[9px] font-black tracking-widest rounded-lg uppercase
                          ${inv.status === "Paid" ? "bg-[#006576]/10 text-[#006576] border border-[#006576]/20" :
                            inv.status === "Pending" ? "bg-[#894d0d]/10 text-[#894d0d] border border-[#894d0d]/20" :
                            inv.status === "Overdue" ? "bg-red-50 text-red-600 border border-red-100" :
                            "bg-stone-100 text-stone-500 border border-stone-200"}`}>
                          {inv.status}
                       </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 hover:bg-white rounded-lg text-[#524439] hover:text-[#894d0d] transition-colors border border-transparent hover:border-[#d8c3b4]/40" title="View Detail">
                             <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <button className="p-2 hover:bg-[#006576]/10 rounded-lg text-[#006576] transition-colors border border-transparent hover:border-[#006576]/20" title="Resend">
                             <span className="material-symbols-outlined text-[18px]">send</span>
                          </button>
                       </div>
                    </td>
                 </tr>
              ))}
            </tbody>
          </table>
          {displayed.length === 0 && (
             <div className="text-center py-20 text-[#524439]">
                <span className="material-symbols-outlined text-[48px] block mb-3 opacity-30 text-[#894d0d]">receipt_long</span>
                <p className="font-bold text-sm tracking-wide">No invoices found for this status</p>
             </div>
          )}
        </div>

      </div>
      <FloatingAIChat defaultAgent="analyst" />
    </AppShell>
  );
}
