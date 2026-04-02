"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { documents } from "@/lib/api";
import { ExcelStyleSheet } from "@/components/sheets/ExcelStyleSheet";
import Link from "next/link";

export default function SheetsPage() {
  const params = useParams();
  const workspaceId = (params.id as string) ?? "demo-ws";

  const [currentDocId, setCurrentDocId] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    const initSheets = async () => {
      try {
        const docs = await documents.list(workspaceId) || [];
        const sheetDocs = Array.isArray(docs) ? docs.filter(d => d.doc_type === "spreadsheet") : [];
        
        if (sheetDocs.length > 0) {
          setCurrentDocId(sheetDocs[0].id);
        } else {
          const newDoc = await documents.create(workspaceId, "Main Budget", "spreadsheet");
          if (newDoc?.id) setCurrentDocId(newDoc.id);
        }
      } catch (err) {
        console.error("Failed to initialize sheets:", err);
      }
    };

    initSheets();
  }, [workspaceId]);

  if (!currentDocId) {
    return (
      <div className="h-screen flex flex-col bg-[#F5F1E6] items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#A67B5B] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[#2D2D2D] font-bold tracking-widest uppercase text-xs">Loading Workbooks...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col relative overflow-hidden bg-[#F5F1E6]">
      {/* Optional Top Nav to return to workspace */}
      <div className="absolute top-2 left-4 z-50">
          <Link href={`/workspace/${workspaceId}`} className="text-[#A67B5B] hover:text-[#894d0d] font-bold text-xs bg-white/80 p-2 rounded-md shadow-sm border border-[#DCC6A0] backdrop-blur-md flex items-center gap-1 transition-all">
             ← Back to Workspace
          </Link>
      </div>
      <ExcelStyleSheet sheetId={currentDocId} />
    </div>
  );
}
