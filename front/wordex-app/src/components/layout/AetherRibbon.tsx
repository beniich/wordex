"use client";

import React, { useState } from 'react';

interface RibbonTab {
  id: string;
  label: string;
  groups: {
    label: string;
    buttons: {
      icon: string;
      label: string;
      action?: () => void;
      isActive?: boolean;
    }[];
  }[];
}

export function AetherRibbon() {
  const [activeTab, setActiveTab] = useState('home');

  const tabs: RibbonTab[] = [
    {
      id: 'home',
      label: 'Home',
      groups: [
        {
          label: 'Clipboard',
          buttons: [
            { icon: 'content_paste', label: 'Paste' },
            { icon: 'content_cut', label: 'Cut' },
            { icon: 'content_copy', label: 'Copy' },
          ]
        },
        {
          label: 'Data',
          buttons: [
            { icon: 'database', label: 'Refresh' },
            { icon: 'transform', label: 'Transform' },
          ]
        },
        {
          label: 'AI & Insights',
          buttons: [
             { icon: 'auto_awesome', label: 'Copilot', isActive: true },
             { icon: 'psychology', label: 'Analyze' }
          ]
        }
      ]
    },
    {
      id: 'insert',
      label: 'Insert',
      groups: [
        {
          label: 'Visuals',
          buttons: [
            { icon: 'bar_chart', label: 'Chart' },
            { icon: 'pie_chart', label: 'Pie' },
            { icon: 'map', label: 'Map' },
            { icon: 'edit', label: 'Text Box' },
          ]
        }
      ]
    }
  ];

  return (
    <div className="aether-ribbon bg-[#1C1917] border-b border-[#2D2824] flex flex-col shadow-lg z-50">
      {/* 🏷️ Tab Bar */}
      <div className="flex items-center px-4 bg-[#0F0D0C]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative
              ${activeTab === tab.id ? 'text-white' : 'text-outline hover:text-[#D8C3B4]'}
            `}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#A67B5B] shadow-[0_0_10px_rgba(166,123,91,0.5)]"></div>
            )}
          </button>
        ))}
        
        <div className="ml-auto flex items-center gap-4 pr-2">
           <button className="flex items-center gap-2 px-4 py-1.5 bg-[#A67B5B]/10 border border-[#A67B5B]/30 rounded-lg text-[#A67B5B] text-[10px] font-black uppercase tracking-widest hover:bg-[#A67B5B] hover:text-black transition-all">
             <span className="material-symbols-outlined text-[16px]">upload</span> Publish
           </button>
           <button className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
             <span className="material-symbols-outlined text-[16px]">share</span> Share
           </button>
        </div>
      </div>

      {/* 🛠️ Main Ribbon Content */}
      <div className="flex px-4 py-2 bg-[#1C1917]/80 backdrop-blur-md overflow-x-auto no-scrollbar gap-8">
        {tabs.find(t => t.id === activeTab)?.groups.map((group, gIdx) => (
          <div key={gIdx} className="flex flex-col gap-1.5 border-r border-[#2D2824]/50 pr-8 last:border-0 relative">
            <div className="flex items-start gap-4">
               {group.buttons.map((btn, bIdx) => (
                 <button 
                    key={bIdx} 
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all min-w-[50px]
                      ${btn.isActive ? 'bg-[#A67B5B]/20 text-[#A67B5B] border border-[#A67B5B]/30' : 'text-[#D8C3B4] hover:bg-white/5'}
                    `}
                 >
                   <span className="material-symbols-outlined text-[20px]">{btn.icon}</span>
                   <span className="text-[9px] font-bold uppercase tracking-tight whitespace-nowrap">{btn.label}</span>
                 </button>
               ))}
            </div>
            <span className="absolute -bottom-1 left-0 right-8 text-center text-[7px] font-black uppercase tracking-[0.3em] text-[#4A433D]">{group.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
