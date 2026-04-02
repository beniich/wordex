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
    } catch {
      setMessages((p) => [
        ...p,
        { role: "assistant", content: `⚠️ Could not reach the AI service.` },
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
    } catch {
      setMessages((p) => [
        ...p,
        { role: "assistant", content: "⚠️ Summary not available yet (backend service starting up)." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-surface/90 border-l border-outline-variant/30 backdrop-blur-xl w-80 flex-shrink-0 text-foreground">
      {/* Header */}
      <div className="h-14 border-b border-outline-variant/30 flex items-center justify-between px-4 bg-surface-container-low flex-shrink-0">
        <span className="font-bold text-[#1c1c1a] flex items-center gap-2 text-sm uppercase tracking-widest">
          <Sparkles size={15} className="text-primary" />
          AI Assistant
        </span>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close AI panel"
            className="p-1 hover:bg-outline-variant/20 rounded text-outline hover:text-primary transition-colors"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Quick actions */}
      {docId && (
        <div className="px-4 pt-3 pb-2 border-b border-outline-variant/20 flex gap-2 flex-shrink-0">
          <button
            onClick={handleSummarize}
            disabled={loading}
            className="flex-1 text-xs py-1.5 rounded-lg bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            Summarize
          </button>
          <button
            onClick={() => setInput("Translate the selected text to French:")}
            className="flex-1 text-xs py-1.5 rounded-lg bg-surface-container text-outline font-bold hover:bg-outline-variant/20 hover:text-foreground transition-colors"
          >
            Translate
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-outline-variant/30">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5 border border-primary/20">
                <Sparkles size={10} className="text-primary" />
              </div>
            )}
            <div
              className={[
                "max-w-[85%] rounded-xl px-3 py-2.5 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-white ml-auto shadow-md"
                  : "bg-surface-container border border-outline-variant/30 text-foreground",
              ].join(" ")}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.role === "assistant" && onInsert && (
                <button
                  onClick={() => onInsert(msg.content)}
                  className="mt-2 text-xs text-primary font-bold hover:brightness-110 transition-colors uppercase tracking-widest"
                >
                  + Insert in document
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-outline text-sm font-bold">
            <Loader2 size={13} className="animate-spin text-primary" />
            Thinking...
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-outline-variant/30 bg-surface-container-low flex-shrink-0">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask AI to write or edit..."
            aria-label="AI prompt input"
            className="w-full bg-surface border border-outline-variant/40 rounded-full py-2.5 pl-4 pr-10 text-sm text-foreground placeholder-outline focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            aria-label="Send message"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-outline hover:text-primary disabled:opacity-30 transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
