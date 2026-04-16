import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { slidesService, Presentation } from '../services/slides-service';

@customElement('wordex-slides-view')
export class WordexSlidesView extends LitElement {
  static styles = css`
    :host { display: block; color: #1c1c1a; animation: fadeIn 0.5s; padding-bottom: 4rem; }
    .header { margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-end; }
    h1 { font-size: 2.5rem; margin: 0; font-weight: 800; letter-spacing: -1px; }
    
    .container { display: flex; gap: 2rem; }
    
    .generator-panel {
      flex: 1; min-width: 320px;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(133, 116, 103, 0.15);
      border-radius: 24px;
      padding: 2rem;
      box-shadow: 0 10px 40px rgba(137, 77, 13, 0.05);
      height: fit-content;
      position: sticky; top: 100px;
    }
    
    .preview-panel {
      flex: 2;
      background: #f6f3ef;
      border: 1px solid rgba(133, 116, 103, 0.2);
      border-radius: 24px;
      padding: 2rem;
      display: flex; flex-direction: column; gap: 2rem;
    }
    
    .input-group { margin-bottom: 1.5rem; }
    label { display: block; font-weight: 800; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: #894d0d; margin-bottom: 0.5rem; }
    input, textarea {
      width: 100%; padding: 14px; border-radius: 12px; border: 1px solid rgba(133, 116, 103, 0.2);
      background: #fff; font-family: inherit; font-size: 1rem; color: #1c1c1a; outline: none; transition: border 0.2s;
    }
    input:focus, textarea:focus { border-color: #894d0d; }
    textarea { resize: vertical; min-height: 120px; }
    
    .btn {
      width: 100%; padding: 16px; border: none; border-radius: 16px; font-weight: 800; cursor: pointer; transition: all 0.2s; font-family: inherit;
    }
    .btn-primary { background: #894d0d; color: white; }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); background: #a76526; box-shadow: 0 10px 20px rgba(137, 77, 13, 0.2); }
    .btn-secondary { background: rgba(133, 116, 103, 0.1); color: #894d0d; margin-top: 1rem; }
    .btn:disabled { background: #d8c3b4; cursor: not-allowed; opacity: 0.7; }

    .slide {
      background: white; border-radius: 12px; aspect-ratio: 16/9; padding: 3rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05); display: flex; flex-direction: column;
      position: relative; overflow: hidden;
    }
    .slide::before {
      content: ''; position: absolute; top: 0; left: 0; width: 6px; height: 100%; background: #894d0d;
    }
    
    .slide-title { font-size: 2.2rem; font-weight: 800; color: #1c1c1a; margin-bottom: 1.5rem; letter-spacing: -0.5px; }
    .slide-content { font-size: 1.2rem; color: #524439; line-height: 1.6; flex: 1; }
    .slide-footer { font-size: 0.8rem; color: #a3958a; font-weight: 700; display: flex; justify-content: space-between; border-top: 1px solid #f6f3ef; padding-top: 1rem; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    
    .loading-overlay { text-align: center; padding: 4rem; color: #857467; }
    .spinner { width: 32px; height: 32px; border: 3px solid rgba(137, 77, 13, 0.1); border-top-color: #894d0d; border-radius: 50%; display: inline-block; animation: spin 1s linear infinite; margin-bottom: 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;

  @state() private topic = "";
  @state() private nSlides = 6;
  @state() private isGenerating = false;
  @state() private presentation: Presentation | null = null;
  @state() private docId: string | null = null;

  async connectedCallback() {
    super.connectedCallback();
    const params = new URLSearchParams(window.location.search);
    this.docId = params.get('id');
    if (this.docId && this.docId !== 'new-presentation') {
      await this.fetchPresentation();
    }
  }

  async fetchPresentation() {
    if (!this.docId) return;
    this.isGenerating = true;
    try {
      this.presentation = await slidesService.getPresentation(this.docId);
    } catch (e) {
      console.error("Failed to fetch presentation", e);
    } finally {
      this.isGenerating = false;
    }
  }

  async generate() {
    if (!this.topic.trim()) return;
    this.isGenerating = true;
    try {
      // For demo, we use a fixed ID if not provided
      const targetId = this.docId || "demo-presentation"; 
      const data = await slidesService.generateFromAI(targetId, this.topic, this.nSlides);
      this.presentation = data.presentation;
      this.docId = targetId;
    } catch(e) {
      alert("Erreur lors de la génération des slides.");
    } finally {
      this.isGenerating = false;
    }
  }

  async exportPPTX() {
    if (!this.docId || !this.presentation) return;
    try {
      await slidesService.exportPPTX(this.docId, this.presentation.title);
    } catch (e) {
      alert("Erreur lors de l'export PPTX.");
    }
  }

  render() {
    return html`
      <div class="header">
        <div>
          <p style="margin: 0; color: #894d0d; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.75rem;">Canvas Studio</p>
          <h1>Design de Présentation</h1>
        </div>
        ${this.presentation ? html`
          <button class="btn btn-primary" style="width: auto; padding: 10px 20px;" @click=${this.exportPPTX}>
             📥 Exporter en .PPTX
          </button>
        ` : ''}
      </div>

