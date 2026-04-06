/**
 * Wordex API Client
 * Central HTTP layer for all frontend ↔ backend communication.
 */

const rawBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const API_BASE = rawBase.endsWith("/api") ? rawBase : `${rawBase}/api`;
const MOCK_ENABLED = true; // Enabled mocks for local development if backend is not available

// ── Token Management ─────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("wordex_access_token");
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem("wordex_access_token", access);
  localStorage.setItem("wordex_refresh_token", refresh);
}

export function clearTokens() {
  localStorage.removeItem("wordex_access_token");
  localStorage.removeItem("wordex_refresh_token");
}

// ── Core Fetch ────────────────────────────────────────────────────────────────

interface RequestOptions extends RequestInit {
  auth?: boolean;
}

async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });

    if (res.status === 401) {
      // Attempt token refresh
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        headers["Authorization"] = `Bearer ${getToken()}`;
        const retryRes = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });
        if (!retryRes.ok) throw new APIError(retryRes.status, await retryRes.json());
        return retryRes.status === 204 ? (null as T) : retryRes.json();
      }
      clearTokens();
      throw new APIError(401, { detail: "Session expired" });
    }

    if (!res.ok) {
      const detail: unknown = await res.json().catch(() => ({ detail: res.statusText }));
      throw new APIError(res.status, detail as Record<string, unknown>);
    }

    return res.status === 204 ? (null as T) : res.json();
  } catch (err) {
    if (MOCK_ENABLED && (err instanceof TypeError || (err as Error).name === 'TypeError')) {
      console.warn(`[API MOCK] Falling back for ${path}`);
      return getMockResponse(path) as T;
    }
    throw err;
  }
}

function getMockResponse(path: string): unknown {
  if (path.includes("/workspaces/")) return [{ id: "ws-1", name: "Alpha Workshop", slug: "alpha" }];
  
  // Documents / Sheets / Slides
  if (path.includes("/documents/recent")) return [
    { id: "doc-1", title: "Project Overview", doc_type: "note", updated_at: new Date().toISOString(), workspace_id: "ws-1" },
    { id: "doc-2", title: "Budget tracker", doc_type: "spreadsheet", updated_at: new Date().toISOString(), workspace_id: "ws-1" }
  ];
  
  if (path.includes("/documents/")) {
    if (path.includes("workspace_id=")) return [
      { id: "sheet-1", title: "Production Schedule", doc_type: "spreadsheet", updated_at: new Date().toISOString(), workspace_id: "ws-1" },
      { id: "slide-1", title: "Monthly Review", doc_type: "presentation", updated_at: new Date().toISOString(), workspace_id: "ws-1" }
    ];
    // Creation or Single Doc
    return { id: "new-doc-" + Math.random().toString(36).substr(2, 9), title: "Untitled", doc_type: "note", workspace_id: "ws-1" };
  }

  if (path.includes("/sheets/")) return { 
    id: "sheet-1",
    cells: { "A1": { value: 10, lastModified: new Date() }, "A2": { value: 5, lastModified: new Date() }, "A3": { value: "=SUM(A1:A2)", computedValue: 15, lastModified: new Date() } },
    metadata: { title: "Production Data", version: 1 }
  };
  
  if (path.includes("/slides/")) return {
    id: "slide-1",
    slides: [{ id: "s1", title: "Overview", content: "Industrial Status" }],
    metadata: { title: "Project Slides", version: 1 }
  };

  // Dashboard Hub
  if (path.includes("/dashboard/trs-oee")) return { machines: [
    { machine: "Presse A1", oee: 88, availability: 92, performance: 96, quality: 99, timeline: Array(10).fill(0).map((_, i) => ({ time: i+'h', value: 80 + Math.random()*20 })) },
    { machine: "Ligne B2", oee: 72, availability: 85, performance: 88, quality: 97, timeline: Array(10).fill(0).map((_, i) => ({ time: i+'h', value: 70 + Math.random()*20 })) }
  ]};
  if (path.includes("/dashboard/production-tracking")) return { production: [
    { equipe: "Matin", lotsProduits: 240, oee: 82, target: 250 },
    { equipe: "Après-midi", lotsProduits: 210, oee: 78, target: 250 },
    { equipe: "Nuit", lotsProduits: 190, oee: 85, target: 200 }
  ] };
  if (path.includes("/dashboard/s-curve")) return { 
    curve: Array(12).fill(0).map((_, i) => ({ date: `W${i+1}`, reference: i*8, replanifie: i*7.5, reel: i < 8 ? i*7.2 : null })), 
    completionRate: 0.65, 
    delayPercentage: 4.2 
  };
  if (path.includes("/dashboard/amdec")) return { 
    failureModes: [
      { mode: "Surchauffe Moteur", severity: 8, occurrence: 3, detection: 5, rpn: 120 },
      { mode: "Fuite Hydraulique", severity: 7, occurrence: 4, detection: 3, rpn: 84 },
      { mode: "Capteur HS", severity: 6, occurrence: 5, detection: 2, rpn: 60 }
    ], 
    riskDistribution: [
      { category: "High", count: 2, color: "#FF6B6B" },
      { category: "Medium", count: 5, color: "#FFD93D" },
      { category: "Low", count: 12, color: "#6BCB77" }
    ], 
    criticalFailures: [] 
  };
  if (path.includes("/dashboard/gantt")) return { 
    tasks: [
      { id: "t1", name: "Maintenance Annuelle", start: "2026-04-01", end: "2026-04-05", progress: 45, type: 'task', priority: 'high' },
      { id: "t2", name: "Installation Robot B", start: "2026-04-06", end: "2026-04-15", progress: 0, type: 'task', priority: 'medium' }
    ], 
    projects: ["Usine Alpha", "Extension B"] 
  };
  
  if (path.includes("/ai/chat")) {
    return { 
      response: JSON.stringify({
        title: "Industrial Strategy 2026",
        subtitle: "Global Roadmap & Analytics",
        slides: [
          { title: "Introduction", content: "Executive Summary", speakerNotes: "Start here" },
          { title: "Market Analysis", content: "Growth figures", speakerNotes: "Show charts" },
          { title: "Conclusion", content: "Next steps", speakerNotes: "Call to action" }
        ],
        theme: "professional",
        estimatedDuration: 15
      })
    };
  }
  
  return { id: "mock-id", detail: "Mock data fallback" };
}

