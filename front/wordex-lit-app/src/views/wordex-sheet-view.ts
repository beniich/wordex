import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { apiFetch } from '../services/api-client';

@customElement('wordex-sheet-view')
export class WordexSheetView extends LitElement {
  @state() private sheets: any[] = [];
  @state() private loading = true;

  async connectedCallback() {
    super.connectedCallback();
    await this.fetchData();
  }

  async fetchData() {
    this.loading = true;
    try {
      const res = await apiFetch('/sheets');
      this.sheets = await res.json();
      if (!Array.isArray(this.sheets)) this.sheets = [];
      if (this.sheets.length === 0) throw new Error("No data");
    } catch (e) {
      console.warn("Sheets service offline, using mock data");
      this.sheets = [
        { title: 'Annual_Budget_2026.xlsx', rows: 450, status: 'Synced', last_modified: 'Aujourd\'hui' },
        { title: 'Inventory_Log_Q2.csv', rows: 1240, status: 'Draft', last_modified: 'Hier' },
        { title: 'Supply_Chain_Analytics.gsheet', rows: 85, status: 'Synced', last_modified: 'Il y a 2 jours' },
        { title: 'Factory_Sensor_A1_History.json', rows: 5400, status: 'Active', last_modified: 'En direct' }
      ];
    } finally {
      this.loading = false;
    }
  }

  static styles = css`
    :host { display: block; animation: fadeIn 0.5s; color: #1c1c1a; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    header { margin-bottom: 3rem; }
    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; font-weight: 800; letter-spacing: -1px; }

    .sheet-list {
      background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px);
      border: 1px solid rgba(133, 116, 103, 0.15); border-radius: 24px;
      padding: 1.5rem; box-shadow: 0 10px 40px rgba(137, 77, 13, 0.05);
    }

    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th { text-align: left; padding: 1rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: #894d0d; border-bottom: 2px solid rgba(133, 116, 103, 0.1); }
    td { padding: 1.25rem 1rem; border-bottom: 1px solid rgba(133, 116, 103, 0.1); font-size: 0.95rem; font-weight: 600; color: #524439; }
    
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(137, 77, 13, 0.02); color: #1c1c1a; }

    .status-badge {
      display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;
      background: rgba(137, 77, 13, 0.1); color: #894d0d;
    }
    
    .actions-btn {
      padding: 12px 24px; background: #894d0d; color: white; border: none; border-radius: 12px; font-weight: 800; cursor: pointer; transition: all 0.2s;
    }
    .actions-btn:hover { background: #a76526; transform: translateY(-2px); }
  `;

  render() {
    return html`
      <header>
        <p style="margin: 0; color: #006576; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.75rem;">Structured Data</p>
        <h1>Ledgers & Sheets</h1>
      </header>

      <div class="sheet-list">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
          <h3 style="margin: 0; font-weight: 800; font-size: 1.2rem;">Inventory Overview</h3>
          <button class="actions-btn">+ Import New Sheet</button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Document Name</th>
              <th>Data Points</th>
              <th>Status</th>
              <th>Modified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.loading ? html`<tr><td colspan="5">Loading ledger data...</td></tr>` : this.sheets.map(sheet => html`
              <tr>
                <td style="color: #1c1c1a;">${sheet.title}</td>
                <td>${sheet.rows} Rows</td>
                <td><span class="status-badge">${sheet.status}</span></td>
                <td>${sheet.last_modified}</td>
                <td><a href="#" style="color: #006576; text-decoration: none; font-weight: 800;">Open Analysis ↗</a></td>
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `;
  }
}
