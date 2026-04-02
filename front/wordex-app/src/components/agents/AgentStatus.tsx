import { useState, useEffect } from 'react';

export function AgentStatus() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/ai/health');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch AI health', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-center py-20 font-black uppercase text-[10px] tracking-widest opacity-40">Consulting AI Heartbeat...</div>;

  return (
    <div className="agent-status space-y-12 max-w-4xl mx-auto p-12">
      <div className="grid grid-cols-2 gap-8">
        <div className="stat-card bg-[#FFF5E6]/50 p-8 rounded-[2rem] border border-[#A67B5B]/20">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-[#A67B5B]">Engine Status</h4>
          <p className={`text-4xl font-black ${stats?.status === 'online' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {stats?.status === 'online' ? 'PULSING' : 'FLATLINE'}
          </p>
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest mt-2">{stats?.ollama_url}</p>
        </div>

        <div className="stat-card bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/30">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-primary">Active Vault</h4>
          <p className="text-4xl font-black text-foreground">{stats?.model || 'None'}</p>
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest mt-2">Current Neural Weights</p>
        </div>
      </div>

      <div className="vault-list bg-white p-10 rounded-[3rem] shadow-xl border border-outline-variant/10">
        <h4 className="text-[12px] font-black uppercase tracking-[0.4em] mb-8 text-center text-outline">Available Models in Vault</h4>
        <div className="space-y-4">
          {stats?.available_models?.map((model: string) => (
            <div key={model} className="flex items-center justify-between p-5 bg-[#FCF9F5] rounded-2xl border border-outline-variant/10 group hover:border-primary/30 transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary group-hover:scale-125 transition-transform">memory</span>
                <span className="font-bold text-sm tracking-tight text-foreground">{model}</span>
              </div>
              <span className="px-3 py-1 bg-emerald-600/10 text-emerald-600 text-[10px] font-black rounded-full tracking-widest">READY</span>
            </div>
          )) || <p className="text-center opacity-40 font-bold uppercase text-[10px] tracking-widest">No models discovered in the neural vaults.</p>}
        </div>
      </div>

      <div className="system-health p-8 bg-inverse-surface rounded-3xl text-inverse-on-surface">
        <h4 className="text-[9px] font-black uppercase tracking-[0.3em] mb-4 opacity-50">Wordex Engine Infrastructure</h4>
        <div className="grid grid-cols-3 gap-6">
          <div className="flex flex-col gap-1">
             <span className="text-[10px] font-black uppercase tracking-[0.1em]">Event Loop</span>
             <span className="text-xs font-bold text-emerald-400">NOMINAL</span>
          </div>
          <div className="flex flex-col gap-1">
             <span className="text-[10px] font-black uppercase tracking-[0.1em]">Memory Fabric</span>
             <span className="text-xs font-bold text-emerald-400">OPTIMIZED</span>
          </div>
          <div className="flex flex-col gap-1">
             <span className="text-[10px] font-black uppercase tracking-[0.1em]">Agent Latency</span>
             <span className="text-xs font-bold text-emerald-400">LOW</span>
          </div>
        </div>
      </div>
    </div>
  );
}
