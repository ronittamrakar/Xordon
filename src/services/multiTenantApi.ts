/**
 * Multi-Tenant API Service
 * Handles agencies, subaccounts, and context switching
 */

import type {
    Agency,
    AgencyBranding,
    AgencyMember,
    Subaccount,
    SubaccountMember,
    CreateAgencyRequest,
    UpdateAgencyRequest,
    CreateSubaccountRequest,
    UpdateSubaccountRequest,
    UpdateBrandingRequest,
    InviteMemberRequest,
} from '@/types/multiTenant';

const API_BASE = '/api/mt';

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = localStorage.getItem('auth_token');

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
// Agencies
// ========================================

export async function listAgencies(): Promise<{ items: Agency[] }> {
    return request('/agencies');
}

export async function getCurrentAgency(): Promise<Agency | null> {
    return request('/agencies/current');
}

export async function getAgency(id: number): Promise<Agency> {
    return request(`/agencies/${id}`);
}

export async function createAgency(data: CreateAgencyRequest): Promise<Agency> {
    return request('/agencies', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateAgency(
    id: number,
    data: UpdateAgencyRequest
): Promise<Agency> {
    return request(`/agencies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

// ========================================
// Agency Branding
// ========================================

export async function getAgencyBranding(agencyId: number): Promise<AgencyBranding> {
    return request(`/agencies/${agencyId}/branding`);
}

export async function updateAgencyBranding(
    agencyId: number,
    data: UpdateBrandingRequest
): Promise<AgencyBranding> {
    return request(`/agencies/${agencyId}/branding`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

// ========================================
// Agency Members
// ========================================

export async function getAgencyMembers(
    agencyId: number
): Promise<{ items: AgencyMember[] }> {
    return request(`/agencies/${agencyId}/members`);
}

export async function inviteAgencyMember(
    agencyId: number,
    data: InviteMemberRequest
): Promise<{ success: boolean; user_id: number }> {
    return request(`/agencies/${agencyId}/team/invite`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

// ========================================
// Subaccounts
// ========================================

export async function listSubaccounts(
    agencyId: number
): Promise<{ items: Subaccount[] }> {
    return request(`/agencies/${agencyId}/subaccounts`);
}

export async function getSubaccount(id: number): Promise<Subaccount> {
    return request(`/subaccounts/${id}`);
}

export async function createSubaccount(
    agencyId: number,
    data: CreateSubaccountRequest
): Promise<Subaccount> {
    return request(`/agencies/${agencyId}/subaccounts`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function updateSubaccount(
    id: number,
    data: UpdateSubaccountRequest
): Promise<Subaccount> {
    return request(`/subaccounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function deleteSubaccount(id: number): Promise<{ success: boolean }> {
    return request(`/subaccounts/${id}`, {
        method: 'DELETE',
    });
}

// ========================================
// Subaccount Members
// ========================================

export async function getSubaccountMembers(
    subaccountId: number
): Promise<{ items: SubaccountMember[] }> {
    return request(`/subaccounts/${subaccountId}/members`);
}

export async function inviteSubaccountMember(
    subaccountId: number,
    data: InviteMemberRequest
): Promise<{ success: boolean; user_id: number }> {
    return request(`/subaccounts/${subaccountId}/members`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function getSubaccountSettings(
    subaccountId: number
): Promise<any> {
    return request(`/subaccounts/${subaccountId}/settings`);
}

export async function updateSubaccountSettings(
    subaccountId: number,
    data: any
): Promise<any> {
    return request(`/subaccounts/${subaccountId}/settings`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

// ========================================
// Context Switching
// ========================================

export async function getCurrentSubaccount(): Promise<Subaccount | null> {
    return request('/context/subaccount');
}

export async function switchSubaccount(
    subaccountId: number
): Promise<{ success: boolean; subaccount: Subaccount }> {
    return request(`/context/switch/${subaccountId}`, {
        method: 'POST',
    });
}

// ========================================
// Export all as default object for convenience
// ========================================

export default {
    // Agencies
    listAgencies,
    getCurrentAgency,
    getAgency,
    createAgency,
    updateAgency,
    // Branding
    getAgencyBranding,
    updateAgencyBranding,
    // Agency Members
    getAgencyMembers,
    getAgencyTeam,
    inviteAgencyMember,
    inviteTeamMember: inviteAgencyMember,
    removeTeamMember,
    // Subaccounts
    listSubaccounts,
    getSubaccount,
    createSubaccount,
    updateSubaccount,
    deleteSubaccount,
    // Subaccount Members
    getSubaccountMembers,
    inviteSubaccountMember,
    getSubaccountSettings,
    updateSubaccountSettings,
    // Domains
    listDomains,
    addDomain,
    deleteDomain,
    verifyDomain,
    // Audit & Activity
    getAuditLog,
    // Context
    getCurrentSubaccount,
    switchSubaccount,
};

export async function getAgencyTeam(
    agencyId: number
): Promise<{ items: AgencyMember[]; pending_invites: number; total: number }> {
    return request(`/agencies/${agencyId}/team`);
}

export async function getAuditLog(
    agencyId: number,
    options: { limit?: number; offset?: number } = {}
): Promise<{ items: any[] }> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    const query = params.toString();
    return request(`/agencies/${agencyId}/audit${query ? `?${query}` : ''}`);
}

export async function listDomains(
    agencyId: number
): Promise<{ items: any[] }> {
    return request(`/agencies/${agencyId}/domains`);
}

export async function addDomain(
    agencyId: number,
    data: { domain: string }
): Promise<any> {
    return request(`/agencies/${agencyId}/domains`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function deleteDomain(
    agencyId: number,
    domainId: number
): Promise<{ success: boolean }> {
    return request(`/agencies/${agencyId}/domains/${domainId}`, {
        method: 'DELETE',
    });
}

export async function verifyDomain(
    agencyId: number,
    domainId: number
): Promise<{ success: boolean; results: any }> {
    return request(`/agencies/${agencyId}/domains/${domainId}/verify`, {
        method: 'POST',
    });
}

export async function removeTeamMember(
    agencyId: number,
    memberId: number
): Promise<{ success: boolean }> {
    return request(`/agencies/${agencyId}/team/${memberId}`, {
        method: 'DELETE',
    });
}
