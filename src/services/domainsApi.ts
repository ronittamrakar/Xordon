/**
 * Domain Management API Service
 * Handles custom domain CRUD operations, DNS verification, and SSL status
 */

const API_BASE = '/api/mt';

// Types
export interface CustomDomain {
    id: number;
    agency_id: number;
    domain: string;
    domain_type: 'primary' | 'alias' | 'funnel' | 'subdomain';
    ssl_status: 'pending' | 'provisioning' | 'active' | 'failed';
    ssl_expires_at?: string;
    ssl_certificate?: string;
    ssl_private_key?: string;
    dns_verified: boolean;
    dns_verified_at?: string;
    dns_txt_record?: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}

export interface DomainVerificationResult {
    verified: boolean;
    domain: string;
    ssl_status?: string;
    message: string;
    expected_txt?: string;
    txt_host?: string;
}

export interface CreateDomainRequest {
    domain: string;
    domain_type: 'primary' | 'alias' | 'funnel';
}

export interface UpdateDomainRequest {
    domain_type?: 'primary' | 'alias' | 'funnel';
    is_active?: boolean;
}

export interface ThemeResolution {
    agency_id: number;
    agency_name: string;
    agency_slug: string;
    domain: string;
    branding: {
        logo_url?: string;
        favicon_url?: string;
        primary_color: string;
        secondary_color: string;
        accent_color: string;
        company_name?: string;
        login_page_title?: string;
        login_page_description?: string;
        login_background_url?: string;
        custom_css?: string;
    };
}

function getToken(): string | null {
    return localStorage.getItem('auth_token');
}

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();

    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || error.message || 'Request failed');
    }

    return res.json();
}

// ========================================
// Domain Management
// ========================================

/**
 * List all domains for an agency
 */
export async function listDomains(agencyId: number): Promise<{ items: CustomDomain[] }> {
    return request(`/agencies/${agencyId}/domains`);
}

/**
 * Create a new domain
 */
export async function createDomain(
    agencyId: number,
    data: CreateDomainRequest
): Promise<CustomDomain> {
    return request(`/agencies/${agencyId}/domains`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Update domain settings
 */
export async function updateDomain(
    agencyId: number,
    domainId: number,
    data: UpdateDomainRequest
): Promise<CustomDomain> {
    return request(`/agencies/${agencyId}/domains/${domainId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

/**
 * Delete a domain
 */
export async function deleteDomain(
    agencyId: number,
    domainId: number
): Promise<{ success: boolean }> {
    return request(`/agencies/${agencyId}/domains/${domainId}`, {
        method: 'DELETE',
    });
}

/**
 * Verify domain DNS configuration
 */
export async function verifyDomain(
    agencyId: number,
    domainId: number
): Promise<DomainVerificationResult> {
    return request(`/agencies/${agencyId}/domains/${domainId}/verify`, {
        method: 'POST',
    });
}

/**
 * Resolve theme/branding by hostname
 * This is used on page load to apply white-label branding
 */
export async function resolveThemeByHost(host: string): Promise<ThemeResolution | null> {
    try {
        const res = await fetch(`${API_BASE}/theme/resolve?host=${encodeURIComponent(host)}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data || null;
    } catch {
        return null;
    }
}

/**
 * Validate domain format
 */
export function isValidDomain(domain: string): boolean {
    // Allow subdomains like app.company.com or root domains like company.com
    const domainRegex = /^[a-z0-9][a-z0-9\-\.]*[a-z0-9]\.[a-z]{2,}$/i;
    return domainRegex.test(domain.trim());
}

/**
 * Get primary domain for an agency
 */
export async function getPrimaryDomain(agencyId: number): Promise<CustomDomain | null> {
    const { items } = await listDomains(agencyId);
    return items.find(d => d.domain_type === 'primary' && d.dns_verified && d.is_active) || null;
}

/**
 * Check if current page is accessed via a custom domain
 */
export function isCustomDomainAccess(): boolean {
    const hostname = window.location.hostname;
    // Not a custom domain if it's localhost, IP, or the main app domain
    if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.includes('.local') ||
        hostname.endsWith('xordon.com') ||
        hostname.endsWith('xordon.io')
    ) {
        return false;
    }
    return true;
}

/**
 * Get the effective workspace subdomain from URL or storage
 */
export function getEffectiveSubdomain(): string {
    // Priority 1: Check if accessing via custom domain
    if (isCustomDomainAccess()) {
        return window.location.hostname;
    }

    // Priority 2: Check localStorage
    const stored = localStorage.getItem('tenant_subdomain');
    if (stored) return stored;

    // Priority 3: Extract from URL path if present (e.g., /workspace/slug/...)
    const pathMatch = window.location.pathname.match(/^\/workspace\/([^\/]+)/);
    if (pathMatch) return pathMatch[1];

    // Default
    return 'default';
}

// ========================================
// Export as default object
// ========================================

export default {
    listDomains,
    createDomain,
    updateDomain,
    deleteDomain,
    verifyDomain,
    resolveThemeByHost,
    isValidDomain,
    getPrimaryDomain,
    isCustomDomainAccess,
    getEffectiveSubdomain,
};
