import { useState, useEffect } from 'react';
import { Plus, Workflow, Play, Pause, Trash2, Edit, MoreVertical, Users, Zap, GitBranch, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import workflowsApi, { Workflow as WorkflowType, WorkflowOptions } from '@/services/workflowsApi';

export default function WorkflowsLegacy() {
  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [options, setOptions] = useState<WorkflowOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: '',
    run_once_per_contact: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [workflowsRes, optionsRes] = await Promise.all([
        workflowsApi.list(),
        workflowsApi.getOptions(),
      ]);
      setWorkflows(workflowsRes || []);
      setOptions(optionsRes);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load workflows', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.trigger_type) {
      toast({ title: 'Error', description: 'Name and trigger type are required', variant: 'destructive' });
      return;
    }
    try {
      await workflowsApi.create(formData);
      toast({ title: 'Success', description: 'Workflow created successfully' });
      setIsCreateOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create workflow', variant: 'destructive' });
    }
  };

  const handleUpdate = async () => {
    if (!selectedWorkflow) return;
    try {
      await workflowsApi.update(selectedWorkflow.id, formData);
      toast({ title: 'Success', description: 'Workflow updated successfully' });
      setIsEditOpen(false);
      setSelectedWorkflow(null);
      resetForm();
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update workflow', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await workflowsApi.delete(id);
      toast({ title: 'Success', description: 'Workflow deleted successfully' });
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete workflow', variant: 'destructive' });
    }
  };

  const handleToggle = async (workflow: WorkflowType) => {
    try {
      await workflowsApi.toggle(workflow.id);
      toast({
        title: 'Success',
        description: `Workflow ${workflow.is_active ? 'paused' : 'activated'} successfully`
      });
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to toggle workflow', variant: 'destructive' });
    }
  };

  const openEdit = async (workflow: WorkflowType) => {
    try {
      const wf = await workflowsApi.get(workflow.id);
      setSelectedWorkflow(wf);
      setFormData({
        name: wf.name,
        description: wf.description || '',
        trigger_type: wf.trigger_type,
        run_once_per_contact: wf.run_once_per_contact,
      });
      setIsEditOpen(true);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load workflow details', variant: 'destructive' });
    }
  };

  const openView = async (workflow: WorkflowType) => {
    try {
      const wf = await workflowsApi.get(workflow.id);
      setSelectedWorkflow(wf);
      setIsViewOpen(true);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load workflow details', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trigger_type: '',
      run_once_per_contact: false,
    });
  };

  const getTriggerLabel = (type: string) => {
    return options?.trigger_types?.[type] || type;
  };

  const WorkflowForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Workflow Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Welcome Sequence"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe what this workflow does..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="trigger">Trigger</Label>
        <Select value={formData.trigger_type} onValueChange={(v) => setFormData({ ...formData, trigger_type: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select a trigger..." />
          </SelectTrigger>
          <SelectContent>
            {options?.trigger_types && Object.entries(options.trigger_types).length > 0 ? (
              Object.entries(options.trigger_types).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>No triggers available</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.run_once_per_contact}
          onCheckedChange={(v) => setFormData({ ...formData, run_once_per_contact: v })}
        />
        <Label>Run only once per contact</Label>
      </div>

      <DialogFooter>
        <Button onClick={onSubmit}>{submitLabel}</Button>
      </DialogFooter>
    </div>
  );

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">Automate your business processes with workflows</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-r-none h-9 px-3"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-l-none h-9 px-3"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Workflow
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Workflow</DialogTitle>
                <DialogDescription>Set up a new automation workflow</DialogDescription>
              </DialogHeader>
              <WorkflowForm onSubmit={handleCreate} submitLabel="Create Workflow" />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {workflows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Workflow className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No workflows yet</h3>
            <p className="text-muted-foreground mb-4">Create your first workflow to automate your processes</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${workflow.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openView(workflow)}>
                            <GitBranch className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(workflow)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggle(workflow)}>
                            {workflow.is_active ? (
                              <>
                                <Pause className="w-4 h-4 mr-2" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(workflow.id)} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardDescription>{workflow.description || 'No description'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm">{getTriggerLabel(workflow.trigger_type)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                          {workflow.is_active ? 'Active' : 'Paused'}
                        </Badge>
                        <Badge variant="outline">
                          {workflow.step_count || 0} steps
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-muted rounded p-2">
                          <div className="font-semibold">{workflow.total_enrolled || 0}</div>
                          <div className="text-muted-foreground">Enrolled</div>
                        </div>
                        <div className="bg-muted rounded p-2">
                          <div className="font-semibold text-green-600">{workflow.total_completed || 0}</div>
                          <div className="text-muted-foreground">Completed</div>
                        </div>
                        <div className="bg-muted rounded p-2">
                          <div className="font-semibold">{workflow.active_enrollments || 0}</div>
                          <div className="text-muted-foreground">Active</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Steps</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((workflow) => (
                    <TableRow key={workflow.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{workflow.name}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">{workflow.description || 'No description'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <span>{getTriggerLabel(workflow.trigger_type)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                          {workflow.is_active ? 'Active' : 'Paused'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {workflow.step_count || 0} steps
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-4 text-xs">
                          <div><span className="font-semibold">{workflow.total_enrolled || 0}</span> Enrolled</div>
                          <div><span className="font-semibold text-green-600">{workflow.total_completed || 0}</span> Completed</div>
                          <div><span className="font-semibold">{workflow.active_enrollments || 0}</span> Active</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openView(workflow)}>
                            <GitBranch className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(workflow)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleToggle(workflow)}>
                                {workflow.is_active ? (
                                  <>
                                    <Pause className="w-4 h-4 mr-2" />
                                    Pause
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(workflow.id)} className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Workflow</DialogTitle>
            <DialogDescription>Update workflow settings</DialogDescription>
          </DialogHeader>
          <WorkflowForm onSubmit={handleUpdate} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedWorkflow?.name}</DialogTitle>
            <DialogDescription>{selectedWorkflow?.description}</DialogDescription>
          </DialogHeader>
          {selectedWorkflow && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Trigger</Label>
                  <p className="font-medium">{getTriggerLabel(selectedWorkflow.trigger_type)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p className="font-medium">{selectedWorkflow.is_active ? 'Active' : 'Paused'}</p>
                </div>
              </div>

              {selectedWorkflow.stats && (
                <div>
                  <Label className="text-muted-foreground">Statistics</Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    <div className="bg-muted rounded p-3 text-center">
                      <div className="text-xl font-bold">{selectedWorkflow.stats.total_enrolled}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div className="bg-muted rounded p-3 text-center">
                      <div className="text-xl font-bold text-blue-600">{selectedWorkflow.stats.active}</div>
                      <div className="text-xs text-muted-foreground">Active</div>
                    </div>
                    <div className="bg-muted rounded p-3 text-center">
                      <div className="text-xl font-bold text-green-600">{selectedWorkflow.stats.completed}</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div className="bg-muted rounded p-3 text-center">
                      <div className="text-xl font-bold text-red-600">{selectedWorkflow.stats.failed}</div>
                      <div className="text-xs text-muted-foreground">Failed</div>
                    </div>
                    <div className="bg-muted rounded p-3 text-center">
                      <div className="text-xl font-bold text-gray-600">{selectedWorkflow.stats.exited}</div>
                      <div className="text-xs text-muted-foreground">Exited</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedWorkflow.steps && selectedWorkflow.steps.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Steps ({selectedWorkflow.steps.length})</Label>
                  <div className="mt-2 space-y-2">
                    {selectedWorkflow.steps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                          {index + 1}
                        </div>
                        <div>
                          <span className="font-medium capitalize">{step.step_type}</span>
                          {step.action_type && (
                            <span className="text-muted-foreground ml-2">
                              ({options?.action_types?.[step.action_type] || step.action_type})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
