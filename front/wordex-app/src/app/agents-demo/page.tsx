"use client";

import { useState } from "react";
import {
  useMultiAgent,
  IndustrialAgentsFactory,
  type OrchestratorResult,
} from "@/lib/wordex-multi-agent";

// ─────────────────────────────────────────────────────────────────────────────
// Sample data payloads
// ─────────────────────────────────────────────────────────────────────────────

const INDUSTRIAL_DATA = {
  machines: [
    { name: "Presse A1", trs: 78, oee: 65, availability: 85, performance: 82, quality: 92 },
    { name: "Ligne B2",  trs: 82, oee: 71, availability: 88, performance: 85, quality: 95 },
    { name: "Robot C3",  trs: 65, oee: 52, availability: 75, performance: 78, quality: 88 },
  ],
  timeframe: "Semaine W14 2026",
  target_oee: 85,
};

const MAINTENANCE_DATA = {
  sensors: [
    { equip: "Pompe-A",  temperature: 85, vibration: 0.42, last_maintenance: "2026-02-10" },
    { equip: "Moteur-B", temperature: 78, vibration: 0.67, last_maintenance: "2026-01-15" },
    { equip: "Bande-C",  temperature: 73, vibration: 0.31, last_maintenance: "2026-03-01" },
  ],
  horizon_days: 30,
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function AgentCard({
  icon,
  name,
  role,
  capabilities,
  active,
}: {
  icon: string;
  name: string;
  role: string;
  capabilities: string[];
  active?: boolean;
}) {
  return (
    <div
      className={`agent-card ${active ? "agent-card--active" : ""}`}
      title={name}
    >
      <span className="agent-card__icon">{icon}</span>
      <div className="agent-card__body">
        <p className="agent-card__name">{name}</p>
        <p className="agent-card__role">{role}</p>
        <div className="agent-card__tags">
          {capabilities.map((c) => (
            <span key={c} className="tag">
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PhaseCard({
  phase,
  index,
}: {
  phase: OrchestratorResult["phases"][number];
  index: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="phase-card">
      <button className="phase-card__header" onClick={() => setOpen((o) => !o)}>
        <span className="phase-badge">{index + 1}</span>
        <span className="phase-card__agent">{phase.agent}</span>
        <span className="phase-card__role">{phase.role}</span>
        {phase.tokens !== undefined && (
          <span className="phase-card__tokens">{phase.tokens} tok</span>
        )}
        {phase.durationMs !== undefined && (
          <span className="phase-card__dur">{phase.durationMs}ms</span>
        )}
        <span className="phase-chevron">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="phase-card__body">
          <pre className="phase-output">{phase.output}</pre>
        </div>
      )}
    </div>
  );
}

function StatsBar({ result }: { result: OrchestratorResult }) {
  const secs = (result.summary.totalDurationMs / 1000).toFixed(1);
  return (
    <div className="stats-bar">
      <div className="stat">
        <span className="stat__val">{result.phases.length}</span>
        <span className="stat__label">Agents</span>
      </div>
      <div className="stat">
        <span className="stat__val">{result.summary.totalTokens}</span>
        <span className="stat__label">Tokens</span>
      </div>
      <div className="stat">
        <span className="stat__val">{secs}s</span>
        <span className="stat__label">Durée</span>
      </div>
      <div className="stat">
        <span className="stat__val">
          {result.analysisType === "industrial" ? "🏭" : "🔧"}
        </span>
        <span className="stat__label">
          {result.analysisType === "industrial" ? "Industriel" : "Maintenance"}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function AgentsDemoPage() {
  const { loading, error, result, runIndustrial, runMaintenance, reset } =
    useMultiAgent();

  const agents = IndustrialAgentsFactory.all();

  const activeAgentKeys =
    result?.analysisType === "industrial"
      ? ["analyst", "writer", "designer"]
      : ["maintenance", "quality"];

  return (
    <>
      {/* ───────────── SCOPED CSS ───────────── */}
      <style>{`
        /* Page shell */
        .agents-page {
          min-height: 100vh;
          background: var(--bg-base, #130B2E);
          color: var(--text-primary, #fff);
          font-family: "Manrope", system-ui, sans-serif;
          padding: 0 0 80px;
        }

        /* ── Hero header ── */
        .agents-hero {
          position: relative;
          padding: 64px 40px 48px;
          overflow: hidden;
          text-align: center;
          background: linear-gradient(
            135deg,
            rgba(124, 58, 237, 0.18) 0%,
            rgba(0, 212, 232, 0.10) 100%
          );
          border-bottom: 1px solid rgba(130, 80, 220, 0.22);
        }

        .agents-hero::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 40% at 20% 30%, rgba(124, 58, 237, 0.25), transparent),
            radial-gradient(ellipse 50% 35% at 80% 70%, rgba(0, 212, 232, 0.18), transparent);
          pointer-events: none;
        }

        .agents-hero__badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(124, 58, 237, 0.2);
          border: 1px solid rgba(124, 58, 237, 0.4);
          border-radius: 999px;
          padding: 6px 16px;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #C4B5FD;
          margin-bottom: 20px;
        }

        .agents-hero h1 {
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          font-weight: 800;
          line-height: 1.2;
          background: linear-gradient(90deg, #C4B5FD 0%, #67E8F9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 auto 16px;
          max-width: 700px;
        }

        .agents-hero p {
          font-size: 1rem;
          color: rgba(255,255,255, 0.65);
          max-width: 560px;
          margin: 0 auto;
          line-height: 1.7;
        }

        /* ── Layout ── */
        .agents-layout {
          max-width: 1200px;
          margin: 48px auto 0;
          padding: 0 24px;
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 32px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .agents-layout { grid-template-columns: 1fr; }
        }

        /* ── Section labels ── */
        .section-label {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(0, 212, 232, 0.7);
          margin-bottom: 16px;
        }

        .section-label--no-mb {
          margin-bottom: 0;
        }

        /* ── Agent cards (sidebar) ── */
        .agent-roster {
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: sticky;
          top: 24px;
        }

        .agent-card {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          padding: 16px 18px;
          background: rgba(45, 25, 90, 0.45);
          border: 1px solid rgba(130, 80, 220, 0.20);
          border-radius: 14px;
          transition: all 0.25s ease;
          cursor: default;
        }

        .agent-card--active {
          border-color: rgba(0, 212, 232, 0.55);
          background: rgba(0, 212, 232, 0.08);
          box-shadow: 0 0 24px rgba(0, 212, 232, 0.12);
        }

        .agent-card__icon {
          font-size: 1.6rem;
          line-height: 1;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .agent-card__name {
          font-size: 0.85rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .agent-card__role {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.5);
          margin: 0 0 8px;
        }

        .agent-card__tags {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .tag {
          font-size: 0.65rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(124, 58, 237, 0.25);
          border: 1px solid rgba(124, 58, 237, 0.35);
          color: #C4B5FD;
          white-space: nowrap;
        }

        /* ── Main panel ── */
        .agents-main {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        /* ── Workflow launcher ── */
        .launcher-card {
          background: rgba(45, 25, 90, 0.45);
          border: 1px solid rgba(130, 80, 220, 0.22);
          border-radius: 20px;
          padding: 28px;
          backdrop-filter: blur(18px);
        }

        .launcher-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 16px;
        }

        @media (max-width: 600px) {
          .launcher-grid { grid-template-columns: 1fr; }
        }

        .workflow-btn {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
          padding: 20px 22px;
          border-radius: 14px;
          border: 1px solid transparent;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }

        .workflow-btn--industrial {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.22), rgba(124, 58, 237, 0.08));
          border-color: rgba(124, 58, 237, 0.40);
          color: #fff;
        }

        .workflow-btn--industrial:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.35), rgba(124, 58, 237, 0.15));
          border-color: rgba(124, 58, 237, 0.7);
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(124, 58, 237, 0.25);
        }

        .workflow-btn--maintenance {
          background: linear-gradient(135deg, rgba(0, 212, 232, 0.18), rgba(0, 212, 232, 0.06));
          border-color: rgba(0, 212, 232, 0.35);
          color: #fff;
        }

        .workflow-btn--maintenance:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(0, 212, 232, 0.30), rgba(0, 212, 232, 0.12));
          border-color: rgba(0, 212, 232, 0.65);
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0, 212, 232, 0.20);
        }

        .workflow-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }

        .workflow-btn__emoji {
          font-size: 1.8rem;
          line-height: 1;
        }

        .workflow-btn__title {
          font-size: 0.95rem;
          font-weight: 700;
          line-height: 1.2;
        }

        .workflow-btn__sub {
          font-size: 0.75rem;
          opacity: 0.65;
          line-height: 1.4;
        }

        /* Loading indicator */
        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 8px;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Status / error banner ── */
        .status-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 0.88rem;
          font-weight: 500;
          backdrop-filter: blur(12px);
        }

        .status-banner--loading {
          background: rgba(124, 58, 237, 0.15);
          border: 1px solid rgba(124, 58, 237, 0.35);
          color: #C4B5FD;
        }

        .status-banner--error {
          background: rgba(255, 80, 80, 0.12);
          border: 1px solid rgba(255, 80, 80, 0.35);
          color: #FCA5A5;
        }

        /* ── Stats bar ── */
        .stats-bar {
          display: flex;
          gap: 0;
          background: rgba(45, 25, 90, 0.45);
          border: 1px solid rgba(130, 80, 220, 0.22);
          border-radius: 16px;
          overflow: hidden;
          backdrop-filter: blur(14px);
        }

        .stat {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 18px 12px;
          border-right: 1px solid rgba(130, 80, 220, 0.15);
        }

        .stat:last-child { border-right: none; }

        .stat__val {
          font-size: 1.5rem;
          font-weight: 800;
          background: linear-gradient(90deg, #C4B5FD, #67E8F9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
        }

        .stat__label {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.45);
          margin-top: 5px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        /* ── Results ── */
        .results-card {
          background: rgba(45, 25, 90, 0.45);
          border: 1px solid rgba(130, 80, 220, 0.22);
          border-radius: 20px;
          padding: 28px;
          backdrop-filter: blur(18px);
        }

        .results-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .results-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #fff;
        }

        .results-ts {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.4);
        }

        .reset-btn {
          background: none;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 8px;
          color: rgba(255,255,255,0.6);
          font-size: 0.78rem;
          padding: 6px 14px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .reset-btn:hover {
          border-color: rgba(255,255,255,0.35);
          color: #fff;
        }

        /* ── Phase cards ── */
        .phases-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .phase-card {
          background: rgba(30, 16, 69, 0.6);
          border: 1px solid rgba(130, 80, 220, 0.18);
          border-radius: 12px;
          overflow: hidden;
          transition: border-color 0.2s;
        }

        .phase-card:hover {
          border-color: rgba(130, 80, 220, 0.40);
        }

        .phase-card__header {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
        }

        .phase-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7C3AED, #00D4E8);
          font-size: 0.75rem;
          font-weight: 800;
          flex-shrink: 0;
          color: #fff;
        }

        .phase-card__agent {
          font-size: 0.88rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .phase-card__role {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.45);
          flex: 1;
          text-align: left;
        }

        .phase-card__tokens,
        .phase-card__dur {
          font-size: 0.70rem;
          color: rgba(0, 212, 232, 0.7);
          background: rgba(0, 212, 232, 0.08);
          padding: 2px 8px;
          border-radius: 999px;
          border: 1px solid rgba(0, 212, 232, 0.2);
          flex-shrink: 0;
        }

        .phase-chevron {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.3);
          flex-shrink: 0;
          margin-left: auto;
        }

        .phase-card__body {
          border-top: 1px solid rgba(130, 80, 220, 0.15);
          padding: 16px 18px;
        }

        .phase-output {
          white-space: pre-wrap;
          font-family: "JetBrains Mono", "Courier New", monospace;
          font-size: 0.78rem;
          line-height: 1.7;
          color: rgba(255,255,255,0.8);
          background: rgba(0,0,0,0.2);
          padding: 14px 16px;
          border-radius: 8px;
          border-left: 3px solid rgba(124, 58, 237, 0.6);
          margin: 0;
          max-height: 340px;
          overflow-y: auto;
        }

        /* ── Empty state ── */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 60px 24px;
          text-align: center;
          background: rgba(45, 25, 90, 0.30);
          border: 1px dashed rgba(130, 80, 220, 0.25);
          border-radius: 20px;
        }

        .empty-state__icon {
          font-size: 2.8rem;
          opacity: 0.5;
        }

        .empty-state__title {
          font-size: 0.95rem;
          font-weight: 600;
          color: rgba(255,255,255,0.55);
          max-width: 280px;
          line-height: 1.6;
        }

        /* ── Data preview ── */
        .data-preview {
          background: rgba(45, 25, 90, 0.45);
          border: 1px solid rgba(130, 80, 220, 0.20);
          border-radius: 16px;
          padding: 20px;
          backdrop-filter: blur(14px);
        }

        .data-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 14px;
        }

        .data-tab {
          font-size: 0.78rem;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 8px;
          border: 1px solid rgba(130, 80, 220, 0.25);
          background: none;
          color: rgba(255,255,255,0.5);
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .data-tab--active {
          background: rgba(124, 58, 237, 0.25);
          border-color: rgba(124, 58, 237, 0.5);
          color: #C4B5FD;
        }

        .data-json {
          font-family: "JetBrains Mono", "Courier New", monospace;
          font-size: 0.72rem;
          line-height: 1.65;
          color: rgba(255,255,255,0.65);
          background: rgba(0,0,0,0.25);
          padding: 14px;
          border-radius: 10px;
          border: 1px solid rgba(130, 80, 220, 0.12);
          white-space: pre-wrap;
          word-break: break-all;
          margin: 0;
          max-height: 220px;
          overflow-y: auto;
        }
      `}</style>

      <div className="agents-page">
        {/* ── Hero ── */}
        <div className="agents-hero">
          <div className="agents-hero__badge">🧠 Wordex AI Lab</div>
          <h1>Laboratoire Multi-Agents IA</h1>
          <p>
            Orchestrez des workflows d&apos;agents spécialisés — analyse industrielle,
            maintenance prédictive, rédaction stratégique — propulsés par Ollama et
            coordonnés par le moteur Wordex.
          </p>
        </div>

        {/* ── Two-column layout ── */}
        <div className="agents-layout">
          {/* ── LEFT: Agent roster ── */}
          <aside className="agent-roster">
            <p className="section-label">🤖 Catalogue d&apos;agents</p>
            {agents.map((a) => (
              <AgentCard
                key={a.config.agentKey}
                icon={a.config.icon}
                name={a.config.name}
                role={a.config.role}
                capabilities={a.config.capabilities}
                active={activeAgentKeys.includes(a.config.agentKey)}
              />
            ))}
          </aside>

          {/* ── RIGHT: Launcher + Results ── */}
          <main className="agents-main">
            {/* Workflow launcher */}
            <div className="launcher-card">
              <p className="section-label">⚡ Lancer un workflow</p>
              <div className="launcher-grid">
                <button
                  id="btn-industrial"
                  className="workflow-btn workflow-btn--industrial"
                  disabled={loading}
                  onClick={() => runIndustrial("demo_workspace", INDUSTRIAL_DATA)}
                >
                  {loading ? <span className="spinner" /> : null}
                  <span className="workflow-btn__emoji">🏭</span>
                  <span className="workflow-btn__title">Analyse Industrielle</span>
                  <span className="workflow-btn__sub">
                    Analyst → Rédacteur → Designer (3 agents)
                  </span>
                </button>

                <button
                  id="btn-maintenance"
                  className="workflow-btn workflow-btn--maintenance"
                  disabled={loading}
                  onClick={() => runMaintenance("demo_workspace", MAINTENANCE_DATA)}
                >
                  {loading ? <span className="spinner" /> : null}
                  <span className="workflow-btn__emoji">🔧</span>
                  <span className="workflow-btn__title">Maintenance Prédictive</span>
                  <span className="workflow-btn__sub">
                    Maintenance Specialist → QA Expert (2 agents)
                  </span>
                </button>
              </div>
            </div>

            {/* Status banners */}
            {loading && (
              <div className="status-banner status-banner--loading">
                <span className="spinner" />
                Agents en cours d&apos;exécution — cela peut prendre jusqu&apos;à 2&nbsp;min
                selon le modèle LLM…
              </div>
            )}
            {error && (
              <div className="status-banner status-banner--error">
                ⚠️ {error}
              </div>
            )}

            {/* Stats */}
            {result && <StatsBar result={result} />}

            {/* Results */}
            {result ? (
              <div className="results-card">
                <div className="results-header">
                  <div>
                    <p className="results-title">
                      {result.analysisType === "industrial"
                        ? "🏭 Analyse Industrielle"
                        : "🔧 Maintenance Prédictive"}{" "}
                      — {result.workspaceId}
                    </p>
                    <p className="results-ts">
                      {new Date(result.timestamp).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <button className="reset-btn" onClick={reset}>
                    Réinitialiser ✕
                  </button>
                </div>
                <div className="phases-list">
                  {result.phases.map((phase, idx) => (
                    <PhaseCard key={idx} phase={phase} index={idx} />
                  ))}
                </div>
              </div>
            ) : !loading && !error ? (
              <div className="empty-state">
                <span className="empty-state__icon">🤖</span>
                <p className="empty-state__title">
                  Sélectionnez un workflow ci-dessus pour démarrer l&apos;orchestration
                  multi-agents.
                </p>
              </div>
            ) : null}

            {/* Data preview */}
            <DataPreview />
          </main>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DataPreview component (collapsible JSON viewer)
// ─────────────────────────────────────────────────────────────────────────────

function DataPreview() {
  const [tab, setTab] = useState<"industrial" | "maintenance">("industrial");

  const data =
    tab === "industrial" ? INDUSTRIAL_DATA : MAINTENANCE_DATA;

  return (
    <div className="data-preview">
      <p className="section-label section-label--no-mb">
        📦 Données de démonstration
      </p>
      <div className="data-tabs">
        <button
          className={`data-tab ${tab === "industrial" ? "data-tab--active" : ""}`}
          onClick={() => setTab("industrial")}
        >
          🏭 Industriel
        </button>
        <button
          className={`data-tab ${tab === "maintenance" ? "data-tab--active" : ""}`}
          onClick={() => setTab("maintenance")}
        >
          🔧 Maintenance
        </button>
      </div>
      <pre className="data-json">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
