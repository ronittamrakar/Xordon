/**
 * Review Response API
 * Manage and respond to reviews across Google, Facebook, Yelp, and more
 */

import { api } from '@/lib/api';

// ============================================
// TYPES
// ============================================

export type ReviewPlatform = 'google' | 'facebook' | 'yelp' | 'tripadvisor' | 'bbb' | 'angi' | 'thumbtack' | 'nextdoor' | 'trustpilot';
export type ReviewRating = 1 | 2 | 3 | 4 | 5;
export type ReviewSentiment = 'positive' | 'neutral' | 'negative';

export interface PlatformConnection {
    id: string;
    workspace_id: string;
    platform: ReviewPlatform;
    account_id: string;
    account_name: string;
    location_id?: string;
    location_name?: string;
    connected: boolean;
    last_synced_at?: string;
    can_respond: boolean;
    error_message?: string;
    created_at: string;
}

export interface Review {
    id: string;
    workspace_id: string;
    platform: ReviewPlatform;
    platform_review_id: string;
    connection_id: string;

    // Reviewer info
    reviewer_name: string;
    reviewer_avatar_url?: string;
    reviewer_profile_url?: string;

    // Review content
    rating: ReviewRating;
    title?: string;
    content: string;
    review_url: string;
    review_date: string;

    // Analysis
    sentiment: ReviewSentiment;
    keywords?: string[];

    // Response
    has_response: boolean;
    response?: ReviewResponse;

    // Internal tracking
    is_read: boolean;
    is_flagged: boolean;
    contact_id?: string; // linked contact
    notes?: string;
    tags?: string[];

    created_at: string;
    updated_at: string;
}

export interface ReviewResponse {
    id: string;
    content: string;
    responded_by: string;
    responded_by_name: string;
    responded_at: string;
    platform_response_id?: string;
    status: 'draft' | 'pending' | 'published' | 'failed';
    error_message?: string;
}

export interface AIResponseSuggestion {
    id: string;
    content: string;
    tone: 'professional' | 'friendly' | 'apologetic' | 'grateful';
    confidence: number;
}

export interface ReviewStats {
    total_reviews: number;
    average_rating: number;
    reviews_by_rating: Record<ReviewRating, number>;
    reviews_by_platform: Record<ReviewPlatform, number>;
    reviews_by_sentiment: Record<ReviewSentiment, number>;
    response_rate: number;
    avg_response_time_hours: number;
    recent_trend: 'improving' | 'stable' | 'declining';
}

export interface ReviewFilter {
    platforms?: ReviewPlatform[];
    ratings?: ReviewRating[];
    sentiments?: ReviewSentiment[];
    has_response?: boolean;
    is_read?: boolean;
    is_flagged?: boolean;
    date_from?: string;
    date_to?: string;
    search?: string;
    tags?: string[];
}

// ============================================
// PLATFORM CONNECTIONS
// ============================================

/**
 * Get OAuth URL for connecting a review platform
 */
export async function getOAuthUrl(
    platform: ReviewPlatform,
    redirectUrl?: string
): Promise<{ url: string; state: string }> {
    const response = await api.post('/reviews/oauth/url', {
        platform,
        redirect_url: redirectUrl,
    });
    return response;
}

/**
 * Complete OAuth connection
 */
export async function completeOAuth(
    platform: ReviewPlatform,
    code: string,
    state: string
): Promise<PlatformConnection> {
    const response = await api.post('/reviews/oauth/callback', {
        platform,
        code,
        state,
    });
    return response;
}

/**
 * List connected platforms
 */
export async function listConnections(): Promise<PlatformConnection[]> {
    const response = await api.get('/reviews/connections');
    return response;
}

/**
 * Get a specific connection
 */
export async function getConnection(id: string): Promise<PlatformConnection> {
    const response = await api.get(`/reviews/connections/${id}`);
    return response;
}

/**
 * Disconnect a platform
 */
export async function disconnectPlatform(id: string): Promise<void> {
    await api.delete(`/reviews/connections/${id}`);
}

