import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

import { Breadcrumb } from '@/components/Breadcrumb';
import {
  Plus,
  Zap,
  Play,
  Pause,
  Filter,
  Mail,
  Clock,
  Users,
  BookOpen,
  Copy,
  Edit,
  Trash2,
  Search,
  MoreHorizontal,
  Calendar,
  Archive,
  CheckSquare,
  Square
} from 'lucide-react';
import { api, SequenceStep, Sequence, Campaign } from '@/lib/api';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Sequences = () => {
  const navigate = useNavigate();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [selectedSequenceForTemplate, setSelectedSequenceForTemplate] = useState<string>('');
  const [selectedSequences, setSelectedSequences] = useState<string[]>([]);

  const loadSequences = async () => {
    try {
      const items = await api.getSequences();
      setSequences(items);
    } catch (error) {
      console.error('Failed to load sequences:', error);
      toast.error('Failed to load sequences. Please try again.');
    }
  };

  const loadCampaigns = async () => {
    try {
      const items = await api.getCampaigns();
      setCampaigns(items);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    }
  };

  useEffect(() => {
    loadSequences();
    loadCampaigns();
  }, []);

  // Filter sequences by selected campaign and search query
  const getFilteredSequences = () => {
    let filtered = selectedCampaign === 'all'
      ? sequences
      : sequences.filter(seq => seq.campaignId === selectedCampaign);

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(seq =>
        seq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (seq.campaignName && seq.campaignName.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter out archived and trashed items
    filtered = filtered.filter(seq => seq.status !== 'archived' && seq.status !== 'trashed');

    return filtered;
  };

  const handleMoveToTrash = async (id: string, name: string) => {
    try {
      await api.updateSequence(id, { status: 'trashed' });
      setSequences(prev => prev.filter(s => s.id !== id));
      toast.success('Sequence moved to trash.');
    } catch (error) {
      console.error('Failed to move sequence to trash:', error);
      toast.error('Failed to move sequence to trash. Please try again.');
    }
  };

  const handleArchiveSequence = async (id: string) => {
    try {
      await api.updateSequence(id, { status: 'archived' });
      setSequences(prev => prev.filter(s => s.id !== id));
      toast.success('Sequence archived successfully.');
    } catch (error) {
      console.error('Failed to archive sequence:', error);
      toast.error('Failed to archive sequence. Please try again.');
    }
  };

  const handleToggleStatus = async (sequence: Sequence) => {
    try {
      const nextStatus = sequence.status === 'active' ? 'inactive' : 'active';
      const updated = await api.updateSequence(sequence.id, { status: nextStatus });
      setSequences(prev => prev.map(s => (s.id === sequence.id ? { ...s, ...updated } : s)));
      toast.success(`Sequence ${nextStatus === 'active' ? 'activated' : 'deactivated'} successfully.`);
    } catch (error) {
      console.error('Failed to update sequence status:', error);
      toast.error('Failed to update sequence status. Please try again.');
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateName.trim() || !selectedSequenceForTemplate) {
      toast.error('Please provide a template name and select a sequence');
      return;
    }

    setIsLoading(true);
    try {
      // Fetch the sequence with its steps
      const sequenceData = await api.getSequence(selectedSequenceForTemplate);

      // Create template content from sequence steps
      let templateContent = '';
      if (sequenceData.steps && sequenceData.steps.length > 0) {
        templateContent = sequenceData.steps
          .sort((a: SequenceStep, b: SequenceStep) => a.order - b.order)
          .map((step: SequenceStep, index: number) =>
            `<h3>Step ${index + 1} (Day ${step.delay_days})</h3>
<h4>Subject: ${step.subject}</h4>
<div>${step.content}</div>
${index < sequenceData.steps.length - 1 ? '<hr>' : ''}`
          ).join('\n\n');
      } else {
        templateContent = `<p>Template created from sequence: ${sequenceData.name}</p>`;
      }

      const templatePayload = {
        name: templateName,
        subject: `Template from ${sequenceData.name}`,
        htmlContent: templateContent,
        isSequence: true,
        sequenceId: selectedSequenceForTemplate
      };
      console.log('Creating template with payload:', templatePayload);

      // Create the template
      const result = await api.createTemplate(templatePayload);
      console.log('Template created successfully:', result);

      toast.success('Template created successfully!');
      setShowTemplateDialog(false);
      setTemplateName('');
      setTemplateDescription('');
      setSelectedSequenceForTemplate('');
    } catch (error) {
      console.error('Failed to create template:', error);
      toast.error(`Failed to create template: ${error.message || 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: Sequence['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-50">Inactive</Badge>;
      case 'draft':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">Draft</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `Over ${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
  };

  // Bulk action handlers
  const handleSelectAll = () => {
    const filtered = getFilteredSequences();
    if (selectedSequences.length === filtered.length) {
      setSelectedSequences([]);
    } else {
      setSelectedSequences(filtered.map(seq => seq.id));
    }
  };

  const handleSelectSequence = (sequenceId: string) => {
    setSelectedSequences(prev =>
      prev.includes(sequenceId)
        ? prev.filter(id => id !== sequenceId)
        : [...prev, sequenceId]
    );
  };

  const handleBulkMoveToTrash = async () => {
    if (selectedSequences.length === 0) return;

    const sequenceNames = sequences
      .filter(seq => selectedSequences.includes(seq.id))
      .map(seq => seq.name)
      .join(', ');

    if (!confirm(`Are you sure you want to move ${selectedSequences.length} sequence(s) to trash: ${sequenceNames}?`)) {
      return;
    }

    try {
      for (const sequenceId of selectedSequences) {
        await api.updateSequence(sequenceId, { status: 'trashed' });
      }
      setSequences(prev => prev.filter(seq => !selectedSequences.includes(seq.id)));
      setSelectedSequences([]);
      toast.success(`${selectedSequences.length} sequence(s) moved to trash.`);
    } catch (error) {
      console.error('Failed to move sequences to trash:', error);
      toast.error('Failed to move some sequences to trash. Please try again.');
    }
  };

  const handleBulkStatusChange = async (newStatus: 'active' | 'inactive') => {
    if (selectedSequences.length === 0) return;

    try {
      for (const sequenceId of selectedSequences) {
        await api.updateSequence(sequenceId, { status: newStatus });
      }
      setSequences(prev => prev.map(seq =>
        selectedSequences.includes(seq.id)
          ? { ...seq, status: newStatus }
          : seq
      ));
      setSelectedSequences([]);
      toast.success(`${selectedSequences.length} sequence(s) ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully.`);
    } catch (error) {
      console.error('Failed to update sequence status:', error);
      toast.error('Failed to update sequence status. Please try again.');
    }
  };

  const handleBulkDuplicate = async () => {
    if (selectedSequences.length === 0) return;

    try {
      for (const sequenceId of selectedSequences) {
        const originalSequence = await api.getSequence(sequenceId);
        const duplicatedSequence = await api.createSequence({
          name: `${originalSequence.name} (Copy)`,
          status: 'draft'
        });

        // Copy steps if they exist
        if (originalSequence.steps && originalSequence.steps.length > 0) {
          for (const step of originalSequence.steps) {
            await api.createSequenceStep(duplicatedSequence.id, {
              subject: step.subject,
              content: step.content,
              delay_days: step.delay_days,
              order: step.order
            });
          }
        }
      }
      await loadSequences();
      setSelectedSequences([]);
      toast.success(`${selectedSequences.length} sequence(s) duplicated successfully.`);
    } catch (error) {
      console.error('Failed to duplicate sequences:', error);
      toast.error('Failed to duplicate sequences. Please try again.');
    }
  };

  const handleBulkArchive = async () => {
    if (selectedSequences.length === 0) return;

    try {
      for (const sequenceId of selectedSequences) {
        await api.updateSequence(sequenceId, { status: 'archived' });
      }
      setSequences(prev => prev.filter(seq => !selectedSequences.includes(seq.id)));
      setSelectedSequences([]);
      toast.success(`${selectedSequences.length} sequence(s) archived successfully.`);
    } catch (error) {
      console.error('Failed to archive sequences:', error);
      toast.error('Failed to archive sequences. Please try again.');
    }
  };

  const filteredSequences = getFilteredSequences();

  return (
    <>

      <div className="space-y-4">
        <Breadcrumb
          items={[
            { label: 'Email Outreach', href: '/email', icon: <Zap className="h-4 w-4" /> },
            { label: 'Sequences' }
          ]}
          className=""
        />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-[18px] font-bold tracking-tight">Email Sequences</h1>
            <p className="text-muted-foreground">
              Manage automated email sequences across all campaigns
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              className="shadow-lg"
              onClick={() => navigate('/reach/outbound/email/sequences/new')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Sequence
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowTemplateDialog(true)}
              disabled={sequences.length === 0}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
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
          </div>

          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search sequences..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-[300px]"
            />
          </div>
        </div>

        {filteredSequences.length === 0 ? (
          <Card className="border-analytics">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Zap className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {selectedCampaign === 'all' && !searchQuery ? 'No sequences yet' : 'No sequences found'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {selectedCampaign === 'all' && !searchQuery
                  ? 'Create automated email sequences to nurture your leads'
                  : 'Try adjusting your filters or create more sequences'
                }
              </p>
              <Button onClick={() => navigate('/reach/outbound/email/sequences/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create {selectedCampaign === 'all' ? 'First' : ''} Sequence
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Bulk Actions Bar */}
            {selectedSequences.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedSequences.length} sequence{selectedSequences.length > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkStatusChange('active')}
                      className="text-green-700 border-green-300 hover:bg-green-50"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Activate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkStatusChange('inactive')}
                      className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkDuplicate}
                      className="text-blue-700 border-blue-300 hover:bg-blue-50"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Duplicate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkArchive}
                      className="text-gray-700 border-gray-300 hover:bg-gray-50"
                    >
                      <Archive className="h-4 w-4 mr-1" />
                      Archive
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkMoveToTrash}
                      className="text-red-700 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Move to Trash
                    </Button>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedSequences([])}
                  className="text-blue-700 hover:bg-blue-100"
                >
                  Clear
                </Button>
              </div>
            )}

            <Card className="border-analytics">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedSequences.length === filteredSequences.length && filteredSequences.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="font-semibold text-gray-600">Name</TableHead>
                    <TableHead className="font-semibold text-gray-600">Campaign</TableHead>
                    <TableHead className="font-semibold text-gray-600">Status</TableHead>
                    <TableHead className="font-semibold text-gray-600">Created</TableHead>
                    <TableHead className="font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSequences.map((sequence) => (
                    <TableRow key={sequence.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Checkbox
                          checked={selectedSequences.includes(sequence.id)}
                          onCheckedChange={() => handleSelectSequence(sequence.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-foreground">{sequence.name}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Zap className="h-3 w-3 mr-1" />
                            Email sequence
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {sequence.campaignName || 'No campaign assigned'}
                        </div>
                      </TableCell>

                      <TableCell>
                        {getStatusBadge(sequence.status)}
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-gray-600 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(sequence.created_at)}
                        </div>
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/sequences/edit/${sequence.id}`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(sequence)}>
                              {sequence.status === 'active' ? (
                                <>
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pause
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleArchiveSequence(sequence.id)}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleMoveToTrash(sequence.id, sequence.name)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Move to Trash
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </>
        )}
      </div>

      {/* Template Creation Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Sequence Template</DialogTitle>
            <DialogDescription>
              Create a reusable template from an existing sequence
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="e.g., Welcome Series Template"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description">Description (Optional)</Label>
              <Textarea
                id="template-description"
                placeholder="Describe what this template is for..."
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source-sequence">Source Sequence</Label>
              <Select value={selectedSequenceForTemplate} onValueChange={setSelectedSequenceForTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a sequence to create template from" />
                </SelectTrigger>
                <SelectContent>
                  {sequences.map((sequence) => (
                    <SelectItem key={sequence.id} value={sequence.id}>
                      {sequence.name} ({sequence.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Template'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Sequences;
