import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Copy, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import agencySaaSApi, { Snapshot } from '@/services/agencySaaSApi';

const AgencySnapshots: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [includePublic, setIncludePublic] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    includes_funnels: false,
    includes_automations: false,
    includes_templates: false,
    includes_forms: false,
    includes_pages: false,
    includes_workflows: false,
    is_public: false,
  });

  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ['snapshots', includePublic],
    queryFn: () => agencySaaSApi.listSnapshots(includePublic),
  });

  const createMutation = useMutation({
    mutationFn: agencySaaSApi.createSnapshot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['snapshots'] });
      setIsCreateOpen(false);
      resetForm();
      toast.success('Snapshot created');
    },
  });

  const cloneMutation = useMutation({
    mutationFn: ({ id }: { id: number }) => agencySaaSApi.cloneSnapshot(id),
    onSuccess: () => {
      toast.success('Snapshot cloned successfully');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      includes_funnels: false,
      includes_automations: false,
      includes_templates: false,
      includes_forms: false,
      includes_pages: false,
      includes_workflows: false,
      is_public: false,
    });
  };

  const handleCreate = () => {
    if (!formData.name) {
      toast.error('Please enter a snapshot name');
      return;
    }

    const hasIncludes = formData.includes_funnels || formData.includes_automations ||
      formData.includes_templates || formData.includes_forms ||
      formData.includes_pages || formData.includes_workflows;

    if (!hasIncludes) {
      toast.error('Please select at least one item to include');
      return;
    }

    createMutation.mutate(formData);
  };

  const handleClone = (snapshot: Snapshot) => {
    cloneMutation.mutate({ id: snapshot.id });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Snapshots
          </h1>
          <p className="text-muted-foreground">Create and clone workspace templates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIncludePublic(!includePublic)}>
            {includePublic ? 'Hide Public' : 'Show Public'}
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Snapshot
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : snapshots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No snapshots yet</h3>
            <p className="text-muted-foreground mb-4">Create your first snapshot template</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Snapshot
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {snapshots.map((snapshot) => (
            <Card key={snapshot.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{snapshot.name}</CardTitle>
                    {snapshot.category && (
                      <Badge variant="outline" className="mt-1">
                        {snapshot.category}
                      </Badge>
                    )}
                  </div>
                  {snapshot.is_public && (
                    <Badge variant="secondary">Public</Badge>
                  )}
                </div>
                {snapshot.description && (
                  <CardDescription className="text-xs mt-2">
                    {snapshot.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">Includes:</p>
                  <div className="flex flex-wrap gap-1">
                    {snapshot.includes_funnels && <Badge variant="outline" className="text-xs">Funnels</Badge>}
                    {snapshot.includes_automations && <Badge variant="outline" className="text-xs">Automations</Badge>}
                    {snapshot.includes_templates && <Badge variant="outline" className="text-xs">Templates</Badge>}
                    {snapshot.includes_forms && <Badge variant="outline" className="text-xs">Forms</Badge>}
                    {snapshot.includes_pages && <Badge variant="outline" className="text-xs">Pages</Badge>}
                    {snapshot.includes_workflows && <Badge variant="outline" className="text-xs">Workflows</Badge>}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Used {snapshot.usage_count} times</span>
                  {snapshot.is_premium && snapshot.price > 0 && (
                    <span className="font-medium">${snapshot.price}</span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleClone(snapshot)}
                  disabled={cloneMutation.isPending}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Clone Snapshot
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Snapshot Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Snapshot</DialogTitle>
            <DialogDescription>
              Create a template from your current workspace configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Snapshot Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Real Estate Agency Template"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what's included in this snapshot..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Real Estate, Healthcare, E-commerce"
              />
            </div>
            <div className="space-y-2">
              <Label>Include in Snapshot *</Label>
              <div className="space-y-2 border rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.includes_funnels}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, includes_funnels: checked as boolean })
                    }
                  />
                  <label className="text-sm">Funnels</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.includes_automations}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, includes_automations: checked as boolean })
                    }
                  />
                  <label className="text-sm">Automations</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.includes_templates}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, includes_templates: checked as boolean })
                    }
                  />
                  <label className="text-sm">Email/SMS Templates</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.includes_forms}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, includes_forms: checked as boolean })
                    }
                  />
                  <label className="text-sm">Forms</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.includes_pages}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, includes_pages: checked as boolean })
                    }
                  />
                  <label className="text-sm">Landing Pages</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.includes_workflows}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, includes_workflows: checked as boolean })
                    }
                  />
                  <label className="text-sm">Workflows</label>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={formData.is_public}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_public: checked as boolean })
                }
              />
              <label className="text-sm">Make this snapshot public</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              <Upload className="h-4 w-4 mr-2" />
              Create Snapshot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgencySnapshots;