async function tryRefreshToken(): Promise<boolean> {
  try {
    const refresh = localStorage.getItem("wordex_refresh_token");
    if (!refresh) return false;
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

export class APIError extends Error {
  constructor(public status: number, public data: Record<string, unknown>) {
    super(String(data?.detail ?? "API Error"));
  }
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  provider: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export const auth = {
  register: (email: string, username: string, password: string) =>
    apiFetch<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, username, password }),
      auth: false,
    }),

  login: (email: string, password: string) =>
    apiFetch<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      auth: false,
    }),

  refresh: (refresh_token: string) =>
    apiFetch<TokenResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token }),
      auth: false,
    }),

  logout: () => apiFetch<null>("/auth/logout", { method: "POST" }),

  me: () => apiFetch<User>("/auth/me"),

  changePassword: (current_password: string, new_password: string) =>
    apiFetch<null>("/auth/me/password", {
      method: "PUT",
      body: JSON.stringify({ current_password, new_password }),
    }),

  userSearch: (q: string) => apiFetch<User[]>(`/auth/search?q=${encodeURIComponent(q)}`),
};

// ── Workspaces ────────────────────────────────────────────────────────────────

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  owner_id: string;
  created_at: string;
}

export const workspaces = {
  list: () => apiFetch<Workspace[]>("/workspaces/"),

  get: (id: string) => apiFetch<Workspace>(`/workspaces/${id}`),

  create: (name: string, slug: string) =>
    apiFetch<Workspace>("/workspaces/", {
      method: "POST",
      body: JSON.stringify({ name, slug }),
    }),

  addMember: (workspaceId: string, userId: string, role: "editor" | "viewer" = "viewer") =>
    apiFetch<{ detail: string }>(`/workspaces/${workspaceId}/members`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId, role }),
    }),

  removeMember: (workspaceId: string, memberId: string) =>
    apiFetch<null>(`/workspaces/${workspaceId}/members/${memberId}`, { method: "DELETE" }),

  getStorage: (workspaceId?: string) => 
    apiFetch<{ total_bytes: number; file_count: number }>(`/workspaces/storage${workspaceId ? `?workspace_id=${workspaceId}` : ""}`),
};

// ── Documents ─────────────────────────────────────────────────────────────────

export interface Document {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  title: string;
  doc_type: string;
  content?: unknown;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version: number;
  saved_by: string;
  created_at: string;
  saved_by_name?: string;
}

