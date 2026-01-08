import React from 'react';
import { useAgencyData, useAgencyPermissions } from '@/hooks/useAgencyData';
import { useClientData } from '@/hooks/useClientData';
import { useTenantOptional } from '@/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, User, Building, Users, AlertTriangle } from 'lucide-react';

export interface ContextAwareProps {
  children: React.ReactNode;
  context: 'agency' | 'subaccount' | 'client' | 'user';
  fallback?: React.ReactNode;
  showContextIndicator?: boolean;
}

/**
 * Component that adapts its behavior based on the current context
 * Used to show different content based on whether user is in agency or sub-account context
 */
export function ContextAwareComponent({ 
  children, 
  context, 
  fallback, 
  showContextIndicator = true 
}: ContextAwareProps) {
  const tenant = useTenantOptional();
  const currentContext = tenant?.currentSubaccount ? 'subaccount' : 'agency';
  
  // For client context, we check if we're viewing a specific client
  const isClientContext = context === 'client' && !!tenant?.currentSubaccount;
  
  // Determine if this component should render based on context
  const shouldRender = () => {
    switch (context) {
      case 'agency':
        return currentContext === 'agency';
      case 'subaccount':
        return currentContext === 'subaccount';
      case 'client':
        return isClientContext;
      case 'user':
        return true; // Always render for user context
      default:
        return true;
    }
  };

  if (!shouldRender()) {
    return fallback || null;
  }

  return (
    <div className="context-aware-component">
      {showContextIndicator && (
        <div className="mb-4">
          <ContextIndicator context={currentContext} />
        </div>
      )}
      {children}
    </div>
  );
}

interface ContextIndicatorProps {
  context: 'agency' | 'subaccount';
  className?: string;
}

/**
 * Visual indicator showing current context
 */
export function ContextIndicator({ context, className = '' }: ContextIndicatorProps) {
  const tenant = useTenantOptional();
  
  if (context === 'agency') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge variant="outline" className="flex items-center gap-2">
          <Building className="w-4 h-4" />
          <span>Agency: {tenant?.currentAgency?.name}</span>
        </Badge>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="default" className="flex items-center gap-2 bg-primary/10 text-primary">
        <Users className="w-4 h-4" />
        <span>Client: {tenant?.currentSubaccount?.name}</span>
      </Badge>
    </div>
  );
}

export interface PermissionGuardProps {
  children: React.ReactNode;
  permission: 'owner' | 'admin' | 'user' | 'readonly';
  fallback?: React.ReactNode;
  showDeniedMessage?: boolean;
}

/**
 * Component that restricts access based on user permissions
 * Used throughout Agency Management Hub and Client Management Hub
 */
