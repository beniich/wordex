"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import FloatingAIChat from "@/components/ai/FloatingAIChat";
import { 
  BookOpen, 
  Terminal, 
  Zap, 
  Copy, 
  Check, 
  Send, 
  Code2, 
  Cpu, 
  Trophy, 
  LineChart 
} from "lucide-react";

export default function DeveloperPage() {
  const [activeTab, setActiveTab] = useState<"docs" | "playground" | "limits">("docs");
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <AppShell title="Protocol Dev Hub">
      <div className="max-w-7xl mx-auto space-y-12 py-12 px-6 font-body animate-fade-in-up">
        
        {/* ── Page Header ────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-inverse-surface text-surface flex items-center justify-center shadow-2xl">
                 <Terminal size={24} />
              </div>
              <h1 className="text-4xl font-black text-foreground tracking-tighter leading-none">Protocol Developer Portal</h1>
           </div>
           <p className="text-[12px] font-black text-outline uppercase tracking-[0.4em] opacity-40 ml-1">Forge custom connections and automate your atelier</p>
        </div>

        {/* ── Tab Navigation ──────────────────────────────────────── */}
        <div className="flex gap-1 p-1 bg-surface-container-low/40 rounded-2xl w-fit backdrop-blur-xl border border-outline-variant/10">
           <button 
             onClick={() => setActiveTab('docs')}
             className={`px-8 py-3 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center gap-2 ${activeTab === 'docs' ? 'bg-white text-primary shadow-sm' : 'text-outline opacity-60 hover:opacity-100'}`}
           >
             <BookOpen size={14} /> Documentation
           </button>
           <button 
             onClick={() => setActiveTab('playground')}
             className={`px-8 py-3 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center gap-2 ${activeTab === 'playground' ? 'bg-white text-primary shadow-sm' : 'text-outline opacity-60 hover:opacity-100'}`}
           >
             <Zap size={14} /> API Console
           </button>
           <button 
             onClick={() => setActiveTab('limits')}
             className={`px-8 py-3 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center gap-2 ${activeTab === 'limits' ? 'bg-white text-primary shadow-sm' : 'text-outline opacity-60 hover:opacity-100'}`}
           >
             <LineChart size={14} /> Rate Limits
           </button>
        </div>

        {/* ── Content Switcher ────────────────────────────────────── */}
        <div className="min-h-[600px] transition-all">
           {activeTab === 'docs' && <ApiDocumentation copyToClipboard={copyToClipboard} copied={copied} />}
           {activeTab === 'playground' && <ApiPlayground />}
           {activeTab === 'limits' && <ApiQuotas />}
        </div>

      </div>
      <FloatingAIChat defaultAgent="code" />
    </AppShell>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ── API DOCUMENTATION SECTION
   ───────────────────────────────────────────────────────────────────────────── */
interface ApiDocsProps {
  copyToClipboard: (text: string, id: string) => void;
  copied: string | null;
}

function ApiDocumentation({ copyToClipboard, copied }: ApiDocsProps) {
  const curlExample = `curl -X POST "https://api.wordex.io/v1/documents" \\
     -H "Authorization: Bearer YOUR_API_TOKEN" \\
     -H "Content-Type: application/json" \\
     -d '{
       "title": "New Protocol",
       "content": "Building for the infinite canvas."
     }'`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-fade-in-up">
       <div className="lg:col-span-2 space-y-12">
          <section className="space-y-6">
             <h2 className="text-2xl font-black text-foreground tracking-tighter">Foundation Protocols</h2>
             <p className="text-[14px] leading-relaxed text-on-surface-variant font-medium">
                The Wordex API is a RESTful gateway designed for low-latency collaboration and high-fidelity document management. 
                Utilizing secure RS256 JWT tokens and event-driven architectures, we provide the tools to build your own integrated atelier.
             </p>
             <div className="p-6 bg-surface-container-low/40 rounded-4xl border border-outline-variant/10">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <Code2 size={16} />
                   </div>
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Base Operational URL</h3>
                </div>
                <code className="text-sm font-mono font-bold text-foreground bg-white/50 px-4 py-2 rounded-xl border border-outline-variant/10">https://api.wordex.io/v1</code>
             </div>
          </section>

          <section className="space-y-6">
             <h3 className="text-xl font-black text-foreground tracking-tighter">Authentication</h3>
             <p className="text-[14px] leading-relaxed text-on-surface-variant font-medium">Use the Bearer authorization header to authenticate your requests with the Secret Protocol issued in your console.</p>
             <div className="relative group">
                <button 
                  onClick={() => copyToClipboard(curlExample, 'curl')}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-white/40 hover:bg-white text-outline transition-all z-10"
                >
                   {copied === 'curl' ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                </button>
                <pre className="p-8 bg-inverse-surface text-surface rounded-4xl font-mono text-xs overflow-x-auto shadow-2xl leading-relaxed whitespace-pre-wrap">
                   {curlExample}
                </pre>
             </div>
          </section>
       </div>

       <aside className="space-y-6">
          <div className="p-8 rounded-4xl bg-white border border-outline-variant/10 shadow-sm space-y-6">
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-outline opacity-60">Status Protocols</h4>
             <div className="space-y-4">
                <StatusItem code="200" label="Success" color="bg-primary" />
                <StatusItem code="401" label="Invalid Protocol" color="bg-red-500" />
                <StatusItem code="429" label="Capacity Exceeded" color="bg-amber-500" />
                <StatusItem code="503" label="System Overload" color="bg-stone-500" />
             </div>
          </div>
          <div className="p-8 rounded-4xl bg-linear-to-tr from-primary to-primary-container text-white shadow-xl shadow-primary/20 space-y-4">
             <Trophy size={24} />
             <h4 className="font-black text-lg tracking-tighter">SDK Alpha Program</h4>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-relaxed italic">Early access to Node.js and Python SDKs is now open for registered Architects.</p>
             <button className="w-full py-3 bg-white text-primary rounded-xl font-black uppercase tracking-[0.2em] text-[8px] hover:brightness-110 transition-all">Join Program</button>
          </div>
       </aside>
    </div>
  );
}

interface StatusItemProps {
  code: string;
  label: string;
  color: string;
}

function StatusItem({ code, label, color }: StatusItemProps) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-widest uppercase opacity-40">{label}</span>
            <span className={`px-2 py-0.5 rounded-lg ${color} text-white text-[9px] font-black`}>{code}</span>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ── API PLAYGROUND SECTION
   ───────────────────────────────────────────────────────────────────────────── */
function ApiPlayground() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up">
       <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-outline-variant/10 p-8 shadow-sm space-y-8">
             <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Request Endpoint</label>
                <div className="flex items-center gap-2">
                   <select 
                    title="Select HTTP Method"
                    className="bg-surface-container-low px-4 py-4 rounded-2xl font-black uppercase text-[10px] outline-none border-none shadow-inner"
                   >
                      <option>GET</option>
                      <option>POST</option>
                      <option>PUT</option>
                      <option>DELETE</option>
                   </select>
                   <input 
                    title="API Endpoint"
                    className="flex-1 bg-surface-container-low px-6 py-4 rounded-2xl text-xs font-bold font-mono outline-none shadow-inner border-none" 
                    defaultValue="/documents" 
                   />
                </div>
             </div>

             <div className="flex flex-col gap-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Payload (JSON)</label>
                <textarea 
                  title="Request Payload"
                  className="w-full h-48 bg-surface-container-low px-6 py-6 rounded-4xl font-mono text-xs outline-none shadow-inner border-none focus:ring-1 focus:ring-primary/20"
                  defaultValue={`{\n  "title": "Discovery Protocol",\n  "status": "draft"\n}`}
                />
             </div>

             <button className="w-full py-5 bg-inverse-surface text-surface rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3 hover:shadow-2xl hover:brightness-125 transition-all">
                <Send size={16} /> Execute Request
             </button>
          </div>
       </div>

       <div className="space-y-6 flex flex-col h-full">
          <div className="bg-surface-container-high rounded-[2.5rem] border border-outline-variant/10 p-2 flex-1 relative overflow-hidden flex flex-col shadow-inner">
             {/* Terminal Header */}
             <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-inverse-surface opacity-40">System Output</span>
                <div className="flex gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-red-400/50" />
                   <div className="w-2 h-2 rounded-full bg-amber-400/50" />
                   <div className="w-2 h-2 rounded-full bg-emerald-400/50" />
                </div>
             </div>
             {/* Terminal Content */}
             <div className="p-8 font-mono text-[11px] text-on-surface-variant flex-1 overflow-y-auto no-scrollbar whitespace-pre-wrap leading-relaxed opacity-60">
                Ready to accept operational protocols...
                <br /><br />
                Waiting for bridge execution.
             </div>
          </div>
       </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ── API QUOTAS SECTION
   ───────────────────────────────────────────────────────────────────────────── */
function ApiQuotas() {
   const quotas = [
      { id: "q1", label: "Protocol Requests", used: 42, total: 100, unit: "k", detail: "Calls to wordex API endpoints", color: "bg-primary" },
      { id: "q2", label: "Aether Bandwidth", used: 8.4, total: 200, unit: "GB", detail: "Data flows via external bridges", color: "bg-tertiary" },
      { id: "q3", label: "Integration Slots", used: 4, total: 12, unit: "Units", detail: "Active Bridge marketplace connections", color: "bg-secondary" },
   ];

   return (
      <div className="space-y-12 animate-fade-in-up">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quotas.map(q => (
               <div key={q.id} className="group p-8 rounded-[3rem] bg-white border border-outline-variant/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden relative">
                  <div className={`absolute top-0 left-0 bottom-0 ${q.color} opacity-5 transition-all duration-1000`} style={{ width: `${(q.used/q.total)*100}%` }} />
                  <div className="relative z-10 flex flex-col h-full">
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-outline opacity-60">{q.label}</span>
                        <Cpu className="text-primary/40" size={14} />
                     </div>
                     <div className="mt-auto">
                        <div className="flex items-baseline gap-1 mb-2">
                           <span className="text-4xl font-black text-foreground tracking-tighter">{q.used}</span>
                           <span className="text-[10px] font-black uppercase tracking-widest text-outline">/ {q.total} {q.unit}</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-container-low rounded-full overflow-hidden mb-2">
                           <div className={`h-full ${q.color} rounded-full`} style={{ width: `${(q.used/q.total)*100}%` }} />
                        </div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-outline opacity-40 italic">{q.detail}</p>
                     </div>
                  </div>
               </div>
            ))}
         </div>

         {/* Plan Highlight Card */}
         <div className="p-10 rounded-[3.5rem] bg-inverse-surface text-surface shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-full right-[-20%] w-[60%] h-[300%] bg-linear-to-b from-primary/20 to-transparent rotate-45 pointer-events-none group-hover:rotate-60 transition-transform duration-1000" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                        <Zap size={20} />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Operational Tier</span>
                  </div>
                  <h3 className="text-4xl font-black tracking-tighter leading-none">Architect Prime</h3>
                  <p className="text-[12px] opacity-70 leading-relaxed max-w-sm">Exceeding standard capacities was never part of the plan. Experience non-restricted access and ultimate protocol throughput.</p>
               </div>
               <button className="h-14 px-10 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:brightness-110 shadow-xl shadow-primary/30 transition-all active:scale-95">Elevate Tier</button>
            </div>
         </div>
      </div>
   );
}
