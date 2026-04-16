import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { authService } from './services/auth-service';

import './views/wordex-home';
import './views/wordex-dashboard-view';
import './views/wordex-agents-view';
import './views/wordex-slides-view';
import './views/wordex-registry-view';
import './views/wordex-analytics-view';
import './views/wordex-sheet-view';
import './views/wordex-audio-view';
import './views/wordex-webhooks-view';
import './views/wordex-tracer-view';
import './views/wordex-gantt-view';
import './views/wordex-settings-view';
import './components/wordex-notifications-bell';

@customElement('wordex-app')
export class WordexApp extends LitElement {
  @state() private currentPath = window.location.pathname;

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('vaadin-router-location-changed', (e: any) => {
      this.currentPath = e.detail.location.pathname;
    });
  }

  private isActive(path: string) {
    if (path === '/' && this.currentPath === '/') return true;
    if (path !== '/' && this.currentPath.startsWith(path)) return true;
    return false;
  }

  static styles = css`
    :host {
      --primary: #894d0d;
      --primary-container: #a76526;
      --on-primary: #ffffff;
      --surface: #fcf9f5;
      --on-surface: #1c1c1a;
      --on-surface-variant: #524439;
      --surface-container-low: #f6f3ef;
      --surface-container: #f0ede9;
      --tertiary: #006576;
      --outline-variant: rgba(133, 116, 103, 0.2);
      
      display: block;
      background-color: var(--surface);
      color: var(--on-surface);
      font-family: 'Manrope', sans-serif;
      height: 100vh;
      overflow: hidden;
      position: relative;
    }

    * { box-sizing: border-box; }

    .light-leak-1 {
      position: absolute; top: -20%; right: -10%; width: 50%; height: 50%;
      background: rgba(137, 77, 13, 0.04); border-radius: 50%; filter: blur(100px); z-index: 0; pointer-events: none;
    }
    .light-leak-2 {
      position: absolute; bottom: -10%; left: -10%; width: 40%; height: 40%;
      background: rgba(0, 101, 118, 0.04); border-radius: 50%; filter: blur(100px); z-index: 0; pointer-events: none;
    }

    .glass-panel {
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }

    .top-nav {
      position: fixed; top: 0.75rem; left: calc(84px + 1.5rem); right: 0.75rem; z-index: 50;
      height: 64px; display: flex; align-items: center; justify-content: space-between;
      padding: 0 1.5rem; border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(133, 116, 103, 0.1);
      background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px);
    }

    .brand-title { font-size: 1.5rem; font-weight: 900; color: var(--primary); letter-spacing: -1px; }

    .sidebar {
      position: fixed; left: 0.75rem; top: 0.75rem; bottom: 0.75rem;
      width: 84px; border-radius: 20px; padding: 1.5rem 0;
      display: flex; flex-direction: column; align-items: center; z-index: 100;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(133, 116, 103, 0.1);
      box-shadow: 10px 0 30px rgba(0, 0, 0, 0.05);
    }
    
    .separator {
      width: 30px; height: 1px; background: var(--outline-variant);
      margin: 10px 0;
    }
    
    .menu-toggle {
      width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
      color: var(--primary); opacity: 0.6; margin-bottom: 1.5rem; cursor: pointer;
    }
    .menu-toggle svg { width: 24px; height: 24px; stroke: currentColor; fill: none; stroke-width: 2; }

    .nav-link {
      position: relative;
      display: flex; align-items: center; justify-content: center; width: 54px; height: 54px;
      color: var(--on-surface-variant); text-decoration: none; border-radius: 16px;
      margin-bottom: 12px; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .nav-link svg { width: 24px; height: 24px; stroke-width: 2; stroke: currentColor; fill: none; stroke-linecap: round; stroke-linejoin: round; }

    .nav-link.active {
      background: rgba(137, 77, 13, 0.1);
      color: var(--primary);
    }
    .nav-link:hover:not(.active) {
      color: var(--primary); background: rgba(0, 0, 0, 0.03);
      transform: scale(1.05);
    }

    .badge {
      position: absolute; top: 0; right: 0;
      background: var(--tertiary); color: white; border-radius: 6px;
      font-size: 0.55rem; padding: 1px 4px; font-weight: 900;
    }

    main {
      position: absolute; left: calc(84px + 1.5rem); right: 0;
      top: calc(64px + 1.5rem); bottom: 0; padding: 2rem 3rem;
      overflow-y: auto; z-index: 10;
    }
  `;

  render() {
    const userInitial = authService.user?.username?.charAt(0).toUpperCase() || 'U';

    return html`
      <div class="light-leak-1"></div>
      <div class="light-leak-2"></div>

      <aside class="sidebar glass-panel">
        <div class="menu-toggle">
          <svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" stroke-width="2" stroke-linecap="round"/></svg>
        </div>

        <a href="/" class="nav-link ${this.isActive('/') ? 'active' : ''}" title="Home">
          <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
        </a>

        <a href="/dashboard" class="nav-link ${this.isActive('/dashboard') ? 'active' : ''}" title="Agent Stats">
          <svg viewBox="0 0 24 24"><path d="M3 3v18h18M18 17l-5-5-3 3-4-4"/></svg>
        </a>
        
        <a href="/registry" class="nav-link ${this.isActive('/registry') ? 'active' : ''}" title="Registry">
          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
        </a>

        <a href="/agents" class="nav-link ${this.isActive('/agents') ? 'active' : ''}" title="AI Agents">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          <div class="badge">AI</div>
        </a>
        
        <a href="/office" class="nav-link ${this.isActive('/office') ? 'active' : ''}" title="Wordex Enterprise (Office Clone)">
          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          <div class="badge" style="background:var(--primary); color:white;">PRO</div>
        </a>

        <div class="separator"></div>

        <a href="/analytics" class="nav-link ${this.isActive('/analytics') ? 'active' : ''}" title="Analytics">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/></svg>
        </a>

        <a href="/sheets" class="nav-link ${this.isActive('/sheets') ? 'active' : ''}" title="Ledgers">
          <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
        </a>

        <a href="/slides" class="nav-link ${this.isActive('/slides') ? 'active' : ''}" title="Slides">
          <svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
        </a>

        <div class="separator"></div>

        <a href="/audio" class="nav-link ${this.isActive('/audio') ? 'active' : ''}" title="Voice">
          <svg viewBox="0 0 24 24"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/></svg>
        </a>

        <a href="/tracer" class="nav-link ${this.isActive('/tracer') ? 'active' : ''}" title="GPU Engine">
          <svg viewBox="0 0 24 24"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M2 12h2M4.93 19.07l1.41-1.41"/><circle cx="12" cy="12" r="4"/></svg>
        </a>

        <a href="/gantt" class="nav-link ${this.isActive('/gantt') ? 'active' : ''}" title="Planning">
          <svg viewBox="0 0 24 24"><path d="M3 10h18M7 10v10M11 10v10M15 10v10"/><path d="M3 6h18a2 2 0 012 2v2H3V8a2 2 0 012-2z"/></svg>
        </a>

        <a href="/search" class="nav-link ${this.isActive('/search') ? 'active' : ''}" title="Recherche Globale">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </a>

        <div style="flex-grow: 1;"></div>
        
        <a href="/billing" class="nav-link ${this.isActive('/billing') ? 'active' : ''}" title="Abonnements & Facturation">
          <svg viewBox="0 0 24 24"><path d="M21 10V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/><path d="M3 10h18"/><path d="M7 15h.01"/><path d="M11 15h2"/><path d="M16 19h4"/></svg>
        </a>

        <a href="/settings" class="nav-link ${this.isActive('/settings') ? 'active' : ''}" title="Settings">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09a1.65 1.65 0 00-1-1.51l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09a1.65 1.65 0 001.51-1l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33h.09a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        </a>
      </aside>

      <nav class="top-nav glass-panel">
        <div style="display: flex; align-items: center; gap: 2rem;">
          <div class="brand-title">Aether Local OS</div>
        </div>
        <div style="display: flex; gap: 1rem; align-items: center;">
          <wordex-notifications-bell></wordex-notifications-bell>
          <div style="display: flex; flex-direction: column; align-items: flex-end; justify-content: center; margin-right: 10px;">
            <span style="font-size: 0.7rem; font-weight: 800; color: #22c55e;">LOCAL GPU ACTIVE</span>
            <span style="font-size: 0.65rem; color: #857467; font-weight: 600;">0ms Latency</span>
          </div>
          <div style="width: 36px; height: 36px; background: var(--primary); border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; cursor: pointer;" @click=${() => authService.logout()}>
            ${userInitial}
          </div>
        </div>
      </nav>

      <main>
        <slot></slot>
      </main>
    `;
  }
}
