import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { notificationsService } from '../services/notifications-service';
import type { AppNotification } from '../services/notifications-service';

@customElement('wordex-notifications-bell')
export class WordexNotificationsBell extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      position: relative;
    }
    
    .bell-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(133, 116, 103, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      transition: background 0.2s;
    }
    .bell-icon:hover {
      background: rgba(133, 116, 103, 0.2);
    }
    .bell-icon svg {
      width: 20px;
      height: 20px;
      color: #857467;
    }

    .badge {
      position: absolute;
      top: -2px;
      right: -2px;
      background: #ef4444;
      color: white;
      font-size: 0.6rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 10px;
      border: 2px solid white;
    }

    .dropdown {
      position: absolute;
      top: 48px;
      right: -10px;
      width: 320px;
      max-height: 400px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(133, 116, 103, 0.15);
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      display: none;
      flex-direction: column;
      z-index: 1000;
      overflow: hidden;
      animation: slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .dropdown.open {
      display: flex;
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(133, 116, 103, 0.1);
    }
    .header h3 { margin: 0; font-size: 0.9rem; font-weight: 800; color: #1c1c1a; }
    .mark-all { font-size: 0.75rem; color: var(--primary, #894d0d); cursor: pointer; font-weight: 600; border: none; background: none; }
    .mark-all:hover { text-decoration: underline; }

    .list {
      flex: 1;
      overflow-y: auto;
      max-height: 300px;
      padding: 0;
      margin: 0;
      list-style: none;
    }

    .item {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(133, 116, 103, 0.05);
      display: flex;
      gap: 12px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .item:hover {
      background: rgba(133, 116, 103, 0.05);
    }
    .item.unread {
      background: rgba(137, 77, 13, 0.03);
    }
    
    .item-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #f1ede8;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .item-icon svg { width: 12px; height: 12px; color: #894d0d; }

    .item-content { flex: 1; }
    .item-title { font-size: 0.8rem; font-weight: 700; color: #1c1c1a; margin-bottom: 2px; }
    .item-message { font-size: 0.75rem; color: #857467; line-height: 1.3; }
    .item-time { font-size: 0.65rem; color: #a1968d; margin-top: 4px; display: block; }
    
    .item-indicator {
      width: 8px; height: 8px; border-radius: 50%; background: #ef4444; flex-shrink: 0; align-self: center; display: none;
    }
    .item.unread .item-indicator { display: block; }

    .empty {
      padding: 24px;
      text-align: center;
      color: #857467;
      font-size: 0.8rem;
    }

    /* Custom scrollbar */
    .list::-webkit-scrollbar { width: 4px; }
    .list::-webkit-scrollbar-track { background: transparent; }
    .list::-webkit-scrollbar-thumb { background: rgba(133, 116, 103, 0.2); border-radius: 4px; }
  `;

  @state() private open = false;
  @state() private count = 0;
  @state() private notifications: AppNotification[] = [];

  async connectedCallback() {
    super.connectedCallback();
    await this.fetchCount();
    
    // Fermer le menu au clic à l'extérieur
    document.addEventListener('click', this.handleOutsideClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.handleOutsideClick);
  }

  handleOutsideClick = (e: MouseEvent) => {
    if (!this.shadowRoot?.contains(e.composedPath()[0] as Node)) {
      this.open = false;
    }
  }

  async fetchCount() {
    try {
      const data = await notificationsService.getUnreadCount();
      this.count = data.count || 0;
    } catch (e) {
      this.count = 2; // mock si backend hors-ligne
    }
  }

  async fetchNotifications() {
    try {
      const data = await notificationsService.getNotifications();
      this.notifications = Array.isArray(data) ? data : [];
    } catch (e) {
      // Mock data pour UI si offline
      this.notifications = [
        { id: '1', recipient_id: 'x', notif_type: 'comment', entity_type: 'document', entity_id: 'a', entity_title: 'Plan de maintenance', message: 'Nouveau commentaire de Jean', is_read: false, created_at: new Date().toISOString() },
        { id: '2', recipient_id: 'x', notif_type: 'mention', entity_type: 'document', entity_id: 'b', entity_title: 'Rapport Qualité', message: 'Sophie vous a mentionné', is_read: false, created_at: new Date(Date.now() - 3600000).toISOString() }
      ];
    }
  }

  async toggleDropdown() {
    this.open = !this.open;
    if (this.open) {
      await this.fetchNotifications();
    }
  }

  async handleMarkAll() {
    try {
      await notificationsService.markAllAsRead();
    } catch (e) {} // ignore offline error
    this.notifications = this.notifications.map(n => ({...n, is_read: true}));
    this.count = 0;
  }

  async handleRead(id: string) {
    try {
      await notificationsService.markAsRead(id);
    } catch (e) {} // ignore
    this.notifications = this.notifications.map(n => n.id === id ? {...n, is_read: true} : n);
    this.count = Math.max(0, this.count - 1);
  }

  private timeAgo(dateString: string) {
    const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
    const elapsed = Date.now() - new Date(dateString).getTime();
    if (elapsed < 60000) return 'à l\'instant';
    if (elapsed < 3600000) return rtf.format(-Math.floor(elapsed / 60000), 'minute');
    if (elapsed < 86400000) return rtf.format(-Math.floor(elapsed / 3600000), 'hour');
    return rtf.format(-Math.floor(elapsed / 86400000), 'day');
  }

  render() {
    return html`
      <div class="bell-icon" @click=${this.toggleDropdown}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        ${this.count > 0 ? html`<div class="badge">${this.count}</div>` : ''}
      </div>

      <div class="dropdown ${this.open ? 'open' : ''}">
        <div class="header">
          <h3>Notifications</h3>
          ${this.count > 0 ? html`<button class="mark-all" @click=${this.handleMarkAll}>Tout marquer comme lu</button>` : ''}
        </div>
        
        ${this.notifications.length === 0 ? html`
          <div class="empty">Aucune notification pour le moment.</div>
        ` : html`
          <ul class="list">
            ${this.notifications.map(n => html`
              <li class="item ${n.is_read ? '' : 'unread'}" @click=${() => this.handleRead(n.id)}>
                <div class="item-icon">
                  ${n.notif_type === 'comment' 
                    ? html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`
                    : html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`}
                </div>
                <div class="item-content">
                  <div class="item-title">${n.entity_title || n.notif_type}</div>
                  <div class="item-message">${n.message}</div>
                  <span class="item-time">${this.timeAgo(n.created_at)}</span>
                </div>
                <div class="item-indicator"></div>
              </li>
            `)}
          </ul>
        `}
      </div>
    `;
  }
}
