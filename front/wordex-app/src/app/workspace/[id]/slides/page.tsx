"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { documents, slides } from "@/lib/api";
import { PowerBIStyleSlides } from "@/components/slides/PowerBIStyleSlides";
import Link from "next/link";

export default function SlidesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceId = (params.id as string) ?? "demo-ws";

  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;

    const initSlides = async () => {
      try {
        const sourceDocId = searchParams.get("source_doc_id");
        const shouldGenerate = searchParams.get("generate") === "true";

        const response = await documents.list(workspaceId);
        const docs = Array.isArray(response) ? response : [];
        let presDoc = docs.find(d => d.doc_type === "presentation");

        if (!presDoc) {
          presDoc = await documents.create(workspaceId, "Executive Presentation", "presentation");
        }

        if (presDoc?.id) {
          setCurrentDocId(presDoc.id);
          
          if (shouldGenerate && sourceDocId) {
            setIsGenerating(true);
            try {
              await slides.generateFromDoc(presDoc.id, sourceDocId);
            } catch (err) {
              console.error("AI Generation failed:", err);
            } finally {
              setIsGenerating(false);
            }
          }
        }
      } catch (err) {
        console.error("Failed to initialize slides:", err);
        setCurrentDocId("temp-pres-id");
      }
    };

    initSlides();
  }, [workspaceId]);

  if (isGenerating || !currentDocId) {
    return (
      <div className="h-screen flex flex-col bg-[#F5F1E6] items-center justify-center p-8 text-center text-[#2D2D2D]">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 border-4 border-[#A67B5B]/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#A67B5B] border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <span className="material-symbols-outlined text-[32px] text-[#A67B5B] animate-pulse">
               {isGenerating ? 'auto_awesome' : 'hourglass_empty'}
             </span>
          </div>
        </div>
        <h2 className="text-2xl font-black mb-2 tracking-tight">
          {isGenerating ? 'Artisanal Incantation' : 'Preparing the Gallery'}
        </h2>
        <p className="text-[#A67B5B] font-medium max-w-md italic">
          {isGenerating 
            ? 'Translating your manuscript into the visual language of the Copper & Sand...' 
            : 'Sifting through the vaults of your creation...'}
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col relative overflow-hidden bg-[#F5F1E6]">
      <div className="absolute top-4 left-4 z-50">
        <Link href={`/workspace/${workspaceId}`} className="text-[#A67B5B] hover:text-white hover:bg-[#A67B5B] font-bold text-xs bg-white/80 p-2 rounded-md shadow-sm border border-[#DCC6A0] backdrop-blur-md flex items-center gap-1 transition-all">
          ← Back to Workspace
        </Link>
      </div>
      <PowerBIStyleSlides presentationId={currentDocId} />
    </div>
  );
}
