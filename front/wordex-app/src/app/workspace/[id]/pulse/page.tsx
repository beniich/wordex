"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import FloatingAIChat from "@/components/ai/FloatingAIChat";
import { documents as docsAPI, notifications as notifAPI, Notification, Document as DocType } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { HocuspocusProvider } from "@hocuspocus/provider";

const TYPE_ICONS: Record<string, string> = {
  edit:    "edit",
  comment: "chat_bubble",
  create:  "add_circle",
  share:   "share",
  review:  "rate_review",
  publish: "publish",
  version_restore: "history",
  member_added: "person_add",
};

export default function PulsePage() {
  const { id: workspaceId } = useParams() as { id: string };
  const { user } = useAuth();
  const [tab, setTab] = useState<"activity" | "presence" | "docs">("activity");

  const [activeDocs, setActiveDocs] = useState<DocType[]>([]);
  const [stream, setStream] = useState<Notification[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  const providerRef = useRef<HocuspocusProvider | null>(null);

  useEffect(() => {
    docsAPI.list(workspaceId).then(setActiveDocs).catch(console.error);
    notifAPI.list().then(setStream).catch(console.error);
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId || !user) return;
    const token = localStorage.getItem("wordex_access_token") || "anon";
    const provider = new HocuspocusProvider({
      url: "ws://localhost:1234",
      name: `workspace-${workspaceId}-global`,
      token,
      onAwarenessUpdate: ({ states }) => {
        const members: any[] = [];
        states.forEach((state: any) => {
          if (state.user) {
             members.push({ ...state.user, stateId: state.id });
          }
        });
        const unique = members.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
        setTeamMembers(unique);
      }
    });

    provider.setAwarenessField("user", {
      id: user.id || token,
      name: user.username || "Anonymous",
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      status: "idle",
      doc: "Pulse Dashboard",
    });

    providerRef.current = provider;
    return () => provider.destroy();
  }, [workspaceId, user]);

  return (
    <AppShell title="Collaborative Pulse">
      <div className="p-8 max-w-7xl mx-auto font-manrope">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-[#131b2e]">Team Pulse</h1>
            <p className="text-[#454652] mt-1 text-sm">
              {teamMembers.length} members active right now
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              {teamMembers.map((m) => (
                <div
                  key={m.id}
                  title={m.name}
                  className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: m.color || "#3a388b" }}
                >
                  {m.name.substring(0, 2).toUpperCase()}
                </div>
              ))}
            </div>
            <span className="text-xs font-bold text-[#454652] bg-[#f2f3ff] px-3 py-1.5 rounded-full">
              {teamMembers.length} online
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#f2f3ff] p-1 rounded-xl w-fit mb-8">
          {(["activity", "presence", "docs"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all
                ${tab === t ? "bg-white text-[#3a388b] shadow-sm" : "text-[#454652] hover:text-[#3a388b]"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "activity" && (
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 lg:col-span-8">
              <div className="bg-white rounded-2xl border border-indigo-50 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-indigo-50 flex items-center justify-between">
                  <h2 className="font-bold text-[#131b2e]">Live Activity Stream</h2>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    Live
                  </span>
                </div>
                <div className="divide-y divide-indigo-50/60">
                  {stream.map((activity, i) => (
                    <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-[#faf8ff] transition-colors">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 bg-[#3a388b]">
                        {activity.actor_name ? activity.actor_name.substring(0, 2).toUpperCase() : "W"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#131b2e]">
                          <span className="font-bold">{activity.actor_name || "Someone"}</span>
                          {" "}
                          <span className="text-[#454652]">registered a {activity.notif_type} event on</span>
                          {" "}
                          <span className="font-semibold text-[#3a388b]">{activity.entity_title || activity.entity_type}</span>
                        </p>
                        <p className="text-[10px] text-[#454652] mt-0.5">{new Date(activity.created_at).toLocaleString()}</p>
                      </div>
                      <span className="material-symbols-outlined text-[18px] shrink-0 text-[#3a388b]">
                        {TYPE_ICONS[activity.notif_type] || "notifications"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 space-y-4">
              <h2 className="font-bold text-[#131b2e]">Active Documents</h2>
              {activeDocs.slice(0, 5).map((doc) => (
                <div key={doc.id} className="bg-white rounded-2xl border border-indigo-50 shadow-sm p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-sm font-bold text-[#131b2e] leading-tight">{doc.title}</h3>
                    <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-[#89f5e7] text-[#003d37]">
                      {doc.doc_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#454652] font-medium">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">update</span>
                      {new Date(doc.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "presence" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {teamMembers.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl border border-indigo-50 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: m.color || "#3a388b" }}>
                      {m.name ? m.name.substring(0, 2).toUpperCase() : "A"}
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-[#131b2e] text-sm">{m.name || "Anonymous"}</p>
                    <p className="text-xs text-[#454652]">Active Member</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700">🟢 Online</span>
                  <span className="text-[#454652] truncate">{m.doc}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "docs" && (
          <div className="bg-white rounded-2xl border border-indigo-50 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-indigo-50">
              <h2 className="font-bold text-[#131b2e]">All Active Documents</h2>
            </div>
            <div className="divide-y divide-indigo-50">
              {activeDocs.map((doc, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-[#f2f3ff] transition-colors cursor-pointer">
                  <div className="p-2 bg-[#eaedff] rounded-xl shrink-0">
                    <span className="material-symbols-outlined text-[#3a388b]">description</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-[#131b2e]">{doc.title}</p>
                    <p className="text-xs text-[#454652] mt-0.5">Updated {new Date(doc.updated_at).toLocaleString()}</p>
                  </div>
                  <span className="px-3 py-1 text-[10px] font-bold rounded-full bg-[#89f5e7] text-[#003d37]">
                    {doc.doc_type}
                  </span>
                  <span className="material-symbols-outlined text-slate-300">chevron_right</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <FloatingAIChat defaultAgent="editor" />
    </AppShell>
  );
}
