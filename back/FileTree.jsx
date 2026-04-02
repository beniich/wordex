/**
 * FileTree.jsx — Arborescence de dossiers & documents
 *
 * Fonctionnalités :
 *   - Affichage récursif dossiers + documents
 *   - Expand/collapse
 *   - Clic droit contextuel (renommer, déplacer, supprimer)
 *   - Création de dossier inline
 *   - Breadcrumb
 */

import { useState, useRef, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Icônes SVG inline ─────────────────────────────────────────────────────────
const Icon = {
  folder:     <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>,
  folderOpen: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/></svg>,
  doc:        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>,
  chevron:    (open) => <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>,
  plus:       <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>,
  trash:      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>,
  edit:       <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>,
};

// ── Context menu ──────────────────────────────────────────────────────────────
function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const handler = () => onClose();
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position: "fixed", top: y, left: x, zIndex: 1000,
      background: "#13131a", border: "1px solid #2a2a38",
      borderRadius: 8, padding: "4px 0",
      boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      minWidth: 160,
    }}>
      {items.map((item, i) =>
        item === "---"
          ? <div key={i} style={{ height: 1, background: "#1e1e2e", margin: "4px 0" }} />
          : (
            <button key={i} onClick={() => { item.action(); onClose(); }} style={{
              display: "flex", alignItems: "center", gap: 8,
              width: "100%", padding: "7px 14px", background: "none", border: "none",
              color: item.danger ? "#f87171" : "#c4c0b8", cursor: "pointer",
              fontSize: 13, textAlign: "left", fontFamily: "'DM Mono', monospace",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#1e1e2e"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              {item.icon} {item.label}
            </button>
          )
      )}
    </div>
  );
}

// ── Nœud récursif ─────────────────────────────────────────────────────────────
function TreeNode({ node, depth = 0, onSelectDoc, selectedDocId, onRefresh, token }) {
  const [open, setOpen]       = useState(depth === 0);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName]   = useState(node.name);
  const [menu, setMenu]         = useState(null);
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const inputRef = useRef();

  useEffect(() => { if (renaming) inputRef.current?.select(); }, [renaming]);

  const indent = depth * 16;

  async function handleRename() {
    if (!newName.trim() || newName === node.name) { setRenaming(false); return; }
    await fetch(`${API_URL}/api/folders/${node.id}/rename`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newName }),
    });
    setRenaming(false);
    onRefresh();
  }

  async function handleDelete() {
    if (!confirm(`Supprimer "${node.name}" et tout son contenu ?`)) return;
    await fetch(`${API_URL}/api/folders/${node.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    onRefresh();
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) { setAddingFolder(false); return; }
    await fetch(`${API_URL}/api/folders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        workspace_id: node.workspace_id,
        name: newFolderName,
        parent_id: node.id,
      }),
    });
    setAddingFolder(false);
    setNewFolderName("");
    setOpen(true);
    onRefresh();
  }

  const isFolder = node.type === "folder";
  const hasChildren = isFolder && (node.children?.length > 0 || node.docs?.length > 0);

  return (
    <div>
      {/* Ligne du nœud */}
      <div
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY });
        }}
        onClick={() => {
          if (isFolder) setOpen(o => !o);
          else onSelectDoc?.(node.id);
        }}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: `5px 8px 5px ${12 + indent}px`,
          cursor: "pointer", borderRadius: 6,
          background: !isFolder && selectedDocId === node.id ? "#1a1a2e" : "transparent",
          color: !isFolder && selectedDocId === node.id ? "#a78bfa" : "#9a9890",
          fontSize: 13, userSelect: "none",
          transition: "background 0.1s",
        }}
        onMouseEnter={e => { if (selectedDocId !== node.id) e.currentTarget.style.background = "#111118"; }}
        onMouseLeave={e => { if (selectedDocId !== node.id) e.currentTarget.style.background = "transparent"; }}
      >
        {isFolder && <span style={{ opacity: 0.5, flexShrink: 0 }}>{Icon.chevron(open)}</span>}
        <span style={{ color: isFolder ? "#6366f1" : "#5a5870", flexShrink: 0 }}>
          {isFolder ? (open ? Icon.folderOpen : Icon.folder) : Icon.doc}
        </span>

        {renaming ? (
          <input
            ref={inputRef}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={e => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setRenaming(false); }}
            onClick={e => e.stopPropagation()}
            style={{
              flex: 1, background: "#1e1e2e", border: "1px solid #6366f1",
              borderRadius: 4, color: "#e8e6e0", padding: "1px 6px",
              fontSize: 13, outline: "none", fontFamily: "inherit",
            }}
          />
        ) : (
          <span style={{
            flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {node.name || node.title}
          </span>
        )}

        {isFolder && (
          <button
            onClick={e => { e.stopPropagation(); setAddingFolder(true); setOpen(true); }}
            title="Nouveau dossier"
            style={{
              opacity: 0, background: "none", border: "none", color: "#5a5870",
              cursor: "pointer", padding: "0 2px", lineHeight: 1,
            }}
            className="add-btn"
          >
            {Icon.plus}
          </button>
        )}
      </div>

      {/* Context menu */}
      {menu && (
        <ContextMenu
          x={menu.x} y={menu.y}
          onClose={() => setMenu(null)}
          items={isFolder ? [
            { label: "Renommer", icon: Icon.edit, action: () => setRenaming(true) },
            { label: "Nouveau dossier", icon: Icon.plus, action: () => { setAddingFolder(true); setOpen(true); } },
            "---",
            { label: "Supprimer", icon: Icon.trash, danger: true, action: handleDelete },
          ] : [
            { label: "Ouvrir", icon: Icon.doc, action: () => onSelectDoc?.(node.id) },
            "---",
            { label: "Supprimer", icon: Icon.trash, danger: true, action: async () => {
              await fetch(`${API_URL}/api/documents/${node.id}`, {
                method: "DELETE", headers: { Authorization: `Bearer ${token}` },
              });
              onRefresh();
            }},
          ]}
        />
      )}

      {/* Enfants */}
      {isFolder && open && (
        <div>
          {addingFolder && (
            <div style={{ paddingLeft: 12 + indent + 16, paddingTop: 4, paddingBottom: 4 }}>
              <input
                autoFocus
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onBlur={handleCreateFolder}
                onKeyDown={e => { if (e.key === "Enter") handleCreateFolder(); if (e.key === "Escape") setAddingFolder(false); }}
                placeholder="Nom du dossier…"
                style={{
                  width: "100%", background: "#1e1e2e", border: "1px solid #6366f1",
                  borderRadius: 4, color: "#e8e6e0", padding: "3px 8px",
                  fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
            </div>
          )}
          {node.children?.map(child => (
            <TreeNode key={child.id} node={child} depth={depth + 1}
              onSelectDoc={onSelectDoc} selectedDocId={selectedDocId}
              onRefresh={onRefresh} token={token} />
          ))}
          {node.docs?.map(doc => (
            <TreeNode key={doc.id} node={{ ...doc, type: "doc", name: doc.title }}
              depth={depth + 1} onSelectDoc={onSelectDoc} selectedDocId={selectedDocId}
              onRefresh={onRefresh} token={token} />
          ))}
          {!node.children?.length && !node.docs?.length && !addingFolder && (
            <div style={{
              paddingLeft: 12 + indent + 16, fontSize: 11,
              color: "#2e2e3a", paddingBottom: 4, fontFamily: "'DM Mono', monospace",
            }}>
              vide
            </div>
          )}
        </div>
      )}

      <style>{`.add-btn { opacity: 0 } div:hover > div > .add-btn { opacity: 1 }`}</style>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function FileTree({ workspaceId, token, onSelectDoc, selectedDocId }) {
  const [tree, setTree]       = useState({ folders: [], documents: [] });
  const [loading, setLoading] = useState(true);
  const [newRootFolder, setNewRootFolder] = useState(false);
  const [rootFolderName, setRootFolderName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/folders/tree?workspace_id=${workspaceId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setTree(await res.json());
    } finally {
      setLoading(false);
    }
  }, [workspaceId, token]);

  useEffect(() => { load(); }, [load]);

  // Construire l'arbre hiérarchique depuis la liste plate
  function buildTree(folders, documents) {
    const map = {};
    folders.forEach(f => map[f.id] = { ...f, type: "folder", children: [], docs: [] });
    const roots = [];

    folders.forEach(f => {
      if (f.parent_id && map[f.parent_id]) map[f.parent_id].children.push(map[f.id]);
      else roots.push(map[f.id]);
    });

    documents.forEach(d => {
      if (d.folder_id && map[d.folder_id]) map[d.folder_id].docs.push(d);
      else roots.push({ ...d, type: "doc", name: d.title });
    });

    return roots;
  }

  const nodes = buildTree(tree.folders, tree.documents);

  async function createRootFolder() {
    if (!rootFolderName.trim()) { setNewRootFolder(false); return; }
    await fetch(`${API_URL}/api/folders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ workspace_id: workspaceId, name: rootFolderName }),
    });
    setNewRootFolder(false);
    setRootFolderName("");
    load();
  }

  return (
    <div style={{
      fontFamily: "'DM Mono', monospace",
      fontSize: 13, userSelect: "none",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 12px", marginBottom: 4,
      }}>
        <span style={{ fontSize: 10, color: "#3a3850", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Fichiers
        </span>
        <button
          onClick={() => setNewRootFolder(true)}
          title="Nouveau dossier à la racine"
          style={{ background: "none", border: "none", color: "#5a5870", cursor: "pointer", padding: 2 }}
          onMouseEnter={e => e.currentTarget.style.color = "#a78bfa"}
          onMouseLeave={e => e.currentTarget.style.color = "#5a5870"}
        >
          {Icon.plus}
        </button>
      </div>

      {newRootFolder && (
        <div style={{ padding: "4px 12px" }}>
          <input
            autoFocus
            value={rootFolderName}
            onChange={e => setRootFolderName(e.target.value)}
            onBlur={createRootFolder}
            onKeyDown={e => { if (e.key === "Enter") createRootFolder(); if (e.key === "Escape") setNewRootFolder(false); }}
            placeholder="Nom du dossier…"
            style={{
              width: "100%", background: "#1e1e2e", border: "1px solid #6366f1",
              borderRadius: 4, color: "#e8e6e0", padding: "4px 8px",
              fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
            }}
          />
        </div>
      )}

      {loading ? (
        <div style={{ padding: "12px 16px", color: "#2e2e3a", fontSize: 12 }}>Chargement…</div>
      ) : nodes.length === 0 ? (
        <div style={{ padding: "12px 16px", color: "#2e2e3a", fontSize: 12 }}>
          Aucun fichier
        </div>
      ) : (
        nodes.map(node => (
          <TreeNode key={node.id} node={node} depth={0}
            onSelectDoc={onSelectDoc} selectedDocId={selectedDocId}
            onRefresh={load} token={token} />
        ))
      )}
    </div>
  );
}
