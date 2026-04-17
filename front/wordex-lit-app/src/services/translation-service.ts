import { LitElement } from 'lit';

export type Locale = 'en' | 'fr';

class TranslationService {
  private _locale: Locale = (localStorage.getItem('wordex_locale') as Locale) || 'fr';
  private _translations: Record<string, any> = {};
  private _listeners: Set<() => void> = new Set();

  constructor() {
    this.loadTranslations();
  }

  get locale() {
    return this._locale;
  }

  async setLocale(locale: Locale) {
    if (this._locale === locale) return;
    this._locale = locale;
    localStorage.setItem('wordex_locale', locale);
    await this.loadTranslations();
    this.notify();
  }

  private async loadTranslations() {
    try {
      // In a real Vite app, we can use dynamic imports or fetch
      // For this implementation, we will fetch the JSON files
      const response = await fetch(`/src/assets/locales/${this._locale}.json`);
      if (response.ok) {
        this._translations = await response.json();
      } else {
        console.error(`Failed to load translation for ${this._locale}`);
        // Fallback to empty if not found
        this._translations = {};
      }
    } catch (e) {
      console.error('Error loading translations:', e);
      this._translations = {};
    }
  }

  /**
   * Translate a key with optional parameters
   * Supports dot notation: "nav.home"
   */
  t(key: string, params?: Record<string, string | number>): string {
    const value = key.split('.').reduce((o, k) => (o || {})[k], this._translations);
    
    if (!value) {
      return key; // Return the key if translation is missing
    }

    let result = String(value);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(`{${k}}`, String(v));
      });
    }
    return result;
  }

  subscribe(callback: () => void) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  private notify() {
    this._listeners.forEach(cb => cb());
  }
}

export const translationService = new TranslationService();

/**
 * A simple mixin to make translations reactive in Lit components
 */
export const TranslationMixin = <T extends new (...args: any[]) => LitElement>(base: T) => {
  return class extends base {
    private _translationCleanup?: () => void;

    connectedCallback() {
      super.connectedCallback();
      this._translationCleanup = translationService.subscribe(() => this.requestUpdate());
    }

    disconnectedCallback() {
      if (this._translationCleanup) this._translationCleanup();
      super.disconnectedCallback();
    }

    t(key: string, params?: Record<string, string | number>) {
      return translationService.t(key, params);
    }
  };
};
