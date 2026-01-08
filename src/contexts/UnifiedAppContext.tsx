import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type Workspace } from '@/lib/api';
import type { Role } from '@/types/rbac';
import {
    AccountFeatureConfig,
    FULL_ACCOUNT_CONFIG,
    DEFAULT_ACCOUNT_CONFIG,
    ProductBundle,
    getEnabledFeaturesForAccount,
    FeatureItem,
    FEATURES,
} from '@/config/features';
import { useTenantOptional } from './TenantContext';

// --- Types ---

export type AccountType = 'agency' | 'individual';

export interface Tenant {
    id: string;
    name: string;
    subdomain: string;
    plan?: 'free' | 'starter' | 'pro' | 'enterprise';
    created_at?: string;
    settings?: Record<string, unknown>;
}

export interface User {
    id: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    role_id?: number | null;
    role?: Role | {
        id: number;
        name: string;
        permissions: string[];
    } | null;
    tenantId?: string;
    avatar?: string;
    created_at?: string;
}

export interface CompanyBasic {
    id: string;
    name: string;
    domain?: string | null;
    logoUrl?: string | null;
    status: string;
    isClient: boolean;
    userRole?: string;
}

export interface WorkspaceModule {
    module_key: string;
    name: string;
    description: string;
    icon: string;
    is_core: boolean;
    version: string;
    dependencies: string[];
    status: 'installed' | 'disabled' | 'not_installed';
}

// --- Context Types ---

export interface UnifiedAppContextType {
    // Auth
    user: User | null;
    tenant: Tenant | null;
    isAuthenticated: boolean;
    isAuthLoading: boolean;
    token: string | null;
    login: (email: string, password: string, tenantSubdomain?: string, rememberMe?: boolean) => Promise<void>;
    register: (email: string, password: string, firstName: string, lastName: string, tenantName: string) => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshAuth: () => Promise<void>;

    // Permissions
    role: Role | {
        id: number;
        name: string;
        permissions: string[];
    } | null;
    permissions: string[];
    isAdmin: boolean;
    hasPermission: (permission: string) => boolean;

    // Workspace & Company
    accountType: AccountType;
    isAgency: boolean;
    companies: CompanyBasic[];
    activeCompanyId: string | null;
    activeCompany: CompanyBasic | null;
    setActiveCompany: (companyId: string) => void;
    workspaceModules: WorkspaceModule[];
    isModuleEnabled: (moduleKey: string) => boolean;
    enabledFeatures: FeatureItem[];
    isFeatureEnabled: (featureId: string) => boolean;

    // Developer Mode
    isDeveloperMode: boolean;
    setDeveloperMode: (enabled: boolean) => void;
}

const UnifiedAppContext = createContext<UnifiedAppContextType | undefined>(undefined);

// --- Storage Keys ---
const STORAGE_KEY_DEV_MODE = 'xordon_developer_mode';
const STORAGE_KEY_ACTIVE_COMPANY = 'active_client_id';

