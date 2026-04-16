import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sheetsService, SpreadsheetContent } from '../services/sheets-service';

@customElement('wordex-sheet-view')
export class WordexSheetView extends LitElement {
  static styles = css`
    :host { display: block; animation: fadeIn 0.5s; color: #1c1c1a; padding-bottom: 4rem; }
    header { margin-bottom: 2rem; }
    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; font-weight: 800; letter-spacing: -1px; }

    .spreadsheet-container {
      background: #fff;
      border: 1px solid rgba(133, 116, 103, 0.15);
      border-radius: 16px;
      overflow: auto;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
      max-height: 70vh;
    }

    table { border-collapse: collapse; min-width: 100%; table-layout: fixed; }
    th {
      background: #f8f6f3; padding: 10px; border: 1px solid #e2e0dd;
      font-size: 0.75rem; color: #857467; font-weight: 800; text-align: center;
      position: sticky; top: 0; z-index: 10;
    }
    td {
      padding: 0; border: 1px solid #e2e0dd; height: 32px;
    }
    .row-header {
      background: #f8f6f3; width: 40px; text-align: center; font-size: 0.75rem; font-weight: 800; color: #857467;
      position: sticky; left: 0; z-index: 5;
    }
    
    input {
      width: 100%; height: 100%; border: none; background: transparent; padding: 0 8px;
      font-family: inherit; font-size: 0.9rem; outline: none;
    }
    input:focus {
      background: #fffce6;
      box-shadow: inset 0 0 0 2px #894d0d;
    }

    .toolbar {
      background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px);
      border: 1px solid rgba(133, 116, 103, 0.15); border-radius: 12px;
      padding: 0.75rem 1rem; margin-bottom: 1rem; display: flex; gap: 1rem; align-items: center;
    }
    .btn {
      padding: 8px 16px; border-radius: 8px; border: 1px solid #d8c3b4; background: white;
      font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
    }
    .btn:hover { border-color: #894d0d; background: #fdfaf8; }
    .btn-primary { background: #894d0d; color: white; border: none; }
    .btn-primary:hover { background: #a76526; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `;

  @state() private docId: string | null = null;
  @state() private content: SpreadsheetContent = { cells: {}, metadata: { version: 1 } };
  @state() private loading = false;
  @state() private rows = 30;
  @state() private cols = 15;

  async connectedCallback() {
    super.connectedCallback();
    const params = new URLSearchParams(window.location.search);
    this.docId = params.get('id');
    if (this.docId) {
      await this.fetchSheet();
    }
  }

  async fetchSheet() {
    if (!this.docId) return;
    this.loading = true;
    try {
      this.content = await sheetsService.getSheet(this.docId);
    } catch (e) {
      console.warn("Sheet service unavailable, using empty grid.");
    } finally {
      this.loading = false;
    }
  }

  handleCellChange(col: number, row: number, value: string) {
    const cellId = `${String.fromCharCode(65 + col)}${row + 1}`;
    this.content.cells[cellId] = value;
    // Auto-save logic could go here
  }

  async save() {
    if (!this.docId) return;
    this.loading = true;
    try {
      await sheetsService.updateSheet(this.docId, this.content);
    } catch (e) {
      alert("Erreur lors de la sauvegarde.");
    } finally {
      this.loading = false;
    }
  }

  render() {
    return html`
      <header>
        <p style="margin: 0; color: #894d0d; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.75rem;">Structured Data</p>
        <h1>Ledger : ${this.docId || 'Nouvelle Feuille'}</h1>
      </header>

      <div class="toolbar">
        <button class="btn btn-primary" @click=${this.save}>Sauvegarder</button>
        <button class="btn" @click=${() => window.print()}>Imprimer</button>
        <div style="flex: 1;"></div>
        <span style="font-size: 0.75rem; color: #857467; font-weight: 600;">ISO 27001 PROTECTED LAYER</span>
      </div>

      <div class="spreadsheet-container">
        <table>
          <thead>
            <tr>
              <th style="width: 40px;"></th>
              ${Array.from({ length: this.cols }).map((_, i) => html`
                <th style="width: 120px;">${String.fromCharCode(65 + i)}</th>
              `)}
            </tr>
          </thead>
          <tbody>
            ${Array.from({ length: this.rows }).map((_, row) => html`
              <tr>
                <td class="row-header">${row + 1}</td>
                ${Array.from({ length: this.cols }).map((_, col) => {
                  const cellId = `${String.fromCharCode(65 + col)}${row + 1}`;
                  const value = this.content.cells[cellId] || '';
                  return html`
                    <td>
                      <input 
                        .value=${value} 
                        @change=${(e: any) => this.handleCellChange(col, row, e.target.value)}
                      />
                    </td>
                  `;
                })}
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `;
  }
}
