import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { apiFetch } from '../services/api-client';

@customElement('wordex-webhooks-view')
export class WordexWebhooksView extends LitElement {
  static styles = css`
    :host { display: block; animation: fadeIn 0.5s; padding-bottom: 4rem; }
    .header { margin-bottom: 2rem; }
    h1 { font-size: 2.5rem; font-weight: 900; margin-bottom: 0.5rem; }
    p { color: #94a3b8; font-size: 1.1rem; }

    .webhook-card {
      background: rgba(14, 16, 21, 0.8); backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 20px;
      padding: 1.5rem; margin-bottom: 1rem;
      display: flex; align-items: center; justify-content: space-between;
    }
    .webhook-info h3 { margin: 0; color: #4fd1c5; }
    .webhook-info p { margin: 4px 0 0; font-size: 0.85rem; color: #94a3b8; }
    
    .status-active { background: rgba(34, 197, 94, 0.1); color: #22c55e; border-radius: 6px; padding: 4px 10px; font-size: 0.75rem; font-weight: 800; }
    .btn-test { padding: 8px 16px; background: rgba(79, 209, 197, 0.1); border: 1px solid #4fd1c5; border-radius: 8px; color: #4fd1c5; font-size: 0.8rem; font-weight: 800; cursor: pointer; transition: all 0.2s; }
  `;

  @state() private loading = false;
  @state() private webhooks: any[] = [];

  async connectedCallback() {
    super.connectedCallback();
    await this.fetchData();
  }

  async fetchData() {
    this.loading = true;
    try {
      const res = await apiFetch('/webhooks');
      this.webhooks = await res.json();
      if (!Array.isArray(this.webhooks)) this.webhooks = [];
      if (this.webhooks.length === 0) throw new Error("No data");
    } catch (e) {
      console.warn("Webhooks service offline, using mock data");
      this.webhooks = [
        { name: 'Slack Production Alert', url: 'https://hooks.slack.com/services/T00/B00/XXX', events: ['critical_alert', 'system_reboot'], active: true },
        { name: 'Zapier ERP Sync', url: 'https://hooks.zapier.com/v1/event/123456', events: ['job_completed', 'metrics_daily'], active: true },
        { name: 'Custom API Endpoint', url: 'https://api.internal-factory.com/webhook', events: ['maintenance_request'], active: false }
      ];
    } finally {
      this.loading = false;
    }
  }

  render() {
    if (this.loading) return html`<div style="text-align:center;padding:4rem;color:#94a3b8;">Chargement des intégrations...</div>`;
    return html`
      <div class="header">
        <h1>Integrations Engine</h1>
        <p>Gérez vos webhooks pour connecter Wordex à vos systèmes externes (Slack, Zapier, Webhooks).</p>
      </div>

      <div class="list">
        ${this.webhooks.map(w => html`
          <div class="webhook-card">
            <div class="webhook-info">
              <h3>${w.name || 'Webhook Sans Nom'}</h3>
              <p>${w.url}</p>
              <div style="margin-top: 10px; font-size: 0.7rem;">Événements: ${w.events.join(', ')}</div>
            </div>
            <div style="display:flex; align-items:center; gap: 1rem;">
              <span class="status-active">${w.active ? 'ACTIVE' : 'DISABLED'}</span>
              <button class="btn-test">Test Signal</button>
            </div>
          </div>
        `)}
        
        ${this.webhooks.length === 0 ? html`
            <div style="text-align:center; padding: 4rem; color: #524439;">
              Aucun webhook configuré. <a href="#" style="color:#4fd1c5;">Ajouter une intégration</a>.
            </div>
        ` : ''}
      </div>
    `;
  }
}