export function UnifiedAppProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                return null;
            }
        }
        return null;
    });
    const [tenant, setTenant] = useState<Tenant | null>(() => {
        const stored = localStorage.getItem('tenant_id');
        if (stored) {
            return {
                id: stored,
                name: localStorage.getItem('tenant_name') || 'Workspace',
                subdomain: localStorage.getItem('tenant_subdomain') || 'default',
            };
        }
        return null;
    });
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(() => {
        // Default to true in development for full sidebar visibility
        const stored = localStorage.getItem(STORAGE_KEY_DEV_MODE);
        if (stored !== null) {
            return stored === 'true';
        }
        return import.meta.env.DEV || import.meta.env.VITE_DEV_MODE === 'true';
    });

    // Track if component is mounted to prevent state updates after unmount
    const isMountedRef = useRef(true);

    // --- Auth Logic ---

    const logout = useCallback(async () => {
        try {
            await api.logout();
        } catch (e) {
            console.error('Logout background task error:', e);
        }
        localStorage.removeItem('auth_token');
        localStorage.removeItem('tenant_id');
        localStorage.removeItem('currentUser');
        if (isMountedRef.current) {
            setUser(null);
            setTenant(null);
        }
    }, []);

    const refreshAuth = useCallback(async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            if (isMountedRef.current) {
                setUser(null);
                setTenant(null);
                setIsAuthLoading(false);
            }
            return;
        }
        try {
            const data = await api.verifyAuthToken();
            if (data && data.user && data.tenant) {
                const updatedUser = {
                    ...data.user,
                    firstName: data.user.name?.split(' ')[0] || '',
                    lastName: data.user.name?.split(' ').slice(1).join(' ') || '',
                };
                if (isMountedRef.current) {
                    setUser(updatedUser);
                    setTenant({
                        ...data.tenant,
                        plan: data.tenant.plan || 'free',
                        created_at: data.tenant.created_at || new Date().toISOString(),
                        settings: data.tenant.settings || {}
                    });
                    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                    localStorage.setItem('tenant_name', data.tenant.name);
                }
            } else {
                // If verifyAuthToken returns null, check if it cleared the token
                const currentToken = localStorage.getItem('auth_token');
                if (!currentToken) {
                    // Token was explicitly invalidated (401/403)
                    if (isMountedRef.current) {
                        await logout();
                    }
                } else {
                    // Token is still there, verifyAuthToken failed due to network/server error.
                    // We keep the existing session for resilience, but log it for debugging in dev.
                    if (import.meta.env.DEV) {
                        console.debug('[Auth] Refresh failed (network/server error), keeping existing session');
                    }
                }
                // CRITICAL: Ensure loading stops even on failure
                if (isMountedRef.current) {
                    setIsAuthLoading(false);
                }
            }
        } catch (e) {
            console.error('[Auth] Refresh error:', e);
            // Only logout on unexpected errors if the token is gone
            const currentToken = localStorage.getItem('auth_token');
            if (!currentToken && isMountedRef.current) {
                await logout();
            }
        } finally {
            if (isMountedRef.current) {
                setIsAuthLoading(false);
            }
        }
    }, [logout]);

    const login = useCallback(async (email: string, password: string, tenantSubdomain?: string, rememberMe?: boolean) => {
        try {
            if (isMountedRef.current) {
                setIsAuthLoading(true);
            }
            const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';

            if (isDevMode) {
                const storedTenantId = localStorage.getItem('tenant_id') || '1';
                const storedTenantSubdomain = localStorage.getItem('tenant_subdomain') || 'dev';
                const rawUser = {
                    id: '19',
                    email: email || 'admin@xordon.com',
                    name: 'System Administrator',
                    role_id: 1,
                    role: {
                        id: 1,
                        name: 'Admin',
                        permissions: [],
                        description: 'System Administrator',
                        is_system: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    },
                    tenantId: storedTenantId,
                };
                if (isMountedRef.current) {
                    setUser(rawUser);
                    setTenant({
                        id: storedTenantId,
                        name: 'Development Workspace',
                        subdomain: storedTenantSubdomain,
                        plan: 'pro',
                        created_at: new Date().toISOString(),
                        settings: {}
                    });
                }
                localStorage.setItem('auth_token', 'dev-token');
                localStorage.setItem('currentUser', JSON.stringify(rawUser));
                return;
            }

            const response = await api.login(email, password, tenantSubdomain || 'default', rememberMe);
            if (response.token && response.user && response.tenant) {
                localStorage.setItem('auth_token', response.token);
                if (isMountedRef.current) {
                    setUser(response.user);
                    setTenant(response.tenant);
                }
                // Don't call refreshAuth immediately as we just got fresh data.
                // It will be called on mount next time if needed, or by periodic checks.
            }
        } finally {
            if (isMountedRef.current) {
                setIsAuthLoading(false);
            }
        }
    }, [refreshAuth]);

    const register = useCallback(async (email: string, password: string, firstName: string, lastName: string, tenantName: string) => {
        try {
            if (isMountedRef.current) {
                setIsAuthLoading(true);
            }
            const response = await api.register({ email, password, firstName, lastName, tenantName });
            if (response.token && response.user && response.tenant) {
                localStorage.setItem('auth_token', response.token);
                if (isMountedRef.current) {
                    setUser(response.user);
                    setTenant(response.tenant);
                }
            }
        } finally {
            if (isMountedRef.current) {
                setIsAuthLoading(false);
            }
        }
    }, []);

    const forgotPassword = useCallback(async (email: string) => {
        await api.forgotPassword(email);
    }, []);

    useEffect(() => {
        refreshAuth();
    }, [refreshAuth]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // --- Permissions Logic ---

    const role = useMemo(() => user?.role || null, [user]);
    const permissions = useMemo(() => user?.role?.permissions || [], [user]);
    const isAdmin = useMemo(() => {
        if (user?.role_id === 1 || user?.role?.name?.toLowerCase() === 'admin') return true;
        return false;
    }, [user]);

    const hasPermission = useCallback((permission: string) => {
        if (isDeveloperMode || isAdmin) return true;
        return permissions.includes(permission);
    }, [isDeveloperMode, isAdmin, permissions]);

    // --- Workspace & Module Logic ---

    const { data: modulesData } = useQuery({
        queryKey: ['workspace', 'modules'],
        queryFn: () => api.getWorkspaceModules(),
        enabled: !!user,
        staleTime: 60 * 1000,
    });

    const workspaceModules = useMemo(() => (modulesData?.modules as unknown as WorkspaceModule[]) || [], [modulesData]);
    const enabledModuleKeys = useMemo(() =>
        workspaceModules.filter((m: WorkspaceModule) => m.status === 'installed' || m.is_core).map((m: WorkspaceModule) => m.module_key),
        [workspaceModules]);

    const tenantContext = useTenantOptional();
    const subSettings = tenantContext?.subaccountSettings;

    const isModuleEnabled = useCallback((moduleKey: string) => {
        if (isDeveloperMode) return true;
        if (moduleKey === 'core') return true;

        // Check sub-account override for module
        if (subSettings?.features && subSettings.features[moduleKey] === false) {
            return false;
        }

        return enabledModuleKeys.includes(moduleKey);
    }, [isDeveloperMode, enabledModuleKeys, subSettings]);

    // --- Company Logic ---

    const [activeCompanyId, setActiveCompanyId] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY_ACTIVE_COMPANY));

    const { data: companiesData } = useQuery({
        queryKey: ['companies', 'allowed'],
        queryFn: () => api.getAllowedCompanies(),
        enabled: !!user,
        staleTime: 30 * 1000,
    });

    const companies = useMemo(() => (companiesData?.companies as unknown as CompanyBasic[]) || [], [companiesData]);
    const accountType: AccountType = companiesData?.accountType || 'individual';

    const activeCompany = useMemo(() => {
        if (!activeCompanyId) return companies[0] || null;
        return companies.find(c => c.id === activeCompanyId) || companies[0] || null;
    }, [activeCompanyId, companies]);

    const handleSetActiveCompany = useCallback((id: string) => {
        setActiveCompanyId(id);
        localStorage.setItem(STORAGE_KEY_ACTIVE_COMPANY, id);
        queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'companies' });
    }, [queryClient]);

    // --- Feature Logic ---

    const enabledFeatures = useMemo(() => {
        const base = isDeveloperMode ? FEATURES : getEnabledFeaturesForAccount(FULL_ACCOUNT_CONFIG);
        return base.filter(f => {
            const mk = (f as any).module_key;
            if (mk && !isModuleEnabled(mk)) return false;

            // Sub-account specific feature toggle
            if (!isDeveloperMode && subSettings?.features) {
                // Check if specific feature or its group is disabled
                if (subSettings.features[f.id] === false) return false;
                if (subSettings.features[f.group] === false) return false;
            }

            return true;
        });
    }, [isDeveloperMode, isModuleEnabled, subSettings]);

    const isFeatureEnabled = useCallback((fid: string) => {
        if (isDeveloperMode) return true;
        return enabledFeatures.some(f => f.id === fid);
    }, [isDeveloperMode, enabledFeatures]);

    // --- Unified Value ---

    const value = useMemo<UnifiedAppContextType>(() => ({
        user,
        tenant,
        isAuthenticated: !!user,
        isAuthLoading,
        token: localStorage.getItem('auth_token'),
        login,
        register,
        forgotPassword,
        logout,
        refreshAuth,
        role,
        permissions,
        isAdmin,
        hasPermission,
        accountType,
        isAgency: accountType === 'agency',
        companies,
        activeCompanyId,
        activeCompany,
        setActiveCompany: handleSetActiveCompany,
        workspaceModules,
        isModuleEnabled,
        enabledFeatures,
        isFeatureEnabled,
        isDeveloperMode,
        setDeveloperMode: (val) => {
            setIsDeveloperMode(val);
            localStorage.setItem(STORAGE_KEY_DEV_MODE, String(val));
        }
    }), [user, tenant, isAuthLoading, login, logout, refreshAuth, role, permissions, isAdmin, hasPermission, accountType, companies, activeCompanyId, activeCompany, handleSetActiveCompany, workspaceModules, isModuleEnabled, enabledFeatures, isFeatureEnabled, isDeveloperMode]);

    return <UnifiedAppContext.Provider value={value}>{children}</UnifiedAppContext.Provider>;
}

