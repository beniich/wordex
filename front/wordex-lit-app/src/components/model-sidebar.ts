// front/wordex-lit-app/src/components/model-sidebar.ts
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('model-sidebar')
export class ModelSidebar extends LitElement {
  @state() private models: string[] = [];
  @state() private selectedModel: string = '';

  static styles = css`
    :host {
      display: block;
      width: 260px;
      padding: 20px;
      color: white;
      background: linear-gradient(90deg, #a67b5b 0%, #c9a56b 100%);
      height: 100vh;
      box-sizing: border-box;
    }
    h3 {
      margin-top: 0;
      font-size: 1.2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      padding-bottom: 10px;
    }
    ul {
      list-style: none;
      padding: 0;
      margin-top: 12px;
    }
    li {
      padding: 8px 12px;
      margin-bottom: 4px;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s;
      font-size: 0.9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    li:hover,
    li.active {
      background: rgba(255, 255, 255, 0.2);
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    if (window.electronAPI) {
      try {
        this.models = await window.electronAPI.listModels();
      } catch (e) {
        console.error("Failed to list models:", e);
      }
    } else {
      console.warn("electronAPI not available. Running in browser mode?");
      // Mock models for development
      this.models = ["llama-3-8b.ggml.bin", "mistral-7b.ggml.bin"];
    }
  }

  private selectModel(name: string) {
    this.selectedModel = name;
    this.dispatchEvent(new CustomEvent('model-selected', {
      detail: { model: name },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return html`
      <h3>Modèles locaux</h3>
      <ul>
        ${this.models.map((m) => html`
          <li
            class="${this.selectedModel === m ? 'active' : ''}"
            @click=${() => this.selectModel(m)}
            title="${m}"
          >
            ${m.replace(".ggml.bin", "")}
          </li>
        `)}
      </ul>
    `;
  }
}
