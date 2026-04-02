"use client";

import { useState, useRef, useEffect } from "react";
import { aiSessions, AIChatSession } from "@/lib/api";
import { DESIGN_TOKENS } from "@/lib/design";

type AgentType = "editor" | "analyst" | "admin" | "code" | "general";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  context?: string;
}

interface FloatingAIChatProps {
  defaultAgent?: AgentType;
  contextData?: string;
  documentId?: string;
}

const AGENT_CONFIG: Record<AgentType, { label: string; icon: string; color: string; desc: string }> = {
  editor:  { label: "Editor",  icon: "edit_note",           color: DESIGN_TOKENS.colors.primary, desc: "Writing & documents" },
  analyst: { label: "Analyst", icon: "insights",            color: DESIGN_TOKENS.colors.tertiary, desc: "Data & BI insights" },
  admin:   { label: "Admin",   icon: "admin_panel_settings",color: DESIGN_TOKENS.colors.error, desc: "Platform operations" },
  code:    { label: "Coder",   icon: "code",                color: DESIGN_TOKENS.colors.primaryContainer, desc: "Dev & code review" },
  general: { label: "Aether",  icon: "auto_awesome",        color: DESIGN_TOKENS.colors.primary, desc: "General assistant" },
};

const QUICK_PROMPTS: Record<AgentType, string[]> = {
  editor:  ["Continue writing…", "Improve this text", "Summarize selection", "Fix grammar"],
  analyst: ["Analyze this data", "Key insights?", "Generate a chart idea", "Explain the trend"],
  admin:   ["Check system status", "Audit user activity", "Resource usage?", "Deployment checklist"],
  code:    ["Review this code", "Generate a component", "Explain this function", "Refactor for clarity"],
  general: ["What can you do?", "Help me brainstorm", "Translate this", "Summarize for me"],
};

