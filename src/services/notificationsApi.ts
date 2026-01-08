/**
 * Notifications API Service
 * Handles in-app notifications and preferences
 */

import { api } from '@/lib/api';

export interface Notification {
  id: number;
  workspace_id: number;
  user_id: number;
  type: string;
  title: string;
  body: string | null;
  icon: string | null;
  entity_type: string | null;
  entity_id: number | null;
  action_url: string | null;
  metadata: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  is_archived: boolean;
  created_at: string;
}

export interface NotificationPreference {
  id: number;
  user_id: number;
  workspace_id: number | null;
  notification_type: string;
  in_app: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
  digest_mode: 'instant' | 'hourly' | 'daily' | 'weekly';
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

export interface NotificationType {
  type: string;
  name: string;
  default_in_app: boolean;
  default_email: boolean;
  default_sms: boolean;
}

export interface NotificationsListParams {
  is_read?: boolean;
  type?: string;
  include_archived?: boolean;
  limit?: number;
  offset?: number;
}

export const notificationsApi = {
  /**
   * List notifications for current user
   */
  async list(params: NotificationsListParams = {}): Promise<{ data: Notification[]; meta: { total: number; unread: number; limit: number; offset: number } }> {
    const searchParams = new URLSearchParams();
    if (params.is_read !== undefined) searchParams.set('is_read', String(params.is_read));
    if (params.type) searchParams.set('type', params.type);
    if (params.include_archived) searchParams.set('include_archived', 'true');
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    
    const query = searchParams.toString();
    const response = await api.get(`/notifications${query ? `?${query}` : ''}`) as { data: Notification[]; meta: { total: number; unread: number; limit: number; offset: number } };
    return response;
  },

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    const response = await api.get('/notifications/unread-count') as { data: { unread: number } };
    return response.data.unread;
  },

  /**
   * Mark notification as read
   */
  async markRead(id: number): Promise<void> {
    await api.post(`/notifications/${id}/read`, {});
  },

  /**
   * Mark all notifications as read
   */
  async markAllRead(): Promise<{ updated: number }> {
    const response = await api.post('/notifications/mark-all-read', {}) as { success: boolean; updated: number };
    return { updated: response.updated };
  },

  /**
   * Archive notification
   */
  async archive(id: number): Promise<void> {
    await api.post(`/notifications/${id}/archive`, {});
  },

  /**
   * Delete notification
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<{ preferences: NotificationPreference[]; available_types: NotificationType[] }> {
    const response = await api.get('/notifications/preferences') as { data: { preferences: NotificationPreference[]; available_types: NotificationType[] } };
    return response.data;
  },

  /**
   * Update notification preference
   */
  async updatePreference(data: {
    notification_type: string;
    in_app?: boolean;
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    digest_mode?: 'instant' | 'hourly' | 'daily' | 'weekly';
    quiet_hours_start?: string | null;
    quiet_hours_end?: string | null;
  }): Promise<void> {
    await api.post('/notifications/preferences', data);
  },

  /**
   * Create notification (for internal/admin use)
   */
  async create(data: {
    user_id: number;
    type: string;
    title: string;
    body?: string;
    icon?: string;
    entity_type?: string;
    entity_id?: number;
    action_url?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ id: number }> {
    const response = await api.post('/notifications', data) as { data: { id: number } };
    return response.data;
  },
};

export default notificationsApi;
