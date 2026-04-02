"use client";

import React, { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import FloatingAIChat from "@/components/ai/FloatingAIChat";
import { Loader2 } from "lucide-react";

export default function WorkspaceDetailsPage() {
  const [loading, setLoading] = useState(false);

  return (
    <AppShell title="Workspace Settings">
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Workspace Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2 py-0.5 bg-[#f0ede9] rounded text-[10px] font-bold uppercase tracking-[0.2em] text-[#79573c]">AET-2024-X</span>
              <span className="w-1 h-1 rounded-full bg-[#d8c3b4]"></span>
              <span className="text-xs font-medium text-[#524439]">Workspace Details</span>
            </div>
            <h2 className="text-5xl font-extrabold tracking-tight text-[#1c1c1a] mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>Sable &amp; Cuivre</h2>
            <div className="flex items-center gap-6 text-sm text-[#857467] font-medium">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">public</span>
                <span>Region: EU-Central-1</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">database</span>
                <span>Storage: 1.2 TB / 2.0 TB</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <button className="px-6 py-3 rounded-xl border-2 border-[#d8c3b4] bg-[#fcf9f5] text-[#524439] hover:text-[#1c1c1a] hover:border-[#857467] font-black text-[11px] tracking-widest uppercase transition-colors">
              Manage Archive
            </button>
            <button 
              onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1000); }}
              className="px-6 py-3 rounded-xl bg-gradient-to-tr from-[#894d0d] to-[#a76526] text-white font-black text-[11px] tracking-widest uppercase shadow-[0_10px_30px_rgba(137,77,13,0.3)] hover:shadow-[0_15px_40px_rgba(137,77,13,0.4)] hover:-translate-y-0.5 transition-all flex items-center justify-center min-w-[160px]"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Invite Member"}
            </button>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Main Content Panel: Documents */}
          <section className="col-span-1 md:col-span-8 space-y-6">
            <div className="flex items-center justify-between pl-1">
              <h3 className="text-2xl font-extrabold tracking-tight text-[#1c1c1a]" style={{ fontFamily: "'Manrope', sans-serif" }}>Documents &amp; Assets</h3>
              <button className="text-[#894d0d] hover:text-[#a76526] text-sm font-bold flex items-center gap-2 transition-colors">
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                New Document
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Document Row 1 */}
              <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl flex items-center justify-between border border-[#d8c3b4]/30 hover:shadow-md transition-all duration-300 group cursor-pointer">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-xl bg-[#f0ede9] flex items-center justify-center text-[#894d0d] group-hover:scale-110 group-hover:bg-[#894d0d] group-hover:text-white transition-all shadow-sm">
                    <span className="material-symbols-outlined text-[24px]">description</span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[#1c1c1a] text-lg leading-tight">Atelier Protocol v2.4</h4>
                    <p className="text-xs font-medium text-[#857467] mt-1">Edited 2h ago by Elena Vance</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-black uppercase tracking-widest hidden sm:block">Active Draft</span>
                  <div className="flex -space-x-3 hidden sm:flex">
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-[#a76526] overflow-hidden">
                       <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&auto=format&fit=crop" alt="User" className="w-full h-full object-cover" />
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-[#006576] overflow-hidden">
                       <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=100&auto=format&fit=crop" alt="User" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <button className="p-2 text-[#d8c3b4] hover:text-[#1c1c1a] hover:bg-[#f6f3ef] rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </div>
              </div>

              {/* Document Row 2 */}
              <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl flex items-center justify-between border border-[#d8c3b4]/30 hover:shadow-md transition-all duration-300 group cursor-pointer">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-xl bg-[#f0ede9] flex items-center justify-center text-[#79573c] group-hover:scale-110 group-hover:bg-[#a76526] group-hover:text-white transition-all shadow-sm">
                    <span className="material-symbols-outlined text-[24px]">auto_fix_high</span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[#1c1c1a] text-lg leading-tight">Visual Identity Archetypes</h4>
                    <p className="text-xs font-medium text-[#857467] mt-1">Uploaded Yesterday</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="px-3 py-1 rounded-full bg-[#fcf9f5] border border-[#d8c3b4] text-[#894d0d] text-[10px] font-black uppercase tracking-widest hidden sm:block">v1.2.0</span>
                  <button className="p-2 text-[#d8c3b4] hover:text-[#1c1c1a] hover:bg-[#f6f3ef] rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </div>
              </div>

              {/* Document Row 3 */}
              <div className="bg-white/60 backdrop-blur-xl p-6 rounded-2xl flex items-center justify-between border border-[#d8c3b4]/30 hover:shadow-md transition-all duration-300 group cursor-pointer">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-xl bg-[#f0ede9] flex items-center justify-center text-[#524439] group-hover:scale-110 group-hover:bg-[#1c1c1a] group-hover:text-white transition-all shadow-sm">
                    <span className="material-symbols-outlined text-[24px]">architecture</span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[#1c1c1a] text-lg leading-tight">Blueprint: Ethereal Layout</h4>
                    <p className="text-xs font-medium text-[#857467] mt-1">Edited 3 days ago by Julian Reed</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-500 border border-stone-200 text-[10px] font-black uppercase tracking-widest hidden sm:block">Archived</span>
                  <button className="p-2 text-[#d8c3b4] hover:text-[#1c1c1a] hover:bg-[#f6f3ef] rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Sidebar Content: Manage Members */}
          <aside className="col-span-1 md:col-span-4 space-y-8">
            <h3 className="text-2xl font-extrabold tracking-tight text-[#1c1c1a] pl-1" style={{ fontFamily: "'Manrope', sans-serif" }}>Workspace Core</h3>
            
            <div className="bg-[#1c1c1a] rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-48 h-48 bg-gradient-to-br from-[#894d0d] to-[#a76526] opacity-30 blur-[60px] group-hover:opacity-50 transition-all duration-700 pointer-events-none"></div>
              
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#eabe9c] mb-8 relative z-10">Active Collaborators</h4>
              
              <div className="space-y-6 relative z-10">
                {/* Member Item 1 */}
                <div className="flex items-center justify-between group/item">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#31302e]">
                         <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&auto=format&fit=crop" alt="User" className="w-full h-full object-cover mix-blend-luminosity hover:mix-blend-normal transition-all" />
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-teal-500 border-2 border-[#1c1c1a] rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Elena Vance</p>
                      <p className="text-[10px] text-[#857467] uppercase font-black tracking-widest mt-0.5">Owner</p>
                    </div>
                  </div>
                  <button className="text-[#524439] hover:text-[#ffb77b] transition-colors bg-[#31302e]/50 hover:bg-[#31302e] p-2 rounded-xl">
                    <span className="material-symbols-outlined text-[18px]">settings</span>
                  </button>
                </div>

                {/* Member Item 2 */}
                <div className="flex items-center justify-between group/item">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#31302e]">
                         <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=100&auto=format&fit=crop" alt="User" className="w-full h-full object-cover mix-blend-luminosity hover:mix-blend-normal transition-all" />
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-teal-500 border-2 border-[#1c1c1a] rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Julian Reed</p>
                      <p className="text-[10px] text-[#857467] uppercase font-black tracking-widest mt-0.5">Editor</p>
                    </div>
                  </div>
                  <button className="text-[#524439] hover:text-[#ffb77b] transition-colors bg-[#31302e]/50 hover:bg-[#31302e] p-2 rounded-xl">
                    <span className="material-symbols-outlined text-[18px]">settings</span>
                  </button>
                </div>

                {/* Member Item 3 */}
                <div className="flex items-center justify-between group/item opacity-60 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#31302e]">
                         <div className="w-full h-full bg-[#31302e] flex items-center justify-center text-white text-xs font-bold">SG</div>
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#524439] border-2 border-[#1c1c1a] rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Sasha Grey</p>
                      <p className="text-[10px] text-[#857467] uppercase font-black tracking-widest mt-0.5">Viewer</p>
                    </div>
                  </div>
                  <button className="text-[#524439] hover:text-[#ffb77b] transition-colors bg-[#31302e]/50 hover:bg-[#31302e] p-2 rounded-xl">
                    <span className="material-symbols-outlined text-[18px]">settings</span>
                  </button>
                </div>
              </div>

              <button className="w-full mt-8 py-4 rounded-xl border-2 border-[#a76526]/30 text-[#ffb77b] font-black text-[11px] uppercase tracking-widest hover:border-[#a76526] hover:bg-[#a76526]/10 transition-all">
                 Audit Permissions
              </button>
            </div>

            {/* Usage Statistics Card */}
            <div className="p-8 rounded-[2rem] bg-white/60 backdrop-blur-xl border border-[#d8c3b4]/40 shadow-sm">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#857467] mb-6">Quick Stats</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-white rounded-2xl border border-[#f0ede9] shadow-sm">
                  <p className="text-[10px] font-black text-[#d8c3b4] uppercase tracking-wider mb-2">Versions</p>
                  <p className="text-3xl font-extrabold text-[#894d0d]" style={{ fontFamily: "'Manrope', sans-serif" }}>142</p>
                </div>
                <div className="p-5 bg-white rounded-2xl border border-[#f0ede9] shadow-sm">
                  <p className="text-[10px] font-black text-[#d8c3b4] uppercase tracking-wider mb-2">Downloads</p>
                  <p className="text-3xl font-extrabold text-[#006576]" style={{ fontFamily: "'Manrope', sans-serif" }}>8.4k</p>
                </div>
              </div>
            </div>
            
          </aside>
        </div>
      </div>
      <FloatingAIChat />
    </AppShell>
  );
}
