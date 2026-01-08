/**
 * Stripe Payment Integration API
 * Supports Stripe Connect for sub-accounts, payment links, and text-to-pay
 */

import { api } from '@/lib/api';

// ============================================
// TYPES
// ============================================

export interface StripeAccount {
    id: string;
    workspace_id: string;
    stripe_account_id: string;
    account_type: 'express' | 'standard' | 'custom';
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
    business_profile: {
        name?: string;
        url?: string;
        mcc?: string;
    };
    created_at: string;
    updated_at: string;
}

export interface PaymentLink {
    id: string;
    workspace_id: string;
    stripe_link_id: string;
    url: string;
    amount: number;
    currency: string;
    description: string;
    status: 'active' | 'inactive' | 'completed';
    contact_id?: string;
    invoice_id?: string;
    estimate_id?: string;
    expires_at?: string;
    payment_received_at?: string;
    created_at: string;
}

export interface TextToPayRequest {
    contact_id: string;
    amount: number;
    currency?: string;
    description: string;
    invoice_id?: string;
    estimate_id?: string;
    send_via: 'sms' | 'email' | 'both';
    message?: string;
    expires_in_hours?: number;
}

export interface PaymentIntent {
    id: string;
    stripe_intent_id: string;
    amount: number;
    currency: string;
    status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled';
    client_secret: string;
    contact_id?: string;
    invoice_id?: string;
}

export interface StripeWebhookEvent {
    id: string;
    type: string;
    data: Record<string, any>;
    created: number;
}

export interface ConnectOnboardingUrl {
    url: string;
    expires_at: number;
}

export interface PaymentMethod {
    id: string;
    type: 'card' | 'bank_account' | 'us_bank_account';
    card?: {
        brand: string;
        last4: string;
        exp_month: number;
        exp_year: number;
    };
    bank_account?: {
        bank_name: string;
        last4: string;
    };
}

export interface CustomerPaymentMethods {
    contact_id: string;
    stripe_customer_id: string;
    payment_methods: PaymentMethod[];
}

export interface Payout {
    id: string;
    stripe_payout_id: string;
    amount: number;
    currency: string;
    status: 'pending' | 'in_transit' | 'paid' | 'failed' | 'canceled';
    arrival_date: string;
    created_at: string;
}

export interface StripeBalance {
    available: { amount: number; currency: string }[];
    pending: { amount: number; currency: string }[];
}

export interface ChargeRequest {
    contact_id: string;
    amount: number;
    currency?: string;
    description: string;
    payment_method_id: string;
    invoice_id?: string;
    save_payment_method?: boolean;
}

// ============================================
// STRIPE CONNECT API
// ============================================

/**
 * Create a new Stripe Connect account for the workspace
 */
export async function createConnectAccount(
    accountType: 'express' | 'standard' = 'express',
    businessProfile?: { name?: string; url?: string }
): Promise<StripeAccount> {
    const response = await api.post('/stripe/connect/create', {
        account_type: accountType,
        business_profile: businessProfile,
    });
    return response;
}

/**
 * Get the Stripe Connect account for the current workspace
 */
export async function getConnectAccount(): Promise<StripeAccount | null> {
    try {
        const response = await api.get('/stripe/connect/account');
        return response;
    } catch (error: any) {
        if (error.status === 404) return null;
        throw error;
    }
}

/**
 * Get the onboarding URL for completing Stripe Connect setup
 */
export async function getOnboardingUrl(
    returnUrl?: string,
    refreshUrl?: string
): Promise<ConnectOnboardingUrl> {
    const response = await api.post('/stripe/connect/onboarding-url', {
        return_url: returnUrl,
        refresh_url: refreshUrl,
    });
    return response;
}

/**
 * Get Stripe Dashboard login link for connected account
 */
export async function getDashboardLoginLink(): Promise<{ url: string }> {
    const response = await api.get('/stripe/connect/dashboard-link');
    return response;
}

/**
 * Get account balance for the connected account
 */
export async function getAccountBalance(): Promise<StripeBalance> {
    const response = await api.get('/stripe/connect/balance');
    return response;
}

/**
 * Get list of payouts for the connected account
 */
export async function getPayouts(
    params?: { limit?: number; starting_after?: string }
): Promise<{ payouts: Payout[]; has_more: boolean }> {
    const response = await api.get('/stripe/connect/payouts', { params });
    return response;
}

