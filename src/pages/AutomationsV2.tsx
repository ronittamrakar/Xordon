import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Zap,
  Plus,
  Play,
  Pause,
  MoreVertical,
  Trash2,
  Edit,
  Copy,
  BookOpen,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  FileTextIcon,
  Users,
  GitBranch,
  MessageCircle,
  Calendar,
  Star,
  CreditCard,
  Bell,
  Tag,
  Mail,
  UserCheck,
  PlusCircle,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import automationsApi, { AutomationWorkflow, AutomationRecipe, TriggerType, ActionType } from '@/services/automationsApi';
import { formatDistanceToNow } from 'date-fns';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'file-text': FileTextIcon,
  'user-plus': Users,
  'user-check': UserCheck,
  'tag': Tag,
  'plus-circle': PlusCircle,
  'git-branch': GitBranch,
  'trophy': Star,
  'x-circle': XCircle,
  'message-circle': MessageCircle,
  'calendar-plus': Calendar,
  'calendar-check': Calendar,
  'bell': Bell,
  'credit-card': CreditCard,
  'star': Star,
  'mail': Mail,
  'clock': Clock,
  'layers': Layers,
  'check-square': CheckCircle,
  'globe': Activity,
  'edit': Edit,
  'minus-circle': XCircle,
  'git-merge': GitBranch,
  'refresh-cw': Activity,
  'sticky-note': FileTextIcon,
};

