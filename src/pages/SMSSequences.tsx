import React, { useState, useEffect, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { api, SMSSequence, SMSSequenceStep, Group } from '@/lib/api';
import {
  Zap,
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  Play,
  Pause,
  StopCircle,
  MessageSquare,
  Clock,
  ArrowRight,
  Settings,
  Users,
  MoreHorizontal,
  Filter,
  FolderPlus,
  Folder,
  Calendar,
  Archive
} from 'lucide-react';

const SMSSequences: React.FC = () => {
  const [sequences, setSequences] = useState<SMSSequence[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSequence, setEditingSequence] = useState<SMSSequence | null>(null);
  const { toast } = useToast();

  // Sequence form state
  interface SequenceStepForm {
    id?: string;
    message: string;
    delay_hours: number;
  }

  const [sequenceForm, setSequenceForm] = useState<{
    name: string;
    description: string;
    steps: SequenceStepForm[];
  }>({
    name: '',
    description: '',
    steps: [{ message: '', delay_hours: 0 }]
  });

  // Define functions before useEffect to avoid hoisting issues
  const loadSequences = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getSMSSequences();
      setSequences(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading SMS sequences:', error);
      setSequences([]); // Ensure sequences is always an array
      toast({
        title: 'Error',
        description: 'Failed to load SMS sequences',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadGroups = useCallback(async () => {
    try {
      const groupData = await api.getGroups();
      setGroups(groupData);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast({
        title: 'Error',
        description: 'Failed to load groups',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    loadSequences();
    loadGroups();
  }, [loadSequences, loadGroups]);

  const addStep = () => {
    setSequenceForm(prev => ({
      ...prev,
      steps: [...prev.steps, { message: '', delay_hours: 0 }]
    }));
  };

  const removeStep = (index: number) => {
    if (sequenceForm.steps.length > 1) {
      setSequenceForm(prev => ({
        ...prev,
        steps: prev.steps.filter((_, i) => i !== index)
      }));
    }
  };

  const updateStep = (index: number, field: string, value: string | number) => {
    setSequenceForm(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) =>
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const createSequence = async () => {
    if (!sequenceForm.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a sequence name.',
      });
      return;
    }

    try {
      const sequenceData = {
        name: sequenceForm.name,
        description: sequenceForm.description,
        steps: sequenceForm.steps.map((step, index) => ({
          message: step.message,
          delay_hours: step.delay_hours,
          step_order: index + 1
        })) as any
      };

      const newSequence = await api.createSMSSequence(sequenceData);
      setSequences(prev => [newSequence, ...prev]);

      // Reset form
      setSequenceForm({
        name: '',
        description: '',
        steps: [{ message: '', delay_hours: 0 }]
      });
      setIsCreateDialogOpen(false);

      toast({
        title: 'Success',
        description: 'SMS sequence created successfully',
      });
    } catch (error) {
      console.error('Error creating sequence:', error);
      toast({
        title: 'Error',
        description: 'Failed to create SMS sequence',
        variant: 'destructive',
      });
    }
  };

  const updateSequence = async () => {
    if (!editingSequence || !sequenceForm.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a sequence name.',
      });
      return;
    }

    try {
      const sequenceData = {
        name: sequenceForm.name,
        description: sequenceForm.description,
        steps: sequenceForm.steps.map((step, index) => ({
          message: step.message,
          delay_hours: step.delay_hours,
          step_order: index + 1
        })) as any
      };

      const updatedSequence = await api.updateSMSSequence(editingSequence.id, sequenceData);
      setSequences(prev => prev.map(s => s.id === editingSequence.id ? updatedSequence : s));

      setIsEditDialogOpen(false);
      setEditingSequence(null);

      toast({
        title: 'Success',
        description: 'SMS sequence updated successfully',
      });
    } catch (error) {
      console.error('Error updating sequence:', error);
      toast({
        title: 'Error',
        description: 'Failed to update SMS sequence',
        variant: 'destructive',
      });
    }
  };

  const handleMoveToTrash = async (sequenceId: string) => {
    try {
      await api.updateSMSSequence(sequenceId, { status: 'trashed' });
      setSequences(prev => prev.filter(s => s.id !== sequenceId));

      toast({
        title: 'Sequence moved to Trash',
        description: 'SMS sequence has been moved to trash',
      });
    } catch (error) {
      console.error('Error moving sequence to trash:', error);
      toast({
        title: 'Error',
        description: 'Failed to move SMS sequence to trash',
        variant: 'destructive',
      });
    }
  };

  const handleArchiveSequence = async (sequenceId: string) => {
    try {
      await api.updateSMSSequence(sequenceId, { status: 'archived' });
      setSequences(prev => prev.filter(s => s.id !== sequenceId));

      toast({
        title: 'Sequence Archived',
        description: 'SMS sequence has been archived',
      });
    } catch (error) {
      console.error('Error archiving sequence:', error);
      toast({
        title: 'Error',
        description: 'Failed to archive SMS sequence',
        variant: 'destructive',
      });
    }
  };

  const duplicateSequence = async (sequence: SMSSequence) => {
    try {
      const duplicatedSequence = await api.duplicateSMSSequence(sequence.id);
      setSequences(prev => [duplicatedSequence, ...prev]);

      toast({
        title: 'Sequence Duplicated',
        description: 'SMS sequence has been duplicated',
      });
    } catch (error) {
      console.error('Error duplicating sequence:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate SMS sequence',
        variant: 'destructive',
      });
    }
  };

  const toggleSequenceStatus = async (sequenceId: string) => {
    try {
      const sequence = sequences.find(s => s.id === sequenceId);
      if (!sequence) return;

      let newStatus;
      if (sequence.status === 'active') {
        newStatus = 'paused';
      } else if (sequence.status === 'paused') {
        newStatus = 'active';
      } else {
        newStatus = 'active';
      }

      const updatedSequence = await api.updateSMSSequence(sequenceId, { status: newStatus });

      setSequences(prev => prev.map(s =>
        s.id === sequenceId ? updatedSequence : s
      ));

      toast({
        title: 'Status Updated',
        description: `SMS sequence has been ${newStatus === 'paused' ? 'paused' : 'activated'}`,
      });
    } catch (error) {
      console.error('Error updating sequence status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update sequence status',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (sequence: SMSSequence) => {
    setEditingSequence(sequence);
    setSequenceForm({
      name: sequence.name,
      description: sequence.description,
      steps: sequence.steps?.map(step => ({
        message: step.message,
        delay_hours: step.delay_hours,
      })) || [{ message: '', delay_hours: 0 }]
    });
    setIsEditDialogOpen(true);
  };

  const getStatusColor = (status: SMSSequence['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'paused': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'inactive': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: SMSSequence['status']) => {
    switch (status) {
      case 'active': return <Play className="h-3 w-3" />;
      case 'paused': return <Pause className="h-3 w-3" />;
      case 'inactive': return <StopCircle className="h-3 w-3" />;
      case 'draft': return <Settings className="h-3 w-3" />;
      default: return <Settings className="h-3 w-3" />;
    }
  };

  const formatDelay = (days: number, hours: number) => {
    if (days === 0 && hours === 0) return 'Immediate';
    if (days === 0) return `${hours}h`;
    if (hours === 0) return `${days}d`;
    return `${days}d ${hours}h`;
  };

  // Add group management state
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedSequences, setSelectedSequences] = useState<string[]>([]);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false);
  const [newGroupParentId, setNewGroupParentId] = useState<string>('none');

  const handleSelectSequence = (sequenceId: string) => {
    setSelectedSequences(prev =>
      prev.includes(sequenceId)
        ? prev.filter(id => id !== sequenceId)
        : [...prev, sequenceId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSequences.length === filteredSequences.length) {
      setSelectedSequences([]);
    } else {
      setSelectedSequences(filteredSequences.map(s => s.id));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedSequences.length === 0) return;

    try {
      switch (action) {
        case 'activate':
          await Promise.all(selectedSequences.map(id => toggleSequenceStatus(id)));
          toast({
            title: 'Success',
            description: `${selectedSequences.length} sequences activated`,
          });
          break;
        case 'pause': {
          const pausedCount = await Promise.all(selectedSequences.map(async (id) => {
            const sequence = sequences.find(s => s.id === id);
            if (sequence && sequence.status === 'active') {
              await toggleSequenceStatus(id);
              return 1;
            }
            return 0;
          })).then(results => results.reduce((sum, count) => sum + count, 0));

          toast({
            title: 'Success',
            description: `${pausedCount} sequences paused`,
          });
          break;
        }
        case 'duplicate':
          await Promise.all(selectedSequences.map(id => {
            const sequence = sequences.find(s => s.id === id);
            if (sequence) return duplicateSequence(sequence);
          }));
          toast({
            title: 'Success',
            description: `${selectedSequences.length} sequences duplicated`,
          });
          break;
        case 'delete': {
          const confirmed = confirm(`Are you sure you want to move ${selectedSequences.length} sequence(s) to trash?`);
          if (confirmed) {
            await Promise.all(selectedSequences.map(id => api.updateSMSSequence(id, { status: 'trashed' })));
            setSequences(prev => prev.filter(s => !selectedSequences.includes(s.id)));
            toast({
              title: 'Success',
              description: `${selectedSequences.length} sequences moved to trash`,
            });
          }
          break;
        }
        case 'archive': {
          await Promise.all(selectedSequences.map(id => api.updateSMSSequence(id, { status: 'archived' })));
          setSequences(prev => prev.filter(s => !selectedSequences.includes(s.id)));
          toast({
            title: 'Success',
            description: `${selectedSequences.length} sequences archived`,
          });
          break;
        }
      }
      setSelectedSequences([]);
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} sequences`,
        variant: 'destructive',
      });
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a group name',
        variant: 'destructive',
      });
      return;
    }

    try {
      const groupData: { name: string; parent_id?: string } = { name: newGroupName.trim() };
      if (newGroupParentId && newGroupParentId !== 'none') {
        groupData.parent_id = newGroupParentId;
      }

      await api.createGroup(groupData);
      toast({
        title: 'Success',
        description: `Group "${newGroupName}" has been created`,
      });
      setNewGroupName('');
      setNewGroupParentId('none');
      setIsCreateGroupDialogOpen(false);
      await loadGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: 'Error',
        description: 'Failed to create group',
        variant: 'destructive',
      });
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      await api.deleteGroup(groupId);
      toast({
        title: 'Success',
        description: 'Group deleted successfully',
      });
      if (selectedGroup === groupId) {
        setSelectedGroup('all');
      }
      await loadGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete group',
        variant: 'destructive',
      });
    }
  };

  const updateGroup = async (groupId: string, name: string) => {
    try {
      await api.updateGroup(groupId, { name });
      toast({
        title: 'Success',
        description: 'Group updated successfully',
      });
      await loadGroups();
    } catch (error) {
      console.error('Error updating group:', error);
      toast({
        title: 'Error',
        description: 'Failed to update group',
        variant: 'destructive',
      });
    }
  };

  // Build hierarchical group tree
  interface GroupWithChildren extends Group {
    children?: GroupWithChildren[];
  }

  const buildGroupTree = (groups: Group[]): GroupWithChildren[] => {
    const groupMap = new Map<string, GroupWithChildren>(groups.map(g => [g.id, { ...g, children: [] }]));
    const rootGroups: GroupWithChildren[] = [];

    groupMap.forEach(group => {
      if (group.parent_id) {
        const parent = groupMap.get(group.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(group);
        }
      } else {
        rootGroups.push(group);
      }
    });

    return rootGroups;
  };

  const renderGroupOptions = (groups: GroupWithChildren[], level: number = 0): JSX.Element[] => {
    return groups.map(group => {
      const prefix = '─'.repeat(level);
      return (
        <React.Fragment key={group.id}>
          <SelectItem value={group.id}>
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              {prefix} {group.name}
            </div>
          </SelectItem>
          {group.children && renderGroupOptions(group.children, level + 1)}
        </React.Fragment>
      );
    });
  };

  const filteredSequences = sequences.filter(sequence => {
    const matchesSearch = sequence.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sequence.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || sequence.status === selectedStatus;
    const matchesGroup = selectedGroup === 'all' || sequence.group_id === selectedGroup;
    const isVisible = sequence.status !== 'archived' && sequence.status !== 'trashed';
    return matchesSearch && matchesStatus && matchesGroup && isVisible;
  });

  return (
    <>
      <div className="flex h-full">
        {/* Sidebar with Groups */}
        <div className="w-64 bg-background border-r border-border p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Groups</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateGroupDialogOpen(true)}
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-1">
            <Button
              variant={selectedGroup === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              className="w-full justify-start"
              onClick={() => setSelectedGroup('all')}
            >
              <Folder className="h-4 w-4 mr-2" />
              All Sequences
            </Button>

            {buildGroupTree(groups).map(group => (
              <div key={group.id} className="space-y-1">
                <Button
                  variant={selectedGroup === group.id ? 'secondary' : 'ghost'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setSelectedGroup(group.id)}
                >
                  <Folder className="h-4 w-4 mr-2" />
                  {group.name}
                </Button>

                {group.children && group.children.map(child => (
                  <Button
                    key={child.id}
                    variant={selectedGroup === child.id ? 'secondary' : 'ghost'}
                    size="sm"
                    className="w-full justify-start pl-8"
                    onClick={() => setSelectedGroup(child.id)}
                  >
                    <Folder className="h-4 w-4 mr-2" />
                    {child.name}
                  </Button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[18px] font-bold tracking-tight text-foreground">SMS Sequences</h1>
                <p className="text-muted-foreground mt-1">
                  Create automated SMS follow-up sequences and drip campaigns
                </p>
              </div>
              <div className="flex gap-2">
                <Dialog open={isCreateGroupDialogOpen} onOpenChange={setIsCreateGroupDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="text-foreground">
                      <FolderPlus className="h-4 w-4 mr-2" />
                      New Group
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Group</DialogTitle>
                      <DialogDescription>
                        Create a new group to organize your SMS sequences
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="group-name">Group Name</Label>
                        <Input
                          id="group-name"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          placeholder="Enter group name"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="parent-group">Parent Group (Optional)</Label>
                        <Select value={newGroupParentId} onValueChange={setNewGroupParentId}>
                          <SelectTrigger id="parent-group">
                            <SelectValue placeholder="Select parent group (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No parent</SelectItem>
                            {renderGroupOptions(buildGroupTree(groups))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => {
                        setIsCreateGroupDialogOpen(false);
                        setNewGroupName('');
                        setNewGroupParentId('none');
                      }} className="text-foreground">
                        Cancel
                      </Button>
                      <Button onClick={createGroup}>Create Group</Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Sequence
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create SMS Sequence</DialogTitle>
                      <DialogDescription>
                        Create a new automated SMS sequence with multiple steps
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Sequence Name</Label>
                        <Input
                          id="name"
                          value={sequenceForm.name}
                          onChange={(e) => setSequenceForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter sequence name"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={sequenceForm.description}
                          onChange={(e) => setSequenceForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter sequence description"
                          rows={2}
                        />
                      </div>

                      {/* Steps */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Sequence Steps</Label>
                          <Button type="button" variant="outline" size="sm" onClick={addStep} className="text-foreground">
                            <Plus className="h-3 w-3 mr-1" />
                            Add Step
                          </Button>
                        </div>

                        {sequenceForm.steps.map((step, index) => (
                          <Card key={index} className="p-4 border-analytics">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline">
                                  {index === 0 ? 'Initial Message' : `Step ${index + 1}`}
                                </Badge>
                                {sequenceForm.steps.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeStep(index)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>

                              <div className="grid gap-2">
                                <Label>Message</Label>
                                <Textarea
                                  value={step.message}
                                  onChange={(e) => updateStep(index, 'message', e.target.value)}
                                  placeholder="Enter SMS message"
                                  rows={3}
                                />
                                <p className="text-xs text-muted-foreground">
                                  {step.message.length}/160 characters
                                </p>
                              </div>

                              {index > 0 && (
                                <div>
                                  <Label>Delay (Hours)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={step.delay_hours}
                                    onChange={(e) => updateStep(index, 'delay_hours', parseInt(e.target.value) || 0)}
                                  />
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="text-foreground">
                        Cancel
                      </Button>
                      <Button onClick={createSequence}>
                        Create Sequence
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search sequences..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {renderGroupOptions(buildGroupTree(groups))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            {selectedSequences.length > 0 && (
              <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {selectedSequences.length} sequence(s) selected
                </span>
                <div className="flex gap-2 ml-auto">
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('activate')} className="text-foreground">
                    <Play className="h-3 w-3 mr-1" />
                    Activate
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('pause')} className="text-foreground">
                    <Pause className="h-3 w-3 mr-1" />
                    Pause
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('duplicate')} className="text-foreground">
                    <Copy className="h-3 w-3 mr-1" />
                    Duplicate
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('archive')}>
                    <Archive className="h-3 w-3 mr-1" />
                    Archive
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
                    <Trash2 className="h-3 w-3 mr-1" />
                    Move to Trash
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedSequences([])}>
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {/* Sequences Table */}
            {filteredSequences.length > 0 ? (
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
                      <TableHead className="font-semibold text-gray-600 dark:text-gray-400">Sequence</TableHead>
                      <TableHead className="font-semibold text-gray-600 dark:text-gray-400">Status</TableHead>
                      <TableHead className="font-semibold text-gray-600 dark:text-gray-400">Steps</TableHead>
                      <TableHead className="font-semibold text-gray-600 dark:text-gray-400">Subscribers</TableHead>
                      <TableHead className="font-semibold text-gray-600 dark:text-gray-400">Completion</TableHead>
                      <TableHead className="font-semibold text-gray-600 dark:text-gray-400">Created</TableHead>
                      <TableHead className="font-semibold text-gray-600 dark:text-gray-400">Group</TableHead>
                      <TableHead className="font-semibold text-gray-600 dark:text-gray-400">Actions</TableHead>
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
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              SMS sequence
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(sequence.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(sequence.status)}
                              {sequence.status}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium text-foreground">{sequence.steps?.length || 0} steps</div>
                            <div className="text-gray-500 dark:text-gray-400">
                              {sequence.steps?.slice(0, 1).map((step, index) => (
                                <span key={index} className="truncate block max-w-32">
                                  {step.message}
                                </span>
                              ))}
                              {(sequence.steps?.length || 0) > 1 && (
                                <span className="text-xs">+{(sequence.steps?.length || 0) - 1} more</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span>{sequence.subscriber_count || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-green-500" />
                            <span>{sequence.completion_rate || 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(sequence.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {sequence.group_id && (
                            <Badge variant="outline">
                              <Folder className="h-3 w-3 mr-1" />
                              {groups.find(g => g.id === sequence.group_id)?.name || 'Unknown'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toggleSequenceStatus(sequence.id)}>
                                {sequence.status === 'active' ? (
                                  <>
                                    <Pause className="h-4 w-4 mr-2" />
                                    Pause
                                  </>
                                ) : sequence.status === 'paused' ? (
                                  <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Resume
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(sequence)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => duplicateSequence(sequence)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleArchiveSequence(sequence.id)}>
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleMoveToTrash(sequence.id)}
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
            ) : (
              <Card className="border-analytics">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Zap className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No SMS sequences found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      {searchQuery || selectedStatus !== 'all' || selectedGroup !== 'all'
                        ? 'No sequences match your search criteria.'
                        : 'Get started by creating your first SMS sequence.'}
                    </p>
                    {!searchQuery && selectedStatus === 'all' && selectedGroup === 'all' && (
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Sequence
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit SMS Sequence</DialogTitle>
                  <DialogDescription>
                    Update your automated SMS sequence
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Sequence Name</Label>
                    <Input
                      id="edit-name"
                      value={sequenceForm.name}
                      onChange={(e) => setSequenceForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter sequence name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={sequenceForm.description}
                      onChange={(e) => setSequenceForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter sequence description"
                      rows={2}
                    />
                  </div>

                  {/* Steps */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Sequence Steps</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addStep} className="text-foreground">
                        <Plus className="h-3 w-3 mr-1" />
                        Add Step
                      </Button>
                    </div>

                    {sequenceForm.steps.map((step, index) => (
                      <Card key={index} className="p-4 border-analytics">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">
                              {index === 0 ? 'Initial Message' : `Step ${index + 1}`}
                            </Badge>
                            {sequenceForm.steps.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeStep(index)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>

                          <div className="grid gap-2">
                            <Label>Message</Label>
                            <Textarea
                              value={step.message}
                              onChange={(e) => updateStep(index, 'message', e.target.value)}
                              placeholder="Enter SMS message"
                              rows={3}
                            />
                            <p className="text-xs text-muted-foreground">
                              {step.message.length}/160 characters
                            </p>
                          </div>

                          {index > 0 && (
                            <div>
                              <Label>Delay (Hours)</Label>
                              <Input
                                type="number"
                                min="0"
                                value={step.delay_hours}
                                onChange={(e) => updateStep(index, 'delay_hours', parseInt(e.target.value) || 0)}
                              />
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="text-foreground">
                    Cancel
                  </Button>
                  <Button onClick={updateSequence}>
                    Update Sequence
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </>
  );
};

export default SMSSequences;
