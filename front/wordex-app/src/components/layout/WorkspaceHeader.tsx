"use client";

import { useState } from "react";
import { Share2, Loader2, Download } from "lucide-react";

interface ActiveUser {
  id: string;
  name: string;
  color: string;
}

interface WorkspaceHeaderProps {
  documentTitle?: string;
  workspaceName?: string;
  savingState?: "saved" | "saving" | "unsaved";
  activeUsers?: ActiveUser[];
  onTitleChange?: (title: string) => void;
  onShare?: () => void;
  onExport?: (format: "pdf" | "docx" | "pptx" | "markdown") => void;
}

const SAVE_LABEL: Record<string, { label: string; className: string }> = {
  saved:   { label: "Vaulted",  className: "text-primary bg-[#894d0d]/5 border-[#894d0d]/10" },
  saving:  { label: "Archiving...",   className: "text-[#a76526] bg-[#a76526]/5 border-[#a76526]/20" },
  unsaved: { label: "Drafting",     className: "text-outline bg-[#f6f3ef] border-[#d8c3b4]/30" },
};

export default function WorkspaceHeader({
  documentTitle = "Untitled Masterpiece",
  workspaceName = "Workspace",
  savingState = "saved",
  activeUsers = [],
  onTitleChange,
  onShare,
  onExport,
}: WorkspaceHeaderProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(documentTitle);
  const [exportOpen, setExportOpen] = useState(false);

  const save = SAVE_LABEL[savingState];

  const handleTitleBlur = () => {
    setEditingTitle(false);
    if (title.trim()) onTitleChange?.(title.trim());
  };

  return (
    <header className="h-20 shrink-0 flex items-center justify-between px-8 bg-surface/80 backdrop-blur-3xl gap-6 border-b border-outline-variant/10 sticky top-0 z-50 overflow-hidden font-body">
      
      {/* HUD Accent Line (Top) */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-transparent via-primary/20 to-transparent opacity-50"></div>

      {/* Left: breadcrumb + editable title */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="hidden sm:flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary leading-none mb-1 opacity-60">
            {workspaceName}
          </span>
          <div className="flex items-center">
            {editingTitle ? (
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => e.key === "Enter" && handleTitleBlur()}
                className="bg-white/50 border border-primary/20 rounded-lg px-3 py-1 text-foreground font-black text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 w-64 shadow-inner"
                aria-label="Document title"
              />
            ) : (
              <button
                onClick={() => setEditingTitle(true)}
                title="Click to rename"
                className="text-foreground font-black text-lg tracking-tighter hover:text-primary transition-all decoration-primary/20 underline-offset-8 hover:underline truncate max-w-[200px] sm:max-w-md text-left"
              >
                {title}
              </button>
            )}
          </div>
        </div>

        {/* Save state indicator */}
        <span className={`hidden md:flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all duration-500 ml-4 ${save.className}`}>
          {savingState === "saving" ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            <span className={`w-1.5 h-1.5 rounded-full ${savingState === 'saved' ? 'bg-primary shadow-[0_0_8px_rgba(137,77,13,0.4)]' : 'bg-foreground/20'}`} />
          )}
          {save.label}
        </span>
      </div>

      {/* Right: active users + share + export */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Active users */}
        {activeUsers.length > 0 && (
          <div className="flex -space-x-3 items-center mr-2">
            {activeUsers.slice(0, 3).map((u) => (
              <div
                key={u.id}
                title={u.name}
                className="w-9 h-9 rounded-full border-2 border-surface flex items-center justify-center text-[10px] font-black text-white shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer overflow-hidden bg-cover bg-center"
                style={{ backgroundColor: u.color, backgroundImage: `url('https://i.pravatar.cc/100?u=${u.id}')` }}
              >
                <span className="bg-black/20 w-full h-full flex items-center justify-center backdrop-blur-[1px]">{u.name[0].toUpperCase()}</span>
              </div>
            ))}
            {activeUsers.length > 3 && (
              <div className="w-9 h-9 rounded-full border-2 border-surface bg-surface-container-high flex items-center justify-center text-[10px] font-black text-outline shadow-sm">
                +{activeUsers.length - 3}
              </div>
            )}
          </div>
        )}

        <div className="h-8 w-px bg-outline-variant/30 hidden sm:block mx-1"></div>

        {/* Export */}
        {onExport && (
          <div className="relative">
            <button
              onClick={() => setExportOpen((p) => !p)}
              className="h-11 px-4 flex items-center gap-2 rounded-xl text-outline hover:bg-primary/5 hover:text-primary transition-all font-black uppercase tracking-widest text-[10px] bg-white/40 border border-outline-variant/20"
            >
              <Download size={14} className="text-primary" />
              <span className="hidden lg:inline">Export</span>
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-3 w-44 bg-inverse-surface/95 backdrop-blur-2xl rounded-2xl py-2 z-100 shadow-2xl border border-white/5 overflow-hidden">
                {(["pdf", "docx", "pptx", "markdown"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => { onExport(fmt); setExportOpen(false); }}
                    className="w-full text-left px-5 py-3 text-[10px] font-black text-white/70 hover:text-white hover:bg-white/10 transition-all uppercase tracking-[0.2em] flex items-center gap-3"
                  >
                    <span className="material-symbols-outlined text-sm">{fmt === 'pdf' ? 'picture_as_pdf' : fmt === 'pptx' ? 'slideshow' : 'description'}</span>
                    {fmt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Share */}
        <button
          onClick={onShare}
          className="h-11 flex items-center gap-3 px-6 bg-linear-to-tr from-primary to-primary-container hover:brightness-110 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-[0_10px_30px_rgba(137,77,13,0.25)] transition-all hover:-translate-y-0.5 active:scale-95"
        >
          <Share2 size={14} />
          Share
        </button>
      </div>
    </header>
  );
}

