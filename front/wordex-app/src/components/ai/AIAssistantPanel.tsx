"use client";

import { useState, useRef } from "react";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { ai } from "@/lib/api";

interface Message {
  role: "assistant" | "user";
  content: string;
}

interface AIAssistantPanelProps {
  docId?: string;
  docTitle?: string;
  onInsert?: (text: string) => void;
  onClose?: () => void;
}

export default function AIAssistantPanel({
  docId,
  docTitle,
  onInsert,
  onClose,
}: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: docTitle
        ? `I'm looking at **"${docTitle}"**. How can I help? I can draft content, summarize, translate, or suggest improvements.`
        : "Hi! I'm your Wordex AI assistant. Ask me to write, edit, summarize, or translate anything.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;

    setMessages((p) => [...p, { role: "user", content: prompt }]);
    setInput("");
    setLoading(true);

    try {
      // Get the last assistant context as context for the AI
      const context = messages
        .filter((m) => m.role === "assistant")
        .slice(-1)[0]?.content ?? "";

      const res = await ai.chat([
        { role: "system", content: "You are an AI assistant helping the user with their document." },
        { role: "user", content: prompt + "\nContext: " + context }
      ]);
      setMessages((p) => [...p, { role: "assistant", content: res.response }]);

      // Auto-scroll
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setMessages((p) => [
        ...p,
        { role: "assistant", content: `⚠️ Could not reach the AI service: ${message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!docId) return;
    setLoading(true);
    try {
      const res = await ai.summarize("Summarize the current document.", "paragraph");
      setMessages((p) => [...p, { role: "assistant", content: `📄 **Summary:**\n\n${res.summary}` }]);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err: unknown) {
      setMessages((p) => [
        ...p,
        { role: "assistant", content: "⚠️ Summary not available yet (backend service starting up)." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/60 border-l border-white/10 backdrop-blur-xl w-80 flex-shrink-0">
      {/* Header */}
      <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-slate-900/80 flex-shrink-0">
        <span className="font-semibold text-white flex items-center gap-2 text-sm">
          <Sparkles size={15} className="text-indigo-400" />
          AI Assistant
        </span>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close AI panel"
            className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Quick actions */}
      {docId && (
        <div className="px-4 pt-3 pb-2 border-b border-white/5 flex gap-2 flex-shrink-0">
          <button
            onClick={handleSummarize}
            disabled={loading}
            className="flex-1 text-xs py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 transition-colors disabled:opacity-50"
          >
            Summarize
          </button>
          <button
            onClick={() => setInput("Translate the selected text to French:")}
            className="flex-1 text-xs py-1.5 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            Translate
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-indigo-600/40 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                <Sparkles size={10} className="text-indigo-400" />
              </div>
            )}
            <div
              className={[
                "max-w-[85%] rounded-xl px-3 py-2.5 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-indigo-600/30 text-white ml-auto"
                  : "bg-white/5 border border-white/5 text-slate-300",
              ].join(" ")}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.role === "assistant" && onInsert && (
                <button
                  onClick={() => onInsert(msg.content)}
                  className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  + Insert in document
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Loader2 size={13} className="animate-spin" />
            Thinking...
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-slate-900/80 flex-shrink-0">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask AI to write or edit..."
            aria-label="AI prompt input"
            className="w-full bg-slate-950 border border-white/10 rounded-full py-2.5 pl-4 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            aria-label="Send message"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-400 disabled:opacity-30 transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
