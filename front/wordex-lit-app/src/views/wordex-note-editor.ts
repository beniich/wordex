import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { TranslationMixin } from '../services/translation-service';
import { markdownService } from '../services/markdown-service';
import { apiFetch } from '../services/api-client';
import { workspaceService } from '../services/workspace-service';

@customElement('wordex-note-editor')
export class WordexNoteEditor extends TranslationMixin(LitElement) {
  @state() private docId: string | null = null;
  @state() private title = "Untitled Note";
  @state() private content = "";
  @state() private backlinks: any[] = [];
  @state() private saving = false;
  @state() private showPreview = true;
  @query('textarea') private textareaEl!: HTMLTextAreaElement;

  static styles = css`
    :host {
      display: flex;
      height: calc(100vh - 84px - 3rem);
      gap: 2rem;
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .editor-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      border: 1px solid rgba(133, 116, 103, 0.15);
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
    }

    header {
      padding: 1.5rem 2rem;
      border-bottom: 1px solid rgba(133, 116, 103, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .title-input {
      font-size: 1.75rem;
      font-weight: 800;
      border: none;
      background: transparent;
      outline: none;
      color: #1c1c1a;
      width: 100%;
      letter-spacing: -0.5px;
    }

    .main-workspace {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .edit-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 2rem;
    }

    textarea {
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 1.1rem;
      line-height: 1.6;
      color: #524439;
      resize: none;
    }

    .preview-area {
      flex: 1;
      padding: 2rem 3rem;
      overflow-y: auto;
      border-left: 1px solid rgba(133, 116, 103, 0.1);
      background: rgba(255,255,255,0.3);
    }

    .preview-content {
      font-size: 1.1rem;
      line-height: 1.7;
      color: #1c1c1a;
    }

    /* Markdown Styling */
    .preview-content h1 { font-size: 2rem; margin-top: 0; }
    .preview-content h2 { font-size: 1.5rem; margin-top: 1.5rem; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 0.5rem; }
    .preview-content p { margin: 1rem 0; }
    .preview-content code { background: rgba(0,0,0,0.05); padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.9em; }
    
    .wikilink {
      color: #894d0d;
      text-decoration: none;
      border-bottom: 1px dashed rgba(137, 77, 13, 0.4);
      font-weight: 700;
      transition: background 0.2s;
    }
    .wikilink:hover { background: rgba(137, 77, 13, 0.1); }

    .backlinks-panel {
      width: 280px;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .panel-section {
      background: white;
      border-radius: 20px;
      padding: 1.5rem;
      border: 1px solid rgba(133, 116, 103, 0.1);
    }

    .section-title {
      font-size: 0.75rem;
      font-weight: 900;
      text-transform: uppercase;
      color: #894d0d;
      letter-spacing: 0.1em;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .backlink-item {
      padding: 0.75rem;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid transparent;
      margin-bottom: 0.5rem;
    }
    .backlink-item:hover {
      background: rgba(137, 77, 13, 0.05);
      border-color: rgba(137, 77, 13, 0.1);
    }
    .backlink-title { font-weight: 700; font-size: 0.9rem; margin-bottom: 0.2rem; }
    .backlink-meta { font-size: 0.7rem; color: #857467; }

    .btn-save {
      background: #1c1c1a;
      color: white;
      border: none;
      padding: 0.5rem 1.25rem;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .btn-save:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
  `;

  async connectedCallback() {
    super.connectedCallback();
    const params = new URLSearchParams(window.location.search);
    this.docId = params.get('id');
    if (this.docId) {
      await this.loadDocument();
      await this.loadBacklinks();
    }
  }

  async loadDocument() {
    try {
      const res = await apiFetch(`/documents/${this.docId}`);
      const data = await res.json();
      this.title = data.title;
      this.content = data.content_text || "";
    } catch (e) {
      console.error("Failed to load document", e);
    }
  }

  async loadBacklinks() {
    try {
      const res = await apiFetch(`/documents/${this.docId}/backlinks`);
      this.backlinks = await res.json();
    } catch (e) {
      console.error("Failed to load backlinks", e);
    }
  }

  async handleSave() {
    this.saving = true;
    try {
      await apiFetch(`/documents/${this.docId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: this.title,
          content_text: this.content
        })
      });
      // Refresh backlinks after saving because links might have changed
      await this.loadBacklinks();
    } catch (e) {
      console.error("Save failed", e);
    } finally {
      this.saving = false;
    }
  }

  private handleInput(e: InputEvent) {
    this.content = (e.target as HTMLTextAreaElement).value;
  }

  private openBacklink(id: string) {
    window.location.href = `/registry?id=${id}`;
  }

  render() {
    return html`
      <div class="editor-container">
        <header>
          <input 
            class="title-input" 
            .value=${this.title} 
            @input=${(e: any) => this.title = e.target.value}
            placeholder="Note Title"
          />
          <div style="display: flex; gap: 1rem;">
             <button class="btn-save" @click=${this.handleSave} ?disabled=${this.saving}>
               ${this.saving ? '...' : html`<span>💾</span> ${this.t('common.save')}`}
             </button>
          </div>
        </header>

        <div class="main-workspace">
          <div class="edit-area">
            <textarea 
              .value=${this.content} 
              @input=${this.handleInput}
              placeholder="Start writing in Markdown (use [[WikiLinks]] to connect notes)..."
            ></textarea>
          </div>

          ${this.showPreview ? html`
            <div class="preview-area">
              <div class="preview-content">
                ${html`${markdownService.render(this.content)}`}
              </div>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="backlinks-panel">
        <div class="panel-section">
          <div class="section-title">
            <span>🔗</span> Backlinks
          </div>
          ${this.backlinks.length > 0 ? this.backlinks.map(link => html`
            <div class="backlink-item" @click=${() => this.openBacklink(link.id)}>
              <div class="backlink-title">${link.title}</div>
              <div class="backlink-meta">${new Date(link.updated_at).toLocaleDateString()}</div>
            </div>
          `) : html`<div style="font-size: 0.8rem; color: #857467; font-style: italic;">No notes link to this one yet.</div>`}
        </div>

        <div class="panel-section">
          <div class="section-title">
            <span>📅</span> Activity
          </div>
          <div style="font-size: 0.8rem; color: #857467;">
            Last modified: ${new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    `;
  }
}
