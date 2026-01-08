import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import ticketsApi, { Ticket, TicketMessage } from '@/services/ticketsApi';
import {
  Ticket as TicketIcon,
  Plus,
  Send,
  AlertCircle,
  Clock,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// This would normally come from authentication context
const CUSTOMER_EMAIL = 'customer@example.com';

const CustomerPortal: React.FC = () => {
  const { ticketNumber } = useParams<{ ticketNumber?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState('');

  const [newTicketForm, setNewTicketForm] = useState({
    subject: '',
    description: '',
    priority: 'normal',
  });

  // Fetch customer's tickets
  const { data: tickets } = useQuery({
    queryKey: ['customer-tickets', CUSTOMER_EMAIL],
    queryFn: () => ticketsApi.list({ requester_email: CUSTOMER_EMAIL }),
    enabled: !ticketNumber,
  });

  // Fetch single ticket
  const { data: ticket } = useQuery({
    queryKey: ['customer-ticket', ticketNumber],
    queryFn: () => {
      if (!ticketNumber) return Promise.resolve(null);
      return ticketsApi.getByNumber(ticketNumber);
    },
    enabled: !!ticketNumber,
  });

  // Create ticket mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => ticketsApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customer-tickets'] });
      toast({ title: 'Ticket created', description: `Ticket ${data.ticket_number} has been created` });
      setIsCreateDialogOpen(false);
      setNewTicketForm({ subject: '', description: '', priority: 'normal' });
      if (data.ticket_number) {
        navigate(`/portal/tickets/${data.ticket_number}`);
      }
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create ticket', variant: 'destructive' });
    },
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: ({ ticketId, body }: { ticketId: number; body: string }) =>
      ticketsApi.addMessage(ticketId, { body, is_internal: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-ticket', ticketNumber] });
      toast({ title: 'Reply sent' });
      setReplyText('');
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to send reply', variant: 'destructive' });
    },
  });

  const handleCreateTicket = () => {
    if (!newTicketForm.subject.trim() || !newTicketForm.description.trim()) {
      toast({ title: 'Error', description: 'Subject and description are required', variant: 'destructive' });
      return;
    }

    createMutation.mutate({
      subject: newTicketForm.subject,
      description: newTicketForm.description,
      priority: newTicketForm.priority,
      requester_email: CUSTOMER_EMAIL,
      channel: 'form',
    });
  };

  const handleReply = () => {
    if (!replyText.trim() || !ticket) {
      toast({ title: 'Error', description: 'Please enter a message', variant: 'destructive' });
      return;
    }

    replyMutation.mutate({ ticketId: ticket.id, body: replyText });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'normal': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'closed': return <CheckCircle2 className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  // Single ticket view
  if (ticketNumber && ticket) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" onClick={() => navigate('/portal/tickets')}>
              ← Back to My Tickets
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-muted-foreground">Ticket #{ticket.ticket_number}</span>
                    <Badge variant={getPriorityColor(ticket.priority)} className="capitalize">
                      {ticket.priority}
                    </Badge>
                    <Badge variant="outline" className="capitalize flex items-center gap-1">
                      {getStatusIcon(ticket.status)}
                      {ticket.stage_name || ticket.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
                  <CardDescription>
                    Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Conversation Thread */}
              <div className="space-y-4 mb-6">
                {ticket.messages?.filter(m => !m.is_internal).map((message: TicketMessage, index: number) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg ${message.sender_type === 'customer'
                        ? 'bg-blue-50 ml-8'
                        : 'bg-muted mr-8'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm">
                        {message.sender_type === 'customer' ? 'You' : message.sender_name || 'Support Agent'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              {ticket.status !== 'closed' && (
                <div className="border-t pt-6">
                  <Label htmlFor="reply">Add a Reply</Label>
                  <Textarea
                    id="reply"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your message..."
                    rows={4}
                    className="mt-2"
                  />
                  <Button
                    onClick={handleReply}
                    disabled={replyMutation.isPending}
                    className="mt-3 gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
                  </Button>
                </div>
              )}

              {ticket.status === 'closed' && (
                <div className="border-t pt-6">
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="font-semibold">This ticket has been closed</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      If you need further assistance, please create a new ticket
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Tickets list view
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Support Tickets</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track and manage your support requests
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Support Ticket</DialogTitle>
                  <DialogDescription>
                    Describe your issue and we'll get back to you as soon as possible
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={newTicketForm.subject}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                      placeholder="Brief summary of your issue"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={newTicketForm.description}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, description: e.target.value })}
                      placeholder="Provide details about your issue..."
                      rows={6}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <select
                      id="priority"
                      value={newTicketForm.priority}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, priority: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTicket} disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create Ticket'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 gap-4">
          {tickets && tickets.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <TicketIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">You don't have any support tickets yet</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Ticket
                </Button>
              </CardContent>
            </Card>
          ) : (
            tickets?.map((ticket: Ticket) => (
              <Card
                key={ticket.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/portal/tickets/${ticket.ticket_number}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-muted-foreground">#{ticket.ticket_number}</span>
                        <Badge variant={getPriorityColor(ticket.priority)} className="capitalize">
                          {ticket.priority}
                        </Badge>
                        <Badge variant="outline" className="capitalize flex items-center gap-1">
                          {getStatusIcon(ticket.status)}
                          {ticket.stage_name || ticket.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                      <CardDescription>
                        Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {ticket.message_count || 0} messages
                    </span>
                    {ticket.assigned_to_name && (
                      <span>Assigned to: {ticket.assigned_to_name}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerPortal;
