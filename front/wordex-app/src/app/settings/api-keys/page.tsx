"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import FloatingAIChat from "@/components/ai/FloatingAIChat";
import WebhookDashboard from "@/components/dashboard/WebhookDashboard";
import { Key, Plus, Copy, Check, ShieldAlert, Zap, RefreshCcw } from "lucide-react";

const API_KEYS = [
  { id: "k1", name: "Production Backend", key: "wx_live_4x7f2k9m...p3q8", created: "Jan 15, 2025", lastUsed: "2 min ago",  env: "production", active: true },
  { id: "k2", name: "Staging Integration", key: "wx_stg_9p2m7n4k...a5b1", created: "Feb 3, 2025",  lastUsed: "1 day ago",  env: "staging",    active: true },
  { id: "k3", name: "CI/CD Pipeline",      key: "wx_live_1k8n3p7q...x2z9", created: "Mar 10, 2025", lastUsed: "3 hrs ago",  env: "production", active: true },
  { id: "k4", name: "Legacy Development",   key: "wx_dev_3n1p9k4m...q7r2",  created: "Nov 2024",    lastUsed: "2 months ago", env: "dev",      active: false },
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState(API_KEYS);
  const [copied, setCopied] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyEnv, setNewKeyEnv] = useState("production");

  const copyKey = (id: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <AppShell title="Bridge & Protocol">
      <div className="max-w-6xl mx-auto space-y-24 py-12 px-6 font-body">

        {/* ── API Secret Protocols ─────────────────────────────────────────── */}
        <section className="space-y-8 animate-fade-in-up">
          <div className="flex items-end justify-between px-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-secondary text-white flex items-center justify-center shadow-lg shadow-secondary/20">
                    <Key size={20} />
                 </div>
                 <h1 className="text-4xl font-black text-foreground tracking-tighter leading-none">Secret Protocols</h1>
              </div>
              <p className="text-[12px] font-black text-outline uppercase tracking-[0.3em] opacity-40 ml-1">Secure Integration Tokens for External Access</p>
            </div>
            
            <button 
              onClick={() => setShowCreate(true)}
              className="h-12 px-8 bg-inverse-surface text-surface rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:shadow-2xl hover:brightness-125 transition-all shadow-xl shadow-black/10 flex items-center gap-3"
            >
              <Plus size={16} />
              Issue Token
            </button>
          </div>

          {/* Token Grid (Tonal Layering) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {keys.map((k) => (
              <div key={k.id} className={`group p-8 rounded-[2.5rem] transition-all duration-500 border border-outline-variant/10 shadow-sm
                ${k.active ? 'bg-white hover:shadow-xl hover:-translate-y-1' : 'bg-surface-container-low opacity-60 grayscale'}`}>
                
                <div className="flex items-start justify-between mb-6">
                   <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                         <h3 className="font-black text-lg tracking-tighter text-foreground">{k.name}</h3>
                         <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] 
                            ${k.env === 'production' ? 'bg-primary/10 text-primary' : 'bg-tertiary/10 text-tertiary'}`}>
                            {k.env}
                         </span>
                       </div>
                      <p className="text-[10px] font-black text-outline uppercase tracking-widest opacity-40">Created {k.created} • Last utilized {k.lastUsed}</p>
                   </div>
                   {!k.active && <ShieldAlert className="text-red-500" size={18} />}
                </div>

                <div className="bg-surface-container-low/60 rounded-2xl p-4 flex items-center justify-between mb-6 border border-outline-variant/5">
                   <code className="text-xs font-mono font-bold text-foreground overflow-hidden text-ellipsis whitespace-nowrap">{k.key}</code>
                   <button 
                    onClick={() => copyKey(k.id, k.key)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white hover:bg-primary/5 hover:text-primary transition-all text-outline border border-outline-variant/10 shadow-sm"
                   >
                      {copied === k.id ? <Check size={16} /> : <Copy size={16} />}
                   </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/10">
                   <div className="flex items-center gap-2">
                      <RefreshCcw size={12} className="text-primary opacity-60" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-outline">Rotate Key</span>
                   </div>
                   {k.active && (
                     <button className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:underline">Revoke Access</button>
                   )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Webhook Telemetry & Management ─────────────────────────────── */}
        <section className="animate-fade-in-up">
           <WebhookDashboard />
        </section>

      </div>

      {/* ── Modal (The Floating Monolith) ───────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-3xl z-100 flex items-center justify-center p-6 transition-all">
          <div className="bg-surface rounded-4xl shadow-2xl p-10 w-full max-w-xl border border-outline-variant/20 animate-fade-in-up">
            <div className="flex items-center gap-4 mb-10">
               <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Zap size={24} />
               </div>
               <div className="flex flex-col">
                  <h3 className="font-black text-2xl text-foreground tracking-tighter">Forge New Protocol</h3>
                  <p className="text-[10px] uppercase font-black tracking-widest text-outline opacity-40">Initialize Secure Bridge Access</p>
               </div>
            </div>

            <div className="space-y-8">
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1">Protocol Identifier</label>
                <input 
                  value={newKeyName} 
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Quantum Core Integration"
                  className="w-full px-6 py-4 bg-surface-container-low border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 shadow-inner" 
                />
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-1">Operational Environment</label>
                <div className="grid grid-cols-3 gap-3">
                  {["production", "staging", "dev"].map((env) => (
                    <button key={env} onClick={() => setNewKeyEnv(env)}
                      className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
                        ${newKeyEnv === env ? "bg-inverse-surface text-surface shadow-xl shadow-black/10 scale-105" : "bg-white text-on-surface-variant hover:bg-primary/5 hover:text-primary shadow-sm"}`}>
                      {env}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-12">
              <button 
                onClick={() => setShowCreate(false)}
                className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-outline hover:bg-stone-100 transition-all"
              >
                Retreat
              </button>
              <button 
                onClick={() => {
                  if (newKeyName) {
                    setKeys((k) => [{ id: Date.now().toString(), name: newKeyName, key: `wx_${newKeyEnv.slice(0,4)}_${Math.random().toString(36).slice(2,10)}...`, created: "Just now", lastUsed: "Never", env: newKeyEnv, active: true }, ...k]);
                    setNewKeyName(""); setShowCreate(false);
                  }
                }} 
                className="flex-2 py-5 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:brightness-110 shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                Forge Token
              </button>
            </div>
          </div>
        </div>
      )}

      <FloatingAIChat defaultAgent="code" />
      
      <div className="hidden">
        <div className="animate-fade-in-up" />
      </div>
    </AppShell>
  );
}