export const useUnifiedApp = () => {
    const context = useContext(UnifiedAppContext);
    if (!context) {
        console.warn('useUnifiedApp: Context not available. Component may be rendering before UnifiedAppProvider is mounted.');
        // Return a default context to prevent crashes
        return {
            user: null,
            tenant: null,
            isAuthenticated: false,
            isAuthLoading: false,
            token: null,
            login: async () => { },
            register: async () => { },
            forgotPassword: async () => { },
            logout: async () => { },
            refreshAuth: async () => { },
            role: null,
            permissions: [],
            isAdmin: false,
            hasPermission: () => false,
            accountType: 'individual' as AccountType,
            isAgency: false,
            companies: [],
            activeCompanyId: null,
            activeCompany: null,
            setActiveCompany: () => { },
            workspaceModules: [],
            isModuleEnabled: () => false,
            enabledFeatures: [],
            isFeatureEnabled: () => false,
            isDeveloperMode: false,
            setDeveloperMode: () => { }
        };
    }
    return context;
};

// Facade hooks for backward compatibility
export const useAuth = () => {
    const { user, tenant, isAuthenticated, isAuthLoading, login, register, forgotPassword, logout, refreshAuth, token } = useUnifiedApp();
    return {
        user,
        tenant,
        isAuthenticated,
        isLoading: isAuthLoading,
        login,
        register,
        forgotPassword,
        logout,
        refreshAuth,
        token,
        updateUser: async (u: any) => { },
        updateTenant: async (t: any) => { }
    };
};

