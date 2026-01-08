/**
 * Social Media API Service
 * Social media scheduling, posting, and analytics
 */

import { api } from '@/lib/api';

export interface SocialAccount {
  id: number;
  workspace_id: number;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube' | 'pinterest';
  account_type: 'page' | 'profile' | 'business' | 'creator';
  platform_account_id: string;
  account_name: string | null;
  account_username: string | null;
  account_url: string | null;
  avatar_url: string | null;
  status: 'connected' | 'expired' | 'error' | 'disconnected';
  is_active: boolean;
  can_post: boolean;
  can_read_insights: boolean;
  can_read_messages: boolean;
  followers_count: number | null;
  following_count: number | null;
  posts_count: number | null;
  last_sync_at: string | null;
  created_at: string;
}

export interface SocialPost {
  id: number;
  workspace_id: number;
  content: string;
  media_urls: string[];
  media_type: 'none' | 'image' | 'video' | 'carousel' | 'link';
  link_url: string | null;
  link_title: string | null;
  link_description: string | null;
  link_image: string | null;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';
  scheduled_at: string | null;
  published_at: string | null;
  target_accounts: number[];
  platform_settings: Record<string, unknown> | null;
  publish_results: Record<string, { success: boolean; platform_post_id?: string; error?: string }> | null;
  error_message: string | null;
  campaign_id: number | null;
  category: string | null;
  requires_approval: boolean;
  approved_by: number | null;
  approved_at: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  analytics?: SocialPostAnalytics[];
}

export interface SocialPostAnalytics {
  id: number;
  post_id: number;
  social_account_id: number;
  platform_post_id: string | null;
  platform_post_url: string | null;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  video_views: number;
  engagement_rate: number | null;
  platform?: string;
  account_name?: string;
}

export interface SocialCategory {
  id: number;
  workspace_id: number;
  name: string;
  color: string;
  description: string | null;
  default_times: Array<{ day_of_week: number; time: string }> | null;
  is_active: boolean;
  sort_order: number;
}

export interface SocialTemplate {
  id: number;
  workspace_id: number;
  name: string;
  content: string;
  media_urls: string[];
  platforms: string[] | null;
  category_id: number | null;
  use_count: number;
  created_by: number | null;
  created_at: string;
}

export interface HashtagGroup {
  id: number;
  workspace_id: number;
  name: string;
  hashtags: string[];
  platforms: string[] | null;
  use_count: number;
}

export interface SocialAnalytics {
  posts: {
    total_posts: number;
    published: number;
    scheduled: number;
    drafts: number;
  };
  engagement: {
    total_impressions: number;
    total_reach: number;
    total_likes: number;
    total_comments: number;
    total_shares: number;
    total_clicks: number;
    total_engagement: number;
    avg_engagement_rate: number;
  };
  by_platform: Array<{
    platform: string;
    post_count: number;
    impressions: number;
    engagement: number;
  }>;
  period: { from: string; to: string };
}

export const socialApi = {
  // ==================== ACCOUNTS ====================

  async getAccounts(): Promise<SocialAccount[]> {
    const response = await api.get('/social/accounts') as { data: SocialAccount[] };
    return response.data;
  },

  async disconnectAccount(id: number): Promise<void> {
    await api.post(`/social/accounts/${id}/disconnect`, {});
  },

  // ==================== POSTS ====================

  async getPosts(params: {
    status?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ data: SocialPost[]; meta: { total: number; limit: number; offset: number } }> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));
    const query = searchParams.toString();
    const response = await api.get(`/social/posts${query ? `?${query}` : ''}`) as { data: SocialPost[]; meta: any };
    return response;
  },

  async getPost(id: number): Promise<SocialPost> {
    const response = await api.get(`/social/posts/${id}`) as { data: SocialPost };
    return response.data;
  },

  async createPost(data: {
    content: string;
    target_accounts: number[];
    media_urls?: string[];
    media_type?: SocialPost['media_type'];
    link_url?: string;
    link_title?: string;
    link_description?: string;
    link_image?: string;
    scheduled_at?: string;
    platform_settings?: Record<string, unknown>;
    campaign_id?: number;
    category?: string;
    requires_approval?: boolean;
    publish_now?: boolean;
  }): Promise<{ id: number }> {
    const response = await api.post('/social/posts', data) as { data: { id: number } };
    return response.data;
  },

  async updatePost(id: number, data: Partial<Omit<SocialPost, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>): Promise<void> {
    await api.put(`/social/posts/${id}`, data);
  },

  async deletePost(id: number): Promise<void> {
    await api.delete(`/social/posts/${id}`);
  },

  async publishPost(id: number): Promise<{ success: boolean; results: Record<string, unknown> }> {
    const response = await api.post(`/social/posts/${id}/publish`, {}) as any;
    return response;
  },

  // ==================== CATEGORIES ====================

  async getCategories(): Promise<SocialCategory[]> {
    const response = await api.get('/social/categories') as { data: SocialCategory[] };
    return response.data;
  },

  async createCategory(data: {
    name: string;
    color?: string;
    description?: string;
    default_times?: Array<{ day_of_week: number; time: string }>;
    sort_order?: number;
  }): Promise<{ id: number }> {
    const response = await api.post('/social/categories', data) as { data: { id: number } };
    return response.data;
  },

  // ==================== TEMPLATES ====================

  async getTemplates(): Promise<SocialTemplate[]> {
    const response = await api.get('/social/templates') as { data: SocialTemplate[] };
    return response.data;
  },

  async createTemplate(data: {
    name: string;
    content: string;
    media_urls?: string[];
    platforms?: string[];
    category_id?: number;
  }): Promise<{ id: number }> {
    const response = await api.post('/social/templates', data) as { data: { id: number } };
    return response.data;
  },

  // ==================== HASHTAG GROUPS ====================

  async getHashtagGroups(): Promise<HashtagGroup[]> {
    const response = await api.get('/social/hashtag-groups') as { data: HashtagGroup[] };
    return response.data;
  },

  async createHashtagGroup(data: {
    name: string;
    hashtags: string[];
    platforms?: string[];
  }): Promise<{ id: number }> {
    const response = await api.post('/social/hashtag-groups', data) as { data: { id: number } };
    return response.data;
  },

  // ==================== ANALYTICS ====================

  async getAnalytics(params: { from?: string; to?: string } = {}): Promise<SocialAnalytics> {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    const query = searchParams.toString();
    const response = await api.get(`/social/analytics${query ? `?${query}` : ''}`) as { data: SocialAnalytics };
    return response.data;
  },

  async bulkImport(posts: any[]): Promise<{ success: boolean; message: string }> {
    return await api.post('/social/bulk-import', { posts }) as any;
  },

  async generateAIContent(prompt: string, platform?: string): Promise<{ content: string }> {
    return await api.post('/social/ai/generate', { prompt, platform }) as any;
  },

  async getOAuthUrl(platform: string): Promise<{ auth_url: string }> {
    return await api.get(`/social/oauth/${platform}`) as any;
  },

  async handleOAuthCallback(code: string, platform: string): Promise<void> {
    await api.post('/social/oauth/callback', { code, platform });
  },
};

export default socialApi;
