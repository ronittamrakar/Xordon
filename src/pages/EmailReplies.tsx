import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { Breadcrumb } from '@/components/Breadcrumb';
import {
  Mail,
  MailOpen,
  Star,
  Archive,
  Trash2,
  Reply,
  Forward,
  Search,
  RefreshCw,
  Eye,
  MoreHorizontal,
  Calendar,
  User,
  Plus,
  Download,
  Flag,
  ArrowUpDown,
  Filter,
  Send
} from 'lucide-react';
import { api, type Campaign, type SendingAccount } from '@/lib/api';
import { SafeHTML } from '@/components/SafeHTML';

interface EmailReply {
  id: number;
  from_email: string;
  to_email: string;
  subject: string;
  body: string;
  is_read: boolean;
  is_starred: boolean;
  is_archived: boolean;
  created_at: string;
  campaign_id?: number;
  campaign_name?: string;
  thread_id?: string;
  parent_id?: number;
  message_id?: string;
  attachments?: string[];
  priority?: 'low' | 'normal' | 'high';
  labels?: string[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface EmailRepliesProps {
  embedded?: boolean;
}

export default function EmailReplies({ embedded = false }: EmailRepliesProps) {
  const [replies, setReplies] = useState<EmailReply[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sendingAccounts, setSendingAccounts] = useState<SendingAccount[]>([]);
  const [selectedSendingAccountId, setSelectedSendingAccountId] = useState<string>('');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [selectedReply, setSelectedReply] = useState<EmailReply | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'starred' | 'archived'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isForwardDialogOpen, setIsForwardDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const { toast } = useToast();
  const toastRef = useRef(toast);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'subject' | 'from'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showLabels, setShowLabels] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  // Add compose email states
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    body: ''
  });

  // Reply composition state
  const [replyTo, setReplyTo] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');

  // Forward composition state
  const [forwardTo, setForwardTo] = useState('');
  const [forwardSubject, setForwardSubject] = useState('');
  const [forwardBody, setForwardBody] = useState('');

  const loadSendingAccounts = useCallback(async () => {
    try {
      const accounts = await api.getSendingAccounts();
      const active = (accounts || []).filter(a => a.status === 'active');
      setSendingAccounts(active);
      setSelectedSendingAccountId(prev => prev || active[0]?.id || '');
    } catch (error) {
      console.error('Failed to load sending accounts:', error);
      setSendingAccounts([]);
      setSelectedSendingAccountId('');
    }
  }, []);

  const loadCampaigns = useCallback(async () => {
    try {
      const campaigns = await api.getCampaigns();
      setCampaigns(campaigns || []);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    }
  }, []);

  const fetchReplies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(selectedCampaign !== 'all' && { campaign_id: selectedCampaign }),
        ...(filter !== 'all' && { filter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await api.getEmailReplies(params.toString());
      setReplies(response.replies || []);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total || 0,
        pages: response.pagination.pages || 0,
      }));
    } catch (error) {
      toastRef.current({
        title: 'Error',
        description: 'Failed to fetch email replies',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, selectedCampaign, filter, searchTerm]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  useEffect(() => {
    loadSendingAccounts();
  }, [loadSendingAccounts]);

  useEffect(() => {
    fetchReplies();
  }, [fetchReplies]);

  const markAsRead = async (replyId: number) => {
    try {
      await api.post(`/email-replies/${replyId}/mark-read`);
      setReplies(prev => prev.map(reply =>
        reply.id === replyId ? { ...reply, is_read: true } : reply
      ));
      toast({
        title: 'Success',
        description: 'Email marked as read',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark email as read',
        variant: 'destructive',
      });
    }
  };

  const markAsUnread = async (replyId: number) => {
    try {
      await api.post(`/email-replies/${replyId}/mark-unread`);
      setReplies(prev => prev.map(reply =>
        reply.id === replyId ? { ...reply, is_read: false } : reply
      ));
      toast({
        title: 'Success',
        description: 'Email marked as unread',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark email as unread',
        variant: 'destructive',
      });
    }
  };

  const deleteReply = async (replyId: number) => {
    if (!confirm('Are you sure you want to delete this email reply?')) {
      return;
    }

    try {
      await api.delete(`/email-replies/${replyId}`);
      setReplies(prev => prev.filter(reply => reply.id !== replyId));
      toast({
        title: 'Success',
        description: 'Email reply deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete email reply',
        variant: 'destructive',
      });
    }
  };

  const toggleStar = async (replyId: number) => {
    try {
      const response = await api.toggleEmailReplyStar(replyId);
      setReplies(prev => prev.map(reply =>
        reply.id === replyId ? { ...reply, is_starred: response.is_starred } : reply
      ));
      toast({
        title: 'Success',
        description: response.message,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle star',
        variant: 'destructive',
      });
    }
  };

  const toggleArchive = async (replyId: number) => {
    try {
      const response = await api.toggleEmailReplyArchive(replyId);
      setReplies(prev => prev.map(reply =>
        reply.id === replyId ? { ...reply, is_archived: response.is_archived } : reply
      ));
      toast({
        title: 'Success',
        description: response.message,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle archive',
        variant: 'destructive',
      });
    }
  };

  const sendReply = async () => {
    if (!replyTo || !replySubject || !replyBody) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      await api.sendEmail({
        to_email: replyTo,
        subject: replySubject,
        body: replyBody,
        parent_id: selectedReply?.id,
      });

      setReplyTo('');
      setReplySubject('');
      setReplyBody('');
      setIsReplyDialogOpen(false);

      toast({
        title: 'Success',
        description: 'Reply sent successfully',
      });

      fetchReplies();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send reply',
        variant: 'destructive',
      });
    }
  };

  const sendForward = async () => {
    if (!forwardTo || !forwardSubject || !forwardBody) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      await api.sendEmail({
        to_email: forwardTo,
        subject: forwardSubject,
        body: forwardBody,
      });

      setForwardTo('');
      setForwardSubject('');
      setForwardBody('');
      setIsForwardDialogOpen(false);

      toast({
        title: 'Success',
        description: 'Email forwarded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to forward email',
        variant: 'destructive',
      });
    }
  };

  const openReplyDialog = (reply: EmailReply) => {
    setSelectedReply(reply);
    setReplyTo(reply.from_email);
    setReplySubject(`Re: ${reply.subject}`);
    setReplyBody(`\n\n--- Original Message ---\nFrom: ${reply.from_email}\nTo: ${reply.to_email}\nSubject: ${reply.subject}\n\n${reply.body}`);
    setIsReplyDialogOpen(true);
  };

  const openForwardDialog = (reply: EmailReply) => {
    setSelectedReply(reply);
    setForwardTo('');
    setForwardSubject(`Fwd: ${reply.subject}`);
    setForwardBody(`\n\n--- Forwarded Message ---\nFrom: ${reply.from_email}\nTo: ${reply.to_email}\nSubject: ${reply.subject}\n\n${reply.body}`);
    setIsForwardDialogOpen(true);
  };

  const viewReply = (reply: EmailReply) => {
    setSelectedReply(reply);
    setIsViewDialogOpen(true);
    if (!reply.is_read) {
      markAsRead(reply.id);
    }
  };

  const handleSelectEmail = (emailId: number) => {
    setSelectedEmails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(filteredReplies.map(reply => reply.id)));
    }
    setSelectAll(!selectAll);
  };

  const bulkMarkAsRead = async () => {
    if (selectedEmails.size === 0) return;

    try {
      for (const emailId of selectedEmails) {
        await markAsRead(emailId);
      }
      setSelectedEmails(new Set());
      setSelectAll(false);
      toast({
        title: 'Success',
        description: `Marked ${selectedEmails.size} emails as read`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark emails as read',
        variant: 'destructive',
      });
    }
  };

  const bulkMarkAsUnread = async () => {
    if (selectedEmails.size === 0) return;

    try {
      for (const emailId of selectedEmails) {
        await markAsUnread(emailId);
      }
      setSelectedEmails(new Set());
      setSelectAll(false);
      toast({
        title: 'Success',
        description: `Marked ${selectedEmails.size} emails as unread`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark emails as unread',
        variant: 'destructive',
      });
    }
  };

  const bulkStar = async () => {
    if (selectedEmails.size === 0) return;

    try {
      for (const emailId of selectedEmails) {
        await toggleStar(emailId);
      }
      setSelectedEmails(new Set());
      setSelectAll(false);
      toast({
        title: 'Success',
        description: `Starred ${selectedEmails.size} emails`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to star emails',
        variant: 'destructive',
      });
    }
  };

  const bulkArchive = async () => {
    if (selectedEmails.size === 0) return;

    try {
      for (const emailId of selectedEmails) {
        await toggleArchive(emailId);
      }
      setSelectedEmails(new Set());
      setSelectAll(false);
      toast({
        title: 'Success',
        description: `Archived ${selectedEmails.size} emails`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to archive emails',
        variant: 'destructive',
      });
    }
  };

  const bulkDelete = async () => {
    if (selectedEmails.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedEmails.size} emails?`)) {
      return;
    }

    try {
      for (const emailId of selectedEmails) {
        await deleteReply(emailId);
      }
      setSelectedEmails(new Set());
      setSelectAll(false);
      toast({
        title: 'Success',
        description: `Deleted ${selectedEmails.size} emails`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete emails',
        variant: 'destructive',
      });
    }
  };

  const exportEmails = () => {
    const emailsToExport = selectedEmails.size > 0
      ? replies.filter(reply => selectedEmails.has(reply.id))
      : replies;

    const csvContent = [
      ['Date', 'From', 'To', 'Subject', 'Status', 'Campaign'].join(','),
      ...emailsToExport.map(reply => [
        new Date(reply.created_at).toLocaleDateString(),
        reply.from_email,
        reply.to_email,
        `"${reply.subject.replace(/"/g, '""')}"`,
        reply.is_read ? 'Read' : 'Unread',
        reply.campaign_name || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-replies-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: `Exported ${emailsToExport.length} emails`,
    });
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

  const getStatusBadge = (isRead: boolean) => {
    return isRead ? (
      <Badge variant="secondary">
        <MailOpen className="h-3 w-3 mr-1" />
        Read
      </Badge>
    ) : (
      <Badge variant="default">
        <Mail className="h-3 w-3 mr-1" />
        Unread
      </Badge>
    );
  };

  const getPriorityIcon = (priority?: 'low' | 'normal' | 'high') => {
    switch (priority) {
      case 'high':
        return <Flag className="h-4 w-4 text-red-500" />;
      case 'low':
        return <Flag className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const filteredReplies = replies.filter(reply => {
    const matchesSearch = !searchTerm ||
      reply.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reply.from_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reply.to_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reply.body.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCampaign = selectedCampaign === 'all' ||
      reply.campaign_id?.toString() === selectedCampaign;

    const matchesFilter = (() => {
      switch (filter) {
        case 'unread': return !reply.is_read;
        case 'read': return reply.is_read;
        case 'starred': return reply.is_starred;
        case 'archived': return reply.is_archived;
        default: return !reply.is_archived; // 'all' but exclude archived by default
      }
    })();

    return matchesSearch && matchesCampaign && matchesFilter;
  });

  const content = (
    <>
      <div className="space-y-4 w-full max-w-none">
        {!embedded && (
          <Breadcrumb
            items={[
              { label: 'Email Outreach', href: '/email', icon: <Mail className="h-4 w-4" /> },
              { label: 'Replies' }
            ]}
          />
        )}

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-[18px] font-bold tracking-tight">Email Replies</h1>
            <p className="text-muted-foreground">
              Manage and respond to email replies from your campaigns
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsComposeOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Compose
            </Button>
            <Button onClick={exportEmails} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={fetchReplies} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="border-analytics">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search emails..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Label htmlFor="campaign">Campaign</Label>
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger>
                    <SelectValue placeholder="All campaigns" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All campaigns</SelectItem>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-32">
                <Label htmlFor="filter">Status</Label>
                <Select value={filter} onValueChange={(value: 'all' | 'unread' | 'read' | 'starred' | 'archived') => setFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="starred">Starred</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedEmails.size > 0 && (
          <Card className="border-analytics">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {selectedEmails.size} email{selectedEmails.size !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button onClick={bulkMarkAsRead} variant="outline" size="sm">
                    <MailOpen className="h-4 w-4 mr-2" />
                    Mark as Read
                  </Button>
                  <Button onClick={bulkMarkAsUnread} variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Mark as Unread
                  </Button>
                  <Button onClick={bulkStar} variant="outline" size="sm">
                    <Star className="h-4 w-4 mr-2" />
                    Star
                  </Button>
                  <Button onClick={bulkArchive} variant="outline" size="sm">
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </Button>
                  <Button onClick={bulkDelete} variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Email List */}
        <Card className="border-analytics">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Email Replies ({filteredReplies.length})</span>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">Select All</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredReplies.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No email replies found</h3>
                <p className="text-muted-foreground mb-4">
                  {filter === 'all'
                    ? "You haven't received any email replies yet."
                    : `No ${filter} emails found.`}
                </p>
                <Button
                  onClick={() => setIsComposeOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Compose Your First Email
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReplies.map((reply) => (
                    <TableRow
                      key={reply.id}
                      className={`cursor-pointer hover:bg-muted/50 ${!reply.is_read ? 'font-semibold' : ''}`}
                      onClick={() => viewReply(reply)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedEmails.has(reply.id)}
                          onCheckedChange={() => handleSelectEmail(reply.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPriorityIcon(reply.priority)}
                          <div>
                            <div className="font-medium">{reply.from_email}</div>
                            <div className="text-sm text-muted-foreground">
                              To: {reply.to_email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {reply.is_starred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                          <span className={!reply.is_read ? 'font-semibold' : ''}>{reply.subject}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {reply.campaign_name || 'Direct'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(reply.is_read)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatDate(reply.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => viewReply(reply)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openReplyDialog(reply)}>
                              <Reply className="h-4 w-4 mr-2" />
                              Reply
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openForwardDialog(reply)}>
                              <Forward className="h-4 w-4 mr-2" />
                              Forward
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toggleStar(reply.id)}>
                              <Star className="h-4 w-4 mr-2" />
                              {reply.is_starred ? 'Unstar' : 'Star'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleArchive(reply.id)}>
                              <Archive className="h-4 w-4 mr-2" />
                              {reply.is_archived ? 'Unarchive' : 'Archive'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => deleteReply(reply.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-4">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
              disabled={pagination.page === pagination.pages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* View Email Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {selectedReply?.subject}
            </DialogTitle>
            <DialogDescription>
              From: {selectedReply?.from_email} • To: {selectedReply?.to_email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <User className="h-3 w-3 mr-1" />
                {selectedReply?.campaign_name || 'Direct'}
              </Badge>
              <Badge variant="outline">
                <Calendar className="h-3 w-3 mr-1" />
                {selectedReply && formatDate(selectedReply.created_at)}
              </Badge>
              {selectedReply?.is_starred && (
                <Badge variant="outline">
                  <Star className="h-3 w-3 mr-1 text-yellow-500 fill-current" />
                  Starred
                </Badge>
              )}
            </div>
            <div className="bg-muted/50 p-4 rounded-lg border">
              <SafeHTML
                html={selectedReply?.body || ''}
                allowEmail
                className="prose prose-sm max-w-none text-gray-900 [&_*]:text-gray-900 [&_p]:text-gray-900 [&_div]:text-gray-900 [&_span]:text-gray-900 [&_h1]:text-gray-900 [&_h2]:text-gray-900 [&_h3]:text-gray-900 [&_h4]:text-gray-900 [&_h5]:text-gray-900 [&_h6]:text-gray-900 [&_a]:text-blue-600 [&_a]:underline"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => {
                if (selectedReply) openReplyDialog(selectedReply);
                setIsViewDialogOpen(false);
              }}>
                <Reply className="h-4 w-4 mr-2" />
                Reply
              </Button>
              <Button variant="outline" onClick={() => {
                if (selectedReply) openForwardDialog(selectedReply);
                setIsViewDialogOpen(false);
              }}>
                <Forward className="h-4 w-4 mr-2" />
                Forward
              </Button>
              <Button variant="outline" onClick={() => {
                if (selectedReply) toggleStar(selectedReply.id);
              }}>
                <Star className="h-4 w-4 mr-2" />
                {selectedReply?.is_starred ? 'Unstar' : 'Star'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Compose Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Compose New Email
            </DialogTitle>
            <DialogDescription>
              Create and send a new email
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>From</Label>
              <Select
                value={selectedSendingAccountId}
                onValueChange={(value) => setSelectedSendingAccountId(value)}
                disabled={sendingAccounts.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={sendingAccounts.length === 0 ? 'No sender email configured' : 'Select sender email'} />
                </SelectTrigger>
                <SelectContent>
                  {sendingAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="compose-to">To</Label>
              <Input
                id="compose-to"
                value={composeData.to}
                onChange={(e) => setComposeData(prev => ({ ...prev, to: e.target.value }))}
                placeholder="Recipient email"
              />
            </div>
            <div>
              <Label htmlFor="compose-subject">Subject</Label>
              <Input
                id="compose-subject"
                value={composeData.subject}
                onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject"
              />
            </div>
            <div>
              <Label htmlFor="compose-body">Message</Label>
              <Textarea
                id="compose-body"
                value={composeData.body}
                onChange={(e) => setComposeData(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Type your message..."
                rows={10}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsComposeOpen(false);
                setComposeData({ to: '', subject: '', body: '' });
              }}>
                Cancel
              </Button>
              <Button onClick={async () => {
                if (!composeData.to || !composeData.subject || !composeData.body) {
                  toast({
                    title: 'Error',
                    description: 'Please fill in all fields',
                    variant: 'destructive',
                  });
                  return;
                }

                if (sendingAccounts.length > 0 && !selectedSendingAccountId) {
                  toast({
                    title: 'Error',
                    description: 'Please select a sender email',
                    variant: 'destructive',
                  });
                  return;
                }

                if (sendingAccounts.length === 0) {
                  toast({
                    title: 'No sender email configured',
                    description: 'Add a sending account in Settings > Email before composing.',
                    variant: 'destructive',
                  });
                  return;
                }

                try {
                  await api.sendEmail({
                    to_email: composeData.to,
                    subject: composeData.subject,
                    body: composeData.body,
                    sending_account_id: selectedSendingAccountId,
                  });

                  setComposeData({ to: '', subject: '', body: '' });
                  setIsComposeOpen(false);

                  toast({
                    title: 'Success',
                    description: 'Email sent successfully',
                  });

                  fetchReplies();
                } catch (error) {
                  toast({
                    title: 'Error',
                    description: 'Failed to send email',
                    variant: 'destructive',
                  });
                }
              }}>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Reply className="h-5 w-5" />
              Reply to Email
            </DialogTitle>
            <DialogDescription>
              Compose your reply to {selectedReply?.from_email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reply-to">To</Label>
              <Input
                id="reply-to"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                placeholder="Recipient email"
              />
            </div>
            <div>
              <Label htmlFor="reply-subject">Subject</Label>
              <Input
                id="reply-subject"
                value={replySubject}
                onChange={(e) => setReplySubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>
            <div>
              <Label htmlFor="reply-body">Message</Label>
              <Textarea
                id="reply-body"
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Type your reply..."
                rows={10}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={sendReply}>
                <Reply className="h-4 w-4 mr-2" />
                Send Reply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Forward Dialog */}
      <Dialog open={isForwardDialogOpen} onOpenChange={setIsForwardDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Forward className="h-5 w-5" />
              Forward Email
            </DialogTitle>
            <DialogDescription>
              Forward this email to someone else
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="forward-to">To</Label>
              <Input
                id="forward-to"
                value={forwardTo}
                onChange={(e) => setForwardTo(e.target.value)}
                placeholder="Recipient email"
              />
            </div>
            <div>
              <Label htmlFor="forward-subject">Subject</Label>
              <Input
                id="forward-subject"
                value={forwardSubject}
                onChange={(e) => setForwardSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>
            <div>
              <Label htmlFor="forward-body">Message</Label>
              <Textarea
                id="forward-body"
                value={forwardBody}
                onChange={(e) => setForwardBody(e.target.value)}
                placeholder="Add your message..."
                rows={10}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsForwardDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={sendForward}>
                <Forward className="h-4 w-4 mr-2" />
                Forward
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  if (embedded) {
    return content;
  }

  return <AppLayout>{content}</AppLayout>;
}
