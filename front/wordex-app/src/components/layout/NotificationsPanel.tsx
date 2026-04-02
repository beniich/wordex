"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { notifications, Notification, API_BASE, getToken } from "@/lib/api";

const NOTIF_META: Record<string, { icon: string; color: string; label: string }> = {
  mention:         { icon: "@",  color: "#818cf8", label: "vous a mentionné" },
  share:           { icon: "arrow_outward",  color: "#34d399", label: "a partagé un document" },
  comment:         { icon: "chat_bubble", color: "#60a5fa", label: "a commenté" },
  version_restore: { icon: "restore",  color: "#f59e0b", label: "a restauré une version" },
  member_added:    { icon: "person", color: "#a78bfa", label: "vous a ajouté au workspace" },
  default:         { icon: "notifications",  color: "#5a5870", label: "notification" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "à l'instant";
  if (mins < 60)  return `il y a ${mins}m`;
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${days}j`;
}

export function NotificationsPanel() {
  const [open, setOpen]           = useState(false);
  const [notifs, setNotifs]       = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading]     = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load notifications and current unread count
  const loadNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notifications.list();
      setNotifs(data);
      const countRes = await notifications.unreadCount();
      setUnreadCount(countRes.count);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifs();
  }, [loadNotifs]);

  // SSE Stream logic
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    // Use SSE to receive real-time notifications
    const es = new EventSource(`${API_BASE}/notifications/stream?token=${token}`);
    
    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "notification") {
           setNotifs(prev => [msg.data, ...prev]);
           setUnreadCount(c => c + 1);
        }
      } catch (err) {}
    };

    return () => es.close();
  }, []);

  // Close on click outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (open && panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markRead = async (id: string) => {
    try {
      await notifications.markRead(id);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch (err) { console.error(err); }
  };

  const markAllRead = async () => {
    try {
      await notifications.markAllRead();
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) { console.error(err); }
  };

  const deleteNotif = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await notifications.delete(id);
      setNotifs(prev => prev.filter(n => n.id !== id));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button 
        onClick={() => setOpen(!open)}
        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all relative ${open ? 'bg-primary/20 text-primary shadow-inner' : 'text-outline hover:bg-primary/5 hover:text-primary'}`}
        title="Notifications"
      >
        <span className="material-symbols-outlined text-[20px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-surface animate-bounce-short">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-4 w-80 sm:w-96 max-h-[500px] bg-surface rounded-3xl shadow-2xl border border-outline-variant/10 flex flex-col z-[100] animate-fade-in overflow-hidden">
          <div className="p-4 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low/50 backdrop-blur-xl">
             <h3 className="text-xs font-black uppercase tracking-widest text-primary">Centre d'Alertes</h3>
             {unreadCount > 0 && (
               <button onClick={markAllRead} className="text-[10px] font-black uppercase text-outline hover:text-primary transition-colors">Tout marquer lu</button>
             )}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[400px] no-scrollbar">
            {loading ? (
               <div className="p-8 text-center text-[10px] font-black uppercase text-outline-variant animate-pulse">Synchronisation...</div>
            ) : notifs.length === 0 ? (
               <div className="p-12 text-center flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-outline-variant text-[40px]">notifications_off</span>
                  <p className="text-[10px] font-black uppercase text-outline-variant tracking-widest">Séquence calme</p>
               </div>
            ) : (
               <div className="flex flex-col">
                  {notifs.map(n => {
                    const meta = NOTIF_META[n.notif_type] || NOTIF_META.default;
                    return (
                      <div 
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`p-4 border-b border-outline-variant/5 flex gap-4 cursor-pointer hover:bg-primary/5 transition-colors relative group ${!n.is_read ? 'bg-primary/[0.03]' : ''}`}
                      >
                        {!n.is_read && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full" />}
                        
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-white shadow-sm border border-outline-variant/10`}>
                           {n.actor_avatar ? (
                             <img src={n.actor_avatar} className="w-full h-full rounded-full object-cover" alt="" />
                           ) : (
                             <span className="material-symbols-outlined text-[18px]" style={{ color: meta.color }}>{meta.icon}</span>
                           )}
                        </div>

                        <div className="flex-1 min-w-0">
                           <div className="text-xs text-foreground leading-tight">
                              <span className="font-black text-primary uppercase text-[10px] mr-1">{n.actor_name || "Système"}</span>
                              <span className="opacity-70">{meta.label}</span>
                              {n.entity_title && <span className="font-black italic text-secondary ml-1">— {n.entity_title}</span>}
                           </div>
                           {n.message && <p className="text-[11px] text-outline mt-1 line-clamp-2 italic font-medium">{n.message}</p>}
                           <p className="text-[9px] font-black uppercase text-outline-variant mt-2 tracking-widest">{timeAgo(n.created_at)}</p>
                        </div>

                        <button 
                          onClick={(e) => deleteNotif(e, n.id)}
                          className="w-6 h-6 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center self-start"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    );
                  })}
               </div>
            )}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-bounce-short { animation: bounceShort 2s infinite; }
        @keyframes bounceShort { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
      ` }} />
    </div>
  );
}
