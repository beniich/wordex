import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { authService } from '../services/auth-service';
import { Router } from '@vaadin/router';

@customElement('wordex-register-view')
export class WordexRegisterView extends LitElement {
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
    .register-card {
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
    }
    .error { color: #ba1a1a; margin-top: 1rem; font-weight: 600; font-size: 0.9rem; }
    .success { color: #006576; margin-top: 1rem; font-weight: 600; font-size: 0.9rem; }
  `;

  @state() private email = "";
  @state() private username = "";
  @state() private password = "";
  @state() private error = "";
  @state() private success = "";
  @state() private isLoading = false;

  async register() {
    if (!this.email || !this.password || !this.username) {
      this.error = "Veuillez remplir tous les champs.";
      return;
    }
    this.error = "";
    this.isLoading = true;
    try {
      await authService.register(this.email, this.password, this.username);
      this.success = "Inscription réussie ! Redirection...";
      setTimeout(() => Router.go('/login'), 2000);
    } catch (e: any) {
      this.error = e.message || "Erreur d'inscription";
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    return html`
      <div class="light-leak"></div>
      <div class="register-card">
        <div class="logo">Aether</div>
        <div class="subtitle">Créer un profil</div>
        
        <input type="text" placeholder="Nom d'utilisateur" @input=${(e: any) => this.username = e.target.value}>
        <input type="email" placeholder="Adresse email" @input=${(e: any) => this.email = e.target.value}>
        <input type="password" placeholder="Mot de passe" @input=${(e: any) => this.password = e.target.value}>
        
        <button @click=${this.register} ?disabled=${this.isLoading}>
          ${this.isLoading ? 'Traitement...' : "S'inscrire"}
        </button>
        
        ${this.error ? html`<div class="error">${this.error}</div>` : ''}
        ${this.success ? html`<div class="success">${this.success}</div>` : ''}

        <div style="margin-top: 2rem; font-size: 0.9rem; color: #524439;">
          Déjà un compte ? 
          <a href="/login" style="color: #894d0d; font-weight: 800; text-decoration: none;">Se connecter</a>
        </div>
      </div>
    `;
  }
}
