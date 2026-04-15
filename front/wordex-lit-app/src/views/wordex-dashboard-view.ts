import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('wordex-dashboard-view')
export class WordexDashboardView extends LitElement {
  @state() private agentData: any[] = [];
  @state() private systemMetrics = { vram: 14.2, cpu: 34, ram: 68, power: 254 };

  connectedCallback() {
    super.connectedCallback();
    this.agentData = [
      {
        id: "ag-vision-01",
        name: "Vision Parser Pro",
        model: "llava-1.5-7b",
        status: "active",
        type: "Vision / OCR",
        success: 99.2, calls: 1450, latency: 450,
        timeline: [45, 60, 30, 80, 65, 95, 110, 85, 120]
      },
      {
        id: "ag-nlp-02",
        name: "Email Orchestrator",
        model: "mistral-instruct-v2",
        status: "idle",
        type: "NLP / Communication",
        success: 94.5, calls: 310, latency: 120,
        timeline: [20, 35, 72, 50, 45, 85, 60, 40, 30]
      },
      {
        id: "ag-code-03",
        name: "Code Copilot",
        model: "starcoder2-15b",
        status: "active",
        type: "Development",
        success: 97.8, calls: 890, latency: 850,
        timeline: [15, 20, 45, 85, 120, 150, 110, 90, 105]
      }
    ];

    // Simulate real-time metrics
    setInterval(() => {
      this.systemMetrics = {
        vram: +(14 + Math.random()).toFixed(1),
        cpu: Math.floor(30 + Math.random() * 20),
        ram: Math.floor(65 + Math.random() * 5),
        power: Math.floor(250 + Math.random() * 15)
      };
    }, 2000);
  }

