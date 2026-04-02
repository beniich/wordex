"use client";

import { useState } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { DashboardGrid } from './DashboardGrid';

export function DashboardLayout() {
  const [activeView, setActiveView] = useState('production');
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="dashboard-layout h-screen flex flex-col bg-[#FCF9F5] font-body text-[#1c1c1a] overflow-hidden selection:bg-[#ffdcc2] selection:text-[#6d3a00]">
      <DashboardHeader 
        activeView={activeView}
        onViewChange={setActiveView}
        isEditing={isEditing}
        onEditToggle={setIsEditing}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <DashboardSidebar 
          activeView={activeView}
          onViewChange={setActiveView}
        />
        
        <main className="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-10 relative bg-[#FCF9F5]">
           <div className="max-w-[1600px] mx-auto">
             <DashboardGrid 
               view={activeView}
               isEditing={isEditing}
             />
           </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn {
           from { opacity: 0; transform: translateY(10px); }
           to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
           animation: fadeIn 0.5s ease-out forwards;
        }
      ` }} />
    </div>
  );
}
