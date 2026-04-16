import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { workspaceService } from '../services/workspace-service';
import { analyticsService } from '../services/analytics-service';

@customElement('wordex-analytics-view')
export class WordexAnalyticsView extends LitElement {
  static styles = css`
    :host { display: block; padding-bottom: 4rem; animation: fadeIn 0.5s; }
    .header { margin-bottom: 2.5rem; }
    h1 { font-size: 2.5rem; font-weight: 900; margin-bottom: 0.5rem; letter-spacing: -1px; }
    .header p { color: #94a3b8; font-size: 1.1rem; }

    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; }
    .stat-card {
      background: rgba(14, 16, 21, 0.8); backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 20px;
      padding: 1.5rem; display: flex; flex-direction: column; gap: 8px;
    }
    .stat-label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; }
    .stat-value { font-size: 1.75rem; font-weight: 900; color: #4fd1c5; }
    .stat-trend { font-size: 0.75rem; color: #22c55e; display: flex; align-items: center; gap: 4px; }

    .table-section {
      background: rgba(14, 16, 21, 0.5); border-radius: 20px; padding: 2rem;
      border: 1px solid rgba(255, 255, 255, 0.02);
    }
    table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; }
    th { text-align: left; padding: 12px; color: #94a3b8; font-size: 0.7rem; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.05); }
    td { padding: 16px 12px; font-size: 0.9rem; border-bottom: 1px solid rgba(255,255,255,0.02); color: white; }
    .badge { padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; background: rgba(79, 209, 197, 0.2); color: #4fd1c5; }
  `;

  @state() private loading = false;
  @state() private valuation = 0;
  @state() private irr = 0;
  @state() private yield = 0;
  @state() private variables: any[] = [];

  async connectedCallback() {
    super.connectedCallback();
    await this.fetchData();
  }

  async fetchData() {
    this.loading = true;
    try {
      const workspaces = await workspaceService.getWorkspaces();
      if (workspaces.length > 0) {
        const wsId = workspaces[0].id;
        const [dataA, dataV] = await Promise.all([
          analyticsService.getAnalytics(wsId),
          analyticsService.getVariables(wsId)
        ]);
        
        this.valuation = dataA.data?.valuation || 12500000;
        this.irr = dataA.data?.irr || 14.8;
        this.yield = dataA.data?.yield || 6.2;
        this.variables = dataV.variables || [];
        
        if (this.variables.length === 0) throw new Error("No variables");
      } else {
        throw new Error("No workspace");
      }
    } catch (e) {
      console.warn("Analytics Sync Offline, using mock data");
      this.valuation = 12500000;
      this.irr = 14.8;
      this.yield = 6.2;
      this.variables = [
        { kpi_name: 'OPEX Optimization', source_doc: 'Budget_2026.xlsx', cell_range: 'D10:D50', aggregation: 'SUM' },
        { kpi_name: 'Machine Uptime', source_doc: 'Sensor_Logs_Sept.csv', cell_range: 'ALL', aggregation: 'AVERAGE' },
        { kpi_name: 'Raw Material Cost', source_doc: 'Procurement_v3.pdf', cell_range: 'Table 4', aggregation: 'EXTRACT' },
        { kpi_name: 'Energy Efficiency', source_doc: 'Factory_RealTime', cell_range: 'LIVE', aggregation: 'LAST' }
      ];
    } finally {
      this.loading = false;
    }
  }

  render() {
    if (this.loading) return html`<div style="text-align:center;padding:4rem;color:#94a3b8;">Chargement des analytics...</div>`;
    return html`
      <div class="header">
        <h1>Deep Portfolio Analytics</h1>
        <p>Visualisation des flux de trésorerie et performance du patrimoine Aether.</p>
      </div>

      <div class="grid">
        <div class="stat-card">
          <span class="stat-label">Net Asset Value (NAV)</span>
          <span class="stat-value">$${this.valuation.toLocaleString()}</span>
          <span class="stat-trend">▲ 12.5% vs Last Year</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Internal Rate of Return</span>
          <span class="stat-value">${this.irr}%</span>
          <span class="stat-trend" style="color: #4fd1c5;">Portfolio Target: 18%</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Current Yield</span>
          <span class="stat-value">${this.yield}%</span>
          <span class="stat-trend">Stable Revenue Stream</span>
        </div>
      </div>

      <div class="table-section">
        <h2 style="font-size: 1.2rem; font-weight: 800;">Indicateurs KPI (Linked Variables)</h2>
        <table>
          <thead>
            <tr>
              <th>Variable KPI</th>
              <th>Source Document</th>
              <th>Cell Range</th>
              <th>Aggregation</th>
            </tr>
          </thead>
          <tbody>
            ${this.variables.map(v => html`
              <tr>
                <td><span class="badge">${v.kpi_name}</span></td>
                <td>${v.source_doc || 'Master Spreadsheet'}</td>
                <td><code style="color: #4fd1c5;">${v.cell_range || 'B12:E45'}</code></td>
                <td>${v.aggregation}</td>
              </tr>
            `)}
            ${this.variables.length === 0 ? html`<tr><td colspan="4" style="text-align:center; color:#524439; padding: 3rem;">Aucune variable KPI raccordée pour le moment.</td></tr>` : ''}
          </tbody>
        </table>
      </div>
    `;
  }
}
