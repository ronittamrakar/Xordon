import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Phone,
  Search,
  MessageSquare,
  Play,
  Pause,
  Eye,
  BarChart3,
  Trash2,
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
  Clock,
  CheckCircle,
  XCircle,
  PhoneCall,
  Save,
  Edit3,
  Mic,
  MicOff,
  UserCheck,
  UserX,
  Clock3,
  FileTextIcon,
} from 'lucide-react';

import { Breadcrumb } from '@/components/Breadcrumb';
import { toast } from 'sonner';
import { api, CallScript } from '@/lib/api';
import { CallCampaign, CallRecipient, CallDisposition } from '@/lib/api';
import { useCallSession } from '@/contexts/CallSessionContext';

interface Group {
  id: string;
  name: string;
  description?: string;
}

interface CallProviderConfig {
  provider: 'twilio' | 'vonage' | 'signalwire';
  accountSid?: string;
  authToken?: string;
  phoneNumber?: string;
  spaceUrl?: string;
  projectId?: string;
}

const CallCampaigns = () => {
  const navigate = useNavigate();
  const { requestSoftphoneCall } = useCallSession();
  const [campaigns, setCampaigns] = useState<CallCampaign[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [callScripts, setCallScripts] = useState<CallScript[]>([]);
  const [callProviderConfig, setCallProviderConfig] = useState<CallProviderConfig | null>(null);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');

  // Enhanced cold calling features
  const [campaignRecipients, setCampaignRecipients] = useState<Record<string, CallRecipient[]>>({});
  const [campaignDispositions, setCampaignDispositions] = useState<CallDisposition[]>([]);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [isEditingNotes, setIsEditingNotes] = useState<Record<string, boolean>>({});
  const [selectedRecipientDisposition, setSelectedRecipientDisposition] = useState<Record<string, string>>({});
  const [activeCalls, setActiveCalls] = useState<Record<string, boolean | number>>({});
  const [callDurations, setCallDurations] = useState<Record<string, number>>({});
  const [callRecordings, setCallRecordings] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadCampaigns();
    loadGroups();
    loadCallSettings();
    loadDispositions();
    loadCallScripts();
  }, []);

  // Load recipients for campaigns when they are loaded
  useEffect(() => {
    if (campaigns.length > 0) {
      campaigns.forEach(campaign => {
        // Only load for relevant statuses and if not already loaded
        if (['active', 'paused', 'draft'].includes(campaign.status) && !campaignRecipients[campaign.id]) {
          loadCampaignRecipients(campaign.id);
        }
      });
    }
  }, [campaigns]);

  // Load dispositions for call status dropdown
  const loadDispositions = async () => {
    try {
      const dispositions = await api.getCallDispositions();
      setCampaignDispositions(dispositions);
    } catch (err) {
      console.error('Error loading dispositions:', err);
      setCampaignDispositions([]);
    }
  };

  // Load call scripts for display
  const loadCallScripts = async () => {
    try {
      const scripts = await api.getCallScripts();
      setCallScripts(scripts);
    } catch (err) {
      console.error('Error loading call scripts:', err);
      setCallScripts([]);
    }
  };

  // Load campaign recipients for manual calling
  const loadCampaignRecipients = async (campaignId: string) => {
    try {
      const recipients = await api.getCallRecipients(campaignId) as CallRecipient[];
      setCampaignRecipients(prev => ({ ...prev, [campaignId]: recipients }));
      return recipients;
    } catch (err) {
      console.error('Error loading campaign recipients:', err);
      return [];
    }
  };

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await api.getCallCampaigns();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load call campaigns');
      console.error('Error loading campaigns:', err);
      toast.error('Failed to load call campaigns');
      setCampaigns([]);
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
      setGroups([
        { id: '1', name: 'Sales Calls', description: 'Sales outreach and follow-up calls' },
        { id: '2', name: 'Support Calls', description: 'Customer support and service calls' },
        { id: '3', name: 'Survey Calls', description: 'Customer feedback and survey calls' }
      ]);
    }
  };

  const loadCallSettings = async () => {
    try {
      const settings = await api.getCallSettings();
      if (settings.provider) {
        setCallProviderConfig({
          provider: settings.provider,
          // Note: CallSettings interface doesn't include these properties
          // They may need to be added to the interface or handled differently
          accountSid: '', // Default empty until interface is updated
          authToken: '', // Default empty until interface is updated
          phoneNumber: settings.defaultCallerId || '', // Use existing property
          spaceUrl: '', // Default empty until interface is updated
          projectId: '', // Default empty until interface is updated
        });
      }
    } catch (err) {
      console.error('Error loading call settings:', err);
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
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleBulkStatusChange = async (status: 'active' | 'paused') => {
    if (selectedCampaigns.length === 0) return;

    const action = status === 'active' ? 'start' : 'pause';
    const confirmed = confirm(`Are you sure you want to ${action} ${selectedCampaigns.length} call campaign(s)?`);
    if (!confirmed) return;

    try {
      for (const campaignId of selectedCampaigns) {
        if (status === 'active') {
          await api.startCallCampaign(campaignId);
        } else {
          await api.pauseCallCampaign(campaignId);
        }
      }

      setCampaigns(prev => prev.map(campaign =>
        selectedCampaigns.includes(campaign.id)
          ? { ...campaign, status }
          : campaign
      ));

      toast.success(`${selectedCampaigns.length} call campaign(s) ${action}ed successfully`);
      setSelectedCampaigns([]);
    } catch (err) {
      console.error(`Error ${action}ing campaigns:`, err);
      toast.error(`Failed to ${action} call campaigns`);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedCampaigns.length === 0) return;

    const confirmed = confirm(`Are you sure you want to archive ${selectedCampaigns.length} call campaign(s)?`);
    if (!confirmed) return;

    try {
      for (const campaignId of selectedCampaigns) {
        await api.archiveCallCampaign(campaignId);
      }

      setCampaigns(prev => prev.map(campaign =>
        selectedCampaigns.includes(campaign.id)
          ? { ...campaign, status: 'archived' as const }
          : campaign
      ));

      toast.success(`${selectedCampaigns.length} call campaign(s) archived successfully`);
      setSelectedCampaigns([]);
    } catch (err) {
      console.error('Error archiving campaigns:', err);
      toast.error('Failed to archive call campaigns');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCampaigns.length === 0) return;

    const confirmed = confirm(`Are you sure you want to move ${selectedCampaigns.length} call campaign(s) to trash?`);
    if (!confirmed) return;

    try {
      for (const campaignId of selectedCampaigns) {
        await api.updateCallCampaign(campaignId, { status: 'trashed' });
      }

      setCampaigns(prev => prev.map(campaign =>
        selectedCampaigns.includes(campaign.id)
          ? { ...campaign, status: 'trashed' as any }
          : campaign
      ));
      setSelectedCampaigns([]);
      toast.success(`${selectedCampaigns.length} call campaign(s) moved to trash successfully`);
    } catch (error) {
      console.error('Error moving campaigns to trash:', error);
      toast.error('Failed to move call campaigns to trash');
    }
  };

  const getStatusBadge = (status: CallCampaign['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">Draft</Badge>;
      case 'active':
        return <Badge variant="default" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">Active</Badge>;
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

  const getProgressPercentage = (campaign: CallCampaign) => {
    if (!campaign.recipient_count || campaign.recipient_count === 0) return 0;
    return Math.round((campaign.completed_calls / campaign.recipient_count) * 100);
  };

  const getSuccessRate = (campaign: CallCampaign) => {
    if (!campaign.completed_calls || campaign.completed_calls === 0) return 0;
    return Math.round(((campaign.successful_calls || 0) / campaign.completed_calls) * 100);
  };

  const getAnswerRate = (campaign: CallCampaign) => {
    if (!campaign.completed_calls || campaign.completed_calls === 0) return 0;
    return Math.round(((campaign.answered_calls || 0) / campaign.completed_calls) * 100);
  };

  const getVoicemailRate = (campaign: CallCampaign) => {
    if (!campaign.completed_calls || campaign.completed_calls === 0) return 0;
    return Math.round(((campaign.voicemail_calls || 0) / campaign.completed_calls) * 100);
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

  // Get script name for a campaign
  const getScriptName = (campaign: CallCampaign) => {
    if (!campaign.call_script) return null;

    // Try to find the script by matching the script content
    const script = callScripts.find(s => s.script === campaign.call_script);
    if (script) return script.name;

    // If no exact match, return a truncated version of the script
    const truncated = campaign.call_script.substring(0, 30);
    return truncated.length < campaign.call_script.length ? `${truncated}...` : truncated;
  };

  // Get script object for a campaign
  const getScriptForCampaign = (campaign: CallCampaign) => {
    if (!campaign.call_script) return null;
    return callScripts.find(s => s.script === campaign.call_script);
  };

  // Enhanced cold calling functions
  const handleStartCall = async (campaignId: string, recipientId: string) => {
    if (!callProviderConfig) {
      toast.error('Call provider not configured. Please configure call settings first.');
      return;
    }

    try {
      // Find the campaign
      const campaign = campaigns.find(c => c.id === campaignId);

      if (!campaign) {
        toast.error('Campaign not found');
        return;
      }

      // Note: CallCampaign doesn't have recipients property
      // We need to fetch recipients separately or handle this differently
      const recipients = campaignRecipients[campaignId] || [];
      const recipient = recipients.find(r => r.id === recipientId);

      if (!recipient) {
        // If not in state, try to fetch (though it should be there if rendered)
        console.warn(`Recipient ${recipientId} not found in state for campaign ${campaignId}`);
        toast.error('Recipient details not found');
        return;
      }

      const phoneNumber = recipient.phone || recipient.phone_number;
      if (!phoneNumber) {
        toast.error('Recipient has no phone number');
        return;
      }

      // Use softphone to initiate the call
      requestSoftphoneCall({
        number: phoneNumber,
        recipientName: `${recipient.first_name || ''} ${recipient.last_name || ''}`.trim() || phoneNumber,
        campaignId: campaignId,
        callerId: campaign?.caller_id,  // Pass the campaign's caller ID to the softphone
        source: 'api', // Use valid CallSessionSource
        metadata: {
          recipientId: recipientId,
          campaignId: campaignId,
          recipientData: recipient,
          callerId: campaign?.caller_id  // Also include in metadata for reference
        }
      });

      setActiveCalls(prev => ({ ...prev, [recipientId]: true }));
      toast.success('Opening Softphone to initiate call');

      // Start call duration timer
      const startTime = Date.now();
      const interval = window.setInterval(() => {
        setCallDurations(prev => ({
          ...prev,
          [recipientId]: Math.floor((Date.now() - startTime) / 1000)
        }));
      }, 1000);

      // Store interval for cleanup when call ends
      setActiveCalls(prev => ({ ...prev, [`${recipientId}_interval`]: interval }));
    } catch (err) {
      console.error('Error starting call:', err);
      toast.error('Failed to start call');
      setActiveCalls(prev => ({ ...prev, [recipientId]: false }));
    }
  };

  const handleEndCall = (recipientId: string) => {
    const interval = activeCalls[`${recipientId}_interval`];
    if (typeof interval === 'number') {
      window.clearInterval(interval);
    }
    setActiveCalls(prev => ({
      ...prev,
      [recipientId]: false,
      [`${recipientId}_interval`]: undefined
    }));
    toast.success('Call ended');
  };

  const handleSaveNotes = async (campaignId: string, recipientId: string, notes: string) => {
    try {
      await api.updateCallRecipient(recipientId, { notes });
      toast.success('Notes saved successfully');
      setIsEditingNotes(prev => ({ ...prev, [recipientId]: false }));
    } catch (err) {
      console.error('Error saving notes:', err);
      toast.error('Failed to save notes');
    }
  };

  const handleDispositionChange = async (campaignId: string, recipientId: string, dispositionId: string) => {
    try {
      await api.updateCallRecipient(recipientId, { lastOutcome: dispositionId as 'answered' | 'voicemail' | 'busy' | 'no_answer' | 'failed' });
      setSelectedRecipientDisposition(prev => ({ ...prev, [recipientId]: dispositionId }));
      toast.success('Call status updated successfully');
    } catch (err) {
      console.error('Error updating disposition:', err);
      toast.error('Failed to update call status');
    }
  };

  const toggleRecording = (recipientId: string) => {
    setCallRecordings(prev => ({ ...prev, [recipientId]: !prev[recipientId] }));
    toast.success(callRecordings[recipientId] ? 'Recording stopped' : 'Recording started');
  };

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getNextRecipientToCall = (campaignId: string) => {
    const recipients = campaignRecipients[campaignId] || [];
    return recipients.find(r => !r.lastCallAt) || recipients[0];
  };

  const startCampaign = async (campaignId: string) => {
    try {
      await api.startCallCampaign(campaignId);
      setCampaigns(prev => prev.map(campaign =>
        campaign.id === campaignId
          ? { ...campaign, status: 'active' as const }
          : campaign
      ));
      toast.success('Call campaign started successfully');
    } catch (err) {
      console.error('Error starting campaign:', err);
      toast.error('Failed to start call campaign');
    }
  };

  const pauseCampaign = async (campaignId: string) => {
    try {
      await api.pauseCallCampaign(campaignId);
      setCampaigns(prev => prev.map(campaign =>
        campaign.id === campaignId
          ? { ...campaign, status: 'paused' as const }
          : campaign
      ));
      toast.success('Call campaign paused successfully');
    } catch (err) {
      console.error('Error pausing campaign:', err);
      toast.error('Failed to pause call campaign');
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    try {
      await api.updateCallCampaign(campaignId, { status: 'trashed' });
      setCampaigns(prev => prev.map(campaign =>
        campaign.id === campaignId ? { ...campaign, status: 'trashed' as any } : campaign
      ));
      toast.success('Call campaign moved to trash');
    } catch (err) {
      console.error('Error moving campaign to trash:', err);
      toast.error('Failed to move call campaign to trash');
    }
  };

  const handleArchive = async (campaignId: string) => {
    try {
      await api.updateCallCampaign(campaignId, { status: 'archived' });
      setCampaigns(prev => prev.map(campaign =>
        campaign.id === campaignId ? { ...campaign, status: 'archived' } : campaign
      ));
      toast.success('Call campaign archived successfully');
    } catch (err) {
      console.error('Error archiving campaign:', err);
      toast.error('Failed to archive call campaign');
    }
  };

  const handleCreateCampaign = () => {
    // Navigate to campaign creation wizard
    navigate('/reach/outbound/calls/campaigns/new');
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    try {
      const groupData = {
        name: newGroupName.trim(),
        description: `Call campaign group: ${newGroupName.trim()}`
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
          <Breadcrumb
            items={[
              { label: 'Call Outreach', href: '/reach/outbound/calls', icon: <Phone className="h-4 w-4" /> },
              { label: 'Campaigns' }
            ]}
          />

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[18px] font-bold tracking-tight text-gray-900 dark:text-gray-100">Call Campaigns</h1>
              <p className="text-muted-foreground mt-1">Manage your cold calling campaigns with automated dialing</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateCampaign}>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          </div>

          {!callProviderConfig && (
            <Card className="border-analytics">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-yellow-600" />
                    <p className="text-yellow-800 dark:text-yellow-200">
                      Call provider is not configured. Please configure your call settings to start calling campaigns.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/settings#calls')}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Go to Call Settings
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="trashed">Trashed</SelectItem>
                </SelectContent>
              </Select>

              <Select value="all" onValueChange={() => { }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Call accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All accounts</SelectItem>
                  <SelectItem value="twilio">Twilio accounts</SelectItem>
                  <SelectItem value="vonage">Vonage accounts</SelectItem>
                  <SelectItem value="signalwire">SignalWire accounts</SelectItem>
                </SelectContent>
              </Select>
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
            <Card className="border-analytics">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {selectedCampaigns.length} campaign(s) selected
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatusChange('active')}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Start
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatusChange('paused')}
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkArchive}
                    >
                      <Archive className="h-4 w-4 mr-1" />
                      Archive
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkDelete}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Move to Trash
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCampaigns([])}
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
              <CardContent className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground">Loading call campaigns...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="border-analytics">
              <CardContent className="p-6">
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
              <CardContent className="p-12 text-center">
                <Phone className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {statusFilter === 'all' && !searchQuery ? 'No call campaigns yet' : 'No call campaigns found'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {statusFilter === 'all' && !searchQuery
                    ? 'Create your first call campaign to start cold calling'
                    : 'Try adjusting your filters or create more campaigns'
                  }
                </p>
                <Button onClick={handleCreateCampaign}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Call Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-analytics">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedCampaigns.length === filteredCampaigns.length && filteredCampaigns.length > 0}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all campaigns"
                      />
                    </TableHead>
                    <TableHead className="font-semibold text-foreground min-w-[180px]">Campaign Name</TableHead>
                    <TableHead className="font-semibold text-foreground min-w-[90px]">Status</TableHead>
                    <TableHead className="font-semibold text-foreground min-w-[80px]">Agent</TableHead>
                    <TableHead className="font-semibold text-foreground min-w-[100px]">Created</TableHead>
                    <TableHead className="font-semibold text-foreground min-w-[220px]">Progress</TableHead>
                    <TableHead className="font-semibold text-foreground min-w-[100px]">Next Call</TableHead>
                    <TableHead className="font-semibold text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign) => {
                    const nextRecipient = getNextRecipientToCall(campaign.id);
                    const recipients = campaignRecipients[campaign.id] || [];

                    return (
                      <TableRow key={campaign.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Checkbox
                            checked={selectedCampaigns.includes(campaign.id)}
                            onCheckedChange={(checked) => handleSelectCampaign(campaign.id, checked as boolean)}
                            aria-label={`Select ${campaign.name}`}
                          />
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="font-medium text-foreground hover:text-foreground/80 cursor-pointer hover:underline"
                                onClick={() => navigate(`/reach/outbound/calls/campaigns/${campaign.id}`)}
                              >
                                {campaign.name}
                              </span>
                              {campaign.group_id && (
                                <Badge variant="outline" className="text-xs">
                                  <FolderIcon className="h-3 w-3 mr-1" />
                                  {groups.find(g => g.id === campaign.group_id)?.name || 'Unknown'}
                                </Badge>
                              )}
                            </div>
                            {campaign.description && (
                              <p className="text-sm text-muted-foreground">{campaign.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{campaign.caller_id || 'No caller ID'}</span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {getStatusBadge(campaign.status)}
                        </TableCell>

                        <TableCell>
                          <div className="text-sm">
                            {campaign.agent_name ? (
                              <div className="flex items-center gap-1">
                                <UserCheck className="h-3 w-3 text-green-600" />
                                <span className="font-medium">{campaign.agent_name}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Not assigned</span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(campaign.created_at)}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-2 min-w-[150px]">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{campaign.completed_calls}/{campaign.recipient_count || 0}</span>
                              <span className="font-medium text-white">{getProgressPercentage(campaign)}%</span>
                            </div>
                            <Progress
                              value={getProgressPercentage(campaign)}
                              className="h-2"
                            />
                            <div className="flex justify-between text-xs">
                              <div className="flex items-center text-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                <span>{getSuccessRate(campaign)}%</span>
                              </div>
                              <div className="flex items-center text-blue-600">
                                <Phone className="h-3 w-3 mr-1" />
                                <span>{getAnswerRate(campaign)}%</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-2 min-w-[120px]">
                            {nextRecipient ? (
                              <div className="space-y-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleStartCall(campaign.id, nextRecipient.id)}
                                  disabled={!callProviderConfig || !!activeCalls[nextRecipient.id]}
                                  className="w-full bg-green-600 hover:bg-green-700"
                                >
                                  <PhoneCall className="h-4 w-4 mr-1" />
                                  {activeCalls[nextRecipient.id] ? 'Calling...' : 'Start Call'}
                                </Button>

                                {activeCalls[nextRecipient.id] && (
                                  <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground text-center">
                                      Duration: {formatCallDuration(callDurations[nextRecipient.id] || 0)}
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEndCall(nextRecipient.id)}
                                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                                    >
                                      <Phone className="h-3 w-3 mr-1" />
                                      End Call
                                    </Button>
                                  </div>
                                )}

                                <div className="text-xs text-muted-foreground">
                                  {nextRecipient.first_name} {nextRecipient.last_name}
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                No contacts available
                              </div>
                            )}
                          </div>
                        </TableCell>


                        <TableCell>
                          <div className="flex items-center gap-1">
                            {/* Script Icon */}
                            {campaign.call_script && (
                              <div className="group relative">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                  title={`Script: ${getScriptName(campaign) || 'Custom Script'}`}
                                >
                                  <FileTextIcon className="h-4 w-4" />
                                </Button>
                                {/* Tooltip showing script name */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                  {getScriptName(campaign) || 'Custom Script'}
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                                </div>
                              </div>
                            )}

                            {/* Actions Dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/reach/outbound/calls/campaigns/${campaign.id}`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={() => navigate(`/reach/calls/logs?campaignId=${campaign.id}`)}>
                                  <FileTextIcon className="h-4 w-4 mr-2" />
                                  View Logs
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={() => navigate(`/reach/outbound/calls/campaigns/edit/${campaign.id}`)}>
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
                                    onClick={() => startCampaign(campaign.id)}
                                    disabled={!callProviderConfig}
                                  >
                                    <Play className="h-4 w-4 mr-2" />
                                    Start Campaign
                                  </DropdownMenuItem>
                                )}

                                {campaign.status === 'active' && (
                                  <DropdownMenuItem onClick={() => pauseCampaign(campaign.id)}>
                                    <Pause className="h-4 w-4 mr-2" />
                                    Pause Campaign
                                  </DropdownMenuItem>
                                )}

                                {campaign.status === 'paused' && (
                                  <DropdownMenuItem
                                    onClick={() => startCampaign(campaign.id)}
                                    disabled={!callProviderConfig}
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
                                  Move to Trash
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}

          <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription>
                  Create a new group to organize your call campaigns
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

export default CallCampaigns;

