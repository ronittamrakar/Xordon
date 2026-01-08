import React from 'react';
import { Building2, Check, ChevronDown, Plus, Users } from 'lucide-react';
import { useCompany, useCompanyLabel } from '@/contexts/UnifiedAppContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface CompanySwitcherProps {
  collapsed?: boolean;
  showAddButton?: boolean;
  className?: string;
}

export function CompanySwitcher({ collapsed = false, showAddButton = true, className }: CompanySwitcherProps) {
  const navigate = useNavigate();
  const {
    companies,
    activeCompanyId,
    activeCompany,
    setActiveCompany,
    isAgency,
    isLoading,
  } = useCompany();
  const labels = useCompanyLabel();

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" className={`h-9 ${collapsed ? 'w-9 p-0' : 'w-full justify-start'} ${className}`} disabled>
        <Building2 className="h-4 w-4" />
        {!collapsed && <span className="ml-2 truncate">Loading...</span>}
      </Button>
    );
  }

  if (companies.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={`h-9 ${collapsed ? 'w-9 p-0' : 'w-full justify-start'} ${className}`}
        onClick={() => navigate(isAgency ? '/clients/new' : '/settings/business')}
      >
        <Plus className="h-4 w-4" />
        {!collapsed && <span className="ml-2">Add {labels.singular}</span>}
      </Button>
    );
  }

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-9 ${collapsed ? 'w-9 p-0 justify-center' : 'w-full justify-between'} ${className}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {activeCompany?.logoUrl ? (
              <Avatar className="h-5 w-5">
                <AvatarImage src={activeCompany.logoUrl} alt={activeCompany.name} />
                <AvatarFallback className="text-[12px]">
                  {getInitials(activeCompany.name)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Building2 className="h-4 w-4 shrink-0" />
            )}
            {!collapsed && (
              <span className="truncate text-sm font-medium">
                {activeCompany?.name ?? `Select ${labels.singular}`}
              </span>
            )}
          </div>
          {!collapsed && <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{labels.plural}</span>
          {isAgency && (
            <Badge variant="secondary" className="text-xs">
              Agency
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {companies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => setActiveCompany(company.id)}
            className="flex items-center gap-2 cursor-pointer"
          >
            {company.logoUrl ? (
              <Avatar className="h-6 w-6">
                <AvatarImage src={company.logoUrl} alt={company.name} />
                <AvatarFallback className="text-[12px]">
                  {getInitials(company.name)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                <Building2 className="h-3 w-3" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-medium">{company.name}</div>
              {company.domain && (
                <div className="truncate text-xs text-muted-foreground">{company.domain}</div>
              )}
            </div>
            {company.id === activeCompanyId && (
              <Check className="h-4 w-4 text-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}

        {showAddButton && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate(isAgency ? '/clients/new' : '/settings/business')}
              className="cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add {labels.singular}
            </DropdownMenuItem>
            {isAgency && (
              <DropdownMenuItem
                onClick={() => navigate('/clients')}
                className="cursor-pointer"
              >
                <Users className="h-4 w-4 mr-2" />
                Manage {labels.plural}
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default CompanySwitcher;
