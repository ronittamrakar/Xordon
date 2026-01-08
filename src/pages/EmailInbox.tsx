import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  MailOpen,
  Reply,
  Trash2,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  User,
  Eye,
  Archive,
  Tags as TagIcon,
  MessageCircle,
  Clock,
  Star,
  ArrowLeft,
  Send,
  Paperclip,
  Plus
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { AppLayout } from '@/components/layout/AppLayout';
import { api, type SendingAccount, Campaign } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Breadcrumb } from '@/components/Breadcrumb';
import { SafeHTML } from '@/components/SafeHTML';

interface EmailReply {
  id: number;
  user_id: number;
  campaign_id?: number;
  recipient_id?: number;
  from_email: string;
  to_email: string;
  subject: string;
  body: string;
  is_read: boolean;
  created_at: string;
  campaign_name?: string;
  recipient_email?: string;
  tags?: string[];
  is_archived?: boolean;
  is_starred?: boolean;
  thread_id?: string;
  parent_id?: number;
  message_id?: string;
}

interface Conversation {
  id: string;
  subject: string;
  participants: string[];
  lastMessage: EmailReply;
  messageCount: number;
  unreadCount: number;
  messages: EmailReply[];
  tags: string[];
  is_archived: boolean;
  is_starred: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function EmailInbox() {
  const location = useLocation();
  const [replies, setReplies] = useState<EmailReply[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedReply, setSelectedReply] = useState<EmailReply | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'archived' | 'starred'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'conversations' | 'conversation-detail'>('conversations');
  const { toast } = useToast();

  // Reply composition state
  const [replyTo, setReplyTo] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [selectedSendingAccount, setSelectedSendingAccount] = useState('');
  const [sendingAccounts, setSendingAccounts] = useState<SendingAccount[]>([]);
  const [isComposing, setIsComposing] = useState(false);

  // Tagging state
  const [availableTags] = useState(['Important', 'Follow-up', 'Customer Support', 'Sales', 'Marketing', 'Bug Report']);
  const [newTag, setNewTag] = useState('');

  // Development authentication helper
  useEffect(() => {
    const checkAuthToken = async () => {
      const existingToken = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
      if (!existingToken) {
        console.log('No auth token found, user needs to login');
      }
    };
    checkAuthToken();
  }, []);

  // Handle compose email from location state
  useEffect(() => {
    const state = location.state as { composeEmail?: boolean; recipientEmail?: string; subject?: string } | null;
    if (state?.composeEmail) {
      setReplyTo(state.recipientEmail || '');
      setReplySubject(state.subject || '');
      setReplyBody('');
      setIsReplyDialogOpen(true);
    }
  }, [location.state]);

  const loadCampaigns = useCallback(async () => {
    try {
      const items = await api.getCampaigns();
      setCampaigns(items);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    }
  }, []);

  const loadSendingAccounts = useCallback(async () => {
    try {
      const accounts = await api.getSendingAccounts();
      setSendingAccounts(accounts);
      if (accounts.length > 0) {
        setSelectedSendingAccount(accounts[0].id.toString());
      }
    } catch (error) {
      console.error('Failed to load sending accounts:', error);
    }
  }, []);

  const fetchReplies = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filter !== 'all') {
        params.append('filter', filter);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (selectedCampaign !== 'all') {
        params.append('campaign_id', selectedCampaign);
      }

      const response = await api.get(`/email-replies?${params}`) as { replies: EmailReply[]; pagination: Pagination };
      const fetchedReplies = response.replies || [];
      setReplies(fetchedReplies);
      setPagination(response.pagination || { page: 1, limit: 20, total: 0, pages: 0 });

      // Group replies into conversations using thread_id
      const conversationMap = new Map<string, Conversation>();

      fetchedReplies.forEach(reply => {
        // Use thread_id if available, otherwise fall back to subject-based grouping
        let conversationKey: string;
        let normalizedSubject: string;

        if (reply.thread_id) {
          conversationKey = reply.thread_id;
          normalizedSubject = reply.subject.replace(/^(Re:|Fwd?:|RE:|FWD?:)\s*/gi, '').trim();
        } else {
          // Fallback to old method for emails without thread_id
          normalizedSubject = reply.subject.replace(/^(Re:|Fwd?:|RE:|FWD?:)\s*/gi, '').trim();
          conversationKey = `${normalizedSubject}-${reply.from_email}-${reply.to_email}`;
        }

        if (!conversationMap.has(conversationKey)) {
          // Get unique participants from all emails in thread
          const participants = Array.from(new Set([reply.from_email, reply.to_email]));

          conversationMap.set(conversationKey, {
            id: conversationKey,
            subject: normalizedSubject,
            participants: participants,
            lastMessage: reply,
            messageCount: 1,
            unreadCount: reply.is_read ? 0 : 1,
            messages: [reply],
            tags: reply.tags || [],
            is_archived: reply.is_archived || false,
            is_starred: reply.is_starred || false,
          });
        } else {
          const conversation = conversationMap.get(conversationKey)!;
          conversation.messages.push(reply);
          conversation.messageCount++;
          if (!reply.is_read) {
            conversation.unreadCount++;
          }

          // Update participants list
          const newParticipants = Array.from(new Set([
            ...conversation.participants,
            reply.from_email,
            reply.to_email
          ]));
          conversation.participants = newParticipants;

          // Update last message if this one is newer
          if (new Date(reply.created_at) > new Date(conversation.lastMessage.created_at)) {
            conversation.lastMessage = reply;
          }

          // Merge tags
          const allTags = [...conversation.tags, ...(reply.tags || [])];
          conversation.tags = [...new Set(allTags)];

          // Update archived/starred status
          conversation.is_archived = conversation.is_archived || (reply.is_archived || false);
          conversation.is_starred = conversation.is_starred || (reply.is_starred || false);
        }
      });

      // Sort conversations by last message date
      const sortedConversations = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime());

