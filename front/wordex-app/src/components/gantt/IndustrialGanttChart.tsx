"use client";

import React, { useRef, useMemo } from 'react';
import { useGanttEngine, GanttZoomLevel } from '@/hooks/useGanttEngine';

interface IndustrialGanttChartProps {
  sheetId: string;
}

export function IndustrialGanttChart({ sheetId }: IndustrialGanttChartProps) {
  const { data, zoom, setZoom, saveStatus } = useGanttEngine(sheetId);
  const scrollRef = useRef<HTMLDivElement>(null);

  const timelineInfo = useMemo(() => {
    if (!data || !data.tasks || data.tasks.length === 0) {
      return { months: [{ label: 'Jan 2024', date: new Date('2024-01-01') }], origin: new Date('2024-01-01') };
    }
    
    const minMs = Math.min(...data.tasks.map(t => {
      const dt = t.start_date || t.start;
      return dt ? new Date(dt).getTime() : new Date('2024-01-01').getTime();
    }));
    const maxMs = Math.max(...data.tasks.map(t => {
      const dt = t.end_date || t.end;
      return dt ? new Date(dt).getTime() : new Date('2024-12-31').getTime();
    }));
    
    const origin = new Date(minMs);
    origin.setDate(1); // Set to 1st of month
    origin.setMonth(origin.getMonth() - 1); // Add padding
    
    const endLimit = new Date(maxMs);
    endLimit.setMonth(endLimit.getMonth() + 2); // Add padding
    
    const months = [];
    const t = new Date(origin);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let safeguard = 0;
    while(t < endLimit && safeguard < 60) {
      months.push({ label: `${monthNames[t.getMonth()]} ${t.getFullYear()}`, date: new Date(t) });
      t.setMonth(t.getMonth() + 1);
      safeguard++;
    }
    
    return { months, origin };
  }, [data]);

  const PX_PER_DAY = (zoom === 'month' ? (200 / 30) : zoom === 'week' ? 20 : zoom === 'day' ? 60 : 3);
  const MONTH_WIDTH = PX_PER_DAY * 30; // Approx month width dynamically

  if (!data) return (
    <div className="flex items-center justify-center h-full bg-[#1A1614] text-[#A67B5B]">
      <div className="animate-pulse">Loading Command Center...</div>
    </div>
  );

  return (
    <div className="industrial-gantt-root h-full flex flex-col bg-[#0F0D0C] text-[#D8C3B4] font-sans selection:bg-[#A67B5B]/30">
      
      {/* 🚀 Header / Toolbar */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#1A1614] border-b border-[#2D2824]">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-black tracking-tight text-white uppercase italic">Master Project Gantt Schedule</h1>
          <div className="flex items-center gap-2 bg-[#0F0D0C] p-1 rounded-lg border border-[#3D352E]">
            <button className="px-3 py-1.5 text-xs font-bold hover:bg-[#2D2824] rounded transition-all">Project: <span className="text-[#A67B5B]">All Projects</span></button>
            <button className="px-3 py-1.5 text-xs font-bold hover:bg-[#2D2824] rounded transition-all">All Tasks</button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-[#0F0D0C] p-1 rounded-lg border border-[#3D352E]">
             {(['day', 'week', 'month', 'quarter'] as GanttZoomLevel[]).map(z => (
               <button 
                 key={z}
                 onClick={() => setZoom(z)}
                 className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded transition-all ${zoom === z ? 'bg-[#A67B5B] text-black' : 'text-outline hover:white'}`}
               >
                 {z}
               </button>
             ))}
          </div>
          <div className="text-[10px] uppercase font-bold text-outline">
            {saveStatus === 'saving' ? 'Persisting...' : 'Ready'}
          </div>
        </div>
      </header>

      {/* 📊 Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* 📋 Sidebar (Project List) */}
        <aside className="w-[300px] flex flex-col bg-[#141210] border-r border-[#2D2824] z-10 shadow-2xl">
          <div className="h-[60px] flex items-center px-6 text-[10px] font-black uppercase tracking-widest text-outline border-b border-[#2D2824]">
             Project Name
             <button className="ml-auto px-2 py-1 bg-[#A67B5B] text-black rounded text-[9px] font-bold hover:bg-white transition-colors" onClick={() => console.log('Add Task')}>+ Add Node</button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {data.tasks.map(task => (
              <div 
                key={task.id} 
                className={`task-row flex items-center px-6 py-2 h-10 border-b border-[#2D2824]/50 cursor-pointer hover:bg-white/2 transition-all group
                  ${task.type === 'project' || task.task_type === 'project' ? 'font-bold text-[#DCC6A0]' : 'text-outline pl-10'}
                `}
              >
                <span className="text-xs truncate">{task.name}</span>
                {(task.type === 'project' || task.task_type === 'project') && <span className="ml-auto text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">▾</span>}
              </div>
            ))}
            {data.tasks.length === 0 && (
               <div className="px-6 py-4 text-xs text-outline italic">No tasks created yet.</div>
            )}
          </div>
        </aside>

        {/* 🕒 Timeline Canvas */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* Header Timeline Grid */}
          <div className="timeline-header h-[60px] bg-[#1A1614] border-b border-[#2D2824] flex overflow-hidden">
            <div className="flex flex-1 dynamic-timeline-width">
              {timelineInfo.months.map((m, i) => (
                <div key={i} className="flex-none border-r border-[#2D2824]/30 flex flex-col items-center justify-center month-column">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-outline mb-1">{m.label}</span>
                  <div className="flex w-full px-2 gap-1 opacity-20">
                     <div className="flex-1 h-[2px] bg-[#D8C3B4]"></div>
                     <div className="flex-1 h-[2px] bg-[#D8C3B4]"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grid Bars Canvas */}
          <div className="flex-1 overflow-auto custom-scrollbar relative bg-[#0F0D0C]/80" ref={scrollRef}>
             {/* Vertical Grid Lines Overlay */}
              <div className="absolute inset-0 flex pointer-events-none dynamic-timeline-width">
                {timelineInfo.months.map((m, i) => (
                  <div key={i} className="flex-none border-r border-[#2D2824]/10 h-full month-column"></div>
                ))}
              </div>

             {/* Dynamic Bars Container */}
             <div className="relative pt-2 dynamic-timeline-width">
               {data.tasks.map((task) => {
                 const tStart = new Date(task.start_date || task.start || '2024-01-01');
                 const tEnd = new Date(task.end_date || task.end || '2024-12-31');
                 
                 const daysFromOrigin = (tStart.getTime() - timelineInfo.origin.getTime()) / 86400000;
                 const durationDays = (tEnd.getTime() - tStart.getTime()) / 86400000 + 1;
                 
                 const left = Math.max(0, daysFromOrigin * PX_PER_DAY); 
                 const width = Math.max(12, durationDays * PX_PER_DAY);
                 const isProject = task.type === 'project' || task.task_type === 'project';
                 const isMilestone = task.type === 'milestone' || task.task_type === 'milestone';

                 return (
                   <div key={task.id} className="relative h-10 group">
                      <div className="absolute inset-0 bg-[#A67B5B]/0 group-hover:bg-[#A67B5B]/3 transition-colors w-[5000px]"></div>
                      <div 
                        className={`gantt-bar absolute top-2 rounded-sm flex items-center px-4 shadow-22xl transition-all hover:scale-[1.02] cursor-grab active:cursor-grabbing group-active:scale-[0.98]
                          ${isProject ? 'bg-linear-to-r from-[#A67B5B] to-[#5D4636] border border-[#DCC6A0]/20' : 'bg-linear-to-r from-primary to-[#4A2C08] border border-primary/30'}
                          ${isMilestone ? 'h-4 w-4 rotate-45 bg-[#FF4D4D]! -ml-2 is-milestone' : ''}
                        `}
                        style={{ 
                          '--left': left + 'px', 
                          '--width': isMilestone ? '16px' : width + 'px' 
                        } as React.CSSProperties}
                      >
                         {!isMilestone && (
                           <>
                             <div className="text-[9px] font-black uppercase text-white truncate drop-shadow-md z-10">{task.name} {task.progress}%</div>
                             <div 
                               className="absolute inset-y-0 left-0 bg-white/10 progress-fill" 
                               style={{ '--progress': task.progress + '%' } as React.CSSProperties}
                             ></div>
                           </>
                         )}
                      </div>

                      {isMilestone && (
                        <div className="milestone-label absolute top-2 text-[8px] font-black text-[#FF4D4D] whitespace-nowrap uppercase tracking-widest mt-0.5" style={{ '--left': (left + 16) + 'px' } as React.CSSProperties}>
                           {task.name}
                        </div>
                      )}
                   </div>
                 );
               })}
             </div>
          </div>
        </main>
      </div>

      {/* 📉 Resource Monitor (Bottom Panel) */}
      <footer className="h-[180px] bg-[#141210] border-t border-[#2D2824] flex flex-col px-6 py-4 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
         <div className="flex items-center justify-between mb-4">
           <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-outline">Resource Utilization Index</h3>
           <div className="flex gap-6 text-[8px] font-black uppercase tracking-widest">
             <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#A67B5B]"></div> Capacity</span>
             <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#FF4D4D]"></div> Critical Usage</span>
           </div>
         </div>

         <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
           {data.resources.map(res => (
             <div key={res.id} className="flex items-center gap-6 group">
                <div className="w-32 flex items-center gap-2">
                   <div className={`w-1.5 h-1.5 rounded-full ${res.status === 'online' ? 'bg-green-500' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse'}`}></div>
                   <span className="text-[10px] font-bold text-outline group-hover:text-white transition-colors">{res.name}</span>
                </div>
                
                <div className="flex-1 flex gap-2">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="flex-1 bg-[#1A1614] h-5 rounded-sm relative overflow-hidden border border-[#2D2824]">
                       <div className="absolute top-0 left-0 bottom-0 bg-[#A67B5B]/10 w-full"></div>
                       <div 
                         className="absolute top-0 left-0 bottom-0 bg-linear-to-r from-[#A67B5B] to-primary shadow-lg rounded-r-sm transition-all duration-1000"
                         style={{ width: ( (res.usage[i] / res.capacity[i]) * 100 ) + '%' }}
                       ></div>
                       <div className="absolute inset-0 flex items-center px-3 justify-between text-[7px] font-black uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-white/40">Load</span>
                         <span className="text-white">{( (res.usage[i] / res.capacity[i]) * 100 ).toFixed(0)}%</span>
                       </div>
                    </div>
                  ))}
                </div>
             </div>
           ))}
         </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2D2824; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3D352E; }
        
        .dynamic-timeline-width { min-width: ${timelineInfo.months.length * MONTH_WIDTH}px; }
        .month-column { width: ${MONTH_WIDTH}px; }
        .gantt-bar { 
           left: var(--left); 
           width: var(--width); 
           height: 16px;
           overflow: hidden;
        }
        .gantt-bar.is-milestone { height: 16px; width: 16px; overflow: visible; }
        .progress-fill { width: var(--progress); }
        .milestone-label { left: var(--left); }
      ` }} />
    </div>
  );
}
