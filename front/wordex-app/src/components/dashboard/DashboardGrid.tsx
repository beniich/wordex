"use client";

import React from 'react';
import { TRSOEEWidget } from './widgets/TRSOEEWidget';
import { ProductionTrackingWidget } from './widgets/ProductionTrackingWidget';
import { SCurveWidget } from './widgets/SCurveWidget';
import { GanttWidget } from './widgets/GanttWidget';
import { AMDECWidget } from './widgets/AMDECWidget';

interface DashboardGridProps {
  view: string;
  isEditing: boolean;
}

export function DashboardGrid({ view, isEditing }: DashboardGridProps) {
  return (
    <div className="dashboard-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 grid-rows-[min-content] gap-8 p-6 lg:p-10 relative bg-mesh min-height-full">
      
      {/* 🚀 Production View */}
      {view === 'production' && (
        <>
          <div className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 animate-fade-in group relative">
             {isEditing && <EditOverlay />}
             <TRSOEEWidget />
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 animate-fade-in delay-100 group relative">
             {isEditing && <EditOverlay />}
             <ProductionTrackingWidget />
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-4 animate-fade-in delay-200 group relative">
             {isEditing && <EditOverlay />}
             <GanttWidget />
          </div>
        </>
      )}

      {/* 🛠️ Maintenance View */}
      {view === 'maintenance' && (
        <>
          <div className="col-span-1 md:col-span-2 lg:col-span-4 animate-fade-in group relative">
             {isEditing && <EditOverlay />}
             <AMDECWidget />
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 animate-fade-in delay-100 group relative">
             {isEditing && <EditOverlay />}
             <SCurveWidget />
          </div>
        </>
      )}

      {/* 🏆 Quality View */}
      {view === 'qualite' && (
        <>
           <div className="col-span-1 md:col-span-4 lg:col-span-4 animate-fade-in group relative">
             {isEditing && <EditOverlay />}
             <AMDECWidget />
          </div>
        </>
      )}

      {isEditing && (
        <div className="fixed bottom-10 right-10 z-[100] animate-bounce">
           <button className="px-8 py-4 bg-[var(--accent-primary)] text-white font-black text-xs uppercase tracking-widest rounded-full shadow-2xl shadow-[var(--accent-primary)]/40 flex items-center gap-3 hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[18px]">add_circle</span> Ajouter un Widget
           </button>
        </div>
      )}
    </div>
  );
}

function EditOverlay() {
  return (
    <div className="absolute inset-0 z-10 bg-[var(--accent-primary)]/5 backdrop-blur-[2px] border-2 border-dashed border-[var(--accent-primary)]/40 rounded-3xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-move pointer-events-none">
       <div className="bg-[var(--surface)] p-2 rounded-full shadow-2xl flex items-center gap-2 pointer-events-auto border border-[var(--border)]">
          <button className="p-2 hover:bg-[var(--bg-secondary)] rounded-full text-[var(--accent-primary)] transition-colors"><span className="material-symbols-outlined text-[18px]">open_with</span></button>
          <div className="w-px h-4 bg-[var(--border)]"></div>
          <button className="p-2 hover:bg-red-500/10 rounded-full text-red-500 transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
       </div>
    </div>
  );
}