export interface DocumentVersionDetail extends DocumentVersion {
  content?: unknown;
  content_text?: string;
}

export const documents = {
  list: (workspaceId: string) =>
    apiFetch<Document[]>(`/documents/?workspace_id=${workspaceId}`),

  recent: (limit = 10) =>
    apiFetch<Document[]>(`/documents/recent?limit=${limit}`),

  get: (docId: string) => apiFetch<Document>(`/documents/${docId}`),

  create: (workspaceId: string, title = "Untitled", doc_type = "note", parent_id?: string) =>
    apiFetch<Document>("/documents/", {
      method: "POST",
      body: JSON.stringify({ workspace_id: workspaceId, title, doc_type, parent_id }),
    }),

  update: (docId: string, payload: { title?: string; content?: unknown; content_text?: string }) =>
    apiFetch<Document>(`/documents/${docId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  delete: (docId: string) =>
    apiFetch<null>(`/documents/${docId}`, { method: "DELETE" }),

  search: (workspaceId: string, q: string) =>
    apiFetch<Document[]>(`/documents/search?workspace_id=${workspaceId}&q=${encodeURIComponent(q)}`),

  versions: (docId: string) =>
    apiFetch<DocumentVersion[]>(`/documents/${docId}/versions`),

  getVersion: (docId: string, versionId: string) =>
    apiFetch<DocumentVersionDetail>(`/documents/${docId}/versions/${versionId}`),

  restoreVersion: (docId: string, versionId: string) =>
    apiFetch<Document>(`/documents/${docId}/versions/${versionId}/restore`, { method: "POST" }),
};

// ── AI Services ───────────────────────────────────────────────────────────────
export interface AISuggestRequest {
  prompt: string;
  context?: string;
  doc_id?: string;
  mode?: "continue" | "improve" | "expand" | "fix";
}

export const ai = {
  chat: (messages: { role: string; content: string }[], agent = "general", stream = false) =>
    apiFetch<{ response: string }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ messages, agent, stream }),
    }),

  suggest: (payload: AISuggestRequest) =>
    apiFetch<{ suggestion: string }>("/ai/suggest", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  summarize: (text: string, style: "bullets" | "paragraph" | "tldr" = "bullets") =>
    apiFetch<{ summary: string }>("/ai/summarize", {
      method: "POST",
      body: JSON.stringify({ text, style }),
    }),

  translate: (text: string, target_lang: string) =>
    apiFetch<{ translated: string }>("/ai/translate", {
      method: "POST",
      body: JSON.stringify({ text, target_lang }),
    }),

  analyze: (content: string, analysis_type = "general") =>
    apiFetch<{ analysis: string }>("/ai/analyze", {
      method: "POST",
      body: JSON.stringify({ content, analysis_type }),
    }),

  /**
   * Helper for streaming AI chat using EventSource-like behavior
   */
  async chatStream(
    messages: { role: string; content: string }[],
    agent = "general",
    onToken: (token: string) => void,
    onDone: () => void
  ) {
    const token = typeof window !== "undefined" ? localStorage.getItem("wordex_access_token") : "";
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/ai/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({ messages, agent, stream: true }),
    });

    if (!response.ok) throw new Error("AI Stream failed");
    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.slice(6).trim();
          if (dataStr === "[DONE]") {
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.token) onToken(parsed.token);
          } catch {
            // Ignore partial JSON
          }
        }
      }
    }
  },
};

// ── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  notif_type: string;
  entity_type: string;
  entity_id: string;
  entity_title: string | null;
  message: string | null;
  is_read: boolean;
  created_at: string;
  actor_name: string | null;
  actor_avatar: string | null;
}

export const notifications = {
  list: (unread_only = false, limit = 30) =>
    apiFetch<Notification[]>(`/notifications/?unread_only=${unread_only}&limit=${limit}`),

  unreadCount: () =>
    apiFetch<{ count: number }>("/notifications/unread-count"),

  markRead: (notifId: string) =>
    apiFetch<null>(`/notifications/${notifId}/read`, { method: "PATCH" }),

  markAllRead: () =>
    apiFetch<null>("/notifications/read-all", { method: "PATCH" }),

  delete: (notifId: string) =>
    apiFetch<null>(`/notifications/${notifId}`, { method: "DELETE" }),
};

// ── Comments ─────────────────────────────────────────────────────────────────

export interface APIComment {
  id: string;
  document_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  anchor_from: number | null;
  anchor_to: number | null;
  resolved: boolean;
  created_at: string;
}

export const comments = {
  list: (documentId: string) =>
    apiFetch<APIComment[]>(`/comments/?document_id=${documentId}`),

  create: (document_id: string, content: string, parent_id?: string, anchor_from?: number, anchor_to?: number) =>
    apiFetch<APIComment>("/comments/", {
      method: "POST",
      body: JSON.stringify({ document_id, content, parent_id, anchor_from, anchor_to }),
    }),

  resolve: (commentId: string, resolved = true) =>
    apiFetch<APIComment>(`/comments/${commentId}`, {
      method: "PATCH",
      body: JSON.stringify({ resolved }),
    }),

  delete: (commentId: string) =>
    apiFetch<null>(`/comments/${commentId}`, { method: "DELETE" }),
};

// Consolidated AI object moved up.

// ── Exports ───────────────────────────────────────────────────────────────────

export const exports = {
  pdf: (docId: string) => `${API_BASE}/exports/${docId}/pdf`,
  docx: (docId: string) => `${API_BASE}/exports/${docId}/docx`,
  pptx: (docId: string) => `${API_BASE}/exports/${docId}/pptx`,
  markdown: (docId: string) => `${API_BASE}/exports/${docId}/markdown`,

  downloadWithAuth: async (docId: string, format: "pdf" | "docx" | "pptx" | "markdown") => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/exports/${docId}/${format}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Export failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `document.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

// ── Webhooks ─────────────────────────────────────────────────────────────────

export interface Webhook {
  id: string;
  workspace_id: string;
  url: string;
  events: string[];
  secret: string;
  name: string;
  active: boolean;
  created_at: string;
}

export interface WebhookDelivery {
  webhook_id: string;
  event_id: string;
  event_type: string;
  url: string;
  attempt: number;
  status: number;
  success: boolean;
  response: string;
  timestamp: string;
  error?: string;
}

export const webhooks = {
  list: (workspaceId: string) =>
    apiFetch<Webhook[]>(`/webhooks?workspace_id=${workspaceId}`),

  get: (id: string) =>
    apiFetch<Webhook>(`/webhooks/${id}`),

  create: (data: { workspace_id: string; url: string; events: string[]; secret: string; name?: string }) =>
    apiFetch<Webhook>("/webhooks", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Webhook>) =>
    apiFetch<Webhook>(`/webhooks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/webhooks/${id}`, { method: "DELETE" }),

  getDeliveries: (id: string) =>
    apiFetch<{ deliveries: WebhookDelivery[] }>(`/webhooks/${id}/deliveries`),

  listEventTypes: () =>
    apiFetch<{ event_types: string[] }>("/webhooks/events"),

  test: (id: string, data: { url: string; secret: string; event_type?: string }) =>
    apiFetch<{ success: boolean; status_code?: number; response_body?: string; error?: string }>("/webhooks/test", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ── Sheets ────────────────────────────────────────────────────────────────────

export const sheets = {
  list: (workspaceId: string) =>
    apiFetch<Document[]>(`/documents/?workspace_id=${workspaceId}&doc_type=spreadsheet`),
  get: (id: string) => apiFetch<Record<string, unknown>>(`/sheets/${id}`),
  update: (id: string, body: Record<string, unknown>) =>
    apiFetch<Record<string, unknown>>(`/sheets/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  versions: (id: string) => apiFetch<DocumentVersion[]>(`/sheets/${id}/versions`),
  restore: (id: string, versionId: string) =>
    apiFetch<Document>(`/sheets/${id}/restore/${versionId}`, { method: "POST" }),
};

export interface FileOut {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by: string;
  created_at: string;
  download_url: string;
}

export const filesAPI = {
  upload: (workspaceId: string, file: File, documentId?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    
    let url = `/files/upload?workspace_id=${workspaceId}`;
    if (documentId) url += `&document_id=${documentId}`;

    return apiFetch<FileOut>(url, {
      method: "POST",
      body: formData,
    });
  },

  list: (workspaceId: string, documentId?: string) => {
    let url = `/files/?workspace_id=${workspaceId}`;
    if (documentId) url += `&document_id=${documentId}`;
    return apiFetch<FileOut[]>(url);
  },

  delete: (fileId: string) =>
    apiFetch<null>(`/files/${fileId}`, { method: "DELETE" }),
};

// ── Slides ────────────────────────────────────────────────────────────────────

export const slides = {
  get: (id: string) => 
    apiFetch<Record<string, unknown>>(`/slides/${id}`),
  update: (id: string, body: Record<string, unknown>) =>
    apiFetch<Record<string, unknown>>(`/slides/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  versions: (id: string) => 
    apiFetch<DocumentVersion[]>(`/slides/${id}/versions`),
  restore: (id: string, versionId: string) =>
    apiFetch<Document>(`/slides/${id}/restore/${versionId}`, { method: "POST" }),
  generateFromAI: (id: string, body: { topic: string; n_slides: number }) =>
    apiFetch<{status: string; presentation: Record<string, unknown>}>(`/slides/${id}/generate-from-ai`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  generateFromDoc: (id: string, sourceDocId: string, nSlides: number = 10) =>
    apiFetch<{status: string; presentation: Record<string, unknown>}>(`/slides/${id}/generate-from-doc`, {
      method: "POST",
      body: JSON.stringify({ source_doc_id: sourceDocId, n_slides: nSlides }),
    }),
  exportPPTX: async (id: string) => {
    const token = getToken();
    const response = await fetch(`${API_BASE}/slides/${id}/export-pptx`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error("Export failed");
    return await response.blob();
  },
};

// ── Gantt ─────────────────────────────────────────────────────────────────────

export interface GanttTask {
  id: string;
  name: string;
  start: string; // ISO
  end: string;   // ISO
  start_date?: string;
  end_date?: string;
  progress: number;
  dependencies?: string[];
  type?: 'project' | 'task' | 'milestone';
  task_type?: 'project' | 'task' | 'milestone';
  parentId?: string;
  parent_id?: string;
  assignees?: string[];
}

export interface GanttResource {
  id: string;
  name: string;
  capacity: number[]; // Capacity values per period
  usage: number[];    // Usage values per period
  status: 'online' | 'busy' | 'offline';
}

export interface GanttData {
  tasks: GanttTask[];
  resources: GanttResource[];
  metadata: Record<string, unknown>;
}

export interface GanttResourceCreate {
  name: string;
  resource_type?: string;
  capacity?: number;
  color?: string;
}

export const ganttApi = {
  get:          (id: string) => apiFetch<GanttData>(`/gantt/${id}`),
  createTask:   (id: string, task: Partial<GanttTask>) =>
    apiFetch<GanttTask>(`/gantt/${id}/tasks`, { method: 'POST', body: JSON.stringify(task) }),
  updateTask:   (docId: string, taskId: string, body: Partial<GanttTask>) =>
    apiFetch<GanttTask>(`/gantt/${docId}/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteTask:   (docId: string, taskId: string) =>
    apiFetch<null>(`/gantt/${docId}/tasks/${taskId}`, { method: 'DELETE' }),
  bulkUpdate:   (docId: string, tasks: Partial<GanttTask>[]) =>
    apiFetch<void>(`/gantt/${docId}/bulk-update`, { method: 'POST', body: JSON.stringify(tasks) }),
  getResources: (id: string) => apiFetch<GanttResource[]>(`/gantt/${id}/resources`),
  createResource: (id: string, res: GanttResourceCreate) =>
    apiFetch<GanttResource>(`/gantt/${id}/resources`, { method: 'POST', body: JSON.stringify(res) }),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const dashboard = {
  getTrsOee: (wsId: string, timeframe: string = "24h") => 
    apiFetch<{machines: unknown[]}>(`/dashboard/trs-oee?workspace_id=${wsId}&timeframe=${timeframe}`),
  getProduction: (wsId: string, date?: string) => 
    apiFetch<{production: unknown[]}>(`/dashboard/production-tracking?workspace_id=${wsId}${date ? `&date=${date}` : ""}`),
  getSCurve: (wsId: string) => 
    apiFetch<{curve: unknown[]; completionRate: number; delayPercentage: number}>(`/dashboard/s-curve?workspace_id=${wsId}`),
  getAmdec: (wsId: string, risk: string = "all") => 
    apiFetch<{failureModes: unknown[]; riskDistribution: unknown[]; criticalFailures: unknown[]}>(`/dashboard/amdec?workspace_id=${wsId}&risk=${risk}`),
  createMachine: (wsId: string, body: { name: string; machine_type?: string; location?: string; status?: string }) =>
    apiFetch<{id: string}>(`/dashboard/machines?workspace_id=${wsId}`, { method: "POST", body: JSON.stringify(body) }),
  seedDemo: (wsId: string) =>
    apiFetch<{status: string; machine_count: number}>(`/dashboard/seed-demo?workspace_id=${wsId}`, { method: "POST" }),
};

// ── Analytics ─────────────────────────────────────────────────────────────────

export const analytics = {
  get: (workspaceId: string) => apiFetch<{ data: Record<string, unknown> }>(`/analytics/${workspaceId}`),
  update: (workspaceId: string, payload: Record<string, unknown>) => apiFetch<{ status: string, id: string }>(`/analytics/${workspaceId}`, {
     method: "PUT",
     body: JSON.stringify(payload)
  }),
  getVariables: (workspaceId: string) => 
    apiFetch<{variables: unknown[]}>(`/analytics/${workspaceId}/variables`),
  createVariable: (workspaceId: string, payload: Record<string, unknown>) =>
    apiFetch<{id: string}>(`/analytics/${workspaceId}/variables`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
};


export interface AIChatMessage {
  role: string;
  content: string;
  context?: string;
}

export interface AIChatSession {
  id: string;
  user_id: string;
  document_id: string | null;
  agent: string;
  title: string | null;
  messages: AIChatMessage[];
  tokens_used: number;
  created_at: string;
  updated_at: string;
}

export const aiSessions = {
  list: (documentId?: string) => {
    const query = documentId ? `?document_id=${documentId}` : "";
    return apiFetch<AIChatSession[]>(`/ai/sessions${query}`);
  },
  create: (body: { document_id?: string; agent?: string; title?: string }) =>
    apiFetch<AIChatSession>("/ai/sessions", { method: "POST", body: JSON.stringify(body) }),
  get: (sessionId: string) => apiFetch<AIChatSession>(`/ai/sessions/${sessionId}`),
  delete: (sessionId: string) => apiFetch<{status: string}>(`/ai/sessions/${sessionId}`, { method: "DELETE" }),
  sendMessage: (sessionId: string, body: { role: "user" | "assistant" | "system"; content: string; context?: string }) =>
    apiFetch<{response: string; tokens_used: number; messages: AIChatMessage[]}>(
      `/ai/sessions/${sessionId}/message`,
      { method: "POST", body: JSON.stringify(body) }
    ),
};



//  Multi-Agent System 

export type AgentKey = "analyst" | "writer" | "designer" | "maintenance" | "quality";

export interface SingleAgentResponse {
  success: boolean;
  agent: AgentKey;
  organisation_id: string;
  response: string;
  timestamp: string;
}

export interface OrchestratePhase {
  agent: string;
  output: string;
  tokens?: number;
}

export interface IndustrialInsightResult {
  workspace_id: string;
  timestamp: string;
  phases: OrchestratePhase[];
  summary: { total_tokens: number };
}

export interface MaintenanceForecastResult {
  forecast_timestamp: string;
  predictions: Array<{ agent: string; response: string }>;
  recommendations: string;
}

export interface AgentCatalogItem {
  id: AgentKey;
  name: string;
  role: string;
  specialty: string;
}

export const agentsApi = {
  executeSingle: (agentName: AgentKey, task: string, context = "") =>
    apiFetch<SingleAgentResponse>("/agents/execute/single", {
      method: "POST",
      body: JSON.stringify({ agent_name: agentName, task, context }),
    }),

  orchestrateIndustrial: (workspaceId: string, data: Record<string, unknown>) =>
    apiFetch<{ success: boolean; result: IndustrialInsightResult }>(
      "/agents/orchestrate/industrial-insight",
      { method: "POST", body: JSON.stringify({ workspace_id: workspaceId, data }) }
    ),

  orchestrateMaintenance: (workspaceId: string, data: Record<string, unknown>) =>
    apiFetch<{ success: boolean; result: MaintenanceForecastResult }>(
      "/agents/orchestrate/maintenance-forecast",
      { method: "POST", body: JSON.stringify({ workspace_id: workspaceId, data }) }
    ),

  listAgents: () =>
    apiFetch<{ agents: AgentCatalogItem[] }>("/agents/list-agents"),

  chat: (agentName: AgentKey, message: string, context = "") =>
    apiFetch<{ agent: AgentKey; response: string; timestamp: string }>(
      "/agents/chat",
      { method: "POST", body: JSON.stringify({ agent_name: agentName, message, context }) }
    ),
};
