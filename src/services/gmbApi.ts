/**
 * Google Business Profile (GMB) API Service
 * Comprehensive GBP/GMB management including connection, locations, posts, reviews, Q&A, insights
 */

import { api } from '@/lib/api';

// ==================== TYPES ====================

export interface GMBConnection {
    id: number;
    workspace_id: number;
    company_id: number | null;
    google_account_id: string | null;
    google_email: string | null;
    google_name: string | null;
    google_avatar_url: string | null;
    status: 'pending' | 'connected' | 'expired' | 'revoked' | 'error';
    connection_error: string | null;
    scopes: string[] | null;
    connected_at: string | null;
    last_sync_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface GMBLocation {
    id: number;
    workspace_id: number;
    company_id: number | null;
    connection_id: number;
    google_location_id: string;
    google_place_id: string | null;
    maps_url: string | null;
    business_name: string;
    store_code: string | null;
    address_line_1: string | null;
    address_line_2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string;
    latitude: number | null;
    longitude: number | null;
    primary_phone: string | null;
    additional_phones: string[] | null;
    website_url: string | null;
    primary_category_id: string | null;
    primary_category_name: string | null;
    additional_categories: Array<{ id: string; name: string }> | null;
    description: string | null;
    opening_date: string | null;
    verification_status: 'unverified' | 'pending' | 'verified' | 'suspended';
    verification_method: string | null;
    is_published: boolean;
    is_suspended: boolean;
    suspension_reason: string | null;
    labels: string[] | null;
    total_reviews: number;
    average_rating: number | null;
    total_photos: number;
    last_sync_at: string | null;
    sync_status: 'synced' | 'syncing' | 'error' | 'pending';
    sync_error: string | null;
    created_at: string;
    updated_at: string;
}

export interface GMBBusinessHours {
    id: number;
    location_id: number;
    hours_type: 'regular' | 'special' | 'holiday';
    day_of_week: number | null;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
    is_24_hours: boolean;
    special_date: string | null;
    special_name: string | null;
}

export interface GMBService {
    id: number;
    location_id: number;
    service_type_id: string | null;
    service_name: string;
    description: string | null;
    price_type: 'free' | 'fixed' | 'from' | 'range' | 'no_price';
    price_min: number | null;
    price_max: number | null;
    currency_code: string;
    is_active: boolean;
    display_order: number;
}

export interface GMBProduct {
    id: number;
    location_id: number;
    google_product_id: string | null;
    name: string;
    description: string | null;
    price: number | null;
    currency_code: string;
    category_id: string | null;
    category_name: string | null;
    photo_url: string | null;
    is_active: boolean;
    display_order: number;
}

export interface GMBPhoto {
    id: number;
    location_id: number;
    google_photo_id: string | null;
    google_photo_url: string | null;
    local_file_path: string | null;
    category: 'profile' | 'cover' | 'logo' | 'exterior' | 'interior' | 'product' | 'at_work' | 'food_drink' | 'menu' | 'common_area' | 'rooms' | 'teams' | 'additional';
    description: string | null;
    width: number | null;
    height: number | null;
    status: 'pending' | 'uploaded' | 'live' | 'rejected' | 'deleted';
    rejection_reason: string | null;
    view_count: number;
    created_at: string;
}

export interface GMBPost {
    id: number;
    workspace_id: number;
    location_id: number;
    google_post_id: string | null;
    post_type: 'standard' | 'event' | 'offer' | 'product' | 'alert' | 'covid';
    topic_type: 'standard' | 'event' | 'offer' | 'product' | 'alert';
    summary: string;
    media_type: 'photo' | 'video' | null;
    media_url: string | null;
    media_source_url: string | null;
    action_type: string | null;
    action_url: string | null;
    event_title: string | null;
    event_start_date: string | null;
    event_start_time: string | null;
    event_end_date: string | null;
    event_end_time: string | null;
    offer_coupon_code: string | null;
    offer_redeem_url: string | null;
    offer_terms: string | null;
    status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'expired' | 'deleted';
    scheduled_at: string | null;
    published_at: string | null;
    expires_at: string | null;
    error_message: string | null;
    views: number;
    clicks: number;
    created_by: number | null;
    created_at: string;
    updated_at: string;
}

export interface GMBReview {
    id: number;
    workspace_id: number;
    location_id: number;
    google_review_id: string;
    reviewer_display_name: string | null;
    reviewer_profile_photo_url: string | null;
    reviewer_is_anonymous: boolean;
    star_rating: number;
    comment: string | null;
    reply_text: string | null;
    replied_at: string | null;
    replied_by: number | null;
    status: 'new' | 'read' | 'responded' | 'flagged';
    is_flagged: boolean;
    flag_reason: string | null;
    sentiment: 'positive' | 'neutral' | 'negative' | null;
    sentiment_score: number | null;
    key_topics: string[] | null;
    suggested_response: string | null;
    review_date: string;
    created_at: string;
    updated_at: string;
}

export interface GMBQuestion {
    id: number;
    location_id: number;
    google_question_id: string;
    question_text: string;
    author_display_name: string | null;
    author_profile_photo_url: string | null;
    author_type: 'customer' | 'merchant' | 'local_guide';
    status: 'unanswered' | 'answered' | 'flagged';
    total_answers: number;
    upvote_count: number;
    question_date: string;
    answers?: GMBAnswer[];
}

export interface GMBAnswer {
    id: number;
    question_id: number;
    google_answer_id: string;
    answer_text: string;
    author_display_name: string | null;
    author_profile_photo_url: string | null;
    author_type: 'customer' | 'merchant' | 'local_guide';
    is_owner_answer: boolean;
    upvote_count: number;
    answer_date: string;
}

export interface GMBInsights {
    id: number;
    location_id: number;
    date: string;
    period_type: 'day' | 'week' | 'month';
    queries_direct: number;
    queries_indirect: number;
    queries_chain: number;
    views_maps: number;
    views_search: number;
    actions_website: number;
    actions_phone: number;
    actions_driving_directions: number;
    actions_menu: number;
    actions_booking: number;
    actions_orders: number;
    photo_views_merchant: number;
    photo_views_customer: number;
    direction_requests: Record<string, number> | null;
    search_keywords: Array<{ keyword: string; count: number }> | null;
}

export interface GMBAttribute {
    id: number;
    location_id: number;
    attribute_id: string;
    attribute_name: string;
    attribute_group: string | null;
    value_type: 'boolean' | 'enum' | 'repeated_enum' | 'url';
    value_boolean: boolean | null;
    value_enum: string | null;
    value_repeated_enum: string[] | null;
    value_url: string | null;
    is_editable: boolean;
}

export interface GMBSettings {
    id: number;
    workspace_id: number;
    auto_sync_enabled: boolean;
    sync_interval_minutes: number;
    auto_reply_enabled: boolean;
    auto_reply_min_rating: number;
    auto_reply_templates: Record<number, string> | null;
    notify_new_reviews: boolean;
    notify_new_questions: boolean;
    notify_low_ratings: boolean;
    low_rating_threshold: number;
    notification_email: string | null;
    default_post_timezone: string;
    auto_expire_posts: boolean;
    default_post_expiry_days: number;
    ai_suggested_responses: boolean;
    ai_sentiment_analysis: boolean;
}

export interface GMBCategory {
    id: number;
    category_id: string;
    display_name: string;
    parent_category_id: string | null;
    service_types: any[] | null;
}

export interface GMBVerification {
    id: number;
    location_id: number;
    method: 'postcard' | 'phone' | 'email' | 'video' | 'live_video';
    phone_number: string | null;
    email_address: string | null;
    status: 'requested' | 'pending' | 'verified' | 'failed' | 'expired';
    verification_code: string | null;
    expires_at: string | null;
    requested_at: string;
    completed_at: string | null;
}

export interface GMBSyncLog {
    id: number;
    workspace_id: number;
    location_id: number | null;
    sync_type: 'full' | 'incremental' | 'reviews' | 'posts' | 'insights' | 'photos' | 'qa';
    status: 'started' | 'completed' | 'failed' | 'partial';
    items_synced: number;
    items_created: number;
    items_updated: number;
    items_deleted: number;
    errors: any[] | null;
    started_at: string;
    completed_at: string | null;
    duration_seconds: number | null;
}

export interface GMBDashboardStats {
    connection: GMBConnection | null;
    locations_count: number;
    total_reviews: number;
    average_rating: number;
    pending_reviews: number;
    unanswered_questions: number;
    scheduled_posts: number;
    published_posts: number;
    total_photos: number;
    last_sync_at: string | null;
}

// ==================== API METHODS ====================

export const gmbApi = {
    // ==================== CONNECTION ====================

    async getConnection(): Promise<GMBConnection | null> {
        const response = await api.get('/gmb/connection') as { data: GMBConnection | null };
        return response.data;
    },

    async getOAuthUrl(): Promise<{ url: string }> {
        const response = await api.get('/gmb/oauth-url') as { data: { url: string } };
        return response.data;
    },

    async handleOAuthCallback(code: string): Promise<{ success: boolean; connection: GMBConnection }> {
        const response = await api.post('/gmb/oauth-callback', { code }) as { data: { success: boolean; connection: GMBConnection } };
        return response.data;
    },

    async disconnectAccount(): Promise<{ success: boolean }> {
        const response = await api.post('/gmb/disconnect', {}) as { data: { success: boolean } };
        return response.data;
    },

    async refreshToken(): Promise<{ success: boolean }> {
        const response = await api.post('/gmb/refresh-token', {}) as { data: { success: boolean } };
        return response.data;
    },

    // Simulated connection for development/testing without real Google OAuth
    async simulateConnect(): Promise<{ success: boolean; connection: GMBConnection }> {
        const response = await api.post('/gmb/simulate-connect', {}) as { data: { success: boolean; connection: GMBConnection } };
        return response.data;
    },

    // ==================== LOCATIONS ====================

    async getLocations(): Promise<GMBLocation[]> {
        const response = await api.get('/gmb/locations') as { data: GMBLocation[] };
        return response.data;
    },

    async getLocation(id: number): Promise<GMBLocation> {
        const response = await api.get(`/gmb/locations/${id}`) as { data: GMBLocation };
        return response.data;
    },

    async syncLocations(): Promise<{ success: boolean; count: number }> {
        const response = await api.post('/gmb/locations/sync', {}) as { data: { success: boolean; count: number } };
        return response.data;
    },

    async updateLocation(id: number, data: Partial<GMBLocation>): Promise<{ success: boolean }> {
        const response = await api.put(`/gmb/locations/${id}`, data) as { data: { success: boolean } };
        return response.data;
    },

    async pushLocationToGoogle(id: number): Promise<{ success: boolean }> {
        const response = await api.post(`/gmb/locations/${id}/push`, {}) as { data: { success: boolean } };
        return response.data;
    },

    // ==================== BUSINESS HOURS ====================

    async getBusinessHours(locationId: number): Promise<GMBBusinessHours[]> {
        const response = await api.get(`/gmb/locations/${locationId}/hours`) as { data: GMBBusinessHours[] };
        return response.data;
    },

    async updateBusinessHours(locationId: number, hours: Partial<GMBBusinessHours>[]): Promise<{ success: boolean }> {
        const response = await api.put(`/gmb/locations/${locationId}/hours`, { hours }) as { data: { success: boolean } };
        return response.data;
    },

    async addSpecialHours(locationId: number, data: { date: string; name: string; open_time?: string; close_time?: string; is_closed?: boolean }): Promise<{ success: boolean; id: number }> {
        const response = await api.post(`/gmb/locations/${locationId}/special-hours`, data) as { data: { success: boolean; id: number } };
        return response.data;
    },

    // ==================== SERVICES ====================

    async getServices(locationId: number): Promise<GMBService[]> {
        const response = await api.get(`/gmb/locations/${locationId}/services`) as { data: GMBService[] };
        return response.data;
    },

    async createService(locationId: number, data: Partial<GMBService>): Promise<{ success: boolean; id: number }> {
        const response = await api.post(`/gmb/locations/${locationId}/services`, data) as { data: { success: boolean; id: number } };
        return response.data;
    },

    async updateService(id: number, data: Partial<GMBService>): Promise<{ success: boolean }> {
        const response = await api.put(`/gmb/services/${id}`, data) as { data: { success: boolean } };
        return response.data;
    },

    async deleteService(id: number): Promise<{ success: boolean }> {
        const response = await api.delete(`/gmb/services/${id}`) as { data: { success: boolean } };
        return response.data;
    },

    // ==================== PRODUCTS ====================

    async getProducts(locationId: number): Promise<GMBProduct[]> {
        const response = await api.get(`/gmb/locations/${locationId}/products`) as { data: GMBProduct[] };
        return response.data;
    },

    async createProduct(locationId: number, data: Partial<GMBProduct>): Promise<{ success: boolean; id: number }> {
        const response = await api.post(`/gmb/locations/${locationId}/products`, data) as { data: { success: boolean; id: number } };
        return response.data;
    },

    async updateProduct(id: number, data: Partial<GMBProduct>): Promise<{ success: boolean }> {
        const response = await api.put(`/gmb/products/${id}`, data) as { data: { success: boolean } };
        return response.data;
    },

    async deleteProduct(id: number): Promise<{ success: boolean }> {
        const response = await api.delete(`/gmb/products/${id}`) as { data: { success: boolean } };
        return response.data;
    },

    // ==================== PHOTOS ====================

    async getPhotos(locationId?: number): Promise<GMBPhoto[]> {
        const response = await api.get('/gmb/photos', { params: { location_id: locationId } }) as { data: GMBPhoto[] };
        return response.data;
    },

    async uploadPhoto(locationId: number, data: FormData): Promise<{ success: boolean; id: number; url: string }> {
        const response = await api.post(`/gmb/locations/${locationId}/photos`, data) as { data: { success: boolean; id: number; url: string } };
        return response.data;
    },

    async updatePhoto(id: number, data: { category?: string; description?: string }): Promise<{ success: boolean }> {
        const response = await api.put(`/gmb/photos/${id}`, data) as { data: { success: boolean } };
        return response.data;
    },

    async deletePhoto(id: number): Promise<{ success: boolean }> {
        const response = await api.delete(`/gmb/photos/${id}`) as { data: { success: boolean } };
        return response.data;
    },

    async setProfilePhoto(locationId: number, photoId: number): Promise<{ success: boolean }> {
        const response = await api.post(`/gmb/locations/${locationId}/photos/${photoId}/set-profile`, {}) as { data: { success: boolean } };
        return response.data;
    },

    async setCoverPhoto(locationId: number, photoId: number): Promise<{ success: boolean }> {
        const response = await api.post(`/gmb/locations/${locationId}/photos/${photoId}/set-cover`, {}) as { data: { success: boolean } };
        return response.data;
    },

    async syncPhotos(locationId?: number): Promise<{ success: boolean; count: number }> {
        const response = await api.post('/gmb/photos/sync', { location_id: locationId }) as { data: { success: boolean; count: number } };
        return response.data;
    },

    // ==================== POSTS ====================

    async getPosts(locationId?: number, params?: { status?: string; type?: string }): Promise<GMBPost[]> {
        const response = await api.get('/gmb/posts', { params: { location_id: locationId, ...params } }) as { data: GMBPost[] };
        return response.data;
    },

    async getPost(id: number): Promise<GMBPost> {
        const response = await api.get(`/gmb/posts/${id}`) as { data: GMBPost };
        return response.data;
    },

    async createPost(data: Partial<GMBPost>): Promise<{ success: boolean; id: number }> {
        const response = await api.post('/gmb/posts', data) as { data: { success: boolean; id: number } };
        return response.data;
    },

    async updatePost(id: number, data: Partial<GMBPost>): Promise<{ success: boolean }> {
        const response = await api.put(`/gmb/posts/${id}`, data) as { data: { success: boolean } };
        return response.data;
    },

    async deletePost(id: number): Promise<{ success: boolean }> {
        const response = await api.delete(`/gmb/posts/${id}`) as { data: { success: boolean } };
        return response.data;
    },

    async syncPosts(locationId?: number): Promise<{ success: boolean; count: number }> {
        const response = await api.post('/gmb/posts/sync', { location_id: locationId }) as { data: { success: boolean; count: number } };
        return response.data;
    },

    async publishPost(id: number): Promise<{ success: boolean }> {
        const response = await api.post(`/gmb/posts/${id}/publish`, {}) as { data: { success: boolean } };
        return response.data;
    },

    async schedulePost(id: number, scheduledAt: string): Promise<{ success: boolean }> {
        const response = await api.post(`/gmb/posts/${id}/schedule`, { scheduled_at: scheduledAt }) as { data: { success: boolean } };
        return response.data;
    },

    // ==================== REVIEWS ====================

    async getReviews(locationId?: number, params?: { status?: string; min_rating?: number; max_rating?: number }): Promise<GMBReview[]> {
        const response = await api.get('/gmb/reviews', { params: { location_id: locationId, ...params } }) as { data: GMBReview[] };
        return response.data;
    },

    async getReview(id: number): Promise<GMBReview> {
        const response = await api.get(`/gmb/reviews/${id}`) as { data: GMBReview };
        return response.data;
    },

    async syncReviews(locationId?: number): Promise<{ success: boolean; count: number }> {
        const response = await api.post('/gmb/reviews/sync', { location_id: locationId }) as { data: { success: boolean; count: number } };
        return response.data;
    },

    async replyToReview(id: number, replyText: string): Promise<{ success: boolean }> {
        const response = await api.post(`/gmb/reviews/${id}/reply`, { reply_text: replyText }) as { data: { success: boolean } };
        return response.data;
    },

    async deleteReply(id: number): Promise<{ success: boolean }> {
        const response = await api.delete(`/gmb/reviews/${id}/reply`) as { data: { success: boolean } };
        return response.data;
    },

    async flagReview(id: number, reason: string): Promise<{ success: boolean }> {
        const response = await api.post(`/gmb/reviews/${id}/flag`, { reason }) as { data: { success: boolean } };
        return response.data;
    },

    async markReviewAsRead(id: number): Promise<{ success: boolean }> {
        const response = await api.post(`/gmb/reviews/${id}/mark-read`, {}) as { data: { success: boolean } };
        return response.data;
    },

    async getSuggestedResponse(id: number): Promise<{ suggestion: string }> {
        const response = await api.get(`/gmb/reviews/${id}/suggested-response`) as { data: { suggestion: string } };
        return response.data;
    },

    // ==================== Q&A ====================

    async getQuestions(locationId?: number, params?: { status?: string }): Promise<GMBQuestion[]> {
        const response = await api.get('/gmb/questions', { params: { location_id: locationId, ...params } }) as { data: GMBQuestion[] };
        return response.data;
    },

    async syncQuestions(locationId?: number): Promise<{ success: boolean; count: number }> {
        const response = await api.post('/gmb/questions/sync', { location_id: locationId }) as { data: { success: boolean; count: number } };
        return response.data;
    },

    async answerQuestion(questionId: number, answerText: string): Promise<{ success: boolean; id: number }> {
        const response = await api.post(`/gmb/questions/${questionId}/answer`, { answer_text: answerText }) as { data: { success: boolean; id: number } };
        return response.data;
    },

    async updateAnswer(answerId: number, answerText: string): Promise<{ success: boolean }> {
        const response = await api.put(`/gmb/answers/${answerId}`, { answer_text: answerText }) as { data: { success: boolean } };
        return response.data;
    },

    async deleteAnswer(answerId: number): Promise<{ success: boolean }> {
        const response = await api.delete(`/gmb/answers/${answerId}`) as { data: { success: boolean } };
        return response.data;
    },

    // ==================== INSIGHTS ====================

    async getInsights(locationId?: number, params?: { start_date?: string; end_date?: string; period_type?: string }): Promise<GMBInsights[]> {
        const response = await api.get('/gmb/insights', { params: { location_id: locationId, ...params } }) as { data: GMBInsights[] };
        return response.data;
    },

    async syncInsights(locationId?: number): Promise<{ success: boolean }> {
        const response = await api.post('/gmb/insights/sync', { location_id: locationId }) as { data: { success: boolean } };
        return response.data;
    },

    async getInsightsSummary(locationId: number): Promise<{
        total_searches: number;
        total_views: number;
        total_actions: number;
        search_trend: number;
        view_trend: number;
        action_trend: number;
    }> {
        const response = await api.get('/gmb/insights', { params: { location_id: locationId, summary: true } }) as { data: any };
        return response.data;
    },

    // ==================== ATTRIBUTES ====================

    async getAttributes(locationId: number): Promise<GMBAttribute[]> {
        const response = await api.get(`/gmb/locations/${locationId}/attributes`) as { data: GMBAttribute[] };
        return response.data;
    },

    async updateAttributes(locationId: number, attributes: Partial<GMBAttribute>[]): Promise<{ success: boolean }> {
        const response = await api.put(`/gmb/locations/${locationId}/attributes`, { attributes }) as { data: { success: boolean } };
        return response.data;
    },

    async getAvailableAttributes(categoryId: string): Promise<GMBAttribute[]> {
        const response = await api.get('/gmb/attributes/available', { params: { category_id: categoryId } }) as { data: GMBAttribute[] };
        return response.data;
    },

    // ==================== VERIFICATION ====================

    async getVerificationOptions(locationId: number): Promise<{ methods: string[] }> {
        const response = await api.get(`/gmb/locations/${locationId}/verification-options`) as { data: { methods: string[] } };
        return response.data;
    },

    async requestVerification(locationId: number, method: string, data?: { phone_number?: string; email_address?: string }): Promise<{ success: boolean; verification_id: number }> {
        const response = await api.post(`/gmb/locations/${locationId}/request-verification`, { method, ...data }) as { data: { success: boolean; verification_id: number } };
        return response.data;
    },

    async completeVerification(verificationId: number, code: string): Promise<{ success: boolean }> {
        const response = await api.post(`/gmb/verifications/${verificationId}/complete`, { code }) as { data: { success: boolean } };
        return response.data;
    },

    async getVerificationStatus(locationId: number): Promise<GMBVerification | null> {
        const response = await api.get(`/gmb/locations/${locationId}/verification-status`) as { data: GMBVerification | null };
        return response.data;
    },

    // ==================== SETTINGS ====================

    async getSettings(): Promise<GMBSettings> {
        const response = await api.get('/gmb/settings') as { data: GMBSettings };
        return response.data;
    },

    async updateSettings(data: Partial<GMBSettings>): Promise<{ success: boolean }> {
        const response = await api.put('/gmb/settings', data) as { data: { success: boolean } };
        return response.data;
    },

    // ==================== CATEGORIES ====================

    async getCategories(search?: string): Promise<GMBCategory[]> {
        const response = await api.get('/gmb/categories', { params: { search } }) as { data: GMBCategory[] };
        return response.data;
    },

    // ==================== SYNC LOGS ====================

    async getSyncLogs(params?: { location_id?: number; sync_type?: string }): Promise<GMBSyncLog[]> {
        const response = await api.get('/gmb/sync-logs', { params }) as { data: GMBSyncLog[] };
        return response.data;
    },

    async triggerFullSync(locationId?: number): Promise<{ success: boolean; job_id: number }> {
        const response = await api.post('/gmb/sync', { location_id: locationId }) as { data: { success: boolean; job_id: number } };
        return response.data;
    },

    // ==================== DASHBOARD ====================

    async getDashboardStats(): Promise<GMBDashboardStats> {
        const response = await api.get('/gmb/dashboard') as { data: GMBDashboardStats };
        return response.data;
    },
};

export default gmbApi;
