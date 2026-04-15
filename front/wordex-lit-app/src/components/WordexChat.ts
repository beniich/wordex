import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('wordex-chat')
export class WordexChat extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 400px;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(124, 58, 237, 0.3);
      border-radius: 16px;
      overflow: hidden;
    }
    .messages {
      flex: 1;
      padding: 1rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .message {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 0.9rem;
      line-height: 1.4;
    }
    .user {
      align-self: flex-end;
      background: var(--wordex-violet, #7c3aed);
      color: white;
    }
    .agent {
      align-self: flex-start;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .input-area {
      padding: 1rem;
      background: rgba(255, 255, 255, 0.02);
      display: flex;
      gap: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    input {
      flex: 1;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 10px;
      border-radius: 8px;
      color: white;
      outline: none;
    }
    input:focus {
      border-color: #06b6d4;
    }
    button {
      background: #06b6d4;
      border: none;
      color: white;
      padding: 0 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
    }
  `;

  @property({ type: String }) agentId = '';
  @state() private messages: { role: 'user' | 'agent', text: string }[] = [];
  @state() private currentInput = '';

  private async sendMessage() {
    if (!this.currentInput.trim()) return;
    
    const text = this.currentInput;
    this.messages = [...this.messages, { role: 'user', text }];
    this.currentInput = '';

    // Logic for API call would go here
    this.dispatchEvent(new CustomEvent('message-sent', { detail: { text, agentId: this.agentId } }));
  }

  addMessage(role: 'user' | 'agent', text: string) {
    this.messages = [...this.messages, { role, text }];
  }

  appendMessage(text: string) {
    const last = this.messages[this.messages.length - 1];
    if (last && last.role === 'agent') {
      last.text += text;
      this.messages = [...this.messages];
    } else {
      this.addMessage('agent', text);
    }
  }

  render() {
    return html`
      <div class="messages">
        ${this.messages.map(m => html`
          <div class="message ${m.role}">${m.text}</div>
        `)}
      </div>
      <div class="input-area">
        <input 
          type="text" 
          .value=${this.currentInput} 
          placeholder="Envoyez une mission..." 
          @input=${(e: any) => this.currentInput = e.target.value}
          @keypress=${(e: any) => e.key === 'Enter' && this.sendMessage()}
        >
        <button @click=${this.sendMessage}>Envoyer</button>
      </div>
    `;
  }
}
