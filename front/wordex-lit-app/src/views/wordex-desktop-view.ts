// front/wordex-lit-app/src/views/wordex-desktop-view.ts
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '../components/model-sidebar';
import '../components/llmstudio-chat';

@customElement('wordex-desktop-view')
export class WordexDesktopView extends LitElement {
  @state() private selectedModel: string = '';

  static styles = css`
    :host {
      display: block;
      height: 100vh;
      overflow: hidden;
    }
    .desktop-app {
      display: flex;
      height: 100%;
      background: linear-gradient(135deg, #f5f1e6, #e8e2d0);
    }
    .chat-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .placeholder {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      text-align: center;
      color: #524439;
    }
    .placeholder h2 {
      font-size: 2rem;
      margin-bottom: 1rem;
      font-weight: 800;
    }
    .placeholder p {
      max-width: 600px;
      line-height: 1.6;
    }
    .placeholder code {
      background: #fff3e0;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
    }
  `;

  private handleModelSelected(e: CustomEvent) {
    this.selectedModel = e.detail.model;
  }

  render() {
    return html`
      <div class="desktop-app">
        <model-sidebar @model-selected=${this.handleModelSelected}></model-sidebar>
        <main class="chat-section">
          ${this.selectedModel ? html`
            <llmstudio-chat .selectedModel=${this.selectedModel}></llmstudio-chat>
          ` : html`
            <div class="placeholder">
              <h2>Bienvenue dans Wordex Desktop</h2>
              <p>
                Selectionnez un modèle local dans la barre latérale pour commencer à discuter.
                <br><br>
                Les modèles doivent être placés dans le dossier
                <code>external/models</code> au format <code>.ggml.bin</code>.
              </p>
            </div>
          `}
        </main>
      </div>
    `;
  }
}
