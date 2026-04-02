"use client";

import AppShell from "@/components/layout/AppShell";
import FloatingAIChat from "@/components/ai/FloatingAIChat";
import { useState } from "react";

const EXPORTS = [
  { id: "EXP-8421", scope: "Workspace: Design Collective", format: "JSON array", state: "Completed", date: "Today 10:14", size: "45.2 MB" },
  { id: "EXP-8419", scope: "User settings & Metadata", format: "CSV", state: "Completed", date: "Yesterday 16:22", size: "1.2 MB" },
  { id: "EXP-8410", scope: "Full Database Backup", format: "SQL wrapper", state: "Failed", date: "Mar 25, 2025", size: "0 B" },
  { id: "EXP-8395", scope: "Audit Logs (Q1 2025)", format: "CSV", state: "Expired", date: "Jan 02, 2025", size: "280.1 MB" },
];

export default function ExportsPage() {
  const [exporting, setExporting] = useState(false);

  const startExport = () => {
     setExporting(true);
     setTimeout(() => setExporting(false), 2500);
  }

  return (
    <AppShell title="Data Exports">
      <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-10">
         
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#d8c3b4]/30">
            <div>
               <h1 className="text-4xl font-black text-[#1c1c1a] tracking-tight" style={{ fontFamily: "'Manrope', sans-serif" }}>
                 Data Portability
               </h1>
               <p className="text-[#524439] text-xs mt-2 font-medium">Export your workspace content and account metadata securely</p>
            </div>
            <button 
              onClick={startExport}
              disabled={exporting}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest text-white shadow-sm flex items-center gap-2 transition-all active:scale-95
                ${exporting ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20" : "bg-gradient-to-tr from-[#894d0d] to-[#a76526] hover:scale-105 shadow-[0_8px_20px_rgba(137,77,13,0.3)]"}`}
            >
               <span className={`material-symbols-outlined text-[18px] ${exporting ? "animate-spin" : ""}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {exporting ? "sync" : "cloud_download"}
               </span>
               {exporting ? "Preparing Data..." : "New Export"}
            </button>
         </div>

         {/* Configuration Section  */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/70 backdrop-blur-2xl rounded-[1.5rem] p-8 border border-[#d8c3b4]/30 shadow-[0_12px_25px_rgba(137,77,13,0.03)] relative overflow-hidden">
               <div className="absolute top-0 left-0 w-32 h-32 rounded-full -ml-16 -mt-16 bg-[#894d0d]/10 blur-2xl pointer-events-none"></div>
               <h2 className="text-lg font-black text-[#1c1c1a] mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>Request New Archive</h2>
               <p className="text-xs text-[#524439] leading-relaxed mb-6 font-medium">
                  Select the scope of data you wish to export. Large workspaces may take several minutes to process. We will notify you via email when the archive is ready.
               </p>
               <div className="space-y-3 relative z-10">
                  <label className="flex items-start gap-4 p-4 bg-white rounded-xl border border-[#d8c3b4]/40 cursor-pointer hover:border-[#894d0d]/40 transition-colors shadow-sm">
                     <input type="radio" name="scope" defaultChecked className="mt-0.5 accent-[#894d0d]" />
                     <div>
                        <span className="text-sm font-black text-[#1c1c1a]">Current Workspace</span>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-[#524439] mt-1">Only documents and files from Design Collective</p>
                     </div>
                  </label>
                  <label className="flex items-start gap-4 p-4 bg-white rounded-xl border border-[#d8c3b4]/40 cursor-pointer hover:border-[#894d0d]/40 transition-colors shadow-sm">
                     <input type="radio" name="scope" className="mt-0.5 accent-[#894d0d]" />
                     <div>
                        <span className="text-sm font-black text-[#1c1c1a]">All Workspaces (Admin)</span>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-[#524439] mt-1">Full export of all content across 12 workspaces</p>
                     </div>
                  </label>
                  <label className="flex items-start gap-4 p-4 bg-white rounded-xl border border-[#d8c3b4]/40 cursor-pointer hover:border-[#894d0d]/40 transition-colors shadow-sm">
                     <input type="radio" name="scope" className="mt-0.5 accent-[#894d0d]" />
                     <div>
                        <span className="text-sm font-black text-[#1c1c1a]">Account Metadata Only</span>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-[#524439] mt-1">Personal settings, API keys, and preferences</p>
                     </div>
                  </label>
               </div>
               
               <p className="text-[10px] font-black text-[#894d0d] uppercase tracking-widest mt-8 mb-3">Export Format</p>
               <select className="w-full p-3.5 bg-white border border-[#d8c3b4]/40 rounded-xl text-xs font-bold text-[#1c1c1a] outline-none focus:border-[#894d0d] focus:ring-1 focus:ring-[#894d0d] shadow-sm relative z-10">
                 <option>JSON Array (.json)</option>
                 <option>Comma Separated (.csv)</option>
                 <option>Raw Markdown (.md)</option>
               </select>
            </div>

            {/* Export History Table */}
            <div className="bg-white/70 backdrop-blur-2xl rounded-[1.5rem] border border-[#d8c3b4]/30 shadow-[0_12px_25px_rgba(137,77,13,0.03)] p-8 overflow-hidden flex flex-col relative">
               <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full -mr-16 -mb-16 bg-[#006576]/10 blur-2xl pointer-events-none"></div>
               <h2 className="text-lg font-black text-[#1c1c1a] mb-6 relative z-10" style={{ fontFamily: "'Manrope', sans-serif" }}>Recent Exports</h2>
               
               <div className="flex-1 space-y-4 relative z-10">
                 {EXPORTS.map(exp => (
                   <div key={exp.id} className="flex justify-between items-center p-4 rounded-xl border border-[#d8c3b4]/30 bg-white/50 hover:bg-white hover:border-[#894d0d]/30 transition-all shadow-sm">
                      <div>
                         <p className="text-xs font-black text-[#1c1c1a] flex items-center gap-2">
                            {exp.scope}
                            <span className={`px-2.5 py-1 rounded-md text-[9px] uppercase font-black tracking-widest
                               ${exp.state === "Completed" ? "bg-[#006576]/10 text-[#006576]" :
                                 exp.state === "Failed" ? "bg-red-50 text-red-600" : "bg-stone-100 text-[#524439]"}`}>
                               {exp.state}
                            </span>
                         </p>
                         <div className="flex items-center gap-2 mt-2">
                           <span className="text-[10px] text-[#894d0d] font-bold uppercase tracking-wider">{exp.format}</span>
                           <span className="text-[8px] text-[#d8c3b4]">•</span>
                           <span className="text-[10px] text-[#524439] font-medium">{exp.date}</span>
                         </div>
                      </div>

                      {exp.state === "Completed" ? (
                        <button className="flex flex-col items-center justify-center p-2 min-w-[3rem] bg-white border border-[#d8c3b4]/40 rounded-lg text-[#894d0d] hover:bg-orange-50 group transition-colors shadow-sm">
                           <span className="material-symbols-outlined text-[18px]">download</span>
                           <span className="text-[8px] font-black uppercase tracking-widest mt-0.5 group-hover:scale-110 transition-transform">{exp.size}</span>
                        </button>
                      ) : exp.state === "Failed" ? (
                        <span className="material-symbols-outlined text-[20px] text-red-400 mr-3">error</span>
                      ) : (
                        <span className="material-symbols-outlined text-[20px] text-stone-300 mr-3">timer</span>
                      )}
                   </div>
                 ))}
               </div>
               
               <p className="text-[10px] text-[#524439] font-bold mt-6 pt-6 border-t border-[#d8c3b4]/30 relative z-10 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-amber-500">lock</span>
                  Download links automatically expire after 7 days for security.
               </p>
            </div>
         </div>
      </div>
      <FloatingAIChat defaultAgent="code" />
    </AppShell>
  );
}