/**
 * Sync reviews from a platform
 */
export async function syncPlatform(id: string): Promise<{
    new_reviews: number;
    updated: number;
}> {
    const response = await api.post(`/reviews/connections/${id}/sync`);
    return response;
}

/**
 * Sync all connected platforms
 */
export async function syncAllPlatforms(): Promise<{
    results: { connection_id: string; new_reviews: number; updated: number }[];
}> {
    const response = await api.post('/reviews/sync-all');
    return response;
}

// ============================================
// REVIEWS
// ============================================

/**
 * List reviews with filters
 */
export async function listReviews(
    filter?: ReviewFilter,
    params?: { page?: number; limit?: number; sort?: string }
): Promise<{ data: Review[]; total: number; page: number }> {
    const response = await api.get('/reviews', {
        params: { ...filter, ...params },
    });
    return response;
}

/**
 * Get a specific review
 */
export async function getReview(id: string): Promise<Review> {
    const response = await api.get(`/reviews/${id}`);
    return response;
}

/**
 * Mark review as read
 */
export async function markAsRead(id: string): Promise<void> {
    await api.put(`/reviews/${id}/read`);
}

/**
 * Mark multiple reviews as read
 */
export async function markMultipleAsRead(ids: string[]): Promise<void> {
    await api.put('/reviews/bulk/read', { ids });
}

/**
 * Flag/unflag a review
 */
export async function toggleFlag(id: string): Promise<Review> {
    const response = await api.put(`/reviews/${id}/flag`);
    return response;
}

/**
 * Add note to a review
 */
export async function addNote(id: string, note: string): Promise<Review> {
    const response = await api.put(`/reviews/${id}/note`, { note });
    return response;
}

/**
 * Add tags to a review
 */
export async function updateTags(id: string, tags: string[]): Promise<Review> {
    const response = await api.put(`/reviews/${id}/tags`, { tags });
    return response;
}

/**
 * Link review to a contact
 */
export async function linkToContact(
    id: string,
    contactId: string
): Promise<Review> {
    const response = await api.put(`/reviews/${id}/contact`, {
        contact_id: contactId,
    });
    return response;
}

// ============================================
// RESPONSES
// ============================================

/**
 * Get AI-suggested responses
 */
export async function getAISuggestions(
    id: string,
    tones?: ('professional' | 'friendly' | 'apologetic' | 'grateful')[]
): Promise<AIResponseSuggestion[]> {
    const response = await api.post(`/reviews/${id}/ai-suggestions`, { tones });
    return response;
}

/**
 * Save response as draft
 */
export async function saveDraft(id: string, content: string): Promise<Review> {
    const response = await api.post(`/reviews/${id}/response/draft`, { content });
    return response;
}

/**
 * Publish response to platform
 */
export async function publishResponse(
    id: string,
    content: string
): Promise<Review> {
    const response = await api.post(`/reviews/${id}/response/publish`, { content });
    return response;
}

/**
 * Update published response (if platform supports)
 */
export async function updateResponse(
    id: string,
    content: string
): Promise<Review> {
    const response = await api.put(`/reviews/${id}/response`, { content });
    return response;
}

/**
 * Delete response (if platform supports)
 */
export async function deleteResponse(id: string): Promise<Review> {
    const response = await api.delete(`/reviews/${id}/response`);
    return response;
}

// ============================================
// STATISTICS
// ============================================

/**
 * Get review statistics
 */
export async function getStats(params?: {
    date_from?: string;
    date_to?: string;
    platforms?: ReviewPlatform[];
}): Promise<ReviewStats> {
    const response = await api.get('/reviews/stats', { params });
    return response;
}

/**
 * Get rating trend over time
 */
export async function getRatingTrend(params?: {
    period?: 'week' | 'month' | 'quarter' | 'year';
    platforms?: ReviewPlatform[];
}): Promise<{
    data: { date: string; average_rating: number; count: number }[];
}> {
    const response = await api.get('/reviews/trends/rating', { params });
    return response;
}

