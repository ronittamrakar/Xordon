import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Phone, Inbox, MessageCircle, Search, Clock, User, Building, ArrowUpRight, ArrowDownRight, Play, Pause, PhoneIncoming, Calendar, RefreshCw, Loader2, AlertCircle, CheckCircle2, Voicemail, Users } from 'lucide-react';
import { Breadcrumb } from '@/components/Breadcrumb';
import { format, formatDistanceToNow } from 'date-fns';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface CallInboxItem {
  id: string;
  callerName: string;
  callerPhone: string;
  callerCompany?: string;
  callerEmail?: string;
  callType: 'inbound' | 'callback' | 'missed' | 'voicemail';
  callTime: string;
  duration?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'in-progress' | 'completed' | 'follow-up' | 'archived';
  notes?: string;
  assignedTo?: string;
  assignedToId?: string;
  campaignName?: string;
  recordingUrl?: string;
  transcription?: string;
  callbackScheduledAt?: string;
  contactId?: string;
}

interface InboxCounts {
  total: number;
  new: number;
  inProgress: number;
  highPriority: number;
  followUp: number;
}

interface CallInboxProps {
  embedded?: boolean;
}

const CallInbox: React.FC<CallInboxProps> = ({ embedded = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [callItems, setCallItems] = useState<CallInboxItem[]>([]);
  const [counts, setCounts] = useState<InboxCounts>({ total: 0, new: 0, inProgress: 0, highPriority: 0, followUp: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<CallInboxItem | null>(null);
  const [isCallbackDialogOpen, setIsCallbackDialogOpen] = useState(false);
  const [callbackDate, setCallbackDate] = useState('');
  const [callbackNotes, setCallbackNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [playingRecording, setPlayingRecording] = useState<string | null>(null);

  const fetchInboxItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);

      const response = await api.get(`/calls/inbox?${params.toString()}`) as { items: CallInboxItem[]; counts: InboxCounts };
      setCallItems(response.items || []);
      setCounts(response.counts || { total: 0, new: 0, inProgress: 0, highPriority: 0, followUp: 0 });
    } catch (err) {
      console.error('Failed to fetch inbox items:', err);
      setError('Failed to load inbox items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, typeFilter, priorityFilter]);

  useEffect(() => {
    fetchInboxItems();

    // Poll for new items every 30 seconds
    const interval = setInterval(fetchInboxItems, 30000);
    return () => clearInterval(interval);
  }, [fetchInboxItems]);

  const filteredItems = callItems.filter(item => {
    if (searchTerm && !item.callerName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !item.callerPhone.includes(searchTerm) &&
      !item.callerCompany?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleUpdateStatus = async (itemId: string, newStatus: string) => {
    try {
      setIsUpdating(true);
      await api.put(`/calls/inbox/${itemId}`, { status: newStatus });
      toast.success('Status updated');
      fetchInboxItems();
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePriority = async (itemId: string, newPriority: string) => {
    try {
      await api.put(`/calls/inbox/${itemId}`, { priority: newPriority });
      toast.success('Priority updated');
      fetchInboxItems();
    } catch (err) {
      toast.error('Failed to update priority');
    }
  };

  const handleScheduleCallback = async () => {
    if (!selectedItem || !callbackDate) return;

    try {
      setIsUpdating(true);
      await api.post(`/calls/inbox/${selectedItem.id}/callback`, {
        scheduled_at: callbackDate,
        notes: callbackNotes
      });
      toast.success('Callback scheduled');
      setIsCallbackDialogOpen(false);
      setCallbackDate('');
      setCallbackNotes('');
      setSelectedItem(null);
      fetchInboxItems();
    } catch (err) {
      toast.error('Failed to schedule callback');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      new: { className: 'bg-blue-100 text-blue-800 hover:bg-blue-100', label: 'New' },
      'in-progress': { className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100', label: 'In Progress' },
      completed: { className: 'bg-green-100 text-green-800 hover:bg-green-100', label: 'Completed' },
      'follow-up': { className: 'bg-purple-100 text-purple-800 hover:bg-purple-100', label: 'Follow-up' },
      archived: { className: 'bg-gray-100 text-gray-800 hover:bg-gray-100', label: 'Archived' }
    };
    const variant = variants[status as keyof typeof variants] || variants.new;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: { className: 'bg-gray-100 text-gray-800 hover:bg-gray-100', label: 'Low' },
      medium: { className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100', label: 'Medium' },
      high: { className: 'bg-red-100 text-red-800 hover:bg-red-100', label: 'High' },
      urgent: { className: 'bg-red-600 text-white hover:bg-red-600', label: 'Urgent' }
    };
    const variant = variants[priority as keyof typeof variants] || variants.medium;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getCallTypeIcon = (type: string) => {
    switch (type) {
      case 'inbound': return <ArrowDownRight className="h-4 w-4 text-green-600" />;
      case 'callback': return <PhoneIncoming className="h-4 w-4 text-blue-600" />;
      case 'missed': return <Phone className="h-4 w-4 text-red-600" />;
      case 'voicemail': return <Voicemail className="h-4 w-4 text-purple-600" />;
      default: return <Phone className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCallTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      inbound: 'Inbound',
      callback: 'Callback',
      missed: 'Missed',
      voicemail: 'Voicemail'
    };
    return labels[type] || type;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const content = (
    <>
      <div className="flex h-full">
        <div className="flex-1 overflow-hidden">
          <div className={embedded ? 'px-0 py-0 w-full max-w-none' : 'space-y-4'}>
            {!embedded && (
              <Breadcrumb
                items={[
                  { label: 'Call Outreach', href: '/reach/outbound/calls', icon: <Phone className="h-4 w-4" /> },
                  { label: 'Inbox' }
                ]}
              />
            )}

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Call Inbox</h1>
                <p className="text-muted-foreground mt-1">Manage incoming calls, voicemails, and callbacks</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={fetchInboxItems} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button>
                  <Phone className="h-4 w-4 mr-2" />
                  Make Call
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">New Calls</p>
                      <p className="text-2xl font-bold">{counts.new}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                      <p className="text-2xl font-bold">{counts.inProgress}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                      <p className="text-2xl font-bold">{counts.highPriority}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Follow-up</p>
                      <p className="text-2xl font-bold">{counts.followUp}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">{counts.total}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Inbox className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search calls..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="follow-up">Follow-up</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="inbound">Inbound</SelectItem>
                        <SelectItem value="missed">Missed</SelectItem>
                        <SelectItem value="voicemail">Voicemail</SelectItem>
                        <SelectItem value="callback">Callback</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call Items Table */}
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Inbox</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={fetchInboxItems}>Try Again</Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Caller</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Assigned To</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.map((item) => (
                          <TableRow key={item.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getCallTypeIcon(item.callType)}
                                <span className="text-sm">{getCallTypeLabel(item.callType)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{item.callerName}</span>
                                <span className="text-sm text-muted-foreground">{item.callerPhone}</span>
                                {item.callerCompany && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Building className="h-3 w-3" />
                                    {item.callerCompany}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm">{format(new Date(item.callTime), 'MMM d, yyyy')}</span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(item.callTime), 'h:mm a')}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(item.callTime), { addSuffix: true })}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{formatDuration(item.duration)}</TableCell>
                            <TableCell>
                              <Select
                                value={item.priority}
                                onValueChange={(val) => handleUpdatePriority(item.id, val)}
                              >
                                <SelectTrigger className="w-24 h-8">
                                  {getPriorityBadge(item.priority)}
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={item.status}
                                onValueChange={(val) => handleUpdateStatus(item.id, val)}
                              >
                                <SelectTrigger className="w-28 h-8">
                                  {getStatusBadge(item.status)}
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="new">New</SelectItem>
                                  <SelectItem value="in-progress">In Progress</SelectItem>
                                  <SelectItem value="follow-up">Follow-up</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              {item.assignedTo ? (
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{item.assignedTo}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">Unassigned</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {item.recordingUrl && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPlayingRecording(playingRecording === item.id ? null : item.id)}
                                  >
                                    {playingRecording === item.id ? (
                                      <Pause className="h-4 w-4" />
                                    ) : (
                                      <Play className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setIsCallbackDialogOpen(true);
                                  }}
                                >
                                  <Calendar className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Phone className="h-4 w-4 mr-1" />
                                  Call
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {filteredItems.length === 0 && !isLoading && (
                      <div className="text-center py-12">
                        <Inbox className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No calls found</h3>
                        <p className="text-gray-600">Try adjusting your filters or check back later for new calls</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Schedule Callback Dialog */}
      <Dialog open={isCallbackDialogOpen} onOpenChange={setIsCallbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Callback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedItem && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedItem.callerName}</p>
                <p className="text-sm text-muted-foreground">{selectedItem.callerPhone}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="callbackDate">Date & Time</Label>
              <Input
                id="callbackDate"
                type="datetime-local"
                value={callbackDate}
                onChange={(e) => setCallbackDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="callbackNotes">Notes</Label>
              <Textarea
                id="callbackNotes"
                placeholder="Add notes about this callback..."
                value={callbackNotes}
                onChange={(e) => setCallbackNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCallbackDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleScheduleCallback} disabled={isUpdating || !callbackDate}>
              {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calendar className="h-4 w-4 mr-2" />}
              Schedule Callback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audio Player for Recordings */}
      {playingRecording && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg shadow-lg p-4 w-80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Playing Recording</span>
            <Button variant="ghost" size="sm" onClick={() => setPlayingRecording(null)}>
              <span className="sr-only">Close</span>×
            </Button>
          </div>
          <audio
            controls
            autoPlay
            className="w-full"
            src={filteredItems.find(i => i.id === playingRecording)?.recordingUrl}
            onEnded={() => setPlayingRecording(null)}
          />
        </div>
      )}
    </>
  );

  if (embedded) {
    return content;
  }

  return content;
};

export default CallInbox;
