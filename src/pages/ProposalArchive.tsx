import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Archive,
  Trash2,
  RotateCcw,
  FileText as FileTextIcon,
  Eye,
  Download,
  MoreHorizontal,
  Plus,
  Calendar,
  DollarSign,
  User,
} from 'lucide-react';
import { proposalApi, type Proposal } from '@/lib/api';
import { format } from 'date-fns';

const ProposalArchive: React.FC = () => {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [archiveType, setArchiveType] = useState<'archived' | 'deleted'>('archived');
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  useEffect(() => {
    loadArchiveData();
  }, [archiveType]);

  const loadArchiveData = async () => {
    try {
      setLoading(true);
      const response = await proposalApi.getArchivedProposals({
        type: archiveType,
      });
      setProposals(response.items || []);
    } catch (error) {
      console.error('Failed to load archive data:', error);
      toast.error('Failed to load archive data');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedProposal) return;
    try {
      await proposalApi.restoreProposal(selectedProposal.id);
      toast.success('Proposal restored successfully');
      setRestoreDialogOpen(false);
      setSelectedProposal(null);
      loadArchiveData();
    } catch (error) {
      console.error('Failed to restore proposal:', error);
      toast.error('Failed to restore proposal');
    }
  };

  const handlePermanentDelete = async () => {
    if (!selectedProposal) return;
    try {
      await proposalApi.permanentDeleteProposal(selectedProposal.id);
      toast.success('Proposal permanently deleted');
      setDeleteDialogOpen(false);
      setSelectedProposal(null);
      loadArchiveData();
    } catch (error) {
      console.error('Failed to permanently delete proposal:', error);
      toast.error('Failed to permanently delete proposal');
    }
  };

  const handleArchive = async (proposalId: string) => {
    try {
      await proposalApi.archiveProposal(proposalId);
      toast.success('Proposal archived successfully');
      loadArchiveData();
    } catch (error) {
      console.error('Failed to archive proposal:', error);
      toast.error('Failed to archive proposal');
    }
  };

  const filteredProposals = proposals.filter(proposal =>
    proposal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    proposal.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    proposal.client_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-orange-100 text-orange-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'viewed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proposal Archive</h1>
          <p className="text-muted-foreground">
            {archiveType === 'archived'
              ? 'Manage archived proposals that can be restored'
              : 'Manage deleted proposals (permanent deletion warning)'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={archiveType === 'archived' ? 'default' : 'outline'}
            onClick={() => setArchiveType('archived')}
          >
            <Archive className="h-4 w-4 mr-2" />
            Archived
          </Button>
          <Button
            variant={archiveType === 'deleted' ? 'destructive' : 'outline'}
            onClick={() => setArchiveType('deleted')}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Deleted
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${archiveType} proposals...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Archive Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Archive Summary</CardTitle>
          <CardDescription>
            {archiveType === 'archived'
              ? 'Proposals in archive can be restored to active status'
              : 'Deleted proposals are in trash and can be permanently removed'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Archive className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold">Total {archiveType === 'archived' ? 'Archived' : 'Deleted'}</div>
                <div className="text-sm text-gray-600">{proposals.length} proposals</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-semibold">Total Value</div>
                <div className="text-sm text-gray-600">
                  {formatCurrency(
                    proposals.reduce((sum, p) => sum + (p.status === 'accepted' ? p.total_amount : 0), 0)
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold">Unique Clients</div>
                <div className="text-sm text-gray-600">
                  {new Set(proposals.map(p => p.client_name).filter(Boolean)).size} clients
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Archive Table */}
      <Card>
        <CardHeader>
          <CardTitle>{archiveType === 'archived' ? 'Archived' : 'Deleted'} Proposals</CardTitle>
          <CardDescription>
            {archiveType === 'archived'
              ? 'Proposals that have been archived and can be restored'
              : 'Proposals in trash - proceed with caution'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proposal</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Archived Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProposals.map((proposal) => (
                  <TableRow key={proposal.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <FileTextIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">{proposal.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Created {format(new Date(proposal.created_at), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">{proposal.client_name}</div>
                      <div className="text-sm text-muted-foreground">{proposal.client_email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">
                        {formatCurrency(proposal.total_amount, proposal.currency)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(proposal.status)}>
                        {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(proposal.updated_at), 'MMM d, yyyy')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/proposals/${proposal.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Proposal
                          </DropdownMenuItem>
                          {archiveType === 'archived' ? (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedProposal(proposal);
                                  setRestoreDialogOpen(true);
                                }}
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Restore
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleArchive(proposal.id)}
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedProposal(proposal);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Permanent Delete
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download
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

      {/* Restore Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Proposal</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore "{selectedProposal?.name}"?
              This will move it back to your active proposals list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRestore}>Restore Proposal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Permanent Deletion</DialogTitle>
            <DialogDescription>
              <div className="text-destructive font-semibold mb-2">Warning: This action cannot be undone!</div>
              Are you sure you want to permanently delete "{selectedProposal?.name}"?
              This will remove it from the system entirely.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handlePermanentDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Permanently Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProposalArchive;