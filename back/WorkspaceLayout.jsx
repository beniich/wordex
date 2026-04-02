/**
 * WorkspaceLayout.jsx — Layout principal assemblant tous les composants
 *
 * Structure :
 *  ┌─────────────────────────────────────────────┐
 *  │  Topbar  [ titre ] [ 🔍 Cmd+K ] [ 🔔 ]      │
 *  ├──────────────┬──────────────────────────────┤
 *  │  FileTree    │  CollaborativeEditor          │
 *  │  (sidebar)   │  (zone principale)            │
 *  └──────────────┴──────────────────────────────┘
 */

"use client";

import { useState, useCallback } from "react";
import FileTree            from "./FileTree";
import GlobalSearch        from "./GlobalSearch";
import NotificationsPanel  from "./NotificationsPanel";
import CollaborativeEditor from "./CollaborativeEditor";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function WorkspaceLayout({ workspaceId, workspaceName, token, user }) {
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [selectedDoc,   setSelectedDoc]   = useState(null);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [sidebarWidth,  setSidebarWidth]  = useState(240);

  // Charger le document sélectionné
  const handleSelectDoc = useCallback(async (docId) => {
    setSelectedDocId(docId);
    try {
      const res = await fetch(`${API_URL}/api/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedDoc(await res.json());
    } catch {
      setSelectedDoc(null);
    }
  }, [token]);

  // Sauvegarde du document
  const handleSave = useCallback(async (data) => {
    if (!selectedDocId) return;
    await fetch(`${API_URL}/api/documents/${selectedDocId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }, [selectedDocId, token]);

  // Créer un nouveau document
  async function createDoc() {
    const res = await fetch(`${API_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ workspace_id: workspaceId, title: "Nouveau document" }),
    });
    const doc = await res.json();
    handleSelectDoc(doc.id);
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: "#0a0a0e", color: "#e8e6e0",
      fontFamily: "'Instrument Serif', Georgia, serif",
    }}>
      {/* ── Topbar ─────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "0 16px", height: 48, flexShrink: 0,
        borderBottom: "1px solid #14141e", background: "#080810",
      }}>
        {/* Logo / nom workspace */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          fontSize: 14, color: "#9a9890", fontFamily: "'DM Mono', monospace",
          flexShrink: 0,
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            background: "linear-gradient(135deg, #6366f1, #818cf8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff",
          }}>
            {workspaceName?.[0]?.toUpperCase() ?? "W"}
          </div>
          <span style={{ color: "#d4d0c8" }}>{workspaceName}</span>
        </div>

        <div style={{ height: 20, width: 1, background: "#1e1e2a" }} />

        {/* Bouton nouveau doc */}
        <button onClick={createDoc} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "transparent", border: "1px solid #1e1e2e",
          borderRadius: 6, padding: "4px 10px",
          color: "#6a6880", cursor: "pointer", fontSize: 12,
          fontFamily: "'DM Mono', monospace", transition: "all 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.color = "#a78bfa"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e2e"; e.currentTarget.style.color = "#6a6880"; }}
        >
          + Nouveau
        </button>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Recherche Cmd+K */}
        <button
          onClick={() => setSearchOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#0f0f18", border: "1px solid #1e1e2a",
            borderRadius: 8, padding: "5px 12px", cursor: "pointer",
            color: "#4a4860", fontSize: 12, fontFamily: "'DM Mono', monospace",
            transition: "all 0.15s", width: 200,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#2e2e42"; e.currentTarget.style.color = "#6a6880"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e2a"; e.currentTarget.style.color = "#4a4860"; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <span style={{ flex: 1 }}>Rechercher…</span>
          <kbd style={{
            background: "#141420", border: "1px solid #1e1e2a",
            borderRadius: 4, padding: "1px 5px", fontSize: 10,
          }}>⌘K</kbd>
        </button>

        {/* Notifications */}
        <NotificationsPanel token={token} onSelectDoc={handleSelectDoc} />

        {/* Avatar utilisateur */}
        <div style={{
          width: 30, height: 30, borderRadius: "50%",
          background: "#1e1e2e", border: "1px solid #2e2e42",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 600, color: "#818cf8",
          cursor: "pointer", flexShrink: 0,
          fontFamily: "'DM Mono', monospace",
        }}>
          {user?.username?.[0]?.toUpperCase() ?? "?"}
        </div>
      </div>

      {/* ── Corps ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{
          width: sidebarWidth, flexShrink: 0,
          borderRight: "1px solid #14141e", background: "#080810",
          overflowY: "auto", overflowX: "hidden",
          paddingTop: 8,
        }}>
          <FileTree
            workspaceId={workspaceId}
            token={token}
            onSelectDoc={handleSelectDoc}
            selectedDocId={selectedDocId}
          />
        </div>

        {/* Résizable handle */}
        <div
          style={{ width: 4, cursor: "col-resize", background: "transparent", flexShrink: 0 }}
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startW = sidebarWidth;
            function move(ev) {
              setSidebarWidth(Math.max(160, Math.min(400, startW + ev.clientX - startX)));
            }
            function up() {
              document.removeEventListener("mousemove", move);
              document.removeEventListener("mouseup", up);
            }
            document.addEventListener("mousemove", move);
            document.addEventListener("mouseup", up);
          }}
        />

        {/* Zone principale */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {selectedDocId && selectedDoc ? (
            <CollaborativeEditor
              docId={selectedDocId}
              token={token}
              username={user?.username ?? "Anonyme"}
              initialTitle={selectedDoc.title}
              onSave={handleSave}
            />
          ) : (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              color: "#2e2e3a", gap: 16,
            }}>
              <div style={{ fontSize: 48 }}>✦</div>
              <div style={{ fontSize: 16, fontFamily: "'Instrument Serif', Georgia, serif", color: "#3e3e52" }}>
                Sélectionnez un document pour commencer
              </div>
              <button onClick={createDoc} style={{
                marginTop: 8, padding: "10px 24px",
                background: "#1a1a2e", border: "1px solid #6366f1",
                borderRadius: 8, color: "#818cf8", cursor: "pointer",
                fontSize: 14, fontFamily: "'DM Mono', monospace",
                transition: "all 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "#6366f1"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#1a1a2e"; e.currentTarget.style.color = "#818cf8"; }}
              >
                + Créer un document
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Recherche globale ───────────────────────────────────────────── */}
      <GlobalSearch
        workspaceId={workspaceId}
        token={token}
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectDoc={(id) => { handleSelectDoc(id); setSearchOpen(false); }}
      />
    </div>
  );
}
