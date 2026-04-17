import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { TranslationMixin } from '../services/translation-service';
import { searchService } from '../services/search-service';
import { workspaceService } from '../services/workspace-service';

@customElement('wordex-command-palette')
export class WordexCommandPalette extends TranslationMixin(LitElement) {
  @state() private queryText = "";
  @state() private results: any[] = [];
  @state() private searching = false;
  @query('input') private inputEl!: HTMLInputElement;

  private navigationItems = [
    { label: 'nav.home', path: '/', icon: '🏠' },
    { label: 'nav.dashboard', path: '/dashboard', icon: '📊' },
    { label: 'nav.agents', path: '/agents', icon: '🤖' },
    { label: 'nav.registry', path: '/registry', icon: '📂' },
    { label: 'nav.office', path: '/office', icon: '📄' },
    { label: 'nav.search', path: '/search', icon: '🔍' },
    { label: 'nav.settings', path: '/settings', icon: '⚙️' },
  ];

  static styles = css`
    :host {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: 1000;
      display: flex;
      justify-content: center;
      padding-top: 15vh;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(8px);
      animation: fadeIn 0.15s ease-out;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .palette {
      width: 100%;
      max-width: 600px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(133, 116, 103, 0.2);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      max-height: 70vh;
      animation: slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideIn { from { transform: scale(0.95) translateY(-10px); } to { transform: scale(1) translateY(0); } }

    .search-input-wrapper {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(133, 116, 103, 0.1);
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 1.25rem;
      color: #1c1c1a;
      font-family: inherit;
    }

    .results-area {
      overflow-y: auto;
      padding: 1rem;
    }

    .section-label {
      font-size: 0.7rem;
      font-weight: 800;
      color: #857467;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 1rem 0.5rem 0.5rem;
    }

    .palette-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      cursor: pointer;
      text-decoration: none;
      color: inherit;
      transition: background 0.1s;
    }

    .palette-item:hover, .palette-item.active {
      background: rgba(137, 77, 13, 0.1);
      color: #894d0d;
    }

    .item-icon {
      font-size: 1.25rem;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(133, 116, 103, 0.05);
      border-radius: 8px;
    }

    .item-label { font-weight: 700; flex: 1; }
    .item-shortcut { font-size: 0.7rem; opacity: 0.5; }

    .no-results {
      padding: 2rem;
      text-align: center;
      color: #857467;
      font-style: italic;
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    setTimeout(() => this.inputEl.focus(), 50);
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  disconnectedCallback() {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    super.disconnectedCallback();
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') this.close();
  }

  private close() {
    this.dispatchEvent(new CustomEvent('close'));
  }

  private async handleInput(e: InputEvent) {
    this.queryText = (e.target as HTMLInputElement).value;
    if (this.queryText.length > 1) {
      this.searching = true;
      try {
        const workspaces = await workspaceService.getWorkspaces();
        if (workspaces.length > 0) {
          const res = await searchService.search(workspaces[0].id, this.queryText);
          this.results = res.results || [];
        }
      } finally {
        this.searching = false;
      }
    } else {
      this.results = [];
    }
  }

  private navigateTo(path: string) {
    // Vaadin router navigation
    window.history.pushState(null, '', path);
    window.dispatchEvent(new CustomEvent('vaadin-router-location-changed', {
      detail: { location: { pathname: path } }
    }));
    this.close();
  }

  render() {
    const filteredNav = this.navigationItems.filter(item => 
      this.t(item.label).toLowerCase().includes(this.queryText.toLowerCase())
    );

    return html`
      <div class="overlay" @click=${(e: MouseEvent) => e.target === e.currentTarget && this.close()}>
        <div class="palette">
          <div class="search-input-wrapper">
            <span>🔍</span>
            <input 
              type="text" 
              placeholder="${this.t('search.placeholder')}" 
              .value=${this.queryText}
              @input=${this.handleInput}
            />
            ${this.searching ? html`<span>⏳</span>` : ''}
          </div>

          <div class="results-area">
            ${filteredNav.length > 0 ? html`
              <div class="section-label">${this.t('nav.home')} & Navigation</div>
              ${filteredNav.map(item => html`
                <div class="palette-item" @click=${() => this.navigateTo(item.path)}>
                  <div class="item-icon">${item.icon}</div>
                  <div class="item-label">${this.t(item.label)}</div>
                  <div class="item-shortcut">Enter</div>
                </div>
              `)}
            ` : ''}

            ${this.results.length > 0 ? html`
              <div class="section-label">${this.t('search.recent')}</div>
              ${this.results.map(res => html`
                <div class="palette-item" @click=${() => this.navigateTo(`/registry?id=${res.id}`)}>
                  <div class="item-icon">📄</div>
                  <div class="item-label">${res.title}</div>
                  <div class="item-shortcut">${res.doc_type}</div>
                </div>
              `)}
            ` : ''}

            ${filteredNav.length === 0 && this.results.length === 0 && this.queryText ? html`
              <div class="no-results">${this.t('search.noResults', { query: this.queryText })}</div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }
}
