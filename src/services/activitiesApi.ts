/**
 * Activities / Timeline API Service
 * Universal activity log for all entities
 */

import { api } from '@/lib/api';

export interface Activity {
  id: number;
  workspace_id: number;
  company_id: number | null;
  user_id: number | null;
  user_name: string | null;
  entity_type: string;
  entity_id: number;
  related_entity_type: string | null;
  related_entity_id: number | null;
  activity_type: string;
  title: string;
  description: string | null;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  metadata: Record<string, unknown> | null;
  is_system: boolean;
  is_pinned: boolean;
  is_internal: boolean;
  comment_count?: number;
  created_at: string;
}

export interface ActivityComment {
  id: number;
  activity_id: number;
  user_id: number;
  user_name: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface ActivitiesListParams {
  entity_type?: string;
  user_id?: number;
  activity_type?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export const activitiesApi = {
  /**
   * List all recent activities in workspace
   */
  async list(params: ActivitiesListParams = {}): Promise<{ data: Activity[]; meta: { limit: number; offset: number } }> {
    const searchParams = new URLSearchParams();
    if (params.entity_type) searchParams.set('entity_type', params.entity_type);
    if (params.user_id) searchParams.set('user_id', String(params.user_id));
    if (params.activity_type) searchParams.set('activity_type', params.activity_type);
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    
    const query = searchParams.toString();
    const response = await api.get(`/activities${query ? `?${query}` : ''}`) as { data: Activity[]; meta: { limit: number; offset: number } };
    return response;
  },

  /**
   * Get activities for a specific entity
   */
  async forEntity(entityType: string, entityId: number, params: { activity_type?: string; limit?: number; offset?: number } = {}): Promise<{ data: Activity[]; meta: { total: number; limit: number; offset: number } }> {
    const searchParams = new URLSearchParams();
    if (params.activity_type) searchParams.set('activity_type', params.activity_type);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    
    const query = searchParams.toString();
    const response = await api.get(`/activities/entity/${entityType}/${entityId}${query ? `?${query}` : ''}`) as { data: Activity[]; meta: { total: number; limit: number; offset: number } };
    return response;
  },

  /**
   * Create activity (manual note/comment)
   */
  async create(data: {
    entity_type: string;
    entity_id: number;
    title: string;
    description?: string;
    activity_type?: string;
    company_id?: number;
    related_entity_type?: string;
    related_entity_id?: number;
    metadata?: Record<string, unknown>;
    is_pinned?: boolean;
    is_internal?: boolean;
  }): Promise<{ id: number }> {
    const response = await api.post('/activities', data) as { data: { id: number } };
    return response.data;
  },

  /**
   * Toggle pin on activity
   */
  async togglePin(id: number): Promise<void> {
    await api.post(`/activities/${id}/pin`, {});
  },

  /**
   * Get comments for an activity
   */
  async getComments(activityId: number): Promise<ActivityComment[]> {
    const response = await api.get(`/activities/${activityId}/comments`) as { data: ActivityComment[] };
    return response.data;
  },

  /**
   * Add comment to activity
   */
  async addComment(activityId: number, body: string): Promise<{ id: number }> {
    const response = await api.post(`/activities/${activityId}/comments`, { body }) as { data: { id: number } };
    return response.data;
  },
};

export default activitiesApi;
