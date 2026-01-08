/**
 * Performance Billing API Service
 * LeadSmart-style Pay-Per-Call billing system
 */

import api from './api';

export interface BillingSetting {
    id: number;
    workspace_id: number;
    company_id: number | null;
    min_duration_seconds: number;
    base_price_per_call: number;
    surge_multiplier: number;
    exclusive_multiplier: number;
    auto_bill_enabled: boolean;
    dispute_window_hours: number;
    max_price_per_call: number;
    min_price_per_call: number;
    is_active: boolean;
}

export interface CallPricingRule {
    id: number;
    workspace_id: number;
    name: string;
    service_category: string | null;
    region: string | null;
    postal_code: string | null;
    city: string | null;
    day_of_week: string | null;
    time_start: string | null;
    time_end: string | null;
    is_emergency: boolean;
    base_price: number;
    multiplier: number;
    priority: number;
    is_active: boolean;
}

export interface QualifiedCall {
    id: number;
    phone_number: string;
    duration: number;
    campaign_name: string;
    billing_status: 'pending' | 'billed' | 'disputed' | 'refunded' | 'waived';
    billing_price: number;
    billed_at: string | null;
    created_at: string;
    outcome: string;
}

export interface CallDispute {
    id: number;
    workspace_id: number;
    company_id: number;
    call_log_id: number;
    dispute_type: string;
    description: string | null;
    status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'partial_refund';
    refund_amount: number | null;
    resolution_notes: string | null;
    resolved_at: string | null;
    created_at: string;
    phone_number?: string;
    duration?: number;
    billing_price?: number;
}

export interface BillingSummary {
    period: {
        start: string;
        end: string;
    };
    calls: {
        total: number;
        qualified: number;
        billed: number;
        qualification_rate: number;
    };
    duration: {
        total_seconds: number;
        avg_qualified_seconds: number;
    };
    billing: {
        total_billed: number;
        total_refunded: number;
        net_revenue: number;
    };
    disputes: {
        total: number;
        approved: number;
    };
    wallet_balance: number;
}

// Get billing settings
export const getBillingSettings = async (): Promise<BillingSetting[]> => {
    const response = await api.get('/performance-billing/settings');
    return response.data.data || response.data;
};

// Update billing settings
export const updateBillingSettings = async (settings: Partial<BillingSetting>): Promise<void> => {
    await api.post('/performance-billing/settings', settings);
};

// Get pricing rules
export const getPricingRules = async (): Promise<CallPricingRule[]> => {
    const response = await api.get('/performance-billing/pricing-rules');
    return response.data.data || response.data;
};

// Create pricing rule
export const createPricingRule = async (rule: Partial<CallPricingRule>): Promise<{ id: number }> => {
    const response = await api.post('/performance-billing/pricing-rules', rule);
    return response.data.data || response.data;
};

// Update pricing rule
export const updatePricingRule = async (id: number, rule: Partial<CallPricingRule>): Promise<void> => {
    await api.put(`/performance-billing/pricing-rules/${id}`, rule);
};

// Delete pricing rule
export const deletePricingRule = async (id: number): Promise<void> => {
    await api.delete(`/performance-billing/pricing-rules/${id}`);
};

// Get billing summary
export const getBillingSummary = async (startDate?: string, endDate?: string): Promise<BillingSummary> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await api.get(`/performance-billing/summary?${params.toString()}`);
    return response.data.data || response.data;
};

// Get qualified calls
export const getQualifiedCalls = async (status?: string, limit = 50, offset = 0): Promise<QualifiedCall[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await api.get(`/performance-billing/qualified-calls?${params.toString()}`);
    return response.data.data || response.data;
};

// Process call for billing manually
export const processCallForBilling = async (callLogId: number): Promise<{
    success: boolean;
    qualified: boolean;
    billed: boolean;
    price?: number;
    error?: string;
}> => {
    const response = await api.post(`/performance-billing/process-call/${callLogId}`);
    return response.data;
};

// Get disputes
export const getDisputes = async (status?: string): Promise<CallDispute[]> => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/performance-billing/disputes${params}`);
    return response.data.data || response.data;
};

// Create dispute
export const createDispute = async (callLogId: number, disputeType: string, description?: string): Promise<{ dispute_id: number }> => {
    const response = await api.post('/performance-billing/disputes', {
        call_log_id: callLogId,
        dispute_type: disputeType,
        description
    });
    return response.data;
};

// Resolve dispute
export const resolveDispute = async (disputeId: number, resolution: 'approved' | 'rejected' | 'partial_refund', refundAmount?: number, notes?: string): Promise<void> => {
    await api.put(`/performance-billing/disputes/${disputeId}/resolve`, {
        resolution,
        refund_amount: refundAmount,
        notes
    });
};

// Calculate price preview
export const calculatePrice = async (callData: {
    postal_code?: string;
    service_category?: string;
    started_at?: string;
}): Promise<{ price: number }> => {
    const response = await api.post('/performance-billing/calculate-price', callData);
    return response.data.data || response.data;
};

export default {
    getBillingSettings,
    updateBillingSettings,
    getPricingRules,
    createPricingRule,
    updatePricingRule,
    deletePricingRule,
    getBillingSummary,
    getQualifiedCalls,
    processCallForBilling,
    getDisputes,
    createDispute,
    resolveDispute,
    calculatePrice
};
