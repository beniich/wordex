"use client";

import { useState } from "react";
import { Plus, Link2, ShieldCheck, History, MoreHorizontal, Settings } from "lucide-react";
import WebhookAnalytics from "@/components/analytics/WebhookAnalytics";

export default function WebhookDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "logs" | "settings">("overview");

  return (
    <div className="flex flex-col gap-10 font-body animate-fade-in-up">
      
      {/* ── Top Header Section (The Floating Command) ───────────────────────── */}
      <div className="flex items-end justify-between px-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                <Link2 size={20} />
             </div>
             <h1 className="text-4xl font-black text-foreground tracking-tighter leading-none">Bridge Management</h1>
          </div>
          <p className="text-[12px] font-black text-outline uppercase tracking-[0.3em] opacity-40 ml-1">Centralized Event Delivery & External Integrations</p>
        </div>
        
        <button className="h-12 px-8 bg-inverse-surface text-surface rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:shadow-2xl hover:brightness-125 transition-all shadow-xl shadow-black/10 flex items-center gap-3">
          <Plus size={16} />
          Create Hook
        </button>
      </div>

      {/* ── Navigation Tabs (Tonal Layering No-Line) ───────────────────────── */}
      <div className="flex gap-1 p-1 bg-surface-container-low/40 rounded-2xl w-fit backdrop-blur-xl border border-outline-variant/10">
        <TabButton icon={<Link2 size={14}/>} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
        <TabButton icon={<History size={14}/>} label="Delivery Logs" active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} />
        <TabButton icon={<Settings size={14}/>} label="Configuration" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </div>

      {/* ── Content Switcher ───────────────────────────────────────────────── */}
      <div className="transition-all duration-500">
        {activeTab === "overview" && <WebhookOverview />}
        {activeTab === "logs" && <div className="p-20 text-center opacity-40 uppercase tracking-[0.5em] font-black text-xs">Accessing Historical Logs...</div>}
        {activeTab === "settings" && <div className="p-20 text-center opacity-40 uppercase tracking-[0.5em] font-black text-xs">Loading Secure Credentials...</div>}
      </div>

    </div>
  );
}

function WebhookOverview() {
  return (
    <div className="space-y-12">
      <WebhookAnalytics />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-on-surface-variant opacity-60">Active Projections</h3>
           <span className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline cursor-pointer">Archive All</span>
        </div>

        <div className="space-y-3">
          <WebhookItem 
            id="HOOK_X12" 
            name="Slack Atelier Notification" 
            url="https://hooks.slack.com/services/..."
            events={["document.created", "comment.added"]}
            status="Active"
            health="Secure"
          />
          <WebhookItem 
            id="HOOK_Y45" 
            name="Cloud Storage Sync" 
            url="https://api.dropbox.com/api/v2/..."
            events={["export.completed"]}
            status="Active"
            health="Secure"
          />
          <WebhookItem 
            id="HOOK_Z99" 
            name="Custom BI Ingestion" 
            url="https://analytics.internal/ingest"
            events={["*"]}
            status="Paused"
            health="Unknown"
          />
        </div>
      </div>
    </div>
  );
}

interface TabButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function TabButton({ icon, label, active, onClick }: TabButtonProps) {
    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black uppercase tracking-[0.2em] text-[9px] transition-all
                ${active ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:bg-white/40 opacity-60 hover:opacity-100'}
            `}
        >
            {icon}
            {label}
        </button>
    );
}

interface WebhookItemProps {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: string;
  health: string;
}

function WebhookItem({ name, url, events, status, health }: WebhookItemProps) {
  return (
    <div className="group p-6 rounded-[2.2rem] bg-stone-50/40 hover:bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all duration-500 border border-outline-variant/5 flex items-center justify-between backdrop-blur-md">
       <div className="flex items-center gap-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center border border-outline-variant/20 group-hover:bg-primary/5 transition-colors ${status === 'Paused' ? 'opacity-40 grayscale' : ''}`}>
             <Link2 size={18} className="text-secondary" />
          </div>
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-3">
                <h4 className="font-black text-sm tracking-tight text-foreground">{name}</h4>
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-stone-200 text-stone-500'}`}>
                    {status}
                </span>
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest text-outline opacity-40 font-mono truncate max-w-[200px]">{url}</p>
          </div>
       </div>

       <div className="hidden lg:flex items-center gap-1">
          {events.map((e: string) => (
             <span key={e} className="px-2 py-1 rounded-lg bg-surface-container-low text-[8px] font-black uppercase tracking-widest text-on-surface-variant border border-outline-variant/10">
                {e}
             </span>
          ))}
       </div>

       <div className="flex items-center gap-8">
          <div className="flex flex-col items-end gap-1">
             <span className="text-[8px] font-black uppercase tracking-[0.2em] text-outline opacity-40">Health</span>
             <div className="flex items-center gap-1.5">
                <ShieldCheck size={12} className={health === 'Secure' ? 'text-primary' : 'text-stone-300'} />
                <span className="text-[9px] font-black uppercase tracking-widest text-foreground">{health}</span>
             </div>
          </div>
          <button 
            title="More Options"
            className="w-10 h-10 rounded-xl hover:bg-stone-100 flex items-center justify-center text-outline transition-all"
          >
             <MoreHorizontal size={18} />
          </button>
       </div>
    </div>
  );
}
