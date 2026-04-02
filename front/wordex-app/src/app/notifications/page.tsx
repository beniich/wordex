"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import FloatingAIChat from "@/components/ai/FloatingAIChat";
import { notifications, Notification, API_BASE } from "@/lib/api";

const TYPE_ICONS: Record<string, string> = {
  comment: "chat_bubble", mention: "alternate_email", share: "share",
  approve: "check_circle", publish: "publish", invite: "person_add",
  system: "warning",
};

const TYPE_COLORS: Record<string, string> = {
  comment: "#894d0d", mention: "#006576", share: "#79573c",
  approve: "#a76526", publish: "#894d0d", invite: "#857467",
  system: "#894d0d",
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();

    // Setup SSE for real-time pushed notifications
    const token = localStorage.getItem("wordex_access_token") || "";
    const es = new EventSource(`${API_BASE}/notifications/stream?token=${token}`);
    
    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === "notification") {
          setNotifs((prev) => [payload.data, ...prev]);
        }
      } catch (err) {}
    };

    return () => es.close();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await notifications.list();
      setNotifs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await notifications.markAllRead();
      setNotifs((n) => n.map((x) => ({ ...x, is_read: true })));
    } catch {}
  };
  
  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notifications.markRead(id);
      setNotifs((prev) => prev.map((x) => x.id === id ? { ...x, is_read: true } : x));
    } catch {}
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notifications.delete(id);
      setNotifs((prev) => prev.filter((x) => x.id !== id));
    } catch {}
  };

  const displayed   = filter === "unread" ? notifs.filter((n) => !n.is_read) : notifs;
  const unreadCount = notifs.filter((n) => !n.is_read).length;

  return (
    <AppShell title="Notifications">
      <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#d8c3b4]/30">
          <div>
            <span className="text-[#894d0d] font-bold tracking-[0.2em] text-[10px] uppercase mb-2 block">
              Celestial Repository Updates
            </span>
            <h1 className="text-4xl font-black text-[#1c1c1a] tracking-tight font-manrope">
              Notifications
            </h1>
            <p className="text-[#524439] text-xs mt-2 font-medium">Monitoring asynchronous activity pulses in Aether.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-[#f0ede9] p-1 rounded-xl shadow-inner border border-[#d8c3b4]/20">
              {(["all", "unread"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                    ${filter === f ? "bg-white text-[#894d0d] shadow-sm" : "text-[#524439] hover:text-[#894d0d]"}`}
                >
                  {f} {f === "unread" && unreadCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-[#894d0d] text-white rounded shadow-sm">{unreadCount}</span>
                  )}
                </button>
              ))}
            </div>
            <button 
              onClick={markAllRead} 
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#894d0d] hover:bg-[#894d0d]/10 rounded-xl transition-colors border border-transparent hover:border-[#894d0d]/20"
            >
              Mark all read
            </button>
          </div>
        </div>

        {/* Notification Feed */}
        <div className="space-y-4">
          {displayed.map((n) => (
            <div
              key={n.id}
              onClick={(e) => { if (!n.is_read) handleMarkRead(n.id, e); }}
              className={`flex items-start gap-5 p-6 rounded-[1.75rem] border transition-all cursor-pointer group relative overflow-hidden backdrop-blur-xl
                ${n.is_read 
                  ? "bg-white/40 border-[#d8c3b4]/20 hover:bg-white/60" 
                  : "bg-white shadow-[0_12px_25px_rgba(137,77,13,0.04)] border-[#894d0d]/30"}`}
            >
              {!n.is_read && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#894d0d] shadow-[2px_0_10px_rgba(137,77,13,0.3)]"></div>
              )}

              <div className="relative shrink-0">
                {n.actor_avatar && n.actor_avatar.startsWith('http') ? (
                  <img src={n.actor_avatar} alt="avatar" className="w-12 h-12 rounded-2xl object-cover shadow-lg group-hover:scale-105 transition-transform" />
                ) : (
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-black shadow-lg group-hover:scale-105 transition-transform"
                    style={{ background: TYPE_COLORS[n.notif_type] || "#894d0d" }}
                  >
                    {n.actor_name ? n.actor_name.substring(0, 2).toUpperCase() : "W"}
                  </div>
                )}
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-white border-2 border-white flex items-center justify-center shadow-lg"
                  style={{ color: TYPE_COLORS[n.notif_type] || "#894d0d" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "14px", fontVariationSettings: "'FILL' 1" }}>
                    {TYPE_ICONS[n.notif_type] || "notifications"}
                  </span>
                </div>
              </div>

              <div className="flex-1 min-w-0 py-0.5">
                <div className="flex justify-between items-start mb-1">
                  <p className={`text-sm font-black tracking-tight leading-none ${n.is_read ? "text-[#1c1c1a]" : "text-[#894d0d]"}`}>
                    {n.entity_title || n.entity_type} {n.notif_type}
                  </p>
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#d8c3b4] group-hover:text-[#857467] transition-colors">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-[#524439] mt-2 leading-relaxed line-clamp-2 font-medium opacity-80 italic">
                  {n.message || `A new ${n.notif_type} was recorded.`}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  aria-label="Delete notification"
                  className="p-2 hover:bg-red-50 rounded-xl text-[#d8c3b4] hover:text-red-500 transition-all active:scale-90 border border-transparent hover:border-red-100"
                  onClick={(e) => handleDelete(n.id, e)}
                >
                  <span className="material-symbols-outlined text-[18px]">delete_outline</span>
                </button>
              </div>
            </div>
          ))}

          {displayed.length === 0 && (
            <div className="text-center py-24 bg-white/40 border-2 border-dashed border-[#d8c3b4]/30 rounded-[2.5rem]">
              <span className="material-symbols-outlined text-[64px] text-[#d8c3b4] block mb-4 opacity-30">notifications_off</span>
               <h3 className="text-xl font-black text-[#1c1c1a] tracking-tight">Atelier Quietude</h3>
               <p className="text-[#857467] text-xs font-bold uppercase tracking-widest mt-2">All pulses have been processed</p>
            </div>
          )}
        </div>
      </div>

      <FloatingAIChat />
    </AppShell>
  );
}