  static styles = css`
    :host { 
      display: block; 
      animation: fadeIn 0.5s ease-out; 
      color: #2a241e; /* Deep Sand/Brown */
      min-height: 100%;
      box-sizing: border-box;
      font-family: 'Inter', system-ui, sans-serif;
    }

    * { box-sizing: border-box; }

    /* Studio Header */
    .studio-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(184, 115, 51, 0.2); /* Copper border */
    }

    .studio-header h1 { 
      font-size: 2.2rem; 
      margin: 0 0 0.25rem 0; 
      font-weight: 800; 
      letter-spacing: -1px; 
      color: #1a1612;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .studio-header h1::before {
      content: '';
      display: block;
      width: 12px;
      height: 12px;
      background: #b87333;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(184, 115, 51, 0.6);
    }

    .subtitle { 
      color: #7a6b5d; 
      font-weight: 500; 
      font-size: 1rem; 
      letter-spacing: 0.5px;
    }

    .header-actions button {
      background: linear-gradient(135deg, #b87333 0%, #894d0d 100%);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(137, 77, 13, 0.3);
      transition: all 0.2s ease;
    }

    .header-actions button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(137, 77, 13, 0.4);
    }

    /* Layout */
    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 2rem;
    }

    .main-panel {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .side-panel {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Glassmorphic Cards */
    .panel-card {
      background: rgba(255, 255, 255, 0.65); 
      backdrop-filter: blur(24px); 
      -webkit-backdrop-filter: blur(24px);
      border-radius: 16px; 
      padding: 1.5rem; 
      border: 1px solid rgba(255, 255, 255, 0.8); 
      box-shadow: 0 10px 30px rgba(137, 77, 13, 0.05),
                  inset 0 1px 0 rgba(255,255,255,0.6);
      position: relative;
      overflow: hidden;
    }

    .panel-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, transparent, rgba(184, 115, 51, 0.5), transparent);
      opacity: 0; transition: opacity 0.3s;
    }
    .panel-card:hover::before { opacity: 1; }

    .panel-title {
      font-size: 1rem;
      font-weight: 700;
      color: #635345;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* System Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .metric-box {
      background: rgba(245, 240, 230, 0.5);
      border: 1px solid rgba(184, 115, 51, 0.15);
      border-radius: 12px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
    }

    .metric-label { font-size: 0.75rem; color: #7a6b5d; font-weight: 600; text-transform: uppercase; }
    .metric-value { 
      font-size: 1.8rem; 
      font-weight: 800; 
      color: #894d0d; 
      margin-top: 0.5rem;
      font-variant-numeric: tabular-nums;
    }
    .metric-unit { font-size: 0.9rem; color: #a89a8e; font-weight: 500; }

    /* Model Rows */
    .model-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .model-row {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 1.5rem;
      align-items: center;
      background: rgba(252, 250, 248, 0.8);
      padding: 1.2rem;
      border-radius: 12px;
      border: 1px solid rgba(184, 115, 51, 0.1);
      transition: all 0.2s;
    }

    .model-row:hover {
      background: white;
      border-color: rgba(184, 115, 51, 0.3);
      box-shadow: 0 4px 15px rgba(184, 115, 51, 0.08);
      transform: scale(1.01);
    }

    .model-icon {
      width: 44px; height: 44px;
      border-radius: 10px;
      background: rgba(184, 115, 51, 0.1);
      color: #b87333;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem;
    }

    .model-info h4 { margin: 0 0 0.25rem 0; font-size: 1.1rem; color: #1a1612; }
    .model-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
      background: #e8e2d8;
      color: #635345;
      margin-bottom: 4px;
    }
    
    .model-meta { font-size: 0.8rem; color: #7a6b5d; }

    .model-stats {
      text-align: right;
    }

    .status-dot {
      display: inline-block; width: 8px; height: 8px; border-radius: 50%;
      margin-right: 6px;
    }
    .status-active { background: #10b981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.6); }
    .status-idle { background: #f59e0b; }

    /* Mini sparkline */
    .sparkline {
      display: flex;
      align-items: flex-end;
      gap: 3px;
      height: 30px;
      margin-top: 8px;
    }
    .spark-bar {
      width: 6px;
      background: #b87333;
      border-radius: 2px 2px 0 0;
      opacity: 0.7;
      transition: height 0.3s;
    }
    .model-row:hover .spark-bar { opacity: 1; }

    /* Decorative Tech Lines */
    .bg-decorator {
      position: absolute; top: -50px; right: -50px;
      width: 200px; height: 200px;
      border: 1px solid rgba(184, 115, 51, 0.05);
      border-radius: 50%;
      pointer-events: none;
    }
    .bg-decorator::after {
      content:''; position: absolute; top: 20px; right: 20px;
      width: 160px; height: 160px;
      border: 1px solid rgba(184, 115, 51, 0.05);
      border-radius: 50%;
    }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `;

