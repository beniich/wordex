import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { apiFetch } from '../services/api-client';

@customElement('wordex-settings-view')
export class WordexSettingsView extends LitElement {
  @state() private activeTab: 'users' | 'org' = 'users';
  @state() private users: any[] = [];
  @state() private orgs: any[] = [];
  @state() private loading = true;

  async connectedCallback() {
    super.connectedCallback();
    this.activeTab = window.location.pathname.includes('users') ? 'users' : 'org';
    await this.fetchData();
  }

  async fetchData() {
    this.loading = true;
    try {
      const [resU, resO] = await Promise.all([
        apiFetch('/users'),
        apiFetch('/organisations')
      ]);
      
      if (resU.ok) this.users = await resU.json();
      if (resO.ok) this.orgs = await resO.json();
      
    } catch (e) {
      this.users = [];
      this.orgs = [];
    } finally {
      this.loading = false;
    }
  }

  static styles = css`
    :host { display: block; animation: fadeIn 0.5s; color: #1c1c1a; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    header { margin-bottom: 3rem; }
    h1 { font-size: 2.5rem; margin-bottom: 1rem; font-weight: 800; letter-spacing: -1px; }

    .tabs { display: flex; gap: 2rem; border-bottom: 2px solid rgba(133, 116, 103, 0.1); margin-bottom: 2.5rem; }
    .tab { padding: 12px 0; font-weight: 800; cursor: pointer; color: #857467; transition: all 0.2s; border-bottom: 4px solid transparent; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.85rem;}
    .tab.active { color: #894d0d; border-color: #894d0d; }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }

    .card {
      background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px);
      border: 1px solid rgba(133, 116, 103, 0.15); border-radius: 20px;
      padding: 1.5rem; display: flex; align-items: center; gap: 1.25rem;
    }

    .avatar {
      width: 50px; height: 50px; border-radius: 50%; background: #894d0d; color: white;
      display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem;
    }
    .org-icon { background: #006576; }

    .info h4 { margin: 0; font-size: 1.1rem; font-weight: 800; }
    .info p { margin: 0; font-size: 0.85rem; color: #857467; font-weight: 600; }
  `;

  render() {
    return html`
      <header>
        <p style="margin: 0; color: #894d0d; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.75rem;">Account Management</p>
        <h1>Settings Administration</h1>
      </header>

      <div class="tabs">
        <div class="tab ${this.activeTab === 'users' ? 'active' : ''}" @click=${() => this.activeTab = 'users'}>Team Members</div>
        <div class="tab ${this.activeTab === 'org' ? 'active' : ''}" @click=${() => this.activeTab = 'org'}>Organizations & Entity</div>
      </div>

      <div class="grid">
        ${this.activeTab === 'users' ? html`
          ${this.loading ? html`<div>Loading team list...</div>` : this.users.map(u => html`
            <div class="card">
              <div class="avatar">${u.initials || 'U'}</div>
              <div class="info">
                <h4>${u.name || (u.username)}</h4>
                <p>${u.role || 'Member'}</p>
                <p style="opacity: 0.6; font-size: 0.75rem;">${u.email}</p>
              </div>
            </div>
          `)}
        ` : html`
          ${this.loading ? html`<div>Loading organization data...</div>` : this.orgs.map(o => html`
            <div class="card">
              <div class="avatar org-icon">🏢</div>
              <div class="info">
                <h4>${o.name}</h4>
                <p>Plan: ${o.plan || 'Free'}</p>
                <p style="opacity: 0.6; font-size: 0.75rem;">Slug: ${o.slug}</p>
              </div>
            </div>
          `)}
        `}
      </div>
    `;
  }
}
