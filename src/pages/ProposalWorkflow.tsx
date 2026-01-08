import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
  CheckCircle,
  XCircle,
  Clock,
  Users,
  FileText as FileTextIcon,
  Eye,
  Send,
  MoreHorizontal,
  Plus,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { proposalApi, type Proposal, type WorkflowApproval } from '@/lib/api';

interface ApprovalQueueItem extends Proposal {
  approval_status: 'pending' | 'approved' | 'rejected';
  approvers: string[];
  current_approver: string;
  approval_history: WorkflowApproval[];
}

const ProposalWorkflow: React.FC = () => {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<ApprovalQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProposal, setSelectedProposal] = useState<ApprovalQueueItem | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalReason, setApprovalReason] = useState('');
  const [workflowSettings, setWorkflowSettings] = useState({
    enabled: false,
    required_approvers: 1,
    approvers: [],
    auto_send: true,
  });

  useEffect(() => {
    loadWorkflowData();
  }, []);

  const loadWorkflowData = async () => {
    try {
      setLoading(true);
      const [proposalsResponse, settingsResponse] = await Promise.all([
        proposalApi.getProposals({ status: 'pending_approval' }),
        proposalApi.getWorkflowSettings(),
      ]);

      setProposals((proposalsResponse.items || []) as ApprovalQueueItem[]);
      setWorkflowSettings(settingsResponse);
    } catch (error) {
      console.error('Failed to load workflow data:', error);
      toast.error('Failed to load workflow data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async () => {
    if (!selectedProposal) return;

    try {
      if (approvalAction === 'approve') {
        await proposalApi.approveProposal(selectedProposal.id, {
          reason: approvalReason || undefined,
        });
        toast.success('Proposal approved successfully');
      } else {
        await proposalApi.rejectProposal(selectedProposal.id, {
          reason: approvalReason,
        });
        toast.success('Proposal rejected');
      }

      setApprovalDialogOpen(false);
      setApprovalReason('');
      loadWorkflowData();
    } catch (error) {
      console.error('Failed to process approval:', error);
      toast.error('Failed to process approval');
    }
  };

  const handleSendForApproval = async (proposalId: string) => {
    try {
      await proposalApi.sendForApproval(proposalId);
      toast.success('Proposal sent for approval');
      loadWorkflowData();
    } catch (error) {
      console.error('Failed to send for approval:', error);
      toast.error('Failed to send for approval');
    }
  };

  const handleEnableWorkflow = async () => {
    try {
      await proposalApi.updateWorkflowSettings({
        ...workflowSettings,
        enabled: !workflowSettings.enabled,
      });
      toast.success(`Workflow ${workflowSettings.enabled ? 'disabled' : 'enabled'} successfully`);
      setWorkflowSettings(prev => ({ ...prev, enabled: !prev.enabled }));
    } catch (error) {
      console.error('Failed to update workflow settings:', error);
      toast.error('Failed to update workflow settings');
    }
  };

  const filteredProposals = proposals.filter(proposal =>
    (proposal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.client_name?.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (statusFilter === 'all' || proposal.approval_status === statusFilter)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proposal Workflow</h1>
          <p className="text-muted-foreground">Manage proposal approval process</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={workflowSettings.enabled ? 'destructive' : 'default'}
            onClick={handleEnableWorkflow}
          >
            {workflowSettings.enabled ? 'Disable' : 'Enable'} Workflow
          </Button>
        </div>
      </div>

      {/* Workflow Status */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Settings</CardTitle>
          <CardDescription>
            Current workflow configuration and approval process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold">Status</div>
                <div className={`text-sm ${workflowSettings.enabled ? 'text-green-600' : 'text-gray-600'}`}>
                  {workflowSettings.enabled ? 'Active' : 'Disabled'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold">Required Approvers</div>
                <div className="text-sm text-gray-600">{workflowSettings.required_approvers}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <Send className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-semibold">Auto Send</div>
                <div className="text-sm text-gray-600">
                  {workflowSettings.auto_send ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search proposals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Approval Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Queue</CardTitle>
          <CardDescription>
            Proposals awaiting approval or with approval history
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
                  <TableHead>Current Approver</TableHead>
                  <TableHead>Approvers</TableHead>
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
                            Created {new Date(proposal.created_at).toLocaleDateString()}
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
                        ${proposal.total_amount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(proposal.approval_status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(proposal.approval_status)}
                          {proposal.approval_status.charAt(0).toUpperCase() + proposal.approval_status.slice(1)}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{proposal.current_approver}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {proposal.approvers.join(', ')}
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
                          {proposal.approval_status === 'pending' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedProposal(proposal);
                                  setApprovalAction('approve');
                                  setApprovalDialogOpen(true);
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedProposal(proposal);
                                  setApprovalAction('reject');
                                  setApprovalDialogOpen(true);
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleSendForApproval(proposal.id)}>
                            <Send className="h-4 w-4 mr-2" />
                            Send for Approval
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

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Approve Proposal' : 'Reject Proposal'}
            </DialogTitle>
            <DialogDescription>
              {selectedProposal && (
                <>
                  Proposal: <strong>{selectedProposal.name}</strong>
                  <br />
                  Client: <strong>{selectedProposal.client_name}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reason">
                {approvalAction === 'approve' ? 'Approval' : 'Rejection'} Reason (Optional)
              </Label>
              <Input
                id="reason"
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                placeholder={`Enter ${approvalAction === 'approve' ? 'approval' : 'rejection'} reason...`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={approvalAction === 'approve' ? 'default' : 'destructive'}
              onClick={handleApprovalAction}
            >
              {approvalAction === 'approve' ? 'Approve' : 'Reject'} Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProposalWorkflow;