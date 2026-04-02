/**
 * pages/docs/[docId].jsx  — ou  app/docs/[docId]/page.jsx
 *
 * Exemple d'intégration de CollaborativeEditor dans une page Next.js
 */

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CollaborativeEditor from "@/components/CollaborativeEditor";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DocPage() {
  const { docId } = useParams();
  const [doc, setDoc]     = useState(null);
  const [me, setMe]       = useState(null);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  // Récupérer le token depuis localStorage (ou votre state manager)
  useEffect(() => {
    const t = localStorage.getItem("access_token");
    if (!t) { setError("Non authentifié"); return; }
    setToken(t);
  }, []);

  // Charger l'utilisateur et le document
  useEffect(() => {
    if (!token || !docId) return;

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API_URL}/api/users/me`, { headers }).then((r) => r.json()),
      fetch(`${API_URL}/api/documents/${docId}`, { headers }).then((r) => r.json()),
    ])
      .then(([user, document]) => {
        setMe(user);
        setDoc(document);
      })
      .catch(() => setError("Impossible de charger le document"));
  }, [token, docId]);

  // Callback de sauvegarde
  async function handleSave({ title, content, content_text }) {
    await fetch(`${API_URL}/api/documents/${docId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, content, content_text }),
    });
  }

  if (error) return <div style={{ padding: 40, color: "#f87171" }}>{error}</div>;
  if (!doc || !me || !token) return (
    <div style={{
      height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0f0f13", color: "#3a3850", fontFamily: "monospace",
    }}>
      Chargement…
    </div>
  );

  return (
    <CollaborativeEditor
      docId={docId}
      token={token}
      username={me.username}
      initialTitle={doc.title}
      onSave={handleSave}
    />
  );
}
