"use client";

import { useEffect, useState, use } from "react";
import AppShell from "@/components/layout/AppShell";
import { webhooks, Webhook, WebhookDelivery } from "@/lib/api";
import { useParams } from "next/navigation";

export default function WebhooksPage() {
  const params = useParams();
  const workspaceId = params.id as string;

  const [hooks, setHooks] = useState<Webhook[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["*"]);
  const [name, setName] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const [deliveries, setDeliveries] = useState<Record<string, WebhookDelivery[]>>({});

  useEffect(() => {
    fetchData();
  }, [workspaceId]);

  async function fetchData() {
    try {
      const [allHooks, eventsRes] = await Promise.all([
        webhooks.list(workspaceId),
        webhooks.listEventTypes(),
      ]);
      setHooks(allHooks);
      setEventTypes(eventsRes.event_types);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!url || !secret) return;
    try {
      await webhooks.create({
        workspace_id: workspaceId,
        url,
        secret,
        events: selectedEvents,
        name
      });
      setUrl("");
      setSecret("");
      setSelectedEvents(["*"]);
      setShowAdd(false);
      fetchData();
    } catch (err) {
      alert("Failed to create webhook");
    }
  }

  async function toggleStatus(hook: Webhook) {
    try {
      await webhooks.update(hook.id, { active: !hook.active });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteHook(id: string) {
    if (!confirm("Are you sure?")) return;
    try {
      await webhooks.delete(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  }

  async function viewDeliveries(id: string) {
    try {
      const res = await webhooks.getDeliveries(id);
      setDeliveries(prev => ({ ...prev, [id]: res.deliveries }));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <AppShell title="Developer Settings">
      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black text-[#131b2e] tracking-tight">Webhooks</h1>
            <p className="text-[#454652] mt-2">
              Receive real-time notifications for events happening in your workspace.
            </p>
          </div>
          <button 
            onClick={() => setShowAdd(!showAdd)}
            className="px-6 py-2.5 bg-[#894d0d] text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg hover:scale-105 transition-all"
          >
            {showAdd ? "Cancel" : "Add Endpoint"}
          </button>
        </div>

        {showAdd && (
          <div className="glass-panel p-6 mb-10 border-[#d8c3b4]/30 animate-in fade-in slide-in-from-top-4">
            <h3 className="text-lg font-bold text-[#131b2e] mb-4">Register New Webhook</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-[#894d0d] mb-1.5 ml-1">Friendly Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Production Server"
                  className="w-full bg-[#fcf9f5] border border-[#d8c3b4]/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#894d0d]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest text-[#894d0d] mb-1.5 ml-1">Endpoint URL</label>
                <input 
                  type="url" 
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://api.yourdomain.com/webhooks"
                  className="w-full bg-[#fcf9f5] border border-[#d8c3b4]/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#894d0d]"
                />
              </div>
            </div>
            <div className="mb-6">
               <label className="block text-[10px] uppercase font-black tracking-widest text-[#894d0d] mb-1.5 ml-1">Signing Secret</label>
               <input 
                  type="text" 
                  value={secret}
                  onChange={e => setSecret(e.target.value)}
                  placeholder="Enter a secure string for HMAC-SHA256"
                  className="w-full bg-[#fcf9f5] border border-[#d8c3b4]/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#894d0d]"
                />
            </div>
            
            <div className="mb-8">
              <label className="block text-[10px] uppercase font-black tracking-widest text-[#894d0d] mb-3 ml-1">Events to Subscribe</label>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setSelectedEvents(["*"])}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedEvents.includes("*") ? "bg-[#894d0d] text-white" : "bg-white/50 text-[#524439] hover:bg-white"}`}
                >
                  All Events
                </button>
                {eventTypes.map(et => (
                  <button 
                    key={et}
                    onClick={() => {
                        if (selectedEvents.includes("*")) {
                            setSelectedEvents([et]);
                        } else {
                            setSelectedEvents(prev => prev.includes(et) ? prev.filter(p => p !== et) : [...prev, et]);
                        }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedEvents.includes(et) ? "bg-[#894d0d] text-white" : "bg-white/50 text-[#524439] hover:bg-white"}`}
                  >
                    {et}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleAdd}
              className="w-full py-3 bg-[#131b2e] text-white rounded-xl font-bold uppercase tracking-[0.2em] text-xs shadow-xl active:scale-[0.98] transition-all"
            >
              Confirm Registration
            </button>
          </div>
        )}

        <div className="space-y-6">
          {hooks.length === 0 && !loading && (
            <div className="text-center py-20 bg-orange-50/30 rounded-3xl border-2 border-dashed border-[#d8c3b4]/30">
              <span className="material-symbols-outlined text-4xl text-[#d8c3b4] mb-2">webhook</span>
              <p className="text-[#857467] font-medium">No webhooks configured yet.</p>
            </div>
          )}

          {hooks.map(hook => (
            <div key={hook.id} className="bg-white rounded-3xl p-6 shadow-[0_10px_30px_rgba(28,28,26,0.03)] border border-[#d8c3b4]/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-bold text-[#131b2e]">{hook.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${hook.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"}`}>
                      {hook.active ? "Active" : "Paused"}
                    </span>
                  </div>
                  <code className="text-xs text-[#894d0d] break-all opacity-80">{hook.url}</code>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => toggleStatus(hook)}
                     className="p-2 bg-orange-50 text-[#894d0d] rounded-lg hover:bg-[#894d0d] hover:text-white transition-all"
                     title={hook.active ? "Deactivate" : "Activate"}
                   >
                     <span className="material-symbols-outlined text-[18px]">{hook.active ? "pause" : "play_arrow"}</span>
                   </button>
                   <button 
                     onClick={() => deleteHook(hook.id)}
                     className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                   >
                     <span className="material-symbols-outlined text-[18px]">delete</span>
                   </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {hook.events.map(ev => (
                  <span key={ev} className="px-2.5 py-1 bg-[#fcf9f5] border border-[#d8c3b4]/30 rounded-lg text-[10px] font-bold text-[#524439] uppercase tracking-widest">
                    {ev}
                  </span>
                ))}
              </div>

              <div className="border-t border-[#d8c3b4]/20 pt-4 mt-4">
                <button 
                   onClick={() => viewDeliveries(hook.id)}
                   className="text-[10px] font-black uppercase tracking-widest text-[#894d0d] flex items-center gap-2 hover:opacity-70"
                >
                  <span className="material-symbols-outlined text-[16px]">history</span>
                  View Recent Deliveries
                </button>

                {deliveries[hook.id] && (
                   <div className="mt-4 space-y-2 max-h-60 overflow-y-auto no-scrollbar pr-2">
                     {deliveries[hook.id].map((log, i) => (
                       <div key={i} className="flex items-center justify-between p-3 bg-[#fcf9f5] rounded-xl text-[10px]">
                         <div className="flex items-center gap-3">
                           <span className={`w-2 h-2 rounded-full ${log.success ? "bg-emerald-500" : "bg-red-500"}`}></span>
                           <span className="font-bold text-[#131b2e] uppercase">{log.event_type}</span>
                           <span className="text-[#857467] font-medium">{new Date(log.timestamp).toLocaleTimeString()}</span>
                         </div>
                         <div className="flex items-center gap-4">
                            <span className="font-black text-[#524439]">STATUS {log.status}</span>
                            <button className="material-symbols-outlined text-[14px] text-[#d8c3b4] hover:text-[#131b2e]">expand_more</button>
                         </div>
                       </div>
                     ))}
                   </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
