import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ResizableTable,
  ResizableTableHeader,
  ResizableTableHead,
  ResizableTableBody,
  ResizableTableRow,
  ResizableTableCell,
} from '@/components/ui/resizable-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Smartphone,
  Search,
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  Eye,
  BarChart3,
  Trash2,
  Play,
  Pause,
  Edit,
  MoreHorizontal,
  MousePointer,
  AlertTriangle,
  FolderIcon,
  Archive,
  CheckSquare,
  Square,
  UserMinus,
  RotateCcw,
  LayoutGrid,
  List
} from 'lucide-react';

import { toast } from 'sonner';
import { api, SMSCampaign } from '../lib/api';

interface Group {
  id: string;
  name: string;
  description?: string;
}

interface SignalWireConfig {
  projectId: string;
  authToken: string;
  spaceUrl: string;
  fromNumber: string;
}

const SMSCampaigns = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<SMSCampaign[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [signalWireConfig, setSignalWireConfig] = useState<SignalWireConfig | null>(null);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  useEffect(() => {

    loadCampaigns();
    loadGroups();
    loadSignalWireSettings();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await api.getSMSCampaigns();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load SMS campaigns');
      console.error('Error loading campaigns:', err);
      toast.error('Failed to load SMS campaigns');
      setCampaigns([]); // Ensure campaigns is always an array
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const data = await api.getGroups();
      setGroups(data);
    } catch (err) {
      console.error('Error loading groups:', err);
      setGroups([]);
      toast.error('Failed to load groups');
    }
  };

  const loadSignalWireSettings = async () => {
    try {
      const settings = await api.getSMSSettings();
      if (settings.signalwireProjectId && settings.signalwireSpaceUrl && settings.signalwireApiToken) {
        setSignalWireConfig({
          projectId: settings.signalwireProjectId,
          authToken: settings.signalwireApiToken,
          spaceUrl: settings.signalwireSpaceUrl,
          fromNumber: settings.defaultSenderNumber || ''
        });
      }
    } catch (err) {
      console.error('Error loading SignalWire settings:', err);
      // Don't show error toast as this is expected if not configured
    }
  };

  const getFilteredCampaigns = () => {
    let filtered = Array.isArray(campaigns) ? campaigns : [];

    if (selectedGroupId !== 'all') {
      if (selectedGroupId === 'none') {
        filtered = filtered.filter(c => !c.group_id);
      } else {
        filtered = filtered.filter(c => c.group_id === selectedGroupId);
      }
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter out archived and trashed items unless specifically filtered
    if (statusFilter !== 'archived' && statusFilter !== 'trashed') {
      filtered = filtered.filter(c => c.status !== 'archived' && c.status !== 'trashed');
    }

    return filtered;
  };

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

  const handleBulkStatusChange = async (status: 'sending' | 'paused') => {
    if (selectedCampaigns.length === 0) return;

    const action = status === 'sending' ? 'start' : 'pause';
    const confirmed = confirm(`Are you sure you want to ${action} ${selectedCampaigns.length} SMS campaign(s)?`);
    if (!confirmed) return;

    try {
      for (const campaignId of selectedCampaigns) {
        if (status === 'sending') {
          await api.startSMSCampaign(campaignId);
        } else {
          await api.pauseSMSCampaign(campaignId);
        }
      }

      setCampaigns(prev => prev.map(campaign =>
        selectedCampaigns.includes(campaign.id)
          ? { ...campaign, status }
          : campaign
      ));

      toast.success(`${selectedCampaigns.length} SMS campaign(s) ${action}ed successfully`);
      setSelectedCampaigns([]);
    } catch (err) {
      console.error(`Error ${action}ing campaigns:`, err);
      toast.error(`Failed to ${action} SMS campaigns`);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedCampaigns.length === 0) return;

    const confirmed = confirm(`Are you sure you want to archive ${selectedCampaigns.length} SMS campaign(s)?`);
    if (!confirmed) return;

    try {
      for (const campaignId of selectedCampaigns) {
        await api.archiveSMSCampaign(campaignId);
      }

      setCampaigns(prev => prev.map(campaign =>
        selectedCampaigns.includes(campaign.id)
          ? { ...campaign, status: 'archived' as const }
          : campaign
      ));

      toast.success(`${selectedCampaigns.length} SMS campaign(s) archived successfully`);
      setSelectedCampaigns([]);
    } catch (err) {
      console.error('Error archiving campaigns:', err);
      toast.error('Failed to archive SMS campaigns');
    }
  };

  const handleBulkClear = async () => {
    if (selectedCampaigns.length === 0) return;

    const confirmed = confirm(`Are you sure you want to clear ${selectedCampaigns.length} SMS campaign(s)? This will reset their statistics.`);
    if (!confirmed) return;

    try {
      // For now, we'll just show a message since there's no clear API endpoint
      toast.info('Clear functionality not implemented yet. Use delete to remove campaigns completely.');
    } catch (err) {
      console.error('Error clearing campaigns:', err);
      toast.error('Failed to clear SMS campaigns');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCampaigns.length === 0) return;

    const confirmed = confirm(`Are you sure you want to move ${selectedCampaigns.length} SMS campaign(s) to trash?`);
    if (!confirmed) return;

    try {
      // Call API for each selected campaign
      for (const campaignId of selectedCampaigns) {
        await api.updateSMSCampaign(campaignId, { status: 'trashed' });
      }

      setCampaigns(prev => prev.map(campaign =>
        selectedCampaigns.includes(campaign.id)
          ? { ...campaign, status: 'trashed' as any }
          : campaign
      ));

      setSelectedCampaigns([]);
      toast.success(`${selectedCampaigns.length} SMS campaign(s) moved to trash successfully`);
    } catch (error) {
      console.error('Error moving campaigns to trash:', error);
      toast.error('Failed to move SMS campaigns to trash');
    }
  };

  const getStatusBadge = (status: SMSCampaign['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">Draft</Badge>;
      case 'active':
        return <Badge variant="default" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">Running</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">Completed</Badge>;
      case 'paused':
        return <Badge variant="destructive" className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50">Paused</Badge>;
      case 'archived':
        return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">Archived</Badge>;
      case 'trashed' as any:
        return <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">Trashed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getProgressPercentage = (campaign: SMSCampaign) => {
    if (!campaign.recipient_count || campaign.recipient_count === 0) return 0;
    return Math.round((campaign.sent_count / campaign.recipient_count) * 100);
  };

  const getDeliveryRate = (campaign: SMSCampaign) => {
    if (!campaign.sent_count || campaign.sent_count === 0) return 0;
    return Math.round(((campaign.delivered_count || 0) / campaign.sent_count) * 100);
  };

  const getReplyRate = (campaign: SMSCampaign) => {
    if (!campaign.delivered_count || campaign.delivered_count === 0) return 0;
    return Math.round(((campaign.reply_count || 0) / campaign.delivered_count) * 100);
  };

  const getFailureRate = (campaign: SMSCampaign) => {
    if (!campaign.sent_count || campaign.sent_count === 0) return 0;
    return Math.round(((campaign.failed_count || 0) / campaign.sent_count) * 100);
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

  const sendCampaign = async (campaignId: string) => {
    try {
      await api.sendSMSCampaign(campaignId);
      setCampaigns(prev => prev.map(campaign =>
        campaign.id === campaignId
          ? { ...campaign, status: 'sending' as const }
          : campaign
      ));
      toast.success('SMS campaign started successfully');
    } catch (err) {
      console.error('Error sending campaign:', err);
      toast.error('Failed to start SMS campaign');
    }
  };

  const pauseCampaign = async (campaignId: string) => {
    try {
      await api.pauseSMSCampaign(campaignId);
      setCampaigns(prev => prev.map(campaign =>
        campaign.id === campaignId
          ? { ...campaign, status: 'paused' as const }
          : campaign
      ));
      toast.success('SMS campaign paused successfully');
    } catch (err) {
      console.error('Error pausing campaign:', err);
      toast.error('Failed to pause SMS campaign');
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    try {
      await api.updateSMSCampaign(campaignId, { status: 'trashed' });
      setCampaigns(prev => prev.map(campaign =>
        campaign.id === campaignId ? { ...campaign, status: 'trashed' as any } : campaign
      ));
      toast.success('SMS campaign moved to trash');
    } catch (err) {
      console.error('Error moving campaign to trash:', err);
      toast.error('Failed to move SMS campaign to trash');
    }
  };

  const handleArchive = async (campaignId: string) => {
    try {
      await api.updateSMSCampaign(campaignId, { status: 'archived' });
      setCampaigns(prev => prev.map(campaign =>
        campaign.id === campaignId ? { ...campaign, status: 'archived' } : campaign
      ));
      toast.success('SMS campaign archived successfully');
    } catch (err) {
      console.error('Error archiving campaign:', err);
      toast.error('Failed to archive SMS campaign');
    }
  };



  const handleCreateCampaign = () => {
    navigate('/reach/outbound/sms/campaigns/new');
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    try {
      const groupData = {
        name: newGroupName.trim(),
        description: `SMS campaign group: ${newGroupName.trim()}`
      };

      const group = await api.createGroup(groupData);
      setGroups(prev => [...prev, group]);
      setNewGroupName('');
      setShowCreateGroupDialog(false);
      toast.success('Group created successfully');
    } catch (err) {
      console.error('Error creating group:', err);
      toast.error('Failed to create group');
    }
  };

  const updateGroup = async (groupId: string, name: string) => {
    try {
      await api.updateGroup(groupId, { name });
      toast.success('Group updated successfully');
      await loadGroups();
    } catch (error) {
      console.error('Failed to update group:', error);
      toast.error('Failed to update group. Please try again.');
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
      await loadGroups();
      await loadCampaigns();
    } catch (error) {
      console.error('Failed to delete group:', error);
      toast.error('Failed to delete group. Please try again.');
    }
  };

  const filteredCampaigns = getFilteredCampaigns();

  return (

    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[18px] font-bold tracking-tight text-foreground">SMS Campaigns</h1>
              <p className="text-muted-foreground mt-1">Manage your SMS marketing campaigns with SignalWire</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateCampaign}>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          </div>

          {!signalWireConfig && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-yellow-600" />
                    <p className="text-yellow-800">
                      SignalWire is not configured. Please configure your SignalWire settings to send SMS campaigns.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/settings#sms')}
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                  >
                    <Smartphone className="h-4 w-4 mr-2" />
                    Go to SMS Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setShowCreateGroupDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
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
                  <SelectItem value="active">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="trashed">Trashed</SelectItem>
                </SelectContent>
              </Select>

              <Select value="all" onValueChange={() => { }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="SMS accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All accounts</SelectItem>
                  <SelectItem value="signalwire">SignalWire accounts</SelectItem>
                  <SelectItem value="twilio">Twilio accounts</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-md h-10 bg-background">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-r-none px-3"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-l-none px-3"
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {selectedCampaigns.length > 0 && (
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-medium text-gray-100">
                      {selectedCampaigns.length} campaign(s) selected
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatusChange('sending')}
                      className="text-green-400 hover:text-green-300 border-gray-600 hover:bg-gray-800"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Start
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatusChange('paused')}
                      className="text-yellow-400 hover:text-yellow-300 border-gray-600 hover:bg-gray-800"
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkArchive}
                      className="text-blue-400 hover:text-blue-300 border-gray-600 hover:bg-gray-800"
                    >
                      <Archive className="h-4 w-4 mr-1" />
                      Archive
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkDelete}
                      className="text-red-400 hover:text-red-300 border-gray-600 hover:bg-gray-800"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Move to Trash
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCampaigns([])}
                      className="text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                    >
                      <Square className="h-4 w-4 mr-1" />
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <Card className="border-analytics">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground">Loading SMS campaigns...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <p className="text-red-800">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadCampaigns}
                    className="ml-auto"
                  >
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : filteredCampaigns.length === 0 ? (
            <Card className="border-analytics">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {statusFilter === 'all' && !searchQuery ? 'No SMS campaigns yet' : 'No SMS campaigns found'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {statusFilter === 'all' && !searchQuery
                    ? 'Create your first SMS campaign to get started'
                    : 'Try adjusting your filters or create more campaigns'
                  }
                </p>
                <Button onClick={handleCreateCampaign}>
                  <Plus className="h-4 w-4 mr-2" />
                  New SMS Campaign
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCampaigns.map((campaign) => (
                <Card key={campaign.id} className="relative border-analytics">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base truncate">{campaign.name}</CardTitle>
                        {campaign.group_id && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            <FolderIcon className="h-3 w-3 mr-1" />
                            {groups.find(g => g.id === campaign.group_id)?.name}
                          </Badge>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/reach/outbound/sms/campaigns/${campaign.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View/Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {campaign.status === 'sending' ? (
                            <DropdownMenuItem onClick={() => api.pauseSMSCampaign(campaign.id)}>
                              <Pause className="mr-2 h-4 w-4" />
                              Pause
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => api.startSMSCampaign(campaign.id)}>
                              <Play className="mr-2 h-4 w-4" />
                              Start (Resume)
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleArchive(campaign.id)}>
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => deleteCampaign(campaign.id)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Move to Trash
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardDescription className="line-clamp-2">{campaign.description || campaign.message}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        {getStatusBadge(campaign.status)}
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{getProgressPercentage(campaign)}%</span>
                        </div>
                        <Progress value={getProgressPercentage(campaign)} className="h-1" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-muted/50 p-2 rounded text-center">
                          <div className="font-semibold text-green-500">{campaign.delivered_count || 0}</div>
                          <div className="text-muted-foreground">Delivered</div>
                        </div>
                        <div className="bg-muted/50 p-2 rounded text-center">
                          <div className="font-semibold text-red-500">{campaign.failed_count || 0}</div>
                          <div className="text-muted-foreground">Failed</div>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground text-right border-t pt-2">
                        {campaign.scheduled_at ? `Scheduled: ${new Date(campaign.scheduled_at).toLocaleDateString()}` : `Created: ${formatDate(campaign.created_at)}`}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-analytics">
              <ResizableTable>
                <ResizableTableHeader>
                  <tr>
                    <ResizableTableHead initialWidth={50} minWidth={50} maxWidth={50} resizable={false} className="w-12">
                      <Checkbox
                        checked={selectedCampaigns.length === filteredCampaigns.length && filteredCampaigns.length > 0}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all campaigns"
                      />
                    </ResizableTableHead>
                    <ResizableTableHead initialWidth={250} minWidth={180} maxWidth={400}>Name</ResizableTableHead>
                    <ResizableTableHead initialWidth={100} minWidth={80} maxWidth={120}>Status</ResizableTableHead>
                    <ResizableTableHead initialWidth={130} minWidth={100} maxWidth={160}>Scheduled</ResizableTableHead>
                    <ResizableTableHead initialWidth={110} minWidth={90} maxWidth={140}>Created</ResizableTableHead>
                    <ResizableTableHead initialWidth={100} minWidth={90} maxWidth={140}>Sent</ResizableTableHead>
                    <ResizableTableHead initialWidth={110} minWidth={90} maxWidth={160}>Delivered</ResizableTableHead>
                    <ResizableTableHead initialWidth={100} minWidth={90} maxWidth={140}>Failed</ResizableTableHead>
                    <ResizableTableHead initialWidth={110} minWidth={90} maxWidth={160}>Replies</ResizableTableHead>
                    <ResizableTableHead initialWidth={80} minWidth={80} maxWidth={80} resizable={false}>Actions</ResizableTableHead>
                  </tr>
                </ResizableTableHeader>
                <ResizableTableBody>
                  {filteredCampaigns.map((campaign) => (
                    <ResizableTableRow key={campaign.id}>
                      <ResizableTableCell width={50}>
                        <Checkbox
                          checked={selectedCampaigns.includes(campaign.id)}
                          onCheckedChange={(checked) => handleSelectCampaign(campaign.id, checked as boolean)}
                          aria-label={`Select ${campaign.name}`}
                        />
                      </ResizableTableCell>

                      <ResizableTableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="font-medium truncate text-foreground hover:text-foreground/80 cursor-pointer hover:underline"
                              onClick={() => navigate(`/reach/outbound/sms/campaigns/${campaign.id}`)}
                            >
                              {campaign.name}
                            </span>
                            {campaign.group_id && (
                              <Badge variant="outline" className="text-xs shrink-0">
                                <FolderIcon className="h-3 w-3 mr-1" />
                                {groups.find(g => g.id === campaign.group_id)?.name || 'Unknown'}
                              </Badge>
                            )}
                          </div>
                          {campaign.description && (
                            <p className="text-sm text-muted-foreground truncate">{campaign.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground truncate">
                            {campaign.message}
                          </p>
                        </div>
                      </ResizableTableCell>

                      <ResizableTableCell>
                        {getStatusBadge(campaign.status)}
                      </ResizableTableCell>

                      <ResizableTableCell>
                        <div className="text-sm">
                          {campaign.scheduled_at ? (
                            <div>
                              <div className="font-medium">
                                {new Date(campaign.scheduled_at).toLocaleDateString()}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {new Date(campaign.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Not scheduled</span>
                          )}
                        </div>
                      </ResizableTableCell>

                      <ResizableTableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(campaign.created_at)}
                        </div>
                      </ResizableTableCell>

                      <ResizableTableCell>
                        <div className="text-sm font-medium">{(campaign.sent_count || 0).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{getProgressPercentage(campaign)}%</div>
                      </ResizableTableCell>

                      <ResizableTableCell>
                        <div className="text-sm font-medium">{(campaign.delivered_count || 0).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{getDeliveryRate(campaign)}%</div>
                      </ResizableTableCell>

                      <ResizableTableCell>
                        <div className="text-sm font-medium">{(campaign.failed_count || 0).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{getFailureRate(campaign)}%</div>
                      </ResizableTableCell>

                      <ResizableTableCell>
                        <div className="text-sm font-medium">{(campaign.reply_count || 0).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{getReplyRate(campaign)}%</div>
                      </ResizableTableCell>

                      <ResizableTableCell width={80}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/reach/outbound/sms/campaigns/${campaign.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => navigate(`/reach/outbound/sms/campaigns/edit/${campaign.id}`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Campaign
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => navigate(`/reports?campaign=${campaign.id}`)}>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              View Reports
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {campaign.status === 'draft' && (
                              <DropdownMenuItem
                                onClick={() => sendCampaign(campaign.id)}
                                disabled={!signalWireConfig}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Start Campaign
                              </DropdownMenuItem>
                            )}

                            {campaign.status === 'sending' && (
                              <DropdownMenuItem onClick={() => pauseCampaign(campaign.id)}>
                                <Pause className="h-4 w-4 mr-2" />
                                Pause Campaign
                              </DropdownMenuItem>
                            )}

                            {campaign.status === 'paused' && (
                              <DropdownMenuItem
                                onClick={() => sendCampaign(campaign.id)}
                                disabled={!signalWireConfig}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Resume Campaign
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => deleteCampaign(campaign.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Campaign
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </ResizableTableCell>
                    </ResizableTableRow>
                  ))}
                </ResizableTableBody>
              </ResizableTable>
            </Card>
          )}

          <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription>
                  Create a new group to organize your SMS campaigns
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input
                    id="groupName"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Enter group name"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateGroupDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createGroup}>
                  Create Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default SMSCampaigns;
