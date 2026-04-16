import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { organisationService, Organisation } from '../services/organisation-service';

@customElement('wordex-organisations-view')
export class WordexOrganisationsView extends LitElement {
  static styles = css`
    :host { display: block; animation: fadeIn 0.5s; color: #1c1c1a; padding-bottom: 4rem; }
    header { margin-bottom: 3rem; }
    h1 { font-size: 2.5rem; font-weight: 900; letter-spacing: -1px; margin-bottom: 0.5rem; }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }
    .stat-card {
      background: white; border: 1px solid rgba(133, 116, 103, 0.15); border-radius: 20px; padding: 1.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }
    .stat-value { font-size: 2rem; font-weight: 900; color: #894d0d; }
    .stat-label { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #857467; letter-spacing: 0.05em; }

    .org-list {
      background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px);
      border: 1px solid rgba(133, 116, 103, 0.15); border-radius: 24px;
      padding: 1.5rem; box-shadow: 0 10px 40px rgba(137, 77, 13, 0.05);
    }
    
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 1rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: #894d0d; border-bottom: 2px solid rgba(133, 116, 103, 0.1); }
    td { padding: 1.25rem 1rem; border-bottom: 1px solid rgba(133, 116, 103, 0.1); font-size: 0.95rem; }
    
    .plan-badge {
      display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 800;
    }
    .plan-FREE { background: #f1ede8; color: #857467; }
    .plan-PRO { background: #e6f2f3; color: #006576; }
    .plan-ENTERPRISE { background: #fff5e6; color: #894d0d; }

    .btn {
      padding: 10px 20px; border-radius: 12px; border: none; font-weight: 800; cursor: pointer; transition: all 0.2s; font-family: inherit; font-size: 0.85rem;
    }
    .btn-outline { background: transparent; border: 1px solid #d8c3b4; color: #524439; }
    .btn-outline:hover { border-color: #894d0d; color: #894d0d; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `;

  @state() private orgs: Organisation[] = [];
  @state() private loading = true;

  async connectedCallback() {
    super.connectedCallback();
    await this.fetchOrgs();
  }

  async fetchOrgs() {
    this.loading = true;
    try {
      this.orgs = await organisationService.listOrganisations();
    } catch (e) {
      console.error(e);
    } finally {
      this.loading = false;
    }
  }

  render() {
    const totalMembers = this.orgs.reduce((sum, o) => sum + o.member_count, 0);
    const enterpriseCount = this.orgs.filter(o => o.plan === 'ENTERPRISE').length;

    return html`
      <header>
        <p style="margin: 0; color: #006576; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.75rem;">Wordex Admin Console</p>
        <h1>Gestion des Organisations</h1>
      </header>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${this.orgs.length}</div>
          <div class="stat-label">Organisations Actives</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${totalMembers}</div>
          <div class="stat-label">Utilisateurs Totaux</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${enterpriseCount}</div>
          <div class="stat-label">Comptes Enterprise</div>
        </div>
      </div>

      <div class="org-list">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
          <h3 style="margin: 0; font-weight: 900; font-size: 1.4rem;">Registry des Tenants</h3>
          <button class="btn btn-outline" @click=${() => alert('Fonctionnalité en cours de déploiement...')}>+ Ajouter une Organisation</button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Nom de l'Organisation</th>
              <th>Plan</th>
              <th>Membres</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.loading ? html`<tr><td colspan="5">Chargement du tenant registry...</td></tr>` : this.orgs.map(org => html`
              <tr>
                <td>
                  <div style="font-weight: 800; color: #1c1c1a;">${org.name}</div>
                  <div style="font-size: 0.75rem; color: #857467;">slug: ${org.slug}</div>
                </td>
                <td><span class="plan-badge plan-${org.plan}">${org.plan}</span></td>
                <td><span style="font-weight: 700;">${org.member_count}</span> membres</td>
                <td>
                  <span style="display:inline-block; width:8px; height:8px; background:#10b981; border-radius:50%; margin-right:6px;"></span>
                  ${org.subscription_status || 'Active'}
                </td>
                <td>
                  <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.75rem;">Gérer</button>
                </td>
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `;
  }
}
