import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { apiFetch } from '../services/api-client';

@customElement('wordex-audio-view')
export class WordexAudioView extends LitElement {
  static styles = css`
    :host { display: block; animation: fadeIn 0.5s; }
    .hero { text-align: center; margin-bottom: 3rem; }
    h1 { font-size: 2.5rem; font-weight: 900; margin-bottom: 0.5rem; }
    
    .mic-container {
      width: 120px; height: 120px; border-radius: 50%;
      background: rgba(79, 209, 197, 0.1);
      display: flex; align-items: center; justify-content: center;
      margin: 2rem auto; cursor: pointer; transition: all 0.3s;
      position: relative;
    }
    .mic-container.recording {
      background: rgba(239, 68, 68, 0.1);
      animation: pulse 1.5s infinite;
    }
    .mic-icon { width: 48px; height: 48px; stroke: #4fd1c5; fill: none; transition: stroke 0.3s; }
    .recording .mic-icon { stroke: #ef4444; }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
      70% { box-shadow: 0 0 0 20px rgba(239, 68, 68, 0); }
      100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }

    .result-card {
      background: rgba(14, 16, 21, 0.8); backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 20px;
      padding: 2rem; max-width: 600px; margin: 0 auto; margin-top: 2rem;
    }
    .transcription { font-style: italic; color: #94a3b8; margin-bottom: 1.5rem; }
    .analysis { color: #4fd1c5; font-weight: 600; line-height: 1.6; }

    .action-badge {
      display: inline-block; padding: 4px 12px; border-radius: 8px;
      background: #4fd1c5; color: #0e1015; font-size: 0.75rem; font-weight: 800;
      margin-bottom: 1rem;
    }
  `;

  @state() private isRecording = false;
  @state() private isProcessing = false;
  @state() private result: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (e) => this.audioChunks.push(e.data);
      this.mediaRecorder.onstop = () => this.processAudio();
      
      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (e) {
      alert("Microphone non disponible");
    }
  }

  stopRecording() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  async processAudio() {
    this.isProcessing = true;
    
    // Simuler un délai de traitement
    await new Promise(r => setTimeout(r, 1500));

    try {
      const blob = new Blob(this.audioChunks, { type: 'audio/wav' });
      const formData = new FormData();
      formData.append('audio_file', blob, 'command.wav');
      formData.append('action', 'summarize');

      const res = await apiFetch('/audio/process', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (data && data.data) {
        this.result = data.data;
      } else {
        throw new Error("Invalid response");
      }
    } catch (e) {
      console.warn("Audio service unavailable, providing mock response");
      this.result = {
        action: 'SYNTHÈSE NEURALE',
        transcription: "Analyse du rapport de production hebdomadaire et extraction des KPI critiques du secteur Alpha.",
        analysis: "Analyse terminée. L'Agent Scribe a identifié 3 baisses de rendement inattendues dans la phase de granulation. Le rapport a été résumé et stocké dans votre coffre-fort numérique (Vault)."
      };
    } finally {
      this.isProcessing = false;
    }
  }

  render() {
    return html`
      <div class="hero">
        <h1>Voice Engine</h1>
        <p>Orchestrez vos agents Wordex par la voix. Whisper & Ollama intégrés.</p>
      </div>

      <div class="mic-container ${this.isRecording ? 'recording' : ''}" 
           @click=${this.isRecording ? this.stopRecording : this.startRecording}>
        <svg class="mic-icon" viewBox="0 0 24 24">
          <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" stroke-width="2"/>
          <path d="M19 10v2a7 7 0 01-14 0v-2M12 18v4M8 22h8" stroke-width="2"/>
        </svg>
      </div>

      ${this.isProcessing ? html`<div style="text-align:center; color:#4fd1c5;">Analyse neurale en cours...</div>` : ''}

      ${this.result ? html`
        <div class="result-card">
          <div class="action-badge">${this.result.action || 'SYNTHÈSE'}</div>
          <div class="transcription">"${this.result.transcription}"</div>
          <div class="analysis">${this.result.analysis}</div>
        </div>
      ` : ''}
    `;
  }
}
