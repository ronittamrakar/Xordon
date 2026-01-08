/**
 * Multi-Tenant Context
 * Provides agency and sub-account context throughout the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Defensive check - ensure React is properly loaded
if (typeof React === 'undefined' || React === null) {
    throw new Error('React is not properly loaded in TenantContext');
}

if (import.meta.env.DEV) {
    console.log('[TenantContext] React import check:', {
        React: typeof React,
        useContext: typeof useContext,
        createContext: typeof createContext,
        ReactVersion: React.version
    });
}

interface Agency {
    id: number;
    name: string;
    slug: string;
    status: string;
    role: string;
    subaccount_count: number;
    organization_type?: 'marketing_agency' | 'franchise' | 'single_business' | 'retail' | 'healthcare' | 'other';
    custom_subaccount_label?: string;
}

interface Subaccount {
    id: number;
    name: string;
    slug: string;
    status: string;
    industry?: string;
    role?: string;
}

// Terminology mapping based on organization type
const TERMINOLOGY_MAP = {
    marketing_agency: { singular: 'Client', plural: 'Clients' },
    franchise: { singular: 'Location', plural: 'Locations' },
    single_business: { singular: 'Workspace', plural: 'Workspaces' },
    retail: { singular: 'Store', plural: 'Stores' },
    healthcare: { singular: 'Practice', plural: 'Practices' },
    other: { singular: 'Sub-Account', plural: 'Sub-Accounts' },
} as const;

interface TenantContextValue {
    // Current state
    currentAgency: Agency | null;
    currentSubaccount: Subaccount | null;
    agencies: Agency[];
    subaccounts: Subaccount[];

    // Loading states
    loading: boolean;
    switchingContext: boolean;

    // User role helpers
    isAgencyOwner: boolean;
    isAgencyAdmin: boolean;
    isClientOnly: boolean; // True if user only has sub-account access (no agency membership)

    // Terminology labels (dynamic based on organization_type)
    subaccountLabel: string;
    subaccountLabelPlural: string;

    // Sub-account settings (features/limits)
    subaccountSettings: any | null;

    // Actions
    refreshAgencies: () => Promise<void>;
    switchToAgency: (agencyId: number) => Promise<void>;
    switchToSubaccount: (subaccountId: number) => Promise<void>;
    clearSubaccount: () => void;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function useTenant() {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error('useTenant must be used within TenantProvider');
    }
    return context;
}

// Optional hook that doesn't throw if outside provider
export function useTenantOptional(): TenantContextValue | null {
    return useContext(TenantContext) || null;
}

interface TenantProviderProps {
    children: React.ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
    if (import.meta.env.DEV) {
        // @ts-ignore
        console.log('[DEBUG] TenantProvider rendering. Same React?', window.React1 === React);
    }
    const queryClient = useQueryClient();
    const [currentAgency, setCurrentAgency] = useState<Agency | null>(null);
    const [currentSubaccount, setCurrentSubaccount] = useState<Subaccount | null>(null);
    const [switchingContext, setSwitchingContext] = useState(false);

    // --- Data Fetching ---

    const fetchAgencies = async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) return { agencies: [] };
        const res = await fetch('/api/mt/permissions/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch permissions');
        return res.json();
    };

    const { data: agenciesData, isLoading: isAgenciesLoading, refetch: refetchAgencies } = useQuery({
        queryKey: ['tenant', 'agencies'],
        queryFn: fetchAgencies,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const agencies: Agency[] = agenciesData?.agencies || [];

    const fetchSubaccounts = async (agencyId: number) => {
        const token = localStorage.getItem('auth_token');
        if (!token) return { items: [] };
        const res = await fetch(`/api/mt/agencies/${agencyId}/subaccounts`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch subaccounts');
        return res.json();
    };

    const { data: subaccountsData, isLoading: isSubaccountsLoading } = useQuery({
        queryKey: ['tenant', 'subaccounts', currentAgency?.id],
        queryFn: () => fetchSubaccounts(currentAgency!.id),
        enabled: !!currentAgency?.id,
        staleTime: 2 * 60 * 1000,
    });

    const subaccounts: Subaccount[] = subaccountsData?.items || [];

    const fetchSubaccountSettings = async (subId: number) => {
        const token = localStorage.getItem('auth_token');
        if (!token) return null;
        const res = await fetch(`/api/mt/subaccounts/${subId}/settings`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch settings');
        return res.json();
    };

    const { data: subaccountSettings } = useQuery({
        queryKey: ['tenant', 'subaccount-settings', currentSubaccount?.id],
        queryFn: () => fetchSubaccountSettings(currentSubaccount!.id),
        enabled: !!currentSubaccount?.id,
        staleTime: 5 * 60 * 1000,
    });

    // --- State Management & Side Effects ---

    // Auto-select agency on load
    useEffect(() => {
        if (agencies.length > 0 && !currentAgency) {
            const saved = localStorage.getItem('current_agency_id');
            const savedId = saved ? parseInt(saved, 10) : null;
            const agency = savedId
                ? agencies.find((a: Agency) => a.id === savedId) || agencies[0]
                : agencies[0];
            setCurrentAgency(agency);

            // Check for saved subaccount
            const savedSubId = localStorage.getItem('current_subaccount_id');
            if (savedSubId) {
                // We don't have subaccounts loaded yet potentially, but we can set the ID preference logic
                // Actually, we need to wait for subaccounts to load for this agency?
                // The logical flow is: Set Agency -> Query Subaccounts runs -> Select subaccount
            }
        }
    }, [agencies, currentAgency]);

    // Auto-select subaccount once subaccounts are loaded
    useEffect(() => {
        if (subaccounts.length > 0 && !currentSubaccount && currentAgency) {
            const savedSubId = localStorage.getItem('current_subaccount_id');
            if (savedSubId) {
                const subId = parseInt(savedSubId, 10);
                const sub = subaccounts.find((s: Subaccount) => s.id === subId);
                if (sub) {
                    setCurrentSubaccount(sub);
                }
            }
        }
    }, [subaccounts, currentSubaccount, currentAgency]);

    // --- Action Handlers ---

    const refreshAgenciesWrapper = async () => {
        await refetchAgencies();
    };

    const switchToAgency = useCallback(async (agencyId: number) => {
        const agency = agencies.find(a => a.id === agencyId);
        if (!agency) return;

        setSwitchingContext(true);
        try {
            setCurrentAgency(agency);
            localStorage.setItem('current_agency_id', String(agencyId));

            // Clear subaccount when switching agency
            setCurrentSubaccount(null);
            localStorage.removeItem('current_subaccount_id');
            // Subaccounts query will auto-refetch due to key change
        } finally {
            setSwitchingContext(false);
        }
    }, [agencies]);

    const switchToSubaccount = useCallback(async (subaccountId: number) => {
        const sub = subaccounts.find(s => s.id === subaccountId);
        if (!sub) return;

        setSwitchingContext(true);
        try {
            // Call API to switch context
            const token = localStorage.getItem('auth_token');
            await fetch(`/api/mt/context/switch/${subaccountId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            setCurrentSubaccount(sub);
            localStorage.setItem('current_subaccount_id', String(subaccountId));
            // Settings query will auto-refetch
        } catch (err) {
            console.error('Failed to switch subaccount:', err);
        } finally {
            setSwitchingContext(false);
        }
    }, [subaccounts]);

    const clearSubaccount = useCallback(() => {
        setCurrentSubaccount(null);
        localStorage.removeItem('current_subaccount_id');
    }, []);

    const isAgencyOwner = currentAgency?.role === 'owner';
    const isAgencyAdmin = currentAgency?.role === 'owner' || currentAgency?.role === 'admin';
    // Client-only: has no agency membership (agencies list empty) OR only has readonly subaccount access
    // We check if data is loaded first to avoid premature client-only state
    const isClientOnly = !isAgenciesLoading && agencies.length === 0 && currentSubaccount !== null;

    // Compute terminology labels based on organization_type
    const orgType = currentAgency?.organization_type || 'marketing_agency';
    const customLabel = currentAgency?.custom_subaccount_label;
    const terminology = TERMINOLOGY_MAP[orgType] || TERMINOLOGY_MAP.other;
    const subaccountLabel = customLabel || terminology.singular;
    const subaccountLabelPlural = customLabel ? `${customLabel}s` : terminology.plural;

    const value: TenantContextValue = {
        currentAgency,
        currentSubaccount,
        agencies,
        subaccounts,
        loading: isAgenciesLoading, // Main loading state is usually just initial agencies load
        switchingContext: switchingContext || isSubaccountsLoading, // Include subaccount loading in switching state if meaningful
        isAgencyOwner,
        isAgencyAdmin,
        isClientOnly,
        subaccountLabel,
        subaccountLabelPlural,
        subaccountSettings: subaccountSettings || null,
        refreshAgencies: refreshAgenciesWrapper,
        switchToAgency,
        switchToSubaccount,
        clearSubaccount,
    };

    return (
        <TenantContext.Provider value={value}>
            {children}
        </TenantContext.Provider>
    );
}
