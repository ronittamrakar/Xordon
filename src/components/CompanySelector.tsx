import { useState, useEffect } from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
interface Company {
  id: string;
  name: string;
  domain?: string;
  logoUrl?: string;
  status: string;
  userRole: string;
}

interface AllowedCompaniesResponse {
  companies: Company[];
  activeCompanyId: string | null;
  workspaceId: string;
}

export function CompanySelector() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const tenantId = localStorage.getItem('tenant_id');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (tenantId) headers['X-Workspace-Id'] = tenantId;
      
      const res = await fetch('/api/companies/allowed', { headers });
      if (!res.ok) throw new Error('Failed to fetch companies');
      const response: AllowedCompaniesResponse = await res.json();
      setCompanies(response.companies || []);
      
      // Use the active company from response, or from localStorage, or first available
      const storedCompanyId = localStorage.getItem('active_client_id');
      const serverActiveId = response.activeCompanyId;
      
      if (serverActiveId && response.companies.some(c => c.id === serverActiveId)) {
        setActiveCompanyId(serverActiveId);
        localStorage.setItem('active_client_id', serverActiveId);
      } else if (storedCompanyId && response.companies.some(c => c.id === storedCompanyId)) {
        setActiveCompanyId(storedCompanyId);
      } else if (response.companies.length > 0) {
        const firstId = response.companies[0].id;
        setActiveCompanyId(firstId);
        localStorage.setItem('active_client_id', firstId);
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCompany = (companyId: string) => {
    setActiveCompanyId(companyId);
    localStorage.setItem('active_client_id', companyId);
    
    // Store full company info for display purposes
    const company = companies.find(c => c.id === companyId);
    if (company) {
      localStorage.setItem('active_client', JSON.stringify({
        id: company.id,
        name: company.name,
        domain: company.domain,
        logoUrl: company.logoUrl
      }));
    }
    
    // Reload the page to apply the new company context
    window.location.reload();
  };

  const activeCompany = companies.find(c => c.id === activeCompanyId);

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled className="gap-2">
        <Building2 className="h-4 w-4" />
        <span className="text-sm">Loading...</span>
      </Button>
    );
  }

  if (companies.length === 0) {
    return null;
  }

  if (companies.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>{companies[0].name}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 max-w-[200px]">
          <Building2 className="h-4 w-4 flex-shrink-0" />
          <span className="truncate text-sm">
            {activeCompany?.name || 'Select Company'}
          </span>
          <ChevronDown className="h-3 w-3 flex-shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px]">
        {companies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => handleSelectCompany(company.id)}
            className="flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              {company.logoUrl ? (
                <img 
                  src={company.logoUrl} 
                  alt={company.name}
                  className="h-5 w-5 rounded object-cover flex-shrink-0"
                />
              ) : (
                <Building2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              )}
              <span className="truncate">{company.name}</span>
            </div>
            {company.id === activeCompanyId && (
              <Check className="h-4 w-4 flex-shrink-0 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
