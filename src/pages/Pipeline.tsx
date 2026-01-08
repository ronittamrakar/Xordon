import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  MoreVertical, 
  DollarSign, 
  User, 
  Calendar,
  Trash2,
  Edit,
  ChevronDown,
  Filter,
  Search,
  LayoutGrid,
  List,
  Settings,
  GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import opportunitiesApi, { Pipeline as PipelineType, PipelineStage, Opportunity, OpportunityStats } from '@/services/opportunitiesApi';
import { formatDistanceToNow } from 'date-fns';

const Pipeline: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedPipelineId, setSelectedPipelineId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpportunityOpen, setIsCreateOpportunityOpen] = useState(false);
  const [isCreatePipelineOpen, setIsCreatePipelineOpen] = useState(false);
  const [newOpportunity, setNewOpportunity] = useState({ name: '', value: '', notes: '' });
  const [newPipeline, setNewPipeline] = useState({ name: '' });
  const [draggedOpportunity, setDraggedOpportunity] = useState<Opportunity | null>(null);

  // Fetch pipelines
  const { data: pipelines = [], isLoading: isLoadingPipelines } = useQuery({
    queryKey: ['pipelines'],
    queryFn: () => opportunitiesApi.getPipelines(),
  });

  // Auto-select first pipeline
  React.useEffect(() => {
    if (pipelines.length > 0 && !selectedPipelineId) {
      setSelectedPipelineId(pipelines[0].id);
    }
  }, [pipelines, selectedPipelineId]);

  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);

  // Fetch opportunities for selected pipeline
  const { data: opportunitiesData, isLoading: isLoadingOpportunities } = useQuery({
    queryKey: ['opportunities', selectedPipelineId, searchQuery],
    queryFn: () => opportunitiesApi.list({
      pipeline_id: selectedPipelineId || undefined,
      q: searchQuery || undefined,
      limit: 500,
    }),
    enabled: !!selectedPipelineId,
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['opportunities-stats'],
    queryFn: () => opportunitiesApi.getStats(),
  });

  const opportunities = opportunitiesData?.data || [];

  // Group opportunities by stage
  const opportunitiesByStage = React.useMemo(() => {
    const grouped: Record<number, Opportunity[]> = {};
    selectedPipeline?.stages?.forEach(stage => {
      grouped[stage.id] = opportunities.filter(o => o.stage_id === stage.id);
    });
    return grouped;
  }, [opportunities, selectedPipeline?.stages]);

  // Create opportunity mutation
  const createOpportunityMutation = useMutation({
    mutationFn: (data: { name: string; value?: number; notes?: string; pipeline_id?: number }) =>
      opportunitiesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities-stats'] });
      setIsCreateOpportunityOpen(false);
      setNewOpportunity({ name: '', value: '', notes: '' });
      toast.success('Opportunity created');
    },
    onError: () => {
      toast.error('Failed to create opportunity');
    },
  });

  // Move stage mutation
  const moveStageMutation = useMutation({
    mutationFn: (data: { id: number; stageId: number }) =>
      opportunitiesApi.moveStage(data.id, data.stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities-stats'] });
    },
  });

  // Create pipeline mutation
  const createPipelineMutation = useMutation({
    mutationFn: (data: { name: string }) => opportunitiesApi.createPipeline(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      setIsCreatePipelineOpen(false);
      setNewPipeline({ name: '' });
      toast.success('Pipeline created');
    },
  });

  // Delete opportunity mutation
  const deleteOpportunityMutation = useMutation({
    mutationFn: (id: number) => opportunitiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities-stats'] });
      toast.success('Opportunity deleted');
    },
  });

  const handleCreateOpportunity = () => {
    if (!newOpportunity.name.trim()) return;
    createOpportunityMutation.mutate({
      name: newOpportunity.name,
      value: newOpportunity.value ? parseFloat(newOpportunity.value) : undefined,
      notes: newOpportunity.notes || undefined,
      pipeline_id: selectedPipelineId || undefined,
    });
  };

  const handleDragStart = (e: React.DragEvent, opportunity: Opportunity) => {
    setDraggedOpportunity(opportunity);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, stageId: number) => {
    e.preventDefault();
    if (draggedOpportunity && draggedOpportunity.stage_id !== stageId) {
      moveStageMutation.mutate({ id: draggedOpportunity.id, stageId });
    }
    setDraggedOpportunity(null);
  };

  const formatCurrency = (value: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getContactName = (opp: Opportunity) => {
    if (opp.contact_first_name || opp.contact_last_name) {
      return `${opp.contact_first_name || ''} ${opp.contact_last_name || ''}`.trim();
    }
    return null;
  };

  const getStageValue = (stageId: number) => {
    return opportunities
      .filter(o => o.stage_id === stageId && o.status === 'open')
      .reduce((sum, o) => sum + (o.value || 0), 0);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Pipeline</h1>
          
          {/* Pipeline selector */}
          <Select 
            value={selectedPipelineId?.toString() || ''} 
            onValueChange={(v) => setSelectedPipelineId(parseInt(v))}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select pipeline" />
            </SelectTrigger>
            <SelectContent>
              {pipelines.map(p => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={() => setIsCreatePipelineOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Pipeline
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats */}
          {stats && (
            <div className="flex gap-4 text-sm mr-4">
              <div className="text-center">
                <div className="text-muted-foreground text-xs">Open</div>
                <div className="font-semibold">{formatCurrency(stats.open_value || 0)}</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground text-xs">Won</div>
                <div className="font-semibold text-green-600">{formatCurrency(stats.won_value || 0)}</div>
              </div>
              <div className="text-center">
                <div className="text-muted-foreground text-xs">Lost</div>
                <div className="font-semibold text-red-600">{formatCurrency(stats.lost_value || 0)}</div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-48 h-9"
            />
          </div>

          {/* View toggle */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'kanban' | 'list')}>
            <TabsList className="h-9">
              <TabsTrigger value="kanban" className="px-2">
                <LayoutGrid className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="px-2">
                <List className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Add opportunity */}
          <Button onClick={() => setIsCreateOpportunityOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Deal
          </Button>
        </div>
      </div>

      {/* Kanban board */}
      {viewMode === 'kanban' && selectedPipeline && (
        <ScrollArea className="flex-1">
          <div className="flex gap-4 p-4 min-w-max">
            {selectedPipeline.stages?.map((stage) => (
              <div
                key={stage.id}
                className="w-72 flex-shrink-0 flex flex-col bg-muted/30 rounded-lg"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {/* Stage header */}
                <div className="p-3 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="font-medium text-sm">{stage.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {opportunitiesByStage[stage.id]?.length || 0}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(getStageValue(stage.id))}
                  </span>
                </div>

                {/* Opportunities */}
                <ScrollArea className="flex-1 p-2">
                  <div className="space-y-2">
                    {opportunitiesByStage[stage.id]?.map((opp) => (
                      <Card
                        key={opp.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, opp)}
                        className={cn(
                          'cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow',
                          draggedOpportunity?.id === opp.id && 'opacity-50'
                        )}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm line-clamp-2">{opp.name}</h4>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => deleteOpportunityMutation.mutate(opp.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {opp.value > 0 && (
                            <div className="flex items-center gap-1 text-sm font-semibold text-green-600 mb-2">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(opp.value, opp.currency)}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            {getContactName(opp) ? (
                              <div className="flex items-center gap-1">
                                <Avatar className="h-4 w-4">
                                  <AvatarFallback className="text-[8px]">
                                    {getContactName(opp)?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate max-w-20">{getContactName(opp)}</span>
                              </div>
                            ) : (
                              <span>No contact</span>
                            )}
                            <span>{formatDistanceToNow(new Date(opp.created_at), { addSuffix: true })}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <ScrollArea className="flex-1">
          <div className="p-4">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Value</th>
                  <th className="pb-3 font-medium">Stage</th>
                  <th className="pb-3 font-medium">Contact</th>
                  <th className="pb-3 font-medium">Owner</th>
                  <th className="pb-3 font-medium">Created</th>
                  <th className="pb-3 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opp) => (
                  <tr key={opp.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 font-medium">{opp.name}</td>
                    <td className="py-3">
                      {opp.value > 0 ? formatCurrency(opp.value, opp.currency) : '-'}
                    </td>
                    <td className="py-3">
                      <Badge 
                        variant="outline" 
                        style={{ borderColor: opp.stage_color, color: opp.stage_color }}
                      >
                        {opp.stage_name}
                      </Badge>
                    </td>
                    <td className="py-3 text-sm">{getContactName(opp) || '-'}</td>
                    <td className="py-3 text-sm">{opp.owner_name || '-'}</td>
                    <td className="py-3 text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(opp.created_at), { addSuffix: true })}
                    </td>
                    <td className="py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => deleteOpportunityMutation.mutate(opp.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      )}

      {/* Create Opportunity Dialog */}
      <Dialog open={isCreateOpportunityOpen} onOpenChange={setIsCreateOpportunityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Opportunity</DialogTitle>
            <DialogDescription>Add a new deal to your pipeline.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="Deal name"
                value={newOpportunity.name}
                onChange={(e) => setNewOpportunity(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={newOpportunity.value}
                onChange={(e) => setNewOpportunity(prev => ({ ...prev, value: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Add notes..."
                value={newOpportunity.notes}
                onChange={(e) => setNewOpportunity(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpportunityOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateOpportunity} disabled={createOpportunityMutation.isPending}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Pipeline Dialog */}
      <Dialog open={isCreatePipelineOpen} onOpenChange={setIsCreatePipelineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Pipeline</DialogTitle>
            <DialogDescription>Create a new sales pipeline with default stages.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Pipeline Name *</Label>
              <Input
                placeholder="e.g., Sales Pipeline"
                value={newPipeline.name}
                onChange={(e) => setNewPipeline({ name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatePipelineOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => createPipelineMutation.mutate(newPipeline)} 
              disabled={!newPipeline.name.trim() || createPipelineMutation.isPending}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pipeline;
