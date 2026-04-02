"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import FloatingAIChat from "@/components/ai/FloatingAIChat";
import { TRSOEEWidget } from "@/components/dashboard/widgets/TRSOEEWidget";
import { ProductionTrackingWidget } from "@/components/dashboard/widgets/ProductionTrackingWidget";
import { SCurveWidget } from "@/components/dashboard/widgets/SCurveWidget";
import { GanttWidget } from "@/components/dashboard/widgets/GanttWidget";
import { AMDECWidget } from "@/components/dashboard/widgets/AMDECWidget";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default function BIDashboardPage() {
  const [activeView, setActiveView] = useState('production');
  const [isEditing, setIsEditing] = useState(false);

  return (
    <AppShell title="Control Tower">
      <div className="flex flex-col gap-8 w-full p-4 lg:p-8">
        
        <DashboardHeader 
          activeView={activeView} 
          onViewChange={setActiveView} 
          isEditing={isEditing} 
          onEditToggle={setIsEditing} 
        />

        {/* Dashboard Grid (Power BI Like) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-20">
          
          {activeView === 'production' && (
            <>
              {/* OEE & TRS Widget */}
              <div className="md:col-span-8">
                <TRSOEEWidget />
              </div>

              {/* AMDEC Analysis Widget */}
              <div className="md:col-span-4">
                <AMDECWidget />
              </div>

              {/* Production Tracking Widget */}
              <div className="md:col-span-12">
                <ProductionTrackingWidget />
              </div>
            </>
          )}

          {activeView === 'planning' && (
            <>
              {/* Gantt & S-Curve Widget */}
              <div className="md:col-span-12">
                <GanttWidget />
              </div>
              <div className="md:col-span-12 mt-6">
                <SCurveWidget />
              </div>
            </>
          )}

          {activeView === 'quality' && (
            <>
              <div className="md:col-span-12">
                <AMDECWidget />
              </div>
            </>
          )}
        </div>
      </div>
      <FloatingAIChat defaultAgent="analyst" />
    </AppShell>
  );
}
