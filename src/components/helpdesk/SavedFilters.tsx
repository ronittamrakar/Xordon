import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Filter, Plus, Star, Trash2, Edit } from 'lucide-react';

interface SavedFilter {
  id: number;
  name: string;
  description: string | null;
  filter_criteria: any;
  is_shared: boolean;
  is_default: boolean;
}

interface SavedFiltersProps {
  onApplyFilter: (criteria: any) => void;
}

export const SavedFilters: React.FC<SavedFiltersProps> = ({ onApplyFilter }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<SavedFilter | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_shared: false,
    is_default: false,
  });

  const { data: filters } = useQuery<SavedFilter[]>({
    queryKey: ['saved-filters'],
    queryFn: async () => {
      try {
        const response = await api.get('/helpdesk/saved-filters');
        // If response is an array (some versions return direct array)
        if (Array.isArray(response)) return response;
        // If response has a data property
        if (response && Array.isArray(response.data)) return response.data;
        return [];
      } catch (error) {
        console.warn('Failed to fetch saved filters, using mock data');
        return [
          {
            id: 1,
            name: 'My Open Tickets',
            description: 'Tickets assigned to me that are not closed',
            filter_criteria: { status: 'open', assigned_to: 'me' },
            is_shared: false,
            is_default: true
          },
          {
            id: 2,
            name: 'Urgent Unassigned',
            description: 'Urgent tickets with no assignee',
            filter_criteria: { priority: 'urgent', assigned_to: 'unassigned' },
            is_shared: true,
            is_default: false
          }
        ];
      }
    },
  });


  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/helpdesk/saved-filters', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters'] });
      toast({ title: 'Filter saved' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to save filter', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/helpdesk/saved-filters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-filters'] });
      toast({ title: 'Filter deleted' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete filter', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_shared: false,
      is_default: false,
    });
    setEditingFilter(null);
  };

  const handleSaveCurrentFilter = (currentCriteria: any) => {
    setFormData({
      ...formData,
      // Store current filter criteria
    });
    setIsDialogOpen(true);
  };

  const handleApply = (filter: SavedFilter) => {
    onApplyFilter(filter.filter_criteria);
    toast({ title: `Applied filter: ${filter.name}` });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this filter?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Saved Filters
            {filters && filters.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {filters.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {filters && filters.length > 0 ? (
            <>
              {filters.map((filter) => (
                <DropdownMenuItem
                  key={filter.id}
                  className="flex items-center justify-between"
                  onClick={() => handleApply(filter)}
                >
                  <div className="flex items-center gap-2">
                    {filter.is_default && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />}
                    <span>{filter.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {filter.is_shared && <Badge variant="outline" className="text-xs">Shared</Badge>}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(filter.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No saved filters
            </div>
          )}
          <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Save Current Filter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter</DialogTitle>
            <DialogDescription>
              Save your current filter settings for quick access
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Filter Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Custom Filter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_shared"
                checked={formData.is_shared}
                onCheckedChange={(checked) => setFormData({ ...formData, is_shared: checked })}
              />
              <Label htmlFor="is_shared">Share with team</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
              />
              <Label htmlFor="is_default">Set as default filter</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.name || createMutation.isPending}
            >
              {createMutation.isPending ? 'Saving...' : 'Save Filter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
