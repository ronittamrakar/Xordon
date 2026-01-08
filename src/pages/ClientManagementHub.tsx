import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useClientData, useClientOperations, UnifiedClient } from '@/hooks/useClientData';
import { TabbedLayout, TabContent, PageHeader, EmptyState, LoadingState, ErrorState } from '@/components/common/TabbedLayout';
import { ContextAwareComponent, PermissionGuard, ContextSwitcher } from '@/components/common/ContextComponents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Users, Building, Mail, Phone, Globe, Plus, Search, Edit, Trash2,
  FileTextIcon, TrendingUp, Calendar, MapPin, Users as UsersIcon,
  Zap, Activity, CheckCircle, Clock, MoreVertical
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ClientManagementHubProps {
  activeTab?: string;
  viewMode?: 'list' | 'detail' | 'create';
  selectedClientId?: string;
}

/**
 * Consolidated Client Management Hub
 * Combines SubAccounts.tsx and ClientManagement.tsx functionality
 */
export default function ClientManagementHub({
  activeTab: propActiveTab,
  viewMode: propViewMode,
  selectedClientId: propSelectedClientId
}: ClientManagementHubProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Determine active tab and view mode
  const urlTab = searchParams.get('tab');
  const urlViewMode = searchParams.get('view') as 'list' | 'detail' | 'create' || 'list';
  const urlSelectedId = searchParams.get('client_id');

  const activeTab = propActiveTab || urlTab || 'clients';
  const viewMode = propViewMode || urlViewMode;
  const selectedClientId = propSelectedClientId || urlSelectedId;

  // Data hooks
  const {
    clients,
    subaccounts,
    allClients: rawAllClients,
    loading,
    error,
    refetch,
    invalidate,
    // Mutations
    createSubaccount,
    deleteSubaccount,
    inviteSubaccountMember,
    updateSubaccountSettings,
    createProposalClient,
    updateProposalClient,
    deleteProposalClient,
    switchToSubaccount
  } = useClientData();

  const {
    handleCreateProposal,
    handleViewProposals,
    handleManageTeam,
    handleManageSettings
  } = useClientOperations();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  // Form states
  const [newSubaccountData, setNewSubaccountData] = useState({
    name: '',
    industry: '',
    timezone: 'America/New_York',
    email: '',
    phone: '',
    website: ''
  });

  const [newClientData, setNewClientData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    website: ''
  });

  useEffect(() => {
    if (propActiveTab) {
      setSearchParams({ tab: propActiveTab });
    }
    if (propViewMode) {
      setSearchParams(prev => ({ ...prev, view: propViewMode }));
    }
    if (propSelectedClientId) {
      setSearchParams(prev => ({ ...prev, client_id: propSelectedClientId }));
    }
  }, [propActiveTab, propViewMode, propSelectedClientId, setSearchParams]);

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId, view: 'list' });
  };

  const handleViewModeChange = (mode: 'list' | 'detail' | 'create', clientId?: string) => {
    const params: any = { tab: activeTab, view: mode };
    if (clientId) params.client_id = clientId;
    setSearchParams(params);
  };

  // Ensure allClients is properly typed
  const allClients = (rawAllClients || []) as UnifiedClient[];

  // Filtered data
  const filteredClients = allClients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Tab configurations
  const tabs = [
    {
      id: 'clients',
      label: 'All Clients',
      icon: <Users className="w-4 h-4" />,
      badge: allClients.length
    },
    {
      id: 'subaccounts',
      label: 'Sub-Accounts',
      icon: <Building className="w-4 h-4" />,
      badge: subaccounts.length
    },
    {
      id: 'proposal_clients',
      label: 'Proposal Clients',
      icon: <FileTextIcon className="w-4 h-4" />,
      badge: clients.length
    }
  ];

  // Client List Tab Content
  const ClientListTab = () => (
    <TabContent
      title="All Clients"
      description="View and manage all your clients and sub-accounts"
      actions={
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Client
        </Button>
      }
    >
      {loading ? (
        <LoadingState message="Loading client data..." />
      ) : error ? (
        <ErrorState message="Failed to load client data" onRetry={refetch} />
      ) : filteredClients.length === 0 ? (
        <EmptyState
          title={searchQuery ? `No matching clients` : `No clients yet`}
          description={searchQuery
            ? 'Try adjusting your search query'
            : 'Create your first client to get started'}
          illustration={<Users className="w-16 h-16 mx-auto text-muted-foreground" />}
          action={{
            label: "Create Client",
            onClick: () => setShowCreateDialog(true),
            icon: <Plus className="w-4 h-4" />
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Clients Grid */}
          <div className="grid gap-4">
            {filteredClients.map((client) => (
              <Card key={client.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {client.logo_url ? (
                          <img src={client.logo_url} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          client.name.charAt(0).toUpperCase()
                        )}
                      </div>

                      {/* Info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{client.name}</span>
                          <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                            {client.status}
                          </Badge>
                          <Badge variant="outline" className="capitalize text-xs">
                            {client.type}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          {client.industry && (
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {client.industry}
                            </span>
                          )}
                          {client.company && (
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {client.company}
                            </span>
                          )}
                          {client.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {client.email}
                            </span>
                          )}
                          {client.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {client.phone}
                            </span>
                          )}
                          {client.website && (
                            <a href={client.website} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-primary">
                              <Globe className="w-3 h-3" />
                              {client.website.replace(/^https?:\/\//, '')}
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                          {client.member_count && (
                            <span className="flex items-center gap-1">
                              <UsersIcon className="w-3 h-3" />
                              {client.member_count} members
                            </span>
                          )}
                          {client.proposal_count && (
                            <span className="flex items-center gap-1">
                              <FileTextIcon className="w-3 h-3" />
                              {client.proposal_count} proposals
                            </span>
                          )}
                          {client.total_revenue && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              ${client.total_revenue.toLocaleString()}
                            </span>
                          )}
                          {client.last_contacted && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Last: {new Date(client.last_contacted).toLocaleDateString()}
                            </span>
                          )}
                          {client.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {client.city}{client.state ? `, ${client.state}` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {client.type === 'subaccount' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => switchToSubaccount(parseInt(client.id))}
                          className="gap-1"
                        >
                          <Activity className="w-4 h-4" />
                          Switch
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewModeChange('detail', client.id)}>
                            <Edit className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>

                          {client.type === 'subaccount' && (
                            <>
                              <DropdownMenuItem onClick={() => {
                                setSelectedClient(client);
                                setShowTeamDialog(true);
                              }}>
                                <UsersIcon className="w-4 h-4 mr-2" />
                                Manage Team
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedClient(client);
                                setShowSettingsDialog(true);
                              }}>
                                <Zap className="w-4 h-4 mr-2" />
                                Manage Features
                              </DropdownMenuItem>
                            </>
                          )}

                          {client.type === 'proposal_client' && (
                            <>
                              <DropdownMenuItem onClick={() => navigate(handleViewProposals(client.id))}>
                                <FileTextIcon className="w-4 h-4 mr-2" />
                                View Proposals
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                const proposalData = handleCreateProposal(client);
                                navigate(`/proposals/new?${new URLSearchParams(proposalData as any)}`);
                              }}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Proposal
                              </DropdownMenuItem>
                            </>
                          )}

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${client.name}?`)) {
                                if (client.type === 'subaccount') {
                                  deleteSubaccount(parseInt(client.id));
                                } else {
                                  deleteProposalClient(client.id);
                                }
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </TabContent>
  );

  // Sub-Accounts Tab Content
  const SubAccountsTab = () => (
    <TabContent
      title="Sub-Accounts"
      description="Manage client businesses and their team members"
      actions={
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Sub-Account
        </Button>
      }
    >
      {loading ? (
        <LoadingState message="Loading sub-accounts..." />
      ) : error ? (
        <ErrorState message="Failed to load sub-accounts" onRetry={refetch} />
      ) : subaccounts.length === 0 ? (
        <EmptyState
          title="No Sub-Accounts"
          description="Create your first sub-account to start managing client businesses."
          illustration={<Building className="w-16 h-16 mx-auto text-muted-foreground" />}
          action={{
            label: "Create Sub-Account",
            onClick: () => setShowCreateDialog(true),
            icon: <Plus className="w-4 h-4" />
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Sub-Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{subaccounts.length}</div>
                <div className="text-xs text-muted-foreground">
                  {subaccounts.filter(s => s.status === 'active').length} active
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {subaccounts.reduce((sum, s) => sum + (s.member_count || 0), 0)}
                </div>
                <div className="text-xs text-muted-foreground">Across all sub-accounts</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Avg. Members per Account</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {subaccounts.length > 0 ? Math.round(subaccounts.reduce((sum, s) => sum + (s.member_count || 0), 0) / subaccounts.length) : 0}
                </div>
                <div className="text-xs text-muted-foreground">Team size average</div>
              </CardContent>
            </Card>
          </div>

          {/* Sub-Accounts List */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {subaccounts.map((subaccount) => (
                  <div key={subaccount.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {subaccount.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{subaccount.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {subaccount.industry || 'No industry'} • {subaccount.email}
                        </div>
                      </div>
                      <Badge variant={subaccount.status === 'active' ? 'default' : 'secondary'}>
                        {subaccount.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => switchToSubaccount(parseInt(subaccount.id))}
                      >
                        <Activity className="w-4 h-4 mr-2" />
                        Switch
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedClient(subaccount);
                          setShowTeamDialog(true);
                        }}
                      >
                        <UsersIcon className="w-4 h-4 mr-2" />
                        Team ({subaccount.member_count || 0})
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedClient(subaccount);
                          setShowSettingsDialog(true);
                        }}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </TabContent>
  );

  // Proposal Clients Tab Content
  const ProposalClientsTab = () => (
    <TabContent
      title="Proposal Clients"
      description="Track proposal history and revenue for each client"
      actions={
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Client
        </Button>
      }
    >
      {loading ? (
        <LoadingState message="Loading proposal clients..." />
      ) : error ? (
        <ErrorState message="Failed to load proposal clients" onRetry={refetch} />
      ) : clients.length === 0 ? (
        <EmptyState
          title="No Proposal Clients"
          description="Create your first proposal client to start managing proposals."
          illustration={<FileTextIcon className="w-16 h-16 mx-auto text-muted-foreground" />}
          action={{
            label: "Create Client",
            onClick: () => setShowCreateDialog(true),
            icon: <Plus className="w-4 h-4" />
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clients.length}</div>
                <div className="text-xs text-muted-foreground">In proposal system</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Proposals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {clients.reduce((sum, c) => sum + (c.proposal_count || 0), 0)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Across all clients
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${clients.reduce((sum, c) => sum + (c.total_revenue || 0), 0).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Accepted proposals</div>
              </CardContent>
            </Card>
          </div>

          {/* Clients List */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {clients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{client.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {client.company && `${client.company} • `}{client.email}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {client.proposal_count || 0} proposals • ${client.total_revenue?.toLocaleString() || '0'} revenue
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(handleViewProposals(client.id))}
                      >
                        <FileTextIcon className="w-4 h-4 mr-2" />
                        View Proposals
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const proposalData = handleCreateProposal(client);
                          navigate(`/proposals/new?${new URLSearchParams(proposalData as any)}`);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        New Proposal
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </TabContent>
  );

  // Create Dialog
  const CreateDialog = () => (
    <>
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Client</DialogTitle>
            <DialogDescription>
              Choose the type of client you want to create
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Sub-Account Creation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Sub-Account (Client Business)
                </CardTitle>
                <CardDescription>
                  Create a full client business with team management and feature settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="subaccount_name">Business Name *</Label>
                    <Input
                      id="subaccount_name"
                      placeholder="Acme Corporation"
                      value={newSubaccountData.name}
                      onChange={(e) => setNewSubaccountData({ ...newSubaccountData, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="subaccount_industry">Industry</Label>
                      <Select
                        value={newSubaccountData.industry}
                        onValueChange={(v) => setNewSubaccountData({ ...newSubaccountData, industry: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            'Marketing Agency', 'Real Estate', 'Healthcare', 'Legal Services',
                            'Financial Services', 'E-commerce', 'SaaS', 'Consulting',
                            'Construction', 'Education', 'Other'
                          ].map(i => (
                            <SelectItem key={i} value={i}>{i}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="subaccount_timezone">Timezone</Label>
                      <Select
                        value={newSubaccountData.timezone}
                        onValueChange={(v) => setNewSubaccountData({ ...newSubaccountData, timezone: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
                            'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'UTC'
                          ].map(tz => (
                            <SelectItem key={tz} value={tz}>{tz.replace('_', ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="subaccount_email">Contact Email</Label>
                    <Input
                      id="subaccount_email"
                      type="email"
                      placeholder="contact@client.com"
                      value={newSubaccountData.email}
                      onChange={(e) => setNewSubaccountData({ ...newSubaccountData, email: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="subaccount_phone">Phone</Label>
                      <Input
                        id="subaccount_phone"
                        placeholder="+1 (555) 123-4567"
                        value={newSubaccountData.phone}
                        onChange={(e) => setNewSubaccountData({ ...newSubaccountData, phone: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="subaccount_website">Website</Label>
                      <Input
                        id="subaccount_website"
                        placeholder="https://client.com"
                        value={newSubaccountData.website}
                        onChange={(e) => setNewSubaccountData({ ...newSubaccountData, website: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                  <Button
                    onClick={async () => {
                      try {
                        const result = await createSubaccount(newSubaccountData);

                        // Auto-invite if email is present
                        if (result?.id && newSubaccountData.email) {
                          try {
                            await inviteSubaccountMember({
                              subaccountId: result.id,
                              data: { email: newSubaccountData.email, role: 'admin' }
                            });
                            toast({ title: 'Invitation sent', description: `Invited ${newSubaccountData.email} to the new sub-account.` });
                          } catch (inviteError) {
                            console.error('Auto-invite failed:', inviteError);
                            toast({ title: 'Invite failed', description: 'Sub-account created but failed to send invite.', variant: 'warning' });
                          }
                        }

                        setShowCreateDialog(false);
                        setNewSubaccountData({
                          name: '', industry: '', timezone: 'America/New_York',
                          email: '', phone: '', website: ''
                        });
                        // Success toast handled by createSubaccount mutation wrapper
                      } catch (err: any) {
                        toast({ title: 'Error', description: err.message, variant: 'destructive' });
                      }
                    }}
                    disabled={!newSubaccountData.name.trim()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Sub-Account
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Proposal Client Creation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileTextIcon className="w-4 h-4" />
                  Proposal Client
                </CardTitle>
                <CardDescription>
                  Create a client for proposal management only
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="client_name">Client Name *</Label>
                    <Input
                      id="client_name"
                      placeholder="John Doe"
                      value={newClientData.name}
                      onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="client_email">Email *</Label>
                    <Input
                      id="client_email"
                      type="email"
                      placeholder="client@example.com"
                      value={newClientData.email}
                      onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="client_company">Company</Label>
                      <Input
                        id="client_company"
                        placeholder="Acme Inc."
                        value={newClientData.company}
                        onChange={(e) => setNewClientData({ ...newClientData, company: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="client_phone">Phone</Label>
                      <Input
                        id="client_phone"
                        placeholder="+1 (555) 123-4567"
                        value={newClientData.phone}
                        onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                  <Button
                    onClick={async () => {
                      try {
                        await createProposalClient(newClientData);
                        setShowCreateDialog(false);
                        setNewClientData({ name: '', email: '', company: '', phone: '', website: '' });
                        toast({ title: 'Client created', description: 'Proposal client has been created successfully.' });
                      } catch (err: any) {
                        toast({ title: 'Error', description: err.message, variant: 'destructive' });
                      }
                    }}
                    disabled={!newClientData.name.trim() || !newClientData.email.trim()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Client
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  return (
    <div className="p-6 space-y-6">
      <TabbedLayout
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        title="Client Management"
        description="Manage all your clients, sub-accounts, and proposal clients"
      >
        {activeTab === 'clients' && <ClientListTab />}
        {activeTab === 'subaccounts' && <SubAccountsTab />}
        {activeTab === 'proposal_clients' && <ProposalClientsTab />}
      </TabbedLayout>

      <CreateDialog />
    </div>
  );
}