import api from '@/lib/api';

export interface Membership {
  id: number;
  workspace_id: number;
  name: string;
  slug?: string;
  description?: string;
  access_type: 'free' | 'paid' | 'subscription';
  price?: number;
  currency: string;
  billing_interval: 'one_time' | 'monthly' | 'yearly';
  trial_days: number;
  welcome_message?: string;
  status: 'draft' | 'active' | 'archived';
  created_at: string;
  updated_at: string;
  content_count?: number;
  active_members?: number;
  content?: MembershipContent[];
  stats?: {
    total_members: number;
    active: number;
    expired: number;
    avg_progress: number;
  };
}

export interface MembershipContent {
  id: number;
  membership_id: number;
  title: string;
  content_type: 'module' | 'lesson' | 'video' | 'file' | 'quiz';
  parent_id?: number;
  sort_order: number;
  content?: string;
  video_url?: string;
  file_url?: string;
  duration_minutes?: number;
  drip_enabled: boolean;
  drip_days: number;
  is_published: boolean;
  children?: MembershipContent[];
}

export interface MemberAccess {
  id: number;
  membership_id: number;
  contact_id: number;
  status: 'active' | 'expired' | 'cancelled' | 'paused';
  access_granted_at: string;
  access_expires_at?: string;
  payment_id?: number;
  subscription_id?: number;
  last_accessed_at?: string;
  completed_content_ids?: number[];
  progress_percent: number;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export const membershipsApi = {
  list: async (status?: 'draft' | 'active' | 'archived') => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/memberships${params}`);
    return response.data;
  },

  get: async (id: number) => {
    const response = await api.get(`/memberships/${id}`);
    return response.data;
  },

  create: async (data: Partial<Membership>) => {
    const response = await api.post('/memberships', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Membership>) => {
    const response = await api.put(`/memberships/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/memberships/${id}`);
    return response.data;
  },

  // Content management
  addContent: async (membershipId: number, content: Partial<MembershipContent>) => {
    const response = await api.post(`/memberships/${membershipId}/content`, content);
    return response.data;
  },

  updateContent: async (membershipId: number, contentId: number, content: Partial<MembershipContent>) => {
    const response = await api.put(`/memberships/${membershipId}/content/${contentId}`, content);
    return response.data;
  },

  deleteContent: async (membershipId: number, contentId: number) => {
    const response = await api.delete(`/memberships/${membershipId}/content/${contentId}`);
    return response.data;
  },

  // Member access
  getMembers: async (membershipId: number, status?: string) => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/memberships/${membershipId}/members${params}`);
    return response.data;
  },

  grantAccess: async (membershipId: number, data: { contact_id: number; payment_id?: number; subscription_id?: number }) => {
    const response = await api.post(`/memberships/${membershipId}/members`, data);
    return response.data;
  },

  revokeAccess: async (membershipId: number, accessId: number) => {
    const response = await api.delete(`/memberships/${membershipId}/members/${accessId}`);
    return response.data;
  },

  updateProgress: async (membershipId: number, accessId: number, completedContentIds: number[]) => {
    const response = await api.post(`/memberships/${membershipId}/members/${accessId}/progress`, {
      completed_content_ids: completedContentIds,
    });
    return response.data;
  },
};

export default membershipsApi;
