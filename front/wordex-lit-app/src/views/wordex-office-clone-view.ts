import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

const API_BASE = "http://localhost:8000";

@customElement('wordex-office-clone-view')
export class WordexOfficeCloneView extends LitElement {
  
  @state()
  private content: string = "";
  
  @state()
  private loading: boolean = false;
  
  @state()
  private result: any = null;

  // We intentionally do not use shadow DOM to let global Tailwind CSS classes apply
  protected createRenderRoot() {
    return this;
  }

  async handleAnalyze() {
    this.loading = true;
    try {
      // Intégration directe avec le nouveau backend Wordex fusionné (route /api/office)
      const res = await fetch(`${API_BASE}/api/office/diagnose-financials/1/101`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      this.result = data;
      if (this.result && this.result.diagnostic) {
        this.content = `RAPPORT DE DIAGNOSTIC FINANCIER\n\n${this.result.diagnostic.summary}\n\nRECOMMANDATIONS :\n- ${this.result.diagnostic.details.join('\n- ')}`;
      }
    } catch (error) {
      console.error(error);
      alert("Erreur de connexion au serveur Backend Wordex");
    }
    this.loading = false;
  }

  render() {
    return html`
      <!-- Isolation CSS pour le mode "Clone Office" afin de ne pas casser le reste de Wordex -->
      <style>
        .office-clone-container {
          background-color: #B0B0B0 !important;
          color: black !important;
        }
        
        /* Scrollbar spécifique pour cette vue (Skeuomorphisme) */
        .workspace-scroll::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        .workspace-scroll::-webkit-scrollbar-track {
          background: #E0E0E0;
          border-left: 1px solid #C0C0C0;
        }
        .workspace-scroll::-webkit-scrollbar-thumb {
          background: #C0C0C0;
          border: 2px solid #E0E0E0;
          border-radius: 2px;
        }
        .workspace-scroll::-webkit-scrollbar-thumb:hover {
          background: #A0A0A0;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
      </style>

      <div class="office-clone-container flex flex-col h-screen overflow-hidden font-sans select-none">
        
        <!-- --- 1. BARRE DE MENUS (Style Legacy) --- -->
        <div class="bg-[#E0E0E0] border-b border-gray-400 flex text-[11px] px-2 py-1 gap-4 shadow-sm">
          ${['Fichier', 'Édition', 'Affichage', 'Insertion', 'Format', 'Tableau', 'Outils', 'Fenêtre', 'Aide'].map(menu => html`
            <span class="cursor-pointer hover:bg-blue-100 px-1 rounded transition-colors">${menu}</span>
          `)}
        </div>

        <!-- --- 2. BARRE D'OUTILS (Skeuomorphisme) --- -->
        <div class="bg-[#F3F3F3] border-b border-gray-400 p-1 flex items-center gap-1 shadow-sm">
          <div class="flex gap-1 border-r border-gray-300 pr-2 mr-1">
            <button class="p-1 hover:bg-gray-200 rounded border border-transparent hover:border-gray-400" title="Enregistrer">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            </button>
            <button class="p-1 hover:bg-gray-200 rounded border border-transparent hover:border-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
          
          <div class="flex gap-1 border-r border-gray-300 pr-2 mr-1">
            <select class="text-xs border border-gray-400 px-1 py-0.5 rounded bg-white w-32 focus:outline-none">
              <option>Times New Roman</option>
              <option>Arial</option>
              <option>Calibri</option>
            </select>
            <select class="text-xs border border-gray-400 px-1 py-0.5 rounded bg-white focus:outline-none">
              <option>12</option>
              <option>14</option>
              <option>16</option>
            </select>
          </div>

          <div class="flex gap-1 border-r border-gray-300 pr-2 mr-1">
            <button class="p-1 hover:bg-gray-200 rounded font-bold px-2 text-sm border border-transparent hover:border-gray-400">G</button>
            <button class="p-1 hover:bg-gray-200 rounded italic px-2 text-sm border border-transparent hover:border-gray-400">I</button>
            <button class="p-1 hover:bg-gray-200 rounded underline px-2 text-sm border border-transparent hover:border-gray-400">S</button>
          </div>

          <div class="ml-auto pr-4">
             <button @click=${this.handleAnalyze} ?disabled=${this.loading} class="bg-blue-600 text-white text-[10px] px-3 py-1 rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2">
                ${this.loading ? html`<div class="animate-spin rounded-full h-3 w-3 border-t-2 border-white"></div>` : html`<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>`}
                Lancer Diagnostic IA
             </button>
          </div>
        </div>

        <!-- --- 3. ZONE DE TRAVAIL PRINCIPALE --- -->
        <div class="flex-1 flex overflow-hidden">
          
          <!-- Règle et Page (Zone Centrale) -->
          <div class="flex-1 flex flex-col items-center workspace-scroll overflow-auto p-8 bg-[#B0B0B0]">
            <!-- Règle Simplifiée -->
            <div class="w-[816px] min-h-[24px] h-[24px] bg-white border border-gray-400 mb-2 relative flex items-end text-[10px] px-1 pointer-events-none">
              ${Array.from({ length: 21 }).map((_, i) => html`
                <span class="absolute border-l border-gray-300 h-2" style="left: ${i * 40}px"></span>
                <span class="absolute pb-1" style="left: ${i * 40 + 5}px">${i}</span>
              `)}
            </div>

            <!-- LA PAGE A4 -->
            <div class="w-[816px] min-h-[1056px] bg-white shadow-2xl p-16 outline outline-1 outline-gray-300 relative animate-fade-in focus-within:ring-1 focus-within:ring-blue-300">
              <textarea 
                class="w-full min-h-[900px] outline-none resize-none text-black font-serif text-[18px] leading-relaxed bg-transparent placeholder-gray-400 italic"
                placeholder="L'IA Wordex Enterprise est prête à rédiger votre document industriel..."
                .value=${this.content}
                @input=${(e: any) => this.content = e.target.value}
              ></textarea>
              
              <!-- Filigrane SOC 2 / ISO 27001 -->
              <div class="absolute top-4 right-4 text-[9px] text-gray-300 uppercase font-bold italic flex flex-col items-end">
                <span>AI Agent Powered</span>
                <span>SOC 2 Compliant Layer</span>
              </div>
            </div>
          </div>

          <!-- --- 4. PANNEAU DE PROPRIÉTÉS --- -->
          <div class="w-72 bg-[#E0E0E0] border-l border-gray-400 p-3 flex flex-col gap-6 shadow-inner workspace-scroll overflow-y-auto">
            
            <!-- Section Texte -->
            <div class="space-y-3">
              <div class="flex items-center gap-2 border-b border-gray-400 pb-1 font-bold text-xs uppercase text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg>
                Texte
              </div>
              <div class="flex flex-col gap-2">
                <select class="text-xs border border-gray-400 p-1 bg-white rounded focus:outline-none">
                  <option>Times New Roman</option>
                  <option>Arial (Industrial)</option>
                </select>
                <div class="flex gap-2">
                  <input type="text" class="w-1/2 text-xs border border-gray-400 p-1 bg-white focus:outline-none" value="12" />
                  <button class="p-1 px-3 bg-gray-200 border border-gray-400 rounded text-xs hover:bg-gray-300">...</button>
                </div>
              </div>
            </div>

            <!-- Section AI Audit (SOC 2 CC7) -->
            <div class="space-y-3">
              <div class="flex items-center gap-2 border-b border-gray-400 pb-1 font-bold text-xs uppercase text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                Contrôle d'Intégrité
              </div>
              <div class="bg-gray-50 border border-gray-300 p-2 rounded text-[10px] text-gray-600">
                <p class="font-bold mb-1">Audit Trail :</p>
                <p>Action: AI_GEN_DOC</p>
                <p>Status: <span class="text-green-600 font-bold">Protégé (AES-256)</span></p>
              </div>
            </div>

            <!-- Section AI Diagnostic (L'ajout intelligent) -->
            <div class="mt-auto bg-blue-100 p-4 border border-blue-400 rounded-lg shadow-sm">
              <div class="text-[11px] font-bold text-blue-800 flex items-center gap-1 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                AI DIAGNOSTIC
              </div>
              ${this.result ? html`
                <p class="text-[10px] text-blue-700 leading-tight">
                  "${this.result.diagnostic.critical_alert}"
                </p>
                <button class="mt-3 w-full bg-blue-600 text-white text-[10px] py-1.5 rounded hover:bg-blue-700 transition-all font-semibold">
                  Appliquer Correction IA
                </button>
              ` : html`
                <p class="text-[10px] text-blue-400 italic">Lancez le diagnostic pour voir les suggestions de l'assistant.</p>
              `}
            </div>

          </div>
        </div>

        <!-- --- 5. BARRE DE STATUT (Bas de page) --- -->
        <div class="bg-[#E0E0E0] border-t border-gray-400 p-1 flex justify-between items-center text-[11px] px-4 shadow-inner">
          <div class="flex gap-6 text-gray-600">
            <span>Page 1 / 1</span>
            <span>Standard</span>
            <span class="flex items-center gap-1">
               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
               Français (France)
            </span>
          </div>
          <div class="flex items-center gap-4 text-gray-600">
            <span class="font-bold border-r border-gray-400 pr-2">Wordex Enterprise</span>
            <div class="flex items-center gap-2">
              <button class="hover:bg-gray-300 px-1 rounded">-</button>
              <div class="w-32 h-2 bg-gray-300 border border-gray-400 rounded-full relative overflow-hidden">
                <div class="absolute left-0 top-0 h-full bg-blue-500 w-[100%]"></div>
              </div>
              <button class="hover:bg-gray-300 px-1 rounded">+</button>
              <span class="w-8 ml-1">100%</span>
            </div>
          </div>
        </div>

      </div>
    `;
  }
}