export default function FloatingAIChat({ defaultAgent = "general", contextData, documentId }: FloatingAIChatProps) {
  const [isOpen,   setIsOpen]   = useState(false);
  const [viewMode, setViewMode] = useState<"chat" | "history">("chat");
  const [sessions, setSessions] = useState<AIChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const [agent,    setAgent]    = useState<AgentType>(defaultAgent);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [streaming, setStreaming] = useState("");
  const [ollamaStatus] = useState<"checking" | "online" | "offline">("online");
  const [showAgentPicker, setShowAgentPicker] = useState(false);

  const messagesEnd = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const agentCfg = AGENT_CONFIG[agent];

  useEffect(() => {
    if (isOpen && viewMode === "history") {
      aiSessions.list(documentId).then(setSessions).catch(console.error);
    }
  }, [isOpen, viewMode, documentId]);

  const loadSession = async (session: AIChatSession) => {
    setCurrentSessionId(session.id);
    setAgent(session.agent as AgentType);
    setMessages(session.messages as ChatMessage[]);
    setViewMode("chat");
  };

  const startNewSession = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setViewMode("chat");
  };

  const sendMessage = async (text?: string) => {
    const content = text || input.trim();
    if (!content || loading) return;

    let sessionId = currentSessionId;
    const userMsg: ChatMessage = { role: "user", content };
    const newHistory = [...messages, userMsg];
    
    setMessages(newHistory);
    setInput("");
    setLoading(true);
    setStreaming("");

    try {
      if (!sessionId) {
        const newSession = await aiSessions.create({
          document_id: documentId,
          agent,
          title: content.slice(0, 30) + '...'
        });
        sessionId = newSession.id;
        setCurrentSessionId(sessionId);
      }

      const response = await aiSessions.sendMessage(sessionId, { 
        role: "user", 
        content,
        context: contextData // Pass document context
      });
      setMessages(response.messages as ChatMessage[]);
    } catch {
      setMessages((m) => [...m, {
        role: "assistant",
        content: "⚠️ Could not reach AI backend. Is the server running?",
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close AI Chat" : "Open AI Chat"}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-[1.5rem] shadow-[0_12px_24px_rgba(137,77,13,0.3)]
          flex items-center justify-center transition-all duration-300 hover:-translate-y-1 active:scale-95 border-2 border-white/20 agent-bg-gradient"
        title="Open Aether AI"
      >
        <span
          className="material-symbols-outlined text-[#fcf9f5] text-[32px] drop-shadow-md fill-icon"
        >
          {isOpen ? "close" : agentCfg.icon}
        </span>
        {ollamaStatus === "online" && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-sm" />
        )}
        {ollamaStatus === "offline" && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-amber-400 rounded-full border-2 border-white shadow-sm" />
        )}
      </button>

      {isOpen && (
        <div
          className="fixed bottom-28 right-6 z-50 w-[420px] max-h-[640px] flex flex-col rounded-[2rem] overflow-hidden shadow-[0_30px_60px_rgba(28,28,26,0.1)] border border-outline-variant/30 backdrop-blur-3xl chat-container-bg"
        >
          {/* Header */}
          <div
            className="flex items-center gap-4 px-6 py-5 text-white shadow-sm agent-bg-gradient"
          >
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
              <span
                className="material-symbols-outlined text-[24px] fill-icon"
              >
                {agentCfg.icon}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-extrabold text-lg tracking-tight">{agentCfg.label} Agent</p>
              <p className="text-xs text-orange-100 font-medium uppercase tracking-widest">{agentCfg.desc}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowAgentPicker(!showAgentPicker)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/25 transition-colors text-xs font-bold"
                title="Switch agent"
              >
                <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
              </button>
              <button
                onClick={() => setViewMode(viewMode === "history" ? "chat" : "history")}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/25 transition-colors"
                title="Historique des conversations"
              >
                <span className="material-symbols-outlined text-[20px]">{viewMode === "history" ? "chat" : "history"}</span>
              </button>
              <button
                onClick={startNewSession}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/25 transition-colors"
                title="Nouvelle conversation"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
              </button>
            </div>
          </div>

          {/* Agent Picker */}
          {showAgentPicker && (
            <div className="grid grid-cols-5 gap-2 p-4 bg-surface-container-low border-b border-outline-variant/30">
              {(Object.entries(AGENT_CONFIG) as [AgentType, typeof AGENT_CONFIG.general][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => { setAgent(key); setShowAgentPicker(false); }}
                  className={`flex flex-col items-center justify-center gap-1 p-3 rounded-2xl transition-all
                    ${agent === key ? "bg-white shadow-md scale-105 border border-outline-variant/50" : "hover:bg-white/60 hover:-translate-y-1"}`}
                >
                  <span
                    className="material-symbols-outlined text-[24px]"
                    style={{ color: cfg.color, fontVariationSettings: "'FILL' 1" }}
                  >
                    {cfg.icon}
                  </span>
                  <span className="text-[9px] font-bold text-[#524439] uppercase tracking-wider mt-1">{cfg.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Ollama Status */}
          {ollamaStatus === "offline" && (
            <div className="px-5 py-3 bg-amber-50/80 border-b border-amber-200/50 flex items-center gap-3 backdrop-blur-sm">
              <span className="material-symbols-outlined text-amber-600 text-[20px]">warning</span>
              <span className="text-xs text-amber-800 font-bold">
                Ollama offline — start Docker for AI features
              </span>
            </div>
          )}

          {/* History Mode */}
          {viewMode === "history" && (
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 h-full bg-[#fdfaf6]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-extrabold text-[#524439] text-base">Conversations Récentes</h3>
                <span className="text-[10px] font-bold text-[#A67B5B] bg-[#A67B5B]/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                  {sessions.length} sessions
                </span>
              </div>
              
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 opacity-40">
                  <span className="material-symbols-outlined text-[48px] mb-2">history</span>
                  <p className="text-sm font-medium">Aucun historique disponible</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map(s => (
                    <button 
                      key={s.id} 
                      onClick={() => loadSession(s)}
                      className="w-full text-left p-4 bg-white rounded-2xl shadow-sm border border-outline-variant/30 hover:border-primary/40 hover:shadow-md transition-all flex items-center gap-4 group active:scale-[0.98]"
                    >
                       <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                         <span className="material-symbols-outlined text-[20px] text-primary opacity-70">
                           {AGENT_CONFIG[s.agent as AgentType]?.icon || "forum"}
                         </span>
                       </div>
                       <div className="flex-1 min-w-0">
                         <h4 className="font-bold text-sm text-[#1c1c1a] truncate leading-tight">{s.title || "Nouvelle discussion"}</h4>
                         <div className="flex gap-2 items-center mt-1">
                           <span className="text-[10px] font-bold uppercase text-outline tracking-widest">{s.agent}</span>
                           <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
                           <span className="text-[10px] font-medium text-[#A67B5B]">{new Date(s.updated_at).toLocaleDateString()}</span>
                         </div>
                       </div>
                       <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-all -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100">
                         arrow_forward_ios
                       </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chat Mode */}
          {viewMode === "chat" && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0" style={{ maxHeight: "380px" }}>
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <span
                      className="material-symbols-outlined text-[64px] mb-4 block"
                      style={{ color: agentCfg.color, fontVariationSettings: "'FILL' 1" }}
                    >
                      {agentCfg.icon}
                    </span>
                    <p className="text-xl font-bold text-[#1c1c1a]">Hi! I&apos;m your {agentCfg.label} Agent</p>
                    <p className="text-sm text-[#524439] mt-2 font-medium">{agentCfg.desc}</p>
                    <div className="mt-8 flex flex-col gap-2">
                      {QUICK_PROMPTS[agent].map((p) => (
                        <button
                          key={p}
                          onClick={() => sendMessage(p)}
                          className="px-4 py-3 bg-white/50 hover:bg-white text-primary shadow-sm
                            text-sm font-bold rounded-2xl transition-all border border-[#d8c3b4]/30 hover:-translate-y-0.5 hover:shadow-md"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1" style={{ background: agentCfg.color + "15" }}>
                        <span
                          className="material-symbols-outlined text-[18px]"
                          style={{ color: agentCfg.color, fontVariationSettings: "'FILL' 1" }}
                        >
                          {agentCfg.icon}
                        </span>
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm
                        ${msg.role === "user"
                          ? "text-white rounded-3xl rounded-tr-sm"
                          : "bg-white text-[#1c1c1a] rounded-3xl rounded-tl-sm border border-[#d8c3b4]/20"
                        }`}
                      style={msg.role === "user" ? { background: `linear-gradient(135deg, ${agentCfg.color}, ${DESIGN_TOKENS.colors.primaryContainer})` } : {}}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {loading && !streaming && (
                  <div className="flex justify-start gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1" style={{ background: agentCfg.color + "15" }}>
                      <span
                        className="material-symbols-outlined text-[18px]"
                        style={{ color: agentCfg.color, fontVariationSettings: "'FILL' 1" }}
                      >
                        {agentCfg.icon}
                      </span>
                    </div>
                    <div className="bg-white px-5 py-4 rounded-3xl rounded-tl-sm border border-outline-variant/20 shadow-sm flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-2 h-2 rounded-full animate-bounce bg-primary"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEnd} />
              </div>

              {/* Input */}
              <div className="p-4 bg-white/60 backdrop-blur-xl border-t border-[#d8c3b4]/30">
                <div className="flex gap-3 items-end p-2 bg-white rounded-2xl border border-[#d8c3b4]/50 shadow-inner focus-within:ring-2 focus-within:ring-[#894d0d]/20 transition-all">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder={`Ask ${agentCfg.label} agent…`}
                    rows={1}
                    className="flex-1 min-h-[44px] max-h-32 resize-none bg-transparent border-none
                      px-3 py-3 text-sm text-[#1c1c1a] placeholder:text-stone-400
                      focus:outline-none focus:ring-0 leading-relaxed font-medium"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    aria-label="Send message"
                    className="w-[44px] h-[44px] rounded-xl text-white flex items-center justify-center
                      transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-md"
                    style={{ backgroundColor: agentCfg.color }}
                  >
                    <span className="material-symbols-outlined text-[20px]">send</span>
                  </button>
                </div>
                <p className="text-center text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-3 mb-1">
                  Aether AI can make mistakes. Verify important info.
                </p>
              </div>
            </>
          )}
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        .agent-bg-gradient { background: linear-gradient(135deg, ${agentCfg.color}, ${DESIGN_TOKENS.colors.primaryContainer}); }
        .chat-container-bg { background: rgba(252, 249, 245, 0.95); font-family: 'Manrope', sans-serif; }
        .fill-icon { font-variation-settings: 'FILL' 1; }
        .agent-tint-bg { background: ${agentCfg.color}15; }
        .agent-text { color: ${agentCfg.color}; }
      ` }} />
    </>
  );
}
