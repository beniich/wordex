"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Link from "next/link";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import BubbleMenu from "@tiptap/extension-bubble-menu";

import FloatingAIChat from "@/components/ai/FloatingAIChat";
import AIBubbleMenu from "@/components/editor/AIBubbleMenu";
import SecureCollaborativeEditor from "@/components/editor/SecureCollaborativeEditor";
import { 
  documents, 
  workspaces, 
  Workspace, 
  Document as DocType, 
  ai as aiAPI, 
  exports as exportsAPI, 
  comments,
  APIComment
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

export default function WorkspacePage() {
  const params = useParams();
  const { user } = useAuth();
  const workspaceId = params.id as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [currentDoc, setCurrentDoc] = useState<DocType | null>(null);
  const [allDocs, setAllDocs] = useState<DocType[]>([]);
  
  interface Collaborator {
    name: string;
    color: string;
    id?: string;
  }
  
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [savingState, setSavingState] = useState<"saved" | "saving" | "unsaved">("saved");
  const [isConnected, setIsConnected] = useState(false);
  const { showToast } = useToast();
  const [commentsList, setCommentsList] = useState<APIComment[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const ydoc = useMemo(() => new Y.Doc(), []);
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const providerRef = useRef<HocuspocusProvider | null>(null);

  // Deterministic color generation for cursors
  const getUserColor = useMemo(() => (id: string) => {
    const colors = ["#894d0d", "#a76526", "#524439", "#d4a373", "#ccd5ae", "#e9edc9", "#faedcd"];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % (colors.length ?? 1)];
  }, []);

  // ── TipTap editor ─────────────────────────────────────────────────────────
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading:       { levels: [1, 2, 3] },
        blockquote:    {},
        bulletList:    {},
        orderedList:   {},
        horizontalRule: {},
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      ...(provider ? [
        CollaborationCursor.configure({
          provider: provider,
          user: {
            name: user?.username || "Artisan",
            color: getUserColor(user?.id || "anon"),
          },
        })
      ] : []),
      BubbleMenu.configure({
        pluginKey: "aiBubbleMenu",
      }),
    ],
    editorProps: {
      attributes: {
        class: "prose prose-stone prose-lg max-w-none focus:outline-none focus:ring-0 selection:bg-[#ffdcc2] selection:text-[#6d3a00]",
      },
    },
    onUpdate: ({ editor }) => {
      setSavingState("unsaved");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      
      saveTimer.current = setTimeout(async () => {
        if (!currentDoc) return;
        setSavingState("saving");
        try {
          await documents.update(currentDoc.id, {
            content: editor.getJSON(),
            content_text: editor.getText(),
          });
          setSavingState("saved");
        } catch (err) {
          console.error("Save failed:", err);
          setSavingState("unsaved");
          showToast("Cloud sync failed. Retrying...", "error");
        }
      }, 3000);
    },
  }, [provider]); // Depend on provider to re-init extension chain

  // ── Real-time & Data Fetching ─────────────────────────────────────────────
  useEffect(() => {
    if (!workspaceId || !editor) return;

    const initWorkspace = async () => {
      try {
        const ws = await workspaces.get(workspaceId);
        setWorkspace(ws);

        const docs = await documents.list(workspaceId);
        setAllDocs(docs);

        const cms = await comments.list(docs[0]?.id || "");
        setCommentsList(cms);
        
        if (docs.length > 0) {
          setCurrentDoc(docs[0]);
        } else {
          const newDoc = await documents.create(workspaceId, "My First Masterpiece");
          setAllDocs([newDoc]);
          setCurrentDoc(newDoc);
        }
      } catch (err) {
        console.error("Initialization failed:", err);
      }
    };

    initWorkspace();
  }, [workspaceId, editor]);

  // Connect provider when currentDoc is set
  useEffect(() => {
    if (!currentDoc) return;

    if (providerRef.current) {
      providerRef.current.destroy();
    }

    const token = localStorage.getItem("wordex_access_token") || "";
    
    const newProvider = new HocuspocusProvider({
      url: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:1234",
      name: currentDoc.id,
      document: ydoc,
      token,
      onAuthenticationFailed: ({ reason }) => {
        console.error("Hocuspocus Auth Failed:", reason);
      },
      onStatus: ({ status }) => {
        setIsConnected(status === "connected");
      },
      onAwarenessChange: ({ states }) => {
        setCollaborators(states.map(s => s.user).filter(Boolean));
      }
    });
    
    setProvider(newProvider);
    providerRef.current = newProvider;

    return () => {
      newProvider.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDoc, editor, user]); 

  const generateSummary = async () => {
    if (!editor) return;
    setSavingState("saving");
    try {
      const res = await aiAPI.summarize(editor.getText(), "bullets");
      if (res.summary) {
        // Pour l'instant, on l'ajoute à la fin du document ou on l'affiche
        editor.chain().focus().insertContent(`\n\n### Synthèse IA\n${res.summary}`).run();
      }
      setSavingState("saved");
    } catch (err) {
      console.error("Summary failed:", err);
      setSavingState("unsaved");
    }
  };

  const analyzeContent = async () => {
    if (!editor) return;
    setSavingState("saving");
    try {
      const res = await aiAPI.analyze(editor.getText());
      if (res.analysis) {
        editor.chain().focus().insertContent(`\n\n### Analyse Contextuelle\n${res.analysis}`).run();
      }
      setSavingState("saved");
    } catch (err) {
      console.error("Analysis failed:", err);
      setSavingState("unsaved");
    }
  };

  const handleExport = async (format: "pdf" | "docx" | "pptx" | "markdown") => {
    if (!currentDoc) return;
    try {
       await exportsAPI.downloadWithAuth(currentDoc.id, format);
    } catch (e) {
       console.error("Export failed:", e);
    }
    setExportOpen(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast("Link copied to clipboard", "success");
  };

  const handleResolveComment = async (id: string) => {
    try {
      await comments.resolve(id);
      // Also resolve children? Or just hide parent? Usually resolve hides the whole thread.
      setCommentsList(prev => prev.filter((c: APIComment) => c.id !== id && c.parent_id !== id));
      showToast("Comment resolved", "success");
    } catch (e) {
      console.error("Resolve failed:", e);
      showToast("Failed to resolve comment", "error");
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim() || !currentDoc) return;
    try {
      const newReply = await comments.create(currentDoc.id, replyContent, parentId);
      setCommentsList(prev => [...prev, newReply]);
      setReplyContent("");
      setReplyingTo(null);
      showToast("Reply vaulted", "success");
    } catch {
      showToast("Failed to archive reply", "error");
    }
  };

  // Grouping comments by hierarchy
  const threadedComments = useMemo(() => {
    const mainComments = commentsList.filter(c => !c.parent_id);
    return mainComments.map(parent => ({
      ...parent,
      replies: commentsList.filter(c => c.parent_id === parent.id)
    }));
  }, [commentsList]);

  return (
    <div className="bg-surface min-h-screen font-body text-[#1c1c1a] overflow-x-hidden selection:bg-[#ffdcc2] selection:text-[#6d3a00]" style={{ fontFamily: "'Manrope', sans-serif" }}>
      
      {/* Top Navigation Anchor */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 max-w-7xl mx-auto rounded-3xl mt-4 mx-4 bg-orange-50/60 backdrop-blur-3xl shadow-[0_20px_40px_rgba(28,28,26,0.04)] border border-[#d8c3b4]/30">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-xl font-black tracking-tighter text-[#894d0d] hover:opacity-80 transition-opacity">
            Aether Suite
          </Link>
          <div className="hidden md:flex gap-6 items-center">
            <span className="w-1 h-4 bg-[#894d0d]/30 rounded-full"></span>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#894d0d] leading-none mb-1">{workspace?.name || "Crafting..."}</span>
              <span className="text-xs font-bold text-[#1c1c1a] leading-none line-clamp-1">{currentDoc?.title || "Drafting masterpiece"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Collaborators List */}
          <div className="flex -space-x-2 mr-2">
            {collaborators.map((collab, idx) => (
              <div 
                key={idx} 
                className="w-8 h-8 rounded-full border-2 border-orange-50 flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                style={{ backgroundColor: collab.color }}
                title={collab.name}
              >
                {collab.name.charAt(0)}
              </div>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/40 border border-[#d8c3b4]/30 text-[10px] font-bold text-[#524439]">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-400"}`}></span>
            <span className="uppercase tracking-widest">{isConnected ? "Live Session" : "Offline"}</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/40 border border-[#d8c3b4]/30 text-[10px] font-bold text-[#524439]">
            <span className={`w-1.5 h-1.5 rounded-full ${savingState === "saved" ? "bg-emerald-600" : savingState === "saving" ? "bg-amber-500 animate-pulse" : "bg-red-400"}`}></span>
            <span className="uppercase tracking-widest">{savingState === "saved" ? "Vaulted" : savingState === "saving" ? "Archiving..." : "Drafting"}</span>
          </div>
          <button 
            onClick={handleShare}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-[#894d0d] px-4 py-2 rounded-xl hover:scale-105 transition-all shadow-md relative"
          >
            <span className="material-symbols-outlined text-[16px]">share</span>
          </button>
          <div className="w-8 h-8 rounded-full border border-[#d8c3b4] bg-[#a76526] flex items-center justify-center text-white text-xs font-black shadow-sm">
            {workspace?.name.charAt(0) || "W"}
          </div>
        </div>
      </nav>

      <main className="pt-24 min-h-screen flex max-w-[1700px] mx-auto">
        
        {/* Left Sidebar: Outline Panel */}
        <aside className="fixed left-0 top-24 bottom-6 w-64 xl:w-72 ml-4 md:ml-6 bg-orange-50/40 backdrop-blur-2xl rounded-[2rem] p-6 border border-[#d8c3b4]/30 shadow-[20px_0_40px_rgba(28,28,26,0.03)] overflow-y-auto no-scrollbar hidden lg:flex flex-col z-40 transition-all duration-300">
          <div className="mb-8">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#894d0d] mb-2 block">Navigation</span>
            <h3 className="text-xl font-black text-[#1c1c1a]">Archives</h3>
          </div>
          
          <div className="space-y-2">
            {allDocs.map((doc) => (
              <button 
                key={doc.id}
                onClick={() => setCurrentDoc(doc)}
                className={`w-full flex items-center gap-3 p-3 text-xs rounded-xl transition-all font-black uppercase tracking-widest hover:translate-x-1 ${currentDoc?.id === doc.id ? 'bg-gradient-to-tr from-[#894d0d] to-[#a76526] text-white shadow-lg' : 'text-[#524439] hover:bg-white/50'}`}
              >
                <span className="material-symbols-outlined text-[18px]">{doc.doc_type === 'note' ? 'description' : 'table_chart'}</span>
                <span className="truncate">{doc.title}</span>
              </button>
            ))}
            
            <div className="pt-4 border-t border-[#d8c3b4]/30 mt-4 space-y-2">
              <Link href={`/workspace/${workspaceId}/sheets`} className="w-full flex items-center gap-3 p-3 text-xs text-[#524439] hover:bg-white/50 rounded-xl transition-all font-black uppercase tracking-widest hover:translate-x-1">
                <span className="material-symbols-outlined text-[18px]">table_chart</span>
                <span>Sheets</span>
              </Link>
              <Link href={`/workspace/${workspaceId}/gantt`} className="w-full flex items-center gap-3 p-3 text-xs text-[#524439] hover:bg-white/50 rounded-xl transition-all font-black uppercase tracking-widest hover:translate-x-1">
                <span className="material-symbols-outlined text-[18px]">calendar_view_day</span>
                <span>Schedule</span>
              </Link>
              <Link href={`/workspace/${workspaceId}/analytics`} className="w-full flex items-center gap-3 p-3 text-xs text-[#524439] hover:bg-white/50 rounded-xl transition-all font-black uppercase tracking-widest hover:translate-x-1">
                <span className="material-symbols-outlined text-[18px]">monitoring</span>
                <span>Analytics</span>
              </Link>
              <Link href={`/workspace/${workspaceId}/dashboard`} className="w-full flex items-center gap-3 p-3 text-xs text-[#524439] hover:bg-white/50 rounded-xl transition-all font-black uppercase tracking-widest hover:translate-x-1">
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
                <span>Control Tower</span>
              </Link>
              <Link href="/admin/treasury" className="w-full flex items-center gap-3 p-3 text-xs text-[#524439] hover:bg-white/50 rounded-xl transition-all font-black uppercase tracking-widest hover:translate-x-1">
                <span className="material-symbols-outlined text-[18px]">account_balance</span>
                <span>Treasury</span>
              </Link>
            </div>
          </div>
          
          <div className="mt-auto">
            <button 
              onClick={async () => {
                try {
                  const newDoc = await documents.create(workspaceId, "Untitled Masterpiece");
                  setAllDocs([...allDocs, newDoc]);
                  setCurrentDoc(newDoc);
                  showToast("New masterpiece archived", "success");
                } catch {
                   showToast("Failed to create archive", "error");
                }
              }}
              className="w-full py-4 bg-[#894d0d] text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-[#894d0d]/20 hover:brightness-110"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Canvas
            </button>
          </div>
        </aside>

        {/* Central Paper Area */}
        <section className="flex-1 px-4 lg:pl-[320px] xl:pl-[340px] lg:pr-6 xl:pr-[360px] pb-24 w-full relative z-10 transition-all">
          
          {/* Floating Toolbar */}
          <div className="sticky top-28 z-40 flex justify-center mb-12">
            <div className="bg-[#31302e]/95 backdrop-blur-xl px-3 py-1.5 rounded-2xl flex items-center gap-1 shadow-2xl border border-white/5 mx-auto">
              <button 
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={`p-2 rounded-lg transition-colors ${editor?.isActive('bold') ? 'bg-white/20 text-white shadow-inner' : 'text-white/50 hover:text-white'}`}>
                <span className="material-symbols-outlined text-[20px]">format_bold</span>
              </button>
              <button 
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={`p-2 rounded-lg transition-colors ${editor?.isActive('italic') ? 'bg-white/20 text-white shadow-inner' : 'text-white/50 hover:text-white'}`}>
                <span className="material-symbols-outlined text-[20px]">format_italic</span>
              </button>
              <div className="w-[1px] h-6 bg-white/10 mx-2"></div>
              <button 
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-2 rounded-lg transition-colors ${editor?.isActive('heading', { level: 2 }) ? 'bg-primary text-white shadow-md' : 'text-white/50 hover:text-white'}`}>
                <span className="material-symbols-outlined text-[20px]">format_h2</span>
              </button>
              <button 
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                className={`p-2 rounded-lg transition-colors ${editor?.isActive('blockquote') ? 'bg-white/20 text-white shadow-inner' : 'text-white/50 hover:text-white'}`}>
                <span className="material-symbols-outlined text-[20px]">format_quote</span>
              </button>
              <div className="w-px h-6 bg-outline-variant/20 mx-2 hidden sm:block" />
              
              {/* AI Actions */}
              <button 
                onClick={generateSummary}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/40 text-primary-foreground hover:bg-primary transition-all text-[10px] font-black uppercase tracking-widest border border-white/5"
                title="Générer une synthèse"
              >
                <span className="material-symbols-outlined text-[18px]">summarize</span>
                Synthèse
              </button>
              <button 
                onClick={analyzeContent}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-white/5"
                title="Analyser le contenu"
              >
                <span className="material-symbols-outlined text-[18px]">psychology</span>
                Analyse
              </button>
              
              <Link
                href={`/workspace/${workspaceId}/slides?generate=true&source_doc_id=${currentDoc?.id || ""}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#006576]/40 text-cyan-200 hover:bg-[#006576] transition-all text-[10px] font-black uppercase tracking-widest border border-white/5 ml-1"
                title="Transformer en Présentation"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome_motion</span>
                Slides
              </Link>
              
              <div className="w-[1px] h-6 bg-white/10 mx-2"></div>
              
              <div className="relative">
                <button 
                  onClick={() => setExportOpen(!exportOpen)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest border border-white/5"
                  title="Export Document"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Export
                </button>
                {exportOpen && (
                  <div className="absolute top-full left-0 mt-2 w-36 bg-[#31302e]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-2 flex flex-col items-start z-50 overflow-hidden">
                    {(["pdf", "docx", "pptx", "markdown"] as const).map(fmt => (
                      <button 
                        key={fmt} 
                        onClick={() => handleExport(fmt)}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-white hover:bg-white/10 uppercase tracking-widest transition-colors flex items-center gap-2"
                      >
                         <span className="material-symbols-outlined text-[20px]">
                          {currentDoc?.doc_type === 'note' ? 'description' : (currentDoc?.doc_type === 'spreadsheet' ? 'table_chart' : 'slideshow')}
                        </span>
                         {fmt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Document Content Container (The Safe) ────────────────── */}
          <SecureCollaborativeEditor isLive={isConnected}>
            <div className="max-w-[850px] mx-auto p-12 md:p-20 relative min-h-[1200px] paper-texture group-hover/editor:bg-stone-50/20 transition-colors">
              
              <div className="absolute top-12 right-12 text-[9px] font-black tracking-[0.4em] text-outline opacity-60 uppercase">
                AETHER-DOC-091
              </div>

              <header className="mb-14">
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-foreground mb-8 leading-[1.05]">
                  {currentDoc?.title || "Drafting masterpiece"}
                </h1>
                <div className="flex items-center gap-6 text-outline text-xs font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span> Oct 24, 2024
                  </div>
                  <span className="w-1.5 h-1.5 bg-outline-variant rounded-full"></span>
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-[18px]">schedule</span> 12 min read
                  </div>
                </div>
              </header>

              <div className="relative group/editor">
                {editor && <AIBubbleMenu editor={editor} />}
                <EditorContent editor={editor} />
              </div>
            </div>
          </SecureCollaborativeEditor>

        </section>

        {/* Right Sidebar: Collaboration Panel */}
        <aside className="fixed right-0 top-24 bottom-6 w-80 mr-4 md:mr-6 bg-surface/40 backdrop-blur-2xl rounded-[2rem] p-6 border border-outline-variant/30 shadow-lg hidden xl:flex flex-col z-40 transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Collaboration</h3>
            <span className="px-3 py-1 bg-primary text-white text-[9px] font-black rounded-full tracking-widest shadow-md">3 ACTIVE</span>
          </div>
          
          <div className="flex -space-x-3 mb-10 overflow-hidden pl-1">
             {[1,2,3].map(i => (
               <div key={i} className="h-9 w-9 rounded-full border-2 border-surface overflow-hidden shadow-sm ring-1 ring-primary/5 transition-transform hover:scale-110 cursor-pointer bg-surface-container-low flex items-center justify-center">
                  <span className="text-[10px] font-black text-primary opacity-40">{String.fromCharCode(64 + i)}</span>
               </div>
             ))}
             <div className="h-9 w-9 rounded-full border-2 border-surface bg-surface-container text-outline flex items-center justify-center text-[10px] font-black shadow-sm ring-1 ring-primary/5">
                +2
             </div>
          </div>
          
          <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pr-1">
            {threadedComments.map((comment) => (
              <div key={comment.id} className="group/thread">
                <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-outline-variant/20 hover:border-primary/30 transition-all hover:shadow-md group">
                  <div className="flex items-center justify-between mb-3 underline decoration-outline-variant/30 underline-offset-4">
                    <span className="text-[11px] font-black text-foreground">Artisan</span>
                    <span className="text-[9px] font-bold text-outline uppercase tracking-[0.1em]">
                      {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-outline leading-relaxed mb-4 font-medium italic">
                    &quot;{comment.content}&quot;
                  </p>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className={`text-[10px] uppercase font-black tracking-widest transition-all ${replyingTo === comment.id ? 'text-foreground' : 'text-primary hover:brightness-110'}`}
                    >
                      {replyingTo === comment.id ? "Cancel" : "Reply"}
                    </button>
                    <button 
                      onClick={() => handleResolveComment(comment.id)}
                      className="text-[10px] uppercase font-black tracking-widest text-outline-variant hover:text-foreground transition-all"
                    >
                      Resolve
                    </button>
                  </div>
                  
                  {/* Reply Input */}
                  {replyingTo === comment.id && (
                    <div className="mt-4 pt-4 border-t border-outline-variant/20 animate-in fade-in slide-in-from-top-2">
                       <textarea 
                         autoFocus
                         value={replyContent}
                         onChange={(e) => setReplyContent(e.target.value)}
                         placeholder="Add to the scroll..."
                         className="w-full bg-surface border border-outline-variant/30 rounded-xl p-3 text-xs text-outline focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none min-h-[60px]"
                       />
                       <div className="flex justify-end mt-2">
                         <button 
                           onClick={() => handleReply(comment.id)}
                           className="bg-inverse-surface text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all"
                         >
                           Vault Reply
                         </button>
                       </div>
                    </div>
                  )}
                </div>

                {/* Replies Rendering */}
                {comment.replies.length > 0 && (
                  <div className="ml-6 mt-3 space-y-3 border-l-2 border-outline-variant/20 pl-4">
                    {comment.replies.map((reply: APIComment) => (
                      <div key={reply.id} className="bg-white/40 backdrop-blur-sm p-4 rounded-xl border border-outline-variant/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-primary">Reply</span>
                          <p className="text-[10px] font-bold text-outline uppercase tracking-widest leading-none mt-1">
                            {new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <p className="text-[11px] text-outline leading-relaxed font-medium">
                          {reply.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {commentsList.length === 0 && (
              <p className="text-[10px] text-center text-outline uppercase font-bold tracking-widest opacity-40 py-8">
                No active discussions
              </p>
            )}

            {/* Version History Separator */}
            <div className="relative py-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/30"></div></div>
              <div className="relative flex justify-center"><span className="bg-surface px-3 font-black text-[9px] text-outline uppercase tracking-[0.3em] rounded-md backdrop-blur-sm">Version History</span></div>
            </div>

            <div className="space-y-5">
              <div className="flex gap-4 group cursor-pointer">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)] group-hover:scale-125 transition-transform"></div>
                <div>
                  <p className="text-xs font-black text-[#1c1c1a]">V2.4 — Final Polish</p>
                  <p className="text-[9px] uppercase tracking-widest font-black text-primary mt-1 opacity-70">Current Version</p>
                </div>
              </div>
              <div className="flex gap-4 group cursor-pointer opacity-40 hover:opacity-100 transition-opacity">
                <div className="w-2 h-2 rounded-full bg-outline-variant mt-1.5 group-hover:bg-primary transition-colors"></div>
                <div>
                  <p className="text-xs font-bold text-[#524439]">V2.3 — Outline Redux</p>
                  <p className="text-[9px] uppercase tracking-widest font-black text-outline mt-1">Yesterday, 11:42 PM</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <FloatingAIChat defaultAgent="editor" contextData={editor?.getText()} documentId={currentDoc?.id} />

      {/* Editor Styles injected to override prose defaults with Sable Cuivre theme */}
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .paper-texture {
            background-color: #fcf9f5;
            background-image: radial-gradient(#d8c3b4 0.5px, transparent 0.5px);
            background-size: 24px 24px;
        }

        .ProseMirror p {
           font-size: 1.125rem;
           line-height: 1.8;
           color: #524439;
           margin-bottom: 2rem;
        }
        .ProseMirror p:first-of-type {
           font-size: 1.25rem;
           color: #1c1c1a;
        }
        .ProseMirror p:first-of-type::first-letter {
           font-size: 5rem;
           font-weight: 900;
           color: #894d0d;
           float: left;
           margin-right: 1rem;
           line-height: 0.8;
           padding-top: 0.5rem;
        }
        .ProseMirror h2 {
           font-size: 1.75rem;
           font-weight: 900;
           tracking: -0.02em;
           color: #894d0d;
           margin-top: 4rem;
           margin-bottom: 1.5rem;
        }
        .ProseMirror blockquote {
           border-left: 5px solid #894d0d;
           padding: 1.5rem 2.5rem;
           margin: 3rem 0;
           font-size: 1.4rem;
           font-style: italic;
           color: #1c1c1a;
           font-weight: 700;
           background: linear-gradient(90deg, rgba(137,77,13,0.06) 0%, rgba(255,255,255,0) 100%);
           border-radius: 0 1rem 1rem 0;
        }
        .ProseMirror ul {
           list-style-type: square;
           margin-left: 1.5rem;
           color: #524439;
        }
      `}} />
    </div>
  );
}
