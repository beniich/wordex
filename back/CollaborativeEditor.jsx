/**
 * CollaborativeEditor.jsx
 *
 * Éditeur collaboratif temps réel :
 *   - TipTap (rich text) + Yjs (CRDT) + y-websocket
 *   - Curseurs collaborateurs avec couleur/nom
 *   - Panneau de présence (utilisateurs en ligne)
 *   - Indicateur "est en train d'écrire..."
 *   - Sauvegarde automatique vers l'API FastAPI
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

// ─── Config ───────────────────────────────────────────────────────────────────
const WS_URL   = process.env.NEXT_PUBLIC_WS_URL  || "ws://localhost:1234";
const API_URL  = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const SAVE_DEBOUNCE_MS = 2000;

// ─── Styles inline (pas de dépendance CSS externe) ───────────────────────────
const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#0f0f13",
    color: "#e8e6e0",
    fontFamily: "'Instrument Serif', Georgia, serif",
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 24px",
    borderBottom: "1px solid #1e1e2a",
    background: "#0a0a0e",
    gap: 16,
    flexShrink: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    color: "#f0ede8",
    margin: 0,
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    fontFamily: "inherit",
    cursor: "text",
  },
  saveStatus: {
    fontSize: 12,
    color: "#5a5870",
    minWidth: 80,
    textAlign: "right",
    fontFamily: "'DM Mono', monospace",
  },
  toolbar: {
    display: "flex",
    gap: 4,
    padding: "8px 24px",
    borderBottom: "1px solid #1a1a24",
    background: "#0d0d12",
    flexWrap: "wrap",
    flexShrink: 0,
  },
  toolBtn: {
    padding: "4px 10px",
    background: "transparent",
    border: "1px solid transparent",
    borderRadius: 6,
    color: "#888",
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "'DM Mono', monospace",
    transition: "all 0.15s",
  },
  toolBtnActive: {
    background: "#1e1e2e",
    border: "1px solid #2e2e42",
    color: "#c4b5fd",
  },
  layout: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  editorWrap: {
    flex: 1,
    overflow: "auto",
    padding: "48px 80px",
  },
  sidebar: {
    width: 240,
    borderLeft: "1px solid #1a1a24",
    background: "#0a0a0e",
    display: "flex",
    flexDirection: "column",
    padding: 16,
    gap: 16,
    flexShrink: 0,
    overflowY: "auto",
  },
  sidebarTitle: {
    fontSize: 11,
    fontFamily: "'DM Mono', monospace",
    color: "#444",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: 8,
  },
  userChip: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 10px",
    borderRadius: 8,
    background: "#111118",
    border: "1px solid #1e1e2a",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
    fontFamily: "'DM Mono', monospace",
  },
  typingDot: {
    display: "inline-block",
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: "#5a5870",
    animation: "blink 1.2s infinite",
    marginLeft: 4,
  },
  statusBar: {
    padding: "6px 24px",
    borderTop: "1px solid #1a1a24",
    background: "#0a0a0e",
    fontSize: 11,
    color: "#3a3850",
    display: "flex",
    gap: 16,
    fontFamily: "'DM Mono', monospace",
    flexShrink: 0,
  },
};

// ─── Composant avatar ─────────────────────────────────────────────────────────
function Avatar({ username, color, size = 28 }) {
  return (
    <div style={{ ...styles.avatar, width: size, height: size, background: color + "22", color }}>
      {username?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

// ─── Indicateur "typing" animé ────────────────────────────────────────────────
function TypingIndicator({ users }) {
  if (!users.length) return null;
  const names = users.map((u) => u.username).join(", ");
  return (
    <div style={{ fontSize: 12, color: "#5a5870", padding: "4px 0", fontFamily: "'DM Mono', monospace" }}>
      {names} {users.length === 1 ? "écrit" : "écrivent"}
      <span style={styles.typingDot} />
      <span style={{ ...styles.typingDot, animationDelay: "0.2s" }} />
      <span style={{ ...styles.typingDot, animationDelay: "0.4s" }} />
    </div>
  );
}

// ─── Bouton toolbar ───────────────────────────────────────────────────────────
function ToolBtn({ label, active, onClick }) {
  return (
    <button
      style={{ ...styles.toolBtn, ...(active ? styles.toolBtnActive : {}) }}
      onMouseEnter={(e) => {
        if (!active) Object.assign(e.target.style, { background: "#16161f", color: "#aaa" });
      }}
      onMouseLeave={(e) => {
        if (!active) Object.assign(e.target.style, { background: "transparent", color: "#888" });
      }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

// ─── Hook WebSocket présence ──────────────────────────────────────────────────
function usePresenceSocket({ docId, token, username }) {
  const ws = useRef(null);
  const [onlineUsers, setOnlineUsers]   = useState([]);
  const [typingUsers, setTypingUsers]   = useState([]);
  const [connected, setConnected]       = useState(false);
  const typingTimers = useRef({});

  useEffect(() => {
    if (!docId || !token) return;

    const socket = new WebSocket(WS_URL);
    ws.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "auth", token, doc_id: docId, username }));
    };

    socket.onmessage = (e) => {
      if (typeof e.data !== "string") return; // Yjs binary handled by y-websocket
      try {
        const msg = JSON.parse(e.data);
        switch (msg.type) {
          case "connected":
            setConnected(true);
            break;
          case "presence_list":
            setOnlineUsers(msg.users ?? []);
            break;
          case "user_left":
            setOnlineUsers((prev) => prev.filter((u) => u.user_id !== msg.user_id));
            setTypingUsers((prev) => prev.filter((u) => u.user_id !== msg.user_id));
            break;
          case "typing":
            if (msg.is_typing) {
              setTypingUsers((prev) => {
                if (prev.find((u) => u.user_id === msg.user_id)) return prev;
                return [...prev, { user_id: msg.user_id, username: msg.username }];
              });
              clearTimeout(typingTimers.current[msg.user_id]);
              typingTimers.current[msg.user_id] = setTimeout(() => {
                setTypingUsers((prev) => prev.filter((u) => u.user_id !== msg.user_id));
              }, 3000);
            } else {
              setTypingUsers((prev) => prev.filter((u) => u.user_id !== msg.user_id));
            }
            break;
        }
      } catch {}
    };

    socket.onclose = () => setConnected(false);

    return () => {
      socket.close();
      Object.values(typingTimers.current).forEach(clearTimeout);
    };
  }, [docId, token, username]);

  const sendTyping = useCallback((isTyping) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "typing", is_typing: isTyping }));
    }
  }, []);

  return { onlineUsers, typingUsers, connected, sendTyping };
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function CollaborativeEditor({
  docId,
  token,
  username,
  userColor = "#4ECDC4",
  initialTitle = "Sans titre",
  onSave,
}) {
  const ydoc        = useRef(new Y.Doc()).current;
  const [title, setTitle]       = useState(initialTitle);
  const [saveStatus, setSaveStatus] = useState("sauvegardé");
  const [wordCount, setWordCount]   = useState(0);
  const saveTimer   = useRef(null);
  const typingTimer = useRef(null);

  // Yjs WebSocket provider (CRDT sync)
  const provider = useRef(null);

  useEffect(() => {
    provider.current = new WebsocketProvider(WS_URL, `doc-${docId}`, ydoc, {
      params: { token },
    });
    return () => provider.current?.destroy();
  }, [docId, token, ydoc]);

  // Présence JSON (curseurs, typing)
  const { onlineUsers, typingUsers, connected, sendTyping } = usePresenceSocket({
    docId, token, username,
  });

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Placeholder.configure({ placeholder: "Commencez à écrire…" }),
      Collaboration.configure({ document: ydoc }),
      CollaborationCursor.configure({
        provider: provider.current,
        user: { name: username, color: userColor },
      }),
    ],
    onUpdate: ({ editor }) => {
      // Word count
      const text = editor.getText();
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);

      // Typing indicator
      sendTyping(true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => sendTyping(false), 2000);

      // Debounced save
      setSaveStatus("modification…");
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          setSaveStatus("sauvegarde…");
          const content = editor.getJSON();
          const contentText = editor.getText();
          if (onSave) await onSave({ title, content, content_text: contentText });
          setSaveStatus("sauvegardé");
        } catch {
          setSaveStatus("erreur !");
        }
      }, SAVE_DEBOUNCE_MS);
    },
  });

  // Cleanup
  useEffect(() => () => {
    clearTimeout(saveTimer.current);
    clearTimeout(typingTimer.current);
  }, []);

  // ── Toolbar actions ──────────────────────────────────────────────────────
  const toolbar = [
    { label: "B",       action: () => editor?.chain().focus().toggleBold().run(),        active: () => editor?.isActive("bold") },
    { label: "I",       action: () => editor?.chain().focus().toggleItalic().run(),      active: () => editor?.isActive("italic") },
    { label: "S",       action: () => editor?.chain().focus().toggleStrike().run(),      active: () => editor?.isActive("strike") },
    { label: "H1",      action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), active: () => editor?.isActive("heading", { level: 1 }) },
    { label: "H2",      action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), active: () => editor?.isActive("heading", { level: 2 }) },
    { label: "• Liste", action: () => editor?.chain().focus().toggleBulletList().run(), active: () => editor?.isActive("bulletList") },
    { label: "1. Liste",action: () => editor?.chain().focus().toggleOrderedList().run(), active: () => editor?.isActive("orderedList") },
    { label: "</>",     action: () => editor?.chain().focus().toggleCode().run(),        active: () => editor?.isActive("code") },
    { label: "———",     action: () => editor?.chain().focus().setHorizontalRule().run(), active: () => false },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&display=swap');
        @keyframes blink { 0%,80%,100%{opacity:0} 40%{opacity:1} }
        .ProseMirror { outline: none; min-height: 60vh; }
        .ProseMirror p { line-height: 1.8; margin: 0 0 1em; font-size: 17px; color: #d4d1ca; }
        .ProseMirror h1 { font-size: 2em; font-weight: 700; margin: 1.2em 0 0.4em; color: #f0ede8; letter-spacing: -0.03em; }
        .ProseMirror h2 { font-size: 1.4em; font-weight: 600; margin: 1em 0 0.3em; color: #e8e4dc; }
        .ProseMirror code { background: #1a1a2e; padding: 2px 6px; border-radius: 4px; font-family: 'DM Mono', monospace; font-size: 0.88em; color: #a78bfa; }
        .ProseMirror hr { border: none; border-top: 1px solid #2a2a38; margin: 2em 0; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 1.5em; color: #c8c5be; }
        .ProseMirror li { margin: 0.3em 0; line-height: 1.7; }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #2e2e3a;
          pointer-events: none;
          float: left;
          height: 0;
          font-style: italic;
        }
        /* Curseurs collaborateurs */
        .collaboration-cursor__caret {
          border-left: 2px solid;
          border-right: 0;
          margin-left: -1px;
          margin-right: -1px;
          position: relative;
          word-break: normal;
          pointer-events: none;
        }
        .collaboration-cursor__label {
          border-radius: 3px 3px 3px 0;
          color: #fff;
          font-size: 11px;
          font-style: normal;
          font-weight: 600;
          left: -1px;
          line-height: 1.4;
          padding: 2px 6px;
          position: absolute;
          top: -1.5em;
          user-select: none;
          white-space: nowrap;
          font-family: 'DM Mono', monospace;
        }
        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a38; border-radius: 3px; }
      `}</style>

      <div style={styles.root}>
        {/* ── Top bar ── */}
        <div style={styles.topbar}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.title}
            placeholder="Sans titre"
          />
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "4px 10px", borderRadius: 20,
            background: connected ? "#0d1f1a" : "#1f0d0d",
            border: `1px solid ${connected ? "#1a3d2e" : "#3d1a1a"}`,
            fontSize: 12, fontFamily: "'DM Mono', monospace",
            color: connected ? "#4ade80" : "#f87171",
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: connected ? "#4ade80" : "#f87171",
              boxShadow: connected ? "0 0 6px #4ade80" : "0 0 6px #f87171",
            }} />
            {connected ? "en ligne" : "hors ligne"}
          </div>
          <div style={styles.saveStatus}>{saveStatus}</div>
        </div>

        {/* ── Toolbar ── */}
        <div style={styles.toolbar}>
          {toolbar.map((t) => (
            <ToolBtn key={t.label} label={t.label} active={t.active()} onClick={t.action} />
          ))}
        </div>

        {/* ── Layout principal ── */}
        <div style={styles.layout}>
          {/* Éditeur */}
          <div style={styles.editorWrap}>
            <EditorContent editor={editor} />
          </div>

          {/* Sidebar présence */}
          <div style={styles.sidebar}>
            <div>
              <div style={styles.sidebarTitle}>
                {onlineUsers.length} en ligne
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {onlineUsers.map((u) => (
                  <div key={u.user_id} style={styles.userChip}>
                    <Avatar username={u.username} color={u.color ?? "#4ECDC4"} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, color: "#d4d1ca",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {u.username}
                      </div>
                      {typingUsers.find((t) => t.user_id === u.user_id) && (
                        <div style={{ fontSize: 10, color: "#5a5870", fontFamily: "'DM Mono', monospace" }}>
                          écrit…
                        </div>
                      )}
                    </div>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: u.color ?? "#4ECDC4",
                      flexShrink: 0,
                    }} />
                  </div>
                ))}
              </div>
            </div>

            <TypingIndicator users={typingUsers} />

            <div style={{ marginTop: "auto" }}>
              <div style={styles.sidebarTitle}>raccourcis</div>
              {[
                ["Ctrl+B", "Gras"],
                ["Ctrl+I", "Italique"],
                ["Ctrl+Z", "Annuler"],
                ["Ctrl+Y", "Rétablir"],
              ].map(([k, v]) => (
                <div key={k} style={{
                  display: "flex", justifyContent: "space-between",
                  fontSize: 11, color: "#3a3850", padding: "3px 0",
                  fontFamily: "'DM Mono', monospace",
                }}>
                  <span style={{ color: "#5a5870" }}>{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Status bar ── */}
        <div style={styles.statusBar}>
          <span>{wordCount} mots</span>
          <span>·</span>
          <span>doc: {docId}</span>
          <span>·</span>
          <span>{onlineUsers.length} collaborateur{onlineUsers.length > 1 ? "s" : ""}</span>
        </div>
      </div>
    </>
  );
}
