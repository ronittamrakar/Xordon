/**
 * Multi-Tenant Types
 * Types for agencies, subaccounts, and hierarchical SaaS structure
 */

export interface Agency {
    id: number;
    name: string;
    slug: string;
    owner_user_id: number;
    subscription_plan_id?: number;
    trial_ends_at?: string;
    status: 'trial' | 'active' | 'suspended' | 'canceled';
    max_subaccounts: number;
    max_users: number;
    max_contacts_per_subaccount: number;
    created_at: string;
    updated_at: string;
    // Organization terminology
    organization_type?: 'marketing_agency' | 'franchise' | 'single_business' | 'other';
    custom_subaccount_label?: string;
    // Joined data
    subaccount_count?: number;
    member_count?: number;
    user_role?: 'owner' | 'admin' | 'member';
    // Branding (when included)
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    company_name?: string;
}

export interface AgencyBranding {
    agency_id: number;
    logo_url?: string;
    favicon_url?: string;
    primary_color: string;
    secondary_color: string;
    accent_color?: string;
    company_name?: string;
    support_email?: string;
    support_phone?: string;
    login_page_title?: string;
    login_page_description?: string;
    login_background_url?: string;
    email_from_name?: string;
    email_from_address?: string;
    email_footer_text?: string;
    custom_css?: string;
    font_family?: string;
    created_at?: string;
    updated_at?: string;
}

export interface AgencyMember {
    id: number;
    agency_id: number;
    user_id: number;
    role: 'owner' | 'admin' | 'member';
    status: 'invited' | 'active' | 'suspended';
    invited_by?: number;
    invited_at?: string;
    joined_at?: string;
    // User details (when joined)
    name?: string;
    email?: string;
    last_login?: string;
}

export interface Subaccount {
    id: number;
    agency_id: number;
    name: string;
    slug: string;
    industry?: string;
    timezone: string;
    currency: string;
    logo_url?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    phone?: string;
    email?: string;
    website?: string;
    status: 'active' | 'paused' | 'canceled';
    created_by?: number;
    notes?: string;
    created_at: string;
    updated_at: string;
    // Joined data
    member_count?: number;
    contact_count?: number;
}

export interface SubaccountMember {
    id: number;
    subaccount_id: number;
    user_id: number;
    role: 'admin' | 'user' | 'readonly';
    permissions?: Record<string, boolean>;
    status: 'invited' | 'active' | 'suspended';
    invited_by?: number;
    joined_at?: string;
    last_accessed_at?: string;
    // User details (when joined)
    name?: string;
    email?: string;
}

export interface SubscriptionPlan {
    id: number;
    name: string;
    slug: string;
    description?: string;
    price_monthly: number;
    price_yearly?: number;
    max_subaccounts: number;
    max_users: number;
    max_contacts: number;
    max_emails_per_month?: number;
    max_sms_per_month?: number;
    features?: string[];
    is_active: boolean;
    is_public: boolean;
}

// Request/Response types
export interface CreateAgencyRequest {
    name: string;
    slug?: string;
    max_subaccounts?: number;
    max_users?: number;
}

export interface UpdateAgencyRequest {
    name?: string;
    slug?: string;
    max_subaccounts?: number;
    max_users?: number;
    max_contacts_per_subaccount?: number;
    organization_type?: 'marketing_agency' | 'franchise' | 'single_business' | 'retail' | 'healthcare' | 'other';
    custom_subaccount_label?: string;
}

export interface SubaccountSettings {
    subaccount_id: number;
    features: Record<string, boolean>;
    limits: Record<string, number>;
    integrations: Record<string, any>;
    notifications: Record<string, any>;
}

export interface CreateSubaccountRequest {
    name: string;
    slug?: string;
    industry?: string;
    timezone?: string;
    email?: string;
    phone?: string;
    website?: string;
}

export interface UpdateSubaccountRequest {
    name?: string;
    industry?: string;
    timezone?: string;
    email?: string;
    phone?: string;
    website?: string;
    status?: 'active' | 'paused' | 'canceled';
    logo_url?: string;
}

export interface UpdateBrandingRequest {
    logo_url?: string;
    favicon_url?: string;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    company_name?: string;
    support_email?: string;
    support_phone?: string;
    login_page_title?: string;
    login_page_description?: string;
    login_background_url?: string;
    email_from_name?: string;
    email_from_address?: string;
    email_footer_text?: string;
    custom_css?: string;
}

export interface InviteMemberRequest {
    email: string;
    role: 'admin' | 'member' | 'user' | 'readonly';
}
