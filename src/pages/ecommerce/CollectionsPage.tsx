import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, Plus, Search, Grid, List, Pencil, Trash2, MoreVertical, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import ecommerceApi, { Collection } from '@/services/ecommerceApi';

const CollectionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    sort_order: '0',
    is_active: true,
  });

  // Queries
  const { data: collectionsData, isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const response = await ecommerceApi.getCollections();
      return response.items || [];
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Partial<Collection>) => ecommerceApi.createCollection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Collection created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create collection');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Collection> }) =>
      ecommerceApi.updateCollection(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setIsEditDialogOpen(false);
      setSelectedCollection(null);
      resetForm();
      toast.success('Collection updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update collection');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ecommerceApi.deleteCollection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Collection deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete collection');
    },
  });

  // Handlers
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image_url: '',
      sort_order: '0',
      is_active: true,
    });
  };

  const handleCreate = () => {
    const data: Partial<Collection> = {
      name: formData.name,
      description: formData.description || undefined,
      image_url: formData.image_url || undefined,
      sort_order: parseInt(formData.sort_order) || 0,
      is_active: formData.is_active,
    };
    createMutation.mutate(data);
  };

  const handleUpdate = () => {
    if (!selectedCollection) return;
    const data: Partial<Collection> = {
      name: formData.name,
      description: formData.description || undefined,
      image_url: formData.image_url || undefined,
      sort_order: parseInt(formData.sort_order) || 0,
      is_active: formData.is_active,
    };
    updateMutation.mutate({ id: selectedCollection.id, data });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this collection?')) {
      deleteMutation.mutate(id);
    }
  };

  const openEditDialog = (collection: Collection) => {
    setSelectedCollection(collection);
    setFormData({
      name: collection.name,
      description: collection.description || '',
      image_url: collection.image_url || '',
      sort_order: collection.sort_order.toString(),
      is_active: collection.is_active,
    });
    setIsEditDialogOpen(true);
  };

  // Filtered data
  const filteredCollections = (collectionsData || []).filter((collection) =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collection.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Product Collections</h1>
          <p className="text-muted-foreground">Organize products into categories and seasonal groups.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Collection
          </Button>
        </div>
      </div>

      {/* Search and View Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search collections..."
            className="pl-8 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center border rounded-md p-1">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${viewMode === 'grid' ? 'bg-muted' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${viewMode === 'list' ? 'bg-muted' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Collections Grid/List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading collections...</div>
      ) : filteredCollections.length === 0 && searchQuery === '' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <Card className="border-dashed flex flex-col items-center justify-center p-12 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer group" onClick={() => setIsCreateDialogOpen(true)}>
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <Plus className="h-6 w-6" />
            </div>
            <p className="font-medium text-foreground">Create Collection</p>
            <p className="text-xs text-center mt-1">Group products by type, season, or promotion.</p>
          </Card>
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="text-center py-12">
          <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
          <p className="text-muted-foreground">No collections found matching your search.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredCollections.map((collection) => (
            <Card key={collection.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{collection.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {collection.product_count || 0} products
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(collection)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(collection.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {collection.image_url ? (
                  <div className="aspect-video rounded-md bg-muted mb-3 overflow-hidden">
                    <img
                      src={collection.image_url}
                      alt={collection.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video rounded-md bg-muted mb-3 flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground opacity-20" />
                  </div>
                )}
                {collection.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{collection.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <Badge variant={collection.is_active ? 'default' : 'secondary'}>
                    {collection.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredCollections.map((collection) => (
                <div key={collection.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    {collection.image_url ? (
                      <img
                        src={collection.image_url}
                        alt={collection.name}
                        className="w-16 h-16 rounded-md object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground opacity-20" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium">{collection.name}</h3>
                      <p className="text-sm text-muted-foreground">{collection.description || 'No description'}</p>
                      <p className="text-xs text-muted-foreground mt-1">{collection.product_count || 0} products</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={collection.is_active ? 'default' : 'secondary'}>
                      {collection.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(collection)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(collection.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Collection</DialogTitle>
            <DialogDescription>Group products together for better organization</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Collection Name *</Label>
              <Input
                placeholder="Summer Collection"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Describe this collection..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Make this collection visible</p>
              </div>
              <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name}>
              Create Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
            <DialogDescription>Update collection details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Collection Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">Make this collection visible</p>
              </div>
              <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Collection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollectionsPage;
