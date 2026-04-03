"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
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

  const getUserColor = useMemo(() => (id: string) => {
    const colors = ["#894d0d", "#a76526", "#524439", "#d4a373", "#ccd5ae", "#e9edc9", "#faedcd"];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
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
    ],
    editorProps: {
      attributes: {
        class: "prose prose-stone prose-lg max-w-none focus:outline-none selection:bg-[#ffdcc2]",
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
        } catch {}
      }, 3000);
    },
  }, [provider]);

  useEffect(() => {
    if (!workspaceId) return;
    const initWorkspace = async () => {
      try {
        const docs = await documents.list(workspaceId);
        setAllDocs(docs);
        if (docs.length > 0) {
          setCurrentDoc(docs[0]);
          const cms = await comments.list(docs[0].id);
          setCommentsList(cms);
        }
      } catch (err) {
        console.error("Init failed", err);
      }
    };
    initWorkspace();
  }, [workspaceId]);

  useEffect(() => {
    if (!currentDoc) return;
    if (providerRef.current) providerRef.current.destroy();
    
    const token = localStorage.getItem("wordex_access_token") || "";
    const newProvider = new HocuspocusProvider({
      url: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:1234",
      name: currentDoc.id,
      document: ydoc,
      token,
      onStatus: ({ status }) => setIsConnected(status === "connected"),
      onAwarenessChange: ({ states }) => setCollaborators(states.map(s => s.user).filter(Boolean)),
    });
    
    setProvider(newProvider);
    providerRef.current = newProvider;
    
    return () => newProvider.destroy();
  }, [currentDoc, user, ydoc]);

  const handleExport = async (format: "pdf" | "docx") => {
    if (!currentDoc) return;
    try { await exportsAPI.downloadWithAuth(currentDoc.id, format); } catch {}
    setExportOpen(false);
  };

  return (
    <div className="p-8 lg:p-12 w-full max-w-5xl mx-auto">
      {currentDoc ? (
        <WorkspaceEditor 
          currentDoc={currentDoc} 
          workspaceId={workspaceId} 
          user={user} 
        />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
          <div className="w-12 h-12 border-4 border-[#894d0d] border-t-transparent rounded-full animate-spin shadow-xl shadow-[#894d0d]/20" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#894d0d] animate-pulse">Initializing Artisanal Canvas</p>
        </div>
      )}
      <FloatingAIChat workspaceId={workspaceId} />
    </div>
  );
}

// ── Isolated Editor Component ──────────────────────────────────────────────────

