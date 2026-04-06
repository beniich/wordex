/**
 * Wordex — Multi-Agent System (frontend)
 *
 * This module provides:
 *  - Typed interfaces for agent config & results
 *  - WordexAgent class that delegates to the FastAPI backend (/api/agents/…)
 *  - IndustrialAgentsFactory with 5 specialized agents
 *  - AgentOrchestrator for sequential multi-step workflows
 *  - useMultiAgent React hook for easy consumption in any page/component
 */

import { useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// 0. API base URL (reuses the same env var as api.ts)
// ---------------------------------------------------------------------------

const rawBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API_BASE = rawBase.endsWith("/api") ? rawBase : `${rawBase}/api`;

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("wordex_access_token");
}

async function agentFetch<T>(path: string, body: unknown): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`[AgentAPI] ${res.status} – ${err}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// 1. Types
// ---------------------------------------------------------------------------

export interface AgentConfig {
  /** Internal agent key used by the backend mapping */
  agentKey: "analyst" | "writer" | "designer" | "maintenance" | "quality";
  /** Human-readable display name */
  name: string;
  /** Short role description */
  role: string;
  goal: string;
  backstory: string;
  capabilities: string[];
  /** Emoji icon for UI display */
  icon: string;
}

export interface AgentPhaseResult {
  agent: string;
  role: string;
  output: string;
  tokens?: number;
  durationMs?: number;
}

export interface OrchestratorResult {
  workspaceId: string;
  timestamp: string;
  analysisType: "industrial" | "maintenance";
  phases: AgentPhaseResult[];
  summary: {
    totalTokens: number;
    totalDurationMs: number;
  };
}

// Raw response shape from the single-agent endpoint
interface SingleAgentApiResponse {
  success: boolean;
  agent: string;
  organisation_id: string;
  response: string;
  timestamp: string;
}

// Raw response shape from the orchestrate endpoints
interface OrchestrateApiResponse {
  success: boolean;
  organisation_id: string;
  analysis_type: string;
  result: {
    workspace_id?: string;
    forecast_timestamp?: string;
    timestamp?: string;
    phases?: Array<{ agent: string; output: string; tokens?: number }>;
    predictions?: Array<{ agent: string; response: string }>;
    summary?: { total_tokens: number };
    recommendations?: string;
  };
}

// ---------------------------------------------------------------------------
// 2. WordexAgent — delegates execution to the FastAPI backend
// ---------------------------------------------------------------------------

export class WordexAgent {
  constructor(public readonly config: AgentConfig) {}

  /**
   * Execute a task via POST /api/agents/execute/single
   */
  async execute(task: string, context: string = ""): Promise<AgentPhaseResult> {
    const t0 = Date.now();

    const data = await agentFetch<SingleAgentApiResponse>(
      "/agents/execute/single",
      {
        agent_name: this.config.agentKey,
        task,
        context,
      }
    );

    return {
      agent: this.config.name,
      role: this.config.role,
      output: data.response,
      durationMs: Date.now() - t0,
    };
  }
}

// ---------------------------------------------------------------------------
// 3. IndustrialAgentsFactory
// ---------------------------------------------------------------------------

export class IndustrialAgentsFactory {
  static chiefAnalyst(): WordexAgent {
    return new WordexAgent({
      agentKey: "analyst",
      name: "Chief Industrial Analyst",
      role: "Analyste de Performance Industrielle",
      goal: "Identifier les causes racines des baisses de TRS/OEE et proposer des actions correctives",
      backstory:
        "Expert Lean Six Sigma, 15 ans d'expérience en amélioration continue et data-science appliquée à la production.",
      capabilities: ["analyse", "root-cause", "kpi"],
      icon: "🔍",
    });
  }

  static strategicWriter(): WordexAgent {
    return new WordexAgent({
      agentKey: "writer",
      name: "Director of Strategic Communication",
      role: "Rédacteur Stratégique",
      goal: "Transformer les insights techniques en rapports clairs, décisionnels et adaptés aux cadres dirigeants",
      backstory:
        "Ancien Directeur de la Communication industrielle, maîtrise du storytelling technique & business.",
      capabilities: ["rédaction", "synopsis", "executive-summary"],
      icon: "✍️",
    });
  }

  static visualDesigner(): WordexAgent {
    return new WordexAgent({
      agentKey: "designer",
      name: "Visual Content Designer",
      role: "Designer de Contenu Visuel",
      goal: "Convertir les rapports texte en slides attractifs (layout, graphiques, visualisations)",
      backstory:
        "Designer UI/UX spécialisé dans les dashboards industriels, connaissance poussée des principes de visual analytics.",
      capabilities: ["slide-structure", "visual-suggestion", "layout"],
      icon: "🎨",
    });
  }

  static maintenanceSpecialist(): WordexAgent {
    return new WordexAgent({
      agentKey: "maintenance",
      name: "Maintenance Specialist",
      role: "Spécialiste Maintenance Prédictive",
      goal: "Analyser les données de capteurs et proposer les actions de maintenance préventive les plus critiques",
      backstory:
        "Ingénieur maintenance 10 ans, expert IoT industriel, modèles de prédiction sur séries temporelles.",
      capabilities: ["prédiction", "risk-analysis"],
      icon: "🔧",
    });
  }

  static qualityAssurance(): WordexAgent {
    return new WordexAgent({
      agentKey: "quality",
      name: "Quality Assurance Expert",
      role: "Expert Assurance Qualité",
      goal: "Évaluer l'impact qualité des incidents et proposer des plans de contrôle et de conformité",
      backstory:
        "Auditeur ISO 9001, Six Sigma Black Belt, expert en analyses de défauts.",
      capabilities: ["qa-assessment", "compliance"],
      icon: "✅",
    });
  }

  /** Return all agents as an array (for listing / UI catalog) */
  static all(): WordexAgent[] {
    return [
      IndustrialAgentsFactory.chiefAnalyst(),
      IndustrialAgentsFactory.strategicWriter(),
      IndustrialAgentsFactory.visualDesigner(),
      IndustrialAgentsFactory.maintenanceSpecialist(),
      IndustrialAgentsFactory.qualityAssurance(),
    ];
  }
}

// ---------------------------------------------------------------------------
// 4. AgentOrchestrator — wraps the FastAPI orchestrate endpoints
// ---------------------------------------------------------------------------

export class AgentOrchestrator {
  /**
   * Full industrial analysis: Analyst → Writer → Designer
   * Calls POST /api/agents/orchestrate/industrial-insight
   */
  async runIndustrialAnalysis(
    workspaceId: string,
    data: unknown
  ): Promise<OrchestratorResult> {
    const t0 = Date.now();

    const raw = await agentFetch<OrchestrateApiResponse>(
      "/agents/orchestrate/industrial-insight",
      { workspace_id: workspaceId, data }
    );

    const phases: AgentPhaseResult[] = (raw.result.phases ?? []).map((p) => ({
      agent: p.agent,
      role: p.agent,
      output: p.output,
      tokens: p.tokens,
    }));

    return {
      workspaceId,
      timestamp: raw.result.timestamp ?? new Date().toISOString(),
      analysisType: "industrial",
      phases,
      summary: {
        totalTokens: raw.result.summary?.total_tokens ?? 0,
        totalDurationMs: Date.now() - t0,
      },
    };
  }

  /**
   * Maintenance forecast: MaintenanceSpecialist → QualityAssurance
   * Calls POST /api/agents/orchestrate/maintenance-forecast
   */
  async runMaintenanceForecast(
    workspaceId: string,
    data: unknown
  ): Promise<OrchestratorResult> {
    const t0 = Date.now();

    const raw = await agentFetch<OrchestrateApiResponse>(
      "/agents/orchestrate/maintenance-forecast",
      { workspace_id: workspaceId, data }
    );

    // maintenance-forecast returns { predictions: [...], recommendations }
    const predictions = raw.result.predictions ?? [];
    const phases: AgentPhaseResult[] = predictions.map((p) => ({
      agent: p.agent,
      role: p.agent,
      output: p.response,
    }));

    // Append recommendations as a synthetic phase if present
    if (raw.result.recommendations) {
      phases.push({
        agent: "Orchestrateur",
        role: "Synthèse & Recommandations",
        output: raw.result.recommendations,
      });
    }

    return {
      workspaceId,
      timestamp: raw.result.forecast_timestamp ?? new Date().toISOString(),
      analysisType: "maintenance",
      phases,
      summary: {
        totalTokens: 0,
        totalDurationMs: Date.now() - t0,
      },
    };
  }
}

// ---------------------------------------------------------------------------
// 5. useMultiAgent — React hook
// ---------------------------------------------------------------------------

export interface UseMultiAgentReturn {
  loading: boolean;
  error: string | null;
  result: OrchestratorResult | null;
  runIndustrial: (workspaceId: string, data: unknown) => Promise<OrchestratorResult | null>;
  runMaintenance: (workspaceId: string, data: unknown) => Promise<OrchestratorResult | null>;
  reset: () => void;
}

export function useMultiAgent(): UseMultiAgentReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OrchestratorResult | null>(null);

  const orchestrator = new AgentOrchestrator();

  const runIndustrial = useCallback(
    async (workspaceId: string, data: unknown) => {
      setLoading(true);
      setError(null);
      try {
        const res = await orchestrator.runIndustrialAnalysis(workspaceId, data);
        setResult(res);
        return res;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Erreur inconnue";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const runMaintenance = useCallback(
    async (workspaceId: string, data: unknown) => {
      setLoading(true);
      setError(null);
      try {
        const res = await orchestrator.runMaintenanceForecast(workspaceId, data);
        setResult(res);
        return res;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Erreur inconnue";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { loading, error, result, runIndustrial, runMaintenance, reset };
}
