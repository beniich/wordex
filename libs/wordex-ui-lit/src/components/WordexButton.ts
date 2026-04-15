import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { theme } from '../styles/theme';

@customElement('wordex-button')
export class WordexButton extends LitElement {
  static styles = [
    theme,
    css`
      :host {
        display: inline-block;
      }
      button {
        background: linear-gradient(135deg, var(--wordex-violet), var(--wordex-cyan));
        color: var(--wordex-text);
        border: 1px solid var(--wordex-border);
        padding: 10px 20px;
        border-radius: var(--wordex-radius);
        font-family: inherit;
        font-weight: 600;
        cursor: pointer;
        transition: var(--wordex-transition);
        backdrop-filter: blur(5px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      }
      button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(124, 58, 237, 0.4);
        border-color: var(--wordex-cyan);
      }
      button:active {
        transform: translateY(0);
      }
      .secondary {
        background: var(--wordex-glass);
        border: 1px solid var(--wordex-border);
      }
      .secondary:hover {
        background: rgba(255, 255, 255, 0.2);
        box-shadow: 0 8px 25px rgba(255, 255, 255, 0.1);
      }
    `,
  ];

  @property({ type: String }) variant: 'primary' | 'secondary' = 'primary';

  render() {
    return html`
      <button class="${this.variant}">
        <slot></slot>
      </button>
    `;
  }
}
