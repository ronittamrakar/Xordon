/**
 * Reputation API Service
 * Handles all API calls for the reputation management module
 */

import { api } from '@/lib/api';

export interface Review {
    id: number;
    workspace_id: number;
    contact_id?: number;
    platform: string;
    rating: number;
    author_name: string;
    author_email?: string;
    review_text?: string;
    review_date: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    replied: boolean;
    reply_text?: string;
    reply_date?: string;
    is_spam: boolean;
    source_url?: string;
    created_at: string;
    updated_at: string;
}

export interface ReviewRequest {
    id: number;
    workspace_id: number;
    contact_id: number;
    contact_name: string;
    contact_email?: string;
    contact_phone?: string;
    status: 'pending' | 'sent' | 'opened' | 'clicked' | 'completed' | 'failed';
    channel: 'email' | 'sms' | 'whatsapp';
    template_id?: number;
    sent_at?: string;
    opened_at?: string;
    clicked_at?: string;
    completed_at?: string;
    retry_count: number;
    max_retries: number;
    next_retry_at?: string;
    created_at: string;
    updated_at: string;
}

export interface ReviewWidget {
    id: number;
    workspace_id: number;
    name: string;
    type: string;
    platforms: string[];
    min_rating: number;
    max_reviews: number;
    show_ai_summary: boolean;
    design_settings: Record<string, any>;
    embed_code: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface AIAgent {
    id: number;
    workspace_id: number;
    name: string;
    instructions: string;
    tone: string[];
    language: string;
    review_sources: string[];
    review_types: string[];
    footer: string;
    is_active: boolean;
    response_count: number;
    created_at: string;
    updated_at: string;
}

export interface ReviewTemplate {
    id: number;
    workspace_id: number;
    name: string;
    type: string;
    channel: 'email' | 'sms' | 'whatsapp';
    subject?: string;
    message: string;
    variables: Record<string, any>;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface ReputationSettings {
    id: number;
    workspace_id: number;
    ai_mode: 'off' | 'suggestive' | 'auto';
    drip_mode_enabled: boolean;
    review_link?: string;
    review_balancing_enabled: boolean;
    review_platforms: string[];
    sms_enabled: boolean;
    sms_timing: string;
    sms_repeat: string;
    sms_max_retries: number;
    email_enabled: boolean;
    email_timing: string;
    email_repeat: string;
    email_max_retries: number;
    whatsapp_enabled: boolean;
    spam_detection_enabled: boolean;
    created_at: string;
    updated_at: string;
}

export interface BusinessListing {
    id: number;
    workspace_id: number;
    platform: string;
    business_name: string;
    address?: string;
    phone?: string;
    website?: string;
    status: 'pending' | 'active' | 'inactive';
    listing_url?: string;
    is_verified: boolean;
    sync_enabled: boolean;
    last_synced_at?: string;
    created_at: string;
    updated_at: string;
}

export interface ReputationStats {
    invitesGoal: number;
    invitesSent: number;
    reviewsReceived: number;
    reviewsChange: number;
    averageRating: number;
    ratingChange: number;
    responseRate: number;
    sentiment: {
        positive: number;
        neutral: number;
        negative: number;
    };
    ratingBreakdown: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
    };
}

// Reviews API
export const reputationApi = {
    // Overview & Stats
    getStats: async (timeRange: string = '6m'): Promise<ReputationStats> => {
        const response = await api.get(`/reputation/stats?timeRange=${timeRange}`);
        return response.data;
    },

    // Reviews
    getReviews: async (params?: {
        platform?: string;
        rating?: number;
        sentiment?: string;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{ reviews: Review[]; total: number; page: number; limit: number }> => {
        const response = await api.get('/reputation/reviews', { params });
        return response.data;
    },

    getReview: async (id: number): Promise<Review> => {
        const response = await api.get(`/reputation/reviews/${id}`);
        return response.data;
    },

    replyToReview: async (id: number, replyText: string): Promise<Review> => {
        const response = await api.post(`/reputation/reviews/${id}/reply`, { reply_text: replyText });
        return response.data;
    },

    markAsSpam: async (id: number, isSpam: boolean): Promise<Review> => {
        const response = await api.patch(`/reputation/reviews/${id}`, { is_spam: isSpam });
        return response.data;
    },

    deleteReview: async (id: number): Promise<void> => {
        await api.delete(`/reputation/reviews/${id}`);
    },

    // Review Requests
    getRequests: async (params?: {
        status?: string;
        channel?: string;
        page?: number;
        limit?: number;
    }): Promise<{ requests: ReviewRequest[]; total: number; page: number; limit: number }> => {
        const response = await api.get('/reputation/requests', { params });
        return response.data;
    },

    createRequest: async (data: {
        contact_id: number;
        contact_name: string;
        contact_email?: string;
        contact_phone?: string;
        channel: 'email' | 'sms' | 'whatsapp';
        template_id?: number;
    }): Promise<ReviewRequest> => {
        const response = await api.post('/reputation/requests', data);
        return response.data;
    },

    sendRequest: async (id: number): Promise<ReviewRequest> => {
        const response = await api.post(`/reputation/requests/${id}/send`);
        return response.data;
    },

    retryRequest: async (id: number): Promise<ReviewRequest> => {
        const response = await api.post(`/reputation/requests/${id}/retry`);
        return response.data;
    },

    deleteRequest: async (id: number): Promise<void> => {
        await api.delete(`/reputation/requests/${id}`);
    },

    // Widgets
    getWidgets: async (): Promise<ReviewWidget[]> => {
        const response = await api.get('/reputation/widgets');
        return response.data;
    },

    getWidget: async (id: number): Promise<ReviewWidget> => {
        const response = await api.get(`/reputation/widgets/${id}`);
        return response.data;
    },

    createWidget: async (data: Partial<ReviewWidget>): Promise<ReviewWidget> => {
        const response = await api.post('/reputation/widgets', data);
        return response.data;
    },

    updateWidget: async (id: number, data: Partial<ReviewWidget>): Promise<ReviewWidget> => {
        const response = await api.patch(`/reputation/widgets/${id}`, data);
        return response.data;
    },

    deleteWidget: async (id: number): Promise<void> => {
        await api.delete(`/reputation/widgets/${id}`);
    },

    generateEmbedCode: async (id: number): Promise<{ embed_code: string }> => {
        const response = await api.get(`/reputation/widgets/${id}/embed-code`);
        return response.data;
    },

    // AI Agents
    getAgents: async (): Promise<AIAgent[]> => {
        const response = await api.get('/reputation/ai-agents');
        return response.data;
    },

    getAgent: async (id: number): Promise<AIAgent> => {
        const response = await api.get(`/reputation/ai-agents/${id}`);
        return response.data;
    },

    createAgent: async (data: Partial<AIAgent>): Promise<AIAgent> => {
        const response = await api.post('/reputation/ai-agents', data);
        return response.data;
    },

    updateAgent: async (id: number, data: Partial<AIAgent>): Promise<AIAgent> => {
        const response = await api.patch(`/reputation/ai-agents/${id}`, data);
        return response.data;
    },

    deleteAgent: async (id: number): Promise<void> => {
        await api.delete(`/reputation/ai-agents/${id}`);
    },

    generateAIResponse: async (agentId: number, reviewText: string): Promise<{ response: string }> => {
        const response = await api.post(`/reputation/ai-agents/${agentId}/generate`, { review_text: reviewText });
        return response.data;
    },

    // Templates
    getTemplates: async (params?: {
        type?: string;
        channel?: string;
    }): Promise<ReviewTemplate[]> => {
        const response = await api.get('/reputation/templates', { params });
        return response.data;
    },

    getTemplate: async (id: number): Promise<ReviewTemplate> => {
        const response = await api.get(`/reputation/templates/${id}`);
        return response.data;
    },

    createTemplate: async (data: Partial<ReviewTemplate>): Promise<ReviewTemplate> => {
        const response = await api.post('/reputation/templates', data);
        return response.data;
    },

    updateTemplate: async (id: number, data: Partial<ReviewTemplate>): Promise<ReviewTemplate> => {
        const response = await api.patch(`/reputation/templates/${id}`, data);
        return response.data;
    },

    deleteTemplate: async (id: number): Promise<void> => {
        await api.delete(`/reputation/templates/${id}`);
    },

    // Settings
    getSettings: async (): Promise<{ settings: any; ai_agents: AIAgent[]; templates: ReviewTemplate[] }> => {
        const response = await api.get('/reputation/settings');
        return response.data;
    },

    updateSettings: async (data: Partial<ReputationSettings>): Promise<ReputationSettings> => {
        const response = await api.patch('/reputation/settings', data);
        return response.data;
    },

    // Business Listings
    getListings: async (): Promise<{ data: BusinessListing[]; pagination: any }> => {
        const response = await api.get('/reputation/listings');
        return response.data;
    },

    getListing: async (id: number): Promise<BusinessListing> => {
        const response = await api.get(`/reputation/listings/${id}`);
        return response.data;
    },

    createListing: async (data: Partial<BusinessListing>): Promise<BusinessListing> => {
        const response = await api.post('/reputation/listings', data);
        return response.data;
    },

    updateListing: async (id: number, data: Partial<BusinessListing>): Promise<BusinessListing> => {
        const response = await api.patch(`/reputation/listings/${id}`, data);
        return response.data;
    },

    deleteListing: async (id: number): Promise<void> => {
        await api.delete(`/reputation/listings/${id}`);
    },

    syncListing: async (id: number): Promise<BusinessListing> => {
        const response = await api.post(`/reputation/listings/${id}/sync`);
        return response.data;
    },

    // Integrations
    getIntegrations: async (): Promise<any[]> => {
        const response = await api.get('/reputation/integrations');
        return response.data;
    },

    connectIntegration: async (platform: string, credentials: Record<string, any>): Promise<any> => {
        const response = await api.post('/reputation/integrations/connect', { platform, credentials });
        return response.data;
    },

    disconnectIntegration: async (platform: string): Promise<void> => {
        await api.delete(`/reputation/integrations/${platform}`);
    },
};

export default reputationApi;
