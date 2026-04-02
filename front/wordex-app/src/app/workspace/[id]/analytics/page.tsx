"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { documents } from "@/lib/api";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import Link from "next/link";

export default function AnalyticsPage() {
  const params = useParams();
  const workspaceId = (params.id as string) ?? "demo-ws";

  const [currentDocId, setCurrentDocId] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    const initAnalytics = async () => {
      try {
        const docs = await documents.list(workspaceId);
        const analyticsDocs = docs.filter(d => d.doc_type === "analytics");
        
        if (analyticsDocs.length > 0) {
          setCurrentDocId(analyticsDocs[0].id);
        } else {
          // Create default analytics doc if none exists
          const newDoc = await documents.create(workspaceId, "Strategic Portfolio Insights", "analytics");
          setCurrentDocId(newDoc.id);
        }
      } catch (err) {
        console.error("Failed to initialize analytics:", err);
      }
    };

    initAnalytics();
  }, [workspaceId]);

  if (!currentDocId) {
    return (
      <div className="h-screen flex flex-col bg-[#0F0D0C] items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#A67B5B] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[#857467] font-black tracking-widest uppercase text-xs">Architecting Insight Hub...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col relative overflow-hidden bg-[#0F0D0C]">
      {/* 🏠 Return Navigation */}
      <div className="absolute top-[85px] left-[320px] z-50">
          <Link href={`/workspace/${workspaceId}`} className="text-[#A67B5B] font-black text-[9px] bg-[#1A1614]/80 p-3 rounded-xl shadow-2xl border border-[#A67B5B]/20 backdrop-blur-md flex items-center gap-2 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest">
             <span className="material-symbols-outlined text-[14px]">west</span> Hub
          </Link>
      </div>
      <div className="flex-1 overflow-hidden">
        <AnalyticsDashboard workspaceId={workspaceId} />
      </div>
    </div>
  );
}
