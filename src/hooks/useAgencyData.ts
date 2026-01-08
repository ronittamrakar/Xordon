import { useState, useEffect, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import multiTenantApi from '@/services/multiTenantApi';
import { useTenantOptional } from '@/contexts/TenantContext';
import { useToast } from './use-toast';

export interface AgencyData {
  agency: any;
  userRole: string;
  subaccounts: any[];
  teamMembers: any[];
  usage: any;
  limits: any;
  recentActivity: any[];
}

export interface AgencyContextValue {
  agency: any;
  userRole: string;
  subaccounts: any[];
  teamMembers: any[];
  usage: any;
  limits: any;
  recentActivity: any[];
  isLoading: boolean;
  error: any;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

/**
 * Shared state hook for agency-related data
 * Consolidates data fetching for Agency Dashboard, Settings, and Billing
 */
export function useAgencyData() {
  const { toast } = useToast();
  const tenant = useTenantOptional();
  const queryClient = useQueryClient();
  const agencyId = tenant?.currentAgency?.id;

  const {
    data: agencyData,
    isLoading,
    error,
    refetch
  } = useQuery<AgencyData>({
    queryKey: ['agency-data', agencyId],
    queryFn: async () => {
      if (!agencyId) return null;

      try {
        // Fetch multiple endpoints in parallel
        const [agency, subaccounts, team, audit] = await Promise.all([
          multiTenantApi.getCurrentAgency(),
          multiTenantApi.listSubaccounts(agencyId),
          multiTenantApi.getAgencyTeam(agencyId),
          multiTenantApi.getAuditLog(agencyId, { limit: 5 })
        ]);

        if (!agency) {
          throw new Error('Agency not found or session expired');
        }

        return {
          agency,
          userRole: tenant?.currentAgency?.role || 'user',
          subaccounts: subaccounts?.items || [],
          teamMembers: team?.items || [],
          usage: {
            emails_sent: 12450,
            sms_sent: 3200,
            calls_made: 890,
            contacts: 45600,
          },
          limits: {
            subaccounts: {
              used: subaccounts?.items?.length || 0,
              limit: agency.max_subaccounts || 10,
              percent: agency.max_subaccounts > 0 ? ((subaccounts?.items?.length || 0) / agency.max_subaccounts) * 100 : 0
            },
            emails: {
              used: 12450,
              limit: 50000,
              percent: 24.9
            },
            sms: {
              used: 3200,
              limit: 10000,
              percent: 32
            }
          },
          recentActivity: audit?.items || []
        };
      } catch (err: any) {
        console.error('Failed to load agency data:', {
          message: err instanceof Error ? err.message : String(err),
          error: err,
          agencyId
        });
        throw err;
      }
    },
    enabled: !!agencyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['agency-data', agencyId] });
  };

  const updateAgency = useMutation({
    mutationFn: (updates: any) => multiTenantApi.updateAgency(agencyId!, updates),
    onSuccess: () => {
      toast({ title: 'Agency updated', description: 'Your changes have been saved.' });
      invalidate();
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: 'Failed to update agency settings.',
        variant: 'destructive'
      });
    }
  });

  const updateBranding = useMutation({
    mutationFn: (branding: any) => multiTenantApi.updateAgencyBranding(agencyId!, branding),
    onSuccess: () => {
      toast({ title: 'Branding saved', description: 'Your changes have been saved.' });
      invalidate();
    },
    onError: (err) => {
      toast({
        title: 'Error',
        description: 'Failed to save branding.',
        variant: 'destructive'
      });
    }
  });

  const addDomain = useMutation({
    mutationFn: (domainData: any) => multiTenantApi.addDomain(agencyId!, domainData),
    onSuccess: () => {
      toast({ title: 'Domain added', description: 'Follow the DNS instructions to verify.' });
      invalidate();
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to add domain.',
        variant: 'destructive'
      });
    }
  });

  const verifyDomain = useMutation({
    mutationFn: (domainId: number) => multiTenantApi.verifyDomain(agencyId!, domainId),
    onSuccess: () => {
      toast({ title: 'Domain verified!', description: 'SSL is now active.' });
      invalidate();
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.message || 'Verification failed.',
        variant: 'destructive'
      });
    }
  });

  const deleteDomain = useMutation({
    mutationFn: (domainId: number) => multiTenantApi.deleteDomain(agencyId!, domainId),
    onSuccess: () => {
      toast({ title: 'Domain deleted' });
      invalidate();
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete domain.',
        variant: 'destructive'
      });
    }
  });

  const inviteTeamMember = useMutation({
    mutationFn: (inviteData: any) => multiTenantApi.inviteTeamMember(agencyId!, inviteData),
    onSuccess: () => {
      toast({ title: 'Invitation sent', description: 'Team member has been invited.' });
      invalidate();
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to send invitation.',
        variant: 'destructive'
      });
    }
  });

  const removeTeamMember = useMutation({
    mutationFn: (memberId: number) => multiTenantApi.removeTeamMember(agencyId!, memberId),
    onSuccess: () => {
      toast({ title: 'Team member removed' });
      invalidate();
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to remove team member.',
        variant: 'destructive'
      });
    }
  });

  const switchToSubaccount = useMutation({
    mutationFn: (subaccountId: number) => multiTenantApi.switchSubaccount(subaccountId),
    onSuccess: () => {
      toast({ title: 'Switched', description: 'Now viewing sub-account context.' });
      // Invalidate all queries to refresh context
      queryClient.invalidateQueries();
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to switch context.',
        variant: 'destructive'
      });
    }
  });

  return {
    // Data
    agency: agencyData?.agency,
    userRole: agencyData?.userRole,
    subaccounts: agencyData?.subaccounts || [],
    teamMembers: agencyData?.teamMembers || [],
    usage: agencyData?.usage,
    limits: agencyData?.limits,
    recentActivity: agencyData?.recentActivity || [],

    // State
    isLoading,
    error,

    // Actions
    refetch,
    invalidate,

    // Mutations
    updateAgency: updateAgency.mutateAsync,
    updateBranding: updateBranding.mutateAsync,
    addDomain: addDomain.mutateAsync,
    verifyDomain: verifyDomain.mutateAsync,
    deleteDomain: deleteDomain.mutateAsync,
    inviteTeamMember: inviteTeamMember.mutateAsync,
    removeTeamMember: removeTeamMember.mutateAsync,
    switchToSubaccount: switchToSubaccount.mutateAsync,

    // Loading states
    isUpdatingAgency: updateAgency.isPending,
    isUpdatingBranding: updateBranding.isPending,
    isAddingDomain: addDomain.isPending,
    isVerifyingDomain: verifyDomain.isPending,
    isDeletingDomain: deleteDomain.isPending,
    isInvitingMember: inviteTeamMember.isPending,
    isRemovingMember: removeTeamMember.isPending,
    isSwitchingContext: switchToSubaccount.isPending,
  };
}

/**
 * Hook for checking agency permissions
 */
export function useAgencyPermissions() {
  const { userRole, agency } = useAgencyData();

  const isAgencyOwner = userRole === 'owner';
  const isAgencyAdmin = userRole === 'admin' || isAgencyOwner;
  const isAgencyUser = userRole === 'user' || isAgencyAdmin || isAgencyOwner;

  const canManageSettings = isAgencyAdmin;
  const canManageBilling = isAgencyOwner;
  const canManageTeam = isAgencyAdmin;
  const canManageDomains = isAgencyAdmin;
  const canCreateSubaccounts = isAgencyAdmin;
  const canViewAllData = isAgencyAdmin;

  return {
    userRole,
    isAgencyOwner,
    isAgencyAdmin,
    isAgencyUser,
    canManageSettings,
    canManageBilling,
    canManageTeam,
    canManageDomains,
    canCreateSubaccounts,
    canViewAllData,
    agencyMaxSubaccounts: agency?.max_subaccounts || 0,
    agencyCurrentSubaccounts: agency?.subaccount_count || 0
  };
}