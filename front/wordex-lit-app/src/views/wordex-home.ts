import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Router } from '@vaadin/router';
import { workspaceService } from '../services/workspace-service';
import type { Workspace } from '../services/workspace-service';
import { TranslationMixin } from '../services/translation-service';

@customElement('wordex-home')
export class WordexHome extends TranslationMixin(LitElement) {
  @state() private workspaces: Workspace[] = [];

  @state() private showJoinConfetti = false;
  @state() private collaborators = 4;

  async connectedCallback() {
    super.connectedCallback();
    try {
      this.workspaces = await workspaceService.getWorkspaces();
    } catch (e: any) {
      console.warn("Workspaces sync unavailable:", e);
      this.workspaces = [];
    }
  }

  private handleJoin() {
    this.collaborators++;
    this.showJoinConfetti = true;
    setTimeout(() => this.showJoinConfetti = false, 2000);
  }

  static styles = css`
    :host { display: block; animation: fadeIn 0.5s; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    
    .header-section { margin-bottom: 3rem; }
    .greeting { font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; color: #894d0d; margin-bottom: 0.5rem; }
    h1 { font-size: 3.5rem; font-weight: 800; line-height: 1.1; margin: 0; color: #1c1c1a; letter-spacing: -1px; }
    h1 span { font-style: italic; font-family: serif; color: #894d0d; font-weight: 400;}

    .grid-container {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;
    }

    .bento-card {
      background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px);
      border: 1px solid rgba(133, 116, 103, 0.15); border-radius: 24px;
      padding: 1.5rem; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative; overflow: hidden; cursor: pointer;
    }

    .bento-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(137, 77, 13, 0.12); }

    .card-icon {
      width: 48px; height: 48px; border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; margin-bottom: 1.5rem;
    }
    .card-icon.copper { background: #894d0d; color: white; }
    .card-icon.teal { background: #006576; color: white; }

    .card-title { font-size: 1.2rem; font-weight: 800; margin: 0 0 0.5rem 0; color: #1c1c1a; }
    .card-desc { font-size: 0.9rem; color: #524439; margin: 0 0 1.5rem 0; line-height: 1.5; }
    
    .status-bar {
      display: flex; justify-content: space-between; align-items: center;
      padding-top: 1rem; border-top: 1px solid rgba(133, 116, 103, 0.1);
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
    }

    .collaboration-banner {
      margin-top: 2rem; background: #31302e; color: white; padding: 2rem; border-radius: 24px;
      display: flex; justify-content: space-between; align-items: center; position: relative; overflow: hidden;
    }

    .btn-join {
      z-index: 1; padding: 12px 24px; background: #894d0d; color: white; border: none; border-radius: 12px;
      font-weight: 800; cursor: pointer; transition: all 0.2s;
    }
    .btn-join:hover { background: #a76526; transform: scale(1.05); }
  `;

  render() {
    return html`
      <div class="header-section">
        <div class="greeting">${this.t('home.greeting')}</div>
        <h1>${this.t('home.titlePrefix')}<br><span>${this.t('home.atelier')}</span> ${this.t('home.titleSuffix')}</h1>
      </div>

      <div class="grid-container">
        ${this.workspaces.map((ws, i) => html`
          <div class="bento-card" @click=${() => Router.go('/dashboard')}>
            <div class="card-icon ${i % 2 !== 0 ? 'teal' : 'copper'}">${ws.icon || '🏗️'}</div>
            <h4 class="card-title">${ws.name}</h4>
            <p class="card-desc">${ws.description || this.t('home.collabMembers', { count: 0 })}</p>
            <div class="status-bar">
               <span style="color: ${i % 2 !== 0 ? '#006576' : '#894d0d'};">${this.t('home.active')}</span>
               <span style="color: #857467;">${this.t('home.online')}</span>
            </div>
          </div>
        `)}
      </div>
      
      <div class="collaboration-banner">
        <div>
          <h4 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; font-weight: 800;">${this.t('home.collabTitle')}</h4>
          <p style="margin:0; font-size: 0.9rem; color: rgba(255,255,255,0.7);">
            ${this.t('home.collabMembers', { count: this.collaborators })}
          </p>
        </div>
        <button class="btn-join" @click=${this.handleJoin}>
          ${this.t('home.joinCanvas')} ${this.showJoinConfetti ? '✨' : ''}
        </button>
      </div>
    `;
  }
}
