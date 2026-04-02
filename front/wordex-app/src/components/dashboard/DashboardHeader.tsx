"use client";

import React from 'react';
import Link from 'next/link';
import { dashboard } from '@/lib/api';

interface DashboardHeaderProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isEditing: boolean;
  onEditToggle: (editing: boolean) => void;
}

export function DashboardHeader({ activeView, onViewChange, isEditing, onEditToggle }: DashboardHeaderProps) {
  const handleSeed = async () => {
    const workspaceId = typeof window !== 'undefined' ? (window.location.pathname.split('/')[2] || 'demo-ws') : 'demo-ws';
    try {
      const res = await dashboard.seedDemo(workspaceId);
      // alert(`${res.machine_count} machines seeded! Please refresh.`);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <header className="bg-white/90 backdrop-blur-3xl border-b border-[#DCC6A0]/40 px-6 py-4 flex items-center justify-between z-50 sticky top-0 shadow-sm relative group">
      <div className="flex items-center gap-10">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary leading-none mb-1">Production Suite</span>
          <h1 className="text-xl font-black text-[#1c1c1a] italic tracking-tighter">Wordex Control Tower</h1>
        </div>

        <div className="hidden lg:flex items-center gap-6 bg-[#FCF9F5]/80 p-1.5 rounded-2xl border border-[#DCC6A0]/20 shadow-inner">
           {['production', 'maintenance', 'qualite'].map(view => (
             <button
               key={view}
               onClick={() => onViewChange(view)}
               className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeView === view ? 'bg-[#A67B5B] text-white shadow-xl scale-105' : 'text-outline hover:bg-white/60'}`}
             >
               {view}
             </button>
           ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex -space-x-3 mr-4">
           {[1,2,3].map(i => (
             <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-[#A67B5B] flex items-center justify-center text-[8px] font-black text-white shadow-md transition-transform hover:translate-y-1 cursor-pointer">
                USR-{i}
             </div>
           ))}
        </div>

        <button 
          onClick={handleSeed}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] bg-emerald-600 text-white font-black uppercase tracking-widest transition-all shadow-md active:scale-95 hover:bg-emerald-700"
        >
          <span className="material-symbols-outlined text-[18px]">database</span>
          Seed Data
        </button>

        <button 
          onClick={() => onEditToggle(!isEditing)}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 ${isEditing ? 'bg-[#1c1c1a] text-white ring-4 ring-[#1c1c1a]/10' : 'bg-white border border-[#DCC6A0]/40 text-primary hover:bg-[#A67B5B] hover:text-white hover:border-[#A67B5B]'}`}
        >
          <span className="material-symbols-outlined text-[18px]">{isEditing ? 'lock_open' : 'build'}</span>
          {isEditing ? 'Editing Mode' : 'Lock Layout'}
        </button>
        
        <Link href={`/workspace/${typeof window !== 'undefined' ? (window.location.pathname.split('/')[2] || 'demo-ws') : 'demo-ws'}`} className="p-2.5 rounded-xl bg-[#FCF9F5] border border-[#DCC6A0]/40 text-primary hover:scale-110 transition-transform active:scale-90 shadow-sm" title="Return to Workspace">
          <span className="material-symbols-outlined text-[20px]">home</span>
        </Link>
      </div>
    </header>
  );
}
