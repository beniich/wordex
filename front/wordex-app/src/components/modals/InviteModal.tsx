"use client";

import { useState, useEffect } from "react";
import { auth, workspaces, User } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { Search, UserPlus, X, Check } from "lucide-react";

interface InviteModalProps {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteModal({ workspaceId, isOpen, onClose }: InviteModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const users = await auth.userSearch(query);
        setResults(users);
      } catch (e) {
        console.error("Search failed:", e);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleInvite = async (userId: string) => {
    setInviting(userId);
    try {
      await workspaces.addMember(workspaceId, userId, "editor");
      showToast("Artisan joined the atelier", "success");
      onClose();
    } catch (e) {
      showToast("Commissioning failed", "error");
    } finally {
      setInviting(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-surface w-full max-w-md rounded-[2.5rem] shadow-2xl border border-outline-variant/30 overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-outline-variant/20 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-[#1c1c1a] tracking-tight">Expand Atelier</h3>
            <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mt-1">Personnel Hub</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-[#f0ede9] rounded-xl transition-colors"
            title="Close modal"
          >
            <X size={20} className="text-outline" />
          </button>
        </div>

        {/* Search */}
        <div className="p-8">
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
            <input 
              autoFocus
              type="text" 
              placeholder="Search by name or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#f0ede9] border-none rounded-2xl py-4 pl-12 pr-4 text-sm text-[#1c1c1a] placeholder:text-outline/50 focus:ring-2 focus:ring-primary/30 transition-all shadow-inner"
            />
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto no-scrollbar">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : results.length > 0 ? (
              results.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-outline-variant/10 hover:border-primary/30 group transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-black text-xs shadow-sm">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#1c1c1a]">{u.username}</p>
                      <p className="text-[10px] font-bold text-outline">{u.email}</p>
                    </div>
                  </div>
                  <button 
                    disabled={inviting === u.id}
                    onClick={() => handleInvite(u.id)}
                    className="p-2 rounded-xl bg-[#f0ede9] text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                    title="Invite user"
                  >
                    {inviting === u.id ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <UserPlus size={20} />
                    )}
                  </button>
                </div>
              ))
            ) : query.length > 2 ? (
              <p className="text-center py-8 text-xs font-bold text-[#857467] uppercase tracking-widest italic opacity-60">
                No matching artisans found
              </p>
            ) : (
              <div className="text-center py-8 opacity-40">
                <span className="material-symbols-outlined text-4xl text-[#857467]/30">group</span>
                <p className="mt-2 text-xs font-bold text-[#857467] uppercase tracking-widest">Awaiting input</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-[#f0ede9]/50 border-t border-outline-variant/20 flex justify-between items-center">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-outline">Wordex Security Protocol v3.0</span>
          <button 
            onClick={onClose}
            className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
          >
            Dismiss
          </button>
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
