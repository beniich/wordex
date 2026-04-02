"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import FloatingAIChat from "@/components/ai/FloatingAIChat";
import WebhookDashboard from "@/components/dashboard/WebhookDashboard";
import { 
  Search, 
  MessageSquare, 
  Cloud, 
  Zap, 
  Code2, 
  Layout, 
  Square, 
  Box, 
  Filter,
  CheckCircle2 
} from "lucide-react";

const CATEGORIES = ["All Systems", "Communication", "Productivity", "Storage", "DevOps"];

const INTEGRATIONS = [
  { id: "i1", name: "Slack", description: "Broadcast atelier events to your team in real-time.", category: "Communication", icon: <MessageSquare className="text-[#4A154B]" />, connected: true },
  { id: "i2", name: "Discord", description: "Streamline collaboration with rich webhook alerts.", category: "Communication", icon: <MessageSquare className="text-[#5865F2]" />, connected: false },
  { id: "i3", name: "GitHub", description: "Link your protocols to code deployment pipelines.", category: "DevOps", icon: <Code2 className="text-[#181717]" />, connected: false },
  { id: "i4", name: "Zapier", description: "Connect Wordex to over 5,000+ specialized apps.", category: "Productivity", icon: <Zap className="text-[#FF4A00]" />, connected: true },
  { id: "i5", name: "Dropbox", description: "Automated archiving of document exports.", category: "Storage", icon: <Cloud className="text-[#0061FF]" />, connected: false },
  { id: "i6", name: "Notion", description: "Sync document snapshots to your team workspace.", category: "Productivity", icon: <Box className="text-[#000000]" />, connected: false },
  { id: "i7", name: "Trello", description: "Generate cards from document action items.", category: "Productivity", icon: <Layout className="text-[#0079BF]" />, connected: false },
  { id: "i8", name: "Framer", description: "Link design assets directly to your editor.", category: "Productivity", icon: <Square className="text-[#0055FF]" />, connected: false },
];

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<"marketplace" | "management">("marketplace");
  const [activeCategory, setActiveCategory] = useState("All Systems");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = INTEGRATIONS.filter(item => 
    (activeCategory === "All Systems" || item.category === activeCategory) &&
    (item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AppShell title="Bridge Marketplace">
      <div className="max-w-7xl mx-auto space-y-16 py-12 px-6 font-body">

        {/* ── Sub-Nav (Marketplace vs Manage) ────────────────────── */}
        <div className="flex flex-col gap-8">
           <div className="flex items-center gap-1 p-1 bg-surface-container-low/40 rounded-4xl w-fit backdrop-blur-xl border border-outline-variant/10">
              <button 
                onClick={() => setActiveTab('marketplace')}
                className={`px-8 py-3 rounded-4xl font-black uppercase tracking-[0.2em] text-[10px] transition-all ${activeTab === 'marketplace' ? 'bg-white text-primary shadow-sm' : 'text-outline opacity-60 hover:opacity-100'}`}
              >
                Marketplace
              </button>
              <button 
                onClick={() => setActiveTab('management')}
                className={`px-8 py-3 rounded-4xl font-black uppercase tracking-[0.2em] text-[10px] transition-all ${activeTab === 'management' ? 'bg-white text-primary shadow-sm' : 'text-outline opacity-60 hover:opacity-100'}`}
              >
                Active Bridges
              </button>
           </div>

           {activeTab === 'marketplace' ? (
             <div className="space-y-12 animate-fade-in-up">
                {/* ── Search & Filter Bar ────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="relative group max-w-lg w-full">
                     <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors" size={18} />
                     <input 
                        type="text" 
                        placeholder="Search for external protocols..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-16 pr-8 py-5 bg-white rounded-[2.5rem] border border-outline-variant/5 shadow-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all font-black uppercase tracking-widest text-[10px]"
                     />
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                     {CATEGORIES.map(cat => (
                        <button 
                          key={cat} 
                          onClick={() => setActiveCategory(cat)}
                          className={`flex items-center gap-2 px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border
                            ${activeCategory === cat ? 'bg-inverse-surface text-surface border-transparent shadow-xl' : 'bg-white text-outline border-outline-variant/10 hover:border-primary/20'}
                          `}
                        >
                           {cat === 'All Systems' && <Filter size={10} />}
                           {cat}
                        </button>
                     ))}
                  </div>
                </div>

                {/* ── Grid of Integrations ────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {filtered.map(item => (
                      <div key={item.id} className="group flex flex-col bg-white rounded-[3rem] p-8 border border-outline-variant/5 shadow-[20px_0_40px_rgba(28,28,26,0.02)] hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden">
                         {item.connected && (
                            <div className="absolute top-6 right-6">
                               <CheckCircle2 className="text-primary" size={20} />
                            </div>
                         )}
                         
                         <div className="w-16 h-16 rounded-3xl bg-surface-container-low flex items-center justify-center mb-8 border border-outline-variant/10 group-hover:bg-primary/5 transition-colors">
                            {/* Icon Wrapper */}
                            <div className="scale-125">{item.icon}</div>
                         </div>

                         <div className="flex-1">
                            <h3 className="text-lg font-black text-foreground tracking-tighter mb-2">{item.name}</h3>
                            <p className="text-[12px] font-medium text-outline leading-relaxed opacity-70 mb-8">{item.description}</p>
                         </div>

                         <button className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[9px] transition-all border
                            ${item.connected 
                              ? 'bg-surface-container-high text-on-surface-variant border-outline-variant/10 cursor-default' 
                              : 'bg-white text-primary border-primary/20 hover:bg-primary hover:text-white shadow-sm hover:shadow-lg shadow-primary/10'
                            }`}
                         >
                            {item.connected ? 'Configured' : 'Initialize'}
                         </button>
                      </div>
                   ))}
                </div>
             </div>
           ) : (
             <div className="animate-fade-in-up">
                <WebhookDashboard />
             </div>
           )}
        </div>

      </div>

      <FloatingAIChat defaultAgent="code" />
    </AppShell>
  );
}