export const usePermissionContext = () => {
    const { role, permissions, isAdmin, hasPermission } = useUnifiedApp();

    const hasAnyPermission = (perms: string[]) => perms.some(p => hasPermission(p));
    const hasAllPermissions = (perms: string[]) => perms.every(p => hasPermission(p));

    return {
        role,
        permissions,
        isAdmin,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isLoading: false,
        refreshPermissions: async () => { }
    };
};

export const useCompany = () => {
    const { accountType, isAgency, companies, activeCompanyId, activeCompany, setActiveCompany } = useUnifiedApp();
    return { accountType, isAgency, isIndividual: !isAgency, companies, activeCompanyId, activeCompany, setActiveCompany, isLoading: false, isError: false };
};

export const useAccountSettings = () => {
    const { enabledFeatures, isFeatureEnabled, isModuleEnabled, workspaceModules, isDeveloperMode, setDeveloperMode } = useUnifiedApp();
    return {
        enabledFeatures,
        isFeatureEnabled,
        isModuleEnabled,
        enabledModules: workspaceModules.map(m => m.module_key),
        isDeveloperMode,
        setDeveloperMode,
        isBundleEnabled: (bundleId: string) => true,
        // Mock properties to satisfy UnifiedSettings.tsx
        config: { extraFeatureIds: [], disabledFeatureIds: [], productMode: 'full', enabledBundles: [] },
        toggleBundle: (bundleId: string) => console.log('toggleBundle', bundleId),
        setProductMode: (mode: string) => console.log('setProductMode', mode),
        resetToDefault: () => console.log('resetToDefault'),
        setConfig: (config: any) => console.log('setConfig', config)
    };
};

export const useCompanyLabel = () => {
    const { isAgency } = useUnifiedApp();
    return useMemo(() => ({
        singular: isAgency ? 'Client' : 'Business',
        plural: isAgency ? 'Clients' : 'Businesses'
    }), [isAgency]);
};
