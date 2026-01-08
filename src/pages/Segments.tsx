import React, { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Segment,
  SegmentFilter,
  SEGMENT_FILTER_FIELDS,
  FILTER_OPERATORS,
  SEGMENT_COLORS,
  SEGMENT_ICONS,
} from '@/types/segment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Filter,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  RefreshCw,
  Loader2,
  X,
  Star,
  Heart,
  Zap,
  Target,
  TrendingUp,
  Award,
  Flag,
  Bookmark,
  Eye,
  LayoutGrid,
  List,
  Download,
  Save,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  filter: Filter,
  users: Users,
  star: Star,
  heart: Heart,
  zap: Zap,
  target: Target,
  'trending-up': TrendingUp,
  award: Award,
  flag: Flag,
  bookmark: Bookmark,
};

const defaultSegmentForm: Partial<Segment> = {
  name: '',
  description: '',
  color: '#8b5cf6',
  icon: 'filter',
  filterCriteria: [],
  matchType: 'all',
  isActive: true,
};

const defaultFilter: Omit<SegmentFilter, 'id'> = {
  field: '',
  operator: 'equals',
  value: '',
};

export default function Segments() {
  console.log('Segments page rendering');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [segmentForm, setSegmentForm] = useState<Partial<Segment>>(defaultSegmentForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewingSegmentId, setViewingSegmentId] = useState<string | null>(null);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Fetch segments
  const { data, isLoading, error } = useQuery({
    queryKey: ['segments', search],
    queryFn: () => api.getSegments({ search: search || undefined }),
  });

  const segments = data?.segments || [];

  // Fetch contacts for a specific segment
  const { data: segmentContactsData, isLoading: isLoadingContacts } = useQuery({
    queryKey: ['segment-contacts', viewingSegmentId],
    queryFn: () => viewingSegmentId ? api.getSegmentContacts(viewingSegmentId) : null,
    enabled: !!viewingSegmentId,
  });

  // Create segment mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<Segment>) => api.createSegment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      toast({ title: 'Segment created successfully' });
      closeDialog();
    },
    onError: () => {
      toast({ title: 'Failed to create segment', variant: 'destructive' });
    },
  });

  // Update segment mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Segment> }) => api.updateSegment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      toast({ title: 'Segment updated successfully' });
      closeDialog();
    },
    onError: () => {
      toast({ title: 'Failed to update segment', variant: 'destructive' });
    },
  });

  // Delete segment mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteSegment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      toast({ title: 'Segment deleted successfully' });
      setDeleteConfirmId(null);
    },
    onError: () => {
      toast({ title: 'Failed to delete segment', variant: 'destructive' });
    },
  });

  // Recalculate segment mutation
  const recalculateMutation = useMutation({
    mutationFn: (id: string) => api.recalculateSegment(id),
    onSuccess: (data: { contactCount: number }) => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      toast({ title: `Segment recalculated: ${data.contactCount} contacts` });
    },
    onError: () => {
      toast({ title: 'Failed to recalculate segment', variant: 'destructive' });
    },
  });

  const openCreateDialog = () => {
    setEditingSegment(null);
    setSegmentForm({
      ...defaultSegmentForm,
      filterCriteria: [{ id: crypto.randomUUID(), ...defaultFilter }],
    });
    setPreviewCount(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (segment: Segment) => {
    setEditingSegment(segment);
    setSegmentForm({
      name: segment.name,
      description: segment.description || '',
      color: segment.color,
      icon: segment.icon,
      filterCriteria: segment.filterCriteria.length > 0
        ? segment.filterCriteria
        : [{ id: crypto.randomUUID(), ...defaultFilter }],
      matchType: segment.matchType,
      isActive: segment.isActive,
    });
    setPreviewCount(segment.contactCount);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingSegment(null);
    setSegmentForm(defaultSegmentForm);
    setPreviewCount(null);
  };

  const addFilter = () => {
    setSegmentForm({
      ...segmentForm,
      filterCriteria: [
        ...(segmentForm.filterCriteria || []),
        { id: crypto.randomUUID(), ...defaultFilter },
      ],
    });
  };

  const removeFilter = (filterId: string) => {
    setSegmentForm({
      ...segmentForm,
      filterCriteria: (segmentForm.filterCriteria || []).filter((f) => f.id !== filterId),
    });
  };

  const updateFilter = (filterId: string, updates: Partial<SegmentFilter>) => {
    setSegmentForm({
      ...segmentForm,
      filterCriteria: (segmentForm.filterCriteria || []).map((f) =>
        f.id === filterId ? { ...f, ...updates } : f
      ),
    });
  };

  const previewSegment = async () => {
    if (!segmentForm.filterCriteria?.length) {
      toast({ title: 'Add at least one filter', variant: 'destructive' });
      return;
    }

    const validFilters = segmentForm.filterCriteria.filter(
      (f) => f.field && f.operator
    );

    if (validFilters.length === 0) {
      toast({ title: 'Complete at least one filter', variant: 'destructive' });
      return;
    }

    setIsPreviewLoading(true);
    try {
      const result = await api.previewSegment(validFilters, segmentForm.matchType || 'all');
      setPreviewCount(result.contactCount);
    } catch {
      toast({ title: 'Failed to preview segment', variant: 'destructive' });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!segmentForm.name?.trim()) {
      toast({ title: 'Segment name is required', variant: 'destructive' });
      return;
    }

    const validFilters = (segmentForm.filterCriteria || []).filter(
      (f) => f.field && f.operator
    );

    if (validFilters.length === 0) {
      toast({ title: 'Add at least one valid filter', variant: 'destructive' });
      return;
    }

    const submitData = {
      ...segmentForm,
      filterCriteria: validFilters,
    };

    if (editingSegment) {
      updateMutation.mutate({ id: editingSegment.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = ICON_MAP[iconName] || Filter;
    return IconComponent;
  };

  const getFieldType = (fieldValue: string) => {
    const field = SEGMENT_FILTER_FIELDS.find((f) => f.value === fieldValue);
    return field?.type || 'string';
  };

  const getOperatorsForField = (fieldValue: string) => {
    const fieldType = getFieldType(fieldValue);
    return FILTER_OPERATORS[fieldType] || FILTER_OPERATORS.string;
  };

  const handleExportCSV = () => {
    if (!segmentContactsData?.contacts?.length) return;

    const contacts = segmentContactsData.contacts;
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Company', 'Status', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...contacts.map(c => [
        c.id,
        `"${c.firstName || ''} ${c.lastName || ''}"`,
        c.email,
        c.phone || '',
        `"${c.company || ''}"`,
        c.status || '',
        c.createdAt || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `segment_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleSaveAsList = async () => {
    if (!viewingSegmentId || !segmentContactsData?.contacts?.length) return;

    const segment = segments.find(s => s.id === viewingSegmentId);
    if (!segment) return;

    const toastId = toast({ title: 'Creating list...', description: 'Please wait' }).id;

    try {
      // 1. Create List
      const listName = `${segment.name} Snapshot (${new Date().toLocaleDateString()})`;
      const createRes = await api.createList({ name: listName, description: `Created from segment: ${segment.name}` });

      // 2. Add Contacts
      const contactIds = segmentContactsData.contacts.map(c => c.id);
      await api.addContactsToList(createRes.id, contactIds, 'segment_snapshot');

      toast({
        title: 'List created successfully',
        description: `Saved as "${listName}" with ${contactIds.length} contacts.`
      });
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to save list', variant: 'destructive' });
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Failed to load segments. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Segments</h1>
          <p className="text-muted-foreground">
            Create dynamic contact groups based on filter criteria
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Create Segment
        </Button>
      </div>

      {/* Controls: Search & View Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search segments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as 'grid' | 'table')}>
              <ToggleGroupItem value="grid" aria-label="Grid View">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="table" aria-label="Table View">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>

      {/* Segments Content */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : segments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Filter className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No segments found</h3>
            <p className="text-muted-foreground mb-4">
              {search ? 'Try a different search term' : 'Create your first segment to group contacts dynamically'}
            </p>
            {!search && (
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Create Segment
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Segment Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead>Filters</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {segments.map((segment) => {
                  const IconComponent = getIconComponent(segment.icon);
                  return (
                    <TableRow key={segment.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setViewingSegmentId(segment.id)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${segment.color}20` }}
                          >
                            <IconComponent
                              className="h-4 w-4"
                              style={{ color: segment.color }}
                            />
                          </div>
                          <span className="font-medium">{segment.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {segment.description || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          {segment.contactCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {segment.filterCriteria.length} filter{segment.filterCriteria.length !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {segment.isActive ? (
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {segment.lastCalculatedAt ? new Date(segment.lastCalculatedAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(segment)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setViewingSegmentId(segment.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Contacts
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => recalculateMutation.mutate(segment.id)}
                              disabled={recalculateMutation.isPending}
                            >
                              <RefreshCw className={`h-4 w-4 mr-2 ${recalculateMutation.isPending ? 'animate-spin' : ''}`} />
                              Recalculate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteConfirmId(segment.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {segments.map((segment) => {
            const IconComponent = getIconComponent(segment.icon);
            return (
              <Card
                key={segment.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${!segment.isActive ? 'opacity-60' : ''
                  }`}
                onClick={() => setViewingSegmentId(segment.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${segment.color}20` }}
                      >
                        <IconComponent
                          className="h-5 w-5"
                          style={{ color: segment.color }}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {segment.name}
                          {!segment.isActive && (
                            <Badge variant="secondary" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </CardTitle>
                        {segment.description && (
                          <CardDescription className="text-sm mt-1">
                            {segment.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(segment); }}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setViewingSegmentId(segment.id); }}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Contacts
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); recalculateMutation.mutate(segment.id); }}
                          disabled={recalculateMutation.isPending}
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${recalculateMutation.isPending ? 'animate-spin' : ''}`} />
                          Recalculate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(segment.id); }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{segment.contactCount} contacts</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {segment.filterCriteria.length} filter{segment.filterCriteria.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  {segment.lastCalculatedAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Last updated: {new Date(segment.lastCalculatedAt).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSegment ? 'Edit Segment' : 'Create Segment'}
            </DialogTitle>
            <DialogDescription>
              {editingSegment
                ? 'Update segment filters and settings'
                : 'Define filters to create a dynamic contact group'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Segment Name *</Label>
                <Input
                  id="name"
                  value={segmentForm.name || ''}
                  onChange={(e) => setSegmentForm({ ...segmentForm, name: e.target.value })}
                  placeholder="e.g., Engaged Last 30 Days"
                />
              </div>
              <div className="space-y-2">
                <Label>Match Type</Label>
                <Select
                  value={segmentForm.matchType || 'all'}
                  onValueChange={(value) => setSegmentForm({ ...segmentForm, matchType: value as 'all' | 'any' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Match ALL filters (AND)</SelectItem>
                    <SelectItem value="any">Match ANY filter (OR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={segmentForm.description || ''}
                onChange={(e) => setSegmentForm({ ...segmentForm, description: e.target.value })}
                placeholder="Brief description of this segment..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {SEGMENT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${segmentForm.color === color ? 'border-foreground scale-110' : 'border-transparent'
                        }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSegmentForm({ ...segmentForm, color })}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {SEGMENT_ICONS.map((iconName) => {
                    const IconComp = getIconComponent(iconName);
                    return (
                      <button
                        key={iconName}
                        type="button"
                        className={`p-2 rounded border transition-all ${segmentForm.icon === iconName
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                          }`}
                        onClick={() => setSegmentForm({ ...segmentForm, icon: iconName })}
                      >
                        <IconComp className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="border-t pt-4 mt-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Filter Criteria</h4>
                <Button type="button" variant="outline" size="sm" onClick={addFilter}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Filter
                </Button>
              </div>

              <div className="space-y-3">
                {(segmentForm.filterCriteria || []).map((filter, index) => (
                  <div key={filter.id} className="flex items-start gap-2 p-3 border rounded-lg bg-muted/30">
                    {index > 0 && (
                      <Badge variant="secondary" className="mt-2">
                        {segmentForm.matchType === 'any' ? 'OR' : 'AND'}
                      </Badge>
                    )}
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <Select
                        value={filter.field}
                        onValueChange={(value) => updateFilter(filter.id, { field: value, operator: 'equals', value: '' })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {SEGMENT_FILTER_FIELDS.map((field) => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={filter.operator}
                        onValueChange={(value) => updateFilter(filter.id, { operator: value as SegmentFilter['operator'] })}
                        disabled={!filter.field}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {getOperatorsForField(filter.field).map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {!['is_empty', 'is_not_empty'].includes(filter.operator) && (
                        <Input
                          value={String(filter.value || '')}
                          onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                          placeholder="Value"
                          disabled={!filter.field}
                        />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 mt-1"
                      onClick={() => removeFilter(filter.id)}
                      disabled={(segmentForm.filterCriteria || []).length <= 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="border-t pt-4 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={previewSegment}
                    disabled={isPreviewLoading}
                  >
                    {isPreviewLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4 mr-2" />
                    )}
                    Preview
                  </Button>
                  {previewCount !== null && (
                    <span className="text-sm text-muted-foreground">
                      {previewCount} contact{previewCount !== 1 ? 's' : ''} match
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="isActive" className="text-sm">Active</Label>
                  <Switch
                    id="isActive"
                    checked={segmentForm.isActive ?? true}
                    onCheckedChange={(checked) => setSegmentForm({ ...segmentForm, isActive: checked })}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingSegment ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Segment Contacts Dialog */}
      <Dialog open={!!viewingSegmentId} onOpenChange={() => setViewingSegmentId(null)}>
        <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col p-0 gap-0">
          <div className="p-6 border-b">
            <DialogHeader>
              <DialogTitle>
                {segments.find(s => s.id === viewingSegmentId)?.name || 'Segment'} Contacts
              </DialogTitle>
              <DialogDescription>
                Contacts matching this segment's criteria
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {isLoadingContacts ? (
              <div className="flex items-center justify-center p-8 h-full">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading contacts...</p>
                </div>
              </div>
            ) : !segmentContactsData?.contacts?.length ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium">No contacts match these criteria</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  The current filters didn't find any matching contacts. Try adjusting the segment criteria to include more people.
                </p>
                <Button
                  onClick={() => {
                    const seg = segments.find(s => s.id === viewingSegmentId);
                    if (seg) {
                      setViewingSegmentId(null);
                      openEditDialog(seg);
                    }
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Segment Criteria
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contact Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date Added</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {segmentContactsData.contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">
                          {contact.firstName} {contact.lastName}
                        </TableCell>
                        <TableCell>{contact.email}</TableCell>
                        <TableCell>{contact.phone || '-'}</TableCell>
                        <TableCell>
                          {contact.company && (
                            <Badge variant="secondary" className="font-normal">
                              {contact.company}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {contact.status ? (
                            <Badge variant="outline" className="capitalize">
                              {contact.status}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-muted/20 flex justify-between items-center mt-auto">
            <div className="text-sm text-muted-foreground">
              {segmentContactsData?.contacts?.length || 0} contacts found
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setViewingSegmentId(null)}>
                Close
              </Button>
              <Button
                variant="outline"
                onClick={handleExportCSV}
                disabled={!segmentContactsData?.contacts?.length}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                onClick={handleSaveAsList}
                disabled={!segmentContactsData?.contacts?.length}
              >
                <Save className="h-4 w-4 mr-2" />
                Save as List
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const seg = segments.find(s => s.id === viewingSegmentId);
                  if (seg) {
                    setViewingSegmentId(null);
                    openEditDialog(seg);
                  }
                }}
                disabled={!viewingSegmentId}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Adjust Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Segment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this segment? This action cannot be undone.
              Contacts will not be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
