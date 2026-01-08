import api from '@/lib/api';

export interface SocialAccount {
    id: number;
    platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok';
    external_id: string;
    name: string;
    avatar_url: string | null;
    status: 'active' | 'expired' | 'error' | 'disconnected';
    last_sync_at: string | null;
}

export interface SocialPost {
    id: number;
    content: string;
    media_urls: string[] | null;
    status: 'draft' | 'scheduled' | 'published' | 'failed' | 'archived' | 'trashed';
    created_by_name: string;
    published_at: string | null;
    distribution_count: number;
    published_count: number;
    created_at: string;
}

export interface CalendarEvent {
    id: number;
    title: string;
    content_type: 'post' | 'story' | 'reel' | 'video' | 'carousel' | 'event';
    planned_date: string;
    platforms: string[] | null;
    notes: string | null;
    status: 'idea' | 'drafting' | 'ready' | 'scheduled' | 'published' | 'archived' | 'trashed';
    color: string;
}

export interface SocialAnalytics {
    platform: string;
    total_likes: number;
    total_comments: number;
    total_shares: number;
    total_reach: number;
    total_impressions: number;
    avg_engagement: number;
}

export const socialMediaApi = {
    // Accounts
    getAccounts: async (): Promise<SocialAccount[]> => {
        const response = await api.get('/growth/social/accounts') as { data: { data: SocialAccount[] } };
        return response.data.data;
    },
    addAccount: async (data: Partial<SocialAccount>) => {
        const response = await api.post('/growth/social/accounts', data) as { data: { data: { id: number } } };
        return response.data;
    },

    // Posts
    getPosts: async (params?: { status?: string }): Promise<SocialPost[]> => {
        const response = await api.get('/growth/social/posts', { params }) as { data: { data: SocialPost[] } };
        return response.data.data;
    },
    createPost: async (data: {
        content: string;
        media_urls?: string[];
        accounts?: { id: number, platform: string }[];
        scheduled_for?: string;
    }) => {
        const response = await api.post('/growth/social/posts', data) as { data: { data: { id: number } } };
        return response.data;
    },
    updatePost: async (id: number | string, data: Partial<SocialPost>) => {
        const response = await api.put(`/growth/social/posts/${id}`, data) as { data: { data: SocialPost } };
        return response.data;
    },
    deletePost: async (id: number | string) => {
        const response = await api.delete(`/growth/social/posts/${id}`) as { data: { success: boolean } };
        return response.data;
    },

    // Calendar
    getCalendar: async (): Promise<CalendarEvent[]> => {
        const response = await api.get('/growth/social/calendar') as { data: { data: CalendarEvent[] } };
        return response.data.data;
    },
    addToCalendar: async (data: Partial<CalendarEvent>) => {
        const response = await api.post('/growth/social/calendar', data) as { data: { data: { id: number } } };
        return response.data;
    },

    // Analytics
    getAnalytics: async (): Promise<SocialAnalytics[]> => {
        const response = await api.get('/growth/social/analytics') as { data: { data: SocialAnalytics[] } };
        return response.data.data;
    }
};