  render() {
    return html`
      <div class="studio-header">
        <div>
          <h1>Studio Monitor</h1>
          <div class="subtitle">Gestion des Opérations IA • Serveur Local</div>
        </div>
        <div class="header-actions">
          <button>+ Déployer un Modèle</button>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- Main Area: Agents / Models -->
        <div class="main-panel">
          <div class="panel-card" style="flex: 1;">
            <div class="panel-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg>
              Modèles Actifs & Pipelines
            </div>
            
            <div class="model-list">
              ${this.agentData.map(agent => html`
                <div class="model-row">
                  <div class="model-icon">
                    ${agent.type.includes('Vision') ? '👁️' : agent.type.includes('Code') ? '💻' : '💬'}
                  </div>
                  <div class="model-info">
                    <span class="model-badge">${agent.model}</span>
                    <h4>${agent.name}</h4>
                    <div class="model-meta">
                      Latence moy: <strong>${agent.latency}ms</strong> • Succès: <strong>${agent.success}%</strong>
                    </div>
                  </div>
                  <div class="model-stats">
                    <div style="font-size: 0.85rem; font-weight: 600; color: #1a1612;">
                      <span class="status-dot ${agent.status === 'active' ? 'status-active' : 'status-idle'}"></span>
                      ${agent.status === 'active' ? 'En traitement' : 'En attente'}
                    </div>
                    <div class="sparkline">
                      ${agent.timeline.map((val: number) => html`
                        <div class="spark-bar" style="height: ${(val / 150) * 100}%"></div>
                      `)}
                    </div>
                  </div>
                </div>
              `)}
            </div>
          </div>
          
          <div class="panel-card" style="padding: 2rem; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, white, #fdfaf4);">
            <div>
              <h3 style="margin: 0 0 0.5rem 0; color: #1a1612;">Analytique Globale</h3>
              <p style="margin: 0; color: #7a6b5d; font-size: 0.9rem;">Économies estimées par rapport à un hébergement Cloud.</p>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 800; font-size: 2.5rem; color: #894d0d;">2,450 €</div>
              <div style="color: #10b981; font-weight: 600; font-size: 0.85rem;">▲ +15% ce mois-ci</div>
            </div>
          </div>
        </div>

        <!-- Sidebar: Hardware & Node Status -->
        <div class="side-panel">
          <div class="panel-card">
            <div class="bg-decorator"></div>
            <div class="panel-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>
              Ressources Système
            </div>
            
            <div class="metrics-grid">
              <div class="metric-box">
                <span class="metric-label">VRAM Allouée</span>
                <span class="metric-value">${this.systemMetrics.vram} <span class="metric-unit">GB</span></span>
                <div style="margin-top: 8px; height: 4px; background: rgba(184, 115, 51, 0.2); border-radius: 2px; overflow: hidden;">
                  <div style="height: 100%; width: ${(this.systemMetrics.vram / 24) * 100}%; background: #b87333; transition: width 0.5s;"></div>
                </div>
              </div>
              
              <div class="metric-box">
                <span class="metric-label">CPU Host</span>
                <span class="metric-value">${this.systemMetrics.cpu} <span class="metric-unit">%</span></span>
                <div style="margin-top: 8px; height: 4px; background: rgba(184, 115, 51, 0.2); border-radius: 2px; overflow: hidden;">
                  <div style="height: 100%; width: ${this.systemMetrics.cpu}%; background: ${this.systemMetrics.cpu > 80 ? '#e74c3c' : '#b87333'}; transition: width 0.5s;"></div>
                </div>
              </div>

              <div class="metric-box">
                <span class="metric-label">TDP Power</span>
                <span class="metric-value">${this.systemMetrics.power} <span class="metric-unit">W</span></span>
              </div>
              
              <div class="metric-box">
                <span class="metric-label">RAM Système</span>
                <span class="metric-value">${this.systemMetrics.ram} <span class="metric-unit">%</span></span>
              </div>
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-title">Nœuds de Calcul</div>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid rgba(184, 115, 51, 0.1);">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="width: 32px; height: 32px; border-radius: 8px; background: #1a1612; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700;">N1</div>
                  <div>
                    <div style="font-weight: 700; color: #1a1612; font-size: 0.9rem;">RTX 4090</div>
                    <div style="font-size: 0.75rem; color: #7a6b5d;">Local • IDLE</div>
                  </div>
                </div>
                <div style="color: #10b981; font-weight: 700; font-size: 0.8rem;">32°C</div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="width: 32px; height: 32px; border-radius: 8px; background: #635345; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700;">N2</div>
                  <div>
                    <div style="font-weight: 700; color: #1a1612; font-size: 0.9rem;">A100 Cluster</div>
                    <div style="font-size: 0.75rem; color: #7a6b5d;">Distant • ACTIVE</div>
                  </div>
                </div>
                <div style="color: #f59e0b; font-weight: 700; font-size: 0.8rem;">68°C</div>
              </div>
            </div>
            
            <button style="width: 100%; margin-top: 1.5rem; padding: 12px; border: 1px dashed rgba(184, 115, 51, 0.4); background: transparent; border-radius: 8px; color: #b87333; font-weight: 600; cursor: pointer; transition: all 0.2s;">
              + Ajouter un Nœud
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

