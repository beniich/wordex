// front/wordex-lit-app/src/components/llmstudio-chat.ts
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LLMStudioService } from '../services/llmstudio-service';

interface ChatMessage {
  role: 'assistant' | 'user' | 'system';
  content: string;
}

@customElement('llmstudio-chat')
export class LLMStudioChat extends LitElement {
  @property({ type: String }) selectedModel: string = '';

  @state() private messages: ChatMessage[] = [];
  @state() private input: string = "";
  @state() private loading: boolean = false;
  @state() private error: string = "";

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: linear-gradient(135deg, #f5f1e6, #e8e2d0);
    }
    .llm-chat {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
    }
    .msg {
      margin-bottom: 12px;
      max-width: 80%;
      padding: 8px 12px;
      font-size: 0.95rem;
      line-height: 1.5;
    }
    .msg.user {
      align-self: flex-end;
      background: #a67b5b;
      color: white;
      border-radius: 12px 4px 12px 12px;
    }
    .msg.assistant {
      align-self: flex-start;
      background: #e0e0e0;
      color: #1c1c1a;
      border-radius: 4px 12px 12px 12px;
    }
    .input-bar {
      display: flex;
      padding: 12px;
      border-top: 1px solid #dcc6a0;
      background: #fcf9f5;
      gap: 8px;
    }
    textarea {
      flex: 1;
      resize: none;
      border: 1px solid #dcc6a0;
      border-radius: 6px;
      padding: 10px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.9rem;
      outline: none;
    }
    textarea:focus {
      border-color: #a67b5b;
    }
    button {
      padding: 0 16px;
      background: #a67b5b;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.2s;
    }
    button:hover:not(:disabled) {
      background: #894d0d;
    }
    button:disabled {
      background: #d8c3b4;
      cursor: not-allowed;
    }
    .error {
      color: #e74c3c;
      padding: 8px;
      font-size: 0.85rem;
      text-align: center;
    }
  `;

  private async sendMessage() {
    if (!this.input.trim() || this.loading) return;

    const userMsg: ChatMessage = { role: 'user', content: this.input };
    this.messages = [...this.messages, userMsg];
    const currentInput = this.input;
    this.input = "";
    this.loading = true;
    this.error = "";

    try {
      const chatMessages = [...this.messages];
      if (this.selectedModel) {
        chatMessages.push({ role: 'system', content: `Model: ${this.selectedModel}` });
      }

      const response = await LLMStudioService.chat(chatMessages, {
        model: this.selectedModel,
        temperature: 0.7,
        maxTokens: 1024
      });

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: response.choices?.[0]?.message?.content ?? "No response"
      };
      this.messages = [...this.messages, assistantMsg];
    } catch (e: any) {
      this.error = e.message;
      console.error("Chat error:", e);
    } finally {
      this.loading = false;
    }
  }

  render() {
    return html`
      <div class="llm-chat">
        <div class="messages">
          ${this.messages.map((m) => html`
            <div class="msg ${m.role}">
              <span>${m.content}</span>
            </div>
          `)}
          ${this.loading ? html`<div class="msg assistant">⏳ Pensée en cours...</div>` : ''}
        </div>

        ${this.error ? html`<div class="error">${this.error}</div>` : ''}

        <div class="input-bar">
          <textarea
            .value=${this.input}
            @input=${(e: any) => this.input = e.target.value}
            @keyup=${(e: KeyboardEvent) => e.key === 'Enter' && !e.shiftKey && this.sendMessage()}
            placeholder="Tapez votre prompt..."
            rows="2"
          ></textarea>
          <button @click=${this.sendMessage} ?disabled=${this.loading || !this.input.trim()}>
            ${this.loading ? "..." : "Envoyer"}
          </button>
        </div>
      </div>
    `;
  }
}