// ============================================
// PAYMENT LINKS API
// ============================================

/**
 * Create a payment link
 */
export async function createPaymentLink(data: {
    amount: number;
    currency?: string;
    description: string;
    contact_id?: string;
    invoice_id?: string;
    estimate_id?: string;
    expires_in_hours?: number;
}): Promise<PaymentLink> {
    const response = await api.post('/stripe/payment-links', data);
    return response;
}

/**
 * List all payment links
 */
export async function listPaymentLinks(
    params?: { status?: string; contact_id?: string; page?: number; limit?: number }
): Promise<{ data: PaymentLink[]; total: number; page: number; limit: number }> {
    const response = await api.get('/stripe/payment-links', { params });
    return response;
}

/**
 * Get a specific payment link
 */
export async function getPaymentLink(id: string): Promise<PaymentLink> {
    const response = await api.get(`/stripe/payment-links/${id}`);
    return response;
}

/**
 * Deactivate a payment link
 */
export async function deactivatePaymentLink(id: string): Promise<PaymentLink> {
    const response = await api.put(`/stripe/payment-links/${id}/deactivate`);
    return response;
}

// ============================================
// TEXT-TO-PAY API
// ============================================

/**
 * Send a text-to-pay request
 */
export async function sendTextToPay(request: TextToPayRequest): Promise<{
    payment_link: PaymentLink;
    message_sent: boolean;
    message_id?: string;
}> {
    const response = await api.post('/stripe/text-to-pay', request);
    return response;
}

/**
 * Get text-to-pay history for a contact
 */
export async function getTextToPayHistory(
    contactId: string,
    params?: { page?: number; limit?: number }
): Promise<{ data: PaymentLink[]; total: number }> {
    const response = await api.get(`/stripe/text-to-pay/contact/${contactId}`, { params });
    return response;
}

// ============================================
// PAYMENT INTENTS & CHARGES
// ============================================

/**
 * Create a payment intent for a charge
 */
export async function createPaymentIntent(data: {
    amount: number;
    currency?: string;
    description?: string;
    contact_id?: string;
    invoice_id?: string;
    setup_future_usage?: 'off_session' | 'on_session';
}): Promise<PaymentIntent> {
    const response = await api.post('/stripe/payment-intents', data);
    return response;
}

/**
 * Confirm a payment intent
 */
export async function confirmPaymentIntent(
    intentId: string,
    paymentMethodId: string
): Promise<PaymentIntent> {
    const response = await api.post(`/stripe/payment-intents/${intentId}/confirm`, {
        payment_method_id: paymentMethodId,
    });
    return response;
}

/**
 * Charge a saved payment method
 */
export async function chargePaymentMethod(request: ChargeRequest): Promise<{
    success: boolean;
    payment_intent: PaymentIntent;
    error?: string;
}> {
    const response = await api.post('/stripe/charge', request);
    return response;
}

// ============================================
// CUSTOMER PAYMENT METHODS
// ============================================

/**
 * Get saved payment methods for a contact
 */
export async function getCustomerPaymentMethods(
    contactId: string
): Promise<CustomerPaymentMethods> {
    const response = await api.get(`/stripe/customers/${contactId}/payment-methods`);
    return response;
}

/**
 * Attach a payment method to a customer
 */
export async function attachPaymentMethod(
    contactId: string,
    paymentMethodId: string,
    setAsDefault?: boolean
): Promise<{ success: boolean }> {
    const response = await api.post(`/stripe/customers/${contactId}/payment-methods`, {
        payment_method_id: paymentMethodId,
        set_as_default: setAsDefault,
    });
    return response;
}

/**
 * Detach a payment method from a customer
 */
export async function detachPaymentMethod(
    contactId: string,
    paymentMethodId: string
): Promise<{ success: boolean }> {
    const response = await api.delete(
        `/stripe/customers/${contactId}/payment-methods/${paymentMethodId}`
    );
    return response;
}

/**
 * Create setup intent for adding new payment method
 */
export async function createSetupIntent(contactId: string): Promise<{
    client_secret: string;
    setup_intent_id: string;
}> {
    const response = await api.post(`/stripe/customers/${contactId}/setup-intent`);
    return response;
}

// ============================================
// REFUNDS
// ============================================

/**
 * Create a refund for a payment
 */
