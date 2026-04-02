"use client";

import AppShell from "@/components/layout/AppShell";
import FloatingAIChat from "@/components/ai/FloatingAIChat";

const USAGE_DATA = [
  { label: "Storage Capacity", used: 1.2, total: 5, unit: "TB", color: "#3a388b", detail: "Active files, backups, and templates." },
  { label: "AI Tokens", used: 250, total: 500, unit: "k", color: "#004c45", detail: "Words generated or processed by Ollama." },
  { label: "API Requests", used: 45, total: 100, unit: "k", color: "#5250a4", detail: "Calls to wordex endpoints." },
  { label: "Bandwidth Out", used: 8.4, total: 200, unit: "GB", color: "#9c0000", detail: "Data transferred via public sharing links." }
];

export default function QuotasPage() {
  return (
    <AppShell title="Resource Quotas">
      <div className="p-8 max-w-5xl mx-auto space-y-10">
         
         <div className="flex items-end justify-between pb-6 border-b border-indigo-50">
            <div>
               <h1 className="text-3xl font-black text-[#131b2e]" style={{ fontFamily: "'Manrope', sans-serif" }}>
                 Plan Usage & Quotas
               </h1>
               <p className="text-[#454652] text-sm mt-1">Review your current plan limits (Wordex Pro)</p>
            </div>
            <button className="px-5 py-2.5 bg-[#89f5e7] text-[#003d37] font-black uppercase text-xs rounded-xl hover:bg-[#72decb] transition-all flex items-center gap-1 shadow-sm">
               <span className="material-symbols-outlined text-[16px]">bolt</span>
               Upgrade Plan
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {USAGE_DATA.map(quota => {
               const percentage = Math.round((quota.used / quota.total) * 100);
               const isWarning = percentage > 85;

               return (
                 <div key={quota.label} className="bg-white rounded-2xl border border-indigo-50 shadow-sm p-6 relative overflow-hidden group">
                    {/* Background Progress effect */}
                    <div className="absolute top-0 left-0 bottom-0 bg-[#f2f3ff] transition-all duration-700 ease-in-out opacity-20"
                         style={{ width: `${percentage}%`, background: quota.color }} />
                    
                    <div className="relative z-10">
                       <div className="flex items-start justify-between mb-4">
                          <div>
                             <h2 className="text-lg font-black text-[#131b2e] leading-tight flex items-center gap-2">
                               {quota.label}
                               {isWarning && <span className="material-symbols-outlined text-amber-500 text-[18px]">warning</span>}
                             </h2>
                             <p className="text-xs text-[#454652]">{quota.detail}</p>
                          </div>
                       </div>
                       
                       <div className="flex items-end gap-1 mb-2">
                          <span className="text-4xl font-black" style={{ color: isWarning ? "#d97706" : quota.color }}>
                            {quota.used}
                          </span>
                          <span className="text-sm font-bold text-[#454652] pb-1">/ {quota.total} {quota.unit}</span>
                       </div>

                       <div className="h-2.5 w-full bg-[#eaedff] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-1000 ${isWarning ? "bg-amber-500 animate-pulse" : ""}`}
                               style={{ width: `${percentage}%`, background: !isWarning ? quota.color : undefined }} />
                       </div>
                       <p className="text-[10px] font-black mt-2 text-right" style={{ color: isWarning ? "#d97706" : "#454652" }}>
                          {percentage}% Used
                       </p>
                    </div>
                 </div>
               );
            })}
         </div>

         {/* Usage History Chart (Mock) */}
         <div className="bg-white rounded-2xl border border-indigo-50 shadow-sm p-8">
            <h2 className="text-lg font-bold text-[#131b2e] mb-6" style={{ fontFamily: "'Manrope', sans-serif" }}>API Traffic (Last 7 Days)</h2>
            <div className="flex items-end justify-between h-40 gap-2 px-4">
               {[12, 18, 15, 24, 30, 22, 16].map((val, i) => (
                  <div key={i} className="flex-1 bg-[#eaedff] hover:bg-[#3a388b] transition-colors rounded-t-lg relative group cursor-pointer"
                       style={{ height: `${(val / 30) * 100}%` }}>
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#131b2e] text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none">
                         {val}k reqs
                      </span>
                  </div>
               ))}
            </div>
            <div className="flex items-center justify-between text-xs text-[#454652] font-semibold uppercase mt-3 px-4">
               <span>Mon</span>
               <span>Tue</span>
               <span>Wed</span>
               <span>Thu</span>
               <span>Fri</span>
               <span>Sat</span>
               <span>Sun</span>
            </div>
         </div>
      </div>
      <FloatingAIChat defaultAgent="admin" />
    </AppShell>
  );
}
