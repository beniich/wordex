"use client";

import React from 'react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function DashboardSidebar({ activeView, onViewChange }: SidebarProps) {
  const menuItems = [
    { id: 'production', label: 'Production Live', icon: 'precision_manufacturing' },
    { id: 'maintenance', label: 'Maintenance Hub', icon: 'settings_suggest' },
    { id: 'qualite', label: 'Qualité Performance', icon: 'verified' },
    { id: 'logistics', label: 'Logistique Flux', icon: 'local_shipping' },
    { id: 'security', label: 'HSE Risk Center', icon: 'shield_moon' },
    { id: 'settings', label: 'Suite Settings', icon: 'tune' }
  ];

  return (
    <aside className="w-[100px] lg:w-[260px] bg-white/40 backdrop-blur-3xl border-r border-[#DCC6A0]/40 flex flex-col p-6 shadow-2xl relative z-40 transition-all duration-300">
      <div className="mb-10 text-center lg:text-left">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-2 block whitespace-nowrap overflow-hidden">Factory Intel</span>
        <h3 className="text-xl font-black text-[#1c1c1a] hidden lg:block">Control Tower</h3>
      </div>

      <nav className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-[2rem] transition-all group relative overflow-hidden active:scale-95
              ${activeView === item.id ? 'bg-[#1c1c1a] text-white shadow-xl translate-x-2' : 'text-outline hover:bg-white/60'}
            `}
          >
            <span className={`material-symbols-outlined text-[24px] ${activeView === item.id ? 'text-[#A67B5B]' : 'group-hover:text-[#A67B5B]'} transition-colors`}>{item.icon}</span>
            <span className="text-xs font-black uppercase tracking-widest hidden lg:block">{item.label}</span>
            {activeView === item.id && (
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#A67B5B] shadow-[0_0_20px_rgba(166,123,91,0.5)]"></div>
            )}
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-10 border-t border-[#DCC6A0]/20 text-center">
         <div className="bg-[#A67B5B]/10 p-4 rounded-3xl border border-[#A67B5B]/20 mb-4 hidden lg:block group">
            <span className="text-[9px] font-black uppercase text-primary mb-1 block">Réseau Local</span>
            <div className="flex items-center gap-2 justify-center text-[11px] font-black group-hover:scale-105 transition-transform">
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
               <span className="tracking-widest">Connecté</span>
            </div>
         </div>
         <button className="p-3 bg-white/60 border border-[#DCC6A0]/40 rounded-full text-primary hover:bg-[#894d0d] hover:text-white transition-all shadow-sm active:scale-90" title="Sign out">
            <span className="material-symbols-outlined text-[20px]">power_settings_new</span>
         </button>
      </div>
    </aside>
  );
}