const AutomationsV2: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'workflows' | 'recipes'>('workflows');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<AutomationRecipe | null>(null);
  const [newWorkflow, setNewWorkflow] = useState({ name: '', description: '', trigger_type: '' });

  // Fetch workflows
  const { data: workflows = [], isLoading: isLoadingWorkflows } = useQuery({
    queryKey: ['automation-workflows', statusFilter],
    queryFn: () => automationsApi.listWorkflows({
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
  });

  // Fetch recipes
  const { data: recipes = [], isLoading: isLoadingRecipes } = useQuery({
    queryKey: ['automation-recipes'],
    queryFn: () => automationsApi.listRecipes(),
  });

  // Fetch trigger types
  const { data: triggerTypes = [] } = useQuery({
    queryKey: ['automation-triggers'],
    queryFn: () => automationsApi.getTriggerTypes(),
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['automation-stats'],
    queryFn: () => automationsApi.getStats(),
  });

  // Create workflow mutation
  const createWorkflowMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; trigger_type: string }) =>
      automationsApi.createWorkflow(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
      setIsCreateOpen(false);
      setNewWorkflow({ name: '', description: '', trigger_type: '' });
      toast.success('Workflow created');
    },
    onError: () => {
      toast.error('Failed to create workflow');
    },
  });

  // Use recipe mutation
  const useRecipeMutation = useMutation({
    mutationFn: (data: { recipeId: number; name?: string }) =>
      automationsApi.useRecipe(data.recipeId, data.name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
      setSelectedRecipe(null);
      toast.success('Workflow created from recipe');
    },
  });

  // Toggle workflow mutation
  const toggleWorkflowMutation = useMutation({
    mutationFn: (id: number) => automationsApi.toggleWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
    },
  });

  // Delete workflow mutation
  const deleteWorkflowMutation = useMutation({
    mutationFn: (id: number) => automationsApi.deleteWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
      toast.success('Workflow deleted');
    },
  });

  const filteredWorkflows = workflows.filter(wf =>
    !searchQuery || wf.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIcon = (iconName: string | null) => {
    if (!iconName) return Zap;
    return iconMap[iconName] || Zap;
  };

  const getTriggerName = (triggerType: string) => {
    const trigger = triggerTypes.find(t => t.type === triggerType);
    return trigger?.name || triggerType;
  };

  const groupedRecipes = recipes.reduce((acc, recipe) => {
    if (!acc[recipe.category]) acc[recipe.category] = [];
    acc[recipe.category].push(recipe);
    return acc;
  }, {} as Record<string, AutomationRecipe[]>);

  const categoryLabels: Record<string, string> = {
    lead_nurture: 'Lead Nurturing',
    sales: 'Sales',
    appointments: 'Appointments',
    communication: 'Communication',
    reviews: 'Reviews',
    general: 'General',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Automations
          </h1>
          <p className="text-muted-foreground">Create workflows that run automatically based on triggers</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.workflows.total}</div>
              <div className="text-sm text-muted-foreground">Total Workflows</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{stats.workflows.active}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.workflows.total_runs || 0}</div>
              <div className="text-sm text-muted-foreground">Total Runs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">{stats.executions.completed}</div>
              <div className="text-sm text-muted-foreground">Completed (30d)</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'workflows' | 'recipes')}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="workflows">My Workflows</TabsTrigger>
            <TabsTrigger value="recipes">
              <BookOpen className="h-4 w-4 mr-1" />
              Recipes
            </TabsTrigger>
          </TabsList>

          {activeTab === 'workflows' && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-48 h-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="mt-4">
          {isLoadingWorkflows ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredWorkflows.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No workflows yet</h3>
                <p className="text-muted-foreground mb-4">Create your first automation or start from a recipe</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Workflow
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('recipes')}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse Recipes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredWorkflows.map((workflow) => (
                <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'p-2 rounded-lg',
                          workflow.status === 'active' ? 'bg-green-100 text-green-600' :
                            workflow.status === 'paused' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-gray-100 text-gray-600'
                        )}>
                          <Zap className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium">{workflow.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Trigger: {getTriggerName(workflow.trigger_type)}</span>
                            <span>•</span>
                            <span>{workflow.action_count || 0} actions</span>
                            {workflow.run_count > 0 && (
                              <>
                                <span>•</span>
                                <span>{workflow.run_count} runs</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant={
                          workflow.status === 'active' ? 'default' :
                            workflow.status === 'paused' ? 'secondary' : 'outline'
                        }>
                          {workflow.status}
                        </Badge>

                        <Switch
                          checked={workflow.status === 'active'}
                          onCheckedChange={() => toggleWorkflowMutation.mutate(workflow.id)}
                          disabled={workflow.status === 'draft'}
                        />

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Activity className="h-4 w-4 mr-2" />
                              View History
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteWorkflowMutation.mutate(workflow.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Recipes Tab */}
        <TabsContent value="recipes" className="mt-4">
          <div className="space-y-6">
            {Object.entries(groupedRecipes).map(([category, categoryRecipes]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-3">{categoryLabels[category] || category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryRecipes.map((recipe) => {
                    const IconComponent = getIcon(recipe.icon);
                    return (
                      <Card
                        key={recipe.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedRecipe(recipe)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{recipe.name}</CardTitle>
                              <CardDescription className="text-xs mt-1">
                                {recipe.description}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{recipe.actions.length} actions</span>
                            <Badge variant="outline" className="text-[12px]">
                              {getTriggerName(recipe.trigger_type)}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Workflow Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Workflow</DialogTitle>
            <DialogDescription>Create a new automation workflow from scratch.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="e.g., Welcome New Leads"
                value={newWorkflow.name}
                onChange={(e) => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Trigger *</Label>
              <Select
                value={newWorkflow.trigger_type}
                onValueChange={(v) => setNewWorkflow(prev => ({ ...prev, trigger_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a trigger..." />
                </SelectTrigger>
                <SelectContent>
                  {triggerTypes.map(trigger => (
                    <SelectItem key={trigger.type} value={trigger.type}>
                      {trigger.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="What does this workflow do?"
                value={newWorkflow.description}
                onChange={(e) => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createWorkflowMutation.mutate(newWorkflow)}
              disabled={!newWorkflow.name.trim() || !newWorkflow.trigger_type || createWorkflowMutation.isPending}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Use Recipe Dialog */}
      <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Use Recipe: {selectedRecipe?.name}</DialogTitle>
            <DialogDescription>{selectedRecipe?.description}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-2">This workflow will:</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Trigger on: {selectedRecipe && getTriggerName(selectedRecipe.trigger_type)}</li>
                  <li>• Run {selectedRecipe?.actions.length} action(s)</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                The workflow will be created as a draft. You can customize it before activating.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRecipe(null)}>Cancel</Button>
            <Button
              onClick={() => selectedRecipe && useRecipeMutation.mutate({ recipeId: selectedRecipe.id })}
              disabled={useRecipeMutation.isPending}
            >
              Create from Recipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AutomationsV2;