      setConversations(sortedConversations);
    } catch (error) {
      console.error('Failed to fetch email replies:', error);
      setReplies([]);
      setConversations([]);
      setPagination({ page: 1, limit: 20, total: 0, pages: 0 });
      toast({
        title: 'Error',
        description: 'Failed to fetch email replies',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filter, searchTerm, selectedCampaign, toast]);

  useEffect(() => {
    loadCampaigns();
    loadSendingAccounts();
  }, [loadCampaigns, loadSendingAccounts]);

  useEffect(() => {
    fetchReplies();
  }, [fetchReplies]);

  const fetchThreadedConversation = useCallback(async (threadId: string) => {
    try {
      const response = await api.get(`/email-replies/thread/${threadId}`) as { replies: EmailReply[] };
      const threadReplies = response.replies || [];

      if (threadReplies.length > 0) {
        // Sort messages by creation date
        threadReplies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        // Create conversation object
        const normalizedSubject = threadReplies[0].subject.replace(/^(Re:|Fwd?:|RE:|FWD?:)\s*/gi, '').trim();
        const participants = Array.from(new Set(threadReplies.flatMap(reply => [reply.from_email, reply.to_email])));
        const unreadCount = threadReplies.filter(reply => !reply.is_read).length;
        const lastMessage = threadReplies[threadReplies.length - 1];

        const conversation: Conversation = {
          id: threadId,
          subject: normalizedSubject,
          participants: participants,
          lastMessage: lastMessage,
          messageCount: threadReplies.length,
          unreadCount: unreadCount,
          messages: threadReplies,
          tags: [],
          is_archived: threadReplies.some(reply => reply.is_archived),
          is_starred: threadReplies.some(reply => reply.is_starred),
        };

        setSelectedConversation(conversation);
        setViewMode('conversation-detail');
      }
    } catch (error) {
      console.error('Failed to fetch threaded conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversation details',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const markAsRead = async (replyId: number) => {
    try {
      await api.post(`/email-replies/${replyId}/mark-read`);
      setReplies(prev => prev.map(reply =>
        reply.id === replyId ? { ...reply, is_read: true } : reply
      ));
      // Update conversations
      setConversations(prev => prev.map(conv => ({
        ...conv,
        messages: conv.messages.map(msg =>
          msg.id === replyId ? { ...msg, is_read: true } : msg
        ),
        unreadCount: Math.max(0, conv.unreadCount - 1)
      })));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark email as read',
        variant: 'destructive',
      });
    }
  };

  const markConversationAsRead = async (conversation: Conversation) => {
    try {
      const unreadMessages = conversation.messages.filter(msg => !msg.is_read);
      await Promise.all(unreadMessages.map(msg => api.post(`/email-replies/${msg.id}/mark-read`)));

      setConversations(prev => prev.map(conv =>
        conv.id === conversation.id
          ? {
            ...conv,
            unreadCount: 0,
            messages: conv.messages.map(msg => ({ ...msg, is_read: true }))
          }
          : conv
      ));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark conversation as read',
        variant: 'destructive',
      });
    }
  };

  const archiveConversation = async (conversation: Conversation) => {
    try {
      // In a real implementation, you'd have an API endpoint for this
      // For now, we'll simulate it
      setConversations(prev => prev.map(conv =>
        conv.id === conversation.id
          ? { ...conv, is_archived: !conv.is_archived }
          : conv
      ));

      toast({
        title: 'Success',
        description: `Conversation ${conversation.is_archived ? 'unarchived' : 'archived'}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to archive conversation',
        variant: 'destructive',
      });
    }
  };

  const starConversation = async (conversation: Conversation) => {
    try {
      setConversations(prev => prev.map(conv =>
        conv.id === conversation.id
          ? { ...conv, is_starred: !conv.is_starred }
          : conv
      ));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to star conversation',
        variant: 'destructive',
      });
    }
  };

  const addTagToConversation = async (conversation: Conversation, tag: string) => {
    try {
      if (!conversation.tags.includes(tag)) {
        setConversations(prev => prev.map(conv =>
          conv.id === conversation.id
            ? { ...conv, tags: [...conv.tags, tag] }
            : conv
        ));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add tag',
        variant: 'destructive',
      });
    }
  };

  const removeTagFromConversation = async (conversation: Conversation, tag: string) => {
    try {
      setConversations(prev => prev.map(conv =>
        conv.id === conversation.id
          ? { ...conv, tags: conv.tags.filter(t => t !== tag) }
          : conv
      ));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove tag',
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
      // Update conversations
      setConversations(prev => prev.map(conv => ({
        ...conv,
        messages: conv.messages.filter(msg => msg.id !== replyId),
        messageCount: conv.messageCount - 1
      })).filter(conv => conv.messageCount > 0));

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

  const sendReply = async () => {
    if (!replyTo || !replySubject || !replyBody) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedSendingAccount) {
      toast({
        title: 'Error',
        description: 'Please select a sending account',
        variant: 'destructive',
      });
      return;
    }

    try {
      await api.sendIndividualEmail({
        to_email: replyTo,
        subject: replySubject,
        body: replyBody,
        sending_account_id: selectedSendingAccount,
        save_to_sent: true
      });

      toast({
        title: 'Success',
        description: isComposing ? 'Email sent successfully' : 'Reply sent successfully',
      });

      setIsReplyDialogOpen(false);
      setReplyTo('');
      setReplySubject('');
      setReplyBody('');
      setIsComposing(false);

      // Refresh conversations
      fetchReplies();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send reply',
        variant: 'destructive',
      });
    }
  };

  const openReplyDialog = (reply: EmailReply) => {
    setSelectedReply(reply);
    setReplyTo(reply.from_email);
    setReplySubject(`Re: ${reply.subject}`);
    setReplyBody('');
    setIsComposing(false);
    setIsReplyDialogOpen(true);
  };

  const openComposeDialog = () => {
    setSelectedReply(null);
    setReplyTo('');
    setReplySubject('');
    setReplyBody('');
    setIsComposing(true);
    setIsReplyDialogOpen(true);
  };

  const viewReply = (reply: EmailReply) => {
    setSelectedReply(reply);
    setIsViewDialogOpen(true);
    if (!reply.is_read) {
      markAsRead(reply.id);
    }
  };

  const openConversation = (conversation: Conversation) => {
    // Check if this is a real thread_id (from the database) vs a generated conversation key
    // Real thread_ids don't contain email addresses or dashes from subject-email combinations
    const isRealThreadId = conversation.id &&
      !conversation.id.includes('@') &&
      !conversation.id.includes('-') &&
      conversation.messages.length > 0 &&
      conversation.messages[0].thread_id;

    if (isRealThreadId) {
      // Fetch the complete threaded conversation from the API
      fetchThreadedConversation(conversation.id);
    } else {
      // Use the existing conversation data for non-threaded emails
      setSelectedConversation(conversation);
      setViewMode('conversation-detail');
    }

    // Mark conversation as read when opened
    if (conversation.unreadCount > 0) {
      markConversationAsRead(conversation);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getStatusBadge = (isRead: boolean) => {
    return isRead ? (
      <Badge variant="secondary" className="text-xs">
        Read
      </Badge>
    ) : (
      <Badge variant="default" className="text-xs">
        Unread
      </Badge>
    );
  };

  const filteredConversations = conversations.filter(conversation => {
    // Apply campaign filter
    if (selectedCampaign !== 'all' && conversation.lastMessage.campaign_id?.toString() !== selectedCampaign) {
      return false;
    }

    // Apply status filters
    if (filter === 'unread' && conversation.unreadCount === 0) return false;
    if (filter === 'read' && conversation.unreadCount > 0) return false;
    if (filter === 'archived' && !conversation.is_archived) return false;
    if (filter === 'starred' && !conversation.is_starred) return false;
    if (filter === 'all' && conversation.is_archived) return false; // Don't show archived in 'all'

    // Apply search filter
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      conversation.subject.toLowerCase().includes(searchLower) ||
      conversation.participants.some(p => p.toLowerCase().includes(searchLower)) ||
      conversation.lastMessage.body.toLowerCase().includes(searchLower) ||
      conversation.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <Breadcrumb
          items={[
            { label: 'Email Outreach', href: '/email', icon: <Mail className="h-4 w-4" /> },
            { label: 'Inbox' }
          ]}
          className="mb-4"
        />

        {viewMode === 'conversations' ? (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Email Inbox</h1>
                <p className="text-muted-foreground text-sm">
                  Manage email conversations from your campaigns
                </p>
              </div>
              <Button onClick={openComposeDialog} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Compose Email
              </Button>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Campaigns</SelectItem>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Select value={filter} onValueChange={(value: 'all' | 'unread' | 'read' | 'archived' | 'starred') => setFilter(value)}>
                  <SelectTrigger className="w-32">
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

              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-[300px]"
                />
              </div>
            </div>

            {/* Conversations List */}
            {filteredConversations.length === 0 ? (
              <Card className="border-analytics">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Mail className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No conversations</h3>
                  <p className="text-muted-foreground text-center">
                    {selectedCampaign !== 'all'
                      ? `No conversations found for this campaign`
                      : filter === 'all'
                        ? 'You haven\'t received any email replies yet'
                        : `No ${filter} conversations found`
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-analytics">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b">
                      <TableHead className="font-semibold text-foreground w-[280px]">Subject</TableHead>
                      <TableHead className="font-semibold text-foreground w-[180px]">Participants</TableHead>
                      <TableHead className="font-semibold text-foreground w-[220px]">Preview</TableHead>
                      <TableHead className="font-semibold text-foreground w-[70px]">Messages</TableHead>
                      <TableHead className="font-semibold text-foreground w-[140px]">Tags</TableHead>
                      <TableHead className="font-semibold text-foreground w-[110px]">Last Activity</TableHead>
                      <TableHead className="font-semibold text-foreground w-[90px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConversations.map((conversation) => (
                      <TableRow
                        key={conversation.id}
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${conversation.unreadCount > 0 ? 'bg-muted/30 border-l-4 border-l-primary' : ''
                          }`}
                        onClick={() => openConversation(conversation)}
                      >
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            {conversation.is_starred && (
                              <Star className="h-4 w-4 text-yellow-500 fill-current flex-shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className={`text-sm truncate ${conversation.unreadCount > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'
                                }`}>
                                {conversation.subject}
                              </div>
                              {conversation.unreadCount > 0 && (
                                <Badge variant="default" className="text-xs mt-1 flex-shrink-0">
                                  {conversation.unreadCount} new
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-3">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[200px] text-foreground">
                              {conversation.participants.join(', ')}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="py-3">
                          <div className="max-w-[300px]">
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {conversation.lastMessage.body.substring(0, 80)}...
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="text-center py-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MessageCircle className="h-3 w-3" />
                            <span>{conversation.messageCount}</span>
                          </div>
                        </TableCell>

                        <TableCell className="py-3">
                          {conversation.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[150px]">
                              {conversation.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {conversation.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{conversation.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell className="py-3">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(conversation.lastMessage.created_at)}</span>
                          </div>
                        </TableCell>

                        <TableCell className="py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                openConversation(conversation);
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Conversation
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                openReplyDialog(conversation.lastMessage);
                              }}>
                                <Reply className="h-4 w-4 mr-2" />
                                Reply
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                starConversation(conversation);
                              }}>
                                <Star className="h-4 w-4 mr-2" />
                                {conversation.is_starred ? 'Unstar' : 'Star'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                archiveConversation(conversation);
                              }}>
                                <Archive className="h-4 w-4 mr-2" />
                                {conversation.is_archived ? 'Unarchive' : 'Archive'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <TagIcon className="h-4 w-4 mr-2" />
                                    Add Tag
                                  </DropdownMenuItem>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="left">
                                  {availableTags.map((tag) => (
                                    <DropdownMenuItem
                                      key={tag}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addTagToConversation(conversation, tag);
                                      }}
                                    >
                                      {tag}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </>
        ) : (
          /* Conversation Detail View */
          selectedConversation && (
            <div>
              <div className="flex items-center gap-4 mb-6 pb-4 border-b">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode('conversations')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Inbox
                </Button>
                <div className="flex-1">
                  <h1 className="text-xl font-bold">{selectedConversation.subject}</h1>
                  <p className="text-muted-foreground text-sm">
                    {selectedConversation.messageCount} message{selectedConversation.messageCount !== 1 ? 's' : ''} with {selectedConversation.participants.join(', ')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => starConversation(selectedConversation)}
                  >
                    <Star className={`h-4 w-4 ${selectedConversation.is_starred ? 'fill-current text-yellow-500' : ''}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => archiveConversation(selectedConversation)}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => openReplyDialog(selectedConversation.lastMessage)}
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                </div>
              </div>

              {/* Tags */}
              {selectedConversation.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedConversation.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => removeTagFromConversation(selectedConversation, tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}

              {/* Messages */}
              <div className="space-y-3">
                {selectedConversation.messages
                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  .map((message) => (
                    <Card key={message.id} className={`${!message.is_read ? 'bg-blue-50/30' : ''}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium text-sm">{message.from_email}</span>
                            <span className="text-muted-foreground text-sm">to</span>
                            <span className="font-medium text-sm">{message.to_email}</span>
                            {!message.is_read && (
                              <Badge variant="default" className="text-xs">New</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(message.created_at).toLocaleString()}
                          </div>
                        </div>
                        <h4 className="font-medium text-sm">{message.subject}</h4>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="bg-muted/30 p-3 rounded border">
                          <SafeHTML
                            html={message.body.replace(/\n/g, '<br>')}
                            allowEmail
                            className="text-gray-900 [&_*]:text-gray-900 [&_p]:text-gray-900 [&_div]:text-gray-900 [&_span]:text-gray-900 [&_h1]:text-gray-900 [&_h2]:text-gray-900 [&_h3]:text-gray-900 [&_h4]:text-gray-900 [&_h5]:text-gray-900 [&_h6]:text-gray-900 [&_a]:text-blue-600 [&_a]:underline whitespace-pre-wrap font-sans text-sm leading-relaxed"
                          />
                        </div>
                        <div className="flex justify-end gap-2 mt-3 pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReplyDialog(message)}
                          >
                            <Reply className="h-4 w-4 mr-2" />
                            Reply
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => viewReply(message)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteReply(message.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )
        )}

        {/* Reply/Compose Dialog */}
        <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{isComposing ? 'Compose Email' : 'Send Reply'}</DialogTitle>
              <DialogDescription>
                {isComposing ? 'Send a new email' : `Reply to ${selectedReply?.from_email}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="sending-account">From</Label>
                <select
                  id="sending-account"
                  value={selectedSendingAccount}
                  onChange={(e) => setSelectedSendingAccount(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select sending account</option>
                  {sendingAccounts.map((account) => (
                    <option key={account.id} value={account.id.toString()}>
                      {account.email} ({account.type})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="reply-to">To</Label>
                <Input
                  id="reply-to"
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                  placeholder="Enter recipient email"
                />
              </div>
              <div>
                <Label htmlFor="reply-subject">Subject</Label>
                <Input
                  id="reply-subject"
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  placeholder="Enter subject"
                />
              </div>
              <div>
                <Label htmlFor="reply-body">Message</Label>
                <Textarea
                  id="reply-body"
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Enter your reply"
                  rows={10}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={sendReply}>
                  <Send className="mr-2 h-4 w-4" />
                  {isComposing ? 'Send Email' : 'Send Reply'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Email Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedReply?.subject}</DialogTitle>
              <DialogDescription>
                From: {selectedReply?.from_email} • To: {selectedReply?.to_email} • {selectedReply && new Date(selectedReply.created_at).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg border">
                <SafeHTML
                  html={selectedReply?.body.replace(/\n/g, '<br>') || ''}
                  allowEmail
                  className="text-gray-900 [&_*]:text-gray-900 [&_p]:text-gray-900 [&_div]:text-gray-900 [&_span]:text-gray-900 [&_h1]:text-gray-900 [&_h2]:text-gray-900 [&_h3]:text-gray-900 [&_h4]:text-gray-900 [&_h5]:text-gray-900 [&_h6]:text-gray-900 [&_a]:text-blue-600 [&_a]:underline whitespace-pre-wrap font-sans text-sm leading-relaxed"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  if (selectedReply) {
                    setIsViewDialogOpen(false);
                    openReplyDialog(selectedReply);
                  }
                }}>
                  <Reply className="mr-2 h-4 w-4" />
                  Reply
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
