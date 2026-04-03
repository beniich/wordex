"use client";

import { useState, useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  workspaces, 
  Workspace, 
  documents,
  Document as DocType 
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// Helper for Material Symbols
const Icon = ({ name, size = 20, color = 'currentColor', className = "" }: { name: string, size?: number, color?: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`} style={{ fontSize: size, color }}>{name}</span>
);

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const { user } = useAuth();
  const workspaceId = params.id as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [allDocs, setAllDocs] = useState<DocType[]>([]);
  
  const isSheetPage = pathname.includes('/sheets');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(isSheetPage);

  useEffect(() => {
    if (!workspaceId) return;

    const loadWorkspace = async () => {
      try {
        const ws = await workspaces.get(workspaceId);
        setWorkspace(ws);
        const docs = await documents.list(workspaceId);
        setAllDocs(docs);
      } catch (err) {
        console.error("Workspace init failed:", err);
      }
    }
    loadWorkspace();
  }, [workspaceId]);

  // Sync collapse state with page type initially
  useEffect(() => {
    if (isSheetPage) setIsSidebarCollapsed(true);
    else setIsSidebarCollapsed(false);
  }, [isSheetPage]);

  return (
    <div className="bg-[#F5F1E6] min-h-screen font-body text-[#1c1c1a] overflow-x-hidden" style={{ fontFamily: "'Manrope', sans-serif" }}>
      
      {/* ── SHARED TOP NAV ─────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-4 right-4 z-[60] flex items-center justify-between px-6 py-3 transition-all duration-700 mt-4 bg-orange-50/60 backdrop-blur-3xl shadow-[0_20px_40px_rgba(28,28,26,0.04)] border border-[#d8c3b4]/30 rounded-2xl`}>
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-xl font-black tracking-tighter text-[#894d0d] hover:opacity-80 transition-opacity flex items-center gap-2">
            WORDEX <span className="text-[10px] bg-[#894d0d] text-white px-1.5 py-0.5 rounded">SUITE</span>
          </Link>
          <div className="hidden md:flex gap-6 items-center">
            <span className="w-[1px] h-4 bg-[#894d0d]/30 rounded-full"></span>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#894d0d] leading-none mb-1">{workspace?.name || "Artisanat..."}</span>
              <span className="text-[10px] font-bold text-[#524439]/60 leading-none uppercase tracking-widest">
                {isSheetPage ? 'Forge de Données - Mode Étendu' : pathname.includes('/slides') ? 'Présentation' : 'Manuscrit'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4 mr-4">
             <Link href={`/workspace/${workspaceId}`} className={`text-[10px] font-black uppercase tracking-widest transition-all ${!isSheetPage ? 'text-[#894d0d] border-b-2 border-[#894d0d]' : 'text-[#8B7E74] hover:text-[#894d0d]'}`}>Doc</Link>
             <Link href={`/workspace/${workspaceId}/sheets`} className={`text-[10px] font-black uppercase tracking-widest transition-all ${isSheetPage ? 'text-[#894d0d] border-b-2 border-[#894d0d]' : 'text-[#8B7E74] hover:text-[#894d0d]'}`}>Tableur</Link>
          </div>
          
          <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-[#894d0d] px-4 py-2 rounded-xl hover:scale-105 transition-all shadow-md shadow-[#894d0d]/20">
            <Icon name="share" size={16} />
            <span className="hidden sm:inline">Partager</span>
          </button>
          
          <div className="w-9 h-9 rounded-full border-2 border-white/40 bg-[#a76526] flex items-center justify-center text-white text-xs font-black shadow-lg">
            {user?.username?.charAt(0) || "U"}
          </div>
        </div>
      </nav>

      {/* ── SHARED CONTENT GRID ───────────────────────────────────────────── */}
      <div className={`pt-24 min-h-screen flex w-full transition-all duration-700 overflow-hidden`}>
        
        {/* Master Navigation Sidebar: Collapsible across all pages */}
        <aside 
          className={`fixed left-0 top-24 bottom-6 ml-4 md:ml-6 bg-white/40 backdrop-blur-3xl rounded-[2rem] border border-[#d8c3b4]/20 shadow-xl overflow-hidden flex flex-col z-50 transition-all duration-700 ease-in-out group/sidebar
          ${isSidebarCollapsed ? 'w-20 hover:w-72' : 'w-72 xl:w-80'}
        `}>
          <div className={`p-6 flex flex-col h-full relative ${isSidebarCollapsed ? 'items-center group-hover/sidebar:items-start' : 'items-start'}`}>
             
             {/* Toggle Button */}
             <button 
               onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
               className={`absolute top-6 right-6 w-8 h-8 rounded-full bg-white/60 hover:bg-[#894d0d] hover:text-white transition-all shadow-md flex items-center justify-center border border-[#d8c3b4]/30 z-[70] ${isSidebarCollapsed ? 'scale-0 group-hover/sidebar:scale-100' : 'scale-100'}`}
             >
               <Icon name={isSidebarCollapsed ? "chevron_right" : "chevron_left"} size={20} />
             </button>

             <div className={`mb-10 transition-all duration-500 ${isSidebarCollapsed ? 'opacity-0 group-hover/sidebar:opacity-100' : 'opacity-100'}`}>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#894d0d] mb-2 block opacity-60">Bibliothèque</span>
               <h3 className="text-xl font-black text-[#1c1c1a] tracking-tighter whitespace-nowrap">Mes Archives</h3>
             </div>
             
             <div className="space-y-2 flex-1 overflow-y-auto pr-1 no-scrollbar w-full">
               {allDocs.map((doc) => (
                 <Link 
                   key={doc.id}
                   title={doc.title}
                   href={`/workspace/${workspaceId}${doc.doc_type === 'spreadsheet' ? '/sheets' : ''}`}
                   className={`flex items-center gap-5 p-3 rounded-xl transition-all font-black uppercase tracking-widest hover:translate-x-1 whitespace-nowrap
                   ${pathname.includes(doc.id) ? 'bg-gradient-to-tr from-[#894d0d] to-[#a76526] text-white shadow-lg' : 'text-[#524439] hover:bg-white/60'}`}
                 >
                   <Icon name={doc.doc_type === 'spreadsheet' ? 'table_chart' : 'description'} size={26} className="shrink-0" />
                   <span className={`transition-all duration-500 truncate ${isSidebarCollapsed ? 'opacity-0 group-hover/sidebar:opacity-100 w-0 group-hover/sidebar:w-full' : 'opacity-100'}`}>
                      {doc.title}
                   </span>
                 </Link>
               ))}
             </div>
             
             <div className={`pt-6 border-t border-[#d8c3b4]/30 mt-6 space-y-3 transition-all duration-500 w-full ${isSidebarCollapsed ? 'opacity-0 group-hover/sidebar:opacity-100' : 'opacity-100'}`}>
               <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[#894d0d] mb-4 block opacity-60 whitespace-nowrap">Outils Industriels</span>
               <Link href={`/workspace/${workspaceId}/history`} className="flex items-center gap-5 p-3 text-[10px] font-black uppercase tracking-widest text-[#524439] hover:bg-white/60 rounded-xl transition-all whitespace-nowrap">
                 <Icon name="history" size={26} className="shrink-0" />
                 <span>Versions</span>
               </Link>
               <Link href={`/workspace/${workspaceId}/settings`} className="flex items-center gap-5 p-3 text-[10px] font-black uppercase tracking-widest text-[#524439] hover:bg-white/60 rounded-xl transition-all whitespace-nowrap">
                 <Icon name="settings" size={26} className="shrink-0" />
                 <span>Paramètres</span>
               </Link>
             </div>
             
             <div className="mt-8 pt-6 w-full border-t border-[#d8c3b4]/30">
               <button className={`w-full py-5 bg-[#894d0d] text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:brightness-110 active:scale-95 shadow-xl shadow-[#894d0d]/30 flex items-center justify-center gap-3 overflow-hidden`}>
                 <Icon name="add" size={26} className="shrink-0" />
                 <span className={`transition-all duration-500 whitespace-nowrap ${isSidebarCollapsed ? 'opacity-0 group-hover/sidebar:opacity-100 w-0 group-hover/sidebar:w-auto' : 'opacity-100'}`}>
                    NOUVEAU DÉPÔT
                 </span>
               </button>
             </div>
          </div>
        </aside>

        {/* Main View Port */}
        <main className={`flex-1 min-h-full transition-all duration-700 ease-in-out py-4 ${isSidebarCollapsed ? 'pl-28 pr-6' : 'pl-84 xl:pl-96 pr-8'}`}>
           <div className={`w-full h-full rounded-[3.5rem] overflow-hidden shadow-2xl border border-[#d8c3b4]/20 transition-all duration-700 ${isSheetPage ? 'bg-white shadow-[#894d0d]/5' : 'bg-transparent shadow-none'}`}>
              {children}
           </div>
        </main>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      ` }} />
    </div>
  );
}
