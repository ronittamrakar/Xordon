import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useToast } from '@/hooks/use-toast';
import ticketsApi, { Ticket, TicketMessage } from '@/services/ticketsApi';
import {
  Send,
  Clock,
  User,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Paperclip,
  Star,
  Tag,
  MoreHorizontal,
  ArrowLeft,
  Eye,
  Lock,
  Briefcase,
  Truck
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messageBody, setMessageBody] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  // Fetch ticket
  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketsApi.get(Number(id)),
    enabled: !!id,
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  // Update ticket mutation
  const updateTicketMutation = useMutation({
    mutationFn: ({ field, value }: { field: string; value: any }) =>
      ticketsApi.update(Number(id), { [field]: value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
      toast({ title: 'Ticket updated' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update ticket', variant: 'destructive' });
    },
  });

  // Add message mutation
  const addMessageMutation = useMutation({
    mutationFn: (data: Partial<TicketMessage>) => ticketsApi.addMessage(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      setMessageBody('');
      toast({ title: 'Message sent' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    },
  });

  const handleSendMessage = () => {
    if (!messageBody.trim()) return;

    addMessageMutation.mutate({
      body: messageBody,
      direction: 'outbound',
      message_type: isPrivate ? 'note' : 'comment',
      is_private: isPrivate,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Ticket not found</p>
          <Button className="mt-4" onClick={() => navigate('/helpdesk/tickets')}>
            Back to Tickets
          </Button>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
    };
    return colors[priority] || 'bg-gray-500';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { icon: any; className: string }> = {
      new: { icon: AlertCircle, className: 'bg-blue-500' },
      open: { icon: MessageCircle, className: 'bg-indigo-500' },
      pending: { icon: Clock, className: 'bg-purple-500' },
      on_hold: { icon: Clock, className: 'bg-gray-500' },
      resolved: { icon: CheckCircle2, className: 'bg-green-500' },
      closed: { icon: XCircle, className: 'bg-gray-400' },
      cancelled: { icon: XCircle, className: 'bg-red-400' },
    };
    const config = variants[status] || variants.open;
    const Icon = config.icon;
    return (
      <Badge className={`${config.className} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Helpdesk', href: '/helpdesk' },
          { label: 'Tickets', href: '/helpdesk/tickets' },
          { label: ticket.ticket_number },
        ]}
      />

      <div className="mx-auto max-w-7xl py-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/helpdesk/tickets')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-mono text-muted-foreground">{ticket.ticket_number}</span>
                {getStatusBadge(ticket.status)}
                <div className={`w-2 h-2 rounded-full ${getPriorityColor(ticket.priority)}`} title={`Priority: ${ticket.priority}`}></div>
                {ticket.sla_response_breached && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="w-3 h-3" />
                    SLA Breach
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold text-foreground">{ticket.title}</h1>
              {ticket.description && (
                <p className="text-muted-foreground mt-2">{ticket.description}</p>
              )}
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              Create Action
              <MoreHorizontal className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate('/projects/new', {
              state: {
                title: `[Ticket #${ticket.ticket_number}] ${ticket.title}`,
                description: ticket.description,
                contactId: (ticket as any).contact_id
              }
            })}>
              <Briefcase className="mr-2 h-4 w-4" />
              Create Project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/operations/field-service', {
              state: {
                createJob: true,
                ticketNumber: ticket.ticket_number,
                ticketTitle: ticket.title,
                customerName: ticket.requester_name,
                customerPhone: ticket.requester_phone,
                address: null
              }
            })}>
              <Truck className="mr-2 h-4 w-4" />
              Create Field Service Job
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Messages */}
            <Card>
              <CardHeader>
                <CardTitle>Conversation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6 max-h-[600px] overflow-y-auto">
                  {ticket.messages && ticket.messages.length > 0 ? (
                    ticket.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.direction === 'outbound' ? 'flex-row-reverse' : ''}`}
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            {message.author_user_name
                              ? message.author_user_name.charAt(0).toUpperCase()
                              : message.author_name
                                ? message.author_name.charAt(0).toUpperCase()
                                : '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex-1 ${message.direction === 'outbound' ? 'text-right' : ''}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold">
                              {message.author_user_name || message.author_name || 'Unknown'}
                            </span>
                            {message.is_private && (
                              <Badge variant="outline" className="gap-1">
                                <Lock className="w-3 h-3" />
                                Private Note
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <div
                            className={`inline-block p-3 rounded-lg ${message.direction === 'outbound'
                              ? 'bg-primary text-primary-foreground'
                              : message.is_private
                                ? 'bg-yellow-100 dark:bg-yellow-900'
                                : 'bg-muted'
                              }`}
                          >
                            <p className="whitespace-pre-wrap">{message.body}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No messages yet</p>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Form */}
                <div className="border-t pt-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Button
                      variant={isPrivate ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => setIsPrivate(false)}
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Reply
                    </Button>
                    <Button
                      variant={isPrivate ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setIsPrivate(true)}
                    >
                      <Lock className="w-4 h-4 mr-1" />
                      Private Note
                    </Button>
                  </div>
                  <Textarea
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    placeholder={isPrivate ? 'Add a private note (only visible to agents)...' : 'Type your reply...'}
                    rows={4}
                    className="mb-2"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageBody.trim() || addMessageMutation.isPending}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {addMessageMutation.isPending ? 'Sending...' : 'Send'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Log */}
            {ticket.activities && ticket.activities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {ticket.activities.slice(0, 10).map((activity) => (
                      <div key={activity.id} className="flex gap-3 text-sm">
                        <div className="text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </div>
                        <div>
                          <span className="font-medium">{activity.user_name || 'System'}</span>
                          {' '}
                          <span className="text-muted-foreground">{activity.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Properties */}
            <Card>
              <CardHeader>
                <CardTitle>Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select
                    value={ticket.status}
                    onValueChange={(v) => updateTicketMutation.mutate({ field: 'status', value: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Priority</Label>
                  <Select
                    value={ticket.priority}
                    onValueChange={(v) => updateTicketMutation.mutate({ field: 'priority', value: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {ticket.type_name && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Type</Label>
                    <div className="mt-1">
                      <Badge variant="outline">{ticket.type_name}</Badge>
                    </div>
                  </div>
                )}

                {ticket.team_name && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Team</Label>
                    <div className="mt-1 text-sm">{ticket.team_name}</div>
                  </div>
                )}

                <div>
                  <Label className="text-xs text-muted-foreground">Assigned To</Label>
                  <div className="mt-1 text-sm">{ticket.assigned_user_name || 'Unassigned'}</div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Calendar className="w-3 h-3" />
                    Created
                  </div>
                  <div className="text-sm">
                    {new Date(ticket.created_at).toLocaleString()}
                  </div>
                </div>

                {ticket.first_response_at && (
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Clock className="w-3 h-3" />
                      First Response
                    </div>
                    <div className="text-sm">
                      {formatDistanceToNow(new Date(ticket.first_response_at), { addSuffix: true })}
                    </div>
                  </div>
                )}

                {ticket.resolved_at && (
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Resolved
                    </div>
                    <div className="text-sm">
                      {formatDistanceToNow(new Date(ticket.resolved_at), { addSuffix: true })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Requester Info */}
            <Card>
              <CardHeader>
                <CardTitle>Requester</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ticket.requester_name && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{ticket.requester_name}</span>
                  </div>
                )}
                {ticket.requester_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{ticket.requester_email}</span>
                  </div>
                )}
                {ticket.requester_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{ticket.requester_phone}</span>
                  </div>
                )}
                {!ticket.requester_name && !ticket.requester_email && !ticket.requester_phone && (
                  <p className="text-sm text-muted-foreground">No requester information</p>
                )}
              </CardContent>
            </Card>

            {/* CSAT */}
            {ticket.csat_score && (
              <Card>
                <CardHeader>
                  <CardTitle>Customer Satisfaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${star <= ticket.csat_score! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-semibold">{ticket.csat_score}/5</span>
                  </div>
                  {ticket.csat_comment && (
                    <p className="text-sm text-muted-foreground italic">&quot;{ticket.csat_comment}&quot;</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TicketDetail;
