import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { api, Campaign, Group } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useResizableColumns } from '@/hooks/useResizableColumns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Mail,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit,
  Search,
  MoreHorizontal,
  Eye,
  MousePointer,
  UserMinus,
  TrendingUp,
  Sidebar,
  Folder as FolderIcon,
  FolderPlus,
  BarChart3 as BarChart3Icon,
  Users as UsersIcon,
  Calendar as CalendarIcon,
  CheckCircle
} from 'lucide-react';

import { Breadcrumb } from '@/components/Breadcrumb';
import {
  PersistentResizableTable,
  PersistentResizableTableHeader,
  PersistentResizableTableHead,
  PersistentResizableTableBody,
  PersistentResizableTableRow,
  PersistentResizableTableCell,
  TableActions,
} from '@/components/ui/persistent-resizable-table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Archive,
  CheckSquare,
  Square,
  AlertTriangle,
  Zap,
  Target
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SEO from '@/components/SEO';

const Campaigns = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Always call hooks unconditionally at the top level
  const auth = useAuth();
  const { isAuthenticated, isLoading: authLoading } = auth;
  const [statusFilter, setStatusFilter] = useState('all');
  const [emailAccountFilter, setEmailAccountFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [newGroupName, setNewGroupName] = useState('');
  const [campaignType, setCampaignType] = useState<'all' | 'cold' | 'warm'>('all');

  const queryClient = useQueryClient();

  // 1. Fetch campaigns
  const {
    data: campaigns = [],
    isLoading: campaignsLoading,
    refetch: refetchCampaigns
  } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.getCampaigns(),
  });

  // 2. Fetch groups
  const {
    data: groups = [],
    isLoading: groupsLoading,
    refetch: refetchGroups
  } = useQuery({
    queryKey: ['campaign-groups'],
    queryFn: () => api.getGroups(),
  });

  const loading = campaignsLoading || groupsLoading;

  // Resizable columns configuration
  const { columnWidths, updateColumnWidth, resetColumnWidths } = useResizableColumns({
    tableKey: 'campaigns-table',
    defaultWidths: {
      'select': 35,
      'name': 200,
      'status': 80,
      'scheduled': 120,
      'created': 120,
      'progress': 300, // Reduced to more reasonable size
      'performance': 320, // Reduced to more reasonable size
      'actions': 80,
    },
    minWidth: 50,
    maxWidth: 700,
  });

  useEffect(() => {
    // Wait for authentication to load before checking
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    // Handle URL parameters for drilldown from analytics
    const filter = searchParams.get('filter');

    if (filter) {
      setStatusFilter(filter);
    }
  }, [navigate, searchParams, isAuthenticated, authLoading]);

  // Show loading spinner while authentication is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const handleStart = async (campaignId: string) => {
    try {
      await api.sendCampaign(campaignId);
      refetchCampaigns();
      toast.success('Campaign started successfully');
    } catch (error) {
      console.error('Failed to start campaign:', error);
      toast.error('Failed to start campaign. Please try again.');
    }
  };

  const handlePause = async (campaignId: string) => {
    try {
      await api.updateCampaign(campaignId, { status: 'paused' });
      toast.success('Campaign paused successfully');
      refetchCampaigns();
    } catch (error) {
      console.error('Failed to pause campaign:', error);
      toast.error('Failed to pause campaign. Please try again.');
    }
  };

  const handleDelete = async (campaignId: string) => {
    try {
      await api.updateCampaign(campaignId, { status: 'trashed' });
      toast.success('Campaign moved to trash');
      refetchCampaigns();
    } catch (error) {
      console.error('Failed to move campaign to trash:', error);
      toast.error('Failed to move campaign to trash');
    }
  };

  const handleArchive = async (campaignId: string) => {
    try {
      await api.updateCampaign(campaignId, { status: 'archived' });
      toast.success('Campaign archived successfully');
      refetchCampaigns();
    } catch (error) {
      console.error('Failed to archive campaign:', error);
      toast.error('Failed to archive campaign');
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    try {
      await api.createGroup({ name: newGroupName.trim() });
      toast.success('Group created successfully');
      setShowCreateGroupDialog(false);
      setNewGroupName('');
      refetchGroups();
    } catch (error) {
      console.error('Failed to create group:', error);
      toast.error('Failed to create group. Please try again.');
    }
  };

  const moveCampaignToGroup = async (campaignId: string, groupId?: string) => {
    try {
      await api.moveCampaignToGroup(campaignId, groupId);
      toast.success('Campaign moved successfully');
      refetchCampaigns();
    } catch (error) {
      console.error('Failed to move campaign:', error);
      toast.error('Failed to move campaign. Please try again.');
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      await api.deleteGroup(groupId);
      toast.success('Group deleted successfully');
      // If the deleted group was selected, reset to 'all'
      if (selectedGroupId === groupId) {
        setSelectedGroupId('all');
      }
      refetchGroups();
      refetchCampaigns();
    } catch (error) {
      console.error('Failed to delete group:', error);
      toast.error('Failed to delete group. Please try again.');
    }
  };

  const updateGroup = async (groupId: string, name: string) => {
    try {
      await api.updateGroup(groupId, { name });
      toast.success('Group updated successfully');
      refetchGroups();
    } catch (error) {
      console.error('Failed to update group:', error);
      toast.error('Failed to update group. Please try again.');
    }
  };

  // Bulk action handlers
  const handleSelectAll = (checked: boolean) => {
    const filteredCampaigns = getFilteredCampaigns();
    if (checked) {
      setSelectedCampaigns(filteredCampaigns.map(campaign => campaign.id));
    } else {
      setSelectedCampaigns([]);
    }
  };

  const handleSelectCampaign = (campaignId: string, checked: boolean) => {
    if (checked) {
      setSelectedCampaigns(prev => [...prev, campaignId]);
    } else {
      setSelectedCampaigns(prev => prev.filter(id => id !== campaignId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCampaigns.length === 0) return;

    const confirmed = confirm(`Are you sure you want to move ${selectedCampaigns.length} campaign(s) to trash?`);
    if (!confirmed) return;

    try {
      await Promise.all(selectedCampaigns.map(id => handleDelete(id)));
      setSelectedCampaigns([]);
    } catch (error) {
      console.error('Error deleting campaigns:', error);
    }
  };

  const handleBulkStatusChange = async (status: 'paused' | 'sending') => {
    if (selectedCampaigns.length === 0) return;

    try {
      if (status === 'sending') {
        await Promise.all(selectedCampaigns.map(id => handleStart(id)));
      } else {
        await Promise.all(selectedCampaigns.map(id => handlePause(id)));
      }

      setSelectedCampaigns([]);
    } catch (error) {
      console.error('Error updating campaign status:', error);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedCampaigns.length === 0) return;

    const confirmed = confirm(`Are you sure you want to archive ${selectedCampaigns.length} campaign(s)?`);
    if (!confirmed) return;

    try {
      // Update campaigns to archived status
      await Promise.all(selectedCampaigns.map(id =>
        api.updateCampaign(id, { status: 'archived' })
      ));

      // Refresh data
      refetchCampaigns();

      setSelectedCampaigns([]);
    } catch (error) {
      console.error('Error archiving campaigns:', error);
    }
  };





  const getStatusBadge = (status: Campaign['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary" className="bg-muted text-muted-foreground border-border hover:bg-muted">Draft</Badge>;
      case 'sending':
        return <Badge variant="default" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">Running</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">Completed</Badge>;
      case 'paused':
        return <Badge variant="secondary" className="bg-muted text-foreground border-border hover:bg-muted">Paused</Badge>;
      case 'archived':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Archived</Badge>;
      case 'trashed':
        return <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">Trashed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getProgressPercentage = (campaign: Campaign) => {
    if (campaign.totalRecipients === 0) return 0;
    return Math.round((campaign.sent / campaign.totalRecipients) * 100);
  };

  const getDeliveredCount = (campaign: Campaign) => {
    return Math.max(0, campaign.sent - campaign.bounces);
  };

  const getDeliveredPercentage = (campaign: Campaign) => {
    if (campaign.totalRecipients === 0) return 0;
    return Math.round((getDeliveredCount(campaign) / campaign.totalRecipients) * 100);
  };

  const getOpenRate = (campaign: Campaign) => {
    // Calculate open rate based on delivered emails (sent - bounces), not total recipients
    const delivered = campaign.sent - campaign.bounces;
    if (delivered <= 0) return 0;
    return Math.round((campaign.opens / delivered) * 100);
  };

  const getClickRate = (campaign: Campaign) => {
    // Calculate click rate based on opened emails, not total recipients
    if (campaign.opens === 0) return 0;
    return Math.round((campaign.clicks / campaign.opens) * 100);
  };

  const getUnsubscribeRate = (campaign: Campaign) => {
    // Calculate unsubscribe rate based on delivered emails
    const delivered = campaign.sent - campaign.bounces;
    if (delivered <= 0) return 0;
    return Math.round((campaign.unsubscribes / delivered) * 100);
  };

  const getBounceRate = (campaign: Campaign) => {
    if (campaign.totalRecipients === 0) return 0;
    return Math.round((campaign.bounces / campaign.totalRecipients) * 100);
  };

  const getFilteredCampaigns = () => {
    let filtered = campaigns.filter(c => c.status !== 'archived' && c.status !== 'trashed');

    // Filter by group
    if (selectedGroupId !== 'all') {
      if (selectedGroupId === 'none') {
        filtered = filtered.filter(c => !c.group_id);
      } else {
        filtered = filtered.filter(c => c.group_id === selectedGroupId);
      }
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Filter by campaign type
    if (campaignType !== 'all') {
      filtered = filtered.filter(c => (c.campaign_type || 'warm') === campaignType);
    }

    // Filter by email account
    if (emailAccountFilter !== 'all') {
      filtered = filtered.filter(c => {
        if (emailAccountFilter === 'gmail') {
          return c.email_account?.includes('gmail');
        }
        if (emailAccountFilter === 'outlook') {
          return c.email_account?.includes('outlook');
        }
        return true;
      });
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `Over ${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
  };

  const formatExactDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleString('en-US', options);
  };

  const formatExactDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatExactTime = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleTimeString('en-US', options);
  };

  const calculateNextSendTime = (campaign: Campaign) => {
    if (campaign.status !== 'sending') return null;

    // If campaign is sending, estimate next send based on average delay
    const now = new Date();
    const averageDelayMinutes = 30; // Default 30 minutes between sends
    const nextSend = new Date(now.getTime() + (averageDelayMinutes * 60 * 1000));

    return nextSend.toISOString();
  };

  const CampaignOverview = () => {
    const filteredCampaigns = getFilteredCampaigns();

    return (
      <div className="space-y-4">
        <Tabs defaultValue="all" className="w-full" onValueChange={(v) => setCampaignType(v as any)}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                All Campaigns
              </TabsTrigger>
              <TabsTrigger value="cold" className="gap-2 text-indigo-600">
                <Target className="h-4 w-4" />
                Email Outreach (Cold)
              </TabsTrigger>
              <TabsTrigger value="warm" className="gap-2 text-orange-600">
                <Zap className="h-4 w-4" />
                Email Marketing (Warm)
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  <SelectItem value="none">No Group</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center gap-2">
                        <FolderIcon className="h-4 w-4" />
                        {group.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Group Management Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowCreateGroupDialog(true)}>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Create Group
                  </DropdownMenuItem>
                  {groups.length > 0 && (
                    <>
                      <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                        Manage Groups:
                      </DropdownMenuItem>
                      {groups.map((group) => (
                        <div key={group.id} className="flex items-center justify-between px-2 py-1">
                          <span className="text-sm flex-1">{group.name}</span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                const newName = prompt('Enter new group name:', group.name);
                                if (newName && newName.trim() !== group.name) {
                                  updateGroup(group.id, newName.trim());
                                }
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete the group "${group.name}"? This action cannot be undone.`)) {
                                  deleteGroup(group.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sending">Running</SelectItem>
                <SelectItem value="sent">Completed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>

            <Select value={emailAccountFilter} onValueChange={setEmailAccountFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Email accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All accounts</SelectItem>
                <SelectItem value="gmail">Gmail accounts</SelectItem>
                <SelectItem value="outlook">Outlook accounts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search a campaign..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-[300px]"
            />
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedCampaigns.length > 0 && (
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {selectedCampaigns.length} campaign{selectedCampaigns.length > 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkStatusChange('sending')}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Start
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkStatusChange('paused')}
                    className="text-yellow-600 hover:text-yellow-700"
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkArchive}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Archive className="h-4 w-4 mr-1" />
                    Archive
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCampaigns([])}
                  >
                    <Square className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {filteredCampaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Mail className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {statusFilter === 'all' && !searchQuery ? 'No campaigns yet' : 'No campaigns found'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {statusFilter === 'all' && !searchQuery
                  ? 'Create your first email campaign to get started'
                  : 'Try adjusting your filters or create more campaigns'
                }
              </p>
              <Button onClick={() => navigate('/reach/outbound/email/campaigns/new')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-analytics">
            <div className="border-b border-border">
              <TableActions onResetWidths={resetColumnWidths} />
            </div>
            <div className="overflow-x-auto">
              <PersistentResizableTable tableKey="campaigns-table" className="min-w-[900px]">
                <PersistentResizableTableHeader>
                  <PersistentResizableTableRow className="hover:bg-transparent border-b">
                    <PersistentResizableTableHead columnKey="select" initialWidth={50} resizable={false}>
                      <Checkbox
                        checked={selectedCampaigns.length === filteredCampaigns.length && filteredCampaigns.length > 0}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all campaigns"
                      />
                    </PersistentResizableTableHead>
                    <PersistentResizableTableHead columnKey="name" initialWidth={200}>
                      Name
                    </PersistentResizableTableHead>
                    <PersistentResizableTableHead columnKey="status" initialWidth={80}>
                      Status
                    </PersistentResizableTableHead>
                    <PersistentResizableTableHead columnKey="scheduled" initialWidth={120}>
                      Scheduled
                    </PersistentResizableTableHead>
                    <PersistentResizableTableHead columnKey="created" initialWidth={120}>
                      Created
                    </PersistentResizableTableHead>
                    {(campaignType === 'all' || campaignType === 'cold') && (
                      <PersistentResizableTableHead columnKey="replies" initialWidth={90}>
                        Replies
                      </PersistentResizableTableHead>
                    )}
                    <PersistentResizableTableHead columnKey="sent" initialWidth={90}>
                      Sent
                    </PersistentResizableTableHead>
                    <PersistentResizableTableHead columnKey="opens" initialWidth={90}>
                      Opens
                    </PersistentResizableTableHead>
                    <PersistentResizableTableHead columnKey="clicks" initialWidth={90}>
                      Clicks
                    </PersistentResizableTableHead>
                    <PersistentResizableTableHead columnKey="bounceRate" initialWidth={90}>
                      Bounce
                    </PersistentResizableTableHead>
                    <PersistentResizableTableHead columnKey="unsubRate" initialWidth={90}>
                      Unsub
                    </PersistentResizableTableHead>
                    <PersistentResizableTableHead columnKey="actions" initialWidth={80} resizable={false}>
                      Actions
                    </PersistentResizableTableHead>
                  </PersistentResizableTableRow>
                </PersistentResizableTableHeader>
                <PersistentResizableTableBody>
                  {filteredCampaigns.map((campaign) => (
                    <PersistentResizableTableRow key={campaign.id} className="hover:bg-muted/50">
                      <PersistentResizableTableCell columnKey="select">
                        <Checkbox
                          checked={selectedCampaigns.includes(campaign.id)}
                          onCheckedChange={(checked) => handleSelectCampaign(campaign.id, checked as boolean)}
                          aria-label={`Select campaign ${campaign.name}`}
                        />
                      </PersistentResizableTableCell>
                      <PersistentResizableTableCell columnKey="name">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="font-medium text-foreground hover:text-foreground/80 cursor-pointer hover:underline"
                              onClick={() => navigate(`/reach/outbound/email/campaigns/${campaign.id}`)}
                            >
                              {campaign.name}
                            </div>
                            {campaign.group_name && (
                              <Badge variant="secondary" className="text-xs">
                                <FolderIcon className="h-3 w-3 mr-1" />
                                {campaign.group_name}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{campaign.totalRecipients} recipients</div>
                        </div>
                      </PersistentResizableTableCell>

                      <PersistentResizableTableCell columnKey="status">
                        {getStatusBadge(campaign.status)}
                      </PersistentResizableTableCell>

                      {(campaignType === 'all' || campaignType === 'cold') && (
                        <PersistentResizableTableCell columnKey="replies">
                          <div className="font-medium text-indigo-600">
                            {campaign.replies || 0}
                          </div>
                        </PersistentResizableTableCell>
                      )}

                      <PersistentResizableTableCell columnKey="scheduled">
                        <div className="space-y-1">
                          {campaign.scheduledAt ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="cursor-help">
                                    <div className="text-sm font-medium text-foreground">
                                      {formatExactDate(campaign.scheduledAt)}
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                      <CalendarIcon className="h-3 w-3" />
                                      {formatExactTime(campaign.scheduledAt)}
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs font-medium">Full DateTime</p>
                                  <p className="text-xs">{formatExactDateTime(campaign.scheduledAt)}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{formatDate(campaign.scheduledAt)}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Not scheduled</span>
                            </div>
                          )}
                        </div>
                      </PersistentResizableTableCell>

                      <PersistentResizableTableCell columnKey="created">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">
                                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  {formatExactDate(campaign.createdAt)}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <CalendarIcon className="h-3 w-3" />
                                  {formatExactTime(campaign.createdAt)}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs font-medium">Campaign Created</p>
                              <p className="text-xs">{formatExactDateTime(campaign.createdAt)}</p>
                              <p className="text-xs text-muted-foreground mt-1">{formatDate(campaign.createdAt)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </PersistentResizableTableCell>

                      <PersistentResizableTableCell columnKey="sent">
                        <div className="text-sm font-medium">{getDeliveredCount(campaign).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{getDeliveredPercentage(campaign)}%</div>
                      </PersistentResizableTableCell>

                      <PersistentResizableTableCell columnKey="opens">
                        <div className="text-sm font-medium">{campaign.opens.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{getOpenRate(campaign)}%</div>
                      </PersistentResizableTableCell>

                      <PersistentResizableTableCell columnKey="clicks">
                        <div className="text-sm font-medium">{campaign.clicks.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{getClickRate(campaign)}%</div>
                      </PersistentResizableTableCell>

                      <PersistentResizableTableCell columnKey="bounceRate">
                        <div className="text-sm font-medium">{campaign.bounces.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{getBounceRate(campaign)}%</div>
                      </PersistentResizableTableCell>

                      <PersistentResizableTableCell columnKey="unsubRate">
                        <div className="text-sm font-medium">{campaign.unsubscribes.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{getUnsubscribeRate(campaign)}%</div>
                      </PersistentResizableTableCell>

                      <PersistentResizableTableCell columnKey="actions">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/reach/outbound/email/campaigns/${campaign.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => navigate(`/reach/outbound/email/campaigns/edit/${campaign.id}`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <FolderIcon className="h-4 w-4 mr-2" />
                                Move to Group
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => moveCampaignToGroup(campaign.id, undefined)}>
                                  No Group
                                </DropdownMenuItem>
                                {groups.map((group) => (
                                  <DropdownMenuItem
                                    key={group.id}
                                    onClick={() => moveCampaignToGroup(campaign.id, group.id)}
                                  >
                                    <FolderIcon className="h-4 w-4 mr-2" />
                                    {group.name}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>

                            {campaign.status === 'draft' || campaign.status === 'paused' ? (
                              <DropdownMenuItem onClick={() => handleStart(campaign.id)}>
                                <Play className="h-4 w-4 mr-2" />
                                Start
                              </DropdownMenuItem>
                            ) : campaign.status === 'sending' ? (
                              <DropdownMenuItem onClick={() => handlePause(campaign.id)}>
                                <Pause className="h-4 w-4 mr-2" />
                                Pause
                              </DropdownMenuItem>
                            ) : null}

                            <DropdownMenuItem onClick={() => handleArchive(campaign.id)}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleDelete(campaign.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Move to Trash
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </PersistentResizableTableCell>
                    </PersistentResizableTableRow>
                  ))}
                </PersistentResizableTableBody>
              </PersistentResizableTable>
            </div>
          </Card>
        )}
      </div>
    );
  };



  return (
    <>
      <SEO
        title="Email Campaigns"
        description="Create, manage, and track your email outreach campaigns. Monitor performance with real-time analytics."
      />
      <div className="flex h-full">
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="space-y-4">
            <Breadcrumb
              items={[
                { label: 'Email Outreach', href: '/reach/outbound/email', icon: <Mail className="h-4 w-4" /> },
                { label: 'Campaigns' }
              ]}
            />

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[18px] font-bold tracking-tight text-foreground">Campaigns</h1>
                <p className="text-muted-foreground mt-1">Create and manage your email campaigns</p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateGroupDialog(true)}
                  className="border-border hover:bg-muted"
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Group
                </Button>

                <Button
                  onClick={() => navigate('/reach/outbound/email/campaigns/new')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </div>
            </div>

            <div className="page-section">
              <CampaignOverview />
            </div>
          </div>
        </div>
      </div>

      {/* Create Group Dialog */}
      <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Create a new group to organize your campaigns
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name"
                onKeyDown={(e) => e.key === 'Enter' && createGroup()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateGroupDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createGroup}>
                Create Group
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
};

export default Campaigns;
