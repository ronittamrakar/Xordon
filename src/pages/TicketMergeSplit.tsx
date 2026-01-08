import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Merge, CheckCircle2, XCircle } from 'lucide-react';

interface Ticket {
  id: number;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  contact_name: string | null;
  contact_email: string | null;
  created_at: string;
}

interface MergeHistory {
  id: number;
  workspace_id: number;
  primary_ticket_id: number;
  merged_ticket_id: number;
  merged_ticket_number: string;
  merged_by_user_id: number;
  merge_reason: string | null;
  merged_at: string;
  primary_ticket_number?: string;
  primary_subject?: string;
}

const TicketMergeSplit: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [primaryTicketId, setPrimaryTicketId] = useState<number | null>(null);
  const [mergeReason, setMergeReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: tickets, isLoading: ticketsLoading } = useQuery<Ticket[]>({
    queryKey: ['tickets-for-merge', searchQuery],
    queryFn: async () => {
      const response = await api.get('/tickets', { params: { search: searchQuery, limit: 50 } }) as any;
      return response.data?.data || response.data || [];
    },
  });

  const { data: mergeHistory, isLoading: historyLoading } = useQuery<MergeHistory[]>({
    queryKey: ['merge-history'],
    queryFn: async () => {
      const response = await api.get('/helpdesk/merge-history') as any;
      return response.data || response || [];
    },
  });

  const mergeMutation = useMutation({
    mutationFn: async (data: { primary_ticket_id: number; merged_ticket_ids: number[]; reason?: string }) => {
      const response = await api.post('/helpdesk/tickets/merge', data) as any;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets-for-merge'] });
      queryClient.invalidateQueries({ queryKey: ['merge-history'] });
      toast({ title: 'Tickets merged successfully' });
      setIsMergeDialogOpen(false);
      setSelectedTickets([]);
      setPrimaryTicketId(null);
      setMergeReason('');
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to merge tickets', variant: 'destructive' });
    },
  });

  const undoMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(`/helpdesk/merge-history/${id}/undo`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets-for-merge'] });
      queryClient.invalidateQueries({ queryKey: ['merge-history'] });
      toast({ title: 'Merge undone' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to undo merge', variant: 'destructive' });
    },
  });

  const handleTicketSelect = (ticketId: number) => {
    setSelectedTickets((prev) => (prev.includes(ticketId) ? prev.filter((id) => id !== ticketId) : [...prev, ticketId]));
  };

  const handleMerge = () => {
    if (selectedTickets.length < 2) {
      toast({ title: 'Error', description: 'Select at least 2 tickets to merge', variant: 'destructive' });
      return;
    }
    if (!primaryTicketId) {
      toast({ title: 'Error', description: 'Select a primary ticket', variant: 'destructive' });
      return;
    }
    if (!selectedTickets.includes(primaryTicketId)) {
      toast({ title: 'Error', description: 'Primary ticket must be one of the selected tickets', variant: 'destructive' });
      return;
    }

    const mergedIds = selectedTickets.filter((id) => id !== primaryTicketId);
    mergeMutation.mutate({ primary_ticket_id: primaryTicketId, merged_ticket_ids: mergedIds, reason: mergeReason });
  };

  const handleUndo = (id: number) => {
    if (confirm('Are you sure you want to undo this merge?')) {
      undoMutation.mutate(id);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'resolved':
      case 'closed':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Helpdesk', href: '/helpdesk' }, { label: 'Merge Tickets' }]} />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Merge & Split Tickets</h1>
              <p className="text-muted-foreground mt-1">Combine duplicate tickets or split multi-issue tickets</p>
            </div>
            <div>
              <Button onClick={() => setIsMergeDialogOpen(true)} disabled={selectedTickets.length < 2}>
                <Merge className="w-4 h-4 mr-2" /> Merge Selected ({selectedTickets.length})
              </Button>
            </div>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Find Tickets</CardTitle>
                <CardDescription>Search and select tickets to merge</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <Input placeholder="Search tickets by number, subject, or contact..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>

                {ticketsLoading ? (
                  <div className="text-center py-6 text-muted-foreground">Loading tickets...</div>
                ) : tickets && tickets.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">No tickets found</div>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Ticket</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tickets?.slice(0, 50).map((ticket) => (
                          <TableRow key={ticket.id}>
                            <TableCell>
                              <Checkbox checked={selectedTickets.includes(ticket.id)} onCheckedChange={() => handleTicketSelect(ticket.id)} />
                            </TableCell>
                            <TableCell className="font-medium">#{ticket.ticket_number}</TableCell>
                            <TableCell>{ticket.subject}</TableCell>
                            <TableCell>{ticket.contact_name && <div><div className="text-sm">{ticket.contact_name}</div><div className="text-xs text-muted-foreground">{ticket.contact_email}</div></div>}</TableCell>
                            <TableCell><Badge variant={getStatusColor(ticket.status)}>{ticket.status}</Badge></TableCell>
                            <TableCell><Badge variant={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge></TableCell>
                            <TableCell className="text-sm text-muted-foreground">{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Merge History</CardTitle>
                <CardDescription>View recent merges and undo if needed</CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="text-center py-6 text-muted-foreground">Loading history...</div>
                ) : mergeHistory && mergeHistory.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">No merge history</div>
                ) : (
                  <div className="space-y-3">
                    {mergeHistory?.map((mh) => (
                      <div key={`${mh.id}-${mh.merged_ticket_id}`} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">Merged #{mh.merged_ticket_number} into #{mh.primary_ticket_number || mh.primary_ticket_id}</div>
                          <div className="text-xs text-muted-foreground">{mh.merge_reason}</div>
                          <div className="text-xs text-muted-foreground">{new Date(mh.merged_at).toLocaleString()}</div>
                        </div>
                        <div>
                          <Button variant="outline" size="sm" onClick={() => handleUndo(mh.id)} disabled={undoMutation.isPending}>
                            <XCircle className="w-4 h-4 mr-2" /> Undo
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Dialog open={isMergeDialogOpen} onOpenChange={setIsMergeDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Merge Tickets</DialogTitle>
                <DialogDescription>Choose the primary ticket and confirm merge</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Select Primary Ticket</Label>
                  <div className="space-y-2">
                    {selectedTickets.map((tid) => {
                      const ticket = tickets?.find((t) => t.id === tid);
                      if (!ticket) return null;
                      return (
                        <div key={tid} className="flex items-center gap-2">
                          <Checkbox checked={primaryTicketId === tid} onCheckedChange={() => setPrimaryTicketId(tid)} />
                          <div>#{ticket.ticket_number} - {ticket.subject}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Merge Reason (optional)</Label>
                  <Textarea value={mergeReason} onChange={(e) => setMergeReason(e.target.value)} rows={3} />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsMergeDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleMerge} disabled={mergeMutation.isPending}>{mergeMutation.isPending ? 'Merging...' : 'Merge Tickets'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
};

export default TicketMergeSplit;
