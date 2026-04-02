"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import FloatingAIChat from "@/components/ai/FloatingAIChat";
import InviteModal from "@/components/modals/InviteModal";
import { workspaces, Workspace, documents, Document as DocType, filesAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useRouter } from "next/navigation";
import { useRef } from "react";

export default function DashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [myWorkspaces, setMyWorkspaces] = useState<Workspace[]>([]);
  const [recentDocs, setRecentDocs] = useState<DocType[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [storageStats, setStorageStats] = useState({ total_bytes: 0, file_count: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const [wsData, docsData] = await Promise.all([
          workspaces.list(),
          documents.recent(4)
        ]);
        setMyWorkspaces(wsData);
        setRecentDocs(docsData);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    const fetchStorage = async () => {
      try {
        const stats = await workspaces.getStorage();
        setStorageStats(stats);
      } catch (e) {
        console.error("Storage fetch failed:", e);
      }
    };

    fetchData();
    fetchStorage();
  }, []);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || myWorkspaces.length === 0) return;

    setIsImporting(true);
    showToast(`Vaulting ${file.name}...`, "info");
    
    try {
      await filesAPI.upload(myWorkspaces[0].id, file);
      showToast(`${file.name} successfully archived`, "success");
      // Refresh storage stats
      const stats = await workspaces.getStorage();
      setStorageStats(stats);
    } catch {
      showToast("Vaulting failed. Storage limit reached or connection lost.", "error");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <AppShell title="Workspace Overview">
      <div className={`transition-all duration-700 w-full ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        
        {/* Welcome Section */}
        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-xs text-primary font-bold uppercase tracking-[0.2em] mb-2 block font-manrope">
                Good morning, {user?.username || "Creative"}
              </span>
              <h1 className="text-5xl font-extrabold tracking-tighter text-foreground leading-[1.15] font-manrope">
                Your Celestial <br/>
                <span className="text-primary italic font-serif opacity-90 block mt-1 hover:tracking-widest transition-all duration-700">Atelier</span> is ready.
              </h1>
            </div>
            <div className="flex gap-3">
              <input 
                type="file" 
                title="Sélecteur de fichier"
                placeholder="Importer un document"
                ref={fileInputRef} 
                onChange={handleImport} 
                className="hidden" 
              />
              <button 
                disabled={isImporting}
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 bg-surface border border-outline/30 rounded-xl flex items-center gap-2 text-foreground text-xs uppercase tracking-widest font-bold hover:bg-surface-hover transition-colors shadow-sm disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[18px] ${isImporting ? 'animate-spin' : ''}`}>
                  {isImporting ? 'sync' : 'file_upload'}
                </span>
                {isImporting ? 'Uploading...' : 'Import'}
              </button>
              <button 
                onClick={async () => {
                  try {
                    const name = "New Atelier";
                    const slug = name.toLowerCase().replace(/\s+/g, "-");
                    const ws = await workspaces.create(name, slug);
                    showToast("New Atelier commissioned", "success");
                    router.push(`/workspace/${ws.id}`);
                  } catch {
                    showToast("Commissioning failed", "error");
                  }
                }}
                className="px-5 py-2.5 bg-primary text-white rounded-xl flex items-center gap-2 text-xs uppercase tracking-widest font-bold shadow-[0_8px_20px_rgba(var(--primary-rgb),0.3)] hover:scale-105 transition-transform"
              >
                <span className="material-symbols-outlined text-[18px] icon-fill">add</span>
                Create Atelier
              </button>
            </div>
          </div>
        </header>

        {/* Bento Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Main Column: Active Workspaces */}
          <section className="md:col-span-8 flex flex-col gap-6">
            <div className="flex items-center gap-6">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-outline uppercase tracking-widest">Master Artisan</p>
                <p className="text-lg font-black text-primary">{user?.username}</p>
              </div>
              <div className="flex items-center justify-between flex-1">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2 tracking-tight font-manrope">
                  <span className="w-1 h-6 bg-primary rounded-full shadow-sm"></span>
                  Active Workspaces
                </h3>
                <button className="text-xs font-bold text-primary hover:underline uppercase tracking-widest">View All</button>
              </div>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <div key={i} className="h-48 bg-gray-100 rounded-[1.5rem] animate-pulse" />
                ))}
              </div>
            ) : myWorkspaces.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {myWorkspaces.map((ws) => (
                  <Link
                    key={ws.id}
                    href={`/workspace/${ws.id}`}
                    className="group relative overflow-hidden bg-white/70 backdrop-blur-2xl border border-[#d8c3b4]/30 rounded-[1.5rem] p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_12px_25px_rgba(137,77,13,0.1)] flex flex-col h-full"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 blur-2xl transition-colors duration-700 bg-primary/10"></div>
                      
                    <div className="flex items-start justify-between mb-8 relative z-10">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-inner group-hover:scale-110 transition-transform bg-primary">
                        <span className="material-symbols-outlined text-[24px]">architecture</span>
                      </div>
                    </div>
                    
                    <h4 className="text-lg font-black mb-2 text-foreground relative z-10 group-hover:text-primary transition-colors leading-snug">{ws.name}</h4>
                                  
                    <div className="flex items-center justify-between pt-4 border-t border-outline-variant/30 mt-auto relative z-10">
                      <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-md bg-orange-50/50 text-primary">Active</span>
                      <span className="text-[10px] font-bold text-[#524439]">ID: {ws.id.substring(0, 8)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white/40 border border-dashed border-[#d8c3b4] rounded-[2rem] p-12 text-center">
                <p className="text-[#524439] font-bold">No active workspaces found.</p>
                <button className="mt-4 text-[#894d0d] font-black uppercase tracking-widest text-xs hover:underline">Create your first Atelier</button>
              </div>
            )}

            {/* Collaborative Indicator */}
            <div className="mt-2 p-8 bg-[#31302e] text-white rounded-[2rem] relative overflow-hidden shadow-xl group hover:-translate-y-1 transition-transform duration-500">
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <h4 className="text-xl font-bold tracking-tight mb-2 font-manrope">Live Sync Collaboration</h4>
                  <p className="text-[#dcdad6] text-xs font-medium">
                    Connect with your team in real-time.
                  </p>
                </div>
                <button className="px-5 py-2.5 bg-[#894d0d] text-white rounded-xl text-xs uppercase tracking-widest font-bold shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:bg-[#a76526] hover:scale-105 transition-all self-start sm:self-center">
                  Join Canvas
                </button>
              </div>
            </div>
          </section>

          {/* Right Column: Quick Actions & Priority Docs */}
          <aside className="md:col-span-4 flex flex-col gap-6">
            
            {/* Quick Actions */}
            <div className="p-6 bg-[#f0ede9] rounded-[2rem] border border-[#d8c3b4]/30 shadow-inner">
              <h3 className="text-lg font-bold mb-6 text-[#1c1c1a] tracking-tight font-manrope">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setInviteOpen(true)}
                  className="flex flex-col items-center justify-center gap-3 p-4 bg-surface rounded-2xl hover:bg-orange-50 hover:border-primary/30 border border-transparent shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all group"
                  title="Invite Personne"
                >
                  <div className="w-10 h-10 rounded-full bg-[#f0ede9] text-[#524439] flex items-center justify-center group-hover:bg-primary-container group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#524439] group-hover:text-primary transition-colors">Invite</span>
                </button>
                
                <button 
                  onClick={() => showToast(`Total Storage: ${(storageStats.total_bytes / 1024 / 1024).toFixed(2)} MB in ${storageStats.file_count} scrolls`, "info")}
                  className="flex flex-col items-center justify-center gap-3 p-4 bg-surface rounded-2xl hover:bg-orange-50 hover:border-primary/30 border border-transparent shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all group"
                  title="Storage Capacity"
                >
                  <div className="w-10 h-10 rounded-full bg-[#f0ede9] text-[#524439] flex items-center justify-center group-hover:bg-primary-container group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#524439] group-hover:text-primary transition-colors">Storage</span>
                </button>
                
                {[
                  { icon: "dashboard_customize", label: "Control Tower", href: "/dashboard/bi" },
                  { icon: "bolt",        label: "Shortcuts", href: "#" },
                ].map((action) => (
                  <Link key={action.label} href={action.href} className="flex flex-col items-center justify-center gap-3 p-4 bg-surface rounded-2xl hover:bg-orange-50 hover:border-primary/30 border border-transparent shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all group" title={action.label}>
                    <div className="w-10 h-10 rounded-full bg-[#f0ede9] text-[#524439] flex items-center justify-center group-hover:bg-primary-container group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[20px]">{action.icon}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#524439] group-hover:text-primary transition-colors">{action.label}</span>
                  </Link>
                ))}
              </div>

              {/* Storage Capacity Bar */}
              <div className="mt-8 pt-6 border-t border-outline-variant/20">
                <div className="flex items-center justify-between mb-3 text-[10px] font-black text-outline uppercase tracking-[0.2em]">
                  <span>Storage Capacity</span>
                  <span className="text-primary">{(storageStats.total_bytes / 1024 / 1024).toFixed(1)} / 1024 MB</span>
                </div>
                <div className="h-2 w-full bg-[#e5e2de] rounded-full overflow-hidden shadow-inner flex">
                  <div 
                    className="h-full bg-primary transition-all duration-1000 ease-out" 
                    style={{ width: `${Math.min(100, (storageStats.total_bytes / (1024 * 1024 * 1024)) * 100)}%` }}
                  ></div>
                </div>
                <p className="mt-3 text-[9px] font-bold text-outline-variant italic leading-relaxed">
                  &quot;The scrolls of the Great Library grow heavier.&quot;
                </p>
              </div>
            </div>

            {/* Priority Documents */}
            <div className="flex-1 p-6 bg-white/70 backdrop-blur-2xl border border-[#d8c3b4]/30 rounded-[2rem] flex flex-col shadow-[0_4px_20px_rgba(137,77,13,0.03)]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#1c1c1a] font-manrope">Priority Documents</h3>
                <button className="text-[#a76526] hover:bg-orange-100 p-1 rounded-xl transition-colors">
                  <span className="material-symbols-outlined text-[20px]">sort</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {recentDocs.length > 0 ? (
                  recentDocs.map((doc) => (
                    <Link key={doc.id} href={`/workspace/${doc.workspace_id}/documents/${doc.id}`} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-orange-50 transition-colors group">
                      <div className="w-10 h-10 rounded-xl bg-[#f0ede9] text-[#894d0d] flex items-center justify-center group-hover:bg-[#894d0d] group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[20px]">
                          {doc.doc_type === 'note' ? 'description' : (doc.doc_type === 'spreadsheet' ? 'table_chart' : 'slideshow')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-[#1c1c1a] truncate">{doc.title}</p>
                        <p className="text-[10px] font-bold text-outline uppercase tracking-widest leading-none mt-1">
                          {new Date(doc.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-[#d8c3b4] opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                    </Link>
                  ))
                ) : (
                  <p className="text-[11px] text-[#857467] italic text-center py-4">No recent scrolls found in the vaults.</p>
                )}
              </div>
              <button className="mt-4 pt-4 border-t border-[#d8c3b4]/30 text-[10px] font-black uppercase tracking-widest text-center text-[#524439] hover:text-[#894d0d] transition-colors block w-full">
                Explore Archive
              </button>
            </div>
          </aside>
        </div>
      </div>
      <FloatingAIChat />
      <InviteModal 
        isOpen={inviteOpen} 
        onClose={() => setInviteOpen(false)} 
        workspaceId={myWorkspaces[0]?.id || ""} 
      />
    </AppShell>
  );
}
