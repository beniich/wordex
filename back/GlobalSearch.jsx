/**
 * GlobalSearch.jsx — Palette de recherche Cmd+K
 *
 * Fonctionnalités :
 *   - Ouverture Cmd+K / Ctrl+K
 *   - Recherche full-text avec debounce
 *   - Résultats unifiés (docs + fichiers)
 *   - Navigation clavier (↑↓ Enter Escape)
 *   - Historique des récents
 */

import { useState, useEffect, useRef, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const TYPE_ICONS = {
  note:         "📝",
  spreadsheet:  "📊",
  presentation: "📽️",
  file:         "📎",
  default:      "📄",
};

const TYPE_LABELS = {
  note:         "Note",
  spreadsheet:  "Tableur",
  presentation: "Présentation",
  file:         "Fichier",
};

function highlight(text = "", query = "") {
  if (!query.trim() || !text) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} style={{ background: "#3b2f6a", color: "#c4b5fd", borderRadius: 2, padding: "0 1px" }}>{part}</mark>
      : part
  );
}

export default function GlobalSearch({ workspaceId, token, onSelectDoc, isOpen, onClose }) {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState([]);
  const [recents, setRecents]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef  = useRef();
  const listRef   = useRef();
  const debounceRef = useRef();

  // Ouvrir avec Cmd+K
  useEffect(() => {
    function handler(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (!isOpen) onClose(); // toggle via parent
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Focus input à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setSelected(0);
    }
  }, [isOpen]);

  // Charger les récents
  useEffect(() => {
    if (!isOpen || !workspaceId || !token) return;
    fetch(`${API_URL}/api/search/recent?workspace_id=${workspaceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setRecents)
      .catch(() => {});
  }, [isOpen, workspaceId, token]);

  // Recherche avec debounce
  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/search?workspace_id=${workspaceId}&q=${encodeURIComponent(q)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      setResults(data.results ?? []);
      setSelected(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, token]);

  function onInput(e) {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 220);
  }

  // Navigation clavier
  function onKeyDown(e) {
    const items = query.trim() ? results : recents;
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, items.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && items[selected]) {
      handleSelect(items[selected]);
    }
  }

  function handleSelect(item) {
    if (item.result_type === "file") return; // fichier : pas d'éditeur
    onSelectDoc?.(item.id);
    onClose();
  }

  if (!isOpen) return null;

  const displayItems = query.trim() ? results : recents;
  const showRecents  = !query.trim() && recents.length > 0;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: "15vh",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: 600, maxWidth: "90vw",
        background: "#0d0d14", border: "1px solid #2a2a3a",
        borderRadius: 14, overflow: "hidden",
        boxShadow: "0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.15)",
      }}>
        {/* Input */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 18px", borderBottom: "1px solid #1a1a26",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#5a5870">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={onInput}
            onKeyDown={onKeyDown}
            placeholder="Rechercher dans le workspace…"
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: "#e8e6e0", fontSize: 16, fontFamily: "'Instrument Serif', Georgia, serif",
            }}
          />
          {loading && (
            <div style={{
              width: 14, height: 14, border: "2px solid #2a2a38",
              borderTopColor: "#6366f1", borderRadius: "50%",
              animation: "spin 0.6s linear infinite",
            }} />
          )}
          <kbd style={{
            background: "#1a1a26", border: "1px solid #2a2a38",
            borderRadius: 5, padding: "2px 7px", fontSize: 11,
            color: "#4a4860", fontFamily: "'DM Mono', monospace",
          }}>
            esc
          </kbd>
        </div>

        {/* Résultats */}
        <div ref={listRef} style={{ maxHeight: 400, overflowY: "auto" }}>
          {showRecents && (
            <div style={{ padding: "8px 18px 4px", fontSize: 10, color: "#3a3850", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Récents
            </div>
          )}
          {query.trim() && results.length === 0 && !loading && (
            <div style={{ padding: "32px 18px", textAlign: "center", color: "#3a3850", fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
              Aucun résultat pour « {query} »
            </div>
          )}
          {displayItems.map((item, i) => (
            <div
              key={item.id}
              onClick={() => handleSelect(item)}
              style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: "10px 18px", cursor: "pointer",
                background: selected === i ? "#14142a" : "transparent",
                borderLeft: selected === i ? "2px solid #6366f1" : "2px solid transparent",
                transition: "background 0.1s",
              }}
              onMouseEnter={() => setSelected(i)}
            >
              <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>
                {TYPE_ICONS[item.doc_type] ?? TYPE_ICONS.default}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14, color: "#d4d0c8", fontFamily: "'Instrument Serif', Georgia, serif",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {highlight(item.title, query)}
                </div>
                {item.excerpt && (
                  <div style={{
                    fontSize: 12, color: "#4a4860", marginTop: 2,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    fontFamily: "'DM Mono', monospace",
                  }}>
                    {highlight(item.excerpt, query)}
                  </div>
                )}
              </div>
              <div style={{
                fontSize: 10, color: "#2e2e3a", fontFamily: "'DM Mono', monospace",
                flexShrink: 0, paddingTop: 3,
              }}>
                {TYPE_LABELS[item.doc_type] ?? item.doc_type}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", gap: 16, padding: "8px 18px",
          borderTop: "1px solid #1a1a26",
          fontSize: 11, color: "#2e2e3a", fontFamily: "'DM Mono', monospace",
        }}>
          <span>↑↓ naviguer</span>
          <span>↵ ouvrir</span>
          <span>esc fermer</span>
          <span style={{ marginLeft: "auto" }}>{results.length > 0 && `${results.length} résultat${results.length > 1 ? "s" : ""}`}</span>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
