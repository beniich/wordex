"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import FloatingAIChat from "@/components/ai/FloatingAIChat";
import { documents, DocumentVersion, DocumentVersionDetail } from "@/lib/api";
import DiffMatchPatch from "diff-match-patch";

export default function HistoryPage() {
  const { id } = useParams() as { id: string };
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [selectedDetail, setSelectedDetail] = useState<DocumentVersionDetail | null>(null);

  const [compareMode, setCompareMode] = useState(false);
  const [comparing, setComparing] = useState<string>("");
  const [comparingDetail, setComparingDetail] = useState<DocumentVersionDetail | null>(null);

  useEffect(() => {
    if (id) {
      documents.versions(id).then((v) => {
        setVersions(v);
        if (v.length > 0) setSelected(v[0].id);
      }).catch(console.error);
    }
  }, [id]);

  useEffect(() => {
    if (selected && id) {
      documents.getVersion(id, selected).then(setSelectedDetail).catch(console.error);
    }
  }, [id, selected]);



  useEffect(() => {
    if (comparing && id) {
      documents.getVersion(id, comparing).then(setComparingDetail).catch(console.error);
    }
  }, [id, comparing]);

  const diffLines = useMemo(() => {
    if (!selectedDetail?.content_text || !comparingDetail?.content_text) return [];
    try {
        const dmp = new DiffMatchPatch();
        const rawDiff = dmp.diff_main(comparingDetail.content_text, selectedDetail.content_text);
        dmp.diff_cleanupSemantic(rawDiff);
        
        return rawDiff.map(([type, text]) => {
           let typeStr = "unchanged";
           if (type === -1) typeStr = "removed";
           else if (type === 1) typeStr = "added";
           return { type: typeStr, text };
        });
    } catch {
        return [];
    }
  }, [selectedDetail, comparingDetail]);

  const selectedVersion = versions.find((v) => v.id === selected);
  const comparingVersion = versions.find((v) => v.id === comparing);

  return (
    <AppShell title="Version History">
      <div className="flex" style={{ height: "calc(100vh - 64px)" }}>
        {/* Version list */}
        <div className="w-72 border-r border-indigo-50 bg-[#f2f3ff] overflow-y-auto flex-shrink-0">
          <div className="p-5 border-b border-indigo-100/20">
            <h2 className="font-bold text-[#131b2e] text-sm mb-3" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Version History
            </h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                className={`w-10 h-5 rounded-full transition-all duration-200 ${compareMode ? "bg-[#3a388b]" : "bg-[#c5c5d4]"}`}
                onClick={() => {
                   const newMode = !compareMode;
                   setCompareMode(newMode);
                   if (newMode && !comparing) {
                      const idx = versions.findIndex(v => v.id === selected);
                      if (idx >= 0 && idx + 1 < versions.length) {
                         setComparing(versions[idx + 1].id);
                      } else if (versions.length > 1) {
                         setComparing(versions[0].id === selected ? versions[1].id : versions[0].id);
                      }
                   }
                }}
              >
                <div className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-all duration-200 shadow-sm ${compareMode ? "ml-5" : "ml-0.5"}`} />
              </div>
              <span className="text-xs font-bold text-[#454652]">Compare mode</span>
            </label>
          </div>

          <div className="p-3 space-y-1 relative">
            <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-indigo-100 z-0" />
            {versions.map((v, i) => (
              <button
                key={v.id}
                onClick={() => setSelected(v.id)}
                className={`w-full text-left pl-10 pr-4 py-3 rounded-xl transition-all relative z-10
                  ${selected === v.id ? "bg-white shadow-sm border border-[#c5c5d4]/30" : "hover:bg-white/60"}`}
              >
                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white z-20"
                  style={{ background: i === 0 ? "#004c45" : selected === v.id ? "#3a388b" : "#c5c5d4" }} />
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black text-[#3a388b]">v{v.version}</span>
                  {i === 0 && (
                    <span className="px-1.5 py-0.5 bg-[#89f5e7] text-[#003d37] text-[9px] font-black rounded-full">
                      CURRENT
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#131b2e] font-medium line-clamp-2">Version {v.version}</p>
                <p className="text-[10px] text-[#454652] mt-1">{v.saved_by_name || "Unknown"} · {new Date(v.created_at).toLocaleString()}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8 py-5 border-b border-indigo-50 bg-white flex items-center gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-[#131b2e]" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Version {selectedVersion?.version}
              </h3>
              <p className="text-xs text-[#454652] mt-0.5">
                By {selectedVersion?.saved_by_name || "Unknown"} · {selectedVersion ? new Date(selectedVersion.created_at).toLocaleString() : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {versions[0]?.id !== selectedVersion?.id && (
                <button 
                  onClick={async () => {
                     if (selectedVersion) {
                        try {
                           await documents.restoreVersion(id, selectedVersion.id);
                           window.location.reload();
                        } catch (err) {}
                     }
                  }}
                  className="px-4 py-2 bg-[#004c45] text-white text-sm font-bold rounded-xl hover:bg-[#003d37] transition-all active:scale-95"
                >
                  Restore This Version
                </button>
              )}
              <button className="px-4 py-2 border border-[#c5c5d4]/40 text-sm font-bold text-[#3a388b] rounded-xl hover:bg-[#f2f3ff] transition-all">
                Export
              </button>
            </div>
          </div>

          {/* Compare selector */}
          {compareMode && (
            <div className="px-8 py-3 bg-[#eaedff] border-b border-indigo-100 flex items-center gap-3">
              <span className="text-xs font-bold text-[#454652]">Comparing</span>
              <span className="text-xs font-black text-[#3a388b] bg-white px-3 py-1 rounded-lg border border-[#c5c5d4]/40">v{selectedVersion?.version}</span>
              <span className="material-symbols-outlined text-[#454652] text-[18px]">compare_arrows</span>
              <select
                value={comparing}
                onChange={(e) => setComparing(e.target.value)}
                className="text-xs font-bold text-[#3a388b] bg-white px-3 py-1 rounded-lg border border-[#c5c5d4]/40 outline-none"
              >
                {versions.filter((v) => v.id !== selected).map((v) => (
                  <option key={v.id} value={v.id}>v{v.version} — {new Date(v.created_at).toLocaleString()}</option>
                ))}
              </select>
            </div>
          )}

          {/* Diff View */}
          <div className="flex-1 overflow-auto p-8">
            <div className="max-w-3xl mx-auto">
              {compareMode ? (
                <div className="bg-white rounded-2xl border border-indigo-50 shadow-sm overflow-hidden">
                  <div className="px-6 py-3 bg-[#f2f3ff] border-b border-indigo-50 grid grid-cols-2">
                    <span className="text-xs font-black text-red-600">v{comparingVersion?.version} — OLD</span>
                    <span className="text-xs font-black text-emerald-600">v{selectedVersion?.version} — NEW</span>
                  </div>
                  <div className="font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                    {diffLines.map((line, i) => (
                      <span
                        key={i}
                        className={`
                          ${line.type === "removed" ? "bg-red-200 text-red-900" :
                            line.type === "added" ? "bg-emerald-200 text-emerald-900" :
                            "text-[#454652]"}`}
                      >
                        {line.text}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-indigo-50 shadow-sm p-8 max-h-[600px] overflow-auto">
                   <pre className="font-mono text-xs whitespace-pre-wrap text-[#454652]">
                     {selectedDetail?.content_text || "No content available."}
                   </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <FloatingAIChat defaultAgent="editor" />
    </AppShell>
  );
}