      <div class="container">
        <div class="generator-panel">
          <div class="input-group">
            <label>Objectif de la Présentation</label>
            <textarea 
              placeholder="Décrivez le but de vos slides... ex: Pitch pour un nouvel investisseur, Revue trimestrielle de production..." 
              .value=${this.topic}
              @input=${(e:any) => this.topic = e.target.value}
            ></textarea>
          </div>
          
          <div class="input-group">
            <label>Nombre de Slides : ${this.nSlides}</label>
            <input 
              type="range" min="3" max="15" 
              .value=${this.nSlides}
              @input=${(e:any) => this.nSlides = parseInt(e.target.value)}
            />
          </div>

          <button class="btn btn-primary" @click=${this.generate} ?disabled=${this.isGenerating || !this.topic.trim()}>
            ${this.isGenerating ? html`<span class="spinner" style="width:16px; height:16px; border-width:2px; margin:0 8px 0 0; vertical-align:middle;"></span> Analyse...` : '✨ Générer avec Wordex AI'}
          </button>
          
          <p style="font-size: 0.75rem; color: #857467; margin-top: 1.5rem; line-height: 1.4;">
            L'intelligence artificielle va structurer vos arguments, rédiger le contenu et suggérer une mise en page optimisée.
          </p>
        </div>

        <div class="preview-panel">
          ${this.isGenerating && !this.presentation ? html`
            <div class="loading-overlay">
              <div class="spinner"></div>
              <p>L'IA Designer orchestre vos données industrielles en slides percutantes...</p>
            </div>
          ` : !this.presentation ? html`
            <div style="text-align:center; padding: 6rem 2rem; color: #a3958a;">
              <div style="font-size: 4rem; margin-bottom: 1.5rem;">📽️</div>
              <h3 style="margin: 0; color: #524439;">Plan de travail vide</h3>
              <p>Utilisez le générateur d'IA pour créer votre première présentation.</p>
            </div>
          ` : html`
            <div style="margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 2px solid rgba(133, 116, 103, 0.1);">
              <h2 style="margin: 0; color: #1c1c1a; font-weight: 900; font-size: 2rem;">${this.presentation.title}</h2>
              <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                <span class="badge" style="background: #f1ede8; color: #894d0d; padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 800;">THÈME : ${this.presentation.theme}</span>
                <span class="badge" style="background: #f1ede8; color: #857467; padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 800;">${this.presentation.slides.length} SLIDES</span>
              </div>
            </div>

            ${this.presentation.slides.map((slide, i) => html`
              <div class="slide" style="animation: fadeIn 0.4s ease-out backwards; animation-delay: ${i * 0.1}s">
                <div class="slide-title">${slide.title}</div>
                <div class="slide-content">${slide.content}</div>
                <div class="slide-footer">
                  <span>Wordex Collective Intelligence</span>
                  <span>PAGE ${i + 1}</span>
                </div>
              </div>
            `)}
          `}
        </div>
      </div>
    `;
  }
}
