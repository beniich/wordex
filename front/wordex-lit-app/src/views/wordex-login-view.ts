import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { authService } from '../services/auth-service';
import { Router } from '@vaadin/router';

@customElement('wordex-login-view')
export class WordexLoginView extends LitElement {
  static styles = css`
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: #fcf9f5;
      color: #1c1c1a;
      font-family: 'Manrope', sans-serif;
      position: relative;
    }
    .light-leak {
      position: absolute; top: -10%; right: -10%; width: 50%; height: 50%;
      background: rgba(137, 77, 13, 0.05); border-radius: 50%; filter: blur(100px);
      z-index: 0; pointer-events: none;
    }
    .light-leak-2 {
      position: absolute; bottom: -10%; left: -10%; width: 40%; height: 40%;
      background: rgba(0, 101, 118, 0.04); border-radius: 50%; filter: blur(100px);
      z-index: 0; pointer-events: none;
    }
    .login-card {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(20px);
      padding: 3rem;
      border-radius: 24px;
      border: 1px solid rgba(133, 116, 103, 0.15);
      width: 100%;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 10px 40px rgba(137, 77, 13, 0.05);
      z-index: 1;
      position: relative;
      animation: floatUp 0.6s ease-out;
    }
    @keyframes floatUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .logo {
      font-size: 2.2rem;
      font-weight: 900;
      color: #894d0d;
      letter-spacing: -1px;
      margin-bottom: 0.5rem;
    }
    .subtitle {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: #524439;
      font-weight: 700;
      margin-bottom: 2.5rem;
    }
    input {
      width: 100%;
      padding: 14px 16px;
      margin-bottom: 1rem;
      background: #f6f3ef;
      border: 1px solid rgba(133, 116, 103, 0.2);
      border-radius: 12px;
      color: #1c1c1a;
      box-sizing: border-box;
      font-family: inherit;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    input:focus {
      outline: none;
      border-color: #894d0d;
      box-shadow: 0 0 0 3px rgba(137, 77, 13, 0.1);
    }
    button {
      width: 100%;
      padding: 14px;
      background: #894d0d;
      border: none;
      border-radius: 12px;
      color: white;
      font-weight: 800;
      cursor: pointer;
      margin-top: 1rem;
      transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
      font-family: inherit;
    }
    button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(137, 77, 13, 0.2);
      background: #a76526;
    }
    button:disabled {
      background: #d8c3b4;
      cursor: not-allowed;
    }
    .error { color: #ba1a1a; margin-top: 1rem; font-weight: 600; font-size: 0.9rem; }
  `;

  connectedCallback() {
    super.connectedCallback();
    if (authService.isAuthenticated) {
      Router.go('/');
    }
  }

  @state() private email = "";
  @state() private password = "";
  @state() private error = "";
  @state() private isLoading = false;

  async login() {
    if (!this.email || !this.password) {
      this.error = "Veuillez remplir tous les champs.";
      return;
    }
    this.error = "";
    this.isLoading = true;
    try {
      await authService.login(this.email, this.password);
      Router.go('/'); // Send to default landing page (Workspace)
    } catch (e: any) {
      this.error = e.message || "Erreur de connexion";
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    return html`
      <div class="light-leak"></div>
      <div class="light-leak-2"></div>
      <div class="login-card">
        <div class="logo">Aether</div>
        <div class="subtitle">The Celestial Atelier</div>
        
        <input type="email" placeholder="Adresse email" @input=${(e: any) => this.email = e.target.value} @keyup=${(e: KeyboardEvent) => e.key === 'Enter' && this.login()}>
        <input type="password" placeholder="Mot de passe" @input=${(e: any) => this.password = e.target.value} @keyup=${(e: KeyboardEvent) => e.key === 'Enter' && this.login()}>
        
        <button @click=${this.login} ?disabled=${this.isLoading}>
          ${this.isLoading ? 'Connexion en cours...' : 'Accéder au labo'}
        </button>
        
        ${this.error ? html`<div class="error">${this.error}</div>` : ''}

        <div style="margin-top: 2rem; font-size: 0.9rem; color: #524439;">
          Pas encore de accès ? 
          <a href="/register" style="color: #894d0d; font-weight: 800; text-decoration: none;">Créer un profil</a>
        </div>
      </div>
    `;
  }
}
