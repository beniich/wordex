import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { apiFetch } from '../services/api-client';
import { workspaceService } from '../services/workspace-service';

interface RegistryItem {
  id: string;
  name?: string;
  title?: string;
  type: 'folder' | 'document';
  updated_at: string;
  doc_type?: string;
}

@customElement('wordex-registry-view')
export class WordexRegistryView extends LitElement {
  @state() private items: RegistryItem[] = [];
  @state() private viewTitle = "";

  async connectedCallback() {
    super.connectedCallback();
    this.viewTitle = window.location.pathname.includes('documents') ? 'Registry' : 'Vault';
    await this.fetchData();
  }

  async fetchData() {
    try {
      const workspaces = await workspaceService.getWorkspaces();
      if (workspaces.length === 0) return;
      
      const wsId = workspaces[0].id;
      
      // Fetch both folders and documents for a unified view
      const [foldersRes, docsRes] = await Promise.all([
        apiFetch(`/folders/tree?workspace_id=${wsId}`),
        apiFetch(`/documents?workspace_id=${wsId}`)
      ]);
      
      const folders = await foldersRes.json();
      const documents = await docsRes.json();
      
      this.items = [
        ...(folders.folders || []).map((f: any) => ({ ...f, type: 'folder' })),
        ...(documents || []).map((d: any) => ({ ...d, type: 'document', name: d.title }))
      ];
      
    } catch (e) {
      console.warn("Registry sync unavailable:", e);
      this.items = [];
    }
  }

  static styles = css`
    :host { display: block; animation: fadeIn 0.5s; color: #1c1c1a; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    header { margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-end; }
    h1 { font-size: 2.5rem; margin: 0; font-weight: 800; letter-spacing: -1px; }
    
    .actions { display: flex; gap: 1rem; }
    .btn {
      padding: 10px 20px; border-radius: 12px; border: 1px solid rgba(133, 116, 103, 0.2);
      background: white; color: #1c1c1a; font-weight: 700; cursor: pointer; transition: all 0.2s;
      font-family: inherit; font-size: 0.9rem;
    }
    .btn:hover { background: #f6f3ef; transform: translateY(-2px); }
    .btn-primary { background: #894d0d; color: white; border: none; }
    .btn-primary:hover { background: #a76526; }

    .registry-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem;
    }

    .item-card {
      background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px);
      border: 1px solid rgba(133, 116, 103, 0.15); border-radius: 20px;
      padding: 1.5rem; transition: all 0.2s; cursor: pointer;
      display: flex; flex-direction: column; align-items: center; text-align: center;
    }
    .item-card:hover { transform: translateY(-4px); box-shadow: 0 10px 30px rgba(137, 77, 13, 0.08); border-color: #894d0d; }

    .icon-wrapper {
      width: 60px; height: 60px; border-radius: 16px; margin-bottom: 1rem;
      display: flex; align-items: center; justify-content: center; font-size: 1.8rem;
    }
    .folder-icon { background: rgba(137, 77, 13, 0.1); color: #894d0d; }
    .doc-icon { background: rgba(0, 101, 118, 0.1); color: #006576; }

    .name { font-weight: 800; font-size: 0.95rem; margin-bottom: 0.25rem; word-break: break-all; }
    .meta { font-size: 0.7rem; color: #857467; text-transform: uppercase; font-weight: 700; }
  `;

  render() {
    const displayItems = this.items.length > 0 ? this.items : [
      { id: '1', name: 'Projets Stratégiques', type: 'folder', updated_at: new Date().toISOString() },
      { id: '2', name: 'Architecture_Systeme_v4.pdf', type: 'document', doc_type: 'PDF', updated_at: new Date().toISOString() },
      { id: '3', name: 'Analyses_Industrielles', type: 'folder', updated_at: new Date().toISOString() },
      { id: '4', name: 'Notes_AI_Core.md', type: 'document', doc_type: 'Markdown', updated_at: new Date().toISOString() },
      { id: '5', name: 'Contrats_Fournisseurs', type: 'folder', updated_at: new Date().toISOString() },
      { id: '6', name: 'Logo_Aether_Vector.svg', type: 'document', doc_type: 'Image', updated_at: new Date().toISOString() },
    ];

    return html`
      <header>
        <div>
          <p style="margin: 0; color: #894d0d; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.75rem;">Digital Vault</p>
          <h1>${this.viewTitle}</h1>
        </div>
        <div class="actions">
          <button class="btn">+ New Folder</button>
          <button class="btn btn-primary">+ Upload Document</button>
        </div>
      </header>

      <div class="registry-grid">
        ${displayItems.map(item => html`
          <div class="item-card">
            <div class="icon-wrapper ${item.type === 'folder' ? 'folder-icon' : 'doc-icon'}">
              ${item.type === 'folder' ? '📁' : '📄'}
            </div>
            <div class="name">${item.name}</div>
            <div class="meta">${item.type === 'folder' ? 'Directory' : (item as any).doc_type || 'Document'}</div>
            <div class="meta" style="margin-top: 0.5rem; opacity: 0.6;">
              ${new Date(item.updated_at).toLocaleDateString()}
            </div>
          </div>
        `)}
      </div>
    `;
  }
}
