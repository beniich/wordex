"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { documents } from "@/lib/api";
import { IndustrialGanttChart } from "@/components/gantt/IndustrialGanttChart";
import Link from "next/link";

export default function GanttPage() {
  const params = useParams();
  const workspaceId = (params.id as string) ?? "demo-ws";

  const [currentDocId, setCurrentDocId] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    const initGantt = async () => {
      try {
        const docs = await documents.list(workspaceId);
        const ganttDocs = docs.filter(d => d.doc_type === "gantt");
        
        if (ganttDocs.length > 0) {
          setCurrentDocId(ganttDocs[0].id);
        } else {
          // Create default gantt doc if none exists
          const newDoc = await documents.create(workspaceId, "Project Roadmap", "gantt");
          setCurrentDocId(newDoc.id);
        }
      } catch (err) {
        console.error("Failed to initialize gantt:", err);
      }
    };

    initGantt();
  }, [workspaceId]);

  if (!currentDocId) {
    return (
      <div className="h-screen flex flex-col bg-[#0F0D0C] items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#A67B5B] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[#857467] font-bold tracking-widest uppercase text-xs">Accessing Command Center...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col relative overflow-hidden bg-[#0F0D0C]">
      {/* 🏠 Return Navigation Floating Over Main UI */}
      <div className="absolute top-4 left-[320px] z-50">
          <Link href={`/workspace/${workspaceId}`} className="text-[#A67B5B] font-black text-[9px] bg-[#1A1614] p-3 rounded-xl shadow-2xl border border-[#2D2824] backdrop-blur-md flex items-center gap-2 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest">
             <span className="material-symbols-outlined text-[14px]">west</span> Return to Hub
          </Link>
      </div>
      <div className="flex-1 overflow-hidden">
        <IndustrialGanttChart sheetId={currentDocId} />
      </div>
    </div>
  );
}