function WorkspaceEditor({ currentDoc, workspaceId, user }: { currentDoc: DocType, workspaceId: string, user: any }) {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [savingState, setSavingState] = useState<"saved" | "saving" | "unsaved">("saved");
  
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const ydoc = useMemo(() => new Y.Doc(), [currentDoc.id]);

  const getUserColor = useMemo(() => (id: string) => {
    const colors = ["#894d0d", "#a76526", "#524439", "#d4a373", "#ccd5ae", "#e9edc9", "#faedcd"];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }, []);

  // Initialize Provider deterministically
  useEffect(() => {
    const token = localStorage.getItem("wordex_access_token") || "";
    const newProvider = new HocuspocusProvider({
      url: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:1234",
      name: currentDoc.id,
      document: ydoc,
      token,
      onStatus: ({ status }) => setIsConnected(status === "connected"),
      onAwarenessChange: ({ states }) => setCollaborators(states.map(s => s.user).filter(Boolean)),
    });
    
    setProvider(newProvider);
    return () => newProvider.destroy();
  }, [currentDoc.id, ydoc]);

  // Always include StarterKit (provides the 'doc' schema node). Add collaborative
  // extensions only once provider is ready to avoid schema-missing crashes.
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // Disable built-in history when collaboration is active
        history: provider ? false : undefined,
      }),
      ...(provider ? [
        Collaboration.configure({
          document: ydoc,
        }),
        CollaborationCursor.configure({
          provider: provider,
          user: {
            name: user?.username || "Artisan",
            color: getUserColor(user?.id || "anon"),
          },
        }),
      ] : []),
    ],
    editorProps: {
      attributes: {
        class: "prose prose-stone prose-lg max-w-none focus:outline-none selection:bg-[#ffdcc2]",
      },
    },
    onUpdate: ({ editor }) => {
      setSavingState("unsaved");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        setSavingState("saving");
        try {
          await documents.update(currentDoc.id, {
            content: editor.getJSON(),
            content_text: editor.getText(),
          });
          setSavingState("saved");
        } catch {}
      }, 3000);
    },
  }, [provider]); // Depend on provider to mount cleanly once

  const handleExport = async (format: "pdf" | "docx") => {
    try { await exportsAPI.downloadWithAuth(currentDoc.id, format); } catch {}
    setExportOpen(false);
  };

  if (!provider || !editor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
        <div className="w-12 h-12 border-4 border-[#894d0d] border-t-transparent rounded-full animate-spin shadow-xl shadow-[#894d0d]/20" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#894d0d] animate-pulse">Establishing Secure Nexus</p>
      </div>
    );
  }

  return (
    <>
      <div className="sticky top-28 z-[40] flex justify-center mb-12">
        <div className="bg-[#31302e]/98 backdrop-blur-3xl px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl border border-white/10 mx-auto transition-all">
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded-xl transition-colors ${editor.isActive('bold') ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}>
             <span className="material-symbols-outlined text-[20px]">format_bold</span>
          </button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded-xl transition-colors ${editor.isActive('italic') ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}>
             <span className="material-symbols-outlined text-[20px]">format_italic</span>
          </button>
          <div className="w-[1px] h-6 bg-white/10 mx-2"></div>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-2 rounded-xl transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-[#A67B5B] text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>
             <span className="material-symbols-outlined text-[20px]">format_h2</span>
          </button>
          
          <div className="w-[1px] h-6 bg-white/10 mx-2"></div>
          
          <div className="flex items-center gap-1">
            <button onClick={() => setExportOpen(!exportOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 text-white/80 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest border border-white/5">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export
            </button>
            {exportOpen && (
              <div className="absolute top-full right-0 mt-3 w-40 bg-[#31302e] border border-white/10 rounded-xl shadow-2xl py-2 z-50 overflow-hidden">
                <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2 text-[10px] font-black text-white hover:bg-white/10 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span> PDF
                </button>
                <button onClick={() => handleExport('docx')} className="w-full text-left px-4 py-2 text-[10px] font-black text-white hover:bg-white/10 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">description</span> DOCX
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed top-28 right-8 flex flex-col gap-3 z-50">
        {collaborators.map((c, i) => (
          <div key={i} className="w-10 h-10 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-[10px] font-black text-white transform hover:scale-110 transition-all" style={{ backgroundColor: c.color }} title={c.name}>
            {c.name?.charAt(0) || "?"}
          </div>
        ))}
      </div>

      <SecureCollaborativeEditor isLive={isConnected}>
        <div className="bg-white p-12 md:p-24 rounded-[3rem] shadow-2xl shadow-black/5 min-h-[1000px] relative border border-[#d8c3b4]/10 transition-all hover:border-[#d8c3b4]/30">
          <div className="absolute top-12 right-12 text-[9px] font-black tracking-[0.4em] text-[#894d0d] opacity-30 uppercase">
             WORDEX-INDEX-{currentDoc.id.slice(0, 5) || "0000"}
          </div>
          <header className="mb-16">
            <h1 className="text-5xl lg:text-7xl font-black text-[#1c1c1a] tracking-tighter leading-[0.95] mb-8">
              {currentDoc.title || "Drafting masterpiece"}
            </h1>
            <div className="flex items-center gap-6 text-[#524439]/60 text-[10px] font-black uppercase tracking-widest">
               <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">edit_note</span> ARCHIVED</div>
               <span className="w-1 h-1 bg-[#894d0d]/30 rounded-full"></span>
               <div className="flex items-center gap-1.5 text-[#894d0d]"><span className="material-symbols-outlined text-[16px]">bolt</span> {isConnected ? "LIVE SYNC" : "SAVED"}</div>
            </div>
          </header>

          <article className="prose-editor">
             <AIBubbleMenu editor={editor} />
             <EditorContent editor={editor} />
          </article>
        </div>
      </SecureCollaborativeEditor>

      <style jsx global>{`
        .prose-editor {
          font-family: 'Crimson Pro', serif;
        }
        .ProseMirror {
          min-height: 500px;
          outline: none;
        }
        .ProseMirror p {
          font-size: 1.25rem;
          line-height: 1.8;
          color: #2b2b28;
          margin-bottom: 2rem;
        }
        .ProseMirror h2 {
          font-size: 2rem;
          font-weight: 900;
          color: #894d0d;
          margin-top: 4rem;
          margin-bottom: 1.5rem;
          letter-spacing: -0.02em;
        }
      `}</style>
    </>
  );
}
