import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to get and track the active company ID
 * Used for company-scoped modules (Growth Suite)
 */
export function useActiveCompany() {
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(() => {
    return localStorage.getItem('active_client_id');
  });

  // Listen for storage changes (when company is switched in another tab or component)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'active_client_id') {
        setActiveCompanyId(e.newValue);
      }
    };

    // Also listen for custom event when company changes in same tab
    const handleCompanyChange = () => {
      setActiveCompanyId(localStorage.getItem('active_client_id'));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('company-changed', handleCompanyChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('company-changed', handleCompanyChange);
    };
  }, []);

  // Refresh the company ID from localStorage
  const refresh = useCallback(() => {
    setActiveCompanyId(localStorage.getItem('active_client_id'));
  }, []);

  return {
    activeCompanyId,
    hasCompany: !!activeCompanyId,
    refresh,
  };
}

/**
 * Generate query key with company scope
 * Use this for Growth module queries to ensure data refreshes on company change
 */
export function companyQueryKey(baseKey: string | string[], companyId: string | null): (string | null)[] {
  const keys = Array.isArray(baseKey) ? baseKey : [baseKey];
  return [...keys, 'company', companyId];
}
