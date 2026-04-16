export const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface User {
  id: string;
  email: string;
  username: string;
}

class AuthService extends EventTarget {
  private _token: string | null = localStorage.getItem('wordex_token');
  private _user: User | null = null;

  get isAuthenticated() { return !!this._token; }
  get user() { return this._user; }
  get token() { return this._token; }
  get refreshToken() { return localStorage.getItem('wordex_refresh'); }

  async login(email: string, password: string) {
    const formData = new FormData();
    formData.append('username', email); // FastAPI OAuth2 use 'username'
    formData.append('password', password);

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) throw new Error("Identifiants invalides");

    const data = await res.json();
    this._token = data.access_token;
    localStorage.setItem('wordex_token', this._token!);
    if (data.refresh_token) localStorage.setItem('wordex_refresh', data.refresh_token);
    this.dispatchEvent(new CustomEvent('auth-changed'));
    return data;
  }

  async register(email: string, password: string, username: string) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || "Erreur lors de l'inscription");
    }

    return await res.json();
  }

  async refresh(): Promise<boolean> {
    const refreshToken = this.refreshToken;
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${refreshToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        this._token = data.access_token;
        localStorage.setItem('wordex_token', this._token!);
        if (data.refresh_token) localStorage.setItem('wordex_refresh', data.refresh_token);
        return true;
      }
    } catch (e) {
      console.warn("Refresh failed", e);
    }
    return false;
  }

  logout() {
    this._token = null;
    this._user = null;
    localStorage.removeItem('wordex_token');
    localStorage.removeItem('wordex_refresh');
    this.dispatchEvent(new CustomEvent('auth-changed'));
  }
}

export const authService = new AuthService();
