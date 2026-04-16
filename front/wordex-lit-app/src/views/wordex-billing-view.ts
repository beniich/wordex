import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { billingService } from '../services/billing-service';

@customElement('wordex-billing-view')
export class WordexBillingView extends LitElement {
  static styles = css`
    :host { display: block; animation: fadeIn 0.5s; padding-bottom: 4rem; color: #1c1c1a; }
    .header { margin-bottom: 2rem; text-align: center; }
    h1 { font-size: 2.5rem; font-weight: 900; margin-bottom: 0.5rem; }
    p { color: #857467; font-size: 1.1rem; }

    .plans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-top: 3rem;
      max-width: 1000px;
      margin-left: auto;
      margin-right: auto;
    }

    .plan-card {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(133, 116, 103, 0.15);
      border-radius: 20px;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }
    .plan-card.highlighted {
      border: 2px solid #894d0d;
      transform: scale(1.02);
      box-shadow: 0 20px 40px rgba(137, 77, 13, 0.1);
    }
    .plan-card:hover {
      transform: translateY(-4px);
    }
    .plan-card.highlighted:hover {
      transform: scale(1.02) translateY(-4px);
    }

    .plan-badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: #894d0d;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
    }

    .plan-name { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem; }
    .plan-price { font-size: 2.5rem; font-weight: 900; color: #894d0d; margin-bottom: 1rem; }
    .plan-price span { font-size: 1rem; color: #857467; font-weight: 500; }

    .features { list-style: none; padding: 0; margin: 1.5rem 0; flex-grow: 1; }
    .features li { padding: 8px 0; border-bottom: 1px solid rgba(133, 116, 103, 0.1); font-size: 0.9rem; display: flex; align-items: center; gap: 8px; }
    .features li::before { content: '✓'; color: #894d0d; font-weight: bold; }

    .btn {
      width: 100%; padding: 14px; border-radius: 12px; font-weight: 800; font-family: inherit; font-size: 1rem; cursor: pointer; transition: all 0.2s;
    }
    .btn-primary { background: #894d0d; color: white; border: none; }
    .btn-primary:hover { background: #a76526; }
    .btn-secondary { background: transparent; color: #1c1c1a; border: 1px solid rgba(133, 116, 103, 0.3); }
    .btn-secondary:hover { background: rgba(137, 77, 13, 0.05); border-color: #894d0d; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `;

  @state() private loading = true;
  @state() private processing = false;
  @state() private plans: any[] = [];

  async connectedCallback() {
    super.connectedCallback();
    await this.fetchData();
  }

  async fetchData() {
    this.loading = true;
    try {
      const data = await billingService.getPlans();
      this.plans = data.plans || [];
    } catch (e) {
      console.warn("Billing service offline, using mock data", e);
      // Fallback for mock view if backend is down
      this.plans = [
        { id: "FREE", name: "Starter", price_monthly: 0, currency: "EUR", features: ["3 utilisateurs max", "1 workspace", "5 documents"], highlighted: false },
        { id: "PRO", name: "Pro Clinique", price_monthly: 49, currency: "EUR", features: ["25 utilisateurs", "Workspaces illimités", "AI agents", "Support 48h"], highlighted: true },
        { id: "ENTERPRISE", name: "Enterprise", price_monthly: 199, currency: "EUR", features: ["Illimité", "SSO / SAML", "Audit logs & RGPD", "Support dédié 24/7"], highlighted: false }
      ];
    } finally {
      this.loading = false;
    }
  }

  async handleSubscribe(planId: string) {
    if (planId === 'FREE') return; // Handled differently usually
    this.processing = true;
    try {
      // Stub organization ID logically obtained from auth state / workspace state in real app
      const orgId = "org_default"; 
      const orgName = "Mon Organisation";
      const res = await billingService.createCheckoutSession(planId, orgId, orgName);
      
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la création de la session de paiement.");
    } finally {
      this.processing = false;
    }
  }

  render() {
    if (this.loading) return html`<div style="text-align:center;padding:4rem;color:#857467;">Chargement des forfaits...</div>`;
    
    return html`
      <div class="header">
        <h1>Forfaits & Abonnement</h1>
        <p>Choisissez le plan adapté à la croissance de votre entreprise industrielle.</p>
      </div>

      <div class="plans-grid">
        ${this.plans.map(plan => html`
          <div class="plan-card ${plan.highlighted ? 'highlighted' : ''}">
            ${plan.highlighted ? html`<div class="plan-badge">Le plus populaire</div>` : ''}
            
            <div class="plan-name">${plan.name}</div>
            <div class="plan-price">
              ${plan.price_monthly}€<span>/mois</span>
            </div>
            
            <ul class="features">
              ${plan.features.map((f: string) => html`<li>${f}</li>`)}
            </ul>
            
            <button 
              class="btn ${plan.highlighted ? 'btn-primary' : 'btn-secondary'}"
              @click=${() => this.handleSubscribe(plan.id)}
              ?disabled=${this.processing}
            >
              ${this.processing ? 'Traitement...' : (plan.price_monthly === 0 ? 'Plan Actuel' : 'Mettre à niveau')}
            </button>
          </div>
        `)}
      </div>
    `;
  }
}
