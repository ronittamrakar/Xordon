import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Inbox as InboxIcon,
  Bell,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  StickyNote,
  MoreVertical,
  User,
  Send,
  X,
  Star,
  Paperclip,
  Calendar,
  DollarSign,
  CheckCircle,
  Circle,
  Users,
  Zap,
  Plus,
  Ticket,
  Briefcase,
  Truck,
  ExternalLink,
  Facebook,
  Linkedin,
  Instagram,
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import conversationsApi from '@/services/conversationsApi';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const EmailRepliesContent = lazy(() => import('./EmailReplies'));
const SMSRepliesContent = lazy(() => import('./SMSReplies'));
const CallInboxContent = lazy(() => import('./calls/CallInbox'));

interface InboxStats {
  email: number;
  sms: number;
  calls: number;
  total: number;
}

function LoadingFallback() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function UnifiedInbox() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = searchParams.get('view') || 'conversations';
  const [activeView, setActiveView] = useState<string>(initialView);
  const queryClient = useQueryClient();

  // 1. Fetch Stats
  const {
    data: stats = { email: 0, sms: 0, calls: 0, total: 0 } as InboxStats,
    isLoading: isStatsLoading,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['inbox-stats'],
    queryFn: async () => {
      const res = await api.get('/inbox/stats');
      return res.data as InboxStats;
    },
    staleTime: 60000,
  });

  const loading = isStatsLoading;
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'pending' | 'closed'>('open');
  const [assignedFilter, setAssignedFilter] = useState<'all' | 'me' | 'unassigned'>('all');
  const [unreadFilter, setUnreadFilter] = useState(false);
  const [hoveredConvId, setHoveredConvId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [messageChannel, setMessageChannel] = useState<'sms' | 'email' | 'note'>('note');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<any>(null);

  const handleViewChange = (view: string) => {
    setActiveView(view);
    setSelectedConversationId(null);
    setSearchParams({ view });
  };

  const handleRefresh = () => {
    refetchStats();
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    queryClient.invalidateQueries({ queryKey: ['conversations-stats'] });
    toast.success('Inbox refreshed');
  };

  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [newChannel, setNewChannel] = useState<'email' | 'sms'>('sms');

  const isThreadedView = ['conversations', 'email', 'sms', 'calls', 'whatsapp', 'messenger', 'linkedin', 'instagram'].includes(activeView);

  // Conversations list
  const { data: conversationsData, isLoading: isLoadingConversations } = useQuery({
    queryKey: ['conversations', activeView, statusFilter, assignedFilter, searchQuery, unreadFilter],
    queryFn: () => conversationsApi.list({
      status: statusFilter === 'all' ? undefined : (statusFilter as any),
      assigned: assignedFilter === 'all' ? undefined : assignedFilter,
      q: searchQuery || undefined,
      unread: unreadFilter || undefined,
      channel: activeView !== 'conversations' ? (activeView as any) : undefined,
      limit: 100,
    }),
    enabled: isThreadedView,
    refetchInterval: 30000, // Poll every 30s
  });

  // Contact search for new conversation
  const { data: contactsSearch = [] } = useQuery({
    queryKey: ['contacts-search', contactSearchQuery],
    queryFn: () => api.getContacts(undefined, contactSearchQuery),
    enabled: isNewConversationOpen && contactSearchQuery.length >= 2,
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: (contactId: number) => conversationsApi.getOrCreateForContact(contactId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setSelectedConversationId(data.id);
      setIsNewConversationOpen(false);
      setContactSearchQuery('');
      setSelectedContact(null);
      toast.success('Conversation started');
    },
    onError: () => toast.error('Failed to start conversation'),
  });

  // Conversation stats
  const { data: conversationStats } = useQuery({
    queryKey: ['conversations-stats'],
    queryFn: () => conversationsApi.getStats(),
  });

  // Selected conversation
  const { data: selectedConversation, isLoading: isLoadingConversation } = useQuery({
    queryKey: ['conversation', selectedConversationId],
    queryFn: () => selectedConversationId ? conversationsApi.get(selectedConversationId) : null,
    enabled: !!selectedConversationId && isThreadedView,
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: (data: { conversationId: number; channel: 'sms' | 'email' | 'note'; body: string }) =>
      conversationsApi.sendMessage(data.conversationId, { channel: data.channel, body: data.body }),
    onSuccess: () => {
      setMessageInput('');
      queryClient.invalidateQueries({ queryKey: ['conversation', selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Message sent');
    },
    onError: () => {
      toast.error('Failed to send message');
    },
  });

  // Update status
  const updateStatusMutation = useMutation({
    mutationFn: (data: { conversationId: number; status: 'open' | 'pending' | 'closed' }) =>
      conversationsApi.updateStatus(data.conversationId, data.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations-stats'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const conversations = conversationsData?.data || [];

  // Scroll to bottom on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  const handleSendMessage = (closeAfter = false) => {
    if (!messageInput.trim() || !selectedConversationId) return;
    sendMessageMutation.mutate(
      {
        conversationId: selectedConversationId,
        channel: messageChannel,
        body: messageInput,
      },
      {
        onSuccess: () => {
          if (closeAfter && selectedConversation) {
            updateStatusMutation.mutate({
              conversationId: selectedConversation.id,
              status: 'closed',
            });
          }
        },
      }
    );
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms': return <MessageSquare className="h-3 w-3" />;
      case 'whatsapp': return <MessageCircle className="h-3 w-3" />;
      case 'messenger': return <Facebook className="h-3 w-3" />;
      case 'linkedin': return <Linkedin className="h-3 w-3" />;
      case 'instagram': return <Instagram className="h-3 w-3" />;
      case 'email': return <Mail className="h-3 w-3" />;
      case 'call': return <Phone className="h-3 w-3" />;
      case 'note': return <StickyNote className="h-3 w-3" />;
      default: return <MessageSquare className="h-3 w-3" />;
    }
  };

  const getContactName = (conv: any) => {
    if (conv.contact_first_name || conv.contact_last_name) {
      return `${conv.contact_first_name || ''} ${conv.contact_last_name || ''}`.trim();
    }
    return conv.contact_email || conv.contact_phone || `Contact #${conv.contact_id}`;
  };

  const getContactInitials = (conv: any) => {
    const name = getContactName(conv);
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between px-1 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <InboxIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Unified Inbox</h1>
            <p className="text-[12px] text-muted-foreground flex items-center gap-2">
              Omni-channel Command Center
              {stats && stats.total > 0 && (
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px] bg-primary/10 text-primary border-none">
                  <Bell className="h-2.5 w-2.5 mr-1" />
                  {stats.total} Unread
                </Badge>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading} className="h-8 text-xs px-3">
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sync Dashboard
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden bg-background border rounded-xl shadow-sm">
        {/* Pane 1: Global Navigation & Folders */}
        <div className="w-64 border-r flex flex-col bg-muted/20 shrink-0">
          <div className="p-3">
            <Button size="sm" className="w-full h-9 shadow-sm shadow-primary/20 font-bold text-xs" onClick={() => setIsNewConversationOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              NEW CONVERSATION
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3 space-y-6">
              {/* Smart Views */}
              <div className="space-y-1">
                <h3 className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Smart Views</h3>
                <Button
                  variant={activeView === 'conversations' && unreadFilter ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn("w-full justify-start text-[13px] h-9 font-medium", activeView === 'conversations' && unreadFilter && "bg-primary/10 text-primary hover:bg-primary/20")}
                  onClick={() => {
                    handleViewChange('conversations');
                    setUnreadFilter(true);
                  }}
                >
                  <Circle className={cn("h-3.5 w-3.5 mr-2.5", unreadFilter && activeView === 'conversations' ? "fill-primary text-primary" : "text-muted-foreground")} />
                  Attention Needed
                  {conversationStats && conversationStats.unread > 0 && (
                    <Badge variant="secondary" className="ml-auto text-[10px] h-4 min-w-[18px] px-1 bg-primary text-primary-foreground border-none font-bold">{conversationStats.unread}</Badge>
                  )}
                </Button>
                <Button
                  variant={activeView === 'conversations' && assignedFilter === 'me' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn("w-full justify-start text-[13px] h-9 font-medium", activeView === 'conversations' && assignedFilter === 'me' && "bg-primary/10 text-primary hover:bg-primary/20")}
                  onClick={() => {
                    handleViewChange('conversations');
                    setAssignedFilter('me');
                    setUnreadFilter(false);
                  }}
                >
                  <User className="h-3.5 w-3.5 mr-2.5 text-muted-foreground" />
                  Assigned to Me
                </Button>
                <Button
                  variant={activeView === 'conversations' && assignedFilter === 'all' && !unreadFilter ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn("w-full justify-start text-[13px] h-9 font-medium", activeView === 'conversations' && assignedFilter === 'all' && !unreadFilter && "bg-primary/10 text-primary hover:bg-primary/20")}
                  onClick={() => {
                    handleViewChange('conversations');
                    setAssignedFilter('all');
                    setUnreadFilter(false);
                  }}
                >
                  <InboxIcon className="h-3.5 w-3.5 mr-2.5 text-muted-foreground" />
                  All Conversations
                </Button>
              </div>

              {/* Channels */}
              <div className="space-y-1">
                <h3 className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Channels</h3>
                <Button
                  variant={activeView === 'email' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn("w-full justify-start text-[13px] h-9 font-medium", activeView === 'email' && "bg-primary/10 text-primary hover:bg-primary/20")}
                  onClick={() => handleViewChange('email')}
                >
                  <Mail className="h-3.5 w-3.5 mr-2.5 text-muted-foreground" />
                  Email Inbox
                  {stats?.email > 0 && <Badge variant="outline" className="ml-auto text-[10px] h-4 border-none bg-muted px-1.5">{stats.email}</Badge>}
                </Button>
                <Button
                  variant={activeView === 'sms' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn("w-full justify-start text-[13px] h-9 font-medium", activeView === 'sms' && "bg-primary/10 text-primary hover:bg-primary/20")}
                  onClick={() => handleViewChange('sms')}
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-2.5 text-muted-foreground" />
                  SMS Messaging
                  {stats?.sms > 0 && <Badge variant="outline" className="ml-auto text-[10px] h-4 border-none bg-muted px-1.5">{stats.sms}</Badge>}
                </Button>
                <Button
                  variant={activeView === 'whatsapp' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn("w-full justify-start text-[13px] h-9 font-medium", activeView === 'whatsapp' && "bg-primary/10 text-primary hover:bg-primary/20")}
                  onClick={() => handleViewChange('whatsapp')}
                >
                  <MessageCircle className="h-3.5 w-3.5 mr-2.5 text-muted-foreground" />
                  WhatsApp
                </Button>
                <Button
                  variant={activeView === 'messenger' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn("w-full justify-start text-[13px] h-9 font-medium", activeView === 'messenger' && "bg-primary/10 text-primary hover:bg-primary/20")}
                  onClick={() => handleViewChange('messenger')}
                >
                  <Facebook className="h-3.5 w-3.5 mr-2.5 text-muted-foreground" />
                  Messenger
                </Button>
                <Button
                  variant={activeView === 'linkedin' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn("w-full justify-start text-[13px] h-9 font-medium", activeView === 'linkedin' && "bg-primary/10 text-primary hover:bg-primary/20")}
                  onClick={() => handleViewChange('linkedin')}
                >
                  <Linkedin className="h-3.5 w-3.5 mr-2.5 text-muted-foreground" />
                  LinkedIn
                </Button>
                <Button
                  variant={activeView === 'instagram' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn("w-full justify-start text-[13px] h-9 font-medium", activeView === 'instagram' && "bg-primary/10 text-primary hover:bg-primary/20")}
                  onClick={() => handleViewChange('instagram')}
                >
                  <Instagram className="h-3.5 w-3.5 mr-2.5 text-muted-foreground" />
                  Instagram
                  <Badge variant="outline" className="ml-auto text-[10px] h-4 border-none bg-muted px-1.5">Soon</Badge>
                </Button>
                <div className="my-2 border-t border-border/50 mx-2" />
                <Button
                  variant={activeView === 'calls' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn("w-full justify-start text-[13px] h-9 font-medium", activeView === 'calls' && "bg-primary/10 text-primary hover:bg-primary/20")}
                  onClick={() => handleViewChange('calls')}
                >
                  <Phone className="h-3.5 w-3.5 mr-2.5 text-muted-foreground" />
                  Call Logs
                </Button>
              </div>


            </div>
          </ScrollArea>
        </div>

        {/* Pane 2 & 3: Content area */}
        <div className="flex-1 flex overflow-hidden">
          {isThreadedView ? (
            <>
              {/* Pane 2: Thread List */}
              <div className="w-80 border-r flex flex-col bg-background shrink-0">
                <div className="p-4 border-b flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      Threads
                    </h2>
                    {conversationStats && conversationStats.unread > 0 && (
                      <Badge className="h-4 px-1.5 text-[10px] bg-primary text-primary-foreground border-none font-bold animate-pulse">
                        {conversationStats.unread} NEW
                      </Badge>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      placeholder="Filter threads..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-7 text-[11px] bg-muted/30 border-none focus-visible:ring-1"
                    />
                  </div>

                  <div className="flex gap-1.5">
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                      <SelectTrigger className="h-7 text-[10px] flex-1 bg-muted/40 border-none font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ALL STATUS</SelectItem>
                        <SelectItem value="open">OPEN</SelectItem>
                        <SelectItem value="pending">PENDING</SelectItem>
                        <SelectItem value="closed">CLOSED</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant={unreadFilter ? 'secondary' : 'ghost'}
                      size="sm"
                      className={cn("h-7 text-[10px] px-2 font-bold", unreadFilter && "bg-primary/10 text-primary border-primary/20")}
                      onClick={() => setUnreadFilter(!unreadFilter)}
                    >
                      UNREAD
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  {isLoadingConversations ? (
                    <div className="p-8 flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Loading...</p>
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="p-8 text-center mt-12">
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <InboxIcon className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                      <h3 className="text-sm font-bold">All caught up</h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-[160px] mx-auto leading-relaxed">No conversations match your current filters.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {conversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => setSelectedConversationId(conv.id)}
                          onMouseEnter={() => setHoveredConvId(conv.id)}
                          onMouseLeave={() => setHoveredConvId(null)}
                          className={cn(
                            'p-4 cursor-pointer hover:bg-muted/30 transition-all relative border-l-2 border-transparent',
                            selectedConversationId === conv.id && 'bg-primary/5 border-l-primary',
                            conv.unread_count > 0 && selectedConversationId !== conv.id && 'bg-muted/10'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                <AvatarImage src={conv.contact_avatar} />
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">{getContactInitials(conv)}</AvatarFallback>
                              </Avatar>
                              {conv.unread_count > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-primary rounded-full border-2 border-background" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className={cn('text-[13px] truncate', conv.unread_count > 0 ? 'font-bold' : 'font-medium')}>
                                  {getContactName(conv)}
                                </span>
                                {conv.last_message_at && (
                                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                    {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                                <span className="text-primary/70">{getChannelIcon(conv.last_message_channel || 'sms')}</span>
                                <span className="truncate">{conv.last_message_preview || 'New inquiry'}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[9px] h-3.5 px-1.5 uppercase font-bold tracking-tight",
                                    conv.status === 'open' ? 'text-green-600 bg-green-50 border-green-200' :
                                      conv.status === 'pending' ? 'text-amber-600 bg-amber-50 border-amber-200' :
                                        'text-muted-foreground bg-muted border-muted-foreground/20'
                                  )}
                                >
                                  {conv.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Pane 3: Detail View */}
              <div className="flex-1 flex bg-muted/5 min-w-0 overflow-hidden">
                {!selectedConversationId ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="h-20 w-20 rounded-3xl bg-primary/5 flex items-center justify-center mb-6 transition-transform hover:scale-110 duration-500">
                      <Zap className="h-10 w-10 text-primary opacity-30 shadow-sm" />
                    </div>
                    <h3 className="text-lg font-bold tracking-tight">Inbox Zero Awaits</h3>
                    <p className="text-sm text-muted-foreground max-w-[280px] mt-2 leading-relaxed">
                      Select a conversation thread to view the full history and reply to your customer.
                    </p>
                  </div>
                ) : isLoadingConversation ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Loading thread...</p>
                    </div>
                  </div>
                ) : selectedConversation ? (
                  <div className="flex-1 flex flex-col bg-background shadow-2xl rounded-l-2xl border-l h-full overflow-hidden animate-in slide-in-from-right-4 duration-300">
                    {/* Header */}
                    <div className="h-16 border-b flex items-center justify-between px-6 bg-background/50 backdrop-blur-sm z-10 shrink-0">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border shadow-sm">
                          <AvatarImage src={selectedConversation.contact_avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">{getContactInitials(selectedConversation)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h2 className="text-[14px] font-bold tracking-tight leading-none mb-1.5">{getContactName(selectedConversation)}</h2>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1 text-green-500"><Circle className="h-2 w-2 fill-current" /> ONLINE</span>
                            {selectedConversation.contact_phone && <span>• {selectedConversation.contact_phone}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Select
                          value={selectedConversation.status}
                          onValueChange={(v) => updateStatusMutation.mutate({ conversationId: selectedConversation.id, status: v as any })}
                        >
                          <SelectTrigger className="h-8 w-24 text-[11px] font-bold border-none bg-muted/60 hover:bg-muted transition-colors">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">OPEN</SelectItem>
                            <SelectItem value="pending">PENDING</SelectItem>
                            <SelectItem value="closed">CLOSED</SelectItem>
                          </SelectContent>
                        </Select>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted transition-colors">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem className="text-xs py-2 font-medium" onClick={() => navigate(`/contacts/${selectedConversation.contact_id}`)}>
                              <ExternalLink className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                              Open CRM Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-xs py-2 font-medium" onClick={() => navigate('/helpdesk/tickets/new', { state: { requester_name: getContactName(selectedConversation) } })}>
                              <Ticket className="h-3.5 w-3.5 mr-2 text-primary/70" />
                              Convert to Ticket
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs py-2 font-medium" onClick={() => navigate('/field-service', { state: { createJob: true, customerName: getContactName(selectedConversation) } })}>
                              <Truck className="h-3.5 w-3.5 mr-2 text-primary/70" />
                              Create Service Job
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-xs py-2 font-medium text-destructive"
                              onClick={() => selectedConversation && updateStatusMutation.mutate({ conversationId: selectedConversation.id, status: 'closed' })}
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-2" />
                              Close Conversation
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 bg-muted/5">
                      <div className="p-6 space-y-6">
                        {selectedConversation.messages?.map((message, i) => {
                          const isMe = message.direction === 'outbound';
                          return (
                            <div key={message.id} className={cn('flex flex-col', isMe ? 'items-end' : 'items-start')}>
                              <div className={cn(
                                'max-w-[80%] rounded-2xl px-4 py-3 shadow-sm',
                                isMe ? 'bg-primary text-primary-foreground rounded-tr-none' :
                                  message.channel === 'note' ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-none italic' :
                                    'bg-background border border-border/50 text-foreground rounded-tl-none'
                              )}>
                                <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{message.body}</p>
                                <div className={cn("text-[9px] mt-2 flex items-center gap-1.5 font-bold uppercase tracking-wider", isMe ? "text-primary-foreground/60" : "text-muted-foreground/60")}>
                                  {getChannelIcon(message.channel)}
                                  <span>{message.channel}</span>
                                  <span>•</span>
                                  <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} className="h-2" />
                      </div>
                    </ScrollArea>

                    {/* Composer */}
                    <div className="p-4 border-t bg-background shrink-0">
                      <div className="max-w-4xl mx-auto space-y-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant={messageChannel === 'sms' ? 'secondary' : 'ghost'}
                            size="sm"
                            className={cn("h-7 px-3 text-[10px] font-bold rounded-full", messageChannel === 'sms' && "bg-primary/10 text-primary hover:bg-primary/20")}
                            onClick={() => setMessageChannel('sms')}
                          >
                            SMS
                          </Button>
                          <Button
                            variant={messageChannel === 'email' ? 'secondary' : 'ghost'}
                            size="sm"
                            className={cn("h-7 px-3 text-[10px] font-bold rounded-full", messageChannel === 'email' && "bg-primary/10 text-primary hover:bg-primary/20")}
                            onClick={() => setMessageChannel('email')}
                          >
                            EMAIL
                          </Button>
                          <Button
                            variant={messageChannel === 'note' ? 'secondary' : 'ghost'}
                            size="sm"
                            className={cn("h-7 px-3 text-[10px] font-bold rounded-full", messageChannel === 'note' && "bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200")}
                            onClick={() => setMessageChannel('note')}
                          >
                            INTERNAL NOTE
                          </Button>
                        </div>

                        <div className="relative bg-muted/30 rounded-xl overflow-hidden border focus-within:border-primary/30 transition-all">
                          <Textarea
                            placeholder={messageChannel === 'note' ? 'Add internal context...' : `Reply via ${messageChannel.toUpperCase()}...`}
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            className="min-h-[100px] w-full resize-none border-none bg-transparent focus-visible:ring-0 text-[13px] p-4 font-medium"
                          />
                          <div className="absolute bottom-3 right-3 flex items-center gap-2">
                            <Button
                              onClick={() => handleSendMessage()}
                              disabled={!messageInput.trim() || sendMessageMutation.isPending}
                              size="sm"
                              className="h-8 px-4 rounded-lg font-bold text-[11px] shadow-lg shadow-primary/20"
                            >
                              {sendMessageMutation.isPending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-2" />}
                              SEND NOW
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* New Conversation Dialog */}
      <Dialog open={isNewConversationOpen} onOpenChange={setIsNewConversationOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
            <DialogDescription>
              Search for a contact to start a new message thread.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Contact</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  className="pl-9"
                  value={contactSearchQuery}
                  onChange={(e) => setContactSearchQuery(e.target.value)}
                />
              </div>

              {contactSearchQuery.length >= 2 && (
                <div className="mt-2 border rounded-md max-h-[200px] overflow-y-auto bg-muted/5">
                  {contactsSearch.length > 0 ? (
                    contactsSearch.map((contact: any) => (
                      <div
                        key={contact.id}
                        className={cn(
                          "p-3 flex items-center gap-3 cursor-pointer hover:bg-accent transition-colors border-b last:border-0",
                          selectedContact?.id === contact.id && "bg-accent"
                        )}
                        onClick={() => setSelectedContact(contact)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={contact.avatar || ''} />
                          <AvatarFallback>{contact.first_name?.[0]}{contact.last_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-none truncate">
                            {contact.first_name} {contact.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {contact.email || contact.phone || 'No contact info'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No contacts found matching "{contactSearchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedContact && (
              <div className="p-3 rounded-lg border bg-primary/5 border-primary/10 animate-in fade-in slide-in-from-top-2">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Contact Selected</p>
                <p className="text-sm font-medium">{selectedContact.first_name} {selectedContact.last_name}</p>
                <p className="text-xs text-muted-foreground">{selectedContact.email || selectedContact.phone}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Channel</label>
              <Tabs value={newChannel} onValueChange={(v: any) => setNewChannel(v)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="sms" className="text-xs uppercase font-bold">SMS</TabsTrigger>
                  <TabsTrigger value="email" className="text-xs uppercase font-bold">Email</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewConversationOpen(false)}>Cancel</Button>
            <Button
              disabled={!selectedContact || createConversationMutation.isPending}
              onClick={() => createConversationMutation.mutate(selectedContact.id)}
            >
              Start Conversation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