export async function createRefund(data: {
    payment_intent_id: string;
    amount?: number; // partial refund
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}): Promise<{
    id: string;
    amount: number;
    status: 'succeeded' | 'pending' | 'failed';
}> {
    const response = await api.post('/stripe/refunds', data);
    return response;
}

// ============================================
// SUBSCRIPTIONS (for recurring payments)
// ============================================

export interface StripeSubscription {
    id: string;
    stripe_subscription_id: string;
    contact_id: string;
    status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing';
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    items: {
        id: string;
        price_id: string;
        quantity: number;
        product_name: string;
        unit_amount: number;
    }[];
    created_at: string;
}

/**
 * Create a subscription for a contact
 */
export async function createSubscription(data: {
    contact_id: string;
    price_id: string;
    quantity?: number;
    payment_method_id?: string;
    trial_days?: number;
}): Promise<StripeSubscription> {
    const response = await api.post('/stripe/subscriptions', data);
    return response;
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
    subscriptionId: string,
    cancelImmediately?: boolean
): Promise<StripeSubscription> {
    const response = await api.post(`/stripe/subscriptions/${subscriptionId}/cancel`, {
        immediately: cancelImmediately,
    });
    return response;
}

/**
 * Get contact's subscriptions
 */
export async function getContactSubscriptions(
    contactId: string
): Promise<StripeSubscription[]> {
    const response = await api.get(`/stripe/subscriptions/contact/${contactId}`);
    return response;
}

// ============================================
// PRODUCTS & PRICES (for stripe catalog)
// ============================================

export interface StripeProduct {
    id: string;
    stripe_product_id: string;
    name: string;
    description?: string;
    active: boolean;
    prices: StripePrice[];
}

export interface StripePrice {
    id: string;
    stripe_price_id: string;
    product_id: string;
    unit_amount: number;
    currency: string;
    recurring?: {
        interval: 'day' | 'week' | 'month' | 'year';
        interval_count: number;
    };
    active: boolean;
}

/**
 * Sync local products to Stripe
 */
export async function syncProductsToStripe(): Promise<{
    synced: number;
    errors: string[];
}> {
    const response = await api.post('/stripe/products/sync');
    return response;
}

/**
 * Get Stripe products
 */
export async function getStripeProducts(): Promise<StripeProduct[]> {
    const response = await api.get('/stripe/products');
    return response;
}

// ============================================
// WEBHOOKS & EVENTS
// ============================================

/**
 * Get recent webhook events
 */
export async function getWebhookEvents(
    params?: { type?: string; limit?: number }
): Promise<StripeWebhookEvent[]> {
    const response = await api.get('/stripe/webhook-events', { params });
    return response;
}

// ============================================
// SETTINGS
// ============================================

export interface StripeSettings {
    enabled: boolean;
    test_mode: boolean;
    default_currency: string;
    payment_methods_enabled: string[];
    automatic_tax: boolean;
    payment_link_branding: {
        logo_url?: string;
        brand_color?: string;
        thank_you_message?: string;
    };
    text_to_pay_template?: string;
}

/**
 * Get Stripe settings
 */
export async function getStripeSettings(): Promise<StripeSettings> {
    const response = await api.get('/stripe/settings');
    return response;
}

/**
 * Update Stripe settings
 */
export async function updateStripeSettings(
    settings: Partial<StripeSettings>
): Promise<StripeSettings> {
    const response = await api.put('/stripe/settings', settings);
    return response;
}

export default {
    // Connect
    createConnectAccount,
    getConnectAccount,
    getOnboardingUrl,
    getDashboardLoginLink,
    getAccountBalance,
    getPayouts,

    // Payment Links
    createPaymentLink,
    listPaymentLinks,
    getPaymentLink,
    deactivatePaymentLink,

    // Text-to-Pay
    sendTextToPay,
    getTextToPayHistory,

    // Payment Intents
    createPaymentIntent,
    confirmPaymentIntent,
    chargePaymentMethod,

    // Customer Methods
    getCustomerPaymentMethods,
    attachPaymentMethod,
    detachPaymentMethod,
    createSetupIntent,

    // Refunds
    createRefund,

    // Subscriptions
    createSubscription,
    cancelSubscription,
    getContactSubscriptions,

    // Products
    syncProductsToStripe,
    getStripeProducts,

    // Settings
    getStripeSettings,
    updateStripeSettings,
};
