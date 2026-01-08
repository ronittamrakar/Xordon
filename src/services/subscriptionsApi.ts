import { api } from '@/lib/api';

export interface Subscription {
    id: number;
    workspace_id: number;
    contact_id: number;
    product_id: number;
    subscription_number: string;
    status: 'active' | 'trialing' | 'paused' | 'cancelled' | 'expired' | 'past_due';
    billing_amount: number;
    currency: string;
    billing_interval: string;
    billing_interval_count: number;
    trial_days: number;
    trial_end_date: string | null;
    setup_fee: number;
    setup_fee_paid: boolean;
    start_date: string;
    next_billing_date: string | null;
    stripe_subscription_id: string | null;
    stripe_customer_id: string | null;
    contact_first_name?: string;
    contact_last_name?: string;
    contact_email?: string;
    product_name?: string;
    created_at: string;
}

export interface SubscriptionStats {
    mrr: number;
    arr: number;
    active_count: number;
    trialing_count: number;
    cancelled_count: number;
    churn_rate: number;
}

export const subscriptionsApi = {
    async listSubscriptions(params: { status?: string; contact_id?: number; limit?: number; offset?: number } = {}): Promise<{ data: Subscription[]; meta: { total: number } }> {
        const searchParams = new URLSearchParams();
        if (params.status) searchParams.set('status', params.status);
        if (params.contact_id) searchParams.set('contact_id', String(params.contact_id));
        if (params.limit) searchParams.set('limit', String(params.limit));
        if (params.offset) searchParams.set('offset', String(params.offset));

        const response = await api.get(`/subscriptions?${searchParams.toString()}`) as { data: Subscription[]; meta: { total: number } };
        return response;
    },

    async getSubscription(id: number): Promise<Subscription> {
        const response = await api.get(`/subscriptions/${id}`) as { data: Subscription };
        return response.data;
    },

    async createSubscription(data: any): Promise<Subscription> {
        const response = await api.post('/subscriptions', data) as { data: Subscription };
        return response.data;
    },

    async updateSubscription(id: number, data: any): Promise<void> {
        await api.put(`/subscriptions/${id}`, data);
    },

    async cancelSubscription(id: number, data: { cancel_at_period_end: boolean }): Promise<void> {
        await api.post(`/subscriptions/${id}/cancel`, data);
    },

    async pauseSubscription(id: number): Promise<void> {
        await api.post(`/subscriptions/${id}/pause`, {});
    },

    async resumeSubscription(id: number): Promise<void> {
        await api.post(`/subscriptions/${id}/resume`, {});
    },

    async getStats(): Promise<SubscriptionStats> {
        const response = await api.get('/subscriptions/stats') as { data: SubscriptionStats };
        return response.data;
    },

    async getAnalytics(params: { from: string; to: string }): Promise<any> {
        const response = await api.get(`/subscriptions/analytics?from=${params.from}&to=${params.to}`) as { data: any };
        return response.data;
    }
};

export default subscriptionsApi;