/**
 * Get review volume trend
 */
export async function getVolumeTrend(params?: {
    period?: 'week' | 'month' | 'quarter' | 'year';
    platforms?: ReviewPlatform[];
}): Promise<{
    data: { date: string; count: number; by_rating: Record<ReviewRating, number> }[];
}> {
    const response = await api.get('/reviews/trends/volume', { params });
    return response;
}

/**
 * Get common keywords/topics from reviews
 */
export async function getKeywords(params?: {
    sentiment?: ReviewSentiment;
    limit?: number;
}): Promise<{ keyword: string; count: number; sentiment: ReviewSentiment }[]> {
    const response = await api.get('/reviews/keywords', { params });
    return response;
}

// ============================================
// RESPONSE TEMPLATES
// ============================================

export interface ResponseTemplate {
    id: string;
    workspace_id: string;
    name: string;
    content: string;
    rating_range?: { min: ReviewRating; max: ReviewRating };
    sentiment?: ReviewSentiment;
    platforms?: ReviewPlatform[];
    variables: string[]; // e.g., ['{customer_name}', '{business_name}']
    created_at: string;
}

/**
 * List response templates
 */
export async function listTemplates(): Promise<ResponseTemplate[]> {
    const response = await api.get('/reviews/templates');
    return response;
}

/**
 * Create response template
 */
export async function createTemplate(data: {
    name: string;
    content: string;
    rating_range?: { min: ReviewRating; max: ReviewRating };
    sentiment?: ReviewSentiment;
    platforms?: ReviewPlatform[];
}): Promise<ResponseTemplate> {
    const response = await api.post('/reviews/templates', data);
    return response;
}

/**
 * Update response template
 */
export async function updateTemplate(
    id: string,
    data: Partial<Omit<ResponseTemplate, 'id' | 'workspace_id' | 'created_at'>>
): Promise<ResponseTemplate> {
    const response = await api.put(`/reviews/templates/${id}`, data);
    return response;
}

/**
 * Delete response template
 */
export async function deleteTemplate(id: string): Promise<void> {
    await api.delete(`/reviews/templates/${id}`);
}

/**
 * Apply template to review (replace variables)
 */
export async function applyTemplate(
    templateId: string,
    reviewId: string
): Promise<{ content: string }> {
    const response = await api.post(`/reviews/templates/${templateId}/apply`, {
        review_id: reviewId,
    });
    return response;
}

// ============================================
// SETTINGS
// ============================================

export interface ReviewSettings {
    auto_sync_enabled: boolean;
    auto_sync_interval_hours: number;
    notification_new_review: boolean;
    notification_negative_review: boolean;
    notification_channels: ('email' | 'sms' | 'push')[];
    auto_response_enabled: boolean;
    auto_response_min_rating: ReviewRating;
    auto_response_template_id?: string;
    default_response_tone: 'professional' | 'friendly';
}

/**
 * Get review settings
 */
export async function getSettings(): Promise<ReviewSettings> {
    const response = await api.get('/reviews/settings');
    return response;
}

/**
 * Update review settings
 */
export async function updateSettings(
    settings: Partial<ReviewSettings>
): Promise<ReviewSettings> {
    const response = await api.put('/reviews/settings', settings);
    return response;
}

export default {
    // Connections
    getOAuthUrl,
    completeOAuth,
    listConnections,
    getConnection,
    disconnectPlatform,
    syncPlatform,
    syncAllPlatforms,

    // Reviews
    listReviews,
    getReview,
    markAsRead,
    markMultipleAsRead,
    toggleFlag,
    addNote,
    updateTags,
    linkToContact,

    // Responses
    getAISuggestions,
    saveDraft,
    publishResponse,
    updateResponse,
    deleteResponse,

    // Statistics
    getStats,
    getRatingTrend,
    getVolumeTrend,
    getKeywords,

    // Templates
    listTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate,

    // Settings
    getSettings,
    updateSettings,
};
