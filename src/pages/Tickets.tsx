import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useToast } from '@/hooks/use-toast';
import ticketsApi, { Ticket, TicketStats } from '@/services/ticketsApi';
import { BulkActions } from '@/components/helpdesk/BulkActions';
import { SavedFilters } from '@/components/helpdesk/SavedFilters';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  MessageCircle,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Globe,
  Tag,
  Calendar,
  TrendingUp,
  Users,
  BarChart3,
} from 'lucide-react';

const Tickets: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const location = useLocation();

  // Auto-open create dialog if path is /new
  useEffect(() => {
    if (location.pathname.endsWith('/new')) {
      setIsCreateDialogOpen(true);
    }
  }, [location.pathname]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [priorityFilter, setPriorityFilter] = useState<string>(searchParams.get('priority') || 'all');
  const [assignedFilter, setAssignedFilter] = useState<string>(searchParams.get('assigned_to') || 'all');
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [page, setPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Handle pre-fill from location state
  useEffect(() => {
    const state = location.state as {
      title?: string;
      description?: string;
      requester_name?: string;
      requester_email?: string;
      initial_message?: string;
    } | null;

    if (state) {
      setNewTicket(prev => ({
        ...prev,
        title: state.title || prev.title,
        description: state.description || prev.description,
        requester_name: state.requester_name || prev.requester_name,
        requester_email: state.requester_email || prev.requester_email,
        initial_message: state.initial_message || prev.initial_message,
      }));
      setIsCreateDialogOpen(true);
      // Clear state to avoid re-opening on refresh
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, navigate, location.pathname]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update URL params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (statusFilter !== 'all') params.status = statusFilter;
    if (priorityFilter !== 'all') params.priority = priorityFilter;
    if (assignedFilter !== 'all') params.assigned_to = assignedFilter;
    if (debouncedSearch) params.search = debouncedSearch;
    setSearchParams(params);
  }, [statusFilter, priorityFilter, assignedFilter, debouncedSearch, setSearchParams]);

  // Fetch tickets
  const { data: ticketsData, isLoading: isLoadingTickets, isError } = useQuery({
    queryKey: ['tickets', statusFilter, priorityFilter, assignedFilter, debouncedSearch, page],
    queryFn: () => ticketsApi.list({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      priority: priorityFilter !== 'all' ? priorityFilter : undefined,
      assigned_to: assignedFilter !== 'all' ? assignedFilter : undefined,
      search: debouncedSearch || undefined,
      page,
      limit: 20,
    }),
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['ticket-stats'],
    queryFn: () => ticketsApi.stats(),
  });

  // Fetch metadata
  const { data: stages } = useQuery({
    queryKey: ['ticket-stages'],
    queryFn: () => ticketsApi.listStages(),
  });

  const { data: types } = useQuery({
    queryKey: ['ticket-types'],
    queryFn: () => ticketsApi.listTypes(),
  });

  const { data: teams } = useQuery({
    queryKey: ['ticket-teams'],
    queryFn: () => ticketsApi.listTeams(),
  });

  // Safe checks for data structure
  const tickets = Array.isArray(ticketsData) ? ticketsData : (ticketsData as any)?.data || [];
  const meta = (ticketsData as any)?.meta;

  // Selection state for bulk actions
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);

  const handleTicketSelect = (ticketId: number) => {
    setSelectedTickets((prev) => (prev.includes(ticketId) ? prev.filter((id) => id !== ticketId) : [...prev, ticketId]));
  };

  const clearSelection = () => setSelectedTickets([]);

  // Create ticket mutation
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    ticket_type_id: '',
    requester_email: '',
    requester_name: '',
    initial_message: '',
  });

  const createTicketMutation = useMutation({
    mutationFn: (data: typeof newTicket) => {
      return ticketsApi.create({
        ...data,
        ticket_type_id: data.ticket_type_id ? parseInt(data.ticket_type_id) : undefined
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
      toast({ title: 'Ticket created', description: `Ticket ${result.ticket_number} has been created.` });
      setIsCreateDialogOpen(false);
      navigate(`/helpdesk/tickets/${result.id}`);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create ticket', variant: 'destructive' });
    },
  });

  const handleCreateTicket = () => {
    if (!newTicket.title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }
    createTicketMutation.mutate(newTicket);
  };

  // Priority badge
  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { variant: any; className: string }> = {
      urgent: { variant: 'destructive', className: '' },
      high: { variant: 'default', className: 'bg-orange-500 hover:bg-orange-600' },
      medium: { variant: 'secondary', className: '' },
      low: { variant: 'outline', className: '' },
    };
    const config = variants[priority] || variants.medium;
    return <Badge variant={config.variant} className={config.className}>{priority}</Badge>;
  };

  // Status badge
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

  // Source icon
  const getSourceIcon = (source: string) => {
    const icons: Record<string, any> = {
      email: Mail,
      webchat: MessageCircle,
      phone: Phone,
      form: Globe,
      sms: MessageCircle,
      whatsapp: MessageCircle,
    };
    const Icon = icons[source] || Mail;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Helpdesk', href: '/helpdesk' },
          { label: 'Tickets' },
        ]}
      />

      <div className="mx-auto max-w-7xl py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tickets</h1>
            <p className="text-muted-foreground mt-1">Manage and track customer support tickets</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create New Ticket</DialogTitle>
                <DialogDescription>Create a support ticket for a customer inquiry or issue.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={newTicket.title}
                    onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                    placeholder="Brief description of the issue"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    placeholder="Detailed description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="requester_name">Requester Name</Label>
                    <Input
                      id="requester_name"
                      value={newTicket.requester_name}
                      onChange={(e) => setNewTicket({ ...newTicket, requester_name: e.target.value })}
                      placeholder="Customer name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="requester_email">Requester Email</Label>
                    <Input
                      id="requester_email"
                      type="email"
                      value={newTicket.requester_email}
                      onChange={(e) => setNewTicket({ ...newTicket, requester_email: e.target.value })}
                      placeholder="customer@example.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newTicket.priority}
                      onValueChange={(v: any) => setNewTicket({ ...newTicket, priority: v })}
                    >
                      <SelectTrigger id="priority">
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
                  <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={newTicket.ticket_type_id}
                      onValueChange={(v) => setNewTicket({ ...newTicket, ticket_type_id: v })}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {types?.map((type) => (
                          <SelectItem key={type.id} value={String(type.id)}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="initial_message">Initial Message</Label>
                  <Textarea
                    id="initial_message"
                    value={newTicket.initial_message}
                    onChange={(e) => setNewTicket({ ...newTicket, initial_message: e.target.value })}
                    placeholder="First response to the customer"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTicket} disabled={createTicketMutation.isPending}>
                  {createTicketMutation.isPending ? 'Creating...' : 'Create Ticket'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.open}</div>
                <p className="text-xs text-muted-foreground">Active support requests</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned to Me</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.assigned_to_me}</div>
                <p className="text-xs text-muted-foreground">Your active tickets</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avg_resolution_hours}h</div>
                <p className="text-xs text-muted-foreground">Average time to resolve</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CSAT Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avg_csat.toFixed(1)}/5</div>
                <p className="text-xs text-muted-foreground">Customer satisfaction</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative flex items-center gap-2 w-full">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 flex-1"
                  />
                  <div className="ml-2">
                    <SavedFilters
                      onApplyFilter={(criteria) => {
                        setStatusFilter(criteria.status ?? 'all');
                        setPriorityFilter(Array.isArray(criteria.priority) ? 'all' : (criteria.priority ?? 'all'));
                        setAssignedFilter(criteria.assigned_to ?? 'all');
                        setSearchQuery(criteria.search ?? '');
                      }}
                    />
                  </div>
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tickets</SelectItem>
                  <SelectItem value="me">Assigned to Me</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets</CardTitle>
            <CardDescription>
              {meta && `Showing ${tickets.length} of ${meta.total} tickets`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isError ? (
              <div className="text-center py-8 text-destructive">
                <p>Failed to load tickets. Please check your connection or contact support.</p>
              </div>
            ) : isLoadingTickets ? (
              <div className="text-center py-8 text-muted-foreground">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No tickets found</div>
            ) : (
              <div className="space-y-2">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/helpdesk/tickets/${ticket.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedTickets.includes(ticket.id)}
                        onChange={() => handleTicketSelect(ticket.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {getSourceIcon(ticket.source_channel)}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-muted-foreground">{ticket.ticket_number}</span>
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                        {ticket.sla_response_breached && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="w-3 h-3" />
                            SLA Breach
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground truncate">{ticket.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">{ticket.requester_email || ticket.requester_name || 'No requester'}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-sm text-muted-foreground mb-1">
                        {ticket.assigned_user_name || 'Unassigned'}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {ticket.message_count || 0}
                        </span>
                        <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {meta && meta.pages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <Button

                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {meta.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(meta.pages, p + 1))}
                  disabled={page === meta.pages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <BulkActions selectedTickets={selectedTickets} onClearSelection={clearSelection} />
    </>
  );
};

export default Tickets;
