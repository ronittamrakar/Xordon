import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Search,
  MoreHorizontal,
  FileText as FileTextIcon,
  Send,
  Eye,
  Copy,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  BarChart3,
  Settings,
  Layout,
  Zap,
  Archive,
  Globe,
  CheckSquare,
  Receipt,
  Briefcase,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { proposalApi, type Proposal, type ProposalStats } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  viewed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  declined: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  expired: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  trashed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

const statusIcons: Record<string, React.ReactNode> = {
  draft: <Clock className="h-3 w-3" />,
  sent: <Send className="h-3 w-3" />,
  viewed: <Eye className="h-3 w-3" />,
  accepted: <CheckCircle className="h-3 w-3" />,
  declined: <XCircle className="h-3 w-3" />,
  expired: <Clock className="h-3 w-3" />,
  trashed: <Trash2 className="h-3 w-3" />,
  archived: <Archive className="h-3 w-3" />,
};

const Proposals: React.FC = () => {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [stats, setStats] = useState<ProposalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [proposalToDelete, setProposalToDelete] = useState<Proposal | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [selectedProposals, setSelectedProposals] = useState<string[]>([]);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'send' | 'duplicate' | 'delete'>('send');

  useEffect(() => {
    loadProposals();
    loadStats();
  }, [activeTab, searchQuery]);

  const loadProposals = async () => {
    try {
      setLoading(true);
      const response = await proposalApi.getProposals({
        status: activeTab === 'all' ? undefined : activeTab,
        search: searchQuery || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      setProposals(
        activeTab === 'all'
          ? (response.items || []).filter(p => p.status !== 'archived' && p.status !== 'trashed')
          : (response.items || [])
      );
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load proposals:', error);
      toast.error('Failed to load proposals');
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await proposalApi.getStats();
      setStats(response);
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats(null);
    }
  };

  const handleDuplicate = async (proposal: Proposal) => {
    try {
      const response = await proposalApi.duplicateProposal(proposal.id);
      toast.success('Proposal duplicated successfully');
      navigate(`/proposals/${response.id}/edit`);
    } catch (error) {
      console.error('Failed to duplicate proposal:', error);
      toast.error('Failed to duplicate proposal');
    }
  };

  const handleBulkAction = async () => {
    if (selectedProposals.length === 0) return;

    try {
      setBulkActionDialogOpen(false);

      if (bulkAction === 'send') {
        const validProposals = proposals.filter(p =>
          selectedProposals.includes(p.id) && p.status === 'draft' && p.client_email
        );

        for (const proposal of validProposals) {
          await proposalApi.sendProposal(proposal.id);
        }

        toast.success(`Sent ${validProposals.length} proposals successfully`);
      } else if (bulkAction === 'duplicate') {
        const duplicatedCount = selectedProposals.length;
        for (const proposalId of selectedProposals) {
          await proposalApi.duplicateProposal(proposalId);
        }
        toast.success(`Duplicated ${duplicatedCount} proposals successfully`);
      } else if (bulkAction === 'delete') {
        for (const proposalId of selectedProposals) {
          await proposalApi.updateProposal(proposalId, { status: 'trashed' });
        }
        toast.success(`Moved ${selectedProposals.length} proposals to trash successfully`);
      }

      setSelectedProposals([]);
      loadProposals();
      loadStats();
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const handleSelectProposal = (proposalId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedProposals(prev => [...prev, proposalId]);
    } else {
      setSelectedProposals(prev => prev.filter(id => id !== proposalId));
    }
  };

  const handleSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedProposals(proposals.map(p => p.id));
    } else {
      setSelectedProposals([]);
    }
  };

  const canSendSelected = selectedProposals.length > 0 &&
    proposals.filter(p => selectedProposals.includes(p.id) && p.status === 'draft' && p.client_email).length > 0;

  const handleSend = async (proposal: Proposal) => {
    if (!proposal.client_email) {
      toast.error('Please add a client email before sending');
      return;
    }
    try {
      await proposalApi.sendProposal(proposal.id);
      toast.success('Proposal sent successfully');
      loadProposals();
      loadStats();
    } catch (error) {
      console.error('Failed to send proposal:', error);
      toast.error('Failed to send proposal');
    }
  };

  const handleDelete = async () => {
    if (!proposalToDelete) return;
    try {
      await proposalApi.updateProposal(proposalToDelete.id, { status: 'trashed' });
      toast.success('Proposal moved to trash');
      setDeleteDialogOpen(false);
      setProposalToDelete(null);
      loadProposals();
      loadStats();
    } catch (error) {
      console.error('Failed to move proposal to trash:', error);
      toast.error('Failed to move proposal to trash');
    }
  };

  const handleArchive = async (proposal: Proposal) => {
    try {
      await proposalApi.updateProposal(proposal.id, { status: 'archived' });
      toast.success('Proposal archived');
      loadProposals();
      loadStats();
    } catch (error) {
      console.error('Failed to archive proposal:', error);
      toast.error('Failed to archive proposal');
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <>
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Proposals' },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-2xl font-bold tracking-tight">Proposals</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Create and manage professional proposals for your clients
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none h-10 sm:h-9" onClick={() => navigate('/proposals/templates')}>
              <Layout className="h-4 w-4 mr-2" />
              Templates
            </Button>
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none h-10 sm:h-9" onClick={() => navigate('/proposals/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button size="sm" className="w-full sm:w-auto h-10 sm:h-9" onClick={() => navigate('/proposals/new')}>
              <Plus className="h-4 w-4 mr-2" />
              New Proposal
            </Button>
          </div>
        </div>

        {/* Module Navigation */}
        <div className="flex flex-wrap items-center gap-2 pb-2 scrollbar-hide overflow-x-auto border-b">
          <Button variant="outline" size="sm" className="bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 h-8" onClick={() => navigate('/proposals')}>
            <FileTextIcon className="h-3.5 w-3.5 mr-2" />
            All Proposals
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8" onClick={() => navigate('/contacts?view=proposals')}>
            <Users className="h-3.5 w-3.5 mr-2" />
            Clients
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8" onClick={() => navigate('/proposals/analytics')}>
            <BarChart3 className="h-3.5 w-3.5 mr-2" />
            Analytics
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8" onClick={() => navigate('/proposals/workflow')}>
            <Zap className="h-3.5 w-3.5 mr-2" />
            Workflow
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8" onClick={() => navigate('/proposals/integrations')}>
            <Globe className="h-3.5 w-3.5 mr-2" />
            Integrations
          </Button>
          <div className="h-4 w-[1px] bg-border mx-1" />
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8" onClick={() => navigate('/proposals/archive')}>
            <Archive className="h-3.5 w-3.5 mr-2" />
            Archive
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-4">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Proposals</CardTitle>
                <FileTextIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
                <p className="text-[12px] sm:text-xs text-muted-foreground">
                  {stats.draft} drafts, {stats.sent} sent
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-4">
                <CardTitle className="text-xs sm:text-sm font-medium">Acceptance Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-xl sm:text-2xl font-bold">{stats.acceptance_rate}%</div>
                <p className="text-[12px] sm:text-xs text-muted-foreground">
                  {stats.accepted} accepted, {stats.declined} declined
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-4">
                <CardTitle className="text-xs sm:text-sm font-medium">Accepted Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-xl sm:text-2xl font-bold truncate">
                  {formatCurrency(stats.total_accepted_value)}
                </div>
                <p className="text-[12px] sm:text-xs text-muted-foreground">
                  From {stats.accepted} proposals
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-4">
                <CardTitle className="text-xs sm:text-sm font-medium">Pending Value</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-xl sm:text-2xl font-bold truncate">
                  {formatCurrency(stats.total_pending_value)}
                </div>
                <p className="text-[12px] sm:text-xs text-muted-foreground">
                  {stats.sent} proposals awaiting response
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
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
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={selectedProposals.length === proposals.length && proposals.length > 0}
              onCheckedChange={(checked) => handleSelectAll(!!checked)}
            />
            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
              Select All
            </label>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedProposals.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-2 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full">
              <span className="text-xs sm:text-sm font-medium">
                {selectedProposals.length} proposal(s) selected
              </span>
              <div className="hidden sm:block h-4 w-[1px] bg-border" />
              <div className="flex flex-wrap gap-1 sm:gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 sm:px-3"
                  disabled={!canSendSelected}
                  onClick={() => {
                    setBulkAction('send');
                    setBulkActionDialogOpen(true);
                  }}
                >
                  <Send className="h-3.5 w-3.5 mr-1.5 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Send</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 sm:px-3"
                  onClick={() => {
                    setBulkAction('duplicate');
                    setBulkActionDialogOpen(true);
                  }}
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Duplicate</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 sm:px-3 text-destructive hover:text-destructive"
                  onClick={() => {
                    setBulkAction('delete');
                    setBulkActionDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Delete</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 sm:px-3"
                  onClick={async () => {
                    for (const proposalId of selectedProposals) {
                      await proposalApi.updateProposal(proposalId, { status: 'archived' });
                    }
                    toast.success(`Archived ${selectedProposals.length} proposals`);
                    setSelectedProposals([]);
                    loadProposals();
                  }}
                >
                  <Archive className="h-3.5 w-3.5 mr-1.5 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Archive</span>
                </Button>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-full sm:w-auto text-xs sm:text-sm" onClick={() => setSelectedProposals([])}>
              Clear
            </Button>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="viewed">Viewed</TabsTrigger>
            <TabsTrigger value="accepted">Accepted</TabsTrigger>
            <TabsTrigger value="declined">Declined</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : proposals.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileTextIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No proposals found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchQuery
                      ? 'Try adjusting your search terms'
                      : 'Create your first proposal to get started'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => navigate('/proposals/new')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Proposal
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <Card
                    key={proposal.id}
                    className={`hover:shadow-md transition-shadow cursor-pointer ${selectedProposals.includes(proposal.id) ? 'ring-2 ring-primary bg-primary/5' : ''}`}
                    onClick={() => navigate(`/proposals/${proposal.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div onClick={(e) => e.stopPropagation()} className="pt-1">
                          <Checkbox
                            checked={selectedProposals.includes(proposal.id)}
                            onCheckedChange={(checked) => handleSelectProposal(proposal.id, !!checked)}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <h3 className="font-semibold truncate text-sm sm:text-base">{proposal.name}</h3>
                            <Badge className={`${statusColors[proposal.status]} w-fit text-[12px] h-5 py-0`}>
                              <span className="flex items-center gap-1">
                                {statusIcons[proposal.status]}
                                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                              </span>
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] sm:text-sm text-muted-foreground">
                            {proposal.client_name && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {proposal.client_name}
                                {proposal.client_company && (
                                  <span className="hidden sm:inline"> - {proposal.client_company}</span>
                                )}
                              </span>
                            )}
                            <span className="flex items-center gap-1 font-medium text-foreground sm:text-muted-foreground sm:font-normal">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(proposal.total_amount, proposal.currency)}
                            </span>
                            <span className="hidden xs:inline">
                              Created {format(new Date(proposal.created_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                          {proposal.template_name && (
                            <p className="text-[12px] sm:text-xs text-muted-foreground mt-1 truncate">
                              Template: {proposal.template_name}
                            </p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/proposals/${proposal.id}`);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/proposals/${proposal.id}/edit`);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {proposal.status === 'draft' && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSend(proposal);
                                }}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Send
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicate(proposal);
                              }}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArchive(proposal);
                              }}
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            {proposal.status === 'accepted' && (
                              <>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/finance/invoices', {
                                      state: {
                                        create: true,
                                        contactData: {
                                          email: proposal.client_email,
                                          firstName: proposal.client_name?.split(' ')[0],
                                          lastName: proposal.client_name?.split(' ').slice(1).join(' '),
                                        },
                                        lineItems: proposal.items?.map(item => ({
                                          description: item.name + (item.description ? ` - ${item.description}` : ''),
                                          quantity: item.quantity,
                                          unit_price: item.unit_price,
                                          tax_rate: item.tax_percent
                                        })),
                                        notes: `Invoice created from proposal: ${proposal.name}`,
                                        terms: 'Payment due on receipt'
                                      }
                                    });
                                  }}
                                >
                                  <Receipt className="h-4 w-4 mr-2" />
                                  Create Invoice
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/projects/new', {
                                      state: {
                                        title: `[Proposal: ${proposal.name}] Project`,
                                        description: `Project created from accepted proposal: ${proposal.name}. \n\nItems:\n${proposal.items?.map(i => `- ${i.name} (x${i.quantity})`).join('\n')}`,
                                        contactId: (proposal as any).contact_id || proposal.client_email
                                      }
                                    });
                                  }}
                                >
                                  <Briefcase className="h-4 w-4 mr-2" />
                                  Create Project
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setProposalToDelete(proposal);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Move to Trash
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.pages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            >
              Next
            </Button>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Move to Trash</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to move "{proposalToDelete?.name}" to trash? You can restore it later from the trash page.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Move to Trash
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Action Confirmation Dialog */}
        <AlertDialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {bulkAction === 'send' && 'Send Selected Proposals'}
                {bulkAction === 'duplicate' && 'Duplicate Selected Proposals'}
                {bulkAction === 'delete' && 'Move Selected Proposals to Trash'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {bulkAction === 'send' && `Are you sure you want to send ${selectedProposals.length} proposals to their respective clients? Only draft proposals with an email address will be sent.`}
                {bulkAction === 'duplicate' && `Are you sure you want to duplicate ${selectedProposals.length} proposals?`}
                {bulkAction === 'delete' && `Are you sure you want to move ${selectedProposals.length} proposals to trash? You can restore them later from the trash page.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkAction}
                className={bulkAction === 'delete' ? 'bg-destructive text-destructive-foreground' : ''}
              >
                {bulkAction === 'send' && 'Send'}
                {bulkAction === 'duplicate' && 'Duplicate'}
                {bulkAction === 'delete' && 'Move to Trash'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default Proposals;
