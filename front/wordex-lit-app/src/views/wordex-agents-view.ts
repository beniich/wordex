import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { AgentService } from '../services/agent-api';
import type { Agent } from '../services/agent-api';
import { TranslationMixin } from '../services/translation-service';

interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
}

@customElement('wordex-agents-view')
export class WordexAgentsView extends TranslationMixin(LitElement) {
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
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-top: 1rem;
    }
    .agent-card {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(133, 116, 103, 0.15);
      border-radius: 20px;
      padding: 1.5rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }
    .agent-card::after {
      content: ''; position: absolute; top: -50px; right: -50px; width: 100px; height: 100px;
      background: rgba(137, 77, 13, 0.05); border-radius: 50%; filter: blur(20px); transition: transform 0.5s;
    }
    .agent-card:hover::after { transform: scale(1.5); }
    .agent-card.active {
      border-color: #894d0d;
      background: rgba(137, 77, 13, 0.05);
      box-shadow: 0 10px 30px rgba(137, 77, 13, 0.1);
    }
    .agent-card:hover:not(.active) {
      transform: translateY(-4px);
      box-shadow: 0 10px 20px rgba(28, 28, 26, 0.05);
    }
    .agent-icon {
      font-size: 2rem; margin-bottom: 1rem;
    }
    h2 {
      margin: 0 0 0.25rem 0;
      color: #1c1c1a;
      font-weight: 800;
      font-size: 1.2rem;
    }
    .role {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #894d0d;
      font-weight: 800;
      margin-bottom: 1rem;
    }
    
    /* CHAT CONTAINER */
    .lab-area {
      margin-top: 3rem;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 24px;
      border: 1px solid rgba(133, 116, 103, 0.2);
      padding: 2rem;
      box-shadow: 0 20px 50px rgba(137, 77, 13, 0.08);
      display: flex; flex-direction: column;
      animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; } to { opacity: 1; }
    }
    
    .chat-history {
      min-height: 200px;
      max-height: 400px;
      overflow-y: auto;
      padding-right: 1rem;
      margin-bottom: 2rem;
      display: flex; flex-direction: column; gap: 1rem;
    }
    .chat-history::-webkit-scrollbar { width: 6px; }
    .chat-history::-webkit-scrollbar-thumb { background: rgba(133, 116, 103, 0.2); border-radius: 4px; }

    .msg {
      max-width: 80%; padding: 1rem 1.5rem; border-radius: 20px; font-size: 0.95rem; line-height: 1.5;
      animation: fadeIn 0.3s; position: relative;
    }
    .msg.user {
      align-self: flex-end;
      background: #1c1c1a; color: white;
      border-bottom-right-radius: 4px;
    }
    .msg.agent {
      align-self: flex-start;
      background: #f6f3ef; color: #1c1c1a;
      border: 1px solid rgba(133, 116, 103, 0.1);
      border-bottom-left-radius: 4px;
    }

    .input-area {
      display: flex; gap: 1rem;
    }
    input {
      flex: 1; padding: 14px 20px; border-radius: 16px; border: 1px solid rgba(133, 116, 103, 0.2);
      background: #fcf9f5; font-family: inherit; font-size: 1rem; color: #1c1c1a; outline: none; transition: border 0.2s;
    }
    input:focus { border-color: #894d0d; }
    button {
      padding: 0 24px; background: #894d0d; border: none; border-radius: 16px; color: white;
      font-weight: 800; cursor: pointer; transition: transform 0.2s, background 0.2s; font-family: inherit;
    }
    button:hover:not(:disabled) { transform: scale(1.05); background: #a76526; }
    button:disabled { background: #d8c3b4; cursor: not-allowed; }
  `;

  @state() private agents: Agent[] = [];
  @state() private loading = true;
  @state() private selectedAgent: Agent | null = null;
  @state() private msgInput = "";
  @state() private isGenerating = false;
  @state() private chatLog: ChatMessage[] = [];

  async connectedCallback() {
    super.connectedCallback();
    this.loading = true;
    try {
      this.agents = await AgentService.listAgents();
      if (this.agents.length === 0) {
        throw new Error("Empty list");
      }
    } catch (e) {
      console.warn("Agents service unavailable, using mock data:", e);
      this.agents = [
        { id: 'a1', name: 'Codex Core', role: 'ARCHITECT', specialty: 'Analyse de structure et optimisation de code source.' },
        { id: 'a2', name: 'Vision Sentinel', role: 'AUDITOR', specialty: 'Analyse visuelle et détection d\'anomalies industrielles.' },
        { id: 'a3', name: 'Aether Scribe', role: 'DOCUMENTALIST', specialty: 'Génération de rapports et synthèses de documents complexes.' },
        { id: 'a4', name: 'Flux Weaver', role: 'ANALYST', specialty: 'Optimisation de flux de données et monitoring temps réel.' }
      ];
    } finally {
      this.loading = false;
      // Pre-select first agent
      if (this.agents.length > 0) {
        this.selectAgent(this.agents[0]);
      }
    }
  }

  private async sendMessage() {
    if(!this.msgInput.trim() || !this.selectedAgent) return;
    
    this.chatLog = [...this.chatLog, { role: 'user', content: this.msgInput }];
    const prompt = this.msgInput;
    this.msgInput = "";
    this.isGenerating = true;

    try {
      // Appel API Réel vers le backend LLM via FastAPI
      const result = await AgentService.chat(this.selectedAgent.id, prompt);
      this.chatLog = [...this.chatLog, { role: 'agent', content: result.response }];
      
    } catch(e) {
      this.chatLog = [...this.chatLog, { role: 'agent', content: this.t('common.error') + " (Backend non atteignable)." }];
    } finally {
      this.isGenerating = false;
    }
  }

  private selectAgent(agent: Agent) {
    this.selectedAgent = agent;
    this.chatLog = [{ role: 'agent', content: "Bonjour, je suis " + agent.name + ". Comment puis-je vous assister aujourd'hui ?" }];
  }

  render() {
    if (this.loading) return html`<div style="padding: 2rem;">${this.t('agents.loading')}</div>`;

    return html`
      <div class="header">
        <h1>${this.t('agents.title')}</h1>
        <p style="color: var(--on-surface-variant); font-weight: 600;">${this.t('agents.subtitle')}</p>
      </div>

      <div class="grid">
        ${this.agents.map((agent, i) => html`
          <div 
            class="agent-card ${this.selectedAgent?.id === agent.id ? 'active' : ''}" 
            @click=${() => this.selectAgent(agent)}
          >
            <div class="agent-icon">${i === 0 ? '🧠' : i === 1 ? '✍️' : '🎨'}</div>
            <h2>${agent.name}</h2>
            <div class="role">${agent.role}</div>
            <p style="font-size: 0.85rem; color: #524439;">${agent.specialty}</p>
          </div>
        `)}
      </div>

      ${this.selectedAgent ? html`
        <div class="lab-area">
          <h3 style="margin-top: 0; color: #894d0d; display:flex; align-items:center; gap: 8px;">
            <span style="display:inline-block; width:8px; height:8px; background:#894d0d; border-radius:50%;"></span>
            ${this.t('agents.activeLink', { name: this.selectedAgent.name })}
          </h3>
          
          <div class="chat-history">
            ${this.chatLog.map(msg => html`
              <div class="msg ${msg.role}">${msg.content}</div>
            `)}
          </div>

          <div class="input-area">
            <input 
              placeholder="${this.t('agents.assignTask')}" 
              .value=${this.msgInput}
              @input=${(e:any) => this.msgInput = e.target.value}
              @keyup=${(e:KeyboardEvent) => e.key === 'Enter' && this.sendMessage()}
            />
            <button @click=${this.sendMessage} ?disabled=${this.isGenerating || !this.msgInput.trim()}>
              ${this.isGenerating ? this.t('agents.computing') : this.t('agents.execute')}
            </button>
          </div>
        </div>
      ` : ''}
    `;
  }
}
