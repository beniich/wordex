import { useState, useEffect } from 'react';
import { AgentChatPanel } from './AgentChatPanel';
import { AgentWorkflowPanel } from './AgentWorkflowPanel';
import { AgentStatus } from './AgentStatus';
import { AgentDashboard } from './AgentDashboard';

export function AgentTestingInterface() {
  const [activeTab, setActiveTab] = useState<'chat' | 'workflow' | 'status' | 'dashboard'>('dashboard');
  const [selectedAgent, setSelectedAgent] = useState('analyst');
  const [isConnected, setIsConnected] = useState(false);

  const checkAgentConnection = async () => {
    try {
      const response = await fetch('/api/agents/list-agents');
      if (response.ok) {
        setIsConnected(true);
      }
    } catch {
      console.log('Agents non disponibles');
    }
  };

  // Vérifier la connexion aux agents
  useEffect(() => {
    checkAgentConnection();
  }, []);

  return (
    <div className="agent-testing-interface min-h-screen flex flex-col font-manrope">
      {/* Header */}
      <div className="interface-header bg-linear-to-r from-primary to-[#C9A56B] shadow-2xl py-8 px-12 z-10">
        <div className="header-content flex justify-between items-center">
            <div>
              <p className="text-xs text-outline leading-relaxed mb-6 italic opacity-70">&quot;The Multi-Agent Collaborative Workshop&quot;</p>
              <h1 className="text-3xl font-black text-white italic tracking-tighter flex items-center gap-3">
                <span className="material-symbols-outlined text-[32px]">neurology</span>
                Wordex <br/> Agentic Lab
              </h1>
              <p className="text-[10px] text-white/70 uppercase font-black tracking-[0.4em] mt-3">The Multi-Agent Collaborative Workshop</p>
            </div>

          <div className="connection-status flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
            <span className={`w-3 h-3 rounded-full shadow-[0_0_12px] ${isConnected ? 'bg-emerald-400 shadow-emerald-400/50 pulse' : 'bg-rose-400 shadow-rose-400/50'}`}></span>
            <span className="text-[10px] text-white font-black uppercase tracking-widest">{isConnected ? 'Neural Bridge Active' : 'Establishing Synapse...'}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="interface-tabs flex gap-12 px-12 bg-surface/80 backdrop-blur-3xl border-b border-outline-variant/30 sticky top-0 z-20">
        <button 
          className={`tab-btn py-10 text-[11px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'dashboard' ? 'text-primary' : 'text-outline hover:text-primary'}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <span className="flex items-center gap-2">🕹️ Command Center</span>
          {activeTab === 'dashboard' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-4px_12px_rgba(var(--primary-rgb),0.4)]" />}
        </button>
        <button 
          className={`tab-btn py-10 text-[11px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'chat' ? 'text-primary' : 'text-outline hover:text-primary'}`}
          onClick={() => setActiveTab('chat')}
        >
          <span className="flex items-center gap-2">💬 Solo Ops</span>
          {activeTab === 'chat' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-4px_12px_rgba(var(--primary-rgb),0.4)]" />}
        </button>
        <button 
          className={`tab-btn py-10 text-[11px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'workflow' ? 'text-primary' : 'text-outline hover:text-primary'}`}
          onClick={() => setActiveTab('workflow')}
        >
          <span className="flex items-center gap-2">🔄 Crew Workflows</span>
             {activeTab === 'workflow' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-4px_12px_rgba(var(--primary-rgb),0.4)]" />}
        </button>
        <button 
          className={`tab-btn py-10 text-[11px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'status' ? 'text-primary' : 'text-outline hover:text-primary'}`}
          onClick={() => setActiveTab('status')}
        >
          <span className="flex items-center gap-2">📊 Pulse Center</span>
             {activeTab === 'status' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-4px_12px_rgba(var(--primary-rgb),0.4)]" />}
        </button>
      </div>

      {/* Contenu Principal */}
      <div className="interface-content flex-1 bg-gradient-to-br from-[#F5F1E6] via-[#FCF9F5] to-[#E8E2D0] p-12 overflow-auto">
        {activeTab === 'dashboard' && (
          <AgentDashboard />
        )}

        {activeTab === 'chat' && (
          <AgentChatPanel selectedAgent={selectedAgent} onAgentChange={setSelectedAgent} />
        )}
        
        {activeTab === 'workflow' && (
          <AgentWorkflowPanel />
        )}
        
        {activeTab === 'status' && (
          <AgentStatus />
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        .pulse {
          animation: pulse 2s infinite ease-in-out;
        }
      ` }} />
    </div>
  );
}
