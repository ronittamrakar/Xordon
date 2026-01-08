/**
 * Tags Settings Page
 * Manage tags for organizing contacts, opportunities, etc.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit,
  Trash2,
  Tag,
  Loader2,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { customFieldsApi, Tag as TagType } from '@/services/customFieldsApi';
import { useToast } from '@/hooks/use-toast';

const colorOptions = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#ef4444', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#22c55e', label: 'Green' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#64748b', label: 'Slate' },
];

interface TagFormData {
  name: string;
  color: string;
  description: string;
}

const defaultFormData: TagFormData = {
  name: '',
  color: '#6366f1',
  description: '',
};

function TagCard({
  tag,
  onEdit,
  onDelete,
}: {
  tag: TagType;
  onEdit: (tag: TagType) => void;
  onDelete: (tag: TagType) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white border rounded-lg group hover:shadow-sm transition-shadow">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ backgroundColor: tag.color + '20' }}
      >
        <Tag className="w-4 h-4" style={{ color: tag.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            style={{
              backgroundColor: tag.color + '15',
              borderColor: tag.color + '40',
              color: tag.color,
            }}
          >
            {tag.name}
          </Badge>
          {tag.usage_count !== undefined && (
            <span className="text-xs text-gray-400">
              {tag.usage_count} {tag.usage_count === 1 ? 'use' : 'uses'}
            </span>
          )}
        </div>
        {tag.description && (
          <p className="text-xs text-gray-500 mt-1 truncate">{tag.description}</p>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" onClick={() => onEdit(tag)}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-600"
          onClick={() => onDelete(tag)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function TagsSettings() {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [deletingTag, setDeletingTag] = useState<TagType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<TagFormData>(defaultFormData);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tags, isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => customFieldsApi.getTags(),
  });

  const createMutation = useMutation({
    mutationFn: (data: TagFormData) =>
      customFieldsApi.createTag({
        name: data.name,
        color: data.color,
        description: data.description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setIsCreating(false);
      setFormData(defaultFormData);
      toast({ title: 'Tag created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create tag', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TagFormData }) =>
      customFieldsApi.updateTag(id, {
        name: data.name,
        color: data.color,
        description: data.description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setEditingTag(null);
      setFormData(defaultFormData);
      toast({ title: 'Tag updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update tag', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => customFieldsApi.deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setDeletingTag(null);
      toast({ title: 'Tag deleted' });
    },
  });

  const handleEdit = (tag: TagType) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color,
      description: tag.description || '',
    });
  };

  const handleSubmit = () => {
    if (editingTag) {
      updateMutation.mutate({ id: editingTag.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredTags = React.useMemo(() => {
    if (!tags) return [];
    if (!searchQuery) return tags;
    const query = searchQuery.toLowerCase();
    return tags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(query) ||
        tag.description?.toLowerCase().includes(query)
    );
  }, [tags, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tags</h2>
          <p className="text-sm text-gray-500">
            Create tags to organize and categorize your contacts, opportunities, and more
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Tag
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tags..."
          className="pl-9"
        />
      </div>

      {/* Tags list */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : filteredTags.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Tag className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-gray-500">
              {searchQuery ? 'No tags match your search' : 'No tags yet'}
            </p>
            {!searchQuery && (
              <Button variant="outline" className="mt-4" onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create your first tag
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTags.map((tag) => (
            <TagCard
              key={tag.id}
              tag={tag}
              onEdit={handleEdit}
              onDelete={setDeletingTag}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreating || !!editingTag}
        onOpenChange={() => {
          setIsCreating(false);
          setEditingTag(null);
          setFormData(defaultFormData);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTag ? 'Edit Tag' : 'Create Tag'}</DialogTitle>
            <DialogDescription>
              {editingTag ? 'Update the tag settings' : 'Create a new tag to organize your data'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tag Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., VIP, Hot Lead, Follow Up"
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-all',
                      formData.color === color.value
                        ? 'border-gray-900 scale-110'
                        : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setFormData((prev) => ({ ...prev, color: color.value }))}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="What is this tag used for?"
                rows={2}
              />
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <Badge
                  variant="outline"
                  style={{
                    backgroundColor: formData.color + '15',
                    borderColor: formData.color + '40',
                    color: formData.color,
                  }}
                >
                  {formData.name || 'Tag Name'}
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setEditingTag(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingTag ? (
                'Update Tag'
              ) : (
                'Create Tag'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingTag} onOpenChange={() => setDeletingTag(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTag?.name}"? This will remove the tag from
              all items it's applied to. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deletingTag && deleteMutation.mutate(deletingTag.id)}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Tag'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default TagsSettings;
