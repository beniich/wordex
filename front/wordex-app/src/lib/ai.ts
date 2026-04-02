/**
 * Wordex Ollama AI Client — Frontend SDK
 * Connects to the backend AI agent (which connects to Ollama)
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type AgentType = "editor" | "analyst" | "admin" | "code" | "general";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatOptions {
  agent?: AgentType;
  stream?: boolean;
  temperature?: number;
  onToken?: (token: string) => void;
  onDone?: () => void;
}

// ── Auth helper ───────────────────────────────────────────────────────────────
function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined"
    ? localStorage.getItem("wordex_token")
    : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── AI API ────────────────────────────────────────────────────────────────────

export const aiAPI = {
  /**
   * Health check — verify Ollama is running
   */
  async health() {
    try {
      const res = await fetch(`${API_BASE}/api/ai/health`);
      return res.json();
    } catch {
      return { status: "offline", error: "Cannot reach backend" };
    }
  },

  /**
   * List available Ollama models
   */
  async listModels() {
    const res = await fetch(`${API_BASE}/api/ai/models`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  /**
   * Universal chat with streaming support
   */
  async chat(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): Promise<string> {
    const { agent = "general", stream = false, temperature = 0.7, onToken, onDone } = options;

    if (stream && onToken) {
      // SSE streaming mode
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ messages, agent, stream: true, temperature }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (!reader) throw new Error("No response body");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            onDone?.();
            break;
          }
          try {
            const parsed = JSON.parse(data);
            const token = parsed.token || "";
            fullText += token;
            onToken(token);
          } catch {}
        }
      }
      return fullText;
    }

    // Non-streaming mode
    const res = await fetch(`${API_BASE}/api/ai/chat`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ messages, agent, stream: false, temperature }),
    });
    const data = await res.json();
    return data.response || data.error || "";
  },

  /**
   * Writing suggestion (continue/improve/expand/fix)
   */
  async suggest(params: {
    prompt: string;
    context?: string;
    mode?: "continue" | "improve" | "expand" | "fix";
  }): Promise<string> {
    const res = await fetch(`${API_BASE}/api/ai/suggest`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return data.suggestion || "";
  },

  /**
   * Document summarization
   */
  async summarize(params: {
    text: string;
    style?: "bullets" | "paragraph" | "tldr";
    max_length?: number;
  }): Promise<string> {
    const res = await fetch(`${API_BASE}/api/ai/summarize`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return data.summary || "";
  },

  /**
   * Translation
   */
  async translate(params: {
    text: string;
    target_lang: string;
    source_lang?: string;
  }): Promise<string> {
    const res = await fetch(`${API_BASE}/api/ai/translate`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return data.translated || "";
  },

  /**
   * Content analysis
   */
  async analyze(params: {
    content: string;
    analysis_type?: "general" | "sentiment" | "keywords" | "readability";
  }): Promise<string> {
    const res = await fetch(`${API_BASE}/api/ai/analyze`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return data.analysis || "";
  },

  /**
   * Code generation/review/explanation
   */
  async code(params: {
    task?: string;
    code?: string;
    language?: string;
    action?: "generate" | "review" | "explain" | "refactor";
  }): Promise<string> {
    const res = await fetch(`${API_BASE}/api/ai/code`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return data.result || "";
  },

  /**
   * Admin assistant
   */
  async admin(params: { query: string; context?: string }): Promise<string> {
    const res = await fetch(`${API_BASE}/api/ai/admin`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return data.response || "";
  },
};

export default aiAPI;
