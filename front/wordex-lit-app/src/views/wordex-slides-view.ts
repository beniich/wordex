import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { apiFetch } from '../services/api-client';

@customElement('wordex-slides-view')
export class WordexSlidesView extends LitElement {
  static styles = css`
    :host {
      display: block;
      color: #1c1c1a;
      animation: fadeIn 0.5s;
    }
    .header {
      margin-bottom: 2rem;
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      font-weight: 800;
      letter-spacing: -1px;
    }
    .container {
      display: flex; gap: 2rem;
    }
    .generator-panel {
      flex: 1;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(133, 116, 103, 0.15);
      border-radius: 24px;
      padding: 2rem;
      box-shadow: 0 10px 40px rgba(137, 77, 13, 0.05);
    }
    .preview-panel {
      flex: 2;
      background: #f6f3ef;
      border: 1px solid rgba(133, 116, 103, 0.2);
      border-radius: 24px;
      padding: 2rem;
      display: flex; flex-direction: column; gap: 1.5rem;
      max-height: 70vh; overflow-y: auto;
    }
    .preview-panel::-webkit-scrollbar { width: 6px; }
    .preview-panel::-webkit-scrollbar-thumb { background: rgba(133, 116, 103, 0.3); border-radius: 4px; }
    
    .input-group { margin-bottom: 1.5rem; }
    label { display: block; font-weight: 800; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; color: #894d0d; margin-bottom: 0.5rem; }
    input, textarea {
      width: 100%; padding: 14px; border-radius: 12px; border: 1px solid rgba(133, 116, 103, 0.2);
      background: #fff; font-family: inherit; font-size: 1rem; color: #1c1c1a; outline: none; transition: border 0.2s;
    }
    input:focus, textarea:focus { border-color: #894d0d; }
    textarea { resize: vertical; min-height: 100px; }
    
    button {
      width: 100%; padding: 16px; background: #894d0d; border: none; border-radius: 16px; color: white;
      font-weight: 800; cursor: pointer; transition: transform 0.2s, background 0.2s; font-family: inherit;
    }
    button:hover:not(:disabled) { transform: translateY(-2px); background: #a76526; box-shadow: 0 10px 20px rgba(137, 77, 13, 0.2); }
    button:disabled { background: #d8c3b4; cursor: not-allowed; }

    .slide {
      background: white;
      border-radius: 12px;
      aspect-ratio: 16/9;
      padding: 2rem;
      box-shadow: 0 5px 15px rgba(0,0,0,0.05);
      display: flex; flex-direction: column;
      animation: slideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) backwards;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: scale(0.95) translateY(20px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; } to { opacity: 1; }
    }

    .slide-title { font-size: 1.8rem; font-weight: 800; color: #894d0d; margin-bottom: 1rem; border-bottom: 2px solid #f6f3ef; padding-bottom: 0.5rem; }
    .slide-content { font-size: 1.1rem; color: #524439; line-height: 1.6; flex: 1; }
    .slide-footer { font-size: 0.75rem; color: #a3958a; text-align: right; }
  `;

  @state() private topic = "";
  @state() private nSlides = 5;
  @state() private isGenerating = false;
  @state() private generatedSlides: any[] = [];
  @state() private presentationTitle = ""; // changed from 'title' to override conflict with LitElement's title

  async generate() {
    if (!this.topic.trim()) return;
    this.isGenerating = true;
    this.generatedSlides = [];
    
    try {
      const testId = "demo-presentation"; 
      const url = "/slides/" + testId + "/generate-from-ai";
      const res = await apiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: this.topic, n_slides: this.nSlides })
      });
      
      const data = await res.json();
      this.generatedSlides = data.presentation.slides;
      this.presentationTitle = data.presentation.title;
      
    } catch(e) {
      console.warn("Slides orchestration unavailable:", e);
      this.generatedSlides = [];
      this.presentationTitle = "AI Analysis Error";
    } finally {
      this.isGenerating = false;
    }
  }

  render() {
    return html`
      <div class="header">
        <h1>Canvas Studio</h1>
        <p style="color: var(--on-surface-variant); font-weight: 600;">Générez des présentations complètes pilotées par l'Intelligence Artificielle.</p>
      </div>

      <div class="container">
        <div class="generator-panel">
          <div class="input-group">
            <label>Sujet de la présentation</label>
            <textarea 
              placeholder="Ex: Analyse de la rentabilité des lignes d'assemblage automatisées..." 
              .value=${this.topic}
              @input=${(e:any) => this.topic = e.target.value}
            ></textarea>
          </div>
          
          <div class="input-group">
            <label>Nombre de Slides (${this.nSlides})</label>
            <input 
              type="range" min="3" max="15" 
              .value=${this.nSlides}
              @input=${(e:any) => this.nSlides = parseInt(e.target.value)}
            />
          </div>

          <button @click=${this.generate} ?disabled=${this.isGenerating || !this.topic.trim()}>
            ${this.isGenerating ? 'Création en cours par le Designer...' : '✨ Générer la Présentation'}
          </button>
        </div>

        <div class="preview-panel">
          ${this.generatedSlides.length === 0 ? html`
            <div style="text-align:center; padding: 4rem; color: #a3958a;">
              <span style="font-size: 4rem; display: block; margin-bottom: 1rem; opacity: 0.5;">🎭</span>
              Aucune présentation générée.<br/>Utilisez le panneau de gauche pour commencer.
            </div>
          ` : html`
            <h2 style="margin: 0; color: #1c1c1a; font-weight: 800;">${this.presentationTitle}</h2>
            ${this.generatedSlides.map((slide, i) => html`
              <div class="slide" style="animation-delay: ${i * 0.1}s">
                <div class="slide-title">${slide.title}</div>
                <div class="slide-content">${slide.content}</div>
                <div class="slide-footer">${i + 1} / ${this.generatedSlides.length}</div>
              </div>
            `)}
          `}
        </div>
      </div>
    `;
  }
}
