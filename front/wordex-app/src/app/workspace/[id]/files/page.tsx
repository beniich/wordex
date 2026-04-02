"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import FloatingAIChat from "@/components/ai/FloatingAIChat";

const FILES = [
  { name: "Q3_Editorial_Strategy.pdf", type: "PDF",    size: "2.4 MB", date: "Oct 12, 2023", icon: "picture_as_pdf", iconBg: "rgba(137,77,13,0.1)", iconColor: "#894d0d" },
  { name: "header_banner_main.jpg",    type: "IMAGE",   size: "850 KB", date: "Oct 11, 2023", icon: "image",          iconBg: "rgba(113,87,60,0.1)", iconColor: "#79573c" },
  { name: "distribution_metrics.csv",  type: "CSV",     size: "12 KB",  date: "Oct 09, 2023", icon: "table_chart",    iconBg: "rgba(0,101,118,0.1)", iconColor: "#006576" },
  { name: "teaser_trailer_final.mp4",  type: "VIDEO",   size: "42.8 MB",date: "Oct 08, 2023", icon: "movie",          iconBg: "rgba(167,101,38,0.1)", iconColor: "#a76526" },
  { name: "brand_guidelines_v3.pdf",   type: "PDF",     size: "6.1 MB", date: "Oct 07, 2023", icon: "picture_as_pdf", iconBg: "rgba(137,77,13,0.1)", iconColor: "#894d0d" },
  { name: "analytics_dashboard.xlsx",  type: "SHEET",   size: "320 KB", date: "Oct 06, 2023", icon: "table_chart",    iconBg: "rgba(0,101,118,0.1)", iconColor: "#006576" },
  { name: "platform_architecture.fig", type: "DESIGN",  size: "15.2 MB",date: "Oct 05, 2023", icon: "palette",        iconBg: "rgba(113,87,60,0.1)", iconColor: "#79573c" },
  { name: "onboarding_flow.mp4",       type: "VIDEO",   size: "88 MB",  date: "Oct 04, 2023", icon: "movie",          iconBg: "rgba(167,101,38,0.1)", iconColor: "#a76526" },
];

const BUCKETS = [
  { name: "Documents", count: 24, color: "#894d0d" },
  { name: "Archives",  count: 8,  color: "#a76526" },
  { name: "Media",     count: 15, color: "#006576" },
  { name: "Other",     count: 6,  color: "#79573c" },
];

