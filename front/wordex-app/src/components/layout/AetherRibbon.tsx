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
    <div className="aether-ribbon bg-[var(--bg-base)] border-b border-[var(--border)] flex flex-col shadow-lg z-50">
      {/* 🏷️ Tab Bar */}
      <div className="flex items-center px-4 bg-[var(--bg-secondary)] border-b border-[var(--border)]/50">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative
              ${activeTab === tab.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}
            `}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)] shadow-[0_0_10px_var(--accent-primary)]"></div>
            )}
          </button>
        ))}
        
        <div className="ml-auto flex items-center gap-4 pr-2">
           <button className="flex items-center gap-2 px-4 py-1.5 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 rounded-lg text-[var(--accent-primary)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--accent-primary)] hover:text-white transition-all shadow-sm">
             <span className="material-symbols-outlined text-[16px]">upload</span> Publish
           </button>
           <button className="flex items-center gap-2 px-4 py-1.5 bg-[var(--surface-high)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--bg-secondary)] transition-all">
             <span className="material-symbols-outlined text-[16px]">share</span> Share
           </button>
        </div>
      </div>

      {/* 🛠️ Main Ribbon Content */}
      <div className="flex px-4 py-2 bg-[var(--surface)]/60 backdrop-blur-md overflow-x-auto no-scrollbar gap-8">
        {tabs.find(t => t.id === activeTab)?.groups.map((group, gIdx) => (
          <div key={gIdx} className="flex flex-col gap-1.5 border-r border-[var(--border)] pr-8 last:border-0 relative pb-4">
            <div className="flex items-start gap-4 h-full py-1">
               {group.buttons.map((btn, bIdx) => (
                 <button 
                    key={bIdx} 
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all min-w-[60px]
                      ${btn.isActive ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--accent-primary)]'}
                    `}
                 >
                   <span className="material-symbols-outlined text-[20px]">{btn.icon}</span>
                   <span className="text-[9px] font-bold uppercase tracking-tight whitespace-nowrap">{btn.label}</span>
                 </button>
               ))}
            </div>
            <span className="absolute bottom-0 left-0 right-8 text-center text-[7px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-50">{group.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

