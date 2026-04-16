import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { searchService } from '../services/search-service';
import type { SearchResult } from '../services/search-service';
import { workspaceService } from '../services/workspace-service';

@customElement('wordex-search-view')
export class WordexSearchView extends LitElement {
  static styles = css`
    :host { display: block; animation: fadeIn 0.5s; padding-bottom: 4rem; color: #1c1c1a; }
    .header { margin-bottom: 2rem; }
    h1 { font-size: 2.5rem; font-weight: 900; margin-bottom: 0.5rem; }
    
    .search-container {
      max-width: 800px;
      margin: 0 auto;
    }

    .search-bar {
      display: flex;
      gap: 1rem;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(20px);
      border: 2px solid rgba(133, 116, 103, 0.15);
      border-radius: 20px;
      padding: 0.5rem 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
      transition: border-color 0.3s;
    }
    .search-bar:focus-within {
      border-color: #894d0d;
    }
    
    .search-bar input {
      flex: 1;
      border: none;
      background: transparent;
      padding: 1rem 0;
      font-size: 1.2rem;
      font-family: inherit;
      outline: none;
      color: #1c1c1a;
    }

    .results-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .result-item {
      background: white;
      border: 1px solid rgba(133, 116, 103, 0.1);
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      gap: 1.5rem;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s;
    }
    .result-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
      border-color: #894d0d;
    }

    .result-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #f1ede8;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .result-icon svg { width: 24px; height: 24px; color: #894d0d; }

    .result-info { flex: 1; min-width: 0; }
    .result-meta { display: flex; gap: 1rem; margin-bottom: 0.5rem; align-items: center; }
    .result-type { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #894d0d; background: rgba(137, 77, 13, 0.1); padding: 2px 8px; border-radius: 4px; }
    .result-date { font-size: 0.75rem; color: #857467; }
    
    .result-title { font-size: 1.2rem; font-weight: 800; color: #1c1c1a; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .result-excerpt { font-size: 0.9rem; color: #524439; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

    .empty-state { text-align: center; padding: 4rem 2rem; color: #857467; }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `;

  @state() private query = "";
  @state() private results: SearchResult[] = [];
  @state() private searching = false;
  @state() private recentDocs: any[] = [];
  @state() private workspaceId = "";

  async connectedCallback() {
    super.connectedCallback();
    const workspaces = await workspaceService.getWorkspaces();
    if (workspaces.length > 0) {
      this.workspaceId = workspaces[0].id;
      await this.fetchRecent();
    }
  }

  async fetchRecent() {
    try {
      this.recentDocs = await searchService.getRecent(this.workspaceId);
    } catch (e) {
      this.recentDocs = [];
    }
  }

  async handleSearch(e: InputEvent) {
    this.query = (e.target as HTMLInputElement).value;
    if (this.query.length < 2) {
      this.results = [];
      return;
    }

    this.searching = true;
    try {
      const data = await searchService.search(this.workspaceId, this.query);
      this.results = data.results || [];
    } catch (e) {
      this.results = [];
    } finally {
      this.searching = false;
    }
  }

  render() {
    return html`
      <div class="header">
        <h1>Omni Search</h1>
        <p style="color: #857467;">Recherchez instantanément dans tous vos documents, dossiers et fichiers.</p>
      </div>

      <div class="search-container">
        <div class="search-bar">
          <svg style="width: 24px; height: 24px; color: #857467; align-self: center;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            type="text" 
            placeholder="Rechercher un rapport, un budget, une slide..." 
            .value=${this.query}
            @input=${this.handleSearch}
            autofocus
          />
          ${this.searching ? html`<div style="align-self:center; width: 16px; height: 16px; border: 2px solid #894d0d; border-top-color: transparent; border-radius: 50%; animate: spin 1s linear infinite;"></div>` : ''}
        </div>

        ${this.query.length < 2 ? html`
          <div class="section-title" style="margin-bottom: 1.5rem; font-weight: 800; color: #857467; font-size: 0.9rem; text-transform: uppercase;">Documents Récents</div>
          <div class="results-list">
            ${this.recentDocs.length === 0 ? html`<div class="empty-state">Aucun document récent.</div>` : this.recentDocs.map(doc => this.renderResultItem({
              id: doc.id,
              title: doc.title,
              doc_type: doc.doc_type,
              updated_at: doc.updated_at,
              created_by: 'system',
              result_type: 'document',
              rank: 1
            }))}
          </div>
        ` : html`
          <div class="results-list">
            ${this.results.length === 0 ? html`
              <div class="empty-state">
                ${this.searching ? 'Recherche en cours...' : 'Aucun résultat trouvé pour "' + this.query + '"'}
              </div>
            ` : this.results.map(res => this.renderResultItem(res))}
          </div>
        `}
      </div>
    `;
  }

  private renderResultItem(res: SearchResult) {
    const icon = this.getIconForType(res.doc_type);
    const url = this.getUrlForResult(res);

    return html`
      <a href="${url}" class="result-item" style="animation: fadeIn 0.3s ease-out backwards;">
        <div class="result-icon">${icon}</div>
        <div class="result-info">
          <div class="result-meta">
            <span class="result-type">${res.doc_type}</span>
            <span class="result-date">${new Date(res.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <div class="result-title">${res.title}</div>
          ${res.excerpt ? html`<div class="result-excerpt">${res.excerpt}</div>` : ''}
        </div>
      </a>
    `;
  }

  private getIconForType(type: string) {
    if (type === 'note' || type === 'document') return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;
    if (type === 'spreadsheet' || type === 'sheet') return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>`;
    if (type === 'presentation' || type === 'slides') return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="20" x2="22" y2="20"></line><patch d="M10 8l4 3-4 3V8z"></patch></svg>`;
    return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>`;
  }

  private getUrlForResult(res: SearchResult) {
    if (res.doc_type === 'note') return `/registry?doc=${res.id}`;
    if (res.doc_type === 'spreadsheet') return `/sheets?id=${res.id}`;
    if (res.doc_type === 'presentation') return `/slides?id=${res.id}`;
    return `/registry`;
  }
}
