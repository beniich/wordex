import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('wordex-service-view')
export class WordexServiceView extends LitElement {
  static styles = css`
    :host {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-height: 80vh; text-align: center; color: #1c1c1a;
    }
    .status-badge {
      display: inline-block; padding: 4px 12px; border-radius: 12px;
      background: rgba(79, 209, 197, 0.1); color: #4fd1c5;
      font-size: 0.8rem; font-weight: 800; text-transform: uppercase; margin-bottom: 1rem;
    }
    h1 { font-size: 2.5rem; font-weight: 900; margin-bottom: 1rem; letter-spacing: -1px; }
    p { font-size: 1.1rem; color: #524439; max-width: 500px; line-height: 1.6; }
    .loader {
        width: 48px; height: 48px; border: 3px solid #1c1c1a; border-radius: 50%;
        display: inline-block; position: relative; box-sizing: border-box;
        animation: rotation 1s linear infinite;
    }
    .loader::after {
        content: ''; box-sizing: border-box; position: absolute; left: 50%; top: 50%;
        transform: translate(-50%, -50%); width: 40px; height: 40px; border-radius: 50%;
        border: 3px solid transparent; border-bottom-color: #4fd1c5;
    }
    @keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `;

  @state() private moduleName = "";

  connectedCallback() {
      super.connectedCallback();
      const path = window.location.pathname;
      this.moduleName = path.substring(1).charAt(0).toUpperCase() + path.substring(2);
  }

  render() {
    return html`
      <div class="status-badge">Module en cours de raccordement</div>
      <div class="loader"></div>
      <h1>${this.moduleName} Engine</h1>
      <p>
        Le socle de données <b>${this.moduleName}</b> est en cours de création dans l'atelier céleste. 
        Il sera bientôt raccordé aux flux de Wordex pour une orchestration complète.
      </p>
    `;
  }
}