export function PermissionGuard({ 
  children, 
  permission, 
  fallback, 
  showDeniedMessage = true 
}: PermissionGuardProps) {
  const { userRole, isAgencyOwner, isAgencyAdmin, isAgencyUser } = useAgencyPermissions();
  
  const hasPermission = () => {
    switch (permission) {
      case 'owner':
        return isAgencyOwner;
      case 'admin':
        return isAgencyAdmin;
      case 'user':
        return isAgencyUser;
      case 'readonly':
        return isAgencyUser; // All users can read
      default:
        return false;
    }
  };

  if (!hasPermission()) {
    if (fallback) {
      return fallback;
    }
    
    if (showDeniedMessage) {
      return (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You need {permission} permissions to access this feature. 
            Current role: {userRole}
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  }

  return <>{children}</>;
}

export interface FeatureGuardProps {
  children: React.ReactNode;
  feature: 'crm' | 'email' | 'sms' | 'calls' | 'automations' | 'reporting' | 'ai';
  subaccountId?: string;
  fallback?: React.ReactNode;
}

/**
 * Component that restricts access based on feature availability
 * Used to show/hide features based on subscription or settings
 */
export function FeatureGuard({ 
  children, 
  feature, 
  subaccountId, 
  fallback 
}: FeatureGuardProps) {
  const { subaccounts } = useClientData();
  
  // For now, we'll assume all features are available
  // In a real implementation, this would check:
  // - Subscription plan limits
  // - Sub-account feature settings
  // - Agency-wide feature availability
  
  const isFeatureEnabled = () => {
    // Check if we're in a sub-account context and check its settings
    if (subaccountId) {
      const subaccount = subaccounts.find(sa => sa.id === subaccountId);
      if (subaccount) {
        // Check sub-account specific feature settings
        return true; // Simplified for now
      }
    }
    
    // Check agency-wide settings or subscription
    return true; // Simplified for now
  };

  if (!isFeatureEnabled()) {
    if (fallback) {
      return fallback;
    }
    
    return (
      <Alert variant="default" className="mt-4">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        <AlertTitle>Feature Unavailable</AlertTitle>
        <AlertDescription>
          The {feature} feature is not available in your current plan or settings.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}

export interface DataProviderProps {
  children: React.ReactNode;
  type: 'agency' | 'client' | 'subaccount';
  id?: string;
}

/**
 * Higher-order component that provides data context
 * Used to wrap tab content with appropriate data
 */
export function DataProvider({ children, type, id }: DataProviderProps) {
  const agencyData = useAgencyData();
  const clientData = useClientData();
  
  // Create a context object that provides the appropriate data
  const context = React.useMemo(() => {
    switch (type) {
      case 'agency':
        return {
          type: 'agency' as const,
          data: agencyData.agency,
          permissions: useAgencyPermissions(),
          actions: {
            update: agencyData.updateAgency,
            invalidate: agencyData.invalidate
          }
        };
      case 'client':
        const client = id ? clientData.getClientById(id) : null;
        return {
          type: 'client' as const,
          data: client,
          permissions: { canView: true, canEdit: true }, // Simplified
          actions: {
            update: clientData.updateProposalClient,
            delete: clientData.deleteProposalClient
          }
        };
      case 'subaccount':
        const subaccount = id ? clientData.getClientById(id) : null;
        return {
          type: 'subaccount' as const,
          data: subaccount,
          permissions: { canView: true, canEdit: true }, // Simplified
          actions: {
            update: clientData.updateSubaccountSettings,
            delete: clientData.deleteSubaccount
          }
        };
      default:
        return null;
    }
  }, [type, id, agencyData, clientData]);

  return (
    <div data-context={type} data-context-id={id}>
      {children}
    </div>
  );
}

export interface ContextSwitcherProps {
  onSwitch?: (contextId: string, contextType: 'agency' | 'subaccount') => void;
  className?: string;
}

/**
 * Component for switching between agency and sub-account contexts
 */
export function ContextSwitcher({ onSwitch, className = '' }: ContextSwitcherProps) {
  const { agency, subaccounts, switchToSubaccount } = useAgencyData();
  const tenant = useTenantOptional();
  
  const handleSwitch = (contextId: string, contextType: 'agency' | 'subaccount') => {
    if (contextType === 'agency') {
      // Switch to agency context
      // This would typically involve updating the tenant context
      onSwitch?.(contextId, contextType);
    } else {
      // Switch to sub-account context
      switchToSubaccount(parseInt(contextId));
      onSwitch?.(contextId, contextType);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Context Switcher
        </CardTitle>
        <CardDescription>
          Switch between agency and client views
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Context */}
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">Current:</span>
          {tenant?.currentSubaccount ? (
            <Badge variant="default">
              Client: {tenant.currentSubaccount.name}
            </Badge>
          ) : (
            <Badge variant="outline">
              Agency: {agency?.name}
            </Badge>
          )}
        </div>

        {/* Available Contexts */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Available Contexts:</span>
          
          {/* Agency */}
          <Button
            variant={tenant?.currentSubaccount ? "outline" : "default"}
            onClick={() => handleSwitch(agency?.id.toString() || '', 'agency')}
            className="w-full justify-start"
            disabled={!agency}
          >
            <Building className="w-4 h-4 mr-2" />
            {agency?.name || 'Agency'}
          </Button>

          {/* Sub-accounts */}
          {subaccounts.map((subaccount) => (
            <Button
              key={subaccount.id}
              variant={tenant?.currentSubaccount?.id === subaccount.id ? "default" : "outline"}
              onClick={() => handleSwitch(subaccount.id, 'subaccount')}
              className="w-full justify-start"
            >
              <Users className="w-4 h-4 mr-2" />
              {subaccount.name}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}