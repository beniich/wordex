"use client";

import React, { useState } from 'react';
import { AetherRibbon } from '../layout/AetherRibbon';
import { useAnalyticsEngine } from '@/hooks/useAnalyticsEngine';

export function AnalyticsDashboard({ workspaceId }: { workspaceId: string }) {
  const { mappedData, availableSheets, isLoading, variables, saveVariable } = useAnalyticsEngine(workspaceId);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);

  // Form state for new variable (MOVED BEFORE LOADING RETURN)
  const [newKpiName, setNewKpiName] = useState("");
  const [newRange, setNewRange] = useState("");
  const [newSourceDoc, setNewSourceDoc] = useState("");

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0F0D0C]">
        <div className="w-8 h-8 border-4 border-[#A67B5B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleAddVariable = async () => {
     if (!newKpiName || !newRange || !newSourceDoc) return;
     await saveVariable({
        kpi_name: newKpiName,
        cell_range: newRange,
        source_doc: newSourceDoc,
        aggregation: "sum"
     });
     setNewKpiName("");
     setNewRange("");
  };

  // Deriving data from mapped values or fallbacks
  const valuation = mappedData.valuation ?? 68.8;
  const irr = mappedData.irr ?? 14.8;
  const yieldVal = mappedData.yield ?? 1.8;
  const series = mappedData.series ?? [20, 35, 45, 30, 25, 40];

  return (
    <div className="analytics-dashboard-root h-screen flex flex-col bg-[#0F0D0C] text-[#D8C3B4] font-sans overflow-hidden">
      
      {/* 🏷️ Top Ribbon */}
      <AetherRibbon />

      <div className="flex-1 flex overflow-hidden">
        
        {/* 📋 Left Summary Sidebar */}
        <aside className="w-[280px] bg-linear-to-b from-[#141210] to-[#0A0908] border-r border-[#2D2824] flex flex-col p-6 shadow-[20px_0_40px_rgba(0,0,0,0.5)] z-20">
          <div className="mb-10 text-center">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#A67B5B] mb-2 leading-none">Portfolio Hub</h2>
            <h1 className="text-2xl font-black text-white italic tracking-tighter">Connected Insights</h1>
          </div>

          <div className="space-y-8 flex-1 overflow-y-auto no-scrollbar">
             <div className="space-y-4">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-outline mb-2 block border-b border-[#2D2824]/50 pb-2">Active Data Source</span>
                {availableSheets.map(s => (
                   <button 
                     key={s.id} 
                     onClick={() => setSelectedSheet(s.id)}
                     className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all group text-left
                        ${selectedSheet === s.id ? 'bg-[#A67B5B]/10 border-[#A67B5B]/50' : 'bg-white/2 border-[#231F1C] hover:border-[#A67B5B]/30 hover:bg-white/4'}
                     `}
                   >
                      <div className={`w-2 h-2 rounded-full ring-4 ring-offset-2 ring-offset-[#0F0D0C] transition-all
                        ${selectedSheet === s.id ? 'bg-[#A67B5B] ring-[#A67B5B]/20 animate-pulse' : 'bg-[#4A433D] ring-transparent'}
                      `}></div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest truncate ${selectedSheet === s.id ? 'text-white' : 'text-outline'}`}>{s.title}</span>
                   </button>
                ))}
                {!availableSheets.length && (
                   <p className="text-[9px] italic text-[#4A433D] p-3 border border-dashed border-[#2D2824] rounded-xl text-center">No sheets detected in workspace</p>
                )}
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/[0.02] border border-[#231F1C] rounded-2xl flex flex-col items-center">
                   <span className="text-[8px] font-black uppercase text-outline mb-1">Status</span>
                   <span className="text-[10px] font-black text-[#A67B5B] uppercase tracking-widest">Live Sync</span>
                </div>
                <div className="p-4 bg-white/[0.02] border border-[#231F1C] rounded-2xl flex flex-col items-center">
                   <span className="text-[8px] font-black uppercase text-outline mb-1">Last Update</span>
                   <span className="text-[10px] font-black text-[#A67B5B] uppercase tracking-widest">Now</span>
                </div>
                <div className="p-4 bg-[#A67B5B]/10 border border-[#A67B5B]/30 rounded-2xl flex flex-col items-center col-span-2">
                   <span className="text-[8px] font-black uppercase text-[#A67B5B] mb-1 tracking-widest">Total Active Valuation</span>
                   <span className="text-2xl font-black text-white">${valuation}M</span>
                </div>
             </div>
          </div>
        </aside>

        {/* 📊 Main Canvas Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-10 relative bg-[#0F0D0C]/80">
           <div className="grid grid-cols-12 grid-rows-6 gap-6 h-full min-h-[1000px]">
              
              {/* Donut Chart */}
              <div className="col-span-12 lg:col-span-4 row-span-2 glass-widget flex flex-col p-6 animate-fade-in group">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-outline mb-6 border-b border-[#2D2824]/50 pb-4">Realtime Allocation</h3>
                 <div className="flex-1 flex flex-col items-center justify-center relative">
                    <div className="w-48 h-48 rounded-full border-[1.5rem] border-[#A67B5B]/5 shadow-[0_0_60px_rgba(166,123,91,0.15)] flex flex-col items-center justify-center">
                       <span className="text-4xl font-black text-white italic drop-shadow-lg">{valuation}M</span>
                       <span className="text-[8px] font-black uppercase text-[#A67B5B] underline underline-offset-4 tracking-widest mt-1">Extracted Val</span>
                    </div>
                 </div>
              </div>

              {/* Map Illustration */}
              <div className="col-span-12 lg:col-span-8 row-span-3 glass-widget p-8 overflow-hidden relative group">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-outline mb-6 flex justify-between items-center group-hover:text-white transition-all text-shadow">
                    Global Distribution Index <span className="bg-[#A67B5B] h-1.5 w-1.5 rounded-full shadow-[0_0_10px_rgba(166,123,91,0.8)] animate-ping"></span>
                 </h3>
                 <div className="flex-1 flex items-center justify-center relative scale-110 opacity-60 transition-all group-hover:scale-100 group-hover:opacity-80">
                    <span className="material-symbols-outlined text-[300px] text-white/5 selection:bg-transparent">public</span>
                    <div className="absolute top-[30%] left-[45%] flex flex-col items-center">
                       <div className="h-2 w-2 bg-[#A67B5B] rounded-full shadow-[0_0_20px_rgba(166,123,91,1)]"></div>
                       <span className="text-[8px] font-black text-[#A67B5B] mt-2 tracking-tighter uppercase whitespace-nowrap bg-black/40 backdrop-blur px-2 py-0.5 rounded">Europe HUB: {valuation}M</span>
                    </div>
                 </div>
              </div>

              {/* Table Status */}
              <div className="col-span-12 lg:col-span-7 row-span-3 glass-widget flex flex-col p-0 overflow-hidden shadow-2xl">
                 <div className="p-6 border-b border-[#2D2824]/50 flex justify-between items-center bg-white/1">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-outline">Strategic Portfolio Status</h3>
                 </div>
                 <div className="flex-1 overflow-auto no-scrollbar">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-[#0F0D0C]/80 text-outline text-[8px] font-black uppercase tracking-widest sticky top-0 z-10 border-b border-[#2D2824]">
                             <th className="px-6 py-4">Metric</th>
                             <th className="px-6 py-4">Source Range</th>
                             <th className="px-6 py-4">Live Value</th>
                          </tr>
                       </thead>
                       <tbody className="text-[10px] text-[#D8C3B4]">
                          <tr className="border-b border-[#2D2824]/30 hover:bg-white/2 transition-colors group">
                             <td className="px-6 py-4 font-black text-[#D8C3B4]">Total Valuation</td>
                             <td className="px-6 py-4 font-mono text-outline">Sheet1!B1</td>
                             <td className="px-6 py-4 font-black text-[#A67B5B] text-lg">${valuation}M</td>
                          </tr>
                          <tr className="border-b border-[#2D2824]/30 hover:bg-white/2 transition-colors group">
                             <td className="px-6 py-4 font-black text-[#D8C3B4]">Efficiency IRR</td>
                             <td className="px-6 py-4 font-mono text-outline">Sheet1!B2</td>
                             <td className="px-6 py-4 font-black text-[#D8C3B4]">{irr}%</td>
                          </tr>
                       </tbody>
                    </table>
                 </div>
              </div>

              {/* Summary KPIs */}
              <div className="col-span-12 lg:col-span-5 row-span-1 flex gap-6">
                 <div className="flex-1 glass-widget p-6 flex flex-col items-center justify-center border-l-4 border-l-[#A67B5B]">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-outline mb-2 leading-none">IRR (Annual)</span>
                    <span className="text-3xl font-black text-white italic tracking-tighter">{irr}%</span>
                 </div>
                 <div className="flex-1 glass-widget p-6 flex flex-col items-center justify-center border-l-4 border-l-outline">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-outline mb-2 leading-none">Net Yield</span>
                    <span className="text-3xl font-black text-[#A67B5B] italic tracking-tighter">{yieldVal}x</span>
                 </div>
              </div>

              {/* Cash Flow Chart */}
              <div className="col-span-12 lg:col-span-5 row-span-2 glass-widget p-6 flex flex-col group">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-outline mb-6 flex justify-between">
                   Sync Series (C1:C6)
                   <span className="text-[#A67B5B] font-mono text-[8px] font-bold">MODE: REALTIME</span>
                 </h3>
                 <div className="flex-1 flex items-end gap-2 px-2 relative h-full">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none px-6 py-2">
                       <polyline 
                          points={series.map((v: number, i: number) => `${(i * 100) / 6}%, ${100 - (v * 1.5)}%`).join(' ')}
                          fill="none" 
                          stroke="#A67B5B" 
                          strokeWidth="2" 
                          className="transition-all duration-1000"
                       />
                    </svg>
                    {series.map((v: number, i: number) => (
                       <div key={i} className="flex-1 flex flex-col items-center gap-2 group/bar cursor-help">
                          <div 
                             className="w-full bg-[#231F1C] hover:bg-[#A67B5B]/60 rounded-t-sm transition-all duration-1000 relative" 
                             style={{ height: (v * 1.5) + 'px' }}
                          >
                             <div className="absolute -top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 bg-[#A67B5B] text-black text-[7px] font-black px-1 rounded transition-opacity shadow-lg">{v}</div>
                          </div>
                          <span className="text-[7px] font-black font-mono text-[#4A433D] uppercase">{2020 + i}</span>
                       </div>
                    ))}
                 </div>
              </div>

           </div>
        </main>

        {/* 📊 Right Sidebar */}
        <aside className="w-[300px] bg-[#141210] border-l border-[#2D2824] flex flex-col z-20 shadow-[-20px_0_40px_rgba(0,0,0,0.5)]">
           <div className="h-[50px] flex items-center px-6 border-b border-[#2D2824] gap-6">
              <button className="text-[10px] font-black uppercase tracking-[0.2em] text-white underline underline-offset-8">Field Mapping</button>
           </div>

           <div className="flex-1 flex flex-col p-6 overflow-y-auto no-scrollbar gap-8">
              <div className="p-5 bg-[#A67B5B]/5 border border-[#A67B5B]/30 rounded-4xl flex flex-col gap-4 shadow-inner">
                 <span className="text-[9px] font-black uppercase text-[#A67B5B] tracking-[0.3em]">New KPI Mapping</span>
                 <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                       <label className="text-[7px] font-black text-outline uppercase tracking-widest ml-1">KPI Identifier</label>
                       <input 
                         type="text" 
                         value={newKpiName}
                         onChange={(e) => setNewKpiName(e.target.value)}
                         placeholder="e.g. valuation" 
                         className="bg-black/40 p-3 rounded-xl border border-[#2D2824] text-[10px] text-white outline-none focus:border-[#A67B5B]/50 transition-all font-bold placeholder:text-[#4A433D]" 
                       />
                    </div>
                    <div className="flex flex-col gap-1.5">
                       <label className="text-[7px] font-black text-outline uppercase tracking-widest ml-1">Source Sheet</label>
                       <select 
                         value={newSourceDoc}
                         onChange={(e) => setNewSourceDoc(e.target.value)}
                         className="bg-black/40 p-3 rounded-xl border border-[#2D2824] text-[10px] text-white outline-none focus:border-[#A67B5B]/50 transition-all font-bold"
                         title="Select Source Sheet"
                       >
                          <option value="">Select Sheet</option>
                          {availableSheets.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                       </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                       <label className="text-[7px] font-black text-outline uppercase tracking-widest ml-1">Cell Range</label>
                       <input 
                         type="text" 
                         value={newRange}
                         onChange={(e) => setNewRange(e.target.value)}
                         placeholder="e.g. B1" 
                         className="bg-black/40 p-3 rounded-xl border border-[#2D2824] text-[10px] text-white outline-none focus:border-[#A67B5B]/50 transition-all font-mono font-bold placeholder:text-[#4A433D]" 
                       />
                    </div>
                    <button 
                      onClick={handleAddVariable}
                      className="w-full py-3 bg-[#A67B5B] hover:bg-[#856148] text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg active:scale-95"
                    >
                       Forge Link
                    </button>
                 </div>
              </div>

              <div className="space-y-4">
                 <span className="text-[9px] font-black uppercase tracking-[0.3em] text-outline">Active Variable Matrix</span>
                 <div className="space-y-2">
                    {variables.map(v => (
                       <div key={v.id} className="p-3 bg-white/[0.02] border border-[#231F1C] rounded-xl flex justify-between items-center group hover:border-[#A67B5B]/30 transition-all">
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black text-white uppercase">{v.kpi_name}</span>
                             <span className="text-[8px] font-bold text-outline uppercase tracking-tighter opacity-60">{v.cell_range}</span>
                          </div>
                          <div className="text-[#A67B5B] font-black text-[10px] italic">{mappedData[v.kpi_name] || '0'}</div>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="p-4 bg-black/20 rounded-2xl border border-dashed border-[#2D2824]">
                 <p className="text-[9px] text-outline leading-relaxed italic text-center opacity-60 font-medium">Telemetry is synchronized via HyperFormula™ core. Evolution of source data propagates to this hub in real-time.</p>
              </div>
           </div>
        </aside>

      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .glass-widget {
           background: rgba(35, 31, 28, 0.4);
           backdrop-filter: blur(20px);
           border: 1px solid rgba(166, 123, 91, 0.1);
           border-radius: 2rem;
           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-widget:hover {
           background: rgba(35, 31, 28, 0.6);
           border-color: rgba(166, 123, 91, 0.4);
           transform: translateY(-4px);
        }
        .text-shadow {
           text-shadow: 0 0 10px rgba(166,123,91,0.3);
        }
        .animate-fade-in {
           animation: fadeIn 0.8s ease-out forwards;
        }
        @keyframes fadeIn {
           from { opacity: 0; transform: translateY(20px); }
           to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
