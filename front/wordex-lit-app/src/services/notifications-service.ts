import { apiFetch } from './api-client';

export interface AppNotification {
  id: string;
  recipient_id: string;
  actor_id?: string;
  notif_type: string;
  entity_type: string;
  entity_id: string;
  entity_title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  actor_name?: string;
  actor_avatar?: string;
}

export const notificationsService = {
  getNotifications: async (unreadOnly = false, limit = 30): Promise<AppNotification[]> => {
    const res = await apiFetch(`/notifications/?unread_only=${unreadOnly}&limit=${limit}`);
    return res.json();
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const res = await apiFetch('/notifications/unread-count');
    return res.json();
  },

  markAsRead: async (notifId: string): Promise<void> => {
    await apiFetch(`/notifications/${notifId}/read`, { method: 'PATCH' });
  },

  markAllAsRead: async (): Promise<void> => {
    await apiFetch('/notifications/read-all', { method: 'PATCH' });
  },

  deleteNotification: async (notifId: string): Promise<void> => {
    await apiFetch(`/notifications/${notifId}`, { method: 'DELETE' });
  }
};
