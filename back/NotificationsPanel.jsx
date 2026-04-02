/**
 * NotificationsPanel.jsx — Centre de notifications in-app
 *
 * Fonctionnalités :
 *   - Connexion SSE pour le push temps réel
 *   - Badge de comptage non-lus
 *   - Panel slide-in avec liste des notifs
 *   - Marquer lu / tout marquer / supprimer
 *   - Types : mention, share, comment, version_restore, member_added
 */

import { useState, useEffect, useRef, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Icônes par type ───────────────────────────────────────────────────────────
const NOTIF_META = {
  mention:         { icon: "@",  color: "#818cf8", label: "vous a mentionné" },
  share:           { icon: "↗",  color: "#34d399", label: "a partagé un document" },
  comment:         { icon: "💬", color: "#60a5fa", label: "a commenté" },
  version_restore: { icon: "↩",  color: "#f59e0b", label: "a restauré une version" },
  member_added:    { icon: "👤", color: "#a78bfa", label: "vous a ajouté au workspace" },
  default:         { icon: "•",  color: "#5a5870", label: "notification" },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "à l'instant";
  if (mins < 60)  return `il y a ${mins}m`;
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${days}j`;
}

// ── Hook SSE ──────────────────────────────────────────────────────────────────
function useSSENotifications(token, onNew) {
  useEffect(() => {
    if (!token) return;
    const url = `${API_URL}/api/notifications/stream`;
    // EventSource ne supporte pas les headers → on passe le token en query param
    const es = new EventSource(`${url}?token=${token}`);
    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "notification") onNew(msg.data);
      } catch {}
    };
    return () => es.close();
  }, [token, onNew]);
}

// ── Composant badge + panel ────────────────────────────────────────────────────
export default function NotificationsPanel({ token, onSelectDoc }) {
  const [open, setOpen]           = useState(false);
  const [notifs, setNotifs]       = useState([]);
  const [unread, setUnread]       = useState(0);
  const [loading, setLoading]     = useState(false);
  const panelRef = useRef();

  // Fermer au clic extérieur
  useEffect(() => {
    function handler(e) {
      if (open && panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Charger les notifs
  const loadNotifs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [nRes, cRes] = await Promise.all([
        fetch(`${API_URL}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/notifications/unread-count`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setNotifs(await nRes.json());
      const { count } = await cRes.json();
      setUnread(count);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadNotifs(); }, [loadNotifs]);

  // Réception SSE
  const handleNew = useCallback((notif) => {
    setNotifs(prev => [notif, ...prev]);
    setUnread(u => u + 1);
    // Mini toast
    showToast(notif);
  }, []);
  useSSENotifications(token, handleNew);

  // Ouvrir → charger
  function togglePanel() {
    setOpen(o => !o);
    if (!open) loadNotifs();
  }

  async function markRead(id) {
    await fetch(`${API_URL}/api/notifications/${id}/read`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token}` },
    });
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnread(u => Math.max(0, u - 1));
  }

  async function markAllRead() {
    await fetch(`${API_URL}/api/notifications/read-all`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token}` },
    });
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
  }

  async function deleteNotif(id) {
    await fetch(`${API_URL}/api/notifications/${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    setNotifs(prev => prev.filter(n => n.id !== id));
  }

  function handleNotifClick(notif) {
    if (!notif.is_read) markRead(notif.id);
    if (notif.entity_type === "document") onSelectDoc?.(notif.entity_id);
    setOpen(false);
  }

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      {/* Bouton cloche */}
      <button
        onClick={togglePanel}
        style={{
          position: "relative", background: open ? "#1a1a2e" : "transparent",
          border: "1px solid", borderColor: open ? "#6366f1" : "transparent",
          borderRadius: 8, padding: "6px 10px", cursor: "pointer",
          color: open ? "#a78bfa" : "#5a5870", transition: "all 0.15s",
          display: "flex", alignItems: "center",
        }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.color = "#9a9890"; e.currentTarget.style.borderColor = "#2a2a38"; } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.color = "#5a5870"; e.currentTarget.style.borderColor = "transparent"; } }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
        </svg>
        {unread > 0 && (
          <div style={{
            position: "absolute", top: -4, right: -4,
            background: "#6366f1", color: "#fff",
            borderRadius: "50%", minWidth: 17, height: 17,
            fontSize: 10, fontWeight: 700, display: "flex",
            alignItems: "center", justifyContent: "center",
            fontFamily: "'DM Mono', monospace", lineHeight: 1,
            border: "2px solid #0a0a0e",
          }}>
            {unread > 99 ? "99+" : unread}
          </div>
        )}
      </button>

      {/* Panel slide-in */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: 360, maxHeight: 500,
          background: "#0d0d14", border: "1px solid #2a2a3a",
          borderRadius: 12, overflow: "hidden",
          boxShadow: "0 16px 60px rgba(0,0,0,0.7)",
          display: "flex", flexDirection: "column",
          zIndex: 1000,
          animation: "slideDown 0.15s ease-out",
        }}>
          {/* Header panel */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", borderBottom: "1px solid #1a1a26",
          }}>
            <span style={{
              fontSize: 12, fontWeight: 600, color: "#9a9890",
              fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              Notifications {unread > 0 && <span style={{ color: "#6366f1" }}>({unread})</span>}
            </span>
            {unread > 0 && (
              <button onClick={markAllRead} style={{
                background: "none", border: "none", color: "#5a5870",
                fontSize: 11, cursor: "pointer", fontFamily: "'DM Mono', monospace",
              }}
                onMouseEnter={e => e.currentTarget.style.color = "#a78bfa"}
                onMouseLeave={e => e.currentTarget.style.color = "#5a5870"}
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Liste */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading ? (
              <div style={{ padding: 24, textAlign: "center", color: "#2e2e3a", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                Chargement…
              </div>
            ) : notifs.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                <div style={{ color: "#2e2e3a", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                  Aucune notification
                </div>
              </div>
            ) : (
              notifs.map(n => {
                const meta = NOTIF_META[n.notif_type] ?? NOTIF_META.default;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    style={{
                      display: "flex", gap: 12, padding: "11px 16px",
                      cursor: "pointer", borderBottom: "1px solid #0f0f18",
                      background: n.is_read ? "transparent" : "#10101e",
                      transition: "background 0.1s",
                      position: "relative",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#14142a"}
                    onMouseLeave={e => e.currentTarget.style.background = n.is_read ? "transparent" : "#10101e"}
                  >
                    {/* Dot non-lu */}
                    {!n.is_read && (
                      <div style={{
                        position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)",
                        width: 5, height: 5, borderRadius: "50%", background: "#6366f1",
                      }} />
                    )}

                    {/* Avatar acteur */}
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                      background: meta.color + "22", color: meta.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 15, fontWeight: 700,
                    }}>
                      {n.actor_avatar
                        ? <img src={n.actor_avatar} style={{ width: 32, height: 32, borderRadius: "50%" }} alt="" />
                        : meta.icon}
                    </div>

                    {/* Texte */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: "#c4c0b8", lineHeight: 1.4, fontFamily: "'Instrument Serif', Georgia, serif" }}>
                        <strong style={{ color: "#e8e6e0" }}>{n.actor_name ?? "Quelqu'un"}</strong>{" "}
                        {meta.label}
                        {n.entity_title && (
                          <> — <span style={{ color: "#a78bfa" }}>{n.entity_title}</span></>
                        )}
                      </div>
                      {n.message && (
                        <div style={{
                          fontSize: 12, color: "#4a4860", marginTop: 2,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          fontFamily: "'DM Mono', monospace",
                        }}>
                          {n.message}
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: "#2e2e3a", marginTop: 4, fontFamily: "'DM Mono', monospace" }}>
                        {timeAgo(n.created_at)}
                      </div>
                    </div>

                    {/* Supprimer */}
                    <button
                      onClick={e => { e.stopPropagation(); deleteNotif(n.id); }}
                      style={{
                        background: "none", border: "none", color: "#2e2e3a",
                        cursor: "pointer", padding: "0 2px", alignSelf: "flex-start",
                        fontSize: 16, lineHeight: 1,
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                      onMouseLeave={e => e.currentTarget.style.color = "#2e2e3a"}
                      title="Supprimer"
                    >
                      ×
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Toast global ──────────────────────────────────────────────────────────────
let _toastContainer;

function showToast(notif) {
  if (!_toastContainer) {
    _toastContainer = document.createElement("div");
    Object.assign(_toastContainer.style, {
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      display: "flex", flexDirection: "column", gap: 8,
      pointerEvents: "none",
    });
    document.body.appendChild(_toastContainer);
  }

  const meta = NOTIF_META[notif.notif_type] ?? NOTIF_META.default;
  const toast = document.createElement("div");
  Object.assign(toast.style, {
    background: "#0d0d14", border: "1px solid #2a2a3a",
    borderLeft: `3px solid ${meta.color}`,
    borderRadius: 10, padding: "12px 16px",
    color: "#c4c0b8", fontSize: 13,
    fontFamily: "'Instrument Serif', Georgia, serif",
    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
    maxWidth: 300, animation: "toastIn 0.25s ease-out",
    pointerEvents: "auto",
  });
  toast.innerHTML = `
    <div style="font-weight:600;color:#e8e6e0;margin-bottom:2px">
      ${meta.icon} ${notif.actor_name ?? "Quelqu'un"}
    </div>
    <div style="font-size:12px;color:#5a5870">
      ${meta.label}${notif.entity_title ? ` — ${notif.entity_title}` : ""}
    </div>
  `;

  const style = document.createElement("style");
  style.textContent = `
    @keyframes toastIn { from { opacity:0; transform:translateX(16px) } to { opacity:1; transform:translateX(0) } }
    @keyframes toastOut { to { opacity:0; transform:translateX(16px) } }
  `;
  document.head.appendChild(style);

  _toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "toastOut 0.25s ease-in forwards";
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}
