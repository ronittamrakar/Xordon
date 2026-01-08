import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import multiTenantApi from '@/services/multiTenantApi';
import { proposalApi } from '@/lib/api';
import { useToast } from './use-toast';
import { useTenantOptional } from '@/contexts/TenantContext';
import { useAgencyData } from './useAgencyData';

export interface UnifiedClient {
  id: string;
  name: string;
  type: 'subaccount' | 'proposal_client';
  email: string;
  phone?: string;
  industry?: string;
  status: 'active' | 'inactive';
  member_count?: number;
  proposal_count?: number;
  total_revenue?: number;
  last_contacted?: string;
  // Sub-account specific
  logo_url?: string;
  website?: string;
  city?: string;
  state?: string;
  timezone?: string;
  // Proposal client specific
  company?: string;
}

export interface ClientData {
  clients: UnifiedClient[];
  subaccounts: UnifiedClient[];
  loading: boolean;
  error: any;
  refetch: () => Promise<void>;
}

/**
 * Shared state hook for client and sub-account data
 * Consolidates data from both SubAccounts.tsx and ClientManagement.tsx
 */
export function useClientData() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const tenant = useTenantOptional();
  const agencyId = tenant?.currentAgency?.id;

  const {
    data: clientData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['client-data', agencyId],
    queryFn: async () => {
      if (!agencyId) return { clients: [], subaccounts: [] };

      try {
        // Fetch data from both sources in parallel
        const [subaccountsResponse, proposalClientsResponse] = await Promise.all([
          multiTenantApi.listSubaccounts(agencyId),
          proposalApi.getClients()
        ]);

        // Transform sub-accounts to unified format
        const subaccounts = (subaccountsResponse.items || []).map(sa => ({
          id: sa.id.toString(),
          name: sa.name,
          type: 'subaccount' as const,
          email: sa.email || '',
          phone: sa.phone,
          industry: sa.industry,
          status: sa.status,
          member_count: sa.member_count,
          logo_url: sa.logo_url,
          website: sa.website,
          city: sa.city,
          state: sa.state,
          timezone: sa.timezone
        }));

        // Transform proposal clients to unified format
        const clients = (proposalClientsResponse.items || []).map(pc => ({
          id: pc.id.toString(),
          name: pc.name,
          type: 'proposal_client' as const,
          email: pc.email,
          phone: pc.phone,
          company: pc.company,
          status: 'active' as const, // Assume active for proposal clients
          proposal_count: pc.proposal_count,
          total_revenue: pc.total_revenue,
          last_contacted: pc.last_contacted
        }));

        return {
          clients: clients as UnifiedClient[],
          subaccounts: subaccounts as UnifiedClient[]
        };
      } catch (err) {
        console.error('Failed to load client data:', err);
        throw err;
      }
    },
    enabled: !!agencyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['client-data', agencyId] });
  };

  // Sub-account mutations
  const createSubaccount = useMutation({
    mutationFn: (data: any) => multiTenantApi.createSubaccount(agencyId!, data),
    onSuccess: (result) => {
      toast({ title: 'Sub-account created', description: `${result.name} has been created successfully.` });
      invalidate();
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to create sub-account.',
        variant: 'destructive'
      });
    }
  });

  const deleteSubaccount = useMutation({
    mutationFn: (subaccountId: number) => multiTenantApi.deleteSubaccount(subaccountId),
    onSuccess: () => {
      toast({ title: 'Deleted', description: 'Sub-account removed successfully' });
      invalidate();
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete sub-account.',
        variant: 'destructive'
      });
    }
  });

  const inviteSubaccountMember = useMutation({
    mutationFn: ({ subaccountId, data }: { subaccountId: number; data: any }) =>
      multiTenantApi.inviteSubaccountMember(subaccountId, data),
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

  const updateSubaccountSettings = useMutation({
    mutationFn: ({ subaccountId, settings }: { subaccountId: number; settings: any }) =>
      multiTenantApi.updateSubaccountSettings(subaccountId, settings),
    onSuccess: () => {
      toast({ title: 'Settings updated', description: 'Sub-account settings saved successfully' });
      invalidate();
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update settings.',
        variant: 'destructive'
      });
    }
  });

  // Proposal client mutations
  const createProposalClient = useMutation({
    mutationFn: (data: any) => proposalApi.createClient(data),
    onSuccess: () => {
      toast({ title: 'Client created', description: 'Client has been created successfully.' });
      invalidate();
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to create client.',
        variant: 'destructive'
      });
    }
  });

  const updateProposalClient = useMutation({
    mutationFn: ({ clientId, data }: { clientId: string; data: any }) =>
      proposalApi.updateClient(clientId, data),
    onSuccess: () => {
      toast({ title: 'Client updated', description: 'Client information has been updated.' });
      invalidate();
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update client.',
        variant: 'destructive'
      });
    }
  });

  const deleteProposalClient = useMutation({
    mutationFn: (clientId: string) => proposalApi.deleteClient(clientId),
    onSuccess: () => {
      toast({ title: 'Client deleted', description: 'Client has been removed.' });
      invalidate();
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete client.',
        variant: 'destructive'
      });
    }
  });

  // Combined operations
  const switchToSubaccount = useMutation({
    mutationFn: (subaccountId: number) => multiTenantApi.switchSubaccount(subaccountId),
    onSuccess: () => {
      toast({ title: 'Switched', description: 'Now viewing sub-account context.' });
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

  // Helper functions
  const getAllClients = () => {
    const clients = clientData?.clients || [];
    const subaccounts = clientData?.subaccounts || [];
    return [...clients, ...subaccounts];
  };

  const getClientById = (id: string) => {
    const allClients = getAllClients();
    return allClients.find(c => c.id === id);
  };

  const getClientsByType = (type: 'subaccount' | 'proposal_client') => {
    const allClients = getAllClients();
    return allClients.filter(c => c.type === type);
  };

  const searchClients = (query: string) => {
    const allClients = getAllClients();
    const q = query.toLowerCase();
    return allClients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.industry?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q)
    );
  };

  return {
    // Data
    clients: clientData?.clients || [],
    subaccounts: clientData?.subaccounts || [],
    allClients: getAllClients(),

    // State
    loading: isLoading,
    error,

    // Actions
    refetch,
    invalidate,

    // Search and filtering
    getClientById,
    getClientsByType,
    searchClients,

    // Mutations
    createSubaccount: createSubaccount.mutateAsync,
    deleteSubaccount: deleteSubaccount.mutateAsync,
    inviteSubaccountMember: inviteSubaccountMember.mutateAsync,
    updateSubaccountSettings: updateSubaccountSettings.mutateAsync,
    createProposalClient: createProposalClient.mutateAsync,
    updateProposalClient: updateProposalClient.mutateAsync,
    deleteProposalClient: deleteProposalClient.mutateAsync,
    switchToSubaccount: switchToSubaccount.mutateAsync,

    // Loading states
    isCreatingSubaccount: createSubaccount.isPending,
    isDeletingSubaccount: deleteSubaccount.isPending,
    isInvitingMember: inviteSubaccountMember.isPending,
    isUpdatingSettings: updateSubaccountSettings.isPending,
    isCreatingClient: createProposalClient.isPending,
    isUpdatingClient: updateProposalClient.isPending,
    isDeletingClient: deleteProposalClient.isPending,
    isSwitchingContext: switchToSubaccount.isPending,
  };
}

/**
 * Hook for client-specific operations and permissions
 */
export function useClientOperations() {
  const { switchToSubaccount, createProposalClient } = useClientData();
  const { switchToSubaccount: switchContext } = useAgencyData();

  const handleCreateProposal = (client: UnifiedClient) => {
    // This would typically navigate to proposal creation
    // For now, we'll just return the client data
    return {
      client_id: client.id,
      client_name: client.name,
      client_email: client.email,
      client_company: client.company || client.name
    };
  };

  const handleViewProposals = (clientId: string) => {
    // This would navigate to proposals list filtered by client
    return `/proposals?client_id=${clientId}`;
  };

  const handleManageTeam = (subaccount: UnifiedClient) => {
    // This would open team management modal
    return {
      subaccountId: parseInt(subaccount.id),
      subaccountName: subaccount.name
    };
  };

  const handleManageSettings = (subaccount: UnifiedClient) => {
    // This would open settings modal
    return {
      subaccountId: parseInt(subaccount.id),
      subaccountName: subaccount.name
    };
  };

  return {
    handleCreateProposal,
    handleViewProposals,
    handleManageTeam,
    handleManageSettings,
    switchToSubaccount,
    createProposalClient
  };
}