export default function FilesPage() {
  const [view, setView] = useState<"list" | "grid">("list");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  return (
    <AppShell title="Artifacts Explorer">
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#d8c3b4]/30">
          <div>
            <span className="text-[#894d0d] font-bold tracking-[0.2em] text-[10px] uppercase mb-2 block">
              Celestial Atelier Repository
            </span>
            <h1 className="text-4xl font-black text-[#1c1c1a] tracking-tight mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Artifacts Explorer
            </h1>
            <p className="text-[#524439] text-xs font-medium">Securely managing decentralized assets within the Aether ecosystem.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-3 rounded-xl bg-white/40 border border-[#d8c3b4]/30 text-[#524439] hover:bg-white/80 transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
            </button>
            <button className="p-3 rounded-xl bg-white/40 border border-[#d8c3b4]/30 text-[#524439] hover:bg-white/80 transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[18px]">sort</span>
            </button>
            <div className="h-10 w-[1px] bg-[#d8c3b4]/30 mx-2"></div>
            <button className="px-5 py-2.5 rounded-xl bg-[#31302e] text-[#fcf9f5] font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 shadow-lg active:scale-95">
              <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
              Quick Add
            </button>
          </div>
        </header>

        {/* Top Grid Stats & Visualization */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cluster Health Circle Gauge */}
          <div className="lg:col-span-1 bg-white/70 backdrop-blur-2xl p-8 rounded-[1.5rem] shadow-[0_12px_25px_rgba(137,77,13,0.03)] border border-[#d8c3b4]/30 relative overflow-hidden group">
            <div className="relative z-10 flex flex-col items-center">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#524439] mb-6">Cluster Health</h3>
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="72" cy="72" fill="transparent" r="60" stroke="#f0ede9" strokeWidth="8"></circle>
                  <circle cx="72" cy="72" fill="transparent" r="60" stroke="#006576" strokeDasharray="376" strokeDashoffset="30" strokeLinecap="round" strokeWidth="8"></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-[#006576]">92%</span>
                  <span className="text-[9px] font-black text-[#524439] uppercase tracking-widest mt-1">Operational</span>
                </div>
              </div>
              <div className="mt-6 flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#006576]"></div>
                  <span className="text-[10px] font-bold text-[#524439] uppercase tracking-wider">Latency: 12ms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Storage Usage Detailed */}
          <div className="lg:col-span-2 bg-[#31302e] text-[#fcf9f5] p-8 rounded-[1.5rem] shadow-[0_12px_25px_rgba(0,0,0,0.2)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#894d0d]/30 blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>
            <div className="relative z-10 h-full flex flex-col">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Total Utilization</h3>
                  <div className="text-4xl font-light">65.7<span className="text-stone-500 text-lg ml-1 font-medium">Percent</span></div>
                </div>
                <span className="material-symbols-outlined text-[#894d0d] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>dataset</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-auto">
                {BUCKETS.map((bucket, i) => (
                   <div key={bucket.name} className="space-y-2">
                     <span className="text-[10px] uppercase font-bold text-stone-400 tracking-widest">{bucket.name}</span>
                     <p className="text-base font-bold">{i === 0 ? "12.4 GB" : i === 1 ? "42.1 GB" : i === 2 ? "28.9 GB" : "0.8 GB"}</p>
                     <div className="w-full h-1 bg-stone-700/50 rounded-full overflow-hidden">
                       <div className="h-full rounded-full" style={{ width: `${Math.random() * 60 + 20}%`, background: bucket.color }}></div>
                     </div>
                   </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Object List View */}
        <section className="bg-white/70 backdrop-blur-2xl rounded-[1.5rem] shadow-[0_12px_25px_rgba(137,77,13,0.03)] border border-[#d8c3b4]/30 overflow-hidden">
          <div className="px-8 py-6 border-b border-[#d8c3b4]/30 flex items-center justify-between bg-[#f0ede9]/20">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#524439]">Recent Objects</h2>
            <div className="flex items-center gap-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#524439]">1,248 items total</span>
              <div className="flex bg-white rounded-lg p-1 border border-[#d8c3b4]/30 shadow-sm">
                 <button onClick={() => setView("grid")} className={`p-1.5 rounded-md transition-colors ${view === "grid" ? "bg-[#f0ede9] text-[#894d0d]" : "text-[#d8c3b4] hover:text-[#894d0d]"}`}>
                    <span className="material-symbols-outlined text-[16px]">grid_view</span>
                 </button>
                 <button onClick={() => setView("list")} className={`p-1.5 rounded-md transition-colors ${view === "list" ? "bg-[#f0ede9] text-[#894d0d]" : "text-[#d8c3b4] hover:text-[#894d0d]"}`}>
                    <span className="material-symbols-outlined text-[16px]">list</span>
                 </button>
              </div>
            </div>
          </div>

          {view === "list" ? (
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-[#f0ede9]/30">
                     <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-[#524439]">Name</th>
                     <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-[#524439]">Type</th>
                     <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-[#524439]">Size</th>
                     <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-[#524439]">Date Added</th>
                     <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-[#524439] text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[#d8c3b4]/20">
                   {FILES.map((file) => (
                     <tr key={file.name} className="hover:bg-[#fcf9f5] transition-colors group cursor-pointer">
                       <td className="px-8 py-4">
                         <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner" style={{ background: file.iconBg, color: file.iconColor }}>
                             <span className="material-symbols-outlined text-[20px]">{file.icon}</span>
                           </div>
                           <div>
                             <p className="font-bold text-xs text-[#1c1c1a] group-hover:text-[#894d0d] transition-colors">{file.name}</p>
                             <p className="text-[10px] text-[#524439] mt-0.5 font-medium">bucket: internal-docs</p>
                           </div>
                         </div>
                       </td>
                       <td className="px-8 py-4">
                         <span className="px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border" 
                               style={{ color: file.iconColor, background: file.iconBg, borderColor: file.iconColor + "30" }}>
                           {file.type}
                         </span>
                       </td>
                       <td className="px-8 py-4 text-xs font-semibold text-[#524439]">{file.size}</td>
                       <td className="px-8 py-4 text-xs font-semibold text-[#524439]">{file.date}</td>
                       <td className="px-8 py-4 text-right">
                         <button className="p-2 text-[#d8c3b4] hover:text-[#894d0d] hover:bg-orange-50 rounded-lg transition-all border border-transparent hover:border-[#d8c3b4]/40">
                            <span className="material-symbols-outlined text-[20px]">more_vert</span>
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          ) : (
             <div className="p-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {FILES.map((file) => (
                   <div key={file.name} className="group p-6 rounded-2xl border border-[#d8c3b4]/30 bg-white/40 hover:bg-white hover:border-[#894d0d]/40 transition-all cursor-pointer text-center hover:shadow-md">
                     <div className="w-16 h-16 rounded-[1.2rem] mx-auto mb-4 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform" style={{ background: file.iconBg, color: file.iconColor }}>
                       <span className="material-symbols-outlined text-[28px]">{file.icon}</span>
                     </div>
                     <p className="text-xs font-bold text-[#1c1c1a] truncate group-hover:text-[#894d0d]">{file.name}</p>
                     <p className="text-[10px] font-black tracking-widest uppercase text-[#524439] mt-2">{file.size}</p>
                   </div>
                ))}
             </div>
          )}
          
          {/* Pagination/Footer */}
          <div className="px-8 py-5 bg-[#f0ede9]/20 flex items-center justify-between border-t border-[#d8c3b4]/30">
            <button className="text-[10px] uppercase tracking-widest font-black text-[#524439] hover:text-[#894d0d] flex items-center gap-1 transition-colors">
              <span className="material-symbols-outlined text-[16px]">chevron_left</span> Previous
            </button>
            <div className="flex gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#894d0d] text-white flex items-center justify-center text-xs font-bold shadow-md cursor-pointer">1</span>
              <span className="w-8 h-8 rounded-lg bg-white border border-[#d8c3b4]/30 text-[#524439] flex items-center justify-center text-xs font-bold hover:bg-orange-50 cursor-pointer transition-colors">2</span>
              <span className="w-8 h-8 rounded-lg bg-white border border-[#d8c3b4]/30 text-[#524439] flex items-center justify-center text-xs font-bold hover:bg-orange-50 cursor-pointer transition-colors">3</span>
            </div>
            <button className="text-[10px] uppercase tracking-widest font-black text-[#524439] hover:text-[#894d0d] flex items-center gap-1 transition-colors">
              Next <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </section>

      </div>
      <FloatingAIChat defaultAgent="analyst" />
    </AppShell>
  );
}
