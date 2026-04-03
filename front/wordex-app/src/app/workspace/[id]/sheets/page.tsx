"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { documents } from "@/lib/api";
import { ExcelStyleSheet } from "@/components/sheets/ExcelStyleSheet";

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
      <div className="h-full w-full flex flex-col items-center justify-center p-20">
        <div className="w-10 h-10 border-4 border-[#894d0d] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[#894d0d] font-black tracking-[0.2em] uppercase text-[10px]">Initialisation de la Forge...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] w-full overflow-hidden p-6 lg:p-8">
       <div className="h-full w-full rounded-3xl overflow-hidden border border-[#d8c3b4]/30 shadow-2xl bg-white/40 backdrop-blur-sm">
          <ExcelStyleSheet sheetId={currentDocId} embedded={true} />
       </div>
    </div>
  );
}
