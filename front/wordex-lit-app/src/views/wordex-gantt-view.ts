import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { apiFetch } from '../services/api-client';

@customElement('wordex-gantt-view')
export class WordexGanttView extends LitElement {
  static styles = css`
    :host { display: block; animation: fadeIn 0.5s; padding-bottom: 4rem; }
    .header { margin-bottom: 2rem; }
    h1 { font-size: 2.5rem; font-weight: 900; margin-bottom: 0.5rem; }
    p { color: #94a3b8; font-size: 1.1rem; }

    .gantt-container {
      background: rgba(14, 16, 21, 0.8); backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 20px;
      padding: 1.5rem; overflow-x: auto;
    }
    
    .timeline { display: flex; flex-direction: column; gap: 12px; margin-top: 1rem; }
    .task {
      display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px;
      background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255,255,255,0.02);
    }
    .task-info { width: 220px; flex-shrink: 0; }
    .task-name { font-weight: 800; font-size: 0.9rem; color: #4fd1c5; }
    .task-dates { font-size: 0.75rem; color: #94a3b8; }

    .bar-container { flex: 1; height: 12px; background: rgba(0,0,0,0.3); border-radius: 6px; position: relative; overflow: hidden; }
    .bar { height: 100%; background: #4fd1c5; border-radius: 6px; }
    .progress-info { width: 50px; font-size: 0.75rem; color: #94a3b8; text-align: right; }

    .badge { padding: 4px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; }
    .priority-high { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
    .priority-medium { background: rgba(79, 209, 197, 0.2); color: #4fd1c5; }
  `;

  @state() private loading = false;
  @state() private tasks: any[] = [];

  async connectedCallback() {
    super.connectedCallback();
    await this.fetchData();
  }

  async fetchData() {
    this.loading = true;
    try {
      const docId = "demo-gantt-document";
      const res = await apiFetch(`/gantt/${docId}`);
      const data = await res.json();
      this.tasks = data.tasks || [];
      if (this.tasks.length === 0) throw new Error("No data");
    } catch (e) {
      console.warn("Gantt service offline, using mock data");
      this.tasks = [
        { name: 'Intégration Neural Engine', start_date: '2026-04-01', end_date: '2026-04-15', progress: 85, priority: 'high' },
        { name: 'Migration Infrastructure Aether', start_date: '2026-04-10', end_date: '2026-04-25', progress: 40, priority: 'high' },
        { name: 'Audit Sécurité Multi-Services', start_date: '2026-04-12', end_date: '2026-05-05', progress: 15, priority: 'medium' },
        { name: 'Finalisation Dashboard Dash', start_date: '2026-03-25', end_date: '2026-04-10', progress: 100, priority: 'high' }
      ];
    } finally {
      this.loading = false;
    }
  }

  render() {
    if (this.loading) return html`<div style="text-align:center;padding:4rem;color:#94a3b8;">Chargement du planning...</div>`;
    return html`
      <div class="header">
        <h1>Planning Timeline</h1>
        <p>Orchestration temporelle des micro-services et déploiements Wordex.</p>
      </div>

      <div class="gantt-container">
        <div class="timeline">
          ${this.tasks.map(t => html`
            <div class="task">
              <div class="task-info">
                <div class="task-name">${t.name}</div>
                <div class="task-dates">${t.start_date} → ${t.end_date}</div>
              </div>
              <div class="bar-container">
                <div class="bar" style="width: ${t.progress || 0}%"></div>
              </div>
              <div class="progress-info">${t.progress || 0}%</div>
              <div class="badge ${t.priority === 'high' ? 'priority-high' : 'priority-medium'}">${t.priority}</div>
            </div>
          `)}
          
          ${this.tasks.length === 0 ? html`
            <div style="text-align:center; padding: 4rem; color: #524439;">
              Chargement de la planification maître...
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
}
