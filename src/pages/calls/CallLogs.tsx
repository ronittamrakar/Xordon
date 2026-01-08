import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Phone, Download, RefreshCw, Search, Filter, Clock, CheckCircle, XCircle, Voicemail, User, Building, ExternalLink, Play, Eye, Tag, MoreVertical, ChevronLeft, ChevronRight, Brain, PhoneIncoming, PhoneOutgoing } from 'lucide-react';

import { Breadcrumb } from '@/components/Breadcrumb';
import CallIntelligenceDialog from '@/components/calls/CallIntelligenceDialog';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { api, APICallLog } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


interface CallLog {
  id: string;
  campaignId: string;
  campaignName: string;
  recipientId: string;
  recipientName: string;
  recipientPhone: string;
  recipientCompany?: string;
  callStartTime: string;
  callEndTime?: string;
  duration?: number;
  outcome: 'answered' | 'busy' | 'no_answer' | 'voicemail' | 'failed' | 'dnc';
  disposition?: string;
  notes?: string;
  agent?: string;
  recordingUrl?: string;
  voicemailUrl?: string;
  voicemailTranscription?: string;
  sequenceStep?: number;
  cost?: number;
  direction?: 'inbound' | 'outbound';
}

const CallLogs: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<CallLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams] = useSearchParams();
  const { id: routeLogId } = useParams();
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('today');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingLog, setEditingLog] = useState<CallLog | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editDisposition, setEditDisposition] = useState('');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'cost'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [visibleColumns, setVisibleColumns] = useState({
    date: true,
    campaign: true,
    recipient: true,
    phone: true,
    outcome: true,
    disposition: true,
    duration: true,
    agent: true,
    cost: true,
    recording: true,
    voicemail: true,
    direction: true,
    actions: true
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [intelligenceCallId, setIntelligenceCallId] = useState<string | null>(null);
  const [intelligenceCallData, setIntelligenceCallData] = useState<any>(null);

  useEffect(() => {
    // Check for campaignId query param
    const campaignIdParam = searchParams.get('campaignId');
    if (campaignIdParam) {
      setCampaignFilter(campaignIdParam);
      setDateFilter('all'); // Clear date filter when viewing a specific campaign
    }

    // Check for callId query param or route param
    const callIdParam = searchParams.get('callId') || routeLogId;
    if (callIdParam) {
      setSearchTerm(callIdParam); // Use search term to find the specific ID
      setDateFilter('all');
    }
  }, [searchParams, routeLogId]);

  // Fetch real call logs from API
  const { data: logs = [], isLoading: isLoadingLogs, refetch } = useQuery({
    queryKey: ['call-logs'],
    queryFn: () => api.getCallLogs()
  });

  // Fetch campaign details to get campaign names
  const { data: campaigns = [] } = useQuery({
    queryKey: ['call-campaigns'],
    queryFn: () => api.getCallCampaigns()
  });

  // Fetch contact details for recipient names
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => api.getContacts()
  });

  // Fetch agents for filtering
  const { data: agents = [] } = useQuery({
    queryKey: ['call-agents'],
    queryFn: () => api.getCallAgents()
  });

  useEffect(() => {
    if (logs && logs.length > 0) {
      const transformedLogs: CallLog[] = logs.map((log: APICallLog) => {
        // Find campaign name from campaigns
        const campaign = campaigns.find(c => c.id === log.campaign_id);

        // Find contact details from contacts
        const contact = contacts.find(c => c.id === log.recipient_id);

        return {
          id: log.id,
          campaignId: log.campaign_id || '',
          campaignName: campaign?.name || 'Unknown Campaign',
          recipientId: log.recipient_id || '',
          recipientName: contact?.name || 'Unknown Contact',
          recipientPhone: log.phone_number || 'N/A',
          recipientCompany: contact?.company || log.recipient_company,
          callStartTime: log.started_at || log.created_at || '',
          callEndTime: log.ended_at,
          duration: log.duration || log.call_duration,
          outcome: (log.outcome || log.call_outcome || 'unknown') as CallLog['outcome'],
          disposition: log.notes,
          notes: log.notes,
          agent: log.agent_name,
          sequenceStep: log.sequence_step,
          cost: log.call_cost || log.cost,
          recordingUrl: log.recording_url,
          direction: log.direction || 'outbound'
        };
      });
      setCallLogs(transformedLogs);
      setFilteredLogs(transformedLogs);
    }
  }, [logs, campaigns, contacts]);

  useEffect(() => {
    let filtered = callLogs;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.id === searchTerm || // Exact match for ID
        log.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.recipientPhone.includes(searchTerm) ||
        log.recipientCompany?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.agent?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.disposition?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply outcome filter
    if (outcomeFilter !== 'all') {
      filtered = filtered.filter(log => log.outcome === outcomeFilter);
    }

    // Apply direction filter
    if (directionFilter !== 'all') {
      filtered = filtered.filter(log => log.direction === directionFilter);
    }

    // Apply campaign filter
    if (campaignFilter !== 'all') {
      filtered = filtered.filter(log => log.campaignId === campaignFilter);
    }

    // Apply agent filter
    if (agentFilter !== 'all') {
      filtered = filtered.filter(log => log.agent === agentFilter);
    }

    // Apply date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (dateFilter === 'today') {
      filtered = filtered.filter(log => new Date(log.callStartTime) >= today);
    } else if (dateFilter === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      filtered = filtered.filter(log => {
        const callDate = new Date(log.callStartTime);
        return callDate >= yesterday && callDate < today;
      });
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(log => new Date(log.callStartTime) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(log => new Date(log.callStartTime) >= monthAgo);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.callStartTime).getTime();
          bValue = new Date(b.callStartTime).getTime();
          break;
        case 'duration':
          aValue = a.duration || 0;
          bValue = b.duration || 0;
          break;
        case 'cost':
          aValue = a.cost || 0;
          bValue = b.cost || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    setFilteredLogs(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [callLogs, searchTerm, outcomeFilter, dateFilter, sortBy, sortOrder, campaignFilter, directionFilter, agentFilter]);

  const getOutcomeBadge = (outcome: string) => {
    const variants = {
      answered: { className: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-900', icon: CheckCircle },
      voicemail: { className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-900', icon: Voicemail },
      busy: { className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-900', icon: Clock },
      no_answer: { className: 'bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-900', icon: Clock },
      failed: { className: 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-900', icon: XCircle },
      dnc: { className: 'bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900 dark:text-purple-200 dark:hover:bg-purple-900', icon: User },
      unknown: { className: 'bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-900', icon: Clock }
    };

    const variant = variants[outcome as keyof typeof variants] || variants.no_answer;
    const Icon = variant.icon;

    return (
      <Badge className={variant.className}>
        <Icon className="h-3 w-3 mr-1" />
        {outcome.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatCost = (cost?: number) => {
    if (!cost) return 'N/A';
    return `$${cost.toFixed(2)}`;
  };

  const handleExport = () => {
    const csvContent = [
      ['Date', 'Campaign', 'Recipient', 'Company', 'Phone', 'Outcome', 'Disposition', 'Duration', 'Agent', 'Cost', 'Recording URL', 'Notes'],
      ...filteredLogs.map(log => [
        format(new Date(log.callStartTime), 'yyyy-MM-dd HH:mm'),
        log.campaignName,
        log.recipientName,
        log.recipientCompany || '',
        log.recipientPhone,
        log.outcome,
        log.disposition || '',
        formatDuration(log.duration),
        log.agent || '',
        formatCost(log.cost),
        log.recordingUrl || '',
        log.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await refetch();
      toast({
        title: 'Success',
        description: 'Call logs refreshed successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh call logs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination logic
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredLogs.slice(startIndex, endIndex);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleViewCampaign = (campaignId: string) => {
    navigate(`/reach/outbound/calls/campaigns/${campaignId}`);
  };

  const handleViewRecipient = (recipientId: string) => {
    navigate(`/contacts/${recipientId}`);
  };

  const handleEditLog = (log: CallLog) => {
    setEditingLog(log);
    setEditNotes(log.notes || '');
    setEditDisposition(log.disposition || '');
  };

  const handleSaveEdit = async () => {
    if (!editingLog) return;

    try {
      await api.updateCallLog(editingLog.id, {
        notes: editNotes,
        disposition: editDisposition
      });

      toast({
        title: 'Success',
        description: 'Call log updated successfully',
      });

      setEditingLog(null);
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update call log',
        variant: 'destructive',
      });
    }
  };

  const handlePlayRecording = (recordingUrl: string) => {
    if (recordingUrl) {
      window.open(recordingUrl, '_blank');
    }
  };

  const handleSelectAll = () => {
    if (selectedLogs.size === paginatedLogs.length) {
      setSelectedLogs(new Set());
    } else {
      setSelectedLogs(new Set(paginatedLogs.map(log => log.id)));
    }
  };

  const handleSelectLog = (logId: string) => {
    const newSelected = new Set(selectedLogs);
    if (newSelected.has(logId)) {
      newSelected.delete(logId);
    } else {
      newSelected.add(logId);
    }
    setSelectedLogs(newSelected);
  };

  const handleBulkDelete = async () => {
    try {
      // Implement bulk delete logic here
      toast({
        title: 'Success',
        description: `Deleted ${selectedLogs.size} call logs`,
      });
      setSelectedLogs(new Set());
      setShowDeleteDialog(false);
      await refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete call logs',
        variant: 'destructive',
      });
    }
  };

  const handleToggleColumn = (column: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const handleSort = (column: 'date' | 'duration' | 'cost') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleViewIntelligence = (log: CallLog) => {
    setIntelligenceCallId(log.id);
    setIntelligenceCallData({
      id: log.id,
      phone_number: log.recipientPhone,
      duration: log.duration || 0,
      outcome: log.outcome,
      recording_url: log.recordingUrl,
      started_at: log.callStartTime,
      recipient_name: log.recipientName,
      campaign_name: log.campaignName,
    });
  };

  return (
    <>
      <div className="flex h-full">
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="space-y-4">
            <Breadcrumb
              items={[
                { label: 'Calls', href: '/reach/calls/logs', icon: <Phone className="h-4 w-4" /> },
                { label: 'Logs' }
              ]}
            />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-[18px] sm:text-[18px] font-bold tracking-tight text-foreground">Call Logs</h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">Track and analyze your call history</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedLogs.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="sm:hidden"
                  >
                    Delete ({selectedLogs.size})
                  </Button>
                )}
                <Button variant="outline" onClick={handleExport} size="sm">
                  <Download className="h-4 w-4 mr-2" />Export
                </Button>
                <Button onClick={handleRefresh} disabled={isLoading} size="sm">
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />Refresh
                </Button>
              </div>
            </div>

            {/* Filters */}
            <Card className="border-analytics shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground text-lg">Filters & Search</CardTitle>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Filter className="h-4 w-4 mr-2" />Columns
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {Object.entries(visibleColumns).map(([column, visible]) => (
                          <DropdownMenuItem key={column} onClick={() => handleToggleColumn(column)}>
                            <div className="flex items-center">
                              <Checkbox checked={visible} className="mr-2" />
                              <span className="capitalize">{column.replace('_', ' ')}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search calls, contacts, notes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Campaign</label>
                    <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="All campaigns" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Campaigns</SelectItem>
                        {campaigns.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Agent</label>
                    <Select value={agentFilter} onValueChange={setAgentFilter}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="All agents" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Agents</SelectItem>
                        {agents.map((a: any) => (
                          <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Outcome</label>
                    <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="All outcomes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Outcomes</SelectItem>
                        <SelectItem value="answered">Answered</SelectItem>
                        <SelectItem value="voicemail">Voicemail</SelectItem>
                        <SelectItem value="busy">Busy</SelectItem>
                        <SelectItem value="no_answer">No Answer</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="dnc">Do Not Call</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Direction</label>
                    <Select value={directionFilter} onValueChange={setDirectionFilter}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="All directions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Directions</SelectItem>
                        <SelectItem value="inbound">Inbound</SelectItem>
                        <SelectItem value="outbound">Outbound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Date Range</label>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="yesterday">Yesterday</SelectItem>
                        <SelectItem value="week">Last 7 Days</SelectItem>
                        <SelectItem value="month">Last 30 Days</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Items per page" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 per page</SelectItem>
                        <SelectItem value="20">20 per page</SelectItem>
                        <SelectItem value="50">50 per page</SelectItem>
                        <SelectItem value="100">100 per page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 stats-grid-spacing">
              <Card className="border-analytics shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Calls</p>
                      <p className="text-[18px] sm:text-[18px] font-bold text-foreground">{filteredLogs.length}</p>
                    </div>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Phone className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-analytics shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Answered</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">
                        {filteredLogs.filter(log => log.outcome === 'answered').length}
                      </p>
                    </div>
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-analytics shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Voicemails</p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">
                        {filteredLogs.filter(log => log.outcome === 'voicemail').length}
                      </p>
                    </div>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Voicemail className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-analytics shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Cost</p>
                      <p className="text-xl sm:text-2xl font-bold text-foreground">
                        ${filteredLogs.reduce((sum, log) => sum + (log.cost || 0), 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
                      <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Call Logs Table */}
            <Card className="border-analytics card-spacing">
              <CardHeader>
                <CardTitle className="text-foreground">Call Details ({filteredLogs.length} calls)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {visibleColumns.date && <TableHead className="hidden md:table-cell">Date & Time</TableHead>}
                        {visibleColumns.campaign && <TableHead className="hidden lg:table-cell">Campaign</TableHead>}
                        {visibleColumns.direction && <TableHead className="hidden sm:table-cell">Direction</TableHead>}
                        {visibleColumns.recipient && <TableHead>Recipient</TableHead>}
                        {visibleColumns.phone && <TableHead className="hidden sm:table-cell">Phone</TableHead>}
                        {visibleColumns.outcome && <TableHead className="hidden md:table-cell">Outcome</TableHead>}
                        {visibleColumns.disposition && <TableHead className="hidden lg:table-cell">Disposition</TableHead>}
                        {visibleColumns.duration && <TableHead className="hidden md:table-cell">Duration</TableHead>}
                        {visibleColumns.agent && <TableHead className="hidden lg:table-cell">Agent</TableHead>}
                        {visibleColumns.cost && <TableHead className="hidden sm:table-cell">Cost</TableHead>}
                        {visibleColumns.recording && <TableHead className="hidden md:table-cell">Recording</TableHead>}
                        {visibleColumns.voicemail && <TableHead className="hidden md:table-cell">Voicemail</TableHead>}
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id} className="hover:bg-muted/50">
                          {visibleColumns.date && (
                            <TableCell className="hidden md:table-cell">
                              <div>
                                <div className="font-medium">{format(new Date(log.callStartTime), 'MMM dd')}</div>
                                <div className="text-sm text-muted-foreground">{format(new Date(log.callStartTime), 'HH:mm')}</div>
                              </div>
                            </TableCell>
                          )}
                          {visibleColumns.campaign && (
                            <TableCell className="hidden lg:table-cell">
                              <div className="space-y-1">
                                <div
                                  className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer truncate max-w-48"
                                  onClick={() => log.campaignId && handleViewCampaign(log.campaignId)}
                                >
                                  {log.campaignName}
                                </div>
                                <div className="text-sm text-muted-foreground">Step {log.sequenceStep}</div>
                              </div>
                            </TableCell>
                          )}
                          {visibleColumns.direction && (
                            <TableCell className="hidden sm:table-cell">
                              <Badge variant="outline" className={log.direction === 'inbound' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50' : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50'}>
                                {log.direction === 'inbound' ? <PhoneIncoming className="h-3 w-3 mr-1" /> : <PhoneOutgoing className="h-3 w-3 mr-1" />}
                                {log.direction === 'inbound' ? 'Inbound' : 'Outbound'}
                              </Badge>
                            </TableCell>
                          )}
                          {visibleColumns.recipient && (
                            <TableCell>
                              <div className="space-y-1">
                                <div
                                  className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer truncate max-w-48"
                                  onClick={() => log.recipientId && handleViewRecipient(log.recipientId)}
                                >
                                  {log.recipientName}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center">
                                  <Building className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate max-w-40">{log.recipientCompany || 'N/A'}</span>
                                </div>
                              </div>
                            </TableCell>
                          )}
                          {visibleColumns.phone && <TableCell className="hidden sm:table-cell">{log.recipientPhone}</TableCell>}
                          {visibleColumns.outcome && (
                            <TableCell className="hidden md:table-cell">{getOutcomeBadge(log.outcome)}</TableCell>
                          )}
                          {visibleColumns.disposition && (
                            <TableCell className="hidden lg:table-cell">
                              <div className="max-w-56 space-y-1">
                                <div className="text-sm font-medium">{log.disposition || 'N/A'}</div>
                                {log.notes && (
                                  <div className="text-xs text-muted-foreground truncate max-w-full">{log.notes}</div>
                                )}
                              </div>
                            </TableCell>
                          )}
                          {visibleColumns.duration && <TableCell className="hidden md:table-cell">{formatDuration(log.duration)}</TableCell>}
                          {visibleColumns.agent && <TableCell className="hidden lg:table-cell">{log.agent || 'N/A'}</TableCell>}
                          {visibleColumns.cost && <TableCell className="hidden sm:table-cell">{formatCost(log.cost)}</TableCell>}
                          {visibleColumns.recording && (
                            <TableCell className="hidden md:table-cell">
                              {log.recordingUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePlayRecording(log.recordingUrl!)}
                                  className="p-1"
                                  title="Play Recording"
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          )}
                          {visibleColumns.voicemail && (
                            <TableCell className="hidden md:table-cell">
                              {log.voicemailUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePlayRecording(log.voicemailUrl!)}
                                  className="p-1"
                                  title={log.voicemailTranscription || 'Play Voicemail'}
                                >
                                  <Voicemail className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex space-x-1">
                              {log.recordingUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePlayRecording(log.recordingUrl!)}
                                  className="p-1 md:hidden"
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1"
                                onClick={() => handleViewIntelligence(log)}
                                title="View AI Intelligence"
                              >
                                <Brain className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="p-1" onClick={() => handleEditLog(log)}>Edit</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredLogs.length === 0 && (
                    <div className="text-center py-12">
                      <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No call logs found</h3>
                      <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
                    </div>
                  )}

                  {/* Pagination */}
                  {filteredLogs.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} results
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                                className="min-w-[32px]"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Call Logs</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedLogs.size} call logs? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Log Dialog */}
      <AlertDialog open={!!editingLog} onOpenChange={() => setEditingLog(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Call Log</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Disposition</label>
              <Input
                value={editDisposition}
                onChange={(e) => setEditDisposition(e.target.value)}
                placeholder="Enter disposition..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Enter notes..."
                className="w-full min-h-[100px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveEdit}>Save Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Call Intelligence Dialog */}
      <CallIntelligenceDialog
        callId={intelligenceCallId}
        isOpen={intelligenceCallId !== null}
        onClose={() => {
          setIntelligenceCallId(null);
          setIntelligenceCallData(null);
        }}
        callData={intelligenceCallData}
      />
    </>
  );
};

export default CallLogs;
