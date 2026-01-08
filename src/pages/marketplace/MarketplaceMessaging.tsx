import { useState, useEffect, useRef } from 'react';
import { MarketplaceNav } from '@/components/marketplace/MarketplaceNav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  MessageSquare, Send, ArrowLeft, User, Building2, Clock, Check, CheckCheck,
  Search, Filter, Loader2
} from 'lucide-react';
import {
  getMessageThreads,
  getMessages,
  sendMessage,
  markMessagesRead,
  consumerGetMessageThreads,
  consumerSendMessage,
  MessageThread,
  MarketplaceMessage
} from '@/services/leadMarketplaceApi';

// Format time ago
const timeAgo = (date: string) => {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
};

// Message Bubble Component
const MessageBubble = ({ message, isOwn }: { message: MarketplaceMessage; isOwn: boolean }) => (
  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
    <div className={`max-w-[70%] ${isOwn ? 'order-1' : ''}`}>
      <div
        className={`px-4 py-2 rounded-2xl ${
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted rounded-bl-md'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
        {message.attachment_url && (
          <a
            href={message.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline mt-1 block"
          >
            View Attachment
          </a>
        )}
      </div>
      <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${isOwn ? 'justify-end' : ''}`}>
        <span>{timeAgo(message.created_at)}</span>
        {isOwn && (
          message.read_at ? (
            <CheckCheck className="w-3 h-3 text-primary" />
          ) : (
            <Check className="w-3 h-3" />
          )
        )}
      </div>
    </div>
  </div>
);

// Thread List Item Component
const ThreadItem = ({ thread, active, onClick }: {
  thread: MessageThread;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full p-4 text-left hover:bg-muted/50 transition-colors border-b ${
      active ? 'bg-muted' : ''
    }`}
  >
    <div className="flex items-start gap-3">
      <Avatar className="w-10 h-10">
        <AvatarFallback>
          {thread.consumer_name?.[0] || thread.provider_name?.[0] || '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium truncate">
            {thread.consumer_name || thread.provider_name || 'Unknown'}
          </span>
          {thread.last_message_at && (
            <span className="text-xs text-muted-foreground">
              {timeAgo(thread.last_message_at)}
            </span>
          )}
        </div>
        {thread.lead_type && (
          <Badge variant="outline" className="text-xs mb-1">
            {thread.lead_type}
          </Badge>
        )}
        {thread.last_message && (
          <p className="text-sm text-muted-foreground truncate">
            {thread.last_message}
          </p>
        )}
        {thread.unread_count > 0 && (
          <Badge className="mt-1">{thread.unread_count} new</Badge>
        )}
      </div>
    </div>
  </button>
);

// Chat View Component
const ChatView = ({ thread, userType, onBack }: {
  thread: MessageThread;
  userType: 'provider' | 'consumer';
  onBack: () => void;
}) => {
  const [messages, setMessages] = useState<MarketplaceMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [thread.lead_match_id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await getMessages(thread.lead_match_id);
      if (res.data.success) {
        setMessages(res.data.data);
        // Mark as read
        if (res.data.data.some((m: MarketplaceMessage) => !m.read_at && m.sender_type !== userType)) {
          markMessagesRead(thread.lead_match_id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const sendFn = userType === 'provider' ? sendMessage : consumerSendMessage;
      const res = await sendFn(thread.lead_match_id, newMessage);
      if (res.data.success) {
        setMessages([...messages, res.data.data]);
        setNewMessage('');
        inputRef.current?.focus();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Avatar>
          <AvatarFallback>
            {thread.consumer_name?.[0] || thread.provider_name?.[0] || '?'}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium">
            {userType === 'provider' ? thread.consumer_name : thread.provider_name}
          </h3>
          {thread.lead_type && (
            <p className="text-sm text-muted-foreground">{thread.lead_type}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-12 w-2/3 ml-auto" />
            <Skeleton className="h-12 w-3/4" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.sender_type === userType}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={sending}
          />
          <Button onClick={handleSend} disabled={!newMessage.trim() || sending}>
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Main Messaging Component
export function MarketplaceMessaging({ userType = 'provider' }: { userType?: 'provider' | 'consumer' }) {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchThreads();
  }, [userType]);

  const fetchThreads = async () => {
    try {
      const fetchFn = userType === 'provider' ? getMessageThreads : consumerGetMessageThreads;
      const res = await fetchFn();
      if (res.data.success) {
        setThreads(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const filteredThreads = threads.filter((thread) => {
    if (!searchQuery) return true;
    const name = userType === 'provider' ? thread.consumer_name : thread.provider_name;
    return (
      name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.lead_type?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalUnread = threads.reduce((sum, t) => sum + (t.unread_count || 0), 0);

  return (
    <div className="space-y-6">
      <MarketplaceNav />
      <div className="h-[calc(100vh-200px)] min-h-[500px]">
      <Card className="h-full overflow-hidden">
        <div className="flex h-full">
          {/* Thread List */}
          <div
            className={`w-full md:w-80 border-r flex flex-col ${
              selectedThread ? 'hidden md:flex' : ''
            }`}
          >
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Messages
                  {totalUnread > 0 && (
                    <Badge variant="destructive">{totalUnread}</Badge>
                  )}
                </h2>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="pl-9"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              {loading ? (
                <div className="p-4 space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No conversations yet</p>
                  <p className="text-sm">
                    {userType === 'provider'
                      ? 'Accept a lead to start messaging'
                      : 'Get matched with a provider to chat'}
                  </p>
                </div>
              ) : (
                filteredThreads.map((thread) => (
                  <ThreadItem
                    key={thread.lead_match_id}
                    thread={thread}
                    active={selectedThread?.lead_match_id === thread.lead_match_id}
                    onClick={() => setSelectedThread(thread)}
                  />
                ))
              )}
            </ScrollArea>
          </div>

          {/* Chat View */}
          <div
            className={`flex-1 ${
              !selectedThread ? 'hidden md:flex' : 'flex'
            } flex-col`}
          >
            {selectedThread ? (
              <ChatView
                thread={selectedThread}
                userType={userType}
                onBack={() => setSelectedThread(null)}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-1">Select a conversation</h3>
                  <p className="text-sm">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
      </div>
    </div>
  );
}

// Provider Messaging (Wrapper)
export function ProviderMessaging() {
  return <MarketplaceMessaging userType="provider" />;
}

// Consumer Messaging (Wrapper)
export function ConsumerMessaging() {
  return <MarketplaceMessaging userType="consumer" />;
}

export default MarketplaceMessaging;